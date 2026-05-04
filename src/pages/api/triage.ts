export const prerender = false;

import type { APIRoute } from 'astro';
import { sendTicketCreatedEmail } from '../../lib/email';

function getSlaHours(type: string): number {
  if (type === 'emergency') return 2;
  if (type === 'quote') return 48;
  return 48;
}

function getPriority(type: string): string {
  if (type === 'emergency') return 'critical';
  if (type === 'maintenance') return 'normal';
  return 'normal';
}

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();

  // Honeypot check — bots fill hidden fields
  if (form.get('company')) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  const type = String(form.get('intakeType') || 'general');
  const name = String(form.get('name') || '');
  const email = String(form.get('email') || '');
  const message = String(form.get('message') || '');

  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date();
  const createdAt = now.toISOString();
  const priority = getPriority(type);
  const slaHours = getSlaHours(type);
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
    name,
    email,
    message,
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

    await db
      .prepare('INSERT INTO ticket_events (id, ticket_id, event_type, old_value, new_value, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(
        crypto.randomUUID(),
        id,
        'ticket_created',
        null,
        'open',
        `Intake type: ${type}`,
        createdAt
      )
      .run();

    await sendTicketCreatedEmail((locals as any).runtime.env, ticket);

    return new Response(JSON.stringify({ success: true, id, sla_due_at: slaDueAt }), {
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
