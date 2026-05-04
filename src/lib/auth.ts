import type { AstroCookies } from 'astro';
import type { Env } from '../types/env';

export function isAuthenticated(cookies: AstroCookies, env: Env): boolean {
  const token = cookies.get('kharon_internal_auth')?.value ?? '';
  const expected = env.INTERNAL_ACCESS_TOKEN ?? '';
  return !!(expected && token === expected);
}
