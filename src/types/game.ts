/**
 * Game-related type definitions
 * Centralized type definitions for game state, events, and entities
 */

/**
 * Represents a single cup on the beer pong table
 */
export interface Cup {
  id: number;
  sunk: boolean;
  sunkAt?: number; // timestamp when cup was sunk
  sunkBy?: string; // player handle who sunk the cup
  isBounce?: boolean; // whether this was a bounce shot
  isGrenade?: boolean; // whether this was a grenade (both players hit same cup)
  position: { row: number; index: number }; // pyramid position
}

/**
 * Game event for analytics and replay
 * Stores complete game state snapshot at the time of each cup sink
 * Simple model: undone events are marked with isUndone flag for easy filtering
 */
export interface GameEvent {
  eventId: string; // Unique event identifier (UUID v4) - prevents collisions
  timestamp: number; // Timestamp for ordering/chronological analysis
  cupId: number;
  playerHandle: string;
  isBounce: boolean;
  isGrenade: boolean;
  isUndone: boolean; // True if this event was undone - simple filter for analytics
  bounceGroupId?: string; // Links bounce shot events together for coordinated undo
  team1CupsRemaining: number;
  team2CupsRemaining: number;
  gameState: {
    team1Cups: Cup[];
    team2Cups: Cup[];
  };
}

/**
 * Game type configuration
 */
export type GameType = '1v1' | '2v2';

/**
 * Cup count options
 */
export type CupCount = 6 | 10;

/**
 * Team side on the table
 */
export type TeamSide = 'top' | 'bottom';

/**
 * Shot type options
 */
export type ShotType = 'regular' | 'bounce' | 'grenade';

/**
 * Team identifier
 */
export type TeamId = 'team1' | 'team2';

/**
 * Player information
 */
export interface Player {
  handle: string;
}

/**
 * Selected cup information
 */
export interface SelectedCup {
  side: TeamId;
  cupId: number;
}

