/**
 * SINK Theme Color Palette - Cyberpunk Noir
 * A modern dark theme following Material Design 3 principles
 * Color palette: Deep Ink background, Electric Cyan primary,
 * Arcade Purple secondary, and Crimson for destructive actions (use sparingly)
 */

export const RedCupColors = {
  background: '#0B0E14',
  onBackground: '#F8F9FA',

  surface: '#1A1F26',
  onSurface: '#F8F9FA',
  surfaceVariant: '#232830',
  onSurfaceVariant: '#94A3B8',

  primary: '#00D1FF',
  onPrimary: '#000000',
  primaryContainer: '#0099CC',
  onPrimaryContainer: '#FFFFFF',

  secondary: '#7000FF',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#5A00CC',
  onSecondaryContainer: '#E0B3FF',

  accent: '#00D1FF',
  onAccent: '#000000',
  accentContainer: '#0099CC',
  onAccentContainer: '#FFFFFF',

  tertiary: '#7000FF',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#5A00CC',
  onTertiaryContainer: '#E0B3FF',

  success: '#4CAF50',
  onSuccess: '#FFFFFF',
  successContainer: '#1B5E20',
  onSuccessContainer: '#A5D6A7',

  outline: '#2D3440',
  outlineVariant: '#1F252D',

  error: '#FF3B30',
  onError: '#FFFFFF',
  errorContainer: '#4A1F28',
  onErrorContainer: '#F8BBD0',

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
