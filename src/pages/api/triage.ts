export const prerender = false;

import type { APIRoute } from 'astro';

function getSlaHours(type: string, priority: string): number {
  if (type === 'emergency') return 2;
  if (priority === 'critical') return 4;
  if (priority === 'high') return 8;
  if (priority === 'normal') return 24;
  return 48;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();

  const id = crypto.randomUUID();
  const now = new Date();
  const createdAt = now.toISOString();

  const type = String(body.type || 'general');
  const priority = String(body.priority || (type === 'emergency' ? 'critical' : 'normal'));
  const slaHours = getSlaHours(type, priority);
  const slaDueAt = new Date(now.getTime() + slaHours * 60 * 60 * 1000).toISOString();

  const ticket = {
    id,
    type,
    status: 'open',
    priority,
    created_at: createdAt,
    updated_at: createdAt,
    sla_due_at: slaDueAt,
    sla_breached: 0,
    name: String(body.name || ''),
    email: String(body.email || ''),
    message: String(body.message || ''),
    assigned_to: ''
  };

  try {
    const db = (locals as any).runtime.env.DB;

    await db
      .prepare('INSERT INTO tickets (id, type, status, priority, created_at, updated_at, sla_due_at, sla_breached, name, email, message, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        ticket.id,
        ticket.type,
        ticket.status,
        ticket.priority,
        ticket.created_at,
        ticket.updated_at,
        ticket.sla_due_at,
        ticket.sla_breached,
        ticket.name,
        ticket.email,
        ticket.message,
        ticket.assigned_to
      )
      .run();

    return new Response(JSON.stringify({ success: true, id: id, sla_due_at: slaDueAt }), {
      status: 200
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'DB insert failed',
      details: String(err)
    }), {
      status: 500
    });
  }
};
