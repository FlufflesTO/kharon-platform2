export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, cookies, redirect }) => {
  const form = await request.formData();
  const token = String(form.get('token') || '');
  const expected = (locals as any).runtime.env.INTERNAL_ACCESS_TOKEN || '';

  if (!expected || token !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  cookies.set('kharon_internal_auth', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  });

  return redirect('/internal');
};
