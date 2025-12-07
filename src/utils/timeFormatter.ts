/**
 * Time Formatting Utilities
 * 
 * Utility functions for formatting time values for display
 */

/**
 * Formats elapsed seconds into MM:SS display format
 * @param totalSeconds - Total number of seconds elapsed
 * @returns Formatted time string (e.g., "05:23")
 */
export const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

