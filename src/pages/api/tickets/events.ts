export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ url, locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const ticketId = url.searchParams.get('ticket_id') || '';

    if (!ticketId) {
      return new Response(JSON.stringify({ error: 'Missing ticket_id' }), { status: 400, headers: JSON_HEADERS });
    }

    const { results } = await env.DB
      .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at DESC')
      .bind(ticketId)
      .all();

    return new Response(JSON.stringify(results), { status: 200, headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch ticket events', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};
