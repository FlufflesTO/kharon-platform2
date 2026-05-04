export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('kharon_internal_auth', { path: '/' });
  return redirect('/internal/login');
};
