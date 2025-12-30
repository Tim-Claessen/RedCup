/**
 * Hook Integration Tests
 * 
 * Phase 1 Tests:
 * - AUTO-GAME-IT-01: useCupManagement + useGameState integration
 * - AUTO-GAME-IT-05: GameScreen + useCupManagement + useGameState
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useCupManagement } from '../../../src/hooks/useCupManagement';
import { useGameState } from '../../../src/hooks/useGameState';
import { Player, GameType, CupCount } from '../../../src/types/game';

// Mock Firestore
jest.mock('../../../src/services/firebase', () => ({
  db: require('../../__mocks__/firebase').mockFirestore,
}));

jest.mock('../../../src/services/firestoreService', () => ({
  saveGameEvent: jest.fn(() => Promise.resolve(true)),
  markEventAsUndone: jest.fn(() => Promise.resolve()),
}));

describe('Hook Integration', () => {
  const mockTeam1Players: Player[] = [{ id: '1', handle: 'Player1' }];
  const mockTeam2Players: Player[] = [{ id: '2', handle: 'Player2' }];
  const gameType: GameType = '1v1';
  const cupCount: CupCount = 6;

  describe('AUTO-GAME-IT-01: useCupManagement + useGameState integration', () => {
    it('should sync cup state between hooks', () => {
      const { result: gameState } = renderHook(() => useGameState({ cupCount }));

      const { result: cupManagement } = renderHook(() =>
        useCupManagement({
          team1Cups: gameState.current.team1Cups,
          team2Cups: gameState.current.team2Cups,
          setTeam1Cups: gameState.current.setTeam1Cups,
          setTeam2Cups: gameState.current.setTeam2Cups,
          gameEvents: gameState.current.gameEvents,
          setGameEvents: gameState.current.setGameEvents,
          gameType,
          team1Players: mockTeam1Players,
          team2Players: mockTeam2Players,
          matchId: 'match_123',
          cupCount,
        })
      );

      act(() => {
        cupManagement.current.handleCupPress('team2', 0);
      });

      expect(cupManagement.current.selectedCup).toEqual({ side: 'team2', cupId: 0 });
      expect(gameState.current.team1CupsRemaining).toBe(6);
      expect(gameState.current.team2CupsRemaining).toBe(6);
    });

    it('should update game events when cup is sunk', () => {
      const { result: gameState } = renderHook(() => useGameState({ cupCount }));

      const { result: cupManagement } = renderHook(() =>
        useCupManagement({
          team1Cups: gameState.current.team1Cups,
          team2Cups: gameState.current.team2Cups,
          setTeam1Cups: gameState.current.setTeam1Cups,
          setTeam2Cups: gameState.current.setTeam2Cups,
          gameEvents: gameState.current.gameEvents,
          setGameEvents: gameState.current.setGameEvents,
          gameType,
          team1Players: mockTeam1Players,
          team2Players: mockTeam2Players,
          matchId: 'match_123',
          cupCount,
        })
      );

      act(() => {
        cupManagement.current.handleCupPress('team2', 0);
        cupManagement.current.handleSinkCup();
      });

      expect(gameState.current.gameEvents.length).toBeGreaterThan(0);
      expect(gameState.current.team2CupsRemaining).toBe(5);
    });
  });
});

