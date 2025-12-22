/**
 * Cup Adjacency Utilities
 *
 * Defines which cups are "touching" (adjacent) in the pyramid formation.
 * Used for grenade shot detection.
 *
 * NOTE: Cup IDs are now consistent with positions (position 0 = ID 0, position 1 = ID 1, etc.)
 */

/**
 * Pre-computed adjacency maps for 6-cup and 10-cup formations
 * Maps cup ID to array of touching cup IDs
 *
 * 6-Cup Formation (position = ID):
 * Position 0 (row 0, index 0) = ID 0
 * Position 1 (row 0, index 1) = ID 1
 * Position 2 (row 0, index 2) = ID 2
 * Position 3 (row 1, index 0) = ID 3
 * Position 4 (row 1, index 1) = ID 4
 * Position 5 (row 2, index 0) = ID 5
 */

// 6-Cup Formation (3-2-1 pyramid)
// Visual: Row 0: [0] [1] [2]
//         Row 1:    [3] [4]
//         Row 2:       [5]
const ADJACENCY_6_CUP: Record<number, number[]> = {
  0: [1, 3], // Cup 0 touches cups 1, 3
  1: [0, 2, 3, 4], // Cup 1 touches cups 0, 2, 3, 4
  2: [1, 4], // Cup 2 touches cups 1, 4
  3: [0, 1, 4, 5], // Cup 3 touches cups 0, 1, 4, 5
  4: [1, 2, 3, 5], // Cup 4 touches cups 1, 2, 3, 5
  5: [3, 4], // Cup 5 touches cups 3, 4
};

/**
 * 10-Cup Formation (position = ID):
 * Position 0 (row 0, index 0) = ID 0
 * Position 1 (row 0, index 1) = ID 1
 * Position 2 (row 0, index 2) = ID 2
 * Position 3 (row 0, index 3) = ID 3
 * Position 4 (row 1, index 0) = ID 4
 * Position 5 (row 1, index 1) = ID 5
 * Position 6 (row 1, index 2) = ID 6
 * Position 7 (row 2, index 0) = ID 7
 * Position 8 (row 2, index 1) = ID 8
 * Position 9 (row 3, index 0) = ID 9
 */

// 10-Cup Formation (4-3-2-1 pyramid)
// Visual: Row 0: [0] [1] [2] [3]
//         Row 1:    [4] [5] [6]
//         Row 2:       [7] [8]
//         Row 3:          [9]
const ADJACENCY_10_CUP: Record<number, number[]> = {
  0: [1, 4], // Cup 0 touches cups 1, 4
  1: [0, 2, 4, 5], // Cup 1 touches cups 0, 2, 4, 5
  2: [1, 3, 5, 6], // Cup 2 touches cups 1, 3, 5, 6
  3: [2, 6], // Cup 3 touches cups 2, 6
  4: [0, 1, 5, 7], // Cup 4 touches cups 0, 1, 5, 7
  5: [1, 2, 4, 6, 7, 8], // Cup 5 touches cups 1, 2, 4, 6, 7, 8
  6: [2, 3, 5, 8], // Cup 6 touches cups 2, 3, 5, 8
  7: [4, 5, 8, 9], // Cup 7 touches cups 4, 5, 8, 9
  8: [5, 6, 7, 9], // Cup 8 touches cups 5, 6, 7, 9
  9: [7, 8], // Cup 9 touches cups 7, 8
};

/**
 * Returns array of cup IDs that are touching the given cup
 * @param cupId - The cup ID (0-5 for 6-cup, 0-9 for 10-cup)
 * @param cupCount - Number of cups (6 or 10)
 * @returns Array of touching cup IDs (empty array if cupId is invalid)
 */
export const getTouchingCups = (cupId: number, cupCount: 6 | 10): number[] => {
  if (cupCount === 6) {
    return ADJACENCY_6_CUP[cupId] || [];
  } else {
    return ADJACENCY_10_CUP[cupId] || [];
  }
};

/**
 * Returns array of cup IDs that are touching the given cup, filtered to only include unsunk cups
 * @param cupId - The cup ID (0-5 for 6-cup, 0-9 for 10-cup)
 * @param cupCount - Number of cups (6 or 10)
 * @param cups - Array of all cups to check if they're sunk
 * @returns Array of touching cup IDs that are not sunk
 */
export const getTouchingUnsunkCups = (
  cupId: number,
  cupCount: 6 | 10,
  cups: Array<{ id: number; sunk: boolean }>
): number[] => {
  const touchingCups = getTouchingCups(cupId, cupCount);
  return touchingCups.filter((touchingCupId) => {
    const cup = cups.find((c) => c.id === touchingCupId);
    return cup && !cup.sunk;
  });
};
