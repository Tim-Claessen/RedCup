/**
 * MatchHistoryScreen Component
 * 
 * Displays past matches for the current user with key statistics.
 * Shows opponent, duration, result, cups sunk, and cups sunk by opponent.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { DesignSystem } from '../theme';
import { Timestamp } from 'firebase/firestore';
import { getUserMatchHistory, MatchHistoryEntry } from '../services/firestoreService';

interface MatchHistoryScreenProps {
  navigation: HomeScreenNavigationProp;
}

const MatchHistoryScreen: React.FC<MatchHistoryScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatchHistory();
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMatchHistory = async () => {
    if (!user?.uid) {
      setError('Please log in to view match history');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const history = await getUserMatchHistory(user.uid, 100);
      setMatchHistory(history);
    } catch (err) {
      console.error('Error loading match history:', err);
      setError('Failed to load match history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date();
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Unknown date';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMatchCard = (match: MatchHistoryEntry, index: number) => {
    const isWin = match.result === 'win';
    
    return (
      <Card
        key={match.matchId}
        style={[styles.matchCard, { backgroundColor: theme.colors.surface }]}
      >
        <Card.Content>
          <View style={styles.matchHeader}>
            <View style={styles.matchResultContainer}>
              <Chip
                icon={isWin ? 'trophy' : 'close-circle'}
                style={[
                  styles.resultChip,
                  {
                    backgroundColor: isWin
                      ? theme.colors.primary
                      : theme.colors.errorContainer,
                  },
                ]}
                textStyle={{
                  color: isWin
                    ? theme.colors.onPrimary
                    : theme.colors.onErrorContainer,
                }}
              >
                {isWin ? 'WIN' : 'LOSS'}
              </Chip>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.xs }}>
                {formatDate(match.completedAt)}
              </Text>
            </View>
            <View style={styles.matchTypeContainer}>
              <Chip compact style={styles.typeChip}>
                {match.gameType.toUpperCase()}
              </Chip>
              <Chip compact style={styles.typeChip}>
                {match.cupCount} Cups
              </Chip>
            </View>
          </View>

          <View style={styles.matchDetails}>
            <View style={styles.opponentSection}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: DesignSystem.spacing.xs }}>
                {match.gameType === '1v1' ? 'Opponent' : 'Opponents'}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                {match.opponentHandles.join(' & ')}
              </Text>
            </View>

            {match.partnerHandle && (
              <View style={styles.partnerSection}>
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: DesignSystem.spacing.xs }}>
                  Partner
                </Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  {match.partnerHandle}
                </Text>
              </View>
            )}

            <View style={styles.statsSection}>
              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Duration:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {formatDuration(match.durationSeconds)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  You Sunk:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {match.userCupsSunk} cups
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Opponent Sunk:
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                  {match.opponentCupsSunk} cups
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          textColor={theme.colors.onSurface}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, flex: 1, textAlign: 'center' }}>
          Match History
        </Text>
        <View style={{ width: 80 }} />
      </View>

      {error && (
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>
              {error}
            </Text>
          </Card.Content>
        </Card>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.md }}>
            Loading match history...
          </Text>
        </View>
      ) : matchHistory.length === 0 ? (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No match history. Build your legacy—every cup counts.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.historyContainer}>
            {matchHistory.map((match, index) => renderMatchCard(match, index))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  card: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  errorCard: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xxl,
  },
  historyContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  matchCard: {
    marginBottom: DesignSystem.spacing.md,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.md,
  },
  matchResultContainer: {
    flex: 1,
  },
  resultChip: {
    alignSelf: 'flex-start',
  },
  matchTypeContainer: {
    flexDirection: 'row',
    gap: DesignSystem.spacing.xs,
  },
  typeChip: {
    marginLeft: DesignSystem.spacing.xs,
  },
  matchDetails: {
    gap: DesignSystem.spacing.md,
  },
  opponentSection: {
    marginBottom: DesignSystem.spacing.xs,
  },
  partnerSection: {
    marginBottom: DesignSystem.spacing.xs,
  },
  statsSection: {
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
});

export default MatchHistoryScreen;

