/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Manages user login, logout, and guest mode.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserHandle, createUserHandle } from '../services/userService';
import { handleFirebaseError, logError, createError } from '../utils/errorHandler';
import { AppError, ErrorCodes } from '../types/errors';

export interface AuthUser {
  uid: string;
  handle: string | null;
  isGuest: boolean;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setHandle: (handle: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const handle = await getUserHandle(firebaseUser.uid);
        const authUser = {
          uid: firebaseUser.uid,
          handle,
          isGuest: firebaseUser.isAnonymous,
          email: firebaseUser.email || undefined,
        };
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymouslyHandler = async () => {
    if (!auth) {
      throw createError(
        ErrorCodes.AUTH_NOT_INITIALIZED,
        'Authentication service is not available. Please check your connection.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: true,
        }
      );
    }
    try {
      await signInAnonymously(auth);
    } catch (error) {
      const appError = handleFirebaseError(error);
      logError(appError, 'signInAnonymously');
      throw appError;
    }
  };

  const signInWithEmailHandler = async (email: string, password: string) => {
    if (!auth) {
      throw createError(
        ErrorCodes.AUTH_NOT_INITIALIZED,
        'Authentication service is not available. Please check your connection.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: true,
        }
      );
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const appError = handleFirebaseError(error);
      logError(appError, 'signInWithEmail');
      throw appError;
    }
  };

  const signUpWithEmailHandler = async (email: string, password: string) => {
    if (!auth) {
      throw createError(
        ErrorCodes.AUTH_NOT_INITIALIZED,
        'Authentication service is not available. Please check your connection.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: true,
        }
      );
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const appError = handleFirebaseError(error);
      logError(appError, 'signUpWithEmail');
      throw appError;
    }
  };

  const signOutHandler = async () => {
    if (!auth) {
      throw createError(
        ErrorCodes.AUTH_NOT_INITIALIZED,
        'Authentication service is not available.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: false,
        }
      );
    }
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      const appError = handleFirebaseError(error);
      logError(appError, 'signOut');
      throw appError;
    }
  };

  const setHandleHandler = async (handle: string) => {
    if (!user) {
      throw createError(
        ErrorCodes.AUTH_USER_NOT_FOUND,
        'No user signed in. Please sign in first.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: false,
        }
      );
    }
    try {
      await createUserHandle(user.uid, handle);
      setUser({ ...user, handle });
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      const appError = handleFirebaseError(error);
      logError(appError, 'setHandle');
      throw appError;
    }
  };

  const resetPasswordHandler = async (email: string) => {
    if (!auth) {
      throw createError(
        ErrorCodes.AUTH_NOT_INITIALIZED,
        'Authentication service is not available. Please check your connection.',
        {
          recoverable: true,
          category: 'AUTH',
          retryable: true,
        }
      );
    }
    if (!email || email.trim() === '') {
      throw createError(
        ErrorCodes.VALIDATION_MISSING_FIELD,
        'Email is required.',
        {
          recoverable: true,
          category: 'VALIDATION',
          retryable: false,
        }
      );
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      const appError = handleFirebaseError(error);
      logError(appError, 'resetPassword');
      throw appError;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInAnonymously: signInAnonymouslyHandler,
    signInWithEmail: signInWithEmailHandler,
    signUpWithEmail: signUpWithEmailHandler,
    signOut: signOutHandler,
    setHandle: setHandleHandler,
    resetPassword: resetPasswordHandler,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

