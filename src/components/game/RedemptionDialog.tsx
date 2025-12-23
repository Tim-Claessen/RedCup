/**
 * RedemptionDialog Component
 * 
 * Dialog shown when a team clears all opponent cups
 * Allows the losing team to attempt redemption or concede
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Dialog, useTheme } from 'react-native-paper';
import { TeamId, Player } from '../../types/game';
import { DesignSystem } from '../../theme';

interface RedemptionDialogProps {
  visible: boolean;
  winningTeam: TeamId | null;
  team1Players: Player[];
  team2Players: Player[];
  onPlayOn: () => void;
  onWin: () => void;
}

export const RedemptionDialog: React.FC<RedemptionDialogProps> = ({
  visible,
  winningTeam,
  team1Players,
  team2Players,
  onPlayOn,
  onWin,
}) => {
  const theme = useTheme();

  if (!winningTeam) return null;

  const winningPlayers = winningTeam === 'team1' 
    ? team1Players.map(p => p.handle).join(' & ')
    : team2Players.map(p => p.handle).join(' & ');
  const losingPlayers = winningTeam === 'team1'
    ? team2Players.map(p => p.handle).join(' & ')
    : team1Players.map(p => p.handle).join(' & ');

  return (
    <Dialog
      visible={visible}
      onDismiss={() => {}} // Prevent dismissing - must choose an option
      style={{ backgroundColor: theme.colors.surface }}
    >
      <Dialog.Title style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold' }}>
        Redemption
      </Dialog.Title>
      <Dialog.Content>
        <View style={styles.redemptionContent}>
          <Button
            mode="contained"
            onPress={onPlayOn}
            style={styles.redemptionButton}
            buttonColor={theme.colors.primary}
            contentStyle={styles.redemptionButtonContent}
            labelStyle={styles.redemptionButtonLabel}
          >
            {losingPlayers} - Play On
          </Button>
          <Button
            mode="contained"
            onPress={onWin}
            style={styles.redemptionButton}
            buttonColor={theme.colors.error} // Crimson for destructive/win action
            contentStyle={styles.redemptionButtonContent}
            labelStyle={styles.redemptionButtonLabel}
          >
            {winningPlayers} wins!
          </Button>
        </View>
      </Dialog.Content>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  redemptionContent: {
    alignItems: 'stretch',
    gap: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
  },
  redemptionButton: {
    marginVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.lg,
  },
  redemptionButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
  },
  redemptionButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
