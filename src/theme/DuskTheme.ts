import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { DuskColors } from './colors';

/**
 * Material Design 3 Dark Theme for Red Cup
 * Based on Dusk Theme color palette with warm, cozy aesthetic
 */

// Configure typography following M3 principles
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

/**
 * Dusk Theme - Material Design 3 Dark Theme
 * A warm, cozy dark theme with burnt orange primary, violet secondary, and amber tertiary
 */
export const DuskTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Base colors
    background: DuskColors.background,
    onBackground: DuskColors.onBackground,
    
    // Surface colors
    surface: DuskColors.surface,
    onSurface: DuskColors.onSurface,
    surfaceVariant: DuskColors.surfaceVariant,
    onSurfaceVariant: DuskColors.onSurfaceVariant,
    surfaceDisabled: DuskColors.surfaceDisabled,
    onSurfaceDisabled: DuskColors.onSurfaceDisabled,
    
    // Primary colors (Burnt Orange)
    primary: DuskColors.primary,
    onPrimary: DuskColors.onPrimary,
    primaryContainer: DuskColors.primaryContainer,
    onPrimaryContainer: DuskColors.onPrimaryContainer,
    
    // Secondary colors (Twilight Violet)
    secondary: DuskColors.secondary,
    onSecondary: DuskColors.onSecondary,
    secondaryContainer: DuskColors.secondaryContainer,
    onSecondaryContainer: DuskColors.onSecondaryContainer,
    
    // Tertiary colors (Golden Hour)
    tertiary: DuskColors.tertiary,
    onTertiary: DuskColors.onTertiary,
    
    // Error colors
    error: DuskColors.error,
    onError: DuskColors.onError,
    errorContainer: DuskColors.errorContainer,
    onErrorContainer: DuskColors.onErrorContainer,
    
    // Outline colors
    outline: DuskColors.outline,
    outlineVariant: DuskColors.outlineVariant,
    
    // Inverse colors
    inverseSurface: DuskColors.inverseSurface,
    inverseOnSurface: DuskColors.inverseOnSurface,
    inversePrimary: DuskColors.inversePrimary,
    
    // Other colors
    shadow: DuskColors.shadow,
    scrim: DuskColors.scrim,
    backdrop: DuskColors.backdrop,
    elevation: {
      level0: DuskColors.surface,
      level1: DuskColors.surfaceVariant,
      level2: '#2A2F38',
      level3: '#323740',
      level4: '#3A3F48',
      level5: '#424750',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

export type DuskThemeType = typeof DuskTheme;

