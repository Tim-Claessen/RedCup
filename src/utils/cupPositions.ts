/**
 * Cup Position Utilities
 * 
 * Generates cup positions for pyramid formations used in beer pong games.
 * Supports both 6-cup and 10-cup configurations.
 */

export interface CupPosition {
  row: number;
  index: number;
}

/**
 * Generates cup positions for pyramid formations
 * @param cupCount - Number of cups (6 or 10)
 * @returns Array of cup positions with row and index coordinates
 * 
 * Formation patterns:
 * - 6 cups: 3-2-1 pyramid (3 rows)
 * - 10 cups: 4-3-2-1 pyramid (4 rows)
 */
export const getCupPositions = (cupCount: 6 | 10): CupPosition[] => {
  if (cupCount === 6) {
    // 6 cups: 3-2-1 pyramid
    return [
      { row: 0, index: 0 },
      { row: 0, index: 1 },
      { row: 0, index: 2 },
      { row: 1, index: 0 },
      { row: 1, index: 1 },
      { row: 2, index: 0 },
    ];
  } else {
    // 10 cups: 4-3-2-1 pyramid
    return [
      { row: 0, index: 0 },
      { row: 0, index: 1 },
      { row: 0, index: 2 },
      { row: 0, index: 3 },
      { row: 1, index: 0 },
      { row: 1, index: 1 },
      { row: 1, index: 2 },
      { row: 2, index: 0 },
      { row: 2, index: 1 },
      { row: 3, index: 0 },
    ];
  }
};

