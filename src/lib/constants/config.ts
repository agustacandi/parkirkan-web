/**
 * Application configuration constants
 * Centralized configuration for better maintainability and security
 */

// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    ENDPOINTS: {
        LOGIN_ADMIN: '/api/login-admin',
        LOGOUT: '/api/logout',
        USERS: '/api/user',
        USER_IMPORT: '/api/user/import',
        USER_EXPORT: '/api/user/export',
    },
    TIMEOUT: 10000, // 10 seconds
} as const;

// Routes
export const ROUTES = {
    HOME: '/',
    DASHBOARD: '/dashboard',
    DASHBOARD_USERS: '/dashboard/users',
    DASHBOARD_PARKING_HISTORY: '/dashboard/parking-history',
    DASHBOARD_PARKING_HISTORY_DETAIL: '/dashboard/parking-history/detail',
    API_AUTH_LOGIN: '/api/auth/login',
    API_AUTH_LOGOUT: '/api/auth/logout',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user',
} as const;

// Authentication
export const AUTH_CONFIG = {
    COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 1 week in seconds
    TOKEN_REFRESH_THRESHOLD: 60 * 60 * 24, // 1 day in seconds
} as const;

// UI Constants
export const UI_CONFIG = {
    LOADING_DELAY: 300, // ms
    ERROR_DISPLAY_TIME: 5000, // ms
    DEBOUNCE_TIME: 300, // ms
} as const; 