import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DesignSystem } from '../theme';
import { HomeScreenNavigationProp } from '../types/navigation';

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const theme = useTheme();

  const handleQuickGame = () => {
    navigation.navigate('QuickGameSetup');
  };

  const handleTournament = () => {
    // TODO: Navigate to Tournament screen
  };

  const handleStats = () => {
    // TODO: Navigate to Stats screen
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        {/* Logo - Prominent and always visible */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/RedCup_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons - Minimal, sophisticated design */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleQuickGame}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            Quick Game
          </Button>

          <Button
            mode="contained"
            onPress={handleTournament}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.surfaceVariant}
            textColor={theme.colors.onSurface}
          >
            Tournament
          </Button>

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
    paddingTop: DesignSystem.spacing.xxxl,
    paddingBottom: DesignSystem.spacing.xxl,
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
    minHeight: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
});

export default HomeScreen;
