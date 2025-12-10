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
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignSystem } from '../theme';
import { GameScreenNavigationProp } from '../types/navigation';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { CupCount, TeamId } from '../types/game';
import { formatTime } from '../utils/timeFormatter';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameState } from '../hooks/useGameState';
import { useCupManagement } from '../hooks/useCupManagement';
import { GameTable } from '../components/game/GameTable';
import { SinkDialog } from '../components/game/SinkDialog';
import { BounceSelectionDialog } from '../components/game/BounceSelectionDialog';
import { RedemptionDialog } from '../components/game/RedemptionDialog';
import { VictoryDialog } from '../components/game/VictoryDialog';
import { EventsDialog } from '../components/game/EventsDialog';
import { createMatch, completeMatch } from '../services/firestoreService';

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Game'>;
}

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { cupCount, team1Players, team2Players, gameType } = route.params;
  
  // Firebase match ID - created when game starts
  const [matchId, setMatchId] = useState<string | null>(null);
  const matchInitializedRef = useRef(false); // Prevent multiple match creations

  // Custom hooks
  const { elapsedSeconds, isPaused, togglePause } = useGameTimer();
  const {
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
  } = useGameState({ cupCount: cupCount as CupCount });

  // Dialog visibility states
  const [sinkDialogVisible, setSinkDialogVisible] = useState(false);
  const [bounceCupSelectionVisible, setBounceCupSelectionVisible] = useState(false);
  const [redemptionVisible, setRedemptionVisible] = useState(false);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [victoriousPlayer, setVictoriousPlayer] = useState<string>('');
  const [rulesVisible, setRulesVisible] = useState(false);
  const [eventsVisible, setEventsVisible] = useState(false);

  // Create match in Firestore when game starts
  useEffect(() => {
    // Prevent multiple match creations (e.g., from React Strict Mode or remounts)
    if (matchInitializedRef.current) {
      return;
    }
    
    matchInitializedRef.current = true;
    
    const initializeMatch = async () => {
      const newMatchId = await createMatch(
        gameType,
        cupCount as CupCount,
        team1Players,
        team2Players
      );
      if (newMatchId) {
        setMatchId(newMatchId);
        console.log('Match initialized:', newMatchId);
      }
    };

    initializeMatch();
  }, []); // Only run once when component mounts

  // Cup management hook
  const cupManagement = useCupManagement({
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
    onVictory: (winner: TeamId) => {
      setWinningTeam(winner);
      setRedemptionVisible(true);
    },
  });

  /**
   * Handles cup press - opens dialog to record cup sink
   */
  const handleCupPress = (side: TeamId, cupId: number) => {
    cupManagement.handleCupPress(side, cupId);
    setSinkDialogVisible(true);
  };

  /**
   * Handles sink cup confirmation
   */
  const handleSinkCup = () => {
    const isBounce = cupManagement.handleSinkCup();
    
    // If bounce shot, open bounce cup selection dialog
    if (isBounce) {
      setSinkDialogVisible(false);
      setBounceCupSelectionVisible(true);
      return;
    }

    // Regular shot - close dialog
    setSinkDialogVisible(false);
  };

  /**
   * Handles bounce cup selection
   */
  const handleBounceCupSelect = (bounceCupId: number) => {
    cupManagement.handleBounceCupSelect(bounceCupId);
    setBounceCupSelectionVisible(false);
  };

  /**
   * Rotates the table view by swapping team positions
   */
  const handleRotateTable = () => {
    setTeam1Side((prev) => (prev === 'bottom' ? 'top' : 'bottom'));
  };

  /**
   * Handles redemption "Play on" option
   */
  const handleRedemptionPlayOn = () => {
    const lastSink = cupManagement.getLastSinkEvent();
    if (lastSink) {
      const eventsToCheck = gameEvents.filter(e => 
        lastSink.eventIds.includes(e.eventId) && !e.isUndone
      );
      
      // Check if this was a bounce shot
      const isBounce = eventsToCheck.some(e => e.isBounce && e.bounceGroupId);
      
      if (isBounce && eventsToCheck.length === 2) {
        // For bounce: restore only the first cup (the one that triggered the bounce)
        // The second cup (selected in bounce menu) stays sunk
        // Use the first cupId from the lastSink (the original cup that was clicked)
        if (lastSink.cupIds.length > 0) {
          cupManagement.restoreCups([lastSink.cupIds[0]]);
        }
      } else {
        // Regular shot: restore the cup(s)
        cupManagement.restoreCups(lastSink.cupIds);
      }
    }
    setRedemptionVisible(false);
    setWinningTeam(null);
  };

  /**
   * Handles redemption "Win" option
   */
  const handleRedemptionWin = () => {
    // Store winning team before clearing state
    const currentWinningTeam = winningTeam;
    
    setRedemptionVisible(false);
    // Show victory overlay with winning player name
    const winningPlayers = currentWinningTeam === 'team1' 
      ? team1Players.map(p => p.handle).join(' & ')
      : team2Players.map(p => p.handle).join(' & ');
    setVictoriousPlayer(winningPlayers);
    setVictoryVisible(true);
    setWinningTeam(null);
    
    // Mark match as completed in Firestore
    if (matchId && currentWinningTeam) {
      const winningSide: 0 | 1 = currentWinningTeam === 'team1' ? 0 : 1;
      completeMatch(matchId, winningSide).catch(error => {
        console.error('Failed to complete match:', error);
      });
    }
  };

  /**
   * Handles victory dialog home button
   */
  const handleVictoryHome = () => {
    setVictoryVisible(false);
    setVictoriousPlayer('');
    navigation.navigate('Home');
  };

  // Determine opponent cups for bounce selection
  const opponentCups = cupManagement.selectedCup?.side === 'team1' ? team1Cups : team2Cups;
  const opponentSide = cupManagement.selectedCup?.side || 'team1';

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
      <GameTable
        team1Cups={team1Cups}
        team2Cups={team2Cups}
        team1Side={team1Side}
        team1Players={team1Players}
        team2Players={team2Players}
        onCupPress={handleCupPress}
        disabled={isPaused}
      />

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={togglePause}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon={isPaused ? 'play' : 'pause'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          mode="outlined"
          onPress={cupManagement.handleUndo}
          style={styles.actionButton}
          textColor={theme.colors.onSurface}
          icon="undo"
          disabled={!cupManagement.getLastSinkEvent() || isPaused}
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
        {__DEV__ && (
          <Button
            mode="outlined"
            onPress={() => setEventsVisible(true)}
            style={styles.actionButton}
            textColor={theme.colors.onSurface}
            icon="database"
          >
            Events
          </Button>
        )}
      </View>

      {/* Dialogs */}
      <Portal>
        <SinkDialog
          visible={sinkDialogVisible}
          onDismiss={() => {
            setSinkDialogVisible(false);
            cupManagement.setSelectedCup(null);
          }}
          onConfirm={handleSinkCup}
          gameType={gameType}
          availablePlayers={cupManagement.getAvailablePlayers()}
          selectedPlayer={cupManagement.selectedPlayer}
          onPlayerSelect={cupManagement.setSelectedPlayer}
          shotType={cupManagement.shotType}
          onShotTypeChange={cupManagement.setShotType}
        />

        <BounceSelectionDialog
          visible={bounceCupSelectionVisible}
          onDismiss={() => {
            setBounceCupSelectionVisible(false);
            setSinkDialogVisible(true); // Return to sink dialog
          }}
          onBack={() => {
            setBounceCupSelectionVisible(false);
            setSinkDialogVisible(true);
          }}
          onConfirm={handleBounceCupSelect}
          selectedCup={cupManagement.selectedCup}
          opponentCups={opponentCups}
          opponentSide={opponentSide}
          team1Side={team1Side}
          selectedBounceCup={cupManagement.selectedBounceCup}
          onBounceCupSelect={cupManagement.setSelectedBounceCup}
        />

        <RedemptionDialog
          visible={redemptionVisible}
          winningTeam={winningTeam}
          team1Players={team1Players}
          team2Players={team2Players}
          onPlayOn={handleRedemptionPlayOn}
          onWin={handleRedemptionWin}
        />

        <VictoryDialog
          visible={victoryVisible}
          victoriousPlayer={victoriousPlayer}
          onHome={handleVictoryHome}
        />

        {/* Rules Dialog */}
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

        {/* Events Dialog - Dev Only */}
        {__DEV__ && (
          <EventsDialog
            visible={eventsVisible}
            onDismiss={() => setEventsVisible(false)}
            events={gameEvents}
          />
        )}
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
});

export default GameScreen;
