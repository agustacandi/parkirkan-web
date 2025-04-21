import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, locals }) => {
  // Hapus cookie
  cookies.delete('auth_token', { path: '/' });
  locals.authenticated = false;

  throw redirect(303, '/');
};
