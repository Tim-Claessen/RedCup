/**
 * QuickGameSetupScreen Component
 * 
 * Screen for configuring a quick beer pong game before starting.
 * Allows users to select game type (1v1 or 2v2), cup count (6 or 10),
 * and enter player names for each team.
 * 
 * Features:
 * - Game type selection (1v1/2v2) - automatically adjusts player count
 * - Cup count selection (6 or 10 cups)
 * - Player name input for each team
 * - Validates all required fields before allowing game start
 * 
 * TODO: Integrate with match creation service (Firestore)
 * TODO: Auto-populate logged-in user's handle
 * TODO: Add friend/contact selection
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Card,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignSystem } from '../theme';
import { QuickGameSetupScreenNavigationProp } from '../types/navigation';

interface QuickGameSetupScreenProps {
  navigation: QuickGameSetupScreenNavigationProp;
}

/**
 * Player interface for team roster management
 */
interface Player {
  id: string;
  handle: string;
}

const QuickGameSetupScreen: React.FC<QuickGameSetupScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [cupCount, setCupCount] = useState<'6' | '10'>('6');
  const [gameType, setGameType] = useState<'1v1' | '2v2'>('1v1');
  const [team1Players, setTeam1Players] = useState<Player[]>([
    { id: `${Date.now()}-${Math.random()}`, handle: '' },
  ]);
  const [team2Players, setTeam2Players] = useState<Player[]>([
    { id: `${Date.now()}-${Math.random()}`, handle: '' },
  ]);

  /**
   * Effect to sync player count with selected game type
   * - 1v1: Ensures exactly 1 player per team
   * - 2v2: Ensures exactly 2 players per team
   * Automatically adds/removes player slots when game type changes
   */
  useEffect(() => {
    if (gameType === '1v1') {
      setTeam1Players(prev => {
        if (prev.length > 1) {
          return [prev[0]];
        }
        if (prev.length === 0) {
          return [{ id: `${Date.now()}-${Math.random()}`, handle: '' }];
        }
        return prev;
      });
      setTeam2Players(prev => {
        if (prev.length > 1) {
          return [prev[0]];
        }
        if (prev.length === 0) {
          return [{ id: `${Date.now()}-${Math.random()}`, handle: '' }];
        }
        return prev;
      });
    } else {
      setTeam1Players(prev => {
        if (prev.length < 2) {
          const newPlayers = [...prev];
          while (newPlayers.length < 2) {
            newPlayers.push({ id: `${Date.now()}-${Math.random()}`, handle: '' });
          }
          return newPlayers;
        } else if (prev.length > 2) {
          return prev.slice(0, 2);
        }
        return prev;
      });
      setTeam2Players(prev => {
        if (prev.length < 2) {
          const newPlayers = [...prev];
          while (newPlayers.length < 2) {
            newPlayers.push({ id: `${Date.now()}-${Math.random()}`, handle: '' });
          }
          return newPlayers;
        } else if (prev.length > 2) {
          return prev.slice(0, 2);
        }
        return prev;
      });
    }
  }, [gameType]);

  /**
   * Updates a player's handle in the specified team's roster
   */
  const updatePlayer = (team: 1 | 2, playerId: string, handle: string) => {
    const setter = team === 1 ? setTeam1Players : setTeam2Players;
    const players = team === 1 ? team1Players : team2Players;
    setter(players.map((p) => (p.id === playerId ? { ...p, handle } : p)));
  };

  /**
   * Validates that all required fields are filled before allowing game start
   * Checks that correct number of players are entered and all have handles
   */
  const canStartGame = () => {
    const requiredPlayers = gameType === '1v1' ? 1 : 2;
    const allPlayers = [...team1Players, ...team2Players];
    return (
      team1Players.length === requiredPlayers &&
      team2Players.length === requiredPlayers &&
      allPlayers.every((p) => p.handle.trim() !== '')
    );
  };

  /**
   * Handles game start - validates configuration and navigates to GameScreen
   * TODO: Create match in Firestore before navigation
   */
  const handleStartGame = () => {
    if (!canStartGame()) return;

    // TODO: Create match in Firestore
    const matchData = {
      cupCount: parseInt(cupCount),
      team1Players: team1Players.map((p) => ({ handle: p.handle.trim() || 'Guest' })),
      team2Players: team2Players.map((p) => ({ handle: p.handle.trim() || 'Guest' })),
      gameType,
    };

    // Navigate to game screen with game configuration
    navigation.navigate('Game', {
      cupCount: parseInt(cupCount),
      team1Players: team1Players.map((p) => ({ handle: p.handle.trim() || 'Guest' })),
      team2Players: team2Players.map((p) => ({ handle: p.handle.trim() || 'Guest' })),
      gameType: gameType,
    });
  };

  /**
   * Renders the player input section for a team
   */
  const renderTeam = (team: 1 | 2, players: Player[], teamName: string) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          {teamName}
        </Text>
        {players.map((player, index) => (
          <View key={player.id} style={styles.playerRow}>
            <TextInput
              mode="outlined"
              label={`Player ${index + 1}`}
              placeholder="Enter name..."
              value={player.handle}
              onChangeText={(text) => updatePlayer(team, player.id, text)}
              style={styles.playerInput}
              contentStyle={styles.inputContent}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            textColor={theme.colors.onSurface}
            icon="arrow-left"
          >
            Back
          </Button>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
            Quick Game Setup
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Game Type
            </Text>
            <SegmentedButtons
              value={gameType}
              onValueChange={(value) => {
                if (value === '1v1' || value === '2v2') {
                  setGameType(value);
                }
              }}
              buttons={[
                { value: '1v1', label: '1 vs 1' },
                { value: '2v2', label: '2 vs 2' },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                },
              }}
            />
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Cup Configuration
            </Text>
            <SegmentedButtons
              value={cupCount}
              onValueChange={(value) => {
                if (value === '6' || value === '10') {
                  setCupCount(value);
                }
              }}
              buttons={[
                { value: '6', label: '6 Cups' },
                { value: '10', label: '10 Cups' },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                },
              }}
            />
          </Card.Content>
        </Card>

        {renderTeam(1, team1Players, 'Team 1')}
        {renderTeam(2, team2Players, 'Team 2')}

        <Button
          mode="contained"
          onPress={handleStartGame}
          disabled={!canStartGame()}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
          labelStyle={styles.startButtonLabel}
          buttonColor={canStartGame() ? theme.colors.primary : theme.colors.surfaceDisabled}
        >
          Start Game
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  card: {
    marginBottom: DesignSystem.spacing.md,
    elevation: 0,
  },
  sectionTitle: {
    marginBottom: DesignSystem.spacing.md,
  },
  segmentedButtons: {
    marginTop: DesignSystem.spacing.sm,
  },
  sideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.sm,
    gap: DesignSystem.spacing.xs,
  },
  playerInput: {
    flex: 1,
  },
  inputContent: {
    minHeight: 48,
  },
  startButton: {
    marginTop: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.xl,
  },
  startButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
  },
  startButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default QuickGameSetupScreen;
