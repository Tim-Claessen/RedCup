/**
 * Firebase Configuration and Initialization
 * 
 * Initialize Firebase services for Firestore database
 * 
 * TODO: Replace the placeholder config with your actual Firebase config
 * Get your config from Firebase Console → Project Settings → Your apps → Web app
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4eAjW97wWp8E5IkiYVQNgYhnydsLDplA",
  authDomain: "redcupapp.firebaseapp.com",
  projectId: "redcupapp",
  storageBucket: "redcupapp.firebasestorage.app",
  messagingSenderId: "360371221586",
  appId: "1:360371221586:web:e2245384355ca9490d1b8b",
  measurementId: "G-LEB816KFQM"
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // App will continue to work without Firebase (events stored in memory only)
}

export { app, db };
