/**
 * Game Constants
 * 
 * Centralized constants for game configuration and UI sizing
 */

import { Dimensions } from 'react-native';

// Screen dimensions and table sizing
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TABLE_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 500); // 50% of screen height, max 500px
export const TABLE_WIDTH = Math.min(SCREEN_WIDTH - 32, 600); // Screen width minus padding, max 600px
export const CUP_SIZE = 40; // Fixed cup size for optimal clickability and visual balance

// Game configuration constants
export const MINI_CUP_SIZE = 35; // Size for cups in bounce selection dialog
export const TIMESTAMP_TOLERANCE_MS = 1000; // Tolerance for matching events by timestamp (1 second)

