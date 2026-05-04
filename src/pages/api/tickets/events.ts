export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const ticketId = url.searchParams.get('ticket_id') || '';

    if (!ticketId) {
      return new Response(JSON.stringify({ error: 'Missing ticket_id' }), {
        status: 400
      });
    }

    const db = (locals as any).runtime.env.DB;

    const { results } = await db
      .prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at DESC')
      .bind(ticketId)
      .all();

    return new Response(JSON.stringify(results), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch ticket events',
      details: String(err)
    }), {
      status: 500
    });
  }
};
