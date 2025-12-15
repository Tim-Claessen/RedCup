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
import { GameControlsMenu } from '../components/game/GameControlsMenu';
import { SurrenderDialog } from '../components/game/SurrenderDialog';
import { RerackDialog } from '../components/game/RerackDialog';
import { createMatch, completeMatch, markMatchAsDNF } from '../services/firestoreService';

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Game'>;
}

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { cupCount, team1Players, team2Players, gameType } = route.params;
  
// ----- Match identity & high-level game flags -----
// Firebase match ID - created when game starts
  const [matchId, setMatchId] = useState<string | null>(null);
  const matchInitializedRef = useRef(false); // Prevent multiple match creations
  const [matchCompleted, setMatchCompleted] = useState(false);
  const matchCompletedRef = useRef(false); // always holds latest completion state for unmount checks
  const [isGameOver, setIsGameOver] = useState(false);

// ----- Core hooks: timer + game/cup state -----
  const { elapsedSeconds, isPaused, setIsPaused, togglePause } = useGameTimer();
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
    team1CupsRemaining,
    team2CupsRemaining,
  } = useGameState({ cupCount: cupCount as CupCount });

  // Dialog visibility states
  const [sinkDialogVisible, setSinkDialogVisible] = useState(false);
  const [bounceCupSelectionVisible, setBounceCupSelectionVisible] = useState(false);
  const [redemptionVisible, setRedemptionVisible] = useState(false);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [victoriousPlayer, setVictoriousPlayer] = useState<string>('');
  const [rulesVisible, setRulesVisible] = useState(false);
  const [eventsVisible, setEventsVisible] = useState(false);
  const [surrenderDialogVisible, setSurrenderDialogVisible] = useState(false);
  const [rerackDialogVisible, setRerackDialogVisible] = useState(false);

// ----- Lifecycle: create match on mount -----
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

// ----- Lifecycle: mark match as DNF on unmount if not completed -----
// Uses a ref so the cleanup reads the latest completion state even if it changed
// after this effect was created.
  useEffect(() => {
    if (!matchId) return;

    return () => {
      if (!matchCompletedRef.current) {
        markMatchAsDNF(matchId).catch(error => {
          console.error('Failed to mark match as DNF on unmount:', error);
        });
      }
    };
  }, [matchId]);

// ----- Cup management: sinks, undo, redemption, victory -----
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
    cupCount: cupCount as CupCount,
  });

// ----- Event handlers -----
// Handles cup press - opens dialog to record cup sink
  const handleCupPress = (side: TeamId, cupId: number) => {
    cupManagement.handleCupPress(side, cupId);
    setSinkDialogVisible(true);
  };

// Handles sink cup confirmation (regular vs bounce)
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

// Handles bounce cup selection for 2-cup bounce shots
  const handleBounceCupSelect = (bounceCupId: number) => {
    cupManagement.handleBounceCupSelect(bounceCupId);
    setBounceCupSelectionVisible(false);
  };

// Rotates the table view by swapping team positions
  const handleRotateTable = () => {
    setTeam1Side((prev) => (prev === 'bottom' ? 'top' : 'bottom'));
  };

// Handles redemption "Play on" option
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

// Handles redemption "Win" option
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
    setIsPaused(true);
    setIsGameOver(true);
    
    // Mark match as completed in Firestore
    if (matchId && currentWinningTeam) {
      const winningSide: 0 | 1 = currentWinningTeam === 'team1' ? 0 : 1;

      // Compute final scores based on cups made by each team.
      // Each team starts with `cupCount` cups; a team's score is the number of
      // opponent cups they have sunk.
      const totalCups = cupCount as number;
      const team1Score = totalCups - team2CupsRemaining;
      const team2Score = totalCups - team1CupsRemaining;

      completeMatch(matchId, winningSide, team1Score, team2Score)
        .then(success => {
          if (success) {
            setMatchCompleted(true);
            matchCompletedRef.current = true;
          }
        })
        .catch(error => {
          console.error('Failed to complete match:', error);
        });
    }
  };

// Handles surrender flow: losing side concedes and remaining cups are
// only reflected in the match result (cup state/events stay unchanged).
  const handleSurrender = (surrenderingTeam: TeamId) => {
    if (!matchId) {
      console.warn('Cannot surrender without a matchId');
      setSurrenderDialogVisible(false);
      return;
    }

    const totalCups = cupCount as number;

    // Current scores based on cups already sunk
    const team1ScoreCurrent = totalCups - team2CupsRemaining;
    const team2ScoreCurrent = totalCups - team1CupsRemaining;

    let winningSide: 0 | 1;
    let finalTeam1Score: number;
    let finalTeam2Score: number;

    if (surrenderingTeam === 'team1') {
      // Team 1 surrenders -> Team 2 gets credit for all remaining team1 cups
      winningSide = 1;
      finalTeam2Score = totalCups;
      finalTeam1Score = team1ScoreCurrent;
    } else {
      // Team 2 surrenders -> Team 1 gets credit for all remaining team2 cups
      winningSide = 0;
      finalTeam1Score = totalCups;
      finalTeam2Score = team2ScoreCurrent;
    }

    // Pause timer and mark end-of-game state
    setIsPaused(true);
    setIsGameOver(true);

    // Show victory dialog with winning team name(s)
    const winningPlayers =
      winningSide === 0
        ? team1Players.map(p => p.handle).join(' & ')
        : team2Players.map(p => p.handle).join(' & ');
    setVictoriousPlayer(winningPlayers);
    setVictoryVisible(true);

    completeMatch(matchId, winningSide, finalTeam1Score, finalTeam2Score)
      .then(success => {
        if (success) {
          setMatchCompleted(true);
          matchCompletedRef.current = true;
        }
      })
      .catch(error => {
        console.error('Failed to complete match on surrender:', error);
      });

    setSurrenderDialogVisible(false);
  };

// Handles victory dialog "Home" button
  const handleVictoryHome = () => {
    setVictoryVisible(false);
    setVictoriousPlayer('');
    navigation.navigate('Home');
  };

// ----- Derived values for rendering -----
// Determine opponent cups for bounce selection
  const opponentCups = cupManagement.selectedCup?.side === 'team1' ? team1Cups : team2Cups;
  const opponentSide = cupManagement.selectedCup?.side || 'team1';

  // Human-readable labels for teams based on player handles
  const team1Label =
    team1Players.map(p => p.handle).filter(Boolean).join(' & ') || 'Team 1';
  const team2Label =
    team2Players.map(p => p.handle).filter(Boolean).join(' & ') || 'Team 2';

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
        disabled={isPaused || isGameOver}
      />

      {/* Action Controls */}
      <GameControlsMenu
        isPaused={isPaused}
        isGameOver={isGameOver}
        hasUndo={!!cupManagement.getLastSinkEvent()}
        onTogglePause={togglePause}
        onUndo={cupManagement.handleUndo}
        onShowRules={() => setRulesVisible(true)}
        onRotateTable={handleRotateTable}
        onShowRerack={() => setRerackDialogVisible(true)}
        onShowSurrender={() => setSurrenderDialogVisible(true)}
        onShowEvents={__DEV__ ? () => setEventsVisible(true) : undefined}
      />

      {/* Dialogs */}
      <Portal>
        <RerackDialog
          visible={rerackDialogVisible}
          team1Label={team1Label}
          team2Label={team2Label}
          team1Remaining={team1CupsRemaining}
          team2Remaining={team2CupsRemaining}
          cupCount={cupCount as CupCount}
          onDismiss={() => setRerackDialogVisible(false)}
          onRerack={(team, slots) => {
            cupManagement.rerackSide(team, slots);
            setRerackDialogVisible(false);
          }}
        />

        <SurrenderDialog
          visible={surrenderDialogVisible}
          team1Label={team1Label}
          team2Label={team2Label}
          onDismiss={() => setSurrenderDialogVisible(false)}
          onSurrender={handleSurrender}
        />

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
});

export default GameScreen;
