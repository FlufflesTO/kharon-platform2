import type { D1Database } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  INTERNAL_ACCESS_TOKEN?: string;
}
