/**
 * GameControlsMenu Component
 *
 * Modern Material Design 3 controls menu using a bottom sheet dialog.
 * Provides reliable access to game controls with a clean, modern interface.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme, Icon, MD3Theme } from 'react-native-paper';
import { DesignSystem } from '../../theme';

interface GameControlsMenuProps {
  isPaused: boolean;
  isGameOver: boolean;
  hasUndo: boolean;
  onTogglePause: () => void;
  onUndo: () => void;
  onShowRules: () => void;
  onRotateTable: () => void;
  onShowSurrender: () => void;
  onShowRerack: () => void;
  onShowEvents?: () => void; // Dev-only
}

interface MenuItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  disabled?: boolean;
  theme: MD3Theme;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, onPress, disabled, theme }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.menuItem,
      {
        backgroundColor: theme.colors.surface,
        opacity: disabled ? 0.5 : 1,
      },
    ]}
    activeOpacity={0.7}
  >
    <Icon source={icon} size={24} color={theme.colors.onSurface} />
    <Text
      variant="bodyLarge"
      style={[
        styles.menuItemText,
        {
          color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface,
        },
      ]}
    >
      {title}
    </Text>
    <View style={styles.menuItemSpacer} />
  </TouchableOpacity>
);

export const GameControlsMenu: React.FC<GameControlsMenuProps> = ({
  isPaused,
  isGameOver,
  hasUndo,
  onTogglePause,
  onUndo,
  onShowRules,
  onRotateTable,
  onShowSurrender,
  onShowRerack,
  onShowEvents,
}) => {
  const theme = useTheme();
  const [visible, setVisible] = React.useState(false);

  const closeMenu = () => setVisible(false);
  const openMenu = () => {
    if (!isGameOver) {
      setVisible(true);
    }
  };

  const handleAction = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <>
      <View style={styles.container}>
        <Button
          mode="outlined"
          onPress={openMenu}
          style={styles.menuButton}
          textColor={theme.colors.onSurface}
          icon="menu"
          disabled={isGameOver}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          accessibilityLabel="Game Controls Menu"
          accessibilityHint="Opens the game controls menu"
        >
          Controls
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={visible}
          onDismiss={closeMenu}
          style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Controls
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
              <View style={styles.menuContent}>
                <MenuItem
                  icon={isPaused ? 'play' : 'pause'}
                  title={isPaused ? 'Resume' : 'Pause'}
                  onPress={() => handleAction(onTogglePause)}
                  disabled={isGameOver}
                  theme={theme}
                />
                <MenuItem
                  icon="undo"
                  title="Undo"
                  onPress={() => handleAction(onUndo)}
                  disabled={!hasUndo || isPaused || isGameOver}
                  theme={theme}
                />
                <MenuItem
                  icon="book-open-variant"
                  title="Rules"
                  onPress={() => handleAction(onShowRules)}
                  disabled={isGameOver}
                  theme={theme}
                />
                <MenuItem
                  icon="rotate-3d-variant"
                  title="Rotate Table"
                  onPress={() => handleAction(onRotateTable)}
                  disabled={isGameOver}
                  theme={theme}
                />
                <MenuItem
                  icon="shape"
                  title="Re-rack"
                  onPress={() => handleAction(onShowRerack)}
                  disabled={isGameOver}
                  theme={theme}
                />
                <MenuItem
                  icon="flag-outline"
                  title="Surrender"
                  onPress={() => handleAction(onShowSurrender)}
                  disabled={isGameOver}
                  theme={theme}
                />
                {__DEV__ && onShowEvents && (
                  <MenuItem
                    icon="database"
                    title="Events (Dev)"
                    onPress={() => handleAction(onShowEvents)}
                    theme={theme}
                  />
                )}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeMenu} textColor={theme.colors.onSurface}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
  },
  menuButton: {
    minWidth: 140,
  },
  buttonContent: {
    minHeight: 48,
    paddingVertical: DesignSystem.spacing.sm,
  },
  buttonLabel: {
    fontSize: 14,
  },
  dialog: {
    borderRadius: DesignSystem.borderRadius.xl,
    maxHeight: '80%',
  },
  scrollArea: {
    maxHeight: 400,
    paddingHorizontal: 0,
  },
  menuContent: {
    paddingVertical: DesignSystem.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.md,
    minHeight: 56,
    gap: DesignSystem.spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontWeight: '500',
  },
  menuItemSpacer: {
    width: 24,
  },
});
