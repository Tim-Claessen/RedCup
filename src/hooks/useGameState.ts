/**
 * useGameState Hook
 * 
 * Manages core game state including cups, events, and team configuration
 */

import { useState } from 'react';
import { Cup, GameEvent, CupCount, TeamSide, TeamId } from '../types/game';
import { getCupPositions } from '../utils/cupPositions';

interface UseGameStateProps {
  cupCount: CupCount;
}

interface UseGameStateReturn {
  team1Cups: Cup[];
  team2Cups: Cup[];
  setTeam1Cups: React.Dispatch<React.SetStateAction<Cup[]>>;
  setTeam2Cups: React.Dispatch<React.SetStateAction<Cup[]>>;
  team1Side: TeamSide;
  setTeam1Side: React.Dispatch<React.SetStateAction<TeamSide>>;
  gameEvents: GameEvent[];
  setGameEvents: React.Dispatch<React.SetStateAction<GameEvent[]>>;
  winningTeam: TeamId | null;
  setWinningTeam: React.Dispatch<React.SetStateAction<TeamId | null>>;
  team1CupsRemaining: number;
  team2CupsRemaining: number;
}

export const useGameState = ({ cupCount }: UseGameStateProps): UseGameStateReturn => {
  // Use consistent IDs: position index = cup ID (0, 1, 2, ...)
  // This keeps backend logic consistent with position-based adjacency maps
  const [team1Cups, setTeam1Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount).map((pos, idx) => ({
      id: idx, // Consistent: position 0 = ID 0, position 1 = ID 1, etc.
      sunk: false,
      position: pos,
    }))
  );

  const [team2Cups, setTeam2Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount).map((pos, idx) => ({
      id: idx, // Consistent: position 0 = ID 0, position 1 = ID 1, etc.
      sunk: false,
      position: pos,
    }))
  );

  const [team1Side, setTeam1Side] = useState<TeamSide>('bottom'); // Which side team1 is on
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [winningTeam, setWinningTeam] = useState<TeamId | null>(null);

  const team1CupsRemaining = team1Cups.filter(c => !c.sunk).length;
  const team2CupsRemaining = team2Cups.filter(c => !c.sunk).length;

  return {
    team1Cups,
    team2Cups,
    setTeam1Cups,
    setTeam2Cups,
    team1Side,
    setTeam1Side,
    gameEvents,
    setGameEvents,
    winningTeam,
    setWinningTeam,
    team1CupsRemaining,
    team2CupsRemaining,
  };
};
