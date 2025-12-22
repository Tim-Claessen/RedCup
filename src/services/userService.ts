/**
 * User Service
 * 
 * Manages user handles and the userID:handle mapping in Firestore.
 * Allows users to create and retrieve handles for display purposes.
 */

import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { db } from './firebase';

export interface UserHandleDocument {
  userId: string; // Firebase Auth UID
  handle: string; // User's display name/handle
  createdAt?: number; // Timestamp when handle was created (optional for existing users)
  updatedAt: number; // Timestamp when handle was last updated
}

/**
 * Gets a user's handle from Firestore
 * Returns null if handle doesn't exist
 */
export const getUserHandle = async (userId: string): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot get user handle');
    return null;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data() as UserHandleDocument;
      return data.handle || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user handle:', error);
    return null;
  }
};

/**
 * Checks if a handle is already taken by another user (case-insensitive)
 * Returns true if handle is available, false if taken
 */
export const isHandleAvailable = async (handle: string, excludeUserId?: string): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot check handle availability');
    return false;
  }

  if (!handle || handle.trim() === '') {
    return false;
  }

  try {
    const { collection, query, where, getDocs, limit: limitQuery } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const trimmedHandle = handle.trim();
    const handleLower = trimmedHandle.toLowerCase();
    
    // Firestore queries are case-sensitive, so query both lowercase and uppercase first character
    const firstChar = trimmedHandle[0];
    const firstCharLower = firstChar.toLowerCase();
    const firstCharUpper = firstChar.toUpperCase();
    
    const queries = [];
    
    if (firstCharLower !== firstCharUpper) {
      queries.push(
        query(
          usersRef,
          where('handle', '>=', firstCharLower),
          where('handle', '<=', firstCharLower + '\uf8ff'),
          limitQuery(100)
        )
      );
      queries.push(
        query(
          usersRef,
          where('handle', '>=', firstCharUpper),
          where('handle', '<=', firstCharUpper + '\uf8ff'),
          limitQuery(100)
        )
      );
    } else {
      queries.push(
        query(
          usersRef,
          where('handle', '>=', firstCharLower),
          where('handle', '<=', firstCharLower + '\uf8ff'),
          limitQuery(100)
        )
      );
    }
    
    // Execute all queries and combine results
    const snapshots = await Promise.all(queries.map(q => getDocs(q)));
    const allDocs = new Map<string, UserHandleDocument>();
    
    snapshots.forEach(snapshot => {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserHandleDocument;
        allDocs.set(docSnap.id, data);
      });
    });
    
    // Check if any existing handle matches (case-insensitive)
    // Exclude the current user if they're updating their own handle
    for (const data of allDocs.values()) {
      if (data.userId === excludeUserId) {
        continue;
      }
      if (data.handle.toLowerCase() === handleLower) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking handle availability:', error);
    return false;
  }
};

/**
 * Creates or updates a user's handle in Firestore
 * Stores the userID:handle mapping in the 'users' collection
 * Validates that the handle is unique (case-insensitive)
 * 
 * @returns true if handle was created successfully, false if handle is taken or error occurred
 * @throws Error with message if handle is already taken
 */
export const createUserHandle = async (userId: string, handle: string): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot create user handle');
    return false;
  }

  if (!handle || handle.trim() === '') {
    console.warn('Handle cannot be empty');
    return false;
  }

  const trimmedHandle = handle.trim();

  const isAvailable = await isHandleAvailable(trimmedHandle, userId);
  if (!isAvailable) {
    throw new Error('This handle is already taken. Please choose another one.');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    const now = Date.now();
    const userData: UserHandleDocument = {
      userId,
      handle: trimmedHandle,
      updatedAt: now,
    };
    
    if (!userSnap.exists()) {
      userData.createdAt = now;
    }

    await setDoc(userRef, userData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error creating user handle:', error);
    if (error instanceof Error && error.message.includes('already taken')) {
      throw error;
    }
    return false;
  }
};

/**
 * Searches for users by handle (for friend selection)
 * Returns array of user IDs and handles matching the search term
 */
export const searchUsersByHandle = async (searchTerm: string, limit: number = 20): Promise<Array<{ userId: string; handle: string }>> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot search users');
    return [];
  }

  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    const { collection, query, where, getDocs, limit: limitQuery, orderBy } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    
    // Firestore doesn't support case-insensitive search natively
    const searchLower = searchTerm.trim().toLowerCase();
    const q = query(
      usersRef,
      where('handle', '>=', searchTerm.trim()),
      where('handle', '<=', searchTerm.trim() + '\uf8ff'),
      orderBy('handle'),
      limitQuery(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const results: Array<{ userId: string; handle: string }> = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserHandleDocument;
      if (data.handle.toLowerCase().includes(searchLower)) {
        results.push({
          userId: data.userId,
          handle: data.handle,
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

