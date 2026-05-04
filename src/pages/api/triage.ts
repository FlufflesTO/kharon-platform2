export const prerender = false;

import type { APIRoute } from 'astro';
import { sendInternalTicketEmail, sendClientConfirmation } from '../../lib/email';
import type { Env } from '../../types/env';

function getSlaHours(type: string, priority: string): number {
  if (type === 'emergency') return 2;
  if (priority === 'critical') return 4;
  if (priority === 'high') return 8;
  if (priority === 'normal') return 24;
  return 48;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as any).runtime.env as Env;
  const body = await request.json();

  const id = crypto.randomUUID();
  const now = new Date();
  const createdAt = now.toISOString();

  const type = String(body.type || 'general');
  const priority = String(body.priority || 'normal');
  const slaHours = getSlaHours(type, priority);
  const slaDueAt = new Date(now.getTime() + slaHours * 3600000).toISOString();

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
    await env.DB
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

    // send emails (non-blocking intent)
    sendInternalTicketEmail(env, ticket);
    sendClientConfirmation(env, ticket);

    return new Response(JSON.stringify({
      success: true,
      id: ticket.id,
      sla_due_at: ticket.sla_due_at
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Ticket creation failed',
      details: String(err)
    }), { status: 500 });
  }
};
