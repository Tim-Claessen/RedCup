/**
 * GameScreen Component
 * 
 * Main game screen for beer pong matches. Displays a virtual beer pong table with
 * clickable cups arranged in pyramid formations (6 or 10 cups). Tracks game state,
 * records cup sinks with shot type metadata (regular, bounce, grenade), and provides
 * game controls (pause, rotate table, rules).
 * 
 * Features:
 * - Visual beer pong table with cup formations
 * - Real-time timer
 * - Cup sink tracking with player attribution
 * - Shot type tracking (regular, bounce, grenade - grenade only for 2v2)
 * - Table rotation for team perspective switching
 * - Comprehensive event logging for analytics
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal, SegmentedButtons, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { DesignSystem } from '../theme';
import { GameScreenNavigationProp } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Cup, GameEvent, GameType, CupCount, TeamSide, ShotType, TeamId, SelectedCup } from '../types/game';
import { getCupPositions } from '../utils/cupPositions';
import { formatTime } from '../utils/timeFormatter';
import { TABLE_HEIGHT, TABLE_WIDTH, CUP_SIZE, MINI_CUP_SIZE, TIMESTAMP_TOLERANCE_MS } from '../constants/gameConstants';

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Game'>;
}


const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { cupCount, team1Players, team2Players, gameType } = route.params;
  
  // Invert cup IDs: first cup (position 0) gets highest ID (cupCount - 1)
  // This makes the top cup in the pyramid have the highest number
  const [team1Cups, setTeam1Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount as CupCount).map((pos, idx) => ({
      id: cupCount - 1 - idx, // Inverted: 0 becomes (cupCount-1), last becomes 0
      sunk: false,
      position: pos,
    }))
  );

  const [team2Cups, setTeam2Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount as CupCount).map((pos, idx) => ({
      id: cupCount - 1 - idx, // Inverted: 0 becomes (cupCount-1), last becomes 0
      sunk: false,
      position: pos,
    }))
  );

  const [selectedCup, setSelectedCup] = useState<SelectedCup | null>(null);
  const [sinkDialogVisible, setSinkDialogVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [shotType, setShotType] = useState<ShotType>('regular');
  const [bounceCupSelectionVisible, setBounceCupSelectionVisible] = useState(false);
  const [selectedBounceCup, setSelectedBounceCup] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [team1Side, setTeam1Side] = useState<TeamSide>('bottom'); // Which side team1 is on
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [redemptionVisible, setRedemptionVisible] = useState(false);
  const [winningTeam, setWinningTeam] = useState<TeamId | null>(null);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [victoriousPlayer, setVictoriousPlayer] = useState<string>('');
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Timer effect - increments every second when game is not paused
   * Cleans up interval on unmount or pause
   */
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);


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
    setSinkDialogVisible(true);
  };

  /**
   * Records a cup sink with player attribution and shot type
   * Updates cup state and creates game events for analytics
   * For bounce shots, opens second cup selection dialog
   */
  const handleSinkCup = () => {
    if (!selectedCup) return;
    
    // For 1v1, player is auto-selected. For 2v2, must be selected
    if (gameType === '2v2' && !selectedPlayer) return;

    const isBounce = shotType === 'bounce';
    const isGrenade = shotType === 'grenade';

    // If bounce shot, open bounce cup selection dialog
    if (isBounce) {
      setSinkDialogVisible(false);
      setBounceCupSelectionVisible(true);
      return;
    }

    // For grenade shots (temporarily disabled)
    if (isGrenade) {
      // Grenade feature temporarily disabled
      return;
    }

    // Get player - auto-selected for 1v1, manual for 2v2
    const player = gameType === '1v1' 
      ? getAvailablePlayers()[0] 
      : selectedPlayer;
    
    if (!player) return;
    
    // Record the single cup sink
    recordCupSink(selectedCup.cupId, selectedCup.side, player, false, null);
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
    const events: GameEvent[] = [{
      eventId: uuidv4(),
      timestamp,
      cupId,
      playerHandle,
      isBounce,
      isGrenade: false,
      isUndone: false,
      bounceGroupId,
      team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
      team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
      gameState: {
        team1Cups: newTeam1Cups,
        team2Cups: newTeam2Cups,
      },
    }];

    // If bounce, record second cup event with same timestamp and same bounceGroupId
    if (isBounce && bounceCupId !== null && bounceGroupId) {
      events.push({
        eventId: uuidv4(),
        timestamp, // Same timestamp for both events
        cupId: bounceCupId,
        playerHandle,
        isBounce: true,
        isGrenade: false,
        isUndone: false,
        bounceGroupId, // Same group ID links them together
        team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
        team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
        gameState: {
          team1Cups: newTeam1Cups,
          team2Cups: newTeam2Cups,
        },
      });
    }

    setGameEvents((prev) => [...prev, ...events]);

    // Check for victory condition after recording events
    const team1Remaining = newTeam1Cups.filter(c => !c.sunk).length;
    const team2Remaining = newTeam2Cups.filter(c => !c.sunk).length;
    
    // Victory: last cup sunk OR bounce shot on second-to-last cup (leaves 0 remaining)
    if (team1Remaining === 0 || team2Remaining === 0) {
      const winner = team1Remaining === 0 ? 'team2' : 'team1';
      setWinningTeam(winner);
      setRedemptionVisible(true);
    }

    // Close dialogs and reset
    setSinkDialogVisible(false);
    setBounceCupSelectionVisible(false);
    setSelectedCup(null);
    setSelectedPlayer('');
    setSelectedBounceCup(null);
    setShotType('regular');
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
   * Rotates the table view by swapping team positions
   * Team ownership of cups remains unchanged, only visual perspective changes
   */
  const handleRotateTable = () => {
    setTeam1Side((prev) => (prev === 'bottom' ? 'top' : 'bottom'));
  };

  /**
   * Gets the most recent sunk cup(s) for undo/redemption
   * For bounce shots, returns both cups that were sunk together
   */
  const getLastSinkEvent = (): { side: TeamId; cupId: number; eventIds: string[] } | null => {
    // Find most recently sunk cup
    const allSunkCups = [
      ...team1Cups.filter(c => c.sunk && c.sunkAt).map(c => ({ side: 'team1' as const, cupId: c.id, sunkAt: c.sunkAt! })),
      ...team2Cups.filter(c => c.sunk && c.sunkAt).map(c => ({ side: 'team2' as const, cupId: c.id, sunkAt: c.sunkAt! })),
    ];

    if (allSunkCups.length === 0) return null;

    const lastSunkCup = allSunkCups.sort((a, b) => b.sunkAt - a.sunkAt)[0];

    // Find matching event
    const lastEvent = gameEvents
      .filter(e => !e.isUndone && e.cupId === lastSunkCup.cupId && Math.abs(e.timestamp - lastSunkCup.sunkAt) < TIMESTAMP_TOLERANCE_MS)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastEvent) return null;

    // For bounce shots, get all events in the group
    if (lastEvent.isBounce && lastEvent.bounceGroupId) {
      const bounceEventIds = gameEvents
        .filter(e => !e.isUndone && e.bounceGroupId === lastEvent.bounceGroupId)
        .map(e => e.eventId);
      
      if (bounceEventIds.length > 0) {
        return { side: lastSunkCup.side, cupId: lastSunkCup.cupId, eventIds: bounceEventIds };
      }
    }

    return { side: lastSunkCup.side, cupId: lastSunkCup.cupId, eventIds: [lastEvent.eventId] };
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
   * For bounce shots, undoes both cups that were sunk together
   */
  const handleUndo = () => {
    const lastSink = getLastSinkEvent();
    if (!lastSink) return;

    const eventsToUndo = gameEvents.filter(e => lastSink.eventIds.includes(e.eventId) && !e.isUndone);
    if (eventsToUndo.length === 0) return;

    const cupIdsToRestore = eventsToUndo.map(e => e.cupId);
    restoreCups(cupIdsToRestore);

    // Mark events as undone
    setGameEvents((prev) =>
      prev.map((event) =>
        lastSink.eventIds.includes(event.eventId)
          ? { ...event, isUndone: true }
          : event
      )
    );
  };

  /**
   * Returns the list of players who can sink the currently selected cup
   * Teams can only sink opponent's cups (opposite side)
   */
  const getAvailablePlayers = () => {
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
   * Renders a single row of cups in the pyramid formation
   * Cups are clickable and show visual feedback when sunk
   * Sorts cups by ID to display in correct numerical order
   */
  const renderCupRow = (cups: Cup[], row: number, side: TeamId, reverse: boolean = false) => {
    let rowCups = cups.filter(c => c.position.row === row);
    if (rowCups.length === 0) return null;

    // Sort by cup ID (descending for top, ascending for bottom when reversed)
    rowCups = [...rowCups].sort((a, b) => {
      if (reverse) {
        return a.id - b.id; // Ascending for bottom (0, 1, 2...)
      } else {
        return b.id - a.id; // Descending for top (9, 8, 7...)
      }
    });

    return (
      <View key={row} style={styles.cupRow}>
        {rowCups.map((cup) => (
          <TouchableOpacity
            key={cup.id}
            style={[
              styles.cup,
              {
                width: CUP_SIZE,
                height: CUP_SIZE,
                borderRadius: CUP_SIZE / 2,
                backgroundColor: cup.sunk 
                  ? theme.colors.surfaceDisabled 
                  : theme.colors.primaryContainer,
                borderWidth: 2,
                borderColor: cup.sunk ? theme.colors.outline : theme.colors.primary,
              },
            ]}
            onPress={() => handleCupPress(side, cup.id)}
            disabled={cup.sunk || isPaused}
          >
            {cup.sunk && (
              <Text style={{ color: theme.colors.onSurfaceDisabled, fontSize: 12 }}>
                X
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /**
   * Renders the complete pyramid formation of cups for a team
   * Determines number of rows and renders each row
   * Bottom team renders reversed so pyramids face each other with correct numbering
   */
  const renderCups = (cups: Cup[], side: TeamId, isBottomSide: boolean) => {
    const maxRow = Math.max(...cups.map(c => c.position.row));
    // Bottom side: reverse row order so base is at bottom, apex at top (pointing up)
    // Top side: normal order so base is at top, apex at bottom (pointing down)
    const rowOrder = isBottomSide
      ? Array.from({ length: maxRow + 1 }, (_, i) => maxRow - i) // Reverse for bottom
      : Array.from({ length: maxRow + 1 }, (_, i) => i); // Normal for top
      
    return (
      <View style={styles.cupFormation}>
        {rowOrder.map((row) => renderCupRow(cups, row, side, isBottomSide))}
      </View>
    );
  };

  const team1CupsRemaining = team1Cups.filter(c => !c.sunk).length;
  const team2CupsRemaining = team2Cups.filter(c => !c.sunk).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>
          {formatTime(elapsedSeconds)}
        </Text>
      </View>


      {/* Beer Pong Table */}
      <View style={styles.tableContainer}>
        {/* Top Team Label - Outside table */}
        <View style={styles.teamLabelOutside}>
          {team1Side === 'top' ? (
            <>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Team 1
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {team1Players.map(p => p.handle).join(' & ')}
              </Text>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Team 2
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {team2Players.map(p => p.handle).join(' & ')}
              </Text>
            </>
          )}
        </View>

        {/* Table */}
        <View
          style={[
            styles.table,
            {
              width: TABLE_WIDTH,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          {/* Top Side - Always normal orientation, rotates which team */}
          <View style={[styles.tableSide, styles.topSide]}>
            {team1Side === 'top' ? (
              renderCups(team1Cups, 'team1', false) // Top side always false
            ) : (
              renderCups(team2Cups, 'team2', false) // Top side always false
            )}
          </View>

          {/* Table Center Line */}
          <View
            style={[
              styles.centerLine,
              { backgroundColor: theme.colors.outline },
            ]}
          />

          {/* Bottom Side - Always reversed orientation, rotates which team */}
          <View style={[styles.tableSide, styles.bottomSide]}>
            {team1Side === 'bottom' ? (
              renderCups(team1Cups, 'team1', true) // Bottom side always true
            ) : (
              renderCups(team2Cups, 'team2', true) // Bottom side always true
            )}
          </View>
        </View>

        {/* Bottom Team Label - Outside table */}
        <View style={styles.teamLabelOutside}>
          {team1Side === 'bottom' ? (
            <>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Team 1
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {team1Players.map(p => p.handle).join(' & ')}
              </Text>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={{ color: theme.colors.onBackground }}>
                Team 2
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {team2Players.map(p => p.handle).join(' & ')}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => setIsPaused(!isPaused)}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon={isPaused ? 'play' : 'pause'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          mode="outlined"
          onPress={handleUndo}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon="undo"
          disabled={!getLastSinkEvent() || isPaused}
        >
          Undo
        </Button>
        <Button
          mode="outlined"
          onPress={() => setRulesVisible(true)}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon="book-open-variant"
        >
          Rules
        </Button>
        <Button
          mode="outlined"
          onPress={handleRotateTable}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon="rotate-3d-variant"
        >
          Rotate
        </Button>
      </View>

      {/* Sink Cup Dialog */}
      <Portal>
        <Dialog
          visible={sinkDialogVisible}
          onDismiss={() => {
            setSinkDialogVisible(false);
            setSelectedCup(null);
          }}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Record Cup Sink</Dialog.Title>
          <Dialog.Content>
            {/* Player selection - only for 2v2 games */}
            {gameType === '2v2' && (
              <>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
                  Who sunk the cup?
                </Text>
                
                <View style={styles.playerSelection}>
                  {getAvailablePlayers().map((handle) => (
                    <Button
                      key={handle}
                      mode={selectedPlayer === handle ? 'contained' : 'outlined'}
                      onPress={() => setSelectedPlayer(handle)}
                      style={styles.playerButton}
                      buttonColor={selectedPlayer === handle ? theme.colors.primary : undefined}
                      textColor={
                        selectedPlayer === handle
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface
                      }
                    >
                      {handle}
                    </Button>
                  ))}
                </View>
              </>
            )}


            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface, marginTop: DesignSystem.spacing.lg, marginBottom: DesignSystem.spacing.sm }}
            >
              Shot Type:
            </Text>

            <SegmentedButtons
              value={shotType}
              onValueChange={(value) => setShotType(value as 'regular' | 'bounce' | 'grenade')}
              buttons={[
                { value: 'regular', label: 'Regular' },
                { value: 'bounce', label: 'Bounce' },
                { value: 'grenade', label: 'Grenade (Coming Soon)', disabled: true },
              ]}
              style={styles.shotTypeButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                  disabled: theme.colors.surfaceDisabled,
                },
              }}
            />

            {shotType === 'grenade' && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.error, marginTop: DesignSystem.spacing.sm }}
              >
                ⚠️ Grenade feature is not available yet
              </Text>
            )}

            {shotType === 'bounce' && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.sm }}
              >
                Bounce: Select a second cup on opponent's side after recording
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSinkDialogVisible(false)} textColor={theme.colors.onSurface}>
              Cancel
            </Button>
            <Button
              onPress={handleSinkCup}
              disabled={!selectedPlayer && gameType === '2v2'}
              mode="contained"
              buttonColor={theme.colors.primary}
            >
              {shotType === 'bounce' ? 'Continue' : 'Record'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Bounce Cup Selection Dialog */}
      <Portal>
        <Dialog
          visible={bounceCupSelectionVisible}
          onDismiss={() => {
            setBounceCupSelectionVisible(false);
            setSinkDialogVisible(true); // Return to sink dialog
          }}
          style={{ backgroundColor: theme.colors.surface, maxHeight: '80%' }}
        >
          <Dialog.Title>Select Second Cup (Bounce)</Dialog.Title>
          <Dialog.Content style={{ maxHeight: 400 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
              Select the second cup on opponent's side:
            </Text>
            
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {selectedCup && (() => {
                // Show cups from the same side as the clicked cup (opponent's side)
                const opponentCups = selectedCup.side === 'team1' ? team1Cups : team2Cups;
                const opponentSide = selectedCup.side === 'team1' ? 'team1' : 'team2';
                
                // Determine if opponent is on bottom using same logic as main table
                // Main table: team1Side === 'top' means team1 is on top, team2 is on bottom
                // Main table: team1Side === 'bottom' means team1 is on bottom, team2 is on top
                const opponentIsOnBottom = (opponentSide === 'team1' && team1Side === 'bottom') ||
                                           (opponentSide === 'team2' && team1Side === 'top');
                
                // Use the exact same rendering logic as main table
                // Create a modified cups array where the first clicked cup appears as sunk
                const cupsWithFirstSunk = opponentCups.map(cup => 
                  cup.id === selectedCup.cupId 
                    ? { ...cup, sunk: true, sunkAt: Date.now() }
                    : cup
                );
                
                // Use renderCups with the same parameters as main table would use
                return (
                  <View style={styles.miniCupFormation}>
                    {(() => {
                      const maxRow = Math.max(...cupsWithFirstSunk.map(c => c.position.row));
                      const rowOrder = opponentIsOnBottom
                        ? Array.from({ length: maxRow + 1 }, (_, i) => maxRow - i) // Reverse for bottom
                        : Array.from({ length: maxRow + 1 }, (_, i) => i); // Normal for top
                      
                      return rowOrder.map((row) => {
                        let rowCups = cupsWithFirstSunk.filter(c => c.position.row === row);
                        if (rowCups.length === 0) return null;
                        
                        // Sort by cup ID (same logic as renderCupRow)
                        rowCups = [...rowCups].sort((a, b) => {
                          if (opponentIsOnBottom) {
                            return a.id - b.id; // Ascending for bottom
                          } else {
                            return b.id - a.id; // Descending for top
                          }
                        });
                        
                        return (
                          <View key={row} style={styles.miniCupRow}>
                            {rowCups.map((cup) => {
                              const isSunk = cup.sunk;
                              const isSelected = selectedBounceCup === cup.id;
                              
                              return (
                                <TouchableOpacity
                                  key={cup.id}
                                  style={[
                                    styles.miniCup,
                                    {
                                      width: MINI_CUP_SIZE,
                                      height: MINI_CUP_SIZE,
                                      borderRadius: MINI_CUP_SIZE / 2,
                                      backgroundColor: isSunk
                                        ? theme.colors.surfaceDisabled
                                        : isSelected
                                        ? theme.colors.primary
                                        : theme.colors.primaryContainer,
                                      borderWidth: 2,
                                      borderColor: isSunk
                                        ? theme.colors.outline
                                        : isSelected
                                        ? theme.colors.primary
                                        : theme.colors.primary,
                                    },
                                  ]}
                                  onPress={() => !isSunk && setSelectedBounceCup(cup.id)}
                                  disabled={isSunk}
                                >
                                  {isSunk && (
                                    <Text style={{ color: theme.colors.onSurfaceDisabled, fontSize: 12 }}>
                                      X
                                    </Text>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      });
                    })()}
                  </View>
                );
              })()}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setBounceCupSelectionVisible(false);
                setSinkDialogVisible(true);
              }} 
              textColor={theme.colors.onSurface}
            >
              Back
            </Button>
            <Button
              onPress={() => {
                if (selectedBounceCup !== null) {
                  handleBounceCupSelect(selectedBounceCup);
                }
              }}
              disabled={selectedBounceCup === null}
              mode="contained"
              buttonColor={theme.colors.primary}
            >
              Record Both Cups
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Redemption Dialog */}
      <Portal>
        <Dialog
          visible={redemptionVisible}
          onDismiss={() => {}} // Prevent dismissing - must choose an option
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold' }}>
            REDEMPTION
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.redemptionContent}>
              {winningTeam && (() => {
                const winningPlayers = winningTeam === 'team1' 
                  ? team1Players.map(p => p.handle).join(' & ')
                  : team2Players.map(p => p.handle).join(' & ');
                const losingPlayers = winningTeam === 'team1'
                  ? team2Players.map(p => p.handle).join(' & ')
                  : team1Players.map(p => p.handle).join(' & ');
                
                return (
                  <>
                    <Button
                      mode="contained"
                      onPress={() => {
                        // Redemption: for bounce shots, only restore the first cup (keep second cup sunk)
                        const lastSink = getLastSinkEvent();
                        if (lastSink) {
                          const eventsToCheck = gameEvents.filter(e => 
                            lastSink.eventIds.includes(e.eventId) && !e.isUndone
                          );
                          
                          // Check if this was a bounce shot
                          const isBounce = eventsToCheck.some(e => e.isBounce && e.bounceGroupId);
                          
                          if (isBounce && eventsToCheck.length === 2) {
                            // For bounce: restore only the first cup (the one that triggered the bounce)
                            // The second cup (selected in bounce menu) stays sunk
                            const firstCupEvent = eventsToCheck.find(e => e.cupId === lastSink.cupId);
                            if (firstCupEvent) {
                              restoreCups([firstCupEvent.cupId]);
                            }
                          } else {
                            // Regular shot: restore the cup
                            const cupIdsToRestore = eventsToCheck.map(e => e.cupId);
                            restoreCups(cupIdsToRestore);
                          }
                        }
                        setRedemptionVisible(false);
                        setWinningTeam(null);
                      }}
                      style={styles.redemptionButton}
                      buttonColor={theme.colors.primary}
                      contentStyle={styles.redemptionButtonContent}
                      labelStyle={styles.redemptionButtonLabel}
                    >
                      {losingPlayers} comes up clutch! Play on
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setRedemptionVisible(false);
                        // Show victory overlay with winning player name
                        setVictoriousPlayer(winningPlayers);
                        setVictoryVisible(true);
                        setWinningTeam(null);
                      }}
                      style={styles.redemptionButton}
                      buttonColor={theme.colors.error}
                      contentStyle={styles.redemptionButtonContent}
                      labelStyle={styles.redemptionButtonLabel}
                    >
                      {winningPlayers} wins!
                    </Button>
                  </>
                );
              })()}
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Victory Overlay */}
      <Portal>
        <Dialog
          visible={victoryVisible}
          onDismiss={() => {}} // Prevent dismissing
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>
            {victoriousPlayer} is victorious!
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.victoryContent}>
              <Button
                mode="contained"
                onPress={() => {
                  setVictoryVisible(false);
                  setVictoriousPlayer('');
                  navigation.navigate('Home');
                }}
                style={styles.victoryButton}
                buttonColor={theme.colors.primary}
                contentStyle={styles.victoryButtonContent}
                labelStyle={styles.victoryButtonLabel}
              >
                Home
              </Button>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Rules Dialog */}
      <Portal>
        <Dialog
          visible={rulesVisible}
          onDismiss={() => setRulesVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Beer Pong Rules</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.sm }}>
              • Each team takes turns shooting{'\n'}
              • Sink all opponent cups to win{'\n'}
              • Bounce shots count as 2 cups{'\n'}
              • Use "Rotate Table" to switch sides
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRulesVisible(false)} textColor={theme.colors.onSurface}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
  },
  tableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
  },
  table: {
    height: TABLE_HEIGHT,
    borderWidth: 3,
    borderRadius: DesignSystem.borderRadius.xl,
    overflow: 'hidden',
  },
  tableSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
  },
  topSide: {
    borderBottomWidth: 1,
  },
  bottomSide: {
    borderTopWidth: 1,
  },
  centerLine: {
    height: 2,
    width: '100%',
  },
  cupFormation: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.xs,
    gap: DesignSystem.spacing.sm,
  },
  cup: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  teamLabelOutside: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    width: TABLE_WIDTH,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  playerSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  playerButton: {
    minWidth: 100,
  },
  shotTypeButtons: {
    marginTop: DesignSystem.spacing.sm,
  },
  miniCupFormation: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: DesignSystem.spacing.md,
  },
  miniCupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: DesignSystem.spacing.xs,
    gap: DesignSystem.spacing.xs,
  },
  miniCup: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  redemptionContent: {
    alignItems: 'stretch',
    gap: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
  },
  redemptionButton: {
    marginVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  redemptionButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
  },
  redemptionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  victoryContent: {
    alignItems: 'stretch',
    paddingVertical: DesignSystem.spacing.md,
  },
  victoryButton: {
    marginVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  victoryButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
  },
  victoryButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default GameScreen;
