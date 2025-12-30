import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, useTheme, Text, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { DesignSystem } from '../theme';

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const { user, signOut } = useAuth();

  const handleQuickGame = () => {
    navigation.navigate('QuickGameSetup');
  };

  const handleTournament = () => {
    // Tournament feature not yet implemented
  };

  const handleStats = () => {
    navigation.navigate('Stats');
  };

  const handleMatchHistory = () => {
    navigation.navigate('MatchHistory');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {user && (
            <View style={styles.userInfo}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {user.isGuest ? 'Guest' : 'Logged in'} {user.handle && `as ${user.handle}`}
              </Text>
            </View>
          )}
          <IconButton
            icon="logout"
            size={24}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>

        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/RedCup_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text 
            variant="headlineLarge" 
            style={[
              styles.brandText,
              { color: theme.colors.onBackground }
            ]}
          >
            SINK
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleQuickGame}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            New Game
          </Button>

          {/* Tournament button hidden - coming later */}
          {/* <Button
            mode="contained"
            onPress={handleTournament}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.surfaceVariant}
            textColor={theme.colors.onSurface}
          >
            Tournament
          </Button> */}

          <Button
            mode="contained"
            onPress={handleStats}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.surfaceVariant}
            textColor={theme.colors.onSurface}
          >
            Stats
          </Button>

          <Button
            mode="contained"
            onPress={handleMatchHistory}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.surfaceVariant}
            textColor={theme.colors.onSurface}
          >
            Match History
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.spacing.lg,
    paddingTop: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  logoutButton: {
    margin: 0,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.xl,
  },
  logo: {
    width: 200,
    height: 200,
    maxWidth: '100%',
    marginBottom: DesignSystem.spacing.md, // Spacing: 1C between logo and text
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    // Logo & Brand Headers use Black (900) or Extra Bold (800), All Caps, +0.1em tracking
  },
  actionsContainer: {
    gap: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.md,
  },
  actionButton: {
    borderRadius: DesignSystem.borderRadius.xl,
    elevation: 0,
  },
  buttonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: DesignSystem.dimensions.buttonHeightLarge,
  },
  buttonLabel: {
    fontSize: DesignSystem.typography.labelLarge.fontSize,
    fontWeight: DesignSystem.typography.labelLarge.fontWeight,
    letterSpacing: 0.1,
    textTransform: 'none',
  },
});

export default HomeScreen;
