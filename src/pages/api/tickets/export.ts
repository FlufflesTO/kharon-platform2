export const prerender = false;

import type { APIRoute } from 'astro';
import { requireRoles } from '../../../lib/authorization';
import { toCsvCell } from '../../../lib/csv';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ALLOWED_STATUS = new Set(['open', 'assigned', 'in_progress', 'resolved', 'cancelled']);

function parseDateParam(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export const GET: APIRoute = async ({ url, locals, cookies, request }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;

  const authError = requireRoles(cookies, env, ['administrator', 'manager', 'finance']);
  if (authError) return authError;

  try {
    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    const ticketId = (url.searchParams.get('ticket_id') || '').trim();
    const status = (url.searchParams.get('status') || '').trim().toLowerCase();
    const from = parseDateParam((url.searchParams.get('from') || '').trim());
    const to = parseDateParam((url.searchParams.get('to') || '').trim());

    if (status && !ALLOWED_STATUS.has(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status filter' }), { status: 400, headers: JSON_HEADERS });
    }

    const ticketWhere: string[] = [];
    const ticketBinds: unknown[] = [];
    const eventWhere: string[] = [];
    const eventBinds: unknown[] = [];

    if (ticketId) {
      ticketWhere.push('id = ?');
      ticketBinds.push(ticketId);
      eventWhere.push('ticket_id = ?');
      eventBinds.push(ticketId);
    }
    if (status) {
      ticketWhere.push('status = ?');
      ticketBinds.push(status);
    }
    if (from) {
      ticketWhere.push('created_at >= ?');
      ticketBinds.push(from);
      eventWhere.push('created_at >= ?');
      eventBinds.push(from);
    }
    if (to) {
      ticketWhere.push('created_at <= ?');
      ticketBinds.push(to);
      eventWhere.push('created_at <= ?');
      eventBinds.push(to);
    }

    const ticketWhereClause = ticketWhere.length ? `WHERE ${ticketWhere.join(' AND ')}` : '';
    const eventWhereClause = eventWhere.length ? `WHERE ${eventWhere.join(' AND ')}` : '';

    const ticketQuery = env.DB.prepare(`SELECT * FROM tickets ${ticketWhereClause} ORDER BY created_at DESC`).bind(...ticketBinds);
    const eventQuery = env.DB.prepare(`SELECT * FROM ticket_events ${eventWhereClause} ORDER BY created_at DESC`).bind(...eventBinds);
    const [ticketResult, eventResult] = await Promise.all([ticketQuery.all(), eventQuery.all()]);
    const tickets = Array.isArray(ticketResult.results) ? ticketResult.results : [];
    const events = Array.isArray(eventResult.results) ? eventResult.results : [];

    const exportId = crypto.randomUUID();
    const exportAt = new Date().toISOString();
    const requesterIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const filterSummary = JSON.stringify({ ticket_id: ticketId || null, status: status || null, from: from || null, to: to || null, format });

    await env.DB
      .prepare('INSERT INTO export_audit_log (id, requested_at, requester_ip, format, filters, tickets_count, events_count) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(exportId, exportAt, requesterIp, format, filterSummary, tickets.length, events.length)
      .run();

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
          'Content-Disposition': `attachment; filename="ticket-audit-${ticketId || status || 'all'}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ tickets, events, exported_at: exportAt, export_id: exportId }), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Audit export failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};


