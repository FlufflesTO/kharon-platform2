export const prerender = false;

import type { APIRoute } from 'astro';
import { requireRoles } from '../../../lib/authorization';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const GET: APIRoute = async ({ locals, cookies }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;

  const authError = requireRoles(cookies, env, ['administrator', 'manager', 'finance']);
  if (authError) return authError;

  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const nowIso = now.toISOString();

    const [allCount, breachCount, overdueOpenCount, statusRows, created24hRows, resolved24hRows] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS total FROM tickets').first<{ total?: number | string }>(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM tickets WHERE sla_breached = 1').first<{ total?: number | string }>(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM tickets WHERE status NOT IN (?, ?) AND sla_due_at IS NOT NULL AND sla_due_at < ?')
        .bind('resolved', 'cancelled', nowIso)
        .first<{ total?: number | string }>(),
      env.DB.prepare('SELECT status, COUNT(*) AS total FROM tickets GROUP BY status').all(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM tickets WHERE created_at >= ?').bind(last24h).first<{ total?: number | string }>(),
      env.DB.prepare('SELECT COUNT(*) AS total FROM tickets WHERE status = ? AND updated_at >= ?').bind('resolved', last24h).first<{ total?: number | string }>()
    ]);

    const byStatus: Record<string, number> = {};
    const statusResults = Array.isArray(statusRows.results) ? statusRows.results : [];
    for (const row of statusResults as Array<{ status?: string; total?: number | string }>) {
      byStatus[String(row.status || 'unknown')] = Number(row.total || 0);
    }

    return new Response(JSON.stringify({
      checked_at: nowIso,
      totals: {
        all: Number(allCount?.total || 0),
        breached: Number(breachCount?.total || 0),
        overdue_open: Number(overdueOpenCount?.total || 0),
        created_last_24h: Number(created24hRows?.total || 0),
        resolved_last_24h: Number(resolved24hRows?.total || 0)
      },
      by_status: byStatus
    }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to compute SLA metrics', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};


