import { defineMiddleware } from 'astro:middleware';

const protectedPrefixes = ['/internal', '/api/tickets'];

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  if (path === '/internal/login' || path.startsWith('/api/auth')) {
    return next();
  }

  const protectedRoute = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (!protectedRoute) {
    return next();
  }

  const env = (context.locals as any).runtime?.env || {};
  const token = env.INTERNAL_ACCESS_TOKEN || '';
  const cookie = context.cookies.get('kharon_internal_auth')?.value || '';

  if (token && cookie === token) {
    return next();
  }

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  return context.redirect('/internal/login');
});
