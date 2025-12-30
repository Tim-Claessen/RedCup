/**
 * Error Boundary Tests
 * 
 * Phase 1 Test:
 * - AUTO-ERROR-UT-03: Error boundary crash prevention
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../../../src/components/common/ErrorBoundary';
import { Text } from 'react-native';

describe('Error Boundary', () => {
  describe('AUTO-ERROR-UT-03: Error boundary crash prevention', () => {
    it('should catch errors and prevent app crash', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Error boundary should render fallback UI instead of crashing
      expect(() => getByText(/error/i)).not.toThrow();
    });

    it('should render children when no error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <Text>Test Content</Text>
        </ErrorBoundary>
      );

      expect(getByText('Test Content')).toBeTruthy();
    });
  });
});

