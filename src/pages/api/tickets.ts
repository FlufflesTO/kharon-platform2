export const prerender = false;

import type { APIRoute } from 'astro';
import { requireRoles } from '../../lib/authorization';
import type { Env } from '../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ALLOWED_STATUS = new Set(['open', 'assigned', 'in_progress', 'resolved', 'cancelled']);

export const GET: APIRoute = async ({ locals, cookies, url }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;

  const authError = requireRoles(cookies, env, ['administrator', 'manager', 'technician', 'finance', 'client']);
  if (authError) return authError;

  try {
    const rawStatus = (url.searchParams.get('status') || 'all').toLowerCase();
    const status = rawStatus === 'all' ? '' : rawStatus;
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('page_size') || '10') || 10));

    if (status && !ALLOWED_STATUS.has(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status filter' }), { status: 400, headers: JSON_HEADERS });
    }

    const where: string[] = [];
    const binds: unknown[] = [];

    if (status) {
      where.push('status = ?');
      binds.push(status);
    }

    if (q) {
      where.push('(LOWER(id) LIKE ? OR LOWER(type) LIKE ? OR LOWER(priority) LIKE ? OR LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(message) LIKE ? OR LOWER(assigned_to) LIKE ?)');
      const term = `%${q}%`;
      for (let i = 0; i < 7; i += 1) binds.push(term);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countStmt = env.DB.prepare(`SELECT COUNT(*) AS total FROM tickets ${whereClause}`).bind(...binds);
    const countResult = await countStmt.first<{ total?: number | string }>();
    const total = Number(countResult?.total || 0);

    const offset = (page - 1) * pageSize;
    const ticketsStmt = env.DB
      .prepare(`SELECT * FROM tickets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...binds, pageSize, offset);
    const { results } = await ticketsStmt.all();

    return new Response(JSON.stringify({
      data: Array.isArray(results) ? results : [],
      meta: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.max(1, Math.ceil(total / pageSize))
      }
    }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'DB fetch failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};


