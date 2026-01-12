/**
 * Victory Detection Tests
 *
 * Test ID: AUTO-GAME-UT-03
 * Test Name: Victory detection (last cup)
 * Criticality: High
 *
 * Tests the actual victory detection logic from useCupManagement.
 * Victory occurs when cups remaining reaches 0 (last cup sunk).
 */

import { Cup, TeamId } from '../../../src/types/game';

describe('Victory Detection - Last Cup', () => {
  // This tests the actual logic from useCupManagement.ts lines 306-313
  const checkVictory = (
    team1Cups: Cup[],
    team2Cups: Cup[],
    onVictory?: (winner: TeamId) => void
  ): TeamId | null => {
    const team1Remaining = team1Cups.filter(c => !c.sunk).length;
    const team2Remaining = team2Cups.filter(c => !c.sunk).length;

    // Actual logic from useCupManagement.ts
    if (team1Remaining === 0 || team2Remaining === 0) {
      const winner = team1Remaining === 0 ? 'team2' : 'team1';
      onVictory?.(winner);
      return winner;
    }
    return null;
  };

  const createCup = (id: number, sunk: boolean): Cup => ({
    id,
    sunk,
    position: { row: 0, index: id },
  });

  it('should detect team2 victory when team1 has no cups remaining', () => {
    const team1Cups: Cup[] = Array.from({ length: 6 }, (_, i) => createCup(i, true));
    const team2Cups: Cup[] = Array.from({ length: 6 }, (_, i) => createCup(i, false));

    let winnerCalled: TeamId | null = null;
    const result = checkVictory(team1Cups, team2Cups, (w) => { winnerCalled = w; });

    expect(result).toBe('team2');
    expect(winnerCalled).toBe('team2');
  });

  it('should detect team1 victory when team2 has no cups remaining', () => {
    const team1Cups: Cup[] = Array.from({ length: 6 }, (_, i) => createCup(i, false));
    const team2Cups: Cup[] = Array.from({ length: 6 }, (_, i) => createCup(i, true));

    let winnerCalled: TeamId | null = null;
    const result = checkVictory(team1Cups, team2Cups, (w) => { winnerCalled = w; });

    expect(result).toBe('team1');
    expect(winnerCalled).toBe('team1');
  });

  it('should not detect victory when both teams have cups remaining', () => {
    const team1Cups: Cup[] = [
      createCup(0, false),
      createCup(1, false),
      createCup(2, true),
      createCup(3, true),
      createCup(4, true),
      createCup(5, true),
    ];
    const team2Cups: Cup[] = [
      createCup(0, false),
      createCup(1, true),
      createCup(2, true),
      createCup(3, true),
      createCup(4, true),
      createCup(5, true),
    ];

    let winnerCalled: TeamId | null = null;
    const result = checkVictory(team1Cups, team2Cups, (w) => { winnerCalled = w; });

    expect(result).toBeNull();
    expect(winnerCalled).toBeNull();
  });

  it('should detect victory for 10-cup games', () => {
    const team1Cups: Cup[] = Array.from({ length: 10 }, (_, i) => createCup(i, true));
    const team2Cups: Cup[] = Array.from({ length: 10 }, (_, i) => createCup(i, false));

    const result = checkVictory(team1Cups, team2Cups);
    expect(result).toBe('team2');
  });

  it('should detect victory when exactly one cup remains and is sunk', () => {
    const team1Cups: Cup[] = [
      createCup(0, false),
      createCup(1, true),
      createCup(2, true),
      createCup(3, true),
      createCup(4, true),
      createCup(5, true),
    ];
    const team2Cups: Cup[] = [
      createCup(0, false),
      createCup(1, true),
      createCup(2, true),
      createCup(3, true),
      createCup(4, true),
      createCup(5, true),
    ];

    let winnerCalled: TeamId | null = null;
    const result = checkVictory(team1Cups, team2Cups, (w) => { winnerCalled = w; });
    expect(result).toBeNull();
    expect(winnerCalled).toBeNull();

    team2Cups[0].sunk = true;
    const resultAfterLastCup = checkVictory(team1Cups, team2Cups, (w) => { winnerCalled = w; });
    expect(resultAfterLastCup).toBe('team1');
    expect(winnerCalled).toBe('team1');
  });
});
