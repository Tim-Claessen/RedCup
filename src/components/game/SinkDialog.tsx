/**
 * SinkDialog Component
 * 
 * Dialog for recording cup sinks with player selection and shot type
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Dialog, SegmentedButtons, useTheme } from 'react-native-paper';
import { GameType, ShotType } from '../../types/game';
import { DesignSystem } from '../../theme';

interface SinkDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  gameType: GameType;
  availablePlayers: string[];
  selectedPlayer: string;
  onPlayerSelect: (player: string) => void;
  shotType: ShotType;
  onShotTypeChange: (shotType: ShotType) => void;
}

export const SinkDialog: React.FC<SinkDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  gameType,
  availablePlayers,
  selectedPlayer,
  onPlayerSelect,
  shotType,
  onShotTypeChange,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title>Record Shot</Dialog.Title>
      <Dialog.Content>
        {/* Player selection - only for 2v2 games */}
        {gameType === '2v2' && (
          <>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
              Player:
            </Text>
            
            <View style={styles.playerSelection}>
              {availablePlayers.map((handle) => (
                <Button
                  key={handle}
                  mode={selectedPlayer === handle ? 'contained' : 'outlined'}
                  onPress={() => onPlayerSelect(handle)}
                  style={styles.playerButton}
                  buttonColor={selectedPlayer === handle ? theme.colors.primary : undefined}
                  textColor={
                    selectedPlayer === handle
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface
                  }
                >
                  {handle}
                </Button>
              ))}
            </View>
          </>
        )}

        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurface, marginTop: DesignSystem.spacing.lg, marginBottom: DesignSystem.spacing.sm }}
        >
          Shot Type:
        </Text>

        <SegmentedButtons
          value={shotType}
          onValueChange={(value) => {
            if (value === 'regular' || value === 'bounce' || value === 'grenade') {
              onShotTypeChange(value);
            }
          }}
          buttons={[
            { value: 'regular', label: 'Regular' },
            { value: 'bounce', label: 'Bounce' },
            ...(gameType === '2v2' ? [{ value: 'grenade', label: 'Grenade' }] : []),
          ]}
          style={styles.shotTypeButtons}
          theme={{
            colors: {
              secondaryContainer: theme.colors.primary,
              onSecondaryContainer: theme.colors.onPrimary,
              disabled: theme.colors.surfaceDisabled,
            },
          }}
        />

        {shotType === 'bounce' && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.sm }}
          >
            Bounce: Select second cup after recording
          </Text>
        )}

        {shotType === 'grenade' && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.sm }}
          >
            Grenade: Both players hit same cup. All adjacent cups sunk.
          </Text>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurface}>
          Cancel
        </Button>
        <Button
          onPress={onConfirm}
          disabled={!selectedPlayer && gameType === '2v2'}
          mode="contained"
          buttonColor={theme.colors.primary}
        >
          Record
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  playerSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.md,
  },
  playerButton: {
    minWidth: 100,
  },
  shotTypeButtons: {
    marginTop: DesignSystem.spacing.sm,
  },
});
