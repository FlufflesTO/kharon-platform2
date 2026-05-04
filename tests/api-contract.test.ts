import { describe, expect, it } from 'vitest';
import { POST as loginPost } from '../src/pages/api/auth/login';
import { POST as updatePost } from '../src/pages/api/tickets/update';
import { GET as exportGet } from '../src/pages/api/tickets/export';
import { GET as envParityGet } from '../src/pages/api/internal/env-parity';

type CookieStore = {
  values: Record<string, string>;
  setCalls: Array<{ key: string; value: string; opts?: Record<string, unknown> }>;
  get: (key: string) => { value: string } | undefined;
  set: (key: string, value: string, opts?: Record<string, unknown>) => void;
};

function createCookies(seed: Record<string, string> = {}): CookieStore {
  return {
    values: { ...seed },
    setCalls: [],
    get(key: string) {
      const value = this.values[key];
      return value ? { value } : undefined;
    },
    set(key: string, value: string, opts?: Record<string, unknown>) {
      this.values[key] = value;
      this.setCalls.push({ key, value, opts });
    }
  };
}

function createDb(firstRow: any = null, allRows: any[] = []) {
  const updateRuns: any[] = [];
  const insertRuns: any[] = [];

  const db = {
    prepare(sql: string) {
      const state = { sql, args: [] as any[] };
      return {
        bind(...args: any[]) {
          state.args = args;
          return this;
        },
        async first() {
          return firstRow;
        },
        async all() {
          return { results: allRows };
        },
        async run() {
          if (sql.startsWith('UPDATE tickets')) updateRuns.push(state.args);
          if (sql.startsWith('INSERT INTO ticket_events')) insertRuns.push(state.args);
          return {};
        }
      };
    }
  };

  return { db, updateRuns, insertRuns };
}

function redirect(path: string) {
  return new Response(null, { status: 302, headers: { location: path } });
}

describe('api/auth/login', () => {
  it('returns 401 when token is missing or invalid', async () => {
    const cookies = createCookies();
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ token: 'bad-token' })
    });

    const res = await loginPost({
      request,
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'expected-token' } } },
      cookies,
      redirect
    } as any);

    expect(res.status).toBe(401);
    expect(cookies.setCalls.length).toBe(0);
  });

  it('sets auth cookie and redirects when token matches', async () => {
    const cookies = createCookies();
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: new URLSearchParams({ token: 'expected-token' })
    });

    const res = await loginPost({
      request,
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'expected-token' } } },
      cookies,
      redirect
    } as any);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/internal');
    expect(cookies.setCalls.length).toBe(1);
    expect(cookies.setCalls[0].key).toBe('kharon_internal_auth');
  });
});

describe('api/tickets/update', () => {
  it('returns 401 when unauthenticated', async () => {
    const cookies = createCookies();
    const { db } = createDb();

    const res = await updatePost({
      request: new Request('http://localhost/api/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', status: 'assigned', assigned_to: 'Tech' })
      }),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: db } } },
      cookies
    } as any);

    expect(res.status).toBe(401);
  });

  it('rejects invalid transition', async () => {
    const cookies = createCookies({ kharon_internal_auth: 'token' });
    const { db } = createDb({ id: '1', status: 'open', assigned_to: '' });

    const res = await updatePost({
      request: new Request('http://localhost/api/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', status: 'resolved' })
      }),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: db } } },
      cookies
    } as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid SLA transition');
  });

  it('requires assigned technician for assigned status', async () => {
    const cookies = createCookies({ kharon_internal_auth: 'token' });
    const { db } = createDb({ id: '1', status: 'open', assigned_to: '' });

    const res = await updatePost({
      request: new Request('http://localhost/api/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', status: 'assigned' })
      }),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: db } } },
      cookies
    } as any);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Assigned technician');
  });

  it('updates ticket and inserts event on valid transition', async () => {
    const cookies = createCookies({ kharon_internal_auth: 'token' });
    const { db, updateRuns, insertRuns } = createDb({ id: '1', status: 'open', assigned_to: '' });

    const res = await updatePost({
      request: new Request('http://localhost/api/tickets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', status: 'assigned', assigned_to: 'Tech A' })
      }),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: db } } },
      cookies
    } as any);

    expect(res.status).toBe(200);
    expect(updateRuns.length).toBe(1);
    expect(insertRuns.length).toBe(1);
  });
});

describe('api/tickets/export', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await exportGet({
      url: new URL('http://localhost/api/tickets/export'),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: createDb().db } } },
      cookies: createCookies()
    } as any);

    expect(res.status).toBe(401);
  });

  it('returns export payload when authenticated', async () => {
    const mockRows = [{ id: 't1', status: 'open' }];
    const { db } = createDb(null, mockRows);
    const res = await exportGet({
      url: new URL('http://localhost/api/tickets/export?format=json'),
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: db } } },
      cookies: createCookies({ kharon_internal_auth: 'token' })
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.tickets)).toBe(true);
    expect(Array.isArray(body.events)).toBe(true);
  });
});

describe('api/internal/env-parity', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await envParityGet({
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: createDb().db } } },
      cookies: createCookies()
    } as any);

    expect(res.status).toBe(401);
  });

  it('reports readiness and missing keys', async () => {
    const res = await envParityGet({
      locals: { runtime: { env: { INTERNAL_ACCESS_TOKEN: 'token', DB: createDb().db } } },
      cookies: createCookies({ kharon_internal_auth: 'token' })
    } as any);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ready).toBe(true);
    expect(Array.isArray(body.missing_optional)).toBe(true);
  });
});
