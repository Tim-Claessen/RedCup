/**
 * useCupManagement Hook
 * 
 * Manages cup sink operations, undo functionality, and redemption logic
 */

// Polyfill for crypto.getRandomValues() - required for uuid package in React Native
import 'react-native-get-random-values';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { saveGameEvent, markEventAsUndone } from '../services/firestoreService';
import { Cup, GameEvent, TeamId, SelectedCup, ShotType, GameType, Player, CupCount } from '../types/game';
import { getCupPositions } from '../utils/cupPositions';
import { getTouchingCups } from '../utils/cupAdjacency';

/**
 * Safe UUID generator that works on Android/iOS
 * Uses uuid package with polyfill, falls back to timestamp-based ID if needed
 */
const generateUUID = (): string => {
  try {
    return uuidv4();
  } catch (error) {
    console.error('UUID generation failed, using fallback:', error);
    // Fallback: timestamp-based unique ID (not a real UUID but unique enough for our use case)
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

interface UseCupManagementProps {
  team1Cups: Cup[];
  team2Cups: Cup[];
  setTeam1Cups: React.Dispatch<React.SetStateAction<Cup[]>>;
  setTeam2Cups: React.Dispatch<React.SetStateAction<Cup[]>>;
  gameEvents: GameEvent[];
  setGameEvents: React.Dispatch<React.SetStateAction<GameEvent[]>>;
  gameType: GameType;
  team1Players: Player[];
  team2Players: Player[];
  matchId: string | null; // Firebase match ID
  onVictory?: (winningTeam: TeamId) => void;
  cupCount: CupCount; // Starting cup count (6 or 10)
}

interface UseCupManagementReturn {
  selectedCup: SelectedCup | null;
  setSelectedCup: React.Dispatch<React.SetStateAction<SelectedCup | null>>;
  selectedPlayer: string;
  setSelectedPlayer: React.Dispatch<React.SetStateAction<string>>;
  shotType: ShotType;
  setShotType: React.Dispatch<React.SetStateAction<ShotType>>;
  selectedBounceCup: number | null;
  setSelectedBounceCup: React.Dispatch<React.SetStateAction<number | null>>;
  handleCupPress: (side: TeamId, cupId: number) => void;
  handleSinkCup: () => boolean;
  handleBounceCupSelect: (bounceCupId: number) => void;
  handleUndo: () => void;
  getAvailablePlayers: () => string[];
  getLastSinkEvent: () => { side: TeamId; cupIds: number[]; eventIds: string[] } | null;
  restoreCups: (cupIds: number[]) => void;
  rerackSide: (side: TeamId, slotIndexes?: number[]) => void;
}

export const useCupManagement = ({
  team1Cups,
  team2Cups,
  setTeam1Cups,
  setTeam2Cups,
  gameEvents,
  setGameEvents,
  gameType,
  team1Players,
  team2Players,
  matchId,
  onVictory,
  cupCount,
}: UseCupManagementProps): UseCupManagementReturn => {
  const [selectedCup, setSelectedCup] = useState<SelectedCup | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [shotType, setShotType] = useState<ShotType>('regular');
  const [selectedBounceCup, setSelectedBounceCup] = useState<number | null>(null);
  
  const savedEventIdsRef = useRef<Set<string>>(new Set());

  /**
   * Derives cup state from active (not undone) events
   * Uses the most recent event's gameState snapshot for accuracy
   */
  const deriveCupStateFromEvents = (): { team1Cups: Cup[]; team2Cups: Cup[] } => {
    const activeEvents = gameEvents
      .filter(e => !e.isUndone)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (activeEvents.length === 0) {
      const initialTeam1Cups: Cup[] = getCupPositions(cupCount).map((pos, idx) => ({
        id: idx,
        sunk: false,
        position: pos,
      }));
      const initialTeam2Cups: Cup[] = getCupPositions(cupCount).map((pos, idx) => ({
        id: idx,
        sunk: false,
        position: pos,
      }));
      return { team1Cups: initialTeam1Cups, team2Cups: initialTeam2Cups };
    }

    const mostRecentEvent = activeEvents[activeEvents.length - 1];
    return {
      team1Cups: mostRecentEvent.gameState.team1Cups,
      team2Cups: mostRecentEvent.gameState.team2Cups,
    };
  };

  useEffect(() => {
    const derivedState = deriveCupStateFromEvents();
    setTeam1Cups(derivedState.team1Cups);
    setTeam2Cups(derivedState.team2Cups);
  }, [gameEvents, cupCount]);

  useEffect(() => {
    if (matchId && gameEvents.length > 0) {
      const unsavedEvents = gameEvents.filter(
        e => !e.isUndone && !savedEventIdsRef.current.has(e.eventId)
      );
      
      if (unsavedEvents.length > 0) {
        unsavedEvents.forEach(event => {
          saveGameEvent(matchId, event)
            .then(success => {
              if (success) {
                savedEventIdsRef.current.add(event.eventId);
              }
            })
            .catch(error => {
              console.error('Failed to save unsaved event to Firestore:', error);
            });
        });
      }
    }
  }, [matchId, gameEvents]);

  /**
   * Returns the list of players who can sink the currently selected cup
   * Teams can only sink opponent's cups (opposite side)
   */
  const getAvailablePlayers = (): string[] => {
    if (!selectedCup) return [];
    
    // Teams can only sink opponent's cups
    // If selected cup belongs to team2, team1 players can sink it
    if (selectedCup.side === 'team2') {
      return team1Players.map(p => p.handle);
    } else {
      return team2Players.map(p => p.handle);
    }
  };

  /**
   * Handles cup press - opens dialog to record cup sink
   * Only allows clicking on cups that aren't already sunk
   */
  const handleCupPress = (side: TeamId, cupId: number) => {
    const cups = side === 'team1' ? team1Cups : team2Cups;
    const cup = cups.find(c => c.id === cupId);
    
    if (!cup || cup.sunk) {
      return;
    }

    setSelectedCup({ side, cupId });
    
    if (gameType === '1v1') {
      const players = getAvailablePlayers();
      setSelectedPlayer(players[0] || '');
    } else {
      setSelectedPlayer('');
    }
    
    setShotType('regular');
  };

  /**
   * Records one or more cup sinks with the same timestamp
   * Used for regular shots, bounce shots (2 cups), and grenade shots (target + touching cups)
   * For bounce shots, both cups are recorded at the same timestamp
   * For grenade shots, target cup + all touching cups are recorded at the same timestamp
   */
  const recordCupSink = (
    cupId: number,
    side: TeamId,
    playerHandle: string,
    isBounce: boolean,
    bounceCupId: number | null,
    isGrenade: boolean = false,
    userId?: string
  ) => {
    const timestamp = Date.now();

    const updateCups = (cups: Cup[], cupIdToUpdate: number, isBounceCup: boolean = false, isGrenadeCup: boolean = false) =>
      cups.map((c) =>
        c.id === cupIdToUpdate
          ? {
              ...c,
              sunk: true,
              sunkAt: timestamp,
              sunkBy: playerHandle,
              isBounce: isBounce || isBounceCup,
              isGrenade: isGrenade || isGrenadeCup,
            }
          : c
      );

    let newTeam1Cups = team1Cups;
    let newTeam2Cups = team2Cups;

    if (side === 'team1') {
      newTeam1Cups = updateCups(team1Cups, cupId, false, isGrenade);
    } else {
      newTeam2Cups = updateCups(team2Cups, cupId, false, isGrenade);
    }

    if (isBounce && bounceCupId !== null) {
      if (side === 'team1') {
        newTeam1Cups = updateCups(newTeam1Cups, bounceCupId, true, false);
      } else {
        newTeam2Cups = updateCups(newTeam2Cups, bounceCupId, true, false);
      }
    }

    let touchingCupIds: number[] = [];
    if (isGrenade) {
      const currentCups = side === 'team1' ? newTeam1Cups : newTeam2Cups;
      touchingCupIds = getTouchingCups(cupId, cupCount).filter(touchingId => {
        const touchingCup = currentCups.find(c => c.id === touchingId);
        return touchingCup && !touchingCup.sunk;
      });

      touchingCupIds.forEach(touchingCupId => {
        if (side === 'team1') {
          newTeam1Cups = updateCups(newTeam1Cups, touchingCupId, false, true);
        } else {
          newTeam2Cups = updateCups(newTeam2Cups, touchingCupId, false, true);
        }
      });
    }

    setTeam1Cups(newTeam1Cups);
    setTeam2Cups(newTeam2Cups);

    const bounceGroupId = isBounce && bounceCupId !== null ? generateUUID() : undefined;
    const grenadeGroupId = isGrenade ? generateUUID() : undefined;

    const allCupIds = [cupId, ...(isBounce && bounceCupId !== null ? [bounceCupId] : []), ...(isGrenade ? touchingCupIds : [])];
    const events: GameEvent[] = [];

    allCupIds.forEach((eventCupId) => {
      const event: GameEvent = {
        eventId: generateUUID(),
        timestamp,
        cupId: eventCupId,
        playerHandle,
        userId, // Include userId if player is logged in
        isBounce: isBounce && (eventCupId === cupId || eventCupId === bounceCupId),
        isGrenade: isGrenade,
        isUndone: false,
        team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
        team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
        gameState: {
          team1Cups: newTeam1Cups,
          team2Cups: newTeam2Cups,
        },
      };

      if (bounceGroupId !== undefined && (eventCupId === cupId || eventCupId === bounceCupId)) {
        event.bounceGroupId = bounceGroupId;
      }

      if (grenadeGroupId !== undefined) {
        event.grenadeGroupId = grenadeGroupId;
      }

      events.push(event);
    });

    setGameEvents((prev) => [...prev, ...events]);

    if (matchId) {
      events.forEach(event => {
        saveGameEvent(matchId, event)
          .then(success => {
            if (success) {
              savedEventIdsRef.current.add(event.eventId);
            }
          })
          .catch(error => {
            console.error('Failed to save event to Firestore:', error);
          });
      });
    } else {
      console.warn('matchId is null, event will be saved when matchId becomes available:', events[0]?.eventId);
    }

    const team1Remaining = newTeam1Cups.filter(c => !c.sunk).length;
    const team2Remaining = newTeam2Cups.filter(c => !c.sunk).length;
    
    // Victory: last cup sunk OR bounce shot on second-to-last cup (game rule)
    if (team1Remaining === 0 || team2Remaining === 0) {
      const winner = team1Remaining === 0 ? 'team2' : 'team1';
      onVictory?.(winner);
    }

    setSelectedCup(null);
    setSelectedPlayer('');
    setSelectedBounceCup(null);
    setShotType('regular');
  };

  /**
   * Records a cup sink with player attribution and shot type
   * Updates cup state and creates game events for analytics
   * Returns true if bounce shot (caller should open bounce selection dialog)
   * Returns false if regular shot was recorded
   */
  const handleSinkCup = (): boolean => {
    if (!selectedCup) return false;
    
    if (gameType === '2v2' && !selectedPlayer) return false;

    const isBounce = shotType === 'bounce';
    const isGrenade = shotType === 'grenade';

    if (isGrenade && isBounce) {
      return false;
    }

    if (isBounce) {
      return true;
    }

    const player = gameType === '1v1' 
      ? getAvailablePlayers()[0] 
      : selectedPlayer;
    
    if (!player) return false;
    
    const allPlayers = [...team1Players, ...team2Players];
    const playerData = allPlayers.find(p => p.handle === player);
    const userId = playerData?.userId;
    
    recordCupSink(selectedCup.cupId, selectedCup.side, player, false, null, isGrenade, userId);
    return false;
  };

  /**
   * Handles bounce cup selection - records both cups
   * Both cups are on the opponent's side (selectedCup.side)
   */
  const handleBounceCupSelect = (bounceCupId: number) => {
    if (!selectedCup) return;
    
    const player = gameType === '1v1' 
      ? getAvailablePlayers()[0] 
      : selectedPlayer;
    
    if (!player) return;

    const allPlayers = [...team1Players, ...team2Players];
    const playerData = allPlayers.find(p => p.handle === player);
    const userId = playerData?.userId;

    recordCupSink(selectedCup.cupId, selectedCup.side, player, true, bounceCupId, false, userId);
  };

  /**
   * Gets the most recent sunk cup(s) for undo/redemption
   * 
   * Logic:
   * 1. Get the most recent active (not undone) event
   * 2. If it's a bounce: find ALL events with the same bounceGroupId (should be 2 events)
   * 3. If it's a grenade: find ALL events with the same grenadeGroupId (target cup + touching cups)
   * 4. Otherwise: it's a regular shot (just 1 event)
   */
  const getLastSinkEvent = (): { side: TeamId; cupIds: number[]; eventIds: string[] } | null => {
    const activeEvents = gameEvents
      .filter(e => !e.isUndone)
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) {
          return b.timestamp - a.timestamp;
        }
        return b.eventId.localeCompare(a.eventId);
      });

    if (activeEvents.length === 0) return null;

    const mostRecentEvent = activeEvents[0];

    if (mostRecentEvent.isBounce && mostRecentEvent.bounceGroupId) {
      const matchingEvents = activeEvents.filter(
        e => e.bounceGroupId === mostRecentEvent.bounceGroupId && e.isBounce
      );
      
      const cupIds = matchingEvents.map(e => e.cupId);
      const eventIds = matchingEvents.map(e => e.eventId);
      const side: TeamId = team1Cups.some(c => c.id === cupIds[0]) ? 'team1' : 'team2';
      
      return { side, cupIds, eventIds };
    }

    if (mostRecentEvent.isGrenade && mostRecentEvent.grenadeGroupId) {
      const targetGrenadeGroupId = mostRecentEvent.grenadeGroupId;
      
      const matchingEvents = activeEvents.filter(
        e => e.isGrenade === true 
          && e.grenadeGroupId === targetGrenadeGroupId
      );
      
      const cupIds = matchingEvents.map(e => e.cupId);
      const eventIds = matchingEvents.map(e => e.eventId);
      const side: TeamId = team1Cups.some(c => c.id === cupIds[0]) ? 'team1' : 'team2';
      
      return { side, cupIds, eventIds };
    }

    const side: TeamId = team1Cups.some(c => c.id === mostRecentEvent.cupId) ? 'team1' : 'team2';
    return {
      side,
      cupIds: [mostRecentEvent.cupId],
      eventIds: [mostRecentEvent.eventId],
    };
  };

  /**
   * Restores cup state without marking events as undone
   * Used for redemption - cups are reopened but events remain in history
   */
  const restoreCups = (cupIds: number[]) => {
    const updateCups = (cups: Cup[]) =>
      cups.map((c) =>
        cupIds.includes(c.id)
          ? {
              ...c,
              sunk: false,
              sunkAt: undefined,
              sunkBy: undefined,
              isBounce: undefined,
              isGrenade: undefined,
            }
          : c
      );

    const team1CupIds = cupIds.filter(id => team1Cups.some(c => c.id === id && c.sunk));
    const team2CupIds = cupIds.filter(id => team2Cups.some(c => c.id === id && c.sunk));

    if (team1CupIds.length > 0) {
      setTeam1Cups(updateCups(team1Cups));
    }
    if (team2CupIds.length > 0) {
      setTeam2Cups(updateCups(team2Cups));
    }
  };

  /**
   * Re-racks the remaining (unsunk) cups on a given side into a tight pyramid.
   * This intentionally reassigns cup IDs based on the new layout, so the same
   * numeric cupId may be reused multiple times during a game. This is OK
   * because cupId is mainly used for "sunk shot" analytics within a match.
   */
  const rerackSide = (side: TeamId, slotIndexes?: number[]) => {
    const cups = side === 'team1' ? team1Cups : team2Cups;

    const unsunkCups = cups.filter(c => !c.sunk);
    const sunkCups = cups.filter(c => c.sunk);

    if (unsunkCups.length === 0) {
      return;
    }

    // Base positions for the full rack (6 or 10 cups)
    const allPositions = getCupPositions(cupCount);

    // Determine which formation slots will hold the remaining cups vs sunk cups
    const totalSlots = allPositions.length;
    const defaultSelected = Array.from({ length: unsunkCups.length }, (_, i) => i);

    const selectedSlots =
      slotIndexes && slotIndexes.length === unsunkCups.length
        ? slotIndexes
        : defaultSelected;

    const availableSlots = new Set<number>(
      Array.from({ length: totalSlots }, (_, i) => i)
    );
    selectedSlots.forEach((idx) => availableSlots.delete(idx));

    const sunkSlots = Array.from(availableSlots);

    const reRackedUnsunk: Cup[] = unsunkCups.map((cup, index) => {
      const slotIndex = selectedSlots[index];
      const pos = allPositions[slotIndex];
      return {
        ...cup,
        // Reassign cup IDs to correspond to their new slot index
        id: slotIndex,
        position: pos ?? cup.position,
      };
    });

    const reRackedSunk: Cup[] = sunkCups.map((cup, index) => {
      const slotIndex = sunkSlots[index] ?? index;
      const pos = allPositions[slotIndex];
      return {
        ...cup,
        id: slotIndex,
        position: pos ?? cup.position,
      };
    });

    const newCups = [...reRackedUnsunk, ...reRackedSunk];

    if (side === 'team1') {
      setTeam1Cups(newCups);
    } else {
      setTeam2Cups(newCups);
    }
  };

  /**
   * Undoes the most recent cup sink
   * Simply marks the event(s) as undone - state will be recalculated from events via useEffect
   */
  const handleUndo = () => {
    const lastSink = getLastSinkEvent();
    if (!lastSink || lastSink.eventIds.length === 0) return;

    setGameEvents((prev) =>
      prev.map((event) =>
        lastSink.eventIds.includes(event.eventId)
          ? { ...event, isUndone: true }
          : event
      )
    );

    if (matchId) {
      lastSink.eventIds.forEach(eventId => {
        markEventAsUndone(eventId).catch(error => {
          console.error('Failed to update made shot in Firestore:', error);
        });
      });
    } else {
      console.warn('matchId is null, undo not saved to Firestore');
    }
  };

  return {
    selectedCup,
    setSelectedCup,
    selectedPlayer,
    setSelectedPlayer,
    shotType,
    setShotType,
    selectedBounceCup,
    setSelectedBounceCup,
    handleCupPress,
    handleSinkCup,
    handleBounceCupSelect,
    handleUndo,
    getAvailablePlayers,
    getLastSinkEvent,
    restoreCups,
    rerackSide,
  };
};
