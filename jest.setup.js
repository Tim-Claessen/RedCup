// Jest setup file - runs before each test file
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  setStatusBarBackgroundColor: jest.fn(),
  setStatusBarStyle: jest.fn(),
}));

// Mock AsyncStorage (if used)
try {
  jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
  );
} catch (e) {
  // AsyncStorage mock not available, create simple mock
  jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }));
}

// Mock react-native-get-random-values (for UUID)
jest.mock('react-native-get-random-values', () => ({
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
}));

// Global test timeout
jest.setTimeout(10000);
