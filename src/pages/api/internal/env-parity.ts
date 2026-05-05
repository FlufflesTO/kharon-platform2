export const prerender = false;

import type { APIRoute } from 'astro';
import { getRoleTokenMap } from '../../../lib/auth';
import { requireRoles } from '../../../lib/authorization';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

type Requirement = {
  key: 'DB' | 'INTERNAL_ACCESS_TOKEN_ADMINISTRATOR' | 'INTERNAL_ACCESS_TOKEN_MANAGER' | 'INTERNAL_ACCESS_TOKEN_TECHNICIAN' | 'INTERNAL_ACCESS_TOKEN_FINANCE' | 'INTERNAL_ACCESS_TOKEN_CLIENT' | 'RESEND_API_KEY' | 'EMAIL_FROM';
  required: boolean;
  present: boolean;
};

export const GET: APIRoute = async ({ locals, cookies }) => {
  const env = ((locals as any).runtime?.env ?? {}) as Env;

  const authError = requireRoles(cookies, env, ['administrator', 'manager', 'finance']);
  if (authError) return authError;

  const roleTokens = getRoleTokenMap(env);
  const hasLegacyToken = !!(env.INTERNAL_ACCESS_TOKEN && env.INTERNAL_ACCESS_TOKEN.trim());

  const requirements: Requirement[] = [
    { key: 'DB', required: true, present: !!env.DB },
    { key: 'INTERNAL_ACCESS_TOKEN_ADMINISTRATOR', required: true, present: !!roleTokens.administrator },
    { key: 'INTERNAL_ACCESS_TOKEN_MANAGER', required: false, present: !!roleTokens.manager },
    { key: 'INTERNAL_ACCESS_TOKEN_TECHNICIAN', required: false, present: !!roleTokens.technician },
    { key: 'INTERNAL_ACCESS_TOKEN_FINANCE', required: false, present: !!roleTokens.finance },
    { key: 'INTERNAL_ACCESS_TOKEN_CLIENT', required: false, present: !!roleTokens.client },
    { key: 'RESEND_API_KEY', required: false, present: !!(env.RESEND_API_KEY && env.RESEND_API_KEY.trim()) },
    { key: 'EMAIL_FROM', required: false, present: !!(env.EMAIL_FROM && env.EMAIL_FROM.trim()) }
  ];

  const missingRequired = requirements.filter((item) => item.required && !item.present).map((item) => item.key);
  const missingOptional = requirements.filter((item) => !item.required && !item.present).map((item) => item.key);

  return new Response(JSON.stringify({
    ready: missingRequired.length === 0,
    missing_required: missingRequired,
    missing_optional: missingOptional,
    auth_mode: hasLegacyToken && !env.INTERNAL_ACCESS_TOKEN_ADMINISTRATOR ? 'legacy_shared_admin_token' : 'role_token_map',
    requirements,
    checked_at: new Date().toISOString()
  }), { status: 200, headers: JSON_HEADERS });
};


