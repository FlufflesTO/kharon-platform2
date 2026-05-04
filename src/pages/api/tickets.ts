export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../lib/auth';
import type { Env } from '../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const { results } = await env.DB
      .prepare('SELECT * FROM tickets ORDER BY created_at DESC')
      .all();

    return new Response(JSON.stringify(results), { status: 200, headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'DB fetch failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};
