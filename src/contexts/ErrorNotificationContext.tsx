/**
 * Error Notification Context
 * 
 * Provides error notification functionality (snackbars/toasts) throughout the app.
 * Uses React Native Paper's Snackbar component for consistent error messaging.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Snackbar } from 'react-native-paper';
import { AppError } from '../types/errors';

interface ErrorNotificationContextType {
  showError: (error: AppError | string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

export const useErrorNotification = () => {
  const context = useContext(ErrorNotificationContext);
  if (!context) {
    throw new Error('useErrorNotification must be used within an ErrorNotificationProvider');
  }
  return context;
};

interface ErrorNotificationProviderProps {
  children: ReactNode;
}

interface QueuedNotification {
  message: string;
  type: 'error' | 'success' | 'info';
  timestamp: number;
}

export const ErrorNotificationProvider: React.FC<ErrorNotificationProviderProps> = ({ children }) => {
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'error' | 'success' | 'info'>('error');
  const [notificationQueue, setNotificationQueue] = useState<QueuedNotification[]>([]);

  const processQueue = useCallback(() => {
    if (snackbarVisible || notificationQueue.length === 0) {
      return;
    }

    const next = notificationQueue[0];
    setNotificationQueue(prev => prev.slice(1));
    setSnackbarMessage(next.message);
    setSnackbarType(next.type);
    setSnackbarVisible(true);
  }, [snackbarVisible, notificationQueue]);

  useEffect(() => {
    if (!snackbarVisible && notificationQueue.length > 0) {
      processQueue();
    }
  }, [snackbarVisible, notificationQueue, processQueue]);

  const showError = useCallback((error: AppError | string) => {
    const message = typeof error === 'string' ? error : error.message;
    
    if (snackbarVisible) {
      setNotificationQueue(prev => [...prev, { message, type: 'error', timestamp: Date.now() }]);
    } else {
      setSnackbarMessage(message);
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  }, [snackbarVisible]);

  const showSuccess = useCallback((message: string) => {
    if (snackbarVisible) {
      setNotificationQueue(prev => [...prev, { message, type: 'success', timestamp: Date.now() }]);
    } else {
      setSnackbarMessage(message);
      setSnackbarType('success');
      setSnackbarVisible(true);
    }
  }, [snackbarVisible]);

  const showInfo = useCallback((message: string) => {
    if (snackbarVisible) {
      setNotificationQueue(prev => [...prev, { message, type: 'info', timestamp: Date.now() }]);
    } else {
      setSnackbarMessage(message);
      setSnackbarType('info');
      setSnackbarVisible(true);
    }
  }, [snackbarVisible]);

  const value: ErrorNotificationContextType = {
    showError,
    showSuccess,
    showInfo,
  };

  return (
    <ErrorNotificationContext.Provider value={value}>
      {children}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => {
          setSnackbarVisible(false);
          setTimeout(() => processQueue(), 300);
        }}
        duration={snackbarType === 'error' ? 5000 : 3000}
        action={{
          label: 'Dismiss',
          onPress: () => {
            setSnackbarVisible(false);
            setTimeout(() => processQueue(), 300);
          },
        }}
        style={{
          backgroundColor: snackbarType === 'error' ? '#FF3B30' : snackbarType === 'success' ? '#4CAF50' : '#00D1FF',
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ErrorNotificationContext.Provider>
  );
};
