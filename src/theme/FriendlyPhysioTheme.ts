import {
  MD3LightTheme as DefaultTheme,
  configureFonts,
} from "react-native-paper";

// --- Custom Color Palette (for easy reference) ---
const CustomPalette = {
  // User's provided colors
  IndigoBloom: "#622ba2",
  CoralGlow: "#fb7e52",
  DarkKhaki: "#5c573e",
  Ivory: "#fffded",
  LavenderGrey: "#8c93a8",
};

// FONT CONFIGURATION:
const fontConfig = configureFonts({
  config: {},
});

export const FriendlyPhysioTheme = {
  ...DefaultTheme, // Start with all Material Design 3 defaults
  fonts: fontConfig,
  colors: {
    ...DefaultTheme.colors, // Inherit base colors and override the key ones

    // Core Brand Colors
    primary: CustomPalette.IndigoBloom, // Main action color (Indigo Bloom)
    onPrimary: CustomPalette.Ivory, // Text color on Primary (Ivory)

    // Secondary/Accent Color
    secondary: CustomPalette.CoralGlow, // Use for secondary actions or elements that need emphasis (Coral Glow)
    onSecondary: CustomPalette.Ivory,

    // Backgrounds & Surfaces
    background: CustomPalette.Ivory, // Main screen background (Ivory)
    surface: CustomPalette.Ivory, // Component surfaces (Ivory)
    onSurface: CustomPalette.DarkKhaki, // Primary text color (Dark Khaki)

    // UI Elements
    outline: CustomPalette.LavenderGrey, // For input field borders, separators, etc. (Lavender Grey)
    onBackground: CustomPalette.DarkKhaki,
  },
};
