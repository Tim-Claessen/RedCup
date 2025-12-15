/**
 * RerackDialog Component
 *
 * Lets players choose which side wants to re-rack, and which slots in the
 * formation their remaining cups should occupy.
 */

import React from 'react';
import { Dialog, Button, Text, useTheme } from 'react-native-paper';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DesignSystem } from '../../theme';
import { TeamId } from '../../types/game';
import { getCupPositions } from '../../utils/cupPositions';
import { MINI_CUP_SIZE } from '../../constants/gameConstants';
import { CupCount } from '../../types/game';

interface RerackDialogProps {
  visible: boolean;
  team1Label: string;
  team2Label: string;
  team1Remaining: number;
  team2Remaining: number;
  cupCount: CupCount;
  onDismiss: () => void;
  onRerack: (team: TeamId, slotIndexes: number[]) => void;
}

export const RerackDialog: React.FC<RerackDialogProps> = ({
  visible,
  team1Label,
  team2Label,
  team1Remaining,
  team2Remaining,
  cupCount,
  onDismiss,
  onRerack,
}) => {
  const theme = useTheme();

  const [selectedSide, setSelectedSide] = React.useState<TeamId | null>(null);
  const [selectedSlots, setSelectedSlots] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!visible) {
      setSelectedSide(null);
      setSelectedSlots([]);
    }
  }, [visible]);

  const positions = getCupPositions(cupCount);
  const maxRow = Math.max(...positions.map(p => p.row));
  const rowOrder = Array.from({ length: maxRow + 1 }, (_, i) => i);

  const remainingForSelected =
    selectedSide === 'team1' ? team1Remaining : selectedSide === 'team2' ? team2Remaining : 0;

  const toggleSlot = (index: number) => {
    setSelectedSlots((prev) => {
      const isSelected = prev.includes(index);
      if (isSelected) {
        return prev.filter(i => i !== index);
      }
      // Only allow up to remaining cups to be selected
      if (prev.length >= remainingForSelected) {
        return prev;
      }
      return [...prev, index];
    });
  };

  const canConfirm =
    selectedSide !== null &&
    remainingForSelected > 0 &&
    selectedSlots.length === remainingForSelected;

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title>Re-rack Cups</Dialog.Title>
      <Dialog.Content>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}
        >
          Choose which side is re-racking and where their remaining cups should go.
          This changes cup IDs for the remaining cups but does not affect any
          shots already recorded.
        </Text>

        {/* Step 1: choose side */}
        <View style={styles.sideButtons}>
          <Button
            mode={selectedSide === 'team1' ? 'contained' : 'outlined'}
            onPress={() => {
              setSelectedSide('team1');
              setSelectedSlots([]);
            }}
            style={styles.sideButton}
            buttonColor={selectedSide === 'team1' ? theme.colors.primary : undefined}
            textColor={
              selectedSide === 'team1'
                ? theme.colors.onPrimary
                : theme.colors.onSurface
            }
          >
            {team1Label}
          </Button>
          <Button
            mode={selectedSide === 'team2' ? 'contained' : 'outlined'}
            onPress={() => {
              setSelectedSide('team2');
              setSelectedSlots([]);
            }}
            style={styles.sideButton}
            buttonColor={selectedSide === 'team2' ? theme.colors.primary : undefined}
            textColor={
              selectedSide === 'team2'
                ? theme.colors.onPrimary
                : theme.colors.onSurface
            }
          >
            {team2Label}
          </Button>
        </View>

        {/* Step 2: choose slots for remaining cups */}
        {selectedSide && remainingForSelected > 0 && (
          <>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: DesignSystem.spacing.sm }}
            >
              Select {remainingForSelected} slot
              {remainingForSelected > 1 ? 's' : ''} for the remaining cups on{' '}
              {selectedSide === 'team1' ? team1Label : team2Label}.
            </Text>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              <View style={styles.miniCupFormation}>
                {rowOrder.map((row) => {
                  const rowPositions = positions
                    .map((pos, index) => ({ ...pos, index }))
                    .filter(p => p.row === row);
                  if (rowPositions.length === 0) return null;

                  return (
                    <View key={row} style={styles.miniCupRow}>
                      {rowPositions.map((pos) => {
                        const isSelected = selectedSlots.includes(pos.index);
                        return (
                          <TouchableOpacity
                            key={pos.index}
                            style={[
                              styles.miniCup,
                              {
                                width: MINI_CUP_SIZE,
                                height: MINI_CUP_SIZE,
                                borderRadius: MINI_CUP_SIZE / 2,
                                backgroundColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.primaryContainer,
                                borderWidth: 2,
                                borderColor: isSelected
                                  ? theme.colors.primary
                                  : theme.colors.primary,
                              },
                            ]}
                            onPress={() => toggleSlot(pos.index)}
                          />
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurface}>
          Cancel
        </Button>
        <Button
          onPress={() => {
            if (selectedSide && canConfirm) {
              onRerack(selectedSide, selectedSlots);
            }
          }}
          disabled={!canConfirm}
          mode="contained"
          buttonColor={theme.colors.primary}
        >
          Apply Re-rack
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  sideButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  sideButton: {
    flex: 1,
  },
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



