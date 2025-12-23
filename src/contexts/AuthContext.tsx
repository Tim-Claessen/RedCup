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
    if (!auth) throw new Error('Firebase Auth not initialized');
    await signInAnonymously(auth);
  };

  const signInWithEmailHandler = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmailHandler = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOutHandler = async () => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    await firebaseSignOut(auth);
    setUser(null);
  };

  const setHandleHandler = async (handle: string) => {
    if (!user) throw new Error('No user signed in');
    const success = await createUserHandle(user.uid, handle);
    if (success) {
      setUser({ ...user, handle });
    } else {
      // If success is false but no error was thrown, it's a general failure
      throw new Error('Failed to create user handle');
    }
  };

  const resetPasswordHandler = async (email: string) => {
    if (!auth) throw new Error('Firebase Auth not initialized');
    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }
    await sendPasswordResetEmail(auth, email.trim());
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

