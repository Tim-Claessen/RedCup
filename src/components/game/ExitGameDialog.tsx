/**
 * ExitGameDialog Component
 *
 * Confirms that the user wants to exit the game, warning that it will
 * be marked as DNF (Did Not Finish).
 */

import React from "react";
import { Dialog, Button, Text, useTheme } from "react-native-paper";
import { DesignSystem } from "../../theme";

interface ExitGameDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export const ExitGameDialog: React.FC<ExitGameDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title>Exit Game?</Dialog.Title>
      <Dialog.Content>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurface,
            marginBottom: DesignSystem.spacing.md,
          }}
        >
          Are you sure you want to abandon the game?
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurface}>
          Continue
        </Button>
        <Button onPress={onConfirm} textColor={theme.colors.error}>
          Exit
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};
