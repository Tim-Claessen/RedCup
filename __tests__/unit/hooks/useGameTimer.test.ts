/**
 * useGameTimer Hook Tests
 * 
 * Basic timer functionality test
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGameTimer } from '../../../src/hooks/useGameTimer';

describe('useGameTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should increment elapsed time when not paused', async () => {
    const { result } = renderHook(() => useGameTimer());

    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isPaused).toBe(false);

    act(() => {
      jest.advanceTimersByTime(2000); // 2 seconds
    });

    await waitFor(() => {
      expect(result.current.elapsedSeconds).toBe(2);
    });
  });

  it('should pause timer', () => {
    const { result } = renderHook(() => useGameTimer());

    act(() => {
      result.current.setIsPaused(true);
    });

    expect(result.current.isPaused).toBe(true);
  });

  it('should toggle pause', () => {
    const { result } = renderHook(() => useGameTimer());

    expect(result.current.isPaused).toBe(false);

    act(() => {
      result.current.togglePause();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.togglePause();
    });

    expect(result.current.isPaused).toBe(false);
  });
});

