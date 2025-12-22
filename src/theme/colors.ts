/**
 * Red Cup Theme Color Palette
 * A modern dark theme following Material Design 3 principles
 * Deep Ink background with Electric Cyan primary and Arcade Purple secondary accents
 */

export const RedCupColors = {
  // BASE COLORS
  // Deep Ink background - modern and sophisticated
  background: '#0B0E14',
  onBackground: '#F8F9FA', // Cool White for primary text readability

  // SURFACES
  // Steel Grey-Dark for containers, cards, and inputs
  surface: '#1A1F26',
  onSurface: '#F8F9FA', // Cool White for primary text on surfaces
  surfaceVariant: '#232830', // Slightly lighter variant for elevated surfaces
  onSurfaceVariant: '#94A3B8', // Slate for muted text and secondary info

  // PRIMARY ROLE: ELECTRIC CYAN
  // Use for: Primary buttons, main actions, key UI elements
  primary: '#00D1FF',
  onPrimary: '#000000', // Black text on bright cyan for contrast
  primaryContainer: '#0099CC', // Darker cyan for containers
  onPrimaryContainer: '#FFFFFF', // White text on darker cyan container

  // SECONDARY ROLE: ARCADE PURPLE
  // Use for: Secondary actions, accents, highlights
  secondary: '#7000FF',
  onSecondary: '#FFFFFF', // White text on purple
  secondaryContainer: '#5A00CC', // Darker purple for containers
  onSecondaryContainer: '#E0B3FF', // Light purple text on darker container

  // ACCENT ROLE: ELECTRIC CYAN (same as primary)
  // Use for: Wins, celebrations, critical actions, highlights
  accent: '#00D1FF',
  onAccent: '#000000',
  accentContainer: '#0099CC',
  onAccentContainer: '#FFFFFF',

  // TERTIARY ROLE: ARCADE PURPLE (same as secondary)
  // Use for: Warnings, pending states, subtle highlights
  tertiary: '#7000FF',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#5A00CC',
  onTertiaryContainer: '#E0B3FF',

  // SUCCESS (for wins, achievements)
  success: '#4CAF50',
  onSuccess: '#FFFFFF',
  successContainer: '#1B5E20',
  onSuccessContainer: '#A5D6A7',

  // BORDERS & OUTLINES
  // Subtle but visible outlines for dark theme
  outline: '#2D3440',
  outlineVariant: '#1F252D',

  // ERROR
  error: '#CF6679',
  onError: '#FFFFFF',
  errorContainer: '#4A1F28',
  onErrorContainer: '#F8BBD0',

  // Additional M3 colors
  inverseSurface: '#F8F9FA',
  inverseOnSurface: '#0B0E14',
  inversePrimary: '#00D1FF',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#1F252D',
  onSurfaceDisabled: '#64748B',
  backdrop: 'rgba(11, 14, 20, 0.8)',
} as const;

export type RedCupColorsType = typeof RedCupColors;

// Legacy export for backwards compatibility (will be removed)
export const DuskColors = RedCupColors;
export type DuskColorsType = RedCupColorsType;
