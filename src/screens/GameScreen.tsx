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
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, useTheme, Dialog, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';

import { createMatch, completeMatch } from '../services/firestoreService';
import { GameScreenNavigationProp, RootStackParamList } from '../types/navigation';
import { CupCount, TeamId } from '../types/game';
import { GameTable } from '../components/game/GameTable';
import { SinkDialog } from '../components/game/SinkDialog';
import { BounceSelectionDialog } from '../components/game/BounceSelectionDialog';
import { RedemptionDialog } from '../components/game/RedemptionDialog';
import { VictoryDialog } from '../components/game/VictoryDialog';
import { EventsDialog } from '../components/game/EventsDialog';
import { GameControlsMenu } from '../components/game/GameControlsMenu';
import { SurrenderDialog } from '../components/game/SurrenderDialog';
import { RerackDialog } from '../components/game/RerackDialog';
import { ExitGameDialog } from '../components/game/ExitGameDialog';
import { useGameTimer } from '../hooks/useGameTimer';
import { useGameState } from '../hooks/useGameState';
import { useCupManagement } from '../hooks/useCupManagement';
import { DesignSystem } from '../theme';
import { formatTime } from '../utils/timeFormatter';

interface GameScreenProps {
  navigation: GameScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Game'>;
}

const GameScreen: React.FC<GameScreenProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { cupCount, team1Players, team2Players, gameType } = route.params;
  
  const [matchId, setMatchId] = useState<string | null>(null);
  const matchInitializedRef = useRef(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const matchCompletedRef = useRef(false);
  const dnfAttemptedRef = useRef(false);
  const [isGameOver, setIsGameOver] = useState(false);

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

  const [sinkDialogVisible, setSinkDialogVisible] = useState(false);
  const [bounceCupSelectionVisible, setBounceCupSelectionVisible] = useState(false);
  const [redemptionVisible, setRedemptionVisible] = useState(false);
  const [victoryVisible, setVictoryVisible] = useState(false);
  const [victoriousPlayer, setVictoriousPlayer] = useState<string>('');
  const [rulesVisible, setRulesVisible] = useState(false);
  const [eventsVisible, setEventsVisible] = useState(false);
  const [surrenderDialogVisible, setSurrenderDialogVisible] = useState(false);
  const [rerackDialogVisible, setRerackDialogVisible] = useState(false);
  const [exitGameDialogVisible, setExitGameDialogVisible] = useState(false);
  
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const isNavigatingAwayRef = useRef(false);

  useEffect(() => {
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
      }
    };

    initializeMatch();
  }, []);

  useEffect(() => {
    if (matchCompletedRef.current || isGameOver) {
      return;
    }

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (matchCompletedRef.current || isGameOver) {
        return;
      }

      if (isNavigatingAwayRef.current) {
        return;
      }

      e.preventDefault();

      setExitGameDialogVisible(true);
      
      pendingNavigationRef.current = () => {
        setExitGameDialogVisible(false);
        isNavigatingAwayRef.current = true;
        navigation.dispatch(e.data.action);
      };
    });

    return unsubscribe;
  }, [navigation, isGameOver]);

  const handleExitGameCancel = () => {
    setExitGameDialogVisible(false);
    pendingNavigationRef.current = null;
  };

  const handleExitGameConfirm = () => {
    setExitGameDialogVisible(false);
    isNavigatingAwayRef.current = true;
    
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  };

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

  const handleSinkCup = () => {
    const isBounce = cupManagement.handleSinkCup();
    
    if (isBounce) {
      setSinkDialogVisible(false);
      setBounceCupSelectionVisible(true);
      return;
    }

    setSinkDialogVisible(false);
  };

  const handleBounceCupSelect = (bounceCupId: number) => {
    cupManagement.handleBounceCupSelect(bounceCupId);
    setBounceCupSelectionVisible(false);
  };

  const handleRotateTable = () => {
    setTeam1Side((prev) => (prev === 'bottom' ? 'top' : 'bottom'));
  };

  const handleRedemptionPlayOn = () => {
    const lastSink = cupManagement.getLastSinkEvent();
    if (lastSink) {
      const eventsToCheck = gameEvents.filter(e => 
        lastSink.eventIds.includes(e.eventId) && !e.isUndone
      );
      
      const isBounce = eventsToCheck.some(e => e.isBounce && e.bounceGroupId);
      const isGrenade = eventsToCheck.some(e => e.isGrenade && e.grenadeGroupId);
      
      if (isBounce && eventsToCheck.length === 2) {
        // Bounce: restore only first cup (trigger cup), second cup stays sunk (game rule)
        if (lastSink.cupIds.length > 0) {
          cupManagement.restoreCups([lastSink.cupIds[0]]);
        }
      } else if (isGrenade) {
        // Grenade: restore only clicked cup, touching cups stay sunk (game rule)
        if (lastSink.cupIds.length > 0) {
          cupManagement.restoreCups([lastSink.cupIds[0]]);
        }
      } else {
        cupManagement.restoreCups(lastSink.cupIds);
      }
    }
    setRedemptionVisible(false);
    setWinningTeam(null);
  };

  const handleRedemptionWin = () => {
    const currentWinningTeam = winningTeam;
    
    setRedemptionVisible(false);
    const winningPlayers = currentWinningTeam === 'team1' 
      ? team1Players.map(p => p.handle).join(' & ')
      : team2Players.map(p => p.handle).join(' & ');
    setVictoriousPlayer(winningPlayers);
    setVictoryVisible(true);
    setWinningTeam(null);
    setIsPaused(true);
    setIsGameOver(true);
    
    if (matchId && currentWinningTeam) {
      const winningSide: 0 | 1 = currentWinningTeam === 'team1' ? 0 : 1;

      const totalCups = cupCount;
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

  const handleSurrender = (surrenderingTeam: TeamId) => {
    if (!matchId) {
      console.warn('Cannot surrender without a matchId');
      setSurrenderDialogVisible(false);
      return;
    }

    const totalCups = cupCount;

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

  const handleVictoryHome = () => {
    setVictoryVisible(false);
    setVictoriousPlayer('');
    navigation.navigate('Home');
  };

  const opponentCups = cupManagement.selectedCup?.side === 'team1' ? team1Cups : team2Cups;
  const opponentSide = cupManagement.selectedCup?.side || 'team1';

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
        <View style={[styles.timerCard, { 
          backgroundColor: theme.colors.surface,
          borderColor: 'rgba(0, 209, 255, 0.3)', // Electric Cyan with opacity
        }]}>
          <Text 
            variant="displaySmall" 
            style={[
              styles.timerText,
              { 
                color: theme.colors.primary,
                ...(Platform.OS === 'ios' ? {
                  textShadowColor: theme.colors.primary,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 12,
                } : {}),
              }
            ]}
          >
            {formatTime(elapsedSeconds)}
          </Text>
        </View>
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

        <ExitGameDialog
          visible={exitGameDialogVisible}
          onDismiss={handleExitGameCancel}
          onConfirm={handleExitGameConfirm}
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
          <Dialog.Title>Rules</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.sm }}>
              • Teams alternate turns{'\n'}
              • Sink all opponent cups to win{'\n'}
              • Bounce shots: 2 cups{'\n'}
              • Rotate table to switch perspective
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
    paddingVertical: DesignSystem.spacing.lg,
    paddingHorizontal: DesignSystem.spacing.md,
  },
  timerCard: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.xl,
    borderWidth: 1,
    // Shadow effects for cyberpunk glow
    ...Platform.select({
      ios: {
        shadowColor: '#00D1FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  timerText: {
    fontVariant: ['tabular-nums'], // Tabular numbers for perfect alignment per branding.md
    fontWeight: '600',
    letterSpacing: 2,
  },
});

export default GameScreen;
