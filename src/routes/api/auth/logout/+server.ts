import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STORAGE_KEYS } from '$lib/constants/config';

/**
 * Enhanced logout endpoint with proper cleanup and error handling
 */
export const POST: RequestHandler = async ({ cookies, locals }) => {
  try {
    // Clear authentication cookie with proper options
    cookies.delete(STORAGE_KEYS.AUTH_TOKEN, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    // Clear server-side authentication state
    locals.authenticated = false;

    // Return success response instead of redirect to allow client-side handling
    return json({
      success: true,
      message: 'Logout successful'
    });

  } catch (err) {
    console.error('Logout API error:', err);

    // Still return success since logout should always work from client perspective
    // Even if there's an error clearing server state
    return json({
      success: true,
      message: 'Logout completed with warnings'
    });
  }
};
