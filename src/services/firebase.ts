/**
 * Firebase Configuration and Initialization
 * 
 * Initialize Firebase services for Firestore database and Authentication
 * 
 * Firebase config is imported from .secure/firebase.config.ts
 * which is gitignored to protect sensitive credentials.
 */

import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { createError, logError, ErrorCodes } from '../utils/errorHandler';
import { AppError } from '../types/errors';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let initializationError: AppError | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { firebaseConfig } = require('../../.secure/firebase.config') as {
    firebaseConfig: FirebaseOptions;
  };

  if (
    !firebaseConfig ||
    firebaseConfig.apiKey === 'your-api-key-here' ||
    firebaseConfig.projectId === 'your-project-id'
  ) {
    const error = createError(
      ErrorCodes.FIRESTORE_NOT_INITIALIZED,
      'Firebase configuration not set up. Please configure .secure/firebase.config.ts with your Firebase project credentials.',
      {
        technicalMessage: 'Firebase config contains placeholder values',
        recoverable: true,
        category: 'FIRESTORE',
        retryable: false,
      }
    );
    initializationError = error;
    throw new Error(error.message);
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  initializationError = null;
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorCode = (error as { code?: string })?.code;

  if (!initializationError) {
    initializationError = createError(
      ErrorCodes.FIRESTORE_NOT_INITIALIZED,
      'Firebase initialization failed. The app will work in offline mode.',
      {
        technicalMessage: errorMessage,
        recoverable: true,
        category: 'FIRESTORE',
        retryable: false,
        originalError: error,
      }
    );
  }

  logError(initializationError, 'Firebase Initialization');

  if (
    errorCode === 'MODULE_NOT_FOUND' ||
    errorMessage.includes('Cannot find module') ||
    errorMessage.includes('Cannot resolve')
  ) {
    console.error(
      '\n⚠️  Firebase configuration file not found!\n' +
      'Please create .secure/firebase.config.ts with your Firebase credentials.\n' +
      'See .secure/README.md for setup instructions.\n'
    );
  } else if (errorMessage.includes('configuration not set up')) {
    console.error('\n⚠️  ' + errorMessage + '\n');
  }
}

/**
 * Gets the Firebase initialization error if any
 */
export const getInitializationError = (): AppError | null => {
  return initializationError;
};

/**
 * Checks if Firebase is properly initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return app !== null && db !== null && auth !== null && initializationError === null;
};

export { app, db, auth };