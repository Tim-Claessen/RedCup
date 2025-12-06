import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { RedCupColors } from './colors';

/**
 * Red Cup Theme - Material Design 3 Dark Theme
 * A modern, sophisticated theme for beer pong analytics
 * Orange used sparingly as an accent color
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
 * Red Cup Theme - Material Design 3 Dark Theme
 * Modern, sophisticated palette with orange as strategic accent
 */
export const RedCupTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Base colors
    background: RedCupColors.background,
    onBackground: RedCupColors.onBackground,
    
    // Surface colors
    surface: RedCupColors.surface,
    onSurface: RedCupColors.onSurface,
    surfaceVariant: RedCupColors.surfaceVariant,
    onSurfaceVariant: RedCupColors.onSurfaceVariant,
    surfaceDisabled: RedCupColors.surfaceDisabled,
    onSurfaceDisabled: RedCupColors.onSurfaceDisabled,
    
    // Primary colors (Sophisticated Slate)
    primary: RedCupColors.primary,
    onPrimary: RedCupColors.onPrimary,
    primaryContainer: RedCupColors.primaryContainer,
    onPrimaryContainer: RedCupColors.onPrimaryContainer,
    
    // Secondary colors (Muted Violet)
    secondary: RedCupColors.secondary,
    onSecondary: RedCupColors.onSecondary,
    secondaryContainer: RedCupColors.secondaryContainer,
    onSecondaryContainer: RedCupColors.onSecondaryContainer,
    
    // Tertiary colors (Soft Amber)
    tertiary: RedCupColors.tertiary,
    onTertiary: RedCupColors.onTertiary,
    
    // Error colors
    error: RedCupColors.error,
    onError: RedCupColors.onError,
    errorContainer: RedCupColors.errorContainer,
    onErrorContainer: RedCupColors.onErrorContainer,
    
    // Outline colors
    outline: RedCupColors.outline,
    outlineVariant: RedCupColors.outlineVariant,
    
    // Inverse colors
    inverseSurface: RedCupColors.inverseSurface,
    inverseOnSurface: RedCupColors.inverseOnSurface,
    inversePrimary: RedCupColors.inversePrimary,
    
    // Other colors
    shadow: RedCupColors.shadow,
    scrim: RedCupColors.scrim,
    backdrop: RedCupColors.backdrop,
    elevation: {
      level0: RedCupColors.surface,
      level1: RedCupColors.surfaceVariant,
      level2: '#252535',
      level3: '#2A2A3A',
      level4: '#2F2F3F',
      level5: '#353545',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
};

export type RedCupThemeType = typeof RedCupTheme;

// Legacy export for backwards compatibility
export const DuskTheme = RedCupTheme;
export type DuskThemeType = RedCupThemeType;

