/**
 * VictoryDialog Component
 * 
 * Dialog shown when a game is won
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Dialog, useTheme } from 'react-native-paper';
import { DesignSystem } from '../../theme';

interface VictoryDialogProps {
  visible: boolean;
  victoriousPlayer: string;
  onHome: () => void;
}

export const VictoryDialog: React.FC<VictoryDialogProps> = ({
  visible,
  victoriousPlayer,
  onHome,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={() => {}} // Prevent dismissing
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title style={{ textAlign: 'center', fontSize: 28, fontWeight: 'bold' }}>
        Victory: {victoriousPlayer}
      </Dialog.Title>
      <Dialog.Content>
        <View style={styles.victoryContent}>
          <Button
            mode="contained"
            onPress={onHome}
            style={styles.victoryButton}
            buttonColor={theme.colors.primary}
            contentStyle={styles.victoryButtonContent}
            labelStyle={styles.victoryButtonLabel}
          >
            Home
          </Button>
        </View>
      </Dialog.Content>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  victoryContent: {
    alignItems: 'stretch',
    paddingVertical: DesignSystem.spacing.md,
  },
  victoryButton: {
    marginVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  victoryButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
  },
  victoryButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
});
