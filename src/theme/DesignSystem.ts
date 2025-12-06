import { RedCupColors } from './colors';

/**
 * Design System Tokens
 * Following Material Design 3 principles for spacing, elevation, and dimensions
 */

export const DesignSystem = {
  // Spacing scale (4dp base unit following M3)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },

  // Elevation (shadow levels)
  elevation: {
    level0: 0,
    level1: 1,
    level2: 2,
    level3: 3,
    level4: 4,
    level5: 5,
  },

  // Component dimensions
  dimensions: {
    buttonHeight: 40,
    buttonHeightLarge: 56,
    inputHeight: 56,
    iconSize: 24,
    iconSizeSmall: 20,
    iconSizeLarge: 32,
    avatarSize: 40,
    avatarSizeLarge: 56,
  },

  // Typography scale (already defined in theme, but useful for reference)
  typography: {
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400' as const,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400' as const,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400' as const,
    },
    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400' as const,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400' as const,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400' as const,
    },
    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500' as const,
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
  },

  // Colors (re-exported for convenience)
  colors: RedCupColors,

  // Animation durations (following M3 motion principles)
  animation: {
    short: 150,
    medium: 250,
    long: 350,
    extraLong: 500,
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type DesignSystemType = typeof DesignSystem;

