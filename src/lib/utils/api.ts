/**
 * Centralized API utility functions
 * Provides consistent error handling, timeouts, and security measures
 */

import { API_CONFIG } from '$lib/constants/config';
import type { ApiError } from '$lib/types/auth';
import { getAuthToken } from '$lib/auth';

/**
 * Custom fetch wrapper with timeout and enhanced error handling
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = API_CONFIG.TIMEOUT
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Get auth token and add to headers if available
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const defaultOptions: RequestInit = {
        headers: {
            ...headers,
            ...options.headers,
        },
        signal: controller.signal,
        ...options,
    };

    try {
        const response = await fetch(url, defaultOptions);
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw createApiError('Request timeout', 408, 'TIMEOUT');
            }
            throw createApiError(error.message, 0, 'NETWORK_ERROR');
        }
        throw createApiError('Unknown error occurred', 0, 'UNKNOWN_ERROR');
    }
}

/**
 * Create standardized API error
 */
export function createApiError(message: string, status?: number, code?: string): ApiError {
    const error = new Error(message);
    return Object.assign(error, { status, code }) as ApiError;
}

/**
 * Safe JSON parsing with error handling
 */
export async function safeJsonParse<T>(response: Response): Promise<T> {
    try {
        const text = await response.text();
        if (!text) {
            throw createApiError('Empty response body', response.status, 'EMPTY_RESPONSE');
        }

        return JSON.parse(text) as T;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw createApiError('Invalid JSON response', response.status, 'INVALID_JSON');
        }
        throw error;
    }
}

/**
 * API request with proper error handling
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    try {
        const response = await fetchWithTimeout(url, options);

        if (!response.ok) {
            const errorData = await safeJsonParse<{ message?: string; error?: string }>(response);
            const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
            throw createApiError(errorMessage, response.status, 'HTTP_ERROR');
        }

        return await safeJsonParse<T>(response);
    } catch (error) {
        if (error instanceof Error && (error as ApiError).status !== undefined) {
            throw error; // Re-throw API errors as-is
        }
        throw createApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
}

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
        const value = data[field];
        if (value === undefined || value === null || value === '') {
            missingFields.push(String(field));
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
} 