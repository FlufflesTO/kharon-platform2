export const prerender = false;

import type { APIRoute } from 'astro';
import { requireRoles } from '../../../../lib/authorization';
import type { Env } from '../../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function toCsvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function getPreviousMonthRange(): { from: string; to: string; label: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  const label = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`;
  return { from: start.toISOString(), to: end.toISOString(), label };
}

export const POST: APIRoute = async ({ locals, cookies }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;
  const authError = requireRoles(cookies, env, ['administrator', 'finance']);
  if (authError) return authError;

  if (!env.ARCHIVE_BUCKET) {
    return new Response(JSON.stringify({ error: 'ARCHIVE_BUCKET not configured' }), { status: 500, headers: JSON_HEADERS });
  }

  try {
    const range = getPreviousMonthRange();
    const [ticketResult, eventResult] = await Promise.all([
      env.DB.prepare('SELECT * FROM tickets WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC').bind(range.from, range.to).all(),
      env.DB.prepare('SELECT * FROM ticket_events WHERE created_at >= ? AND created_at <= ? ORDER BY created_at ASC').bind(range.from, range.to).all()
    ]);
    const tickets = Array.isArray(ticketResult.results) ? ticketResult.results : [];
    const events = Array.isArray(eventResult.results) ? eventResult.results : [];

    const ticketHeader = 'id,type,status,priority,created_at,updated_at,sla_due_at,sla_breached,name,email,message,assigned_to';
    const ticketRows = tickets.map((ticket: any) => [
      ticket.id, ticket.type, ticket.status, ticket.priority, ticket.created_at, ticket.updated_at,
      ticket.sla_due_at, ticket.sla_breached, ticket.name, ticket.email, ticket.message, ticket.assigned_to
    ].map(toCsvCell).join(','));

    const eventHeader = 'id,ticket_id,event_type,old_value,new_value,note,created_at';
    const eventRows = events.map((event: any) => [
      event.id, event.ticket_id, event.event_type, event.old_value, event.new_value, event.note, event.created_at
    ].map(toCsvCell).join(','));

    const csvBody = ['# tickets', ticketHeader, ...ticketRows, '', '# ticket_events', eventHeader, ...eventRows].join('\n');
    const archiveKey = `monthly/${range.label}/ticket-archive-${range.label}.csv`;
    await env.ARCHIVE_BUCKET.put(archiveKey, csvBody, {
      httpMetadata: { contentType: 'text/csv; charset=utf-8' },
      customMetadata: {
        from: range.from,
        to: range.to,
        generated_at: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      archive_key: archiveKey,
      range,
      counts: { tickets: tickets.length, events: events.length }
    }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Monthly archive failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};


