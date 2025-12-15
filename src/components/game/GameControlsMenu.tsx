/**
 * GameControlsMenu Component
 *
 * Collapses the main in-game controls into a single menu button to reduce
 * visual clutter on the GameScreen.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Menu, useTheme } from 'react-native-paper';
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

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setVisible(true)}
            style={styles.menuButton}
            textColor={theme.colors.onSurface}
            icon="menu"
            disabled={isGameOver}
          >
            Controls
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver) {
              onTogglePause();
            }
          }}
          title={isPaused ? 'Resume' : 'Pause'}
          leadingIcon={isPaused ? 'play' : 'pause'}
          disabled={isGameOver}
        />
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver && !isPaused && hasUndo) {
              onUndo();
            }
          }}
          title="Undo"
          leadingIcon="undo"
          disabled={!hasUndo || isPaused || isGameOver}
        />
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver) {
              onShowRules();
            }
          }}
          title="Rules"
          leadingIcon="book-open-variant"
          disabled={isGameOver}
        />
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver) {
              onRotateTable();
            }
          }}
          title="Rotate Table"
          leadingIcon="rotate-3d-variant"
          disabled={isGameOver}
        />
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver) {
              onShowRerack();
            }
          }}
          title="Re-rack Cups"
          leadingIcon="shape"
          disabled={isGameOver}
        />
        <Menu.Item
          onPress={() => {
            closeMenu();
            if (!isGameOver) {
              onShowSurrender();
            }
          }}
          title="Surrender"
          leadingIcon="flag-outline"
          disabled={isGameOver}
        />
        {__DEV__ && onShowEvents && (
          <Menu.Item
            onPress={() => {
              closeMenu();
              onShowEvents();
            }}
            title="Events (Dev)"
            leadingIcon="database"
          />
        )}
      </Menu>
    </View>
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
});


