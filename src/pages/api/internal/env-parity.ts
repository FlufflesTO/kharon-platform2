export const prerender = false;

import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../../lib/auth';
import type { Env } from '../../../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

type Requirement = {
  key: 'DB' | 'INTERNAL_ACCESS_TOKEN' | 'RESEND_API_KEY' | 'EMAIL_FROM';
  required: boolean;
  present: boolean;
};

export const GET: APIRoute = async ({ locals, cookies }) => {
  const env = (locals as any).runtime.env as Env;

  if (!isAuthenticated(cookies, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const requirements: Requirement[] = [
    { key: 'DB', required: true, present: !!env.DB },
    { key: 'INTERNAL_ACCESS_TOKEN', required: true, present: !!(env.INTERNAL_ACCESS_TOKEN && env.INTERNAL_ACCESS_TOKEN.trim()) },
    { key: 'RESEND_API_KEY', required: false, present: !!(env.RESEND_API_KEY && env.RESEND_API_KEY.trim()) },
    { key: 'EMAIL_FROM', required: false, present: !!(env.EMAIL_FROM && env.EMAIL_FROM.trim()) }
  ];

  const missingRequired = requirements.filter((item) => item.required && !item.present).map((item) => item.key);
  const missingOptional = requirements.filter((item) => !item.required && !item.present).map((item) => item.key);

  return new Response(JSON.stringify({
    ready: missingRequired.length === 0,
    missing_required: missingRequired,
    missing_optional: missingOptional,
    requirements,
    checked_at: new Date().toISOString()
  }), { status: 200, headers: JSON_HEADERS });
};
