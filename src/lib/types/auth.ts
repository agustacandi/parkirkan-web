/**
 * Authentication-related type definitions
 * Centralized types for better maintainability and type safety
 */

export interface UserData {
    readonly id: number;
    readonly name: string;
    readonly email: string;
    readonly phone: string | null;
    readonly email_verified_at: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly role: string;
    readonly token: string;
}

export interface LoginResponse {
    readonly success: boolean;
    readonly data: UserData | ErrorData;
    readonly message: string;
}

export interface ErrorData {
    readonly error: string;
}

export interface ApiError extends Error {
    readonly status?: number;
    readonly code?: string;
}

export interface AuthState {
    readonly isAuthenticated: boolean;
    readonly user: UserData | null;
    readonly loading: boolean;
    readonly error: string | null;
}

export type StorageType = 'localStorage' | 'sessionStorage'; 