import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Path yang memerlukan autentikasi
  const protectedRoutes = ['/dashboard', '/dashboard/users', '/dashboard/parking-history'];

  // Cek token dari cookie (server-side authentication)
  const authToken = event.cookies.get('auth_token');
  const isProtectedRoute = protectedRoutes.some(route => event.url.pathname.startsWith(route));
  const isLoginPage = event.url.pathname === '/';

  // Set variabel autentikasi pada event.locals agar dapat diakses di server route handlers
  event.locals.authenticated = !!authToken;

  // Redirect ke login jika mencoba mengakses protected route tanpa autentikasi
  if (isProtectedRoute && !event.locals.authenticated) {
    throw redirect(303, '/');
  }

  // Redirect ke dashboard jika sudah login tapi mencoba akses halaman login
  if (isLoginPage && event.locals.authenticated) {
    throw redirect(303, '/dashboard');
  }

  const response = await resolve(event);
  return response;
};
