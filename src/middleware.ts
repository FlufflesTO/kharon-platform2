import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/auth';

const protectedPrefixes = ['/internal', '/api/tickets', '/api/internal'];

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
  if (isAuthenticated(context.cookies, env)) {
    return next();
  }

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  return context.redirect('/internal/login');
});
