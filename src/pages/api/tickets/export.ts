export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function toCsvCell(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export const GET: APIRoute = async ({ url, locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  try {
    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    const ticketId = (url.searchParams.get('ticket_id') || '').trim();

    const ticketQuery = ticketId
      ? env.DB.prepare('SELECT * FROM tickets WHERE id = ? ORDER BY created_at DESC').bind(ticketId)
      : env.DB.prepare('SELECT * FROM tickets ORDER BY created_at DESC');

    const eventQuery = ticketId
      ? env.DB.prepare('SELECT * FROM ticket_events WHERE ticket_id = ? ORDER BY created_at DESC').bind(ticketId)
      : env.DB.prepare('SELECT * FROM ticket_events ORDER BY created_at DESC');

    const [ticketResult, eventResult] = await Promise.all([ticketQuery.all(), eventQuery.all()]);
    const tickets = Array.isArray(ticketResult.results) ? ticketResult.results : [];
    const events = Array.isArray(eventResult.results) ? eventResult.results : [];

    if (format === 'csv') {
      const ticketHeader = 'id,type,status,priority,created_at,updated_at,sla_due_at,sla_breached,name,email,message,assigned_to';
      const ticketRows = tickets.map((ticket: any) => [
        ticket.id, ticket.type, ticket.status, ticket.priority, ticket.created_at, ticket.updated_at,
        ticket.sla_due_at, ticket.sla_breached, ticket.name, ticket.email, ticket.message, ticket.assigned_to
      ].map(toCsvCell).join(','));

      const eventHeader = 'id,ticket_id,event_type,old_value,new_value,note,created_at';
      const eventRows = events.map((event: any) => [
        event.id, event.ticket_id, event.event_type, event.old_value, event.new_value, event.note, event.created_at
      ].map(toCsvCell).join(','));

      const csvBody = [
        '# tickets',
        ticketHeader,
        ...ticketRows,
        '',
        '# ticket_events',
        eventHeader,
        ...eventRows
      ].join('\n');

      return new Response(csvBody, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ticket-audit-${ticketId || 'all'}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ tickets, events, exported_at: new Date().toISOString() }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Audit export failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};
