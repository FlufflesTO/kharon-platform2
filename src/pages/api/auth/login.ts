export const prerender = false;

import type { APIRoute } from 'astro';
import { getRoleByToken } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

async function getAttemptCount(env: Env, ip: string, sinceIso: string): Promise<number> {
  try {
    const row = await env.DB
      .prepare('SELECT COUNT(*) AS total FROM auth_attempts WHERE ip = ? AND attempted_at >= ?')
      .bind(ip, sinceIso)
      .first<{ total?: number | string }>();
    return Number(row?.total || 0);
  } catch {
    return 0;
  }
}

async function logFailedAttempt(env: Env, ip: string, attemptedAt: string): Promise<void> {
  try {
    await env.DB
      .prepare('INSERT INTO auth_attempts (id, ip, attempted_at, success) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), ip, attemptedAt, 0)
      .run();
  } catch {
    // Graceful: table may not exist yet if migration is pending.
  }
}

async function clearAttempts(env: Env, ip: string): Promise<void> {
  try {
    await env.DB
      .prepare('DELETE FROM auth_attempts WHERE ip = ?')
      .bind(ip)
      .run();
  } catch {
    // Graceful: table may not exist yet if migration is pending.
  }
}

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;
  const form = await request.formData();
  const token = String(form.get('token') || '');
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
  const nowIso = new Date().toISOString();
  const windowStartIso = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const attemptCount = await getAttemptCount(env, ip, windowStartIso);
  if (attemptCount >= MAX_FAILED_ATTEMPTS) {
    return new Response('Too many failed attempts. Try again later.', { status: 429 });
  }

  const role = getRoleByToken(token, env);
  if (!role) {
    await logFailedAttempt(env, ip, nowIso);
    return new Response('Unauthorized', { status: 401 });
  }

  await clearAttempts(env, ip);

  cookies.set('kharon_internal_auth', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 12
  });
  cookies.set('kharon_internal_role', role, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 12
  });

  return redirect('/internal');
};

