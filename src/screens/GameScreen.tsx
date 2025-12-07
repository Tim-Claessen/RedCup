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
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal, SegmentedButtons, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import { DesignSystem } from '../theme';
import { GameScreenNavigationProp } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Game'>;
}

/**
 * Represents a single cup on the beer pong table
 */
interface Cup {
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
interface GameEvent {
  eventId: string; // Unique event identifier (UUID v4) - prevents collisions
  timestamp: number; // Timestamp for ordering/chronological analysis
  cupId: number;
  playerHandle: string;
  isBounce: boolean;
  isGrenade: boolean;
  isUndone: boolean; // True if this event was undone - simple filter for analytics
  team1CupsRemaining: number;
  team2CupsRemaining: number;
  gameState: {
    team1Cups: Cup[];
    team2Cups: Cup[];
  };
}

// Screen dimensions and table sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TABLE_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 500); // 50% of screen height, max 500px
const TABLE_WIDTH = Math.min(SCREEN_WIDTH - 32, 600); // Screen width minus padding, max 600px
const CUP_SIZE = 40; // Fixed cup size for optimal clickability and visual balance

/**
 * Generates cup positions for pyramid formations
 * @param cupCount - Number of cups (6 or 10)
 * @returns Array of cup positions with row and index coordinates
 * 
 * Formation patterns:
 * - 6 cups: 3-2-1 pyramid (3 rows)
 * - 10 cups: 4-3-2-1 pyramid (4 rows)
 */
const getCupPositions = (cupCount: number): { row: number; index: number }[] => {
  if (cupCount === 6) {
    // 6 cups: 3-2-1 pyramid
    return [
      { row: 0, index: 0 },
      { row: 0, index: 1 },
      { row: 0, index: 2 },
      { row: 1, index: 0 },
      { row: 1, index: 1 },
      { row: 2, index: 0 },
    ];
  } else {
    // 10 cups: 4-3-2-1 pyramid
    return [
      { row: 0, index: 0 },
      { row: 0, index: 1 },
      { row: 0, index: 2 },
      { row: 0, index: 3 },
      { row: 1, index: 0 },
      { row: 1, index: 1 },
      { row: 1, index: 2 },
      { row: 2, index: 0 },
      { row: 2, index: 1 },
      { row: 3, index: 0 },
    ];
  }
};

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { cupCount, team1Players, team2Players, gameType } = route.params;
  
  // Invert cup IDs: first cup (position 0) gets highest ID (cupCount - 1)
  // This makes the top cup in the pyramid have the highest number
  const [team1Cups, setTeam1Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount).map((pos, idx) => ({
      id: cupCount - 1 - idx, // Inverted: 0 becomes (cupCount-1), last becomes 0
      sunk: false,
      position: pos,
    }))
  );
  
  const [team2Cups, setTeam2Cups] = useState<Cup[]>(() =>
    getCupPositions(cupCount).map((pos, idx) => ({
      id: cupCount - 1 - idx, // Inverted: 0 becomes (cupCount-1), last becomes 0
      sunk: false,
      position: pos,
    }))
  );

  const [selectedCup, setSelectedCup] = useState<{ side: 'team1' | 'team2'; cupId: number } | null>(null);
  const [sinkDialogVisible, setSinkDialogVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [shotType, setShotType] = useState<'regular' | 'bounce' | 'grenade'>('regular');
  const [isPaused, setIsPaused] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [team1Side, setTeam1Side] = useState<'top' | 'bottom'>('bottom'); // Which side team1 is on
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  
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
   * Formats elapsed seconds into MM:SS display format
   */
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handles cup press - opens dialog to record cup sink
   * Only allows clicking on cups that aren't already sunk
   */
  const handleCupPress = (side: 'team1' | 'team2', cupId: number) => {
    const cups = side === 'team1' ? team1Cups : team2Cups;
    const cup = cups.find(c => c.id === cupId);
    
    if (!cup || cup.sunk) {
      return; // Already sunk or invalid
    }

    // Allow clicking on either side - the dialog will show correct players
    // Team 1 players can sink team2 cups, team2 players can sink team1 cups
    setSelectedCup({ side, cupId });
    setSelectedPlayer('');
    setShotType('regular');
    setSinkDialogVisible(true);
  };

  /**
   * Records a cup sink with player attribution and shot type
   * Updates cup state and creates game events for analytics
   * For grenades, records both players from the shooting team
   */
  const handleSinkCup = () => {
    if (!selectedCup || !selectedPlayer) return;

    const isGrenade = shotType === 'grenade';
    const isBounce = shotType === 'bounce';

    // For grenade shots, record both players from the shooting team
    let playersToRecord: string[] = [selectedPlayer];
    if (isGrenade) {
      const shootingTeamPlayers = getAvailablePlayers();
      if (shootingTeamPlayers.length >= 2) {
        // Include both players from the team (2v2 grenade)
        playersToRecord = shootingTeamPlayers;
      } else {
        // Fallback for 1v1 (shouldn't happen, but handle gracefully)
        playersToRecord = [selectedPlayer];
      }
    }

    // Update cup state
    const updateCups = (cups: Cup[]) =>
      cups.map((c) =>
        c.id === selectedCup.cupId
          ? {
              ...c,
              sunk: true,
              sunkAt: Date.now(),
              sunkBy: selectedPlayer,
              isBounce,
              isGrenade,
            }
          : c
      );

    let newTeam1Cups = team1Cups;
    let newTeam2Cups = team2Cups;

    if (selectedCup.side === 'team1') {
      newTeam1Cups = updateCups(team1Cups);
    } else {
      newTeam2Cups = updateCups(team2Cups);
    }

    setTeam1Cups(newTeam1Cups);
    setTeam2Cups(newTeam2Cups);

    // Record game event for each player in grenade
    const timestamp = Date.now();
    const events: GameEvent[] = playersToRecord.map((player) => ({
      eventId: uuidv4(), // Standard UUID v4 for collision prevention
      timestamp, // Timestamp stored separately for ordering logic
      cupId: selectedCup.cupId,
      playerHandle: player,
      isBounce,
      isGrenade,
      isUndone: false, // Initially not undone
      team1CupsRemaining: newTeam1Cups.filter(c => !c.sunk).length,
      team2CupsRemaining: newTeam2Cups.filter(c => !c.sunk).length,
      gameState: {
        team1Cups: newTeam1Cups,
        team2Cups: newTeam2Cups,
      },
    }));

    setGameEvents((prev) => [...prev, ...events]);

    // Close dialog
    setSinkDialogVisible(false);
    setSelectedCup(null);
    setSelectedPlayer('');
    setShotType('regular');
  };

  /**
   * Rotates the table view by swapping team positions
   * Team ownership of cups remains unchanged, only visual perspective changes
   */
  /**
   * Rotates the table view by swapping team positions
   * Team ownership of cups remains unchanged, only visual perspective changes
   */
  const handleRotateTable = () => {
    setTeam1Side((prev) => (prev === 'bottom' ? 'top' : 'bottom'));
  };

  /**
   * Gets the most recent sunk cup for undo functionality
   * Checks current cup state to find the most recently sunk cup
   * Returns the corresponding sink event(s) that need to be undone
   */
  const getLastSinkEvent = (): { side: 'team1' | 'team2'; cupId: number; eventIds: string[] } | null => {
    // Find all currently sunk cups with their sink timestamps
    const sunkCups: Array<{ side: 'team1' | 'team2'; cupId: number; sunkAt: number }> = [];
    
    team1Cups.forEach(cup => {
      if (cup.sunk && cup.sunkAt) {
        sunkCups.push({ side: 'team1', cupId: cup.id, sunkAt: cup.sunkAt });
      }
    });
    
    team2Cups.forEach(cup => {
      if (cup.sunk && cup.sunkAt) {
        sunkCups.push({ side: 'team2', cupId: cup.id, sunkAt: cup.sunkAt });
      }
    });

    if (sunkCups.length === 0) return null;

    // Get the most recently sunk cup
    const lastSunkCup = sunkCups.sort((a, b) => b.sunkAt - a.sunkAt)[0];

    // Find the sink event(s) for this cup that haven't been undone
    // Handles grenades with multiple events per cup sink
    const sinkEvents = gameEvents
      .filter(e => !e.isUndone && 
                   e.cupId === lastSunkCup.cupId &&
                   Math.abs(e.timestamp - lastSunkCup.sunkAt) < 1000) // Within 1 second
      .map(e => e.eventId);

    if (sinkEvents.length === 0) return null;

    return {
      side: lastSunkCup.side,
      cupId: lastSunkCup.cupId,
      eventIds: sinkEvents,
    };
  };

  /**
   * Undoes the most recent cup sink
   * Marks the original event(s) as undone and restores cup state
   * Simple model: just mark isUndone=true for easy analytics filtering
   */
  const handleUndo = () => {
    const lastSink = getLastSinkEvent();
    if (!lastSink) return; // Nothing to undo

    const cups = lastSink.side === 'team1' ? team1Cups : team2Cups;
    const cup = cups.find(c => c.id === lastSink.cupId);
    
    if (!cup || !cup.sunk) return; // Cup not sunk, can't undo

    // Restore cup state
    const updateCups = (cups: Cup[]) =>
      cups.map((c) =>
        c.id === lastSink.cupId
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

    let newTeam1Cups = team1Cups;
    let newTeam2Cups = team2Cups;

    if (lastSink.side === 'team1') {
      newTeam1Cups = updateCups(team1Cups);
    } else {
      newTeam2Cups = updateCups(team2Cups);
    }

    setTeam1Cups(newTeam1Cups);
    setTeam2Cups(newTeam2Cups);

    // Mark the original event(s) as undone
    // This makes analytics trivial: just filter where isUndone = false
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
  const renderCupRow = (cups: Cup[], row: number, side: 'team1' | 'team2', reverse: boolean = false) => {
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
  const renderCups = (cups: Cup[], side: 'team1' | 'team2', isBottomSide: boolean) => {
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
                ...(gameType === '2v2' ? [{ value: 'grenade', label: 'Grenade' }] : []),
              ]}
              style={styles.shotTypeButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                },
              }}
            />

            {shotType === 'grenade' && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.sm }}
              >
                Grenade: Both players made the same cup
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSinkDialogVisible(false)} textColor={theme.colors.onSurface}>
              Cancel
            </Button>
            <Button
              onPress={handleSinkCup}
              disabled={!selectedPlayer}
              mode="contained"
              buttonColor={theme.colors.primary}
            >
              Record
            </Button>
          </Dialog.Actions>
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
              • Grenade: both players sink the same cup{'\n'}
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
});

export default GameScreen;
