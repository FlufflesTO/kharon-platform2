import type { AstroCookies } from 'astro';
import { getAuthenticatedRole, hasRoleAccess, type InternalRole } from './auth';
import type { Env } from '../types/env';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function requireRoles(cookies: AstroCookies, env: Env, allowedRoles: InternalRole[]): Response | null {
  const role = getAuthenticatedRole(cookies, env);
  if (!role) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }
  if (!hasRoleAccess(role, allowedRoles)) {
    return new Response(JSON.stringify({ error: 'Forbidden', required_roles: allowedRoles, role }), { status: 403, headers: JSON_HEADERS });
  }
  return null;
}

