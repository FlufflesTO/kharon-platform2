import { describe, expect, it } from 'vitest';
import { GET as ticketsGet } from '../src/pages/api/tickets';
import { GET as ticketEventsGet } from '../src/pages/api/tickets/events';
import { POST as ticketUpdatePost } from '../src/pages/api/tickets/update';
import { GET as ticketExportGet } from '../src/pages/api/tickets/export';

function cookies(seed: Record<string, string> = {}) {
  return {
    values: { ...seed },
    get(key: string) {
      const value = this.values[key];
      return value ? { value } : undefined;
    }
  };
}

describe('api smoke', () => {
  it('rejects unauthenticated tickets listing', async () => {
    const res = await ticketsGet({
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: {} } } },
      cookies: cookies()
    } as any);
    expect(res.status).toBe(401);
  });

  it('validates required ticket_id for events', async () => {
    const res = await ticketEventsGet({
      url: new URL('http://localhost/api/tickets/events'),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: {} } } },
      cookies: cookies({ kharon_internal_auth: 'token' })
    } as any);
    expect(res.status).toBe(400);
  });

  it('validates required fields for update payload', async () => {
    const res = await ticketUpdatePost({
      request: new Request('http://localhost/api/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: {} } } },
      cookies: cookies({ kharon_internal_auth: 'token' })
    } as any);
    expect(res.status).toBe(400);
  });

  it('rejects unauthenticated audit export', async () => {
    const res = await ticketExportGet({
      url: new URL('http://localhost/api/tickets/export?format=json'),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: {} } } },
      cookies: cookies()
    } as any);
    expect(res.status).toBe(401);
  });
});
