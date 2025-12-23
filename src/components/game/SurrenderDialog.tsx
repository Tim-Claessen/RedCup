/**
 * SurrenderDialog Component
 *
 * Confirms which side is surrendering and explains how the result
 * will be recorded.
 */

import React from 'react';
import { Dialog, Button, Text, useTheme } from 'react-native-paper';
import { DesignSystem } from '../../theme';
import { TeamId } from '../../types/game';

interface SurrenderDialogProps {
  visible: boolean;
  team1Label: string;
  team2Label: string;
  onDismiss: () => void;
  onSurrender: (team: TeamId) => void;
}

export const SurrenderDialog: React.FC<SurrenderDialogProps> = ({
  visible,
  team1Label,
  team2Label,
  onDismiss,
  onSurrender,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title>Surrender</Dialog.Title>
      <Dialog.Content>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurface, marginBottom: DesignSystem.spacing.md }}
        >
          Select surrendering team. Match recorded as loss. Remaining cups counted as sunk.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurface}>
          Cancel
        </Button>
        <Button
          onPress={() => onSurrender('team1')}
          textColor={theme.colors.onSurface}
        >
          {team1Label} Surrenders
        </Button>
        <Button
          onPress={() => onSurrender('team2')}
          textColor={theme.colors.onSurface}
        >
          {team2Label} Surrenders
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};


