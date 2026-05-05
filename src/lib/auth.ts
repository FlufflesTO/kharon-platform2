import type { AstroCookies } from 'astro';
import type { Env } from '../types/env';

export type InternalRole = 'administrator' | 'manager' | 'technician' | 'finance' | 'client';

const ALL_ROLES: InternalRole[] = ['administrator', 'manager', 'technician', 'finance', 'client'];

export function getRoleTokenMap(env: Env): Record<InternalRole, string> {
  return {
    administrator: env.INTERNAL_ACCESS_TOKEN_ADMINISTRATOR || env.INTERNAL_ACCESS_TOKEN || '',
    manager: env.INTERNAL_ACCESS_TOKEN_MANAGER || '',
    technician: env.INTERNAL_ACCESS_TOKEN_TECHNICIAN || '',
    finance: env.INTERNAL_ACCESS_TOKEN_FINANCE || '',
    client: env.INTERNAL_ACCESS_TOKEN_CLIENT || ''
  };
}

export function getRoleByToken(token: string, env: Env): InternalRole | null {
  const value = token.trim();
  if (!value) return null;
  const roleMap = getRoleTokenMap(env);
  for (const role of ALL_ROLES) {
    if (roleMap[role] && roleMap[role] === value) return role;
  }
  return null;
}

export function isAuthenticated(cookies: AstroCookies, env: Env): boolean {
  const token = cookies.get('kharon_internal_auth')?.value || '';
  return getRoleByToken(token, env) !== null;
}

export function getAuthenticatedRole(cookies: AstroCookies, env: Env): InternalRole | null {
  const token = cookies.get('kharon_internal_auth')?.value || '';
  return getRoleByToken(token, env);
}

export function hasRoleAccess(role: InternalRole | null, allowedRoles: InternalRole[]): boolean {
  return !!role && allowedRoles.includes(role);
}
