export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as any).runtime.env.DB;
    const now = new Date().toISOString();

    await db
      .prepare('UPDATE tickets SET sla_breached = 1 WHERE sla_due_at IS NOT NULL AND sla_due_at < ? AND status NOT IN (?, ?)')
      .bind(now, 'resolved', 'cancelled')
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to refresh SLA breaches',
      details: String(err)
    }), {
      status: 500
    });
  }
};
