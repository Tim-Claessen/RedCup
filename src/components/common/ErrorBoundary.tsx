/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays fallback UI.
 * Prevents entire app crashes from component errors.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { AppError, ErrorCodes } from '../../types/errors';
import { createError, logError } from '../../utils/errorHandler';
import { DesignSystem } from '../../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    const appError = error instanceof Error
      ? createError(
          ErrorCodes.UNKNOWN_ERROR,
          'Something went wrong. Please try again.',
          {
            technicalMessage: error.message,
            originalError: error,
            recoverable: true,
          }
        )
      : createError(
          ErrorCodes.UNKNOWN_ERROR,
          'An unexpected error occurred.',
          {
            originalError: error,
            recoverable: true,
          }
        );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const appError = this.state.error || createError(
      ErrorCodes.UNKNOWN_ERROR,
      'Component error occurred',
      {
        technicalMessage: errorInfo.componentStack,
        originalError: error,
      }
    );

    logError(appError, 'ErrorBoundary');
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: AppError;
  onReset: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, onReset }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.error }]}>
          Oops!
        </Text>
        <Text variant="bodyLarge" style={[styles.message, { color: theme.colors.onSurface }]}>
          {error.message}
        </Text>
        {error.recoverable && (
          <Button
            mode="contained"
            onPress={onReset}
            style={styles.button}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
          >
            Try Again
          </Button>
        )}
        {__DEV__ && error.technicalMessage && (
          <Text variant="bodySmall" style={[styles.technical, { color: theme.colors.onSurfaceVariant }]}>
            {error.technicalMessage}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.lg,
  },
  content: {
    padding: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.lg,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    marginBottom: DesignSystem.spacing.md,
    textAlign: 'center',
  },
  message: {
    marginBottom: DesignSystem.spacing.lg,
    textAlign: 'center',
  },
  button: {
    marginTop: DesignSystem.spacing.md,
  },
  technical: {
    marginTop: DesignSystem.spacing.lg,
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

