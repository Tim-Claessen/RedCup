/**
 * Error Type Definitions
 * 
 * Centralized error types for consistent error handling across the app.
 * Supports testing with unique error codes and structured error data.
 */

/**
 * Error categories for grouping related errors
 */
export type ErrorCategory = 
  | 'NETWORK'
  | 'AUTH'
  | 'FIRESTORE'
  | 'VALIDATION'
  | 'PLATFORM'
  | 'UNKNOWN';

/**
 * Structured application error
 * Provides error code, user-friendly message, and metadata for debugging
 */
export interface AppError {
  code: string;
  message: string;
  technicalMessage?: string;
  recoverable: boolean;
  category: ErrorCategory;
  originalError?: unknown;
  retryable?: boolean;
  retryAfter?: number;
}

/**
 * Result type for operations that can fail
 * Enables type-safe error handling without exceptions
 */
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: AppError };

/**
 * Error codes for different error scenarios
 * Used for testing assertions and error identification
 */
export const ErrorCodes = {
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_RATE_LIMIT: 'NETWORK_RATE_LIMIT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_EMAIL_ALREADY_IN_USE: 'AUTH_EMAIL_ALREADY_IN_USE',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_NOT_INITIALIZED: 'AUTH_NOT_INITIALIZED',
  
  // Firestore errors
  FIRESTORE_PERMISSION_DENIED: 'FIRESTORE_PERMISSION_DENIED',
  FIRESTORE_NOT_FOUND: 'FIRESTORE_NOT_FOUND',
  FIRESTORE_ALREADY_EXISTS: 'FIRESTORE_ALREADY_EXISTS',
  FIRESTORE_QUOTA_EXCEEDED: 'FIRESTORE_QUOTA_EXCEEDED',
  FIRESTORE_UNAVAILABLE: 'FIRESTORE_UNAVAILABLE',
  FIRESTORE_NOT_INITIALIZED: 'FIRESTORE_NOT_INITIALIZED',
  
  // Validation errors
  VALIDATION_INVALID_HANDLE: 'VALIDATION_INVALID_HANDLE',
  VALIDATION_HANDLE_TAKEN: 'VALIDATION_HANDLE_TAKEN',
  VALIDATION_MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
  VALIDATION_INVALID_GAME_STATE: 'VALIDATION_INVALID_GAME_STATE',
  
  // Platform errors
  PLATFORM_IOS_PERMISSION: 'PLATFORM_IOS_PERMISSION',
  PLATFORM_ANDROID_STORAGE: 'PLATFORM_ANDROID_STORAGE',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Type for error code values
 */
export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];


