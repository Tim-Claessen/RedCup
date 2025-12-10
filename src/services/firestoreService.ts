/**
 * Firestore Service
 * 
 * Handles saving game events and matches to Firestore
 */

import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { db } from './firebase';
import { GameEvent } from '../types/game';
import { GameType, CupCount, Player } from '../types/game';

export interface MatchDocument {
  matchId: string;
  tournamentId?: string | null; // Links to tournament (null for ad-hoc games)
  rulesConfig: {
    cupCount: CupCount;
    gameType: GameType;
  };
  participants: Array<{
    userId?: string; // Will be added when auth is implemented
    handle: string; // Keep for now until auth is added
    side: 0 | 1; // 0 = team1, 1 = team2
    isCaptain?: boolean;
  }>;
  startedAt: any; // Firestore timestamp
  endedAt?: any; // Firestore timestamp (nullable, only set when match completes)
  winningSide?: 0 | 1; // 0 = team1, 1 = team2 (only set when match completes)
  completed: boolean;
}

export interface MadeShotDocument {
  shotId: string; // Same as eventId, used as document ID
  matchId: string;
  userId?: string; // Will be added when auth is implemented
  playerHandle: string; // Keep for now until auth is added
  cupIndex: number; // cupId - standard cup mapping (0-9 for 10-cup, 0-5 for 6-cup)
  timestamp: number; // Timestamp for ordering/chronological analysis
  isBounce: boolean;
  isGrenade: boolean;
  isRedemption: boolean; // Was this a clutch save/redemption?
  isUndone: boolean; // Soft-delete flag for analytics
  bounceGroupId?: string; // Links bounce shot events together
  team1CupsRemaining: number;
  team2CupsRemaining: number;
  // Note: gameState removed - too large, can be reconstructed from events
}

/**
 * Creates a new match document in Firestore
 * Returns the match ID
 */
export const createMatch = async (
  gameType: GameType,
  cupCount: CupCount,
  team1Players: Player[],
  team2Players: Player[]
): Promise<string | null> => {
  if (!db) {
    console.warn('Firestore not initialized, match not saved');
    return null;
  }

  try {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Build participants array with side assignment
    const participants = [
      ...team1Players.map(p => ({ 
        handle: p.handle, 
        side: 0 as const, // team1 = side 0
        isCaptain: false 
      })),
      ...team2Players.map(p => ({ 
        handle: p.handle, 
        side: 1 as const, // team2 = side 1
        isCaptain: false 
      })),
    ];
    
    const matchData: MatchDocument = {
      matchId,
      tournamentId: null, // Ad-hoc games for now
      rulesConfig: {
        cupCount,
        gameType,
      },
      participants,
      startedAt: serverTimestamp(),
      // Don't include endedAt or winningSide in initial document - they'll be added when match completes
      completed: false,
    };

    const matchRef = doc(db, 'matches', matchId);
    await setDoc(matchRef, matchData);

    console.log('Match created in Firestore:', matchId);
    return matchId;
  } catch (error) {
    console.error('Error creating match:', error);
    return null;
  }
};

/**
 * Saves a game event to Firestore as a "Made Shot"
 * 
 * OPTIMIZED FOR ANALYTICS:
 * - Stored in top-level `made_shots` collection (not subcollection)
 * - Uses eventId as document ID for direct lookup
 * - Removes gameState to reduce storage (can be reconstructed)
 * - Aligns with desired data model from README
 */
export const saveGameEvent = async (
  matchId: string,
  event: GameEvent
): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, event not saved');
    return false;
  }

  if (!matchId) {
    console.warn('matchId is null or empty, event not saved');
    return false;
  }

  try {
    // Determine if this is a redemption shot
    // Redemption = shot made when opponent had 0 cups remaining
    const isRedemption = event.team1CupsRemaining === 0 || event.team2CupsRemaining === 0;
    
    // Convert to MadeShotDocument format (aligned with README data model)
    // Only include optional fields if they are defined (Firestore rejects undefined values)
    const madeShot: MadeShotDocument = {
      shotId: event.eventId, // Use eventId as shotId
      matchId,
      playerHandle: event.playerHandle || '', // Will become userId when auth is added
      cupIndex: event.cupId, // Standard cup mapping (0-9 or 0-5)
      timestamp: event.timestamp,
      isBounce: event.isBounce,
      isGrenade: event.isGrenade,
      isRedemption,
      isUndone: event.isUndone,
      team1CupsRemaining: event.team1CupsRemaining,
      team2CupsRemaining: event.team2CupsRemaining,
      // gameState removed - too large, can be reconstructed from events
    };

    // Only add bounceGroupId if it is explicitly defined and not null
    if (event.bounceGroupId !== undefined && event.bounceGroupId !== null) {
      madeShot.bounceGroupId = event.bounceGroupId;
    }

    // Use eventId as document ID for direct lookup (no query needed)
    const madeShotsRef = collection(db, 'made_shots');
    const shotRef = doc(madeShotsRef, event.eventId);
    await setDoc(shotRef, madeShot);

    console.log('Made shot saved to Firestore:', event.eventId, 'matchId:', matchId);
    return true;
  } catch (error) {
    console.error('Error saving made shot:', error);
    console.error('Event details:', { eventId: event.eventId, matchId, cupId: event.cupId });
    return false;
  }
};

/**
 * Saves multiple game events in a batch
 * Uses Firestore batch writes for efficiency (up to 500 operations)
 */
export const saveGameEvents = async (
  matchId: string,
  events: GameEvent[]
): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, events not saved');
    return false;
  }

  try {
    const { writeBatch } = await import('firebase/firestore');
    const madeShotsRef = collection(db, 'made_shots');
    const batch = writeBatch(db);
    
    // Firestore batch limit is 500 operations
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchEvents = events.slice(i, i + batchSize);
      
      batchEvents.forEach(event => {
        const isRedemption = event.team1CupsRemaining === 0 || event.team2CupsRemaining === 0;
        const madeShot: MadeShotDocument = {
          shotId: event.eventId,
          matchId,
          playerHandle: event.playerHandle || '',
          cupIndex: event.cupId,
          timestamp: event.timestamp,
          isBounce: event.isBounce,
          isGrenade: event.isGrenade,
          isRedemption,
          isUndone: event.isUndone,
          team1CupsRemaining: event.team1CupsRemaining,
          team2CupsRemaining: event.team2CupsRemaining,
        };
        
        // Only add bounceGroupId if it is explicitly defined and not null
        if (event.bounceGroupId !== undefined && event.bounceGroupId !== null) {
          madeShot.bounceGroupId = event.bounceGroupId;
        }
        
        const shotRef = doc(madeShotsRef, event.eventId);
        batch.set(shotRef, madeShot);
      });
      
      batches.push(batch.commit());
    }

    await Promise.all(batches);
    console.log(`Saved ${events.length} made shots to Firestore`);
    return true;
  } catch (error) {
    console.error('Error saving made shots:', error);
    return false;
  }
};

/**
 * Marks a match as completed
 * Updates match with end time and winning side
 */
export const completeMatch = async (
  matchId: string, 
  winningSide: 0 | 1
): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, match completion not saved');
    return false;
  }

  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      completed: true,
      endedAt: serverTimestamp(),
      winningSide,
    });

    console.log('Match marked as completed:', matchId);
    return true;
  } catch (error) {
    console.error('Error completing match:', error);
    return false;
  }
};

/**
 * Updates a made shot's isUndone flag (for undo functionality)
 * 
 * OPTIMIZED: Uses eventId as document ID for direct lookup (no query needed)
 */
export const markEventAsUndone = async (
  eventId: string
): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, undo not saved');
    return false;
  }

  try {
    // Direct lookup using eventId as document ID (much faster than query)
    const madeShotsRef = collection(db, 'made_shots');
    const shotRef = doc(madeShotsRef, eventId);
    
    await updateDoc(shotRef, {
      isUndone: true,
    });

    console.log('Made shot marked as undone:', eventId);
    return true;
  } catch (error) {
    console.error('Error marking made shot as undone:', error);
    return false;
  }
};
