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
  updateDoc,
  serverTimestamp,
  Firestore,
  CollectionReference,
  DocumentReference,
  Timestamp,
  query,
  where,
  getDocs,
  getDoc,
  limit as limitQuery,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { GameEvent, GameType, CupCount, Player } from '../types/game';

export interface MatchDocument {
  // Document ID is matchId (not stored as field)
  tournamentId?: string | null;
  rulesConfig: {
    cupCount: CupCount;
    gameType: GameType;
  };
  participants: Array<{
    userId?: string;
    handle: string;
    side: 0 | 1; // 0 = team1, 1 = team2
  }>;
  startedAt: ReturnType<typeof serverTimestamp> | Timestamp;
  endedAt?: ReturnType<typeof serverTimestamp> | Timestamp;
  durationSeconds?: number;
  winningSide?: 0 | 1; // Only set when match completes
  team1Score?: number;
  team2Score?: number;
  completed: boolean; // false = DNF (did not finish / abandoned)
}

export interface MadeShotDocument {
  // Document ID is shotId (same as eventId)
  shotId: string;
  matchId: string;
  userId?: string;
  playerHandle: string;
  cupIndex: number; // Standard cup mapping (0-9 for 10-cup, 0-5 for 6-cup)
  timestamp: number;
  isBounce: boolean;
  isGrenade: boolean;
  isRedemption: boolean;
  isUndone: boolean; // Soft-delete flag preserves analytics history
  bounceGroupId?: string;
  grenadeGroupId?: string;
  team1CupsRemaining: number;
  team2CupsRemaining: number;
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
    // Include userId if available
    const participants = [
      ...team1Players.map(p => ({ 
        handle: p.handle,
        userId: p.userId, // Include userId if player is logged in
        side: 0 as const, // team1 = side 0
      })),
      ...team2Players.map(p => ({ 
        handle: p.handle,
        userId: p.userId, // Include userId if player is logged in
        side: 1 as const, // team2 = side 1
      })),
    ];
    
    const matchData: MatchDocument = {
      tournamentId: null,
      rulesConfig: {
        cupCount,
        gameType,
      },
      participants,
      startedAt: serverTimestamp(),
      completed: false,
    };

    const matchRef = doc(db, 'matches', matchId);
    await setDoc(matchRef, matchData);

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
    const isRedemption = event.team1CupsRemaining === 0 || event.team2CupsRemaining === 0;
    
    const madeShot: MadeShotDocument = {
      shotId: event.eventId,
      matchId,
      playerHandle: event.playerHandle || '',
      userId: event.userId,
      cupIndex: event.cupId,
      timestamp: event.timestamp,
      isBounce: event.isBounce,
      isGrenade: event.isGrenade,
      isRedemption,
      isUndone: event.isUndone,
      team1CupsRemaining: event.team1CupsRemaining,
      team2CupsRemaining: event.team2CupsRemaining,
    };
    if (event.bounceGroupId !== undefined && event.bounceGroupId !== null) {
      madeShot.bounceGroupId = event.bounceGroupId;
    }

      if (event.grenadeGroupId !== undefined && event.grenadeGroupId !== null) {
        madeShot.grenadeGroupId = event.grenadeGroupId;
      }

      const madeShotsRef = collection(db, 'made_shots');
    const shotRef = doc(madeShotsRef, event.eventId);
    await setDoc(shotRef, madeShot);

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
          userId: event.userId, // Include userId if player is logged in
          cupIndex: event.cupId,
          timestamp: event.timestamp,
          isBounce: event.isBounce,
          isGrenade: event.isGrenade,
          isRedemption,
          isUndone: event.isUndone,
          team1CupsRemaining: event.team1CupsRemaining,
          team2CupsRemaining: event.team2CupsRemaining,
        };
        
        if (event.bounceGroupId !== undefined && event.bounceGroupId !== null) {
          madeShot.bounceGroupId = event.bounceGroupId;
        }

        if (event.grenadeGroupId !== undefined && event.grenadeGroupId !== null) {
          madeShot.grenadeGroupId = event.grenadeGroupId;
        }
        
        const shotRef = doc(madeShotsRef, event.eventId);
        batch.set(shotRef, madeShot);
      });
      
      batches.push(batch.commit());
    }

    await Promise.all(batches);
    return true;
  } catch (error) {
    console.error('Error saving made shots:', error);
    return false;
  }
};

/**
 * Marks a match as completed
 * Updates match with end time, winning side, and final scores
 * Also updates user stats summaries (incrementally)
 */
export const completeMatch = async (
  matchId: string, 
  winningSide: 0 | 1,
  team1Score: number,
  team2Score: number
): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, match completion not saved');
    return false;
  }

  try {
    const matchRef = doc(db, 'matches', matchId);
    
    // Get match data first to calculate stats
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) {
      console.error('Match not found:', matchId);
      return false;
    }
    
    const matchData = matchDoc.data() as MatchDocument;
    
    // Calculate match duration
    const startedAt = matchData.startedAt;
    const now = Date.now();
    let durationSeconds = 0;
    
    if (startedAt) {
      let startTime: number;
      if (startedAt instanceof Timestamp) {
        startTime = startedAt.toMillis();
      } else if (typeof startedAt === 'number') {
        startTime = startedAt;
      } else {
        // Fallback for server timestamp placeholder (should resolve in production)
        startTime = now - 600000;
      }
      durationSeconds = Math.floor((now - startTime) / 1000);
    }
    await updateDoc(matchRef, {
      completed: true,
      endedAt: serverTimestamp(),
      durationSeconds,
      winningSide,
      team1Score,
      team2Score,
    });

    const matchDataWithDuration = { ...matchData, completed: true, durationSeconds };
    
    updateUserStatsForCompletedMatch(matchId, matchDataWithDuration, winningSide).catch(err => {
      console.error('Error updating user stats (non-blocking):', err);
    });

    return true;
  } catch (error) {
    console.error('Error completing match:', error);
    return false;
  }
};

export interface BaseStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalCupsSunk: number;
  bounceShots: number;
  grenadesSunk: number;
  totalMatchDurationSeconds: number;
  gamesWithDuration: number;
}

const createEmptyStats = (): BaseStats => ({
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  totalCupsSunk: 0,
  bounceShots: 0,
  grenadesSunk: 0,
  totalMatchDurationSeconds: 0, // Total duration across all matches in seconds
  gamesWithDuration: 0, // Count of games that have duration data
});

/**
 * Updates user stats summary documents when a match completes
 * Implements Summary Document pattern for OLAP-style analytics
 */
const updateUserStatsForCompletedMatch = async (
  matchId: string,
  matchData: MatchDocument,
  winningSide: 0 | 1
): Promise<void> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot update user stats');
    return;
  }

  if (!matchData.completed) {
    console.warn(`Match ${matchId} is not completed, skipping stats update`);
    return;
  }

  try {
    const madeShotsRef = collection(db, 'made_shots');
    const shotQuery = query(
      madeShotsRef,
      where('matchId', '==', matchId),
      where('isUndone', '==', false)
    );
    const shotSnapshots = await getDocs(shotQuery);
    const matchShots = shotSnapshots.docs.map(doc => doc.data() as MadeShotDocument);

    const shotsByUserId = new Map<string, MadeShotDocument[]>();
    matchShots.forEach(shot => {
      if (shot.userId) {
        const existing = shotsByUserId.get(shot.userId) || [];
        existing.push(shot);
        shotsByUserId.set(shot.userId, existing);
      }
    });

    // Get user handles
    if (!db) return;
    const userIds = Array.from(shotsByUserId.keys());
    const userHandleMap = new Map<string, string>();
    const firestoreDb = db; // Narrow type for TypeScript
    await Promise.all(
      userIds.map(async (uid) => {
        const userDoc = await getDoc(doc(firestoreDb, 'users', uid));
        if (userDoc.exists()) {
          userHandleMap.set(uid, userDoc.data().handle as string);
        }
      })
    );

    const gameType = matchData.rulesConfig.gameType;
    const cupCount = matchData.rulesConfig.cupCount;
    const comboKey = `${gameType}_${cupCount}` as keyof UserStatsSummaryDocument['byGameTypeAndCupCount'];

    const updatePromises = matchData.participants
      .filter(p => p.userId)
      .map(async (participant) => {
        if (!db) return;
        const userId = participant.userId!;
        const userTeam = participant.side;
        const isWinner = winningSide === userTeam;
        const userShots = shotsByUserId.get(userId) || [];

        // Calculate user's shot stats for this match
        const cupsSunk = userShots.length;
        const bounceShots = userShots.filter(s => s.isBounce).length;
        const grenades = userShots.filter(s => s.isGrenade).length;

        // Get or create user stats document
        const userStatsRef = doc(db, 'user_stats', userId);
        const userStatsDoc = await getDoc(userStatsRef);

        let statsData: UserStatsSummaryDocument;
        
        if (userStatsDoc.exists()) {
          const existing = userStatsDoc.data() as UserStatsSummaryDocument;
          // Ensure all required fields exist
          statsData = {
            ...existing,
            overall: existing.overall || createEmptyStats(),
            byGameType: existing.byGameType || {
              '1v1': createEmptyStats(),
              '2v2': createEmptyStats(),
            },
            byCupCount: existing.byCupCount || {
              '6': createEmptyStats(),
              '10': createEmptyStats(),
            },
            byGameTypeAndCupCount: existing.byGameTypeAndCupCount || {
              '1v1_6': createEmptyStats(),
              '1v1_10': createEmptyStats(),
              '2v2_6': createEmptyStats(),
              '2v2_10': createEmptyStats(),
            },
          };
        } else {
          // Initialize new stats document
          statsData = {
            userId,
            handle: userHandleMap.get(userId) || 'Unknown',
            lastUpdated: serverTimestamp(),
            overall: createEmptyStats(),
            byGameType: {
              '1v1': createEmptyStats(),
              '2v2': createEmptyStats(),
            },
            byCupCount: {
              '6': createEmptyStats(),
              '10': createEmptyStats(),
            },
            byGameTypeAndCupCount: {
              '1v1_6': createEmptyStats(),
              '1v1_10': createEmptyStats(),
              '2v2_6': createEmptyStats(),
              '2v2_10': createEmptyStats(),
            },
          };
        }

        const matchDurationValue = matchData.durationSeconds || 0;

        const incrementStats = (stats: BaseStats): void => {
          stats.gamesPlayed += 1;
          if (isWinner) stats.wins += 1;
          else stats.losses += 1;
          stats.totalCupsSunk += cupsSunk;
          stats.bounceShots += bounceShots;
          stats.grenadesSunk += grenades;
          if (matchDurationValue > 0) {
            stats.totalMatchDurationSeconds = (stats.totalMatchDurationSeconds || 0) + matchDurationValue;
            stats.gamesWithDuration = (stats.gamesWithDuration || 0) + 1;
          }
        };

        incrementStats(statsData.overall);
        incrementStats(statsData.byGameType[gameType]);
        incrementStats(statsData.byCupCount[cupCount.toString() as '6' | '10']);
        incrementStats(statsData.byGameTypeAndCupCount[comboKey]);

        statsData.lastUpdated = serverTimestamp();
        statsData.handle = userHandleMap.get(userId) || statsData.handle || 'Unknown';

        await setDoc(userStatsRef, statsData, { merge: true });
        const userTeamParticipants = matchData.participants.filter(
          p => p.side === userTeam && p.userId
        );
        
        const partnerMatchDuration = matchData.durationSeconds || 0;
        
        if (userTeamParticipants.length === 1) {
          await updatePartnerStats(userId, 'solo', isWinner, cupsSunk, bounceShots, grenades, partnerMatchDuration);
        } else if (userTeamParticipants.length === 2) {
          const partner = userTeamParticipants.find(p => p.userId !== userId);
          if (partner?.userId) {
            await updatePartnerStats(userId, partner.userId, isWinner, cupsSunk, bounceShots, grenades, partnerMatchDuration);
            const partnerShots = shotsByUserId.get(partner.userId) || [];
            const partnerCupsSunk = partnerShots.length;
            const partnerBounceShots = partnerShots.filter(s => s.isBounce).length;
            const partnerGrenades = partnerShots.filter(s => s.isGrenade).length;
            await updatePartnerStats(partner.userId, userId, isWinner, partnerCupsSunk, partnerBounceShots, partnerGrenades, partnerMatchDuration);
          }
        }
      });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating user stats for completed match:', error);
    throw error;
  }
};

/**
 * Updates partner-specific stats in subcollection
 */
const updatePartnerStats = async (
  userId: string,
  partnerId: string,
  isWinner: boolean,
  cupsSunk: number,
  bounceShots: number,
  grenades: number,
  matchDuration: number = 0
): Promise<void> => {
  if (!db) return;

  try {
    const partnerStatsRef = doc(db, 'user_stats', userId, 'partners', partnerId);
    const partnerStatsDoc = await getDoc(partnerStatsRef);

    const stats = partnerStatsDoc.exists()
      ? partnerStatsDoc.data()
      : createEmptyStats();

    const partnerStatsData = {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      wins: isWinner ? (stats.wins || 0) + 1 : (stats.wins || 0),
      losses: isWinner ? (stats.losses || 0) : (stats.losses || 0) + 1,
      totalCupsSunk: (stats.totalCupsSunk || 0) + cupsSunk,
      bounceShots: (stats.bounceShots || 0) + bounceShots,
      grenadesSunk: (stats.grenadesSunk || 0) + grenades,
      totalMatchDurationSeconds: matchDuration > 0 ? (stats.totalMatchDurationSeconds || 0) + matchDuration : (stats.totalMatchDurationSeconds || 0),
      gamesWithDuration: matchDuration > 0 ? (stats.gamesWithDuration || 0) + 1 : (stats.gamesWithDuration || 0),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(partnerStatsRef, partnerStatsData, { merge: true });
  } catch (error) {
    console.error('Error updating partner stats:', error);
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

    return true;
  } catch (error) {
    console.error('Error marking made shot as undone:', error);
    return false;
  }
};

/**
 * Stats filter options
 */
export interface StatsFilter {
  gameType?: GameType; // '1v1' | '2v2'
  cupCount?: CupCount; // 6 | 10
  partnerUserId?: string | null; // null = solo games only, undefined = all games
}

/**
 * User statistics result
 */
export interface UserStats {
  userId: string;
  handle: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  averageCupsSunkPerGame: number;
  averageCupsSunkPercentage: number;
  totalCupsSunk: number;
  bounceShots: number;
  bounceShotsPercentage: number;
  grenadesSunk: number;
  averageMatchDurationSeconds: number; // Average match duration in seconds
  isAnonymous?: boolean; // Whether user is anonymous/guest
}

/**
 * Summary statistics document stored in user_stats collection
 * Pre-computed aggregates for fast OLAP-style queries
 */
export interface UserStatsSummaryDocument {
  userId: string;
  handle: string;
  lastUpdated: ReturnType<typeof serverTimestamp> | Timestamp;
  
  overall: BaseStats;
  
  byGameType: {
    '1v1': BaseStats;
    '2v2': BaseStats;
  };
  
  byCupCount: {
    '6': BaseStats;
    '10': BaseStats;
  };
  
  byGameTypeAndCupCount: {
    '1v1_6': BaseStats;
    '1v1_10': BaseStats;
    '2v2_6': BaseStats;
    '2v2_10': BaseStats;
  };
}

/**
 * Get user statistics with optional filters
 * Reads from pre-computed summary documents for fast OLAP queries
 */
export const getUserStats = async (
  userId: string,
  filters?: StatsFilter
): Promise<UserStats | null> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot get user stats');
    return null;
  }

  try {
    // Get user stats summary document
    const userStatsRef = doc(db, 'user_stats', userId);
    const userStatsDoc = await getDoc(userStatsRef);

    if (!userStatsDoc.exists()) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const handle = userDoc.exists() ? (userDoc.data().handle as string) : 'Unknown';
      const isAnonymous = !userDoc.exists() || !handle || handle.trim() === '' || handle === 'Unknown';
      
      return {
        userId,
        handle: handle || 'Unknown',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winPercentage: 0,
        averageCupsSunkPerGame: 0,
        averageCupsSunkPercentage: 0,
        totalCupsSunk: 0,
        bounceShots: 0,
        bounceShotsPercentage: 0,
        grenadesSunk: 0,
        averageMatchDurationSeconds: 0,
        isAnonymous,
      };
    }

    const statsData = userStatsDoc.data() as UserStatsSummaryDocument;

    let baseStats: BaseStats;

    if (filters?.partnerUserId !== undefined) {
      const partnerId = filters.partnerUserId === null ? 'solo' : filters.partnerUserId;
      const partnerStatsRef = doc(db, 'user_stats', userId, 'partners', partnerId);
      const partnerStatsDoc = await getDoc(partnerStatsRef);
      
      if (!partnerStatsDoc.exists()) {
        baseStats = createEmptyStats();
      } else {
        baseStats = partnerStatsDoc.data() as BaseStats;
      }
    } else if (filters?.gameType && filters?.cupCount) {
      const comboKey = `${filters.gameType}_${filters.cupCount}` as keyof typeof statsData.byGameTypeAndCupCount;
      baseStats = statsData.byGameTypeAndCupCount[comboKey] || createEmptyStats();
    } else if (filters?.gameType) {
      baseStats = statsData.byGameType[filters.gameType] || createEmptyStats();
    } else if (filters?.cupCount) {
      baseStats = statsData.byCupCount[filters.cupCount.toString() as '6' | '10'] || createEmptyStats();
    } else {
      baseStats = statsData.overall;
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const handle = userData?.handle;
    const isAnonymous = !userDoc.exists() || !handle || handle.trim() === '' || handle === 'Unknown';

    const gamesPlayed = baseStats.gamesPlayed;
    const wins = baseStats.wins;
    const losses = baseStats.losses;
    const winPercentage = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
    const averageCupsSunkPerGame = gamesPlayed > 0 ? baseStats.totalCupsSunk / gamesPlayed : 0;
    
    const estimatedCupCount = filters?.cupCount || 10;
    const totalPossibleCups = gamesPlayed * estimatedCupCount;
    const averageCupsSunkPercentage = totalPossibleCups > 0
      ? (baseStats.totalCupsSunk / totalPossibleCups) * 100
      : 0;
    
    const bounceShotsPercentage = baseStats.totalCupsSunk > 0
      ? (baseStats.bounceShots / baseStats.totalCupsSunk) * 100
      : 0;

    const gamesWithDuration = baseStats.gamesWithDuration || 0;
    const averageMatchDurationSeconds = gamesWithDuration > 0
      ? (baseStats.totalMatchDurationSeconds || 0) / gamesWithDuration
      : 0;

    return {
      userId,
      handle: statsData.handle || 'Unknown',
      gamesPlayed,
      wins,
      losses,
      winPercentage,
      averageCupsSunkPerGame,
      averageCupsSunkPercentage,
      totalCupsSunk: baseStats.totalCupsSunk,
      bounceShots: baseStats.bounceShots,
      bounceShotsPercentage,
      grenadesSunk: baseStats.grenadesSunk,
      averageMatchDurationSeconds,
      isAnonymous,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};

/**
 * Leaderboard sort options
 */
export type LeaderboardSortOption =
  | 'wins'
  | 'winPercentage'
  | 'totalCupsSunk'
  | 'cupsPerGame'
  | 'totalBounceShots'
  | 'bounceShotPercentage';

/**
 * Get leaderboard statistics for all users with optional filters
 * Returns top users sorted by specified option
 */
export const getLeaderboardStats = async (
  filters?: StatsFilter,
  sortBy: LeaderboardSortOption = 'winPercentage',
  limit: number = 50
): Promise<UserStats[]> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot get leaderboard');
    return [];
  }

  try {
    const firestoreDb = db; // Narrow type for TypeScript
    
    const userStatsRef = collection(firestoreDb, 'user_stats');
    const userStatsSnapshots = await getDocs(userStatsRef);

    // Filter out anonymous users by checking handles
    const userIds = userStatsSnapshots.docs.map(doc => doc.id);
    const userHandlesMap = new Map<string, string>();
    
    await Promise.all(
      userIds.map(async (uid) => {
        const userDoc = await getDoc(doc(firestoreDb, 'users', uid));
        if (userDoc.exists()) {
          const handle = userDoc.data().handle;
          if (handle && handle.trim() !== '' && handle !== 'Unknown') {
            userHandlesMap.set(uid, handle);
          }
        }
      })
    );
    
    const userStatsPromises = userStatsSnapshots.docs
      .filter(userDoc => userHandlesMap.has(userDoc.id))
      .map(async (userDoc) => {
        const userId = userDoc.id;
        
        if (filters?.partnerUserId !== undefined) {
          const partnerId = filters.partnerUserId === null ? 'solo' : filters.partnerUserId;
          const partnerStatsRef = doc(firestoreDb, 'user_stats', userId, 'partners', partnerId);
          const partnerStatsDoc = await getDoc(partnerStatsRef);
          
          const partnerData = partnerStatsDoc.data();
          if (!partnerStatsDoc.exists() || (partnerData && typeof partnerData === 'object' && 'gamesPlayed' in partnerData && partnerData.gamesPlayed === 0)) {
            return null;
          }
        }
        
        return getUserStats(userId, filters);
      });

    const userStatsResults = await Promise.all(userStatsPromises);
    
    const leaderboard = userStatsResults
      .filter((stats): stats is UserStats => 
        stats !== null && 
        stats.gamesPlayed > 0 && 
        !stats.isAnonymous
      )
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'wins':
            comparison = b.wins - a.wins;
            break;
          case 'winPercentage':
            comparison = b.winPercentage - a.winPercentage;
            break;
          case 'totalCupsSunk':
            comparison = b.totalCupsSunk - a.totalCupsSunk;
            break;
          case 'cupsPerGame':
            comparison = b.averageCupsSunkPerGame - a.averageCupsSunkPerGame;
            break;
          case 'totalBounceShots':
            comparison = b.bounceShots - a.bounceShots;
            break;
          case 'bounceShotPercentage':
            comparison = b.bounceShotsPercentage - a.bounceShotsPercentage;
            break;
        }
        if (comparison === 0) {
          comparison = b.wins - a.wins;
        }
        if (comparison === 0) {
          comparison = a.handle.localeCompare(b.handle);
        }
        
        return comparison;
      })
      .slice(0, limit);

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard stats:', error);
    return [];
  }
};

/**
 * Match history entry
 */
export interface MatchHistoryEntry {
  matchId: string;
  gameType: GameType;
  cupCount: CupCount;
  opponentHandles: string[]; // Opponent team handles
  partnerHandle?: string; // Partner handle if 2v2
  result: 'win' | 'loss';
  userCupsSunk: number;
  opponentCupsSunk: number;
  durationSeconds: number;
  completedAt: Timestamp | null;
}

/**
 * Get match history for a user
 * Returns completed matches ordered by completion date (newest first)
 */
export const getUserMatchHistory = async (
  userId: string,
  limit: number = 50
): Promise<MatchHistoryEntry[]> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot get match history');
    return [];
  }

  try {
    // Sort in memory to avoid index requirement
    const matchesRef = collection(db, 'matches');
    const matchQuery = query(
      matchesRef,
      where('completed', '==', true)
      // Note: Removed orderBy to avoid index requirement - we'll sort in memory
    );

    const matchSnapshots = await getDocs(matchQuery);
    let matches = matchSnapshots.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as MatchDocument
      }))
      .filter(match => {
        // Filter to matches where user participated
        return match.participants.some(p => p.userId === userId);
      })
      // Sort by endedAt in memory (newest first)
      .sort((a, b) => {
        const aTime = a.endedAt ? (a.endedAt instanceof Timestamp ? a.endedAt.toMillis() : 0) : 0;
        const bTime = b.endedAt ? (b.endedAt instanceof Timestamp ? b.endedAt.toMillis() : 0) : 0;
        return bTime - aTime; // Descending
      })
      .slice(0, limit);

    const matchIds = matches.map(m => m.id);
    const madeShotsRef = collection(db, 'made_shots');
    
    // Firestore 'in' queries limited to 10 items - batch accordingly
    const shotQueries = [];
    for (let i = 0; i < matchIds.length; i += 10) {
      const batch = matchIds.slice(i, i + 10);
      shotQueries.push(
        query(
          madeShotsRef,
          where('matchId', 'in', batch),
          where('userId', '==', userId),
          where('isUndone', '==', false)
        )
      );
    }

    const shotSnapshots = await Promise.all(shotQueries.map(q => getDocs(q)));
    const allShots = shotSnapshots.flatMap(snapshot => 
      snapshot.docs.map(doc => doc.data() as MadeShotDocument)
    );

    // Group shots by matchId
    const shotsByMatchId = new Map<string, MadeShotDocument[]>();
    allShots.forEach(shot => {
      const existing = shotsByMatchId.get(shot.matchId) || [];
      existing.push(shot);
      shotsByMatchId.set(shot.matchId, existing);
    });

    const history: MatchHistoryEntry[] = [];

    for (const match of matches) {
      const userParticipants = match.participants.filter(p => p.userId === userId);
      if (userParticipants.length === 0) continue;

      const userTeam = userParticipants[0].side;
      const opponentTeam = userTeam === 0 ? 1 : 0;
      const isWinner = match.winningSide === userTeam;

      // Get opponent handles
      const opponentParticipants = match.participants.filter(p => p.side === opponentTeam);
      const opponentHandles = opponentParticipants.map(p => p.handle);

      // Get partner handle if 2v2
      const partnerParticipants = match.participants.filter(
        p => p.side === userTeam && p.userId !== userId
      );
      const partnerHandle = partnerParticipants.length > 0 ? partnerParticipants[0].handle : undefined;

      const userShots = shotsByMatchId.get(match.id) || [];
      const userCupsSunk = userShots.length;
      const opponentCupsSunk = isWinner
        ? (userTeam === 0 ? (match.team2Score || 0) : (match.team1Score || 0))
        : (userTeam === 0 ? (match.team2Score || 0) : (match.team1Score || 0));

      history.push({
        matchId: match.id,
        gameType: match.rulesConfig.gameType,
        cupCount: match.rulesConfig.cupCount,
        opponentHandles,
        partnerHandle,
        result: isWinner ? 'win' : 'loss',
        userCupsSunk,
        opponentCupsSunk,
        durationSeconds: match.durationSeconds || 0,
        completedAt: match.endedAt ? (match.endedAt instanceof Timestamp ? match.endedAt : null) : null,
      });
    }

    return history;
  } catch (error) {
    console.error('Error getting user match history:', error);
    return [];
  }
};

/**
 * Recalculates user stats from all match history
 * Backfills stats for users who had matches before stats tracking was implemented
 */
export const recalculateUserStats = async (userId: string): Promise<boolean> => {
  if (!db) {
    console.warn('Firestore not initialized, cannot recalculate stats');
    return false;
  }

  try {
    const matchesRef = collection(db, 'matches');
    const matchQuery = query(
      matchesRef,
      where('completed', '==', true)
    );

    const matchSnapshots = await getDocs(matchQuery);
    const allMatches = matchSnapshots.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as MatchDocument
    }));

    const userMatches = allMatches.filter(match => 
      match.completed === true && match.participants.some(p => p.userId === userId)
    );

    if (userMatches.length === 0) {
      return true;
    }

    // Rebuild stats from scratch
    const userStatsRef = doc(db, 'user_stats', userId);
    const userStatsDoc = await getDoc(userStatsRef);
    
    if (userStatsDoc.exists()) {
      if (!db) return false;
      const { deleteDoc } = await import('firebase/firestore');
      const firestoreDb = db;
      const partnersRef = collection(firestoreDb, 'user_stats', userId, 'partners');
      const partnersSnap = await getDocs(partnersRef);
      const deletePromises = partnersSnap.docs.map(d => deleteDoc(doc(firestoreDb, 'user_stats', userId, 'partners', d.id)));
      await Promise.all(deletePromises);
    }

    // Process matches in batches
    const batchSize = 10;
    for (let i = 0; i < userMatches.length; i += batchSize) {
      const batch = userMatches.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (match) => {
          if (!match.completed || match.winningSide === undefined) {
            return;
          }

          await updateUserStatsForCompletedMatch(match.id, match, match.winningSide);
        })
      );
    }

    return true;
  } catch (error) {
    console.error('Error recalculating user stats:', error);
    return false;
  }
};
