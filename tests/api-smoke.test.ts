import { describe, expect, it } from 'vitest';
import { GET as ticketsGet } from '../src/pages/api/tickets';
import { GET as ticketEventsGet } from '../src/pages/api/tickets/events';
import { POST as ticketUpdatePost } from '../src/pages/api/tickets/update';
import { GET as ticketExportGet } from '../src/pages/api/tickets/export';
import { GET as envParityGet } from '../src/pages/api/internal/env-parity';

function cookies(seed: Record<string, string> = {}) {
  return {
    values: { ...seed },
    get(key: string) {
      const value = this.values[key];
      return value ? { value } : undefined;
    }
  };
}

function envBase() {
  return {
    INTERNAL_ACCESS_TOKEN_ADMINISTRATOR: 'administrator-token',
    INTERNAL_ACCESS_TOKEN_MANAGER: 'manager-token',
    INTERNAL_ACCESS_TOKEN_TECHNICIAN: 'tech-token',
    INTERNAL_ACCESS_TOKEN_FINANCE: 'finance-token',
    DB: {}
  };
}

describe('api smoke', () => {
  it('rejects unauthenticated tickets listing', async () => {
    const res = await ticketsGet({
      locals: { runtime: { env: envBase() } },
      cookies: cookies()
    } as any);
    expect(res.status).toBe(401);
  });

  it('validates required ticket_id for events', async () => {
    const res = await ticketEventsGet({
      url: new URL('http://localhost/api/tickets/events'),
      locals: { runtime: { env: envBase() } },
      cookies: cookies({ kharon_internal_auth: 'tech-token' })
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
      locals: { runtime: { env: envBase() } },
      cookies: cookies({ kharon_internal_auth: 'tech-token' })
    } as any);
    expect(res.status).toBe(400);
  });

  it('rejects technician audit export with 403', async () => {
    const res = await ticketExportGet({
      request: new Request('http://localhost/api/tickets/export?format=json', { method: 'GET' }),
      url: new URL('http://localhost/api/tickets/export?format=json'),
      locals: { runtime: { env: envBase() } },
      cookies: cookies({ kharon_internal_auth: 'tech-token' })
    } as any);
    expect(res.status).toBe(403);
  });

  it('allows finance env parity check', async () => {
    const res = await envParityGet({
      locals: { runtime: { env: envBase() } },
      cookies: cookies({ kharon_internal_auth: 'finance-token' })
    } as any);
    expect(res.status).toBe(200);
  });
});

