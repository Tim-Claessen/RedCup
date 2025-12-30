/**
 * Firebase Mock
 * 
 * Mocks Firebase Auth and Firestore for testing
 */

// Mock Firestore
export const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInAnonymously: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn((callback) => {
    // Return unsubscribe function
    return jest.fn();
  }),
};

// Mock Firebase App
export const mockApp = {};

// Export mocked modules
export const getFirestore = jest.fn(() => mockFirestore);
export const getAuth = jest.fn(() => mockAuth);
export const initializeApp = jest.fn(() => mockApp);

// Default export for module mocking
export default {
  getFirestore,
  getAuth,
  initializeApp,
  mockFirestore,
  mockAuth,
  mockApp,
};

