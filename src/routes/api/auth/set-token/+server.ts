import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { token } = await request.json();

  // Set cookie yang dapat diakses server side
  cookies.set('auth_token', token, {
    path: '/',
    httpOnly: true, // Tidak dapat diakses dari JavaScript client-side (lebih aman)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 1 minggu
  });

  return json({ success: true });
};
