/**
 * User Service Tests
 * 
 * Tests for handle creation, validation, and uniqueness enforcement
 * 
 * Phase 1 Tests:
 * - AUTO-AUTH-UT-01: Handle creation and validation
 * - AUTO-AUTH-UT-02: Handle uniqueness enforcement
 */

import { createUserHandle, isHandleAvailable, getUserHandle } from '../../../src/services/userService';
import { mockFirestore } from '../../__mocks__/firebase';

// Mock Firebase
jest.mock('../../../src/services/firebase', () => ({
  db: mockFirestore,
}));

describe('User Service - Handle Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AUTO-AUTH-UT-01: Handle creation and validation', () => {
    it('should create a handle successfully with valid input', async () => {
      const userId = 'test-user-123';
      const handle = 'TestPlayer';

      // Mock Firestore responses
      mockFirestore.doc.mockReturnValue({
        id: userId,
      });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false,
      });
      mockFirestore.setDoc.mockResolvedValue(undefined);
      mockFirestore.collection.mockReturnValue({
        id: 'users',
      });
      mockFirestore.query.mockReturnValue({});
      mockFirestore.getDocs.mockResolvedValue({
        forEach: jest.fn(),
        empty: true,
      });
      mockFirestore.where.mockReturnValue({});
      mockFirestore.limit.mockReturnValue({});

      const result = await createUserHandle(userId, handle);

      expect(result).toBe(true);
      expect(mockFirestore.setDoc).toHaveBeenCalled();
    });

    it('should reject empty handle', async () => {
      const userId = 'test-user-123';
      const handle = '';

      await expect(createUserHandle(userId, handle)).rejects.toMatchObject({
        code: 'VALIDATION_MISSING_FIELD',
        message: 'Handle cannot be empty.',
      });
    });

    it('should reject whitespace-only handle', async () => {
      const userId = 'test-user-123';
      const handle = '   ';

      await expect(createUserHandle(userId, handle)).rejects.toMatchObject({
        code: 'VALIDATION_MISSING_FIELD',
        message: 'Handle cannot be empty.',
      });
    });

    it('should trim handle whitespace', async () => {
      const userId = 'test-user-123';
      const handle = '  TestPlayer  ';

      mockFirestore.doc.mockReturnValue({
        id: userId,
      });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false,
      });
      mockFirestore.setDoc.mockResolvedValue(undefined);
      mockFirestore.collection.mockReturnValue({
        id: 'users',
      });
      mockFirestore.query.mockReturnValue({});
      mockFirestore.getDocs.mockResolvedValue({
        forEach: jest.fn(),
        empty: true,
      });
      mockFirestore.where.mockReturnValue({});
      mockFirestore.limit.mockReturnValue({});

      const result = await createUserHandle(userId, handle);

      expect(result).toBe(true);
      expect(mockFirestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          handle: 'TestPlayer',
        }),
        { merge: true }
      );
    });
  });

  describe('AUTO-AUTH-UT-02: Handle uniqueness enforcement', () => {
    it('should reject duplicate handle (case-insensitive)', async () => {
      const userId = 'test-user-123';
      const handle = 'TestPlayer';

      // Mock handle availability check - return false (taken)
      mockFirestore.collection.mockReturnValue({
        id: 'users',
      });
      mockFirestore.query.mockReturnValue({});
      mockFirestore.getDocs.mockResolvedValue({
        forEach: jest.fn((callback) => {
          // Simulate existing user with same handle
          callback({
            id: 'other-user-456',
            data: () => ({
              userId: 'other-user-456',
              handle: 'testplayer', // lowercase match
            }),
          });
        }),
        empty: false,
      });
      mockFirestore.where.mockReturnValue({});
      mockFirestore.limit.mockReturnValue({});

      await expect(createUserHandle(userId, handle)).rejects.toMatchObject({
        code: 'VALIDATION_HANDLE_TAKEN',
        message: 'This handle is already taken. Please choose another one.',
      });
    });

    it('should allow handle if available', async () => {
      const userId = 'test-user-123';
      const handle = 'UniquePlayer';

      // Mock handle availability check - return true (available)
      mockFirestore.collection.mockReturnValue({
        id: 'users',
      });
      mockFirestore.query.mockReturnValue({});
      mockFirestore.getDocs.mockResolvedValue({
        forEach: jest.fn(), // No existing users
        empty: true,
      });
      mockFirestore.where.mockReturnValue({});
      mockFirestore.limit.mockReturnValue({});
      mockFirestore.doc.mockReturnValue({
        id: userId,
      });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => false,
      });
      mockFirestore.setDoc.mockResolvedValue(undefined);

      const result = await createUserHandle(userId, handle);

      expect(result).toBe(true);
    });

    it('should allow user to update their own handle', async () => {
      const userId = 'test-user-123';
      const handle = 'MyNewHandle';

      // Mock handle availability check - exclude current user
      mockFirestore.collection.mockReturnValue({
        id: 'users',
      });
      mockFirestore.query.mockReturnValue({});
      mockFirestore.getDocs.mockResolvedValue({
        forEach: jest.fn((callback) => {
          // Simulate same user with same handle (should be allowed)
          callback({
            id: userId,
            data: () => ({
              userId: userId,
              handle: 'mynewhandle',
            }),
          });
        }),
        empty: false,
      });
      mockFirestore.where.mockReturnValue({});
      mockFirestore.limit.mockReturnValue({});
      mockFirestore.doc.mockReturnValue({
        id: userId,
      });
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: userId,
          handle: 'OldHandle',
        }),
      });
      mockFirestore.setDoc.mockResolvedValue(undefined);

      // Note: The actual implementation checks excludeUserId in isHandleAvailable
      // This test verifies the logic works correctly
      const isAvailable = await isHandleAvailable(handle, userId);
      
      // Should be available because it's the same user
      expect(isAvailable).toBe(true);
    });
  });
});

