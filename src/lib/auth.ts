/**
 * Enhanced authentication utilities with better error handling and type safety
 * Prevents memory leaks and provides consistent authentication state management
 */

import { STORAGE_KEYS } from '$lib/constants/config';
import type { UserData, StorageType } from '$lib/types/auth';

/**
 * Safely check if we're in browser environment
 * Comprehensive check to ensure we have access to browser APIs
 */
function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined' &&
    typeof localStorage !== 'undefined'
  );
}

/**
 * Safe storage getter with error handling
 */
function safeGetStorage(key: string, storageType: StorageType = 'localStorage'): string | null {
  if (!isBrowser()) return null;

  try {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    return storage.getItem(key);
  } catch (error) {
    console.warn(`Failed to access ${storageType}:`, error);
    return null;
  }
}

/**
 * Safe storage setter with error handling
 */
function safeSetStorage(key: string, value: string, storageType: StorageType = 'localStorage'): boolean {
  if (!isBrowser()) return false;

  try {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set ${storageType}:`, error);
    return false;
  }
}

/**
 * Safe storage removal with error handling
 */
function safeRemoveStorage(key: string, storageType?: StorageType): void {
  if (!isBrowser()) return;

  try {
    if (storageType) {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(key);
    } else {
      // Remove from both storages if no type specified
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`Failed to remove from storage:`, error);
  }
}

/**
 * Get authentication token from cookie
 */
function getTokenFromCookie(): string | null {
  if (!isBrowser()) return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        return value || null;
      }
    }
  } catch (error) {
    console.warn('Failed to read auth cookie:', error);
  }

  return null;
}

/**
 * Get authentication token from storage or cookie
 */
export function getAuthToken(): string | null {
  // First try storage (localStorage/sessionStorage)
  const storageToken = safeGetStorage(STORAGE_KEYS.AUTH_TOKEN, 'localStorage') ||
    safeGetStorage(STORAGE_KEYS.AUTH_TOKEN, 'sessionStorage');

  // If no token in storage, try cookie
  const cookieToken = storageToken || getTokenFromCookie();

  // If we found a token in cookie but not in storage, sync it to storage
  if (cookieToken && !storageToken) {
    safeSetStorage(STORAGE_KEYS.AUTH_TOKEN, cookieToken, 'localStorage');
  }

  return cookieToken;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  const token = getAuthToken();
  return !!token && token.length > 0;
}

/**
 * Get user data with proper error handling and type safety  
 */
export function getUserData(): UserData | null {
  const userData = safeGetStorage(STORAGE_KEYS.USER_DATA, 'localStorage') ||
    safeGetStorage(STORAGE_KEYS.USER_DATA, 'sessionStorage');

  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    // Basic validation to ensure we have a valid user object
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) {
      return parsed as UserData;
    }
    return null;
  } catch (error) {
    console.warn('Failed to parse user data from storage:', error);
    // Clean up corrupted data
    safeRemoveStorage(STORAGE_KEYS.USER_DATA);
    return null;
  }
}

/**
 * Store authentication data with proper error handling
 */
export function storeAuthData(token: string, userData: UserData, rememberMe: boolean = false): boolean {
  const storageType: StorageType = rememberMe ? 'localStorage' : 'sessionStorage';

  const tokenStored = safeSetStorage(STORAGE_KEYS.AUTH_TOKEN, token, storageType);
  const userStored = safeSetStorage(STORAGE_KEYS.USER_DATA, JSON.stringify(userData), storageType);

  // Also set as httpOnly cookie for server-side access
  if (isBrowser()) {
    try {
      const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; // 7 days or 1 day
      const cookieString = `auth_token=${token}; path=/; max-age=${maxAge}; secure=${window.location.protocol === 'https:'}; samesite=lax`;
      document.cookie = cookieString;
    } catch (error) {
      console.warn('Failed to set auth cookie:', error);
    }
  }

  return tokenStored && userStored;
}

/**
 * Enhanced logout with comprehensive cleanup
 */
export function logout(): void {
  // Remove from both storage types to ensure clean logout
  safeRemoveStorage(STORAGE_KEYS.AUTH_TOKEN);
  safeRemoveStorage(STORAGE_KEYS.USER_DATA);

  // Also clear the authentication cookie
  if (isBrowser()) {
    try {
      // Clear auth cookie
      document.cookie = 'auth_token=; path=/; max-age=0; secure; samesite=lax';

      // Clear any cached data that might exist
      const keysToRemove = ['user_preferences', 'temp_data', 'session_data'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Error during logout cleanup:', error);
    }
  }
}

/**
 * Check if token is potentially expired (basic check)
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;

  try {
    // Basic JWT expiry check (if using JWT tokens)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < currentTime;
  } catch {
    // If we can't parse it, assume it's not a JWT or handle accordingly
    return false;
  }
}
