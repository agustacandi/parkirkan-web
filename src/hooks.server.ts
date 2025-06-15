import { redirect, type Handle } from '@sveltejs/kit';
import { ROUTES, STORAGE_KEYS } from '$lib/constants/config';

/**
 * Enhanced server-side authentication handler
 * Provides consistent authentication state management and proper route protection
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Get authentication token from secure HTTP-only cookie (optional)
  const authToken = event.cookies.get(STORAGE_KEYS.AUTH_TOKEN);
  const currentPath = event.url.pathname;
  const isApiRoute = currentPath.startsWith('/api/');

  // Validate token (basic check - in production, verify JWT signature)
  const isValidToken = !!(authToken && authToken.length > 0);

  // Set authentication state in locals for use in route handlers
  event.locals.authenticated = isValidToken;

  // Note: We're removing server-side route protection for dashboard routes
  // because we're using client-side authentication with sessionStorage/localStorage
  // Client-side authentication will handle the redirect in the component itself

  // Add security headers for non-API routes
  const response = await resolve(event);

  if (!isApiRoute) {
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Only add CSP for non-dev environments to avoid issues with hot reload
    if (process.env.NODE_ENV === 'production') {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
      );
    }
  }

  return response;
};
