/**
 * useGameTimer Hook
 * 
 * Manages game timer state and logic
 * Tracks elapsed time in seconds and handles pause/resume functionality
 */

import { useState, useEffect, useRef } from 'react';

interface UseGameTimerReturn {
  elapsedSeconds: number;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
}

export const useGameTimer = (): UseGameTimerReturn => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Timer effect - increments every second when game is not paused
   * Cleans up interval on unmount or pause
   */
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  return {
    elapsedSeconds,
    isPaused,
    setIsPaused,
    togglePause,
  };
};
