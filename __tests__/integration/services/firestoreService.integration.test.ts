/**
 * Firestore Service Integration Tests
 * 
 * Phase 1 Test:
 * - AUTO-DATA-IT-01: useGameState + Firestore match creation
 */

import { createMatch } from '../../../src/services/firestoreService';
import { GameType, CupCount, Player } from '../../../src/types/game';
import { mockFirestore } from '../../__mocks__/firebase';

// Mock Firebase
jest.mock('../../../src/services/firebase', () => ({
  db: mockFirestore,
}));

describe('Firestore Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTO-DATA-IT-01: useGameState + Firestore match creation', () => {
    it('should create match document when game state is initialized', async () => {
      const gameType: GameType = '1v1';
      const cupCount: CupCount = 6;
      const team1Players: Player[] = [{ id: '1', handle: 'Player1' }];
      const team2Players: Player[] = [{ id: '2', handle: 'Player2' }];

      mockFirestore.doc.mockReturnValue({
        id: 'match_123',
      });
      mockFirestore.setDoc.mockResolvedValue(undefined);
      mockFirestore.serverTimestamp.mockReturnValue({ seconds: Date.now() / 1000, nanoseconds: 0 });

      const matchId = await createMatch(gameType, cupCount, team1Players, team2Players);

      expect(matchId).toBeTruthy();
      expect(mockFirestore.setDoc).toHaveBeenCalled();
      
      // Verify match document structure
      const setDocCall = mockFirestore.setDoc.mock.calls[0];
      const matchData = setDocCall[1];
      
      expect(matchData.rulesConfig).toEqual({
        cupCount: 6,
        gameType: '1v1',
      });
      expect(matchData.participants).toHaveLength(2);
      expect(matchData.completed).toBe(false);
    });

    it('should handle offline mode gracefully', async () => {
      // Mock db as null (offline)
      const { db } = require('../../../src/services/firebase');
      const originalDb = db;
      
      // Temporarily set db to null
      require('../../../src/services/firebase').db = null;

      const matchId = await createMatch('1v1', 6, [{ id: '1', handle: 'P1' }], [{ id: '2', handle: 'P2' }]);

      expect(matchId).toBeNull(); // Should return null in offline mode

      // Restore db
      require('../../../src/services/firebase').db = originalDb;
    });
  });
});

