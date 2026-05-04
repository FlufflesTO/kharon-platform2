export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const now = new Date().toISOString();

    await env.DB
      .prepare('UPDATE tickets SET sla_breached = 1 WHERE sla_due_at IS NOT NULL AND sla_due_at < ? AND status NOT IN (?, ?)')
      .bind(now, 'resolved', 'cancelled')
      .run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to refresh SLA breaches', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};
