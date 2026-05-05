import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ARCHIVE_BUCKET?: R2Bucket;
  INTERNAL_ACCESS_TOKEN?: string;
  INTERNAL_ACCESS_TOKEN_ADMINISTRATOR?: string;
  INTERNAL_ACCESS_TOKEN_MANAGER?: string;
  INTERNAL_ACCESS_TOKEN_TECHNICIAN?: string;
  INTERNAL_ACCESS_TOKEN_FINANCE?: string;
  INTERNAL_ACCESS_TOKEN_CLIENT?: string;
}
