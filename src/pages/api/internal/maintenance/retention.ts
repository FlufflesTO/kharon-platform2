export const prerender = false;

import type { APIRoute } from 'astro';
import { requireRoles } from '../../../../lib/authorization';
import type { Env } from '../../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const AUTH_ATTEMPTS_RETENTION_DAYS = 30;
const EXPORT_AUDIT_RETENTION_DAYS = 180;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const POST: APIRoute = async ({ locals, cookies }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;

  const authError = requireRoles(cookies, env, ['administrator']);
  if (authError) return authError;

  try {
    const authCutoff = isoDaysAgo(AUTH_ATTEMPTS_RETENTION_DAYS);
    const exportCutoff = isoDaysAgo(EXPORT_AUDIT_RETENTION_DAYS);

    const [authDelete, exportDelete] = await Promise.all([
      env.DB.prepare('DELETE FROM auth_attempts WHERE attempted_at < ?').bind(authCutoff).run(),
      env.DB.prepare('DELETE FROM export_audit_log WHERE requested_at < ?').bind(exportCutoff).run()
    ]);

    const authRemoved = Number((authDelete as any)?.meta?.changes || 0);
    const exportRemoved = Number((exportDelete as any)?.meta?.changes || 0);

    return new Response(JSON.stringify({
      success: true,
      ran_at: new Date().toISOString(),
      retention_days: {
        auth_attempts: AUTH_ATTEMPTS_RETENTION_DAYS,
        export_audit_log: EXPORT_AUDIT_RETENTION_DAYS
      },
      removed: {
        auth_attempts: authRemoved,
        export_audit_log: exportRemoved
      }
    }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Retention maintenance failed', details: String(err) }), { status: 500, headers: JSON_HEADERS });
  }
};


