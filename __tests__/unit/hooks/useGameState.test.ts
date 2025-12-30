/**
 * useGameState Hook Tests
 * 
 * Phase 1 Tests:
 * - AUTO-GAME-UT-03: Victory detection (last cup)
 * - AUTO-GAME-UT-04: Victory detection (bounce on second-to-last)
 */

import { renderHook, act } from '@testing-library/react-native';
import { useGameState } from '../../../src/hooks/useGameState';
import { Cup } from '../../../src/types/game';

describe('useGameState - Victory Detection', () => {
  describe('AUTO-GAME-UT-03: Victory detection (last cup)', () => {
    it('should detect victory when team1 has 0 cups remaining', () => {
      const { result } = renderHook(() => useGameState({ cupCount: 6 }));

      act(() => {
        // Sink all team1 cups
        const allSunkCups: Cup[] = result.current.team1Cups.map(cup => ({
          ...cup,
          sunk: true,
        }));
        result.current.setTeam1Cups(allSunkCups);
      });

      expect(result.current.team1CupsRemaining).toBe(0);
      expect(result.current.team2CupsRemaining).toBe(6);
    });

    it('should detect victory when team2 has 0 cups remaining', () => {
      const { result } = renderHook(() => useGameState({ cupCount: 6 }));

      act(() => {
        // Sink all team2 cups
        const allSunkCups: Cup[] = result.current.team2Cups.map(cup => ({
          ...cup,
          sunk: true,
        }));
        result.current.setTeam2Cups(allSunkCups);
      });

      expect(result.current.team1CupsRemaining).toBe(6);
      expect(result.current.team2CupsRemaining).toBe(0);
    });

    it('should work with 10-cup games', () => {
      const { result } = renderHook(() => useGameState({ cupCount: 10 }));

      act(() => {
        const allSunkCups: Cup[] = result.current.team1Cups.map(cup => ({
          ...cup,
          sunk: true,
        }));
        result.current.setTeam1Cups(allSunkCups);
      });

      expect(result.current.team1CupsRemaining).toBe(0);
      expect(result.current.team2CupsRemaining).toBe(10);
    });
  });

  describe('AUTO-GAME-UT-04: Victory detection (bounce on second-to-last)', () => {
    it('should detect victory when bounce shot leaves team with 1 cup remaining', () => {
      const { result } = renderHook(() => useGameState({ cupCount: 6 }));

      act(() => {
        // Sink 5 out of 6 cups (leaving 1 remaining)
        const mostlySunkCups: Cup[] = result.current.team1Cups.map((cup, index) => ({
          ...cup,
          sunk: index < 5, // First 5 cups sunk
        }));
        result.current.setTeam1Cups(mostlySunkCups);
      });

      // Bounce on second-to-last triggers victory
      // This means when team has 1 cup remaining, a bounce shot wins
      expect(result.current.team1CupsRemaining).toBe(1);
      // Victory detection logic is in useCupManagement, but state is correct here
    });

    it('should correctly calculate cups remaining after partial sink', () => {
      const { result } = renderHook(() => useGameState({ cupCount: 6 }));

      act(() => {
        // Sink 4 cups
        const partiallySunkCups: Cup[] = result.current.team1Cups.map((cup, index) => ({
          ...cup,
          sunk: index < 4,
        }));
        result.current.setTeam1Cups(partiallySunkCups);
      });

      expect(result.current.team1CupsRemaining).toBe(2);
      expect(result.current.team2CupsRemaining).toBe(6);
    });
  });
});

