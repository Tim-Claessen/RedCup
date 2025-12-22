/**
 * BounceSelectionDialog Component
 * 
 * Dialog for selecting the second cup in a bounce shot
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Dialog, useTheme } from 'react-native-paper';
import { Cup, TeamSide, TeamId } from '../../types/game';
import { MINI_CUP_SIZE } from '../../constants/gameConstants';
import { DesignSystem } from '../../theme';

interface BounceSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onBack: () => void;
  onConfirm: (cupId: number) => void;
  selectedCup: { side: TeamId; cupId: number } | null;
  opponentCups: Cup[];
  opponentSide: TeamId;
  team1Side: TeamSide;
  selectedBounceCup: number | null;
  onBounceCupSelect: (cupId: number) => void;
}

export const BounceSelectionDialog: React.FC<BounceSelectionDialogProps> = ({
  visible,
  onDismiss,
  onBack,
  onConfirm,
  selectedCup,
  opponentCups,
  opponentSide,
  team1Side,
  selectedBounceCup,
  onBounceCupSelect,
}) => {
  const theme = useTheme();

  if (!selectedCup) return null;

  // Determine if opponent is on bottom using same logic as main table
  const opponentIsOnBottom = (opponentSide === 'team1' && team1Side === 'bottom') ||
                             (opponentSide === 'team2' && team1Side === 'top');
  
  const cupsWithFirstSunk = opponentCups.map(cup => 
    cup.id === selectedCup.cupId 
      ? { ...cup, sunk: true, sunkAt: Date.now() }
      : cup
  );
  
  // Render cups with the same logic as main table
  const maxRow = Math.max(...cupsWithFirstSunk.map(c => c.position.row));
  const rowOrder = opponentIsOnBottom
    ? Array.from({ length: maxRow + 1 }, (_, i) => maxRow - i) // Reverse for bottom
    : Array.from({ length: maxRow + 1 }, (_, i) => i); // Normal for top

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface, maxHeight: '80%' }}
    >
      <Dialog.Title>Select Second Cup (Bounce)</Dialog.Title>
      <Dialog.Content style={{ maxHeight: 400 }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
          Select the second cup on opponent's side:
        </Text>
        
        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
          <View style={styles.miniCupFormation}>
            {rowOrder.map((row) => {
              let rowCups = cupsWithFirstSunk.filter(c => c.position.row === row);
              if (rowCups.length === 0) return null;
              
              // Top side: ascending (0, 1, 2...) to show [0] [1] [2] / [3] [4] / [5]
              // Bottom side: descending (5, 4, 3...) to show [5] / [4] [3] / [2] [1] [0]
              rowCups = [...rowCups].sort((a, b) => {
                if (opponentIsOnBottom) {
                  return b.id - a.id; // Descending for bottom (5, 4, 3, 2, 1, 0)
                } else {
                  return a.id - b.id; // Ascending for top (0, 1, 2, 3, 4, 5)
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
                        onPress={() => !isSunk && onBounceCupSelect(cup.id)}
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
            })}
          </View>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button 
          onPress={onBack}
          textColor={theme.colors.onSurface}
        >
          Back
        </Button>
        <Button
          onPress={() => {
            if (selectedBounceCup !== null) {
              onConfirm(selectedBounceCup);
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
  );
};

const styles = StyleSheet.create({
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
});
