/**
 * GameTable Component
 * 
 * Renders the beer pong table with team labels and cup formations
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Cup, TeamSide, TeamId, Player } from '../../types/game';
import { CupFormation } from './CupFormation';
import { TABLE_HEIGHT, TABLE_WIDTH } from '../../constants/gameConstants';
import { DesignSystem } from '../../theme';

interface GameTableProps {
  team1Cups: Cup[];
  team2Cups: Cup[];
  team1Side: TeamSide;
  team1Players: Player[];
  team2Players: Player[];
  onCupPress: (side: TeamId, cupId: number) => void;
  disabled?: boolean;
}

export const GameTable: React.FC<GameTableProps> = ({
  team1Cups,
  team2Cups,
  team1Side,
  team1Players,
  team2Players,
  onCupPress,
  disabled = false,
}) => {
  const theme = useTheme();

  return (
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
            <CupFormation
              cups={team1Cups}
              side="team1"
              isBottomSide={false}
              onCupPress={onCupPress}
              disabled={disabled}
            />
          ) : (
            <CupFormation
              cups={team2Cups}
              side="team2"
              isBottomSide={false}
              onCupPress={onCupPress}
              disabled={disabled}
            />
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
            <CupFormation
              cups={team1Cups}
              side="team1"
              isBottomSide={true}
              onCupPress={onCupPress}
              disabled={disabled}
            />
          ) : (
            <CupFormation
              cups={team2Cups}
              side="team2"
              isBottomSide={true}
              onCupPress={onCupPress}
              disabled={disabled}
            />
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
  );
};

const styles = StyleSheet.create({
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
  teamLabelOutside: {
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
    width: TABLE_WIDTH,
  },
});
