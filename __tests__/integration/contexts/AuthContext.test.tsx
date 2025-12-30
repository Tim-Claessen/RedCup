/**
 * AuthContext Integration Tests
 * 
 * Tests AuthContext integration with userService
 * 
 * Phase 1 Test:
 * - AUTO-AUTH-IT-01: AuthContext + userService handle creation
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../src/contexts/AuthContext';
import { createUserHandle, getUserHandle } from '../../../src/services/userService';
import { mockAuth } from '../../__mocks__/firebase';

// Mock Firebase
jest.mock('../../../src/services/firebase', () => ({
  auth: mockAuth,
  db: require('../../__mocks__/firebase').mockFirestore,
}));

// Mock userService
jest.mock('../../../src/services/userService', () => ({
  getUserHandle: jest.fn(),
  createUserHandle: jest.fn(),
}));

describe('AuthContext Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
  });

  describe('AUTO-AUTH-IT-01: AuthContext + userService handle creation', () => {
    it('should create handle through AuthContext', async () => {
      const mockUserId = 'test-user-123';
      const mockHandle = 'TestPlayer';

      // Mock Firebase Auth
      mockAuth.signInAnonymously.mockResolvedValue({
        uid: mockUserId,
        isAnonymous: true,
      } as any);

      (getUserHandle as jest.Mock).mockResolvedValue(null);
      (createUserHandle as jest.Mock).mockResolvedValue(true);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sign in anonymously
      await result.current.signInAnonymously();

      // Set handle
      await result.current.setHandle(mockHandle);

      expect(createUserHandle).toHaveBeenCalledWith(mockUserId, mockHandle);
      expect(result.current.user?.handle).toBe(mockHandle);
    });

    it('should retrieve existing handle on auth state change', async () => {
      const mockUserId = 'test-user-123';
      const mockHandle = 'ExistingPlayer';

      // Mock auth state change
      mockAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => {
          callback({
            uid: mockUserId,
            isAnonymous: false,
            email: 'test@example.com',
          } as any);
        }, 0);
        return jest.fn(); // unsubscribe
      });

      (getUserHandle as jest.Mock).mockResolvedValue(mockHandle);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(getUserHandle).toHaveBeenCalledWith(mockUserId);
      expect(result.current.user?.handle).toBe(mockHandle);
    });
  });
});

