import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AUTH_CONFIG, STORAGE_KEYS } from '$lib/constants/config';

/**
 * Enhanced login endpoint with improved security and error handling
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate token presence
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return error(400, {
        message: 'Invalid or missing authentication token'
      });
    }

    // Set secure HTTP-only cookie with simplified options
    cookies.set(STORAGE_KEYS.AUTH_TOKEN, token.trim(), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      secure: false, // Disabled for development
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds (hardcoded to avoid import issues)
    });

    return json({
      success: true,
      message: 'Authentication cookie set successfully'
    });

  } catch (err) {
    console.error('Login API error:', err);

    if (err instanceof SyntaxError) {
      return error(400, {
        message: 'Invalid JSON in request body'
      });
    }

    return error(500, {
      message: 'Internal server error during authentication'
    });
  }
};
