/**
 * Red Cup Theme Color Palette
 * A modern, sophisticated dark theme for beer pong analytics
 * Orange used sparingly as an accent for highlights and important moments
 * Following Material Design 3 color system principles
 */

export const RedCupColors = {
  // BASE COLORS
  // Deep, rich dark background - sophisticated and modern
  background: '#0A0A0F',
  onBackground: '#F5F7FA', // Soft off-white for better readability

  // SURFACES
  // Elevated surfaces with subtle contrast
  surface: '#151520',
  onSurface: '#E8EAED',
  surfaceVariant: '#1F1F2E',
  onSurfaceVariant: '#9AA0A6',

  // PRIMARY ROLE: SOPHISTICATED SLATE
  // Use for: Primary actions, navigation, main UI elements
  primary: '#6B5B95',
  onPrimary: '#FFFFFF',
  primaryContainer: '#3D2F4F',
  onPrimaryContainer: '#D4C5E8',

  // SECONDARY ROLE: MUTED VIOLET
  // Use for: Secondary actions, team colors, alternate states
  secondary: '#5B7FA6',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#2A3D52',
  onSecondaryContainer: '#B8D4F0',

  // ACCENT ROLE: BURNT ORANGE (Used Sparingly)
  // Use for: Wins, celebrations, critical actions, highlights
  // This is the "pop" color - use it intentionally and minimally
  accent: '#D65A31',
  onAccent: '#FFFFFF',
  accentContainer: '#431407',
  onAccentContainer: '#fdba74',

  // TERTIARY ROLE: SOFT AMBER
  // Use for: Warnings, pending states, subtle highlights
  tertiary: '#C9A961',
  onTertiary: '#000000',
  tertiaryContainer: '#4A3D1F',
  onTertiaryContainer: '#E8D4A3',

  // SUCCESS (for wins, achievements)
  success: '#4CAF50',
  onSuccess: '#FFFFFF',
  successContainer: '#1B5E20',
  onSuccessContainer: '#A5D6A7',

  // BORDERS & OUTLINES
  // Subtle but visible outlines for dark theme
  outline: '#3D3D4A',
  outlineVariant: '#2A2A35',

  // ERROR
  error: '#CF6679',
  onError: '#FFFFFF',
  errorContainer: '#4A1F28',
  onErrorContainer: '#F8BBD0',

  // Additional M3 colors
  inverseSurface: '#F5F7FA',
  inverseOnSurface: '#151520',
  inversePrimary: '#5B7FA6',
  shadow: '#000000',
  scrim: '#000000',
  surfaceDisabled: '#2A2A35',
  onSurfaceDisabled: '#5B5B6B',
  backdrop: 'rgba(10, 10, 15, 0.8)',
} as const;

export type RedCupColorsType = typeof RedCupColors;

// Legacy export for backwards compatibility (will be removed)
export const DuskColors = RedCupColors;
export type DuskColorsType = RedCupColorsType;
