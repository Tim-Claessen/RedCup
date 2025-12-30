/**
 * Debug utility to check if a user's handle is stored in Firestore
 * Can be called from the browser console or React Native debugger
 */

import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';

/**
 * Checks if the current user's handle is stored in Firestore
 * Returns the handle document if it exists
 */
export const debugCheckUserHandle = async (): Promise<void> => {
  if (!auth || !auth.currentUser) {
    console.log('❌ No user is currently signed in');
    return;
  }

  if (!db) {
    console.log('❌ Firestore is not initialized');
    return;
  }

  const userId = auth.currentUser.uid;
  console.log('🔍 Checking handle for user:', userId);

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('✅ User handle found in Firestore:');
      console.log('   Handle:', data.handle);
      console.log('   UserId:', data.userId);
      console.log('   Created:', data.createdAt ? new Date(data.createdAt).toISOString() : 'N/A');
      console.log('   Updated:', new Date(data.updatedAt).toISOString());
      console.log('   Full document:', data);
    } else {
      console.log('❌ No handle document found in Firestore for this user');
      console.log('   Collection: users');
      console.log('   Document ID:', userId);
      console.log('   This means the handle was never created or was deleted');
    }
  } catch (error) {
    console.error('❌ Error checking user handle:', error);
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as typeof window & { debugCheckUserHandle: typeof debugCheckUserHandle }).debugCheckUserHandle = debugCheckUserHandle;
}

