/**
 * StatsScreen Component
 * 
 * Displays user statistics and leaderboards with filtering options.
 * Shows games played, win percentage, cup statistics, bounce shots, and grenades.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  SegmentedButtons,
  Chip,
  Dialog,
  Portal,
  List,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatsScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { DesignSystem } from '../theme';
import { getUserStats, getLeaderboardStats, StatsFilter, UserStats, LeaderboardSortOption } from '../services/firestoreService';
import { GameType, CupCount } from '../types/game';
import { searchUsersByHandle } from '../services/userService';

interface StatsScreenProps {
  navigation: StatsScreenNavigationProp;
}

type ViewMode = 'user' | 'leaderboard';

const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('user');
  const [gameType, setGameType] = useState<GameType | undefined>(undefined);
  const [cupCount, setCupCount] = useState<CupCount | undefined>(undefined);
  const [partnerUserId, setPartnerUserId] = useState<string | null | undefined>(undefined);
  const [sortBy, setSortBy] = useState<LeaderboardSortOption>('winPercentage');
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [partnerSearchResults, setPartnerSearchResults] = useState<Array<{ userId: string; handle: string }>>([]);
  const [partnerDialogVisible, setPartnerDialogVisible] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<{ userId: string; handle: string } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [viewMode, gameType, cupCount, partnerUserId, sortBy, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (partnerSearchTerm.trim().length >= 2) {
      searchPartners(partnerSearchTerm.trim());
    } else {
      setPartnerSearchResults([]);
    }
  }, [partnerSearchTerm]);

  const searchPartners = async (searchTerm: string) => {
    try {
      const results = await searchUsersByHandle(searchTerm, 10);
      const filtered = results.filter(r => r.userId !== user?.uid);
      setPartnerSearchResults(filtered);
    } catch (err) {
      console.error('Error searching partners:', err);
    }
  };

  const loadStats = async () => {
    if (!user?.uid) {
      setError('Please log in to view stats');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: StatsFilter = {
        gameType,
        cupCount,
        partnerUserId,
      };

      if (viewMode === 'user') {
        const stats = await getUserStats(user.uid, filters);
        if (stats) {
          setUserStats(stats);
        } else {
          setError('Failed to load stats');
        }
      } else {
        const leaderboardData = await getLeaderboardStats(filters, sortBy, 50);
        setLeaderboard(leaderboardData);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSelect = (partner: { userId: string; handle: string } | null) => {
    setSelectedPartner(partner);
    setPartnerUserId(partner?.userId ?? null);
    setPartnerDialogVisible(false);
    setPartnerSearchTerm('');
    setPartnerSearchResults([]);
  };

  const handleOpenPartnerDialog = () => {
    setPartnerDialogVisible(true);
    setPartnerSearchTerm('');
    setPartnerSearchResults([]);
  };

  const clearFilters = () => {
    setGameType(undefined);
    setCupCount(undefined);
    setPartnerUserId(undefined);
    setSelectedPartner(null);
    setPartnerSearchTerm('');
    setPartnerSearchResults([]);
  };

  const hasActiveFilters = gameType !== undefined || cupCount !== undefined || partnerUserId !== undefined;

  const renderStatCard = (label: string, value: string | number, subtitle?: string) => {
    return (
      <Card style={[styles.statCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Card.Content>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {label}
          </Text>
          <Text variant="headlineMedium" style={{ color: theme.colors.onSurface, marginTop: DesignSystem.spacing.xs }}>
            {value}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.xs }}>
              {subtitle}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderSortOptions = () => {
    const sortOptions: Array<{ value: LeaderboardSortOption; label: string }> = [
      { value: 'wins', label: 'Total Wins' },
      { value: 'winPercentage', label: 'Win %' },
      { value: 'totalCupsSunk', label: 'Cups Sunk' },
      { value: 'cupsPerGame', label: 'Cups/Game' },
      { value: 'totalBounceShots', label: 'Bounce Shots' },
      { value: 'bounceShotPercentage', label: 'Bounce %' },
    ];

    return (
      <Card style={[styles.filtersCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
            Sort By
          </Text>
          <View style={styles.chipContainer}>
            {sortOptions.map((option) => (
              <Chip
                key={option.value}
                selected={sortBy === option.value}
                onPress={() => setSortBy(option.value)}
                style={styles.chip}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderFilters = () => {
    return (
      <Card style={[styles.filtersCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.filtersCardContent}>
          <View style={styles.filtersHeader}>
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              Filters
            </Text>
            {hasActiveFilters && (
              <Button
                mode="text"
                compact
                onPress={clearFilters}
                textColor={theme.colors.primary}
                labelStyle={{ fontSize: 12 }}
              >
                Clear All
              </Button>
            )}
          </View>

          <View style={styles.filterRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Game Type
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={gameType === '1v1'}
                onPress={() => setGameType(gameType === '1v1' ? undefined : '1v1')}
                style={styles.chip}
                compact
              >
                1v1
              </Chip>
              <Chip
                selected={gameType === '2v2'}
                onPress={() => setGameType(gameType === '2v2' ? undefined : '2v2')}
                style={styles.chip}
                compact
              >
                2v2
              </Chip>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Cup Count
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={cupCount === 6}
                onPress={() => setCupCount(cupCount === 6 ? undefined : 6)}
                style={styles.chip}
                compact
              >
                6 Cups
              </Chip>
              <Chip
                selected={cupCount === 10}
                onPress={() => setCupCount(cupCount === 10 ? undefined : 10)}
                style={styles.chip}
                compact
              >
                10 Cups
              </Chip>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Partner
            </Text>
            <View style={styles.chipContainer}>
              <Chip
                selected={partnerUserId === null}
                onPress={() => handlePartnerSelect(null)}
                style={styles.chip}
                compact
              >
                Solo
              </Chip>
              <Chip
                selected={selectedPartner !== null}
                onPress={handleOpenPartnerDialog}
                style={styles.chip}
                compact
              >
                {selectedPartner ? selectedPartner.handle : 'Select Partner'}
              </Chip>
              {selectedPartner && (
                <Chip
                  icon="close"
                  onPress={() => handlePartnerSelect(null)}
                  style={styles.chip}
                  compact
                >
                  Clear
                </Chip>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderUserStats = () => {
    if (!userStats) {
      return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No data available. Start tracking matches to build your record.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const avgDurationMinutes = Math.floor(userStats.averageMatchDurationSeconds / 60);
    const avgDurationSeconds = Math.floor(userStats.averageMatchDurationSeconds % 60);
    const avgDurationDisplay = userStats.averageMatchDurationSeconds > 0
      ? `${avgDurationMinutes}:${avgDurationSeconds.toString().padStart(2, '0')}`
      : 'N/A';

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {renderStatCard('Games Played', userStats.gamesPlayed)}
          {renderStatCard('Win Rate', `${userStats.winPercentage.toFixed(1)}%`, `${userStats.wins}W - ${userStats.losses}L`)}
          {renderStatCard('Avg Cups/Game', userStats.averageCupsSunkPerGame.toFixed(2))}
          {renderStatCard('Cup Sink %', `${userStats.averageCupsSunkPercentage.toFixed(1)}%`)}
          {renderStatCard('Bounce Shots', userStats.bounceShots, `${userStats.bounceShotsPercentage.toFixed(1)}% of total`)}
          {renderStatCard('Grenades', userStats.grenadesSunk)}
          {renderStatCard('Avg Match Duration', avgDurationDisplay)}
        </View>
      </ScrollView>
    );
  };

  const renderLeaderboard = () => {
    if (leaderboard.length === 0) {
      return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No leaderboard data. Establish your position.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.leaderboardContainer}>
          {leaderboard.map((stats, index) => (
            <Card
              key={stats.userId}
              style={[
                styles.leaderboardCard,
                {
                  backgroundColor:
                    stats.userId === user?.uid
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                },
              ]}
            >
              <Card.Content>
                <View style={styles.leaderboardRow}>
                  <View style={styles.leaderboardRank}>
                    <Text 
                      variant="titleLarge" 
                      style={{ 
                        color: stats.userId === user?.uid 
                          ? theme.colors.onPrimaryContainer 
                          : theme.colors.onSurface 
                      }}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text 
                      variant="titleMedium" 
                      style={{ 
                        color: stats.userId === user?.uid 
                          ? theme.colors.onPrimaryContainer 
                          : theme.colors.onSurface 
                      }}
                    >
                      {stats.handle}
                      {stats.userId === user?.uid && ' (You)'}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={{ 
                        color: stats.userId === user?.uid 
                          ? theme.colors.onPrimaryContainer 
                          : theme.colors.onSurfaceVariant 
                      }}
                    >
                      {stats.wins}W - {stats.losses}L • {stats.winPercentage.toFixed(1)}% Win Rate
                    </Text>
                  </View>
                  <View style={styles.leaderboardStats}>
                    <Text 
                      variant="bodyMedium" 
                      style={{ 
                        color: stats.userId === user?.uid 
                          ? theme.colors.onPrimaryContainer 
                          : theme.colors.onSurface 
                      }}
                    >
                      {(() => {
                        switch (sortBy) {
                          case 'wins':
                            return `${stats.wins} wins`;
                          case 'winPercentage':
                            return `${stats.winPercentage.toFixed(1)}%`;
                          case 'totalCupsSunk':
                            return `${stats.totalCupsSunk} cups`;
                          case 'cupsPerGame':
                            return `${stats.averageCupsSunkPerGame.toFixed(1)}/game`;
                          case 'totalBounceShots':
                            return `${stats.bounceShots} bounces`;
                          case 'bounceShotPercentage':
                            return `${stats.bounceShotsPercentage.toFixed(1)}%`;
                          default:
                            return `${stats.gamesPlayed} games`;
                        }
                      })()}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
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
          Statistics
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.viewModeContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            { value: 'user', label: 'My Stats' },
            { value: 'leaderboard', label: 'Leaderboard' },
          ]}
        />
      </View>

      {renderFilters()}

      {viewMode === 'leaderboard' && renderSortOptions()}

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
            Loading stats...
          </Text>
        </View>
      ) : viewMode === 'user' ? (
        renderUserStats()
      ) : (
        renderLeaderboard()
      )}

      <Portal>
        <Dialog
          visible={partnerDialogVisible}
          onDismiss={() => setPartnerDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Select Partner</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Search by handle"
              value={partnerSearchTerm}
              onChangeText={setPartnerSearchTerm}
              mode="outlined"
              style={styles.partnerSearchInput}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 300, marginTop: DesignSystem.spacing.md }}>
              {partnerSearchResults.length > 0 ? (
                partnerSearchResults.map((partner) => (
                  <List.Item
                    key={partner.userId}
                    title={partner.handle}
                    onPress={() => handlePartnerSelect(partner)}
                    left={(props) => <List.Icon {...props} icon="account" />}
                  />
                ))
              ) : partnerSearchTerm.trim().length >= 2 ? (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: DesignSystem.spacing.md }}>
                  No results found
                </Text>
              ) : (
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: DesignSystem.spacing.md }}>
                  Enter at least 2 characters to search
                </Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPartnerDialogVisible(false)}>
              Cancel
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
  },
  viewModeContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
  },
  filtersCard: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.sm,
  },
  filtersCardContent: {
    paddingVertical: DesignSystem.spacing.sm,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xs,
  },
  filterRow: {
    marginBottom: DesignSystem.spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.xs,
  },
  chip: {
    marginRight: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.xs,
    height: 32,
  },
  partnerSearchContainer: {
    padding: DesignSystem.spacing.sm,
  },
  partnerSearchInput: {
    marginBottom: DesignSystem.spacing.xs,
  },
  card: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
    gap: DesignSystem.spacing.md,
  },
  statCard: {
    width: '47%',
    marginBottom: DesignSystem.spacing.md,
  },
  leaderboardContainer: {
    paddingHorizontal: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  leaderboardCard: {
    marginBottom: DesignSystem.spacing.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardRank: {
    width: 50,
    alignItems: 'center',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: DesignSystem.spacing.md,
  },
  leaderboardStats: {
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xxl,
  },
  errorCard: {
    marginHorizontal: DesignSystem.spacing.md,
    marginBottom: DesignSystem.spacing.md,
  },
});

export default StatsScreen;

