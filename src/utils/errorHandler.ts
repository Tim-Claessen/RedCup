/**
 * Error Handler Utilities
 * 
 * Centralized error handling with user-friendly messages,
 * error logging, and retry logic support.
 */

import { Platform } from 'react-native';
import { AppError, ErrorCategory, ErrorCode, ErrorCodes, Result } from '../types/errors';
import { FirebaseError } from 'firebase/app';

/**
 * Creates a structured AppError from various error types
 */
export const createError = (
  code: ErrorCode,
  message: string,
  options?: {
    technicalMessage?: string;
    recoverable?: boolean;
    category?: ErrorCategory;
    originalError?: unknown;
    retryable?: boolean;
    retryAfter?: number;
  }
): AppError => {
  const category = options?.category || getCategoryFromCode(code);
  
  return {
    code,
    message,
    technicalMessage: options?.technicalMessage,
    recoverable: options?.recoverable ?? true,
    category,
    originalError: options?.originalError,
    retryable: options?.retryable ?? false,
    retryAfter: options?.retryAfter,
  };
};

/**
 * Determines error category from error code
 */
const getCategoryFromCode = (code: ErrorCode): ErrorCategory => {
  if (code.startsWith('NETWORK_')) return 'NETWORK';
  if (code.startsWith('AUTH_')) return 'AUTH';
  if (code.startsWith('FIRESTORE_')) return 'FIRESTORE';
  if (code.startsWith('VALIDATION_')) return 'VALIDATION';
  if (code.startsWith('PLATFORM_')) return 'PLATFORM';
  return 'UNKNOWN';
};

/**
 * Converts Firebase errors to AppError
 */
export const handleFirebaseError = (error: unknown): AppError => {
  if (error instanceof FirebaseError) {
    const code = error.code;
    
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return createError(
        ErrorCodes.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password. Please try again.',
        {
          technicalMessage: `Firebase Auth error: ${code}`,
          originalError: error,
          retryable: true,
        }
      );
    }
    
    if (code === 'auth/user-not-found') {
      return createError(
        ErrorCodes.AUTH_USER_NOT_FOUND,
        'No account found with this email.',
        {
          technicalMessage: `Firebase Auth error: ${code}`,
          originalError: error,
          retryable: false,
        }
      );
    }
    
    if (code === 'auth/email-already-in-use') {
      return createError(
        ErrorCodes.AUTH_EMAIL_ALREADY_IN_USE,
        'This email is already registered. Please sign in instead.',
        {
          technicalMessage: `Firebase Auth error: ${code}`,
          originalError: error,
          retryable: false,
        }
      );
    }
    
    if (code === 'auth/weak-password') {
      return createError(
        ErrorCodes.AUTH_WEAK_PASSWORD,
        'Password is too weak. Please use at least 6 characters.',
        {
          technicalMessage: `Firebase Auth error: ${code}`,
          originalError: error,
          retryable: true,
        }
      );
    }
    
    if (code === 'permission-denied') {
      return createError(
        ErrorCodes.FIRESTORE_PERMISSION_DENIED,
        'You don\'t have permission to perform this action.',
        {
          technicalMessage: `Firestore error: ${code}`,
          originalError: error,
          retryable: false,
        }
      );
    }
    
    if (code === 'not-found') {
      return createError(
        ErrorCodes.FIRESTORE_NOT_FOUND,
        'The requested data was not found.',
        {
          technicalMessage: `Firestore error: ${code}`,
          originalError: error,
          retryable: false,
        }
      );
    }
    
    if (code === 'already-exists') {
      return createError(
        ErrorCodes.FIRESTORE_ALREADY_EXISTS,
        'This item already exists.',
        {
          technicalMessage: `Firestore error: ${code}`,
          originalError: error,
          retryable: false,
        }
      );
    }
    
    if (code === 'resource-exhausted' || code === 'quota-exceeded') {
      return createError(
        ErrorCodes.FIRESTORE_QUOTA_EXCEEDED,
        'Service temporarily unavailable. Please try again later.',
        {
          technicalMessage: `Firestore error: ${code}`,
          originalError: error,
          retryable: true,
          retryAfter: 60000,
        }
      );
    }
    
    if (code === 'unavailable') {
      return createError(
        ErrorCodes.FIRESTORE_UNAVAILABLE,
        'Service is temporarily unavailable. Please check your connection.',
        {
          technicalMessage: `Firestore error: ${code}`,
          originalError: error,
          retryable: true,
          retryAfter: 5000,
        }
      );
    }
  }
  
  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('offline')) {
      return createError(
        ErrorCodes.NETWORK_OFFLINE,
        'No internet connection. Please check your network and try again.',
        {
          technicalMessage: error.message,
          originalError: error,
          retryable: true,
        }
      );
    }
    
    if (error.message.includes('timeout')) {
      return createError(
        ErrorCodes.NETWORK_TIMEOUT,
        'Request timed out. Please try again.',
        {
          technicalMessage: error.message,
          originalError: error,
          retryable: true,
        }
      );
    }
  }
  
  return createError(
    ErrorCodes.UNKNOWN_ERROR,
    'An unexpected error occurred. Please try again.',
    {
      technicalMessage: error instanceof Error ? error.message : String(error),
      originalError: error,
      retryable: true,
    }
  );
};

/**
 * Checks if device is likely offline
 */
export const isOfflineError = (error: unknown): boolean => {
  if (error instanceof FirebaseError) {
    return error.code === 'unavailable' || 
           error.code === 'failed-precondition' ||
           error.message.includes('network') ||
           error.message.includes('offline');
  }
  
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') ||
           msg.includes('offline') ||
           msg.includes('fetch') ||
           msg.includes('connection') ||
           msg.includes('timeout');
  }
  
  return false;
};

/**
 * Checks if Firebase/Firestore is initialized
 * Note: Actual initialization check is done at call sites (db !== null)
 */
export const isFirebaseInitialized = (): boolean => {
  try {
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if error is retryable
 */
export const isRetryable = (error: AppError): boolean => {
  return error.retryable === true;
};

/**
 * Gets retry delay in milliseconds
 */
export const getRetryDelay = (error: AppError): number => {
  return error.retryAfter || 1000;
};

/**
 * Logs error for debugging (console in dev, error reporting in prod)
 */
export const logError = (error: AppError, context?: string): void => {
  const contextMsg = context ? `[${context}] ` : '';
  const technicalMsg = error.technicalMessage || 'No technical details';
  
  const errorData = {
    code: error.code,
    category: error.category,
    recoverable: error.recoverable,
    retryable: error.retryable,
    technicalMessage: technicalMsg,
    originalError: error.originalError,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    context,
  };
  
  console.error(
    `${contextMsg}Error ${error.code}: ${error.message}`,
    errorData
  );
  
  // In production, send to error reporting service (e.g., Sentry, Firebase Crashlytics)
  if (__DEV__ === false) {
    // TODO: Integrate with Firebase Crashlytics or Sentry
    // Example for Firebase Crashlytics:
    // import crashlytics from '@react-native-firebase/crashlytics';
    // crashlytics().recordError(new Error(error.message), {
    //   code: error.code,
    //   category: error.category,
    //   context,
    // });
    
    // Example for Sentry:
    // import * as Sentry from '@sentry/react-native';
    // Sentry.captureException(error.originalError || new Error(error.message), {
    //   tags: { errorCode: error.code, category: error.category },
    //   extra: errorData,
    // });
  }
};

/**
 * Creates a success Result
 */
export const success = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

/**
 * Creates a failure Result
 */
export const failure = (error: AppError): Result<never> => ({
  success: false,
  error,
});

/**
 * Wraps an async function with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<Result<T>> => {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    const appError = handleFirebaseError(error);
    logError(appError, context);
    return failure(appError);
  }
};

/**
 * Retries an operation with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryable?: (error: unknown) => boolean;
    context?: string;
  }
): Promise<Result<T>> => {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;
  const retryable = options?.retryable ?? ((error) => {
    if (error instanceof FirebaseError) {
      const code = error.code;
      if (code === 'permission-denied' || 
          code === 'not-found' || 
          code === 'already-exists' ||
          code === 'invalid-argument') {
        return false;
      }
      return code === 'unavailable' || 
             code === 'deadline-exceeded' ||
             code === 'resource-exhausted';
    }
    return isOfflineError(error);
  });
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      return success(data);
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !retryable(error)) {
        break;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const appError = handleFirebaseError(lastError!);
  if (options?.context) {
    logError(appError, options.context);
  }
  return failure(appError);
};
