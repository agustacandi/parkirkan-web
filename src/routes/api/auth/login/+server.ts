import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { token } = await request.json();

  // Set cookie dengan HttpOnly agar lebih aman (tidak dapat diakses via JavaScript)
  cookies.set('auth_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 1 minggu
  });

  return json({ success: true });
};
