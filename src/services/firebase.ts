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

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  // Import firebase config - will throw if file doesn't exist
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { firebaseConfig } = require('../../.secure/firebase.config') as {
    firebaseConfig: FirebaseOptions;
  };

  // Validate that config is not using placeholder values
  if (
    !firebaseConfig ||
    firebaseConfig.apiKey === 'your-api-key-here' ||
    firebaseConfig.projectId === 'your-project-id'
  ) {
    throw new Error(
      'Firebase configuration not set up. Please configure .secure/firebase.config.ts with your Firebase project credentials. See .secure/README.md for instructions.'
    );
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorCode = (error as { code?: string })?.code;

  console.error('Error initializing Firebase:', errorMessage);

  // Provide helpful error message for missing config
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

  // App will continue to work without Firebase (events stored in memory only)
}

export { app, db, auth };
