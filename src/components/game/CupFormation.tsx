/**
 * CupFormation Component
 * 
 * Renders a pyramid formation of cups for a team
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Cup, TeamId } from '../../types/game';
import { CUP_SIZE } from '../../constants/gameConstants';
import { DesignSystem } from '../../theme';

interface CupFormationProps {
  cups: Cup[];
  side: TeamId;
  isBottomSide: boolean;
  onCupPress: (side: TeamId, cupId: number) => void;
  disabled?: boolean;
}

/**
 * Renders a single row of cups in the pyramid formation
 * Cups are clickable and show visual feedback when sunk
 * Sorts cups by ID to display in correct numerical order
 */
const renderCupRow = (
  cups: Cup[],
  row: number,
  side: TeamId,
  onCupPress: (side: TeamId, cupId: number) => void,
  theme: any,
  reverse: boolean = false,
  disabled: boolean = false
) => {
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
          onPress={() => onCupPress(side, cup.id)}
          disabled={cup.sunk || disabled}
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

export const CupFormation: React.FC<CupFormationProps> = ({
  cups,
  side,
  isBottomSide,
  onCupPress,
  disabled = false,
}) => {
  const theme = useTheme();
  const maxRow = Math.max(...cups.map(c => c.position.row));
  
  // Bottom side: reverse row order so base is at bottom, apex at top (pointing up)
  // Top side: normal order so base is at top, apex at bottom (pointing down)
  const rowOrder = isBottomSide
    ? Array.from({ length: maxRow + 1 }, (_, i) => maxRow - i) // Reverse for bottom
    : Array.from({ length: maxRow + 1 }, (_, i) => i); // Normal for top
    
  return (
    <View style={styles.cupFormation}>
      {rowOrder.map((row) => renderCupRow(cups, row, side, onCupPress, theme, isBottomSide, disabled))}
    </View>
  );
};

const styles = StyleSheet.create({
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
});
