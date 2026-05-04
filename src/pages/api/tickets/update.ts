export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const allowedTransitions: Record<string, string[]> = {
  open: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['resolved'],
  resolved: [],
  cancelled: []
};

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const body = await request.json();

    const id = String(body.id || '');
    const nextStatus = String(body.status || '');
    const assignedTo = String(body.assigned_to || '');
    const note = String(body.note || '');

    if (!id || !nextStatus) {
      return new Response(JSON.stringify({ error: 'Missing ticket id or status' }), { status: 400, headers: JSON_HEADERS });
    }

    const existing = await env.DB
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }), { status: 404, headers: JSON_HEADERS });
    }

    const currentStatus = String(existing.status || 'open');
    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      return new Response(JSON.stringify({ error: 'Invalid SLA transition', from: currentStatus, to: nextStatus }), { status: 400, headers: JSON_HEADERS });
    }

    if (nextStatus === 'assigned' && !assignedTo) {
      return new Response(JSON.stringify({ error: 'Assigned technician is required before moving to assigned' }), { status: 400, headers: JSON_HEADERS });
    }

    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();

    await env.DB
      .prepare('UPDATE tickets SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ?')
      .bind(nextStatus, assignedTo || existing.assigned_to || '', now, id)
      .run();

    await env.DB
      .prepare('INSERT INTO ticket_events (id, ticket_id, event_type, old_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(eventId, id, 'status_change', currentStatus, nextStatus, note, now)
      .run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: JSON_HEADERS });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'SLA update failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};
