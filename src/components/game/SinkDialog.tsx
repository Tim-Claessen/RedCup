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
      <Dialog.Title>Record Cup Sink</Dialog.Title>
      <Dialog.Content>
        {/* Player selection - only for 2v2 games */}
        {gameType === '2v2' && (
          <>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}>
              Who sunk the cup?
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
          onValueChange={(value) => onShotTypeChange(value as ShotType)}
          buttons={[
            { value: 'regular', label: 'Regular' },
            { value: 'bounce', label: 'Bounce' },
            { value: 'grenade', label: 'Grenade (Coming Soon)', disabled: true },
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

        {shotType === 'grenade' && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.error, marginTop: DesignSystem.spacing.sm }}
          >
            ⚠️ Grenade feature is not available yet
          </Text>
        )}

        {shotType === 'bounce' && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: DesignSystem.spacing.sm }}
          >
            Bounce: Select a second cup on opponent's side after recording
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
          {shotType === 'bounce' ? 'Continue' : 'Record'}
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
