/**
 * Firebase Configuration and Initialization
 * 
 * Initialize Firebase services for Firestore database
 * 
 * Firebase config is imported from .secure/firebase.config.ts
 * which is gitignored to protect sensitive credentials.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../../.secure/firebase.config';

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // App will continue to work without Firebase (events stored in memory only)
}

export { app, db };
