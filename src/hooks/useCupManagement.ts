/**
 * useCupManagement Hook
 * 
 * Manages cup sink operations, undo functionality, and redemption logic
 */

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Cup, GameEvent, TeamId, SelectedCup, ShotType, GameType, Player } from '../types/game';
import { TIMESTAMP_TOLERANCE_MS } from '../constants/gameConstants';
import { saveGameEvent, markEventAsUndone } from '../services/firestoreService';

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
}: UseCupManagementProps): UseCupManagementReturn => {
  const [selectedCup, setSelectedCup] = useState<SelectedCup | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [shotType, setShotType] = useState<ShotType>('regular');
  const [selectedBounceCup, setSelectedBounceCup] = useState<number | null>(null);
  
  // Track which events have been saved to Firebase
  const savedEventIdsRef = useRef<Set<string>>(new Set());

  // When matchId becomes available, save any unsaved events
  useEffect(() => {
    if (matchId && gameEvents.length > 0) {
      const unsavedEvents = gameEvents.filter(
        e => !e.isUndone && !savedEventIdsRef.current.has(e.eventId)
      );
      
      if (unsavedEvents.length > 0) {
        console.log(`Saving ${unsavedEvents.length} unsaved events to Firestore (matchId now available)`);
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
      return; // Already sunk or invalid
    }

    // Allow clicking on either side - the dialog will show correct players
    // Team 1 players can sink team2 cups, team2 players can sink team1 cups
    setSelectedCup({ side, cupId });
    
    // Auto-select player for 1v1 games
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
   * Used for regular shots and bounce shots (2 cups)
   * For bounce shots, both cups are recorded at the same timestamp
   */
  const recordCupSink = (
    cupId: number,
    side: TeamId,
    playerHandle: string,
    isBounce: boolean,
    bounceCupId: number | null
  ) => {
    const timestamp = Date.now();

    // Update cup state helper
    const updateCups = (cups: Cup[], cupIdToUpdate: number, isBounceCup: boolean = false) =>
      cups.map((c) =>
        c.id === cupIdToUpdate
          ? {
              ...c,
              sunk: true,
              sunkAt: timestamp,
              sunkBy: playerHandle,
              isBounce: isBounce || isBounceCup,
              isGrenade: false,
            }
          : c
      );

    let newTeam1Cups = team1Cups;
    let newTeam2Cups = team2Cups;

    // Sink first cup
    if (side === 'team1') {
      newTeam1Cups = updateCups(team1Cups, cupId);
    } else {
      newTeam2Cups = updateCups(team2Cups, cupId);
    }

    // If bounce, also sink the second cup on the same side (opponent's side)
    if (isBounce && bounceCupId !== null) {
      // Both cups are on the same side (opponent's side)
      if (side === 'team1') {
        newTeam1Cups = updateCups(newTeam1Cups, bounceCupId, true);
      } else {
        newTeam2Cups = updateCups(newTeam2Cups, bounceCupId, true);
      }
    }

    setTeam1Cups(newTeam1Cups);
    setTeam2Cups(newTeam2Cups);

    // Generate bounce group ID if this is a bounce shot (links both events together)
    const bounceGroupId = isBounce && bounceCupId !== null ? uuidv4() : undefined;

    // Record game events - one for first cup, one for second cup if bounce
    // Only include bounceGroupId in the object if it's defined (not undefined)
    const firstEvent: GameEvent = {
      eventId: uuidv4(),
      timestamp,
      cupId,
      playerHandle,
      isBounce,
      isGrenade: false,
      isUndone: false,
      team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
      team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
      gameState: {
        team1Cups: newTeam1Cups,
        team2Cups: newTeam2Cups,
      },
    };
    
    // Only add bounceGroupId if it's defined
    if (bounceGroupId !== undefined) {
      firstEvent.bounceGroupId = bounceGroupId;
    }
    
    const events: GameEvent[] = [firstEvent];

    // If bounce, record second cup event with same timestamp and same bounceGroupId
    if (isBounce && bounceCupId !== null && bounceGroupId) {
      const secondEvent: GameEvent = {
        eventId: uuidv4(),
        timestamp, // Same timestamp for both events
        cupId: bounceCupId,
        playerHandle,
        isBounce: true,
        isGrenade: false,
        isUndone: false,
        team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
        team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
        gameState: {
          team1Cups: newTeam1Cups,
          team2Cups: newTeam2Cups,
        },
      };
      
      // Add bounceGroupId (we know it's defined here because of the if condition)
      secondEvent.bounceGroupId = bounceGroupId;
      
      events.push(secondEvent);
    }

    setGameEvents((prev) => [...prev, ...events]);

    // Save events to Firestore (non-blocking)
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
            // Continue game even if Firestore save fails
          });
      });
    } else {
      console.warn('matchId is null, event will be saved when matchId becomes available:', events[0]?.eventId);
    }

    // Check for victory condition after recording events
    const team1Remaining = newTeam1Cups.filter(c => !c.sunk).length;
    const team2Remaining = newTeam2Cups.filter(c => !c.sunk).length;
    
    // Victory: last cup sunk OR bounce shot on second-to-last cup (leaves 0 remaining)
    if (team1Remaining === 0 || team2Remaining === 0) {
      const winner = team1Remaining === 0 ? 'team2' : 'team1';
      onVictory?.(winner);
    }

    // Reset state
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
    
    // For 1v1, player is auto-selected. For 2v2, must be selected
    if (gameType === '2v2' && !selectedPlayer) return false;

    const isBounce = shotType === 'bounce';
    const isGrenade = shotType === 'grenade';

    // For grenade shots (temporarily disabled)
    if (isGrenade) {
      // Grenade feature temporarily disabled
      return false;
    }

    // If bounce shot, return true - caller should open bounce selection dialog
    if (isBounce) {
      return true;
    }

    // Get player - auto-selected for 1v1, manual for 2v2
    const player = gameType === '1v1' 
      ? getAvailablePlayers()[0] 
      : selectedPlayer;
    
    if (!player) return false;
    
    // Record the single cup sink
    recordCupSink(selectedCup.cupId, selectedCup.side, player, false, null);
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

    // Both cups are on the opponent's side (the side that was clicked)
    // Record both cups with same timestamp
    recordCupSink(selectedCup.cupId, selectedCup.side, player, true, bounceCupId);
  };

  /**
   * Gets the most recent sunk cup(s) for undo/redemption
   * If the most recent event is a bounce (has bounceGroupId), find all events with that bounceGroupId
   * Otherwise, it's a regular shot (just return that one event)
   */
  const getLastSinkEvent = (): { side: TeamId; cupIds: number[]; eventIds: string[] } | null => {
    // Get all active (not undone) events, sorted by timestamp (most recent first)
    const activeEvents = gameEvents
      .filter(e => !e.isUndone)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (activeEvents.length === 0) return null;

    const mostRecentEvent = activeEvents[0];

    // If it's a bounce shot, find all events with the same bounceGroupId
    if (mostRecentEvent.isBounce && mostRecentEvent.bounceGroupId) {
      const bounceEvents = activeEvents.filter(
        e => e.bounceGroupId === mostRecentEvent.bounceGroupId
      );
      
      const cupIds = bounceEvents.map(e => e.cupId);
      const eventIds = bounceEvents.map(e => e.eventId);
      
      // Determine which side - check the first cup
      const side: TeamId = team1Cups.some(c => c.id === cupIds[0]) ? 'team1' : 'team2';
      
      return {
        side,
        cupIds,
        eventIds,
      };
    }

    // Regular shot - just return this one event
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
   * Undoes the most recent cup sink
   * Marks the original event(s) as undone and restores cup state
   * For bounce shots (2 events with same timestamp), undoes both cups
   * For regular shots (1 event), undoes one cup
   */
  const handleUndo = () => {
    const lastSink = getLastSinkEvent();
    if (!lastSink || lastSink.eventIds.length === 0) return;

    // Restore the cup(s) - could be 1 (regular) or 2 (bounce)
    restoreCups(lastSink.cupIds);

    // Mark events as undone
    setGameEvents((prev) =>
      prev.map((event) =>
        lastSink.eventIds.includes(event.eventId)
          ? { ...event, isUndone: true }
          : event
      )
    );

    // Update Firestore (non-blocking)
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
  };
};
