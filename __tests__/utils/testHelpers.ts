/**
 * Test Helpers
 * 
 * Utility functions for testing
 */

import { GameEvent, Cup, TeamId } from '../../src/types/game';

/**
 * Creates a mock game event
 */
export const createMockGameEvent = (overrides?: Partial<GameEvent>): GameEvent => {
  return {
    eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    cupId: 0,
    playerHandle: 'TestPlayer',
    isBounce: false,
    isGrenade: false,
    isUndone: false,
    team1CupsRemaining: 6,
    team2CupsRemaining: 6,
    gameState: {
      team1Cups: createMockCups(6, 'team1'),
      team2Cups: createMockCups(6, 'team2'),
    },
    ...overrides,
  };
};

/**
 * Creates mock cups array
 */
export const createMockCups = (count: number, side: TeamId, sunkCount: number = 0): Cup[] => {
  const cups: Cup[] = [];
  for (let i = 0; i < count; i++) {
    cups.push({
      id: i,
      sunk: i < sunkCount,
      position: { row: Math.floor(i / 3), index: i % 3 },
      ...(i < sunkCount && {
        sunkAt: Date.now(),
        sunkBy: 'TestPlayer',
      }),
    });
  }
  return cups;
};

/**
 * Creates a mock match ID
 */
export const createMockMatchId = (): string => {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Waits for async operations to complete
 */
export const waitFor = (ms: number = 0): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

