/**
 * App Root Component
 * 
 * Sets up the React Native app with:
 * - React Navigation for screen navigation
 * - React Native Paper theme provider
 * - Firebase Authentication context
 * - Main navigation stack (Login, Home, QuickGameSetup, Game)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { RedCupTheme } from './src/theme';
import { RootStackParamList } from './src/types/navigation';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ErrorNotificationProvider } from './src/contexts/ErrorNotificationContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QuickGameSetupScreen from './src/screens/QuickGameSetupScreen';
import GameScreen from './src/screens/GameScreen';
import StatsScreen from './src/screens/StatsScreen';
import MatchHistoryScreen from './src/screens/MatchHistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Show Login screen if user is not authenticated OR if user doesn't have a handle
  // LoginScreen will show handle creation screen for authenticated users without handles
  const shouldShowLogin = !user || (user && !user.handle);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'default',
        }}
      >
        {shouldShowLogin ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="QuickGameSetup" component={QuickGameSetupScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PaperProvider theme={RedCupTheme}>
        <ErrorNotificationProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ErrorNotificationProvider>
      </PaperProvider>
    </ErrorBoundary>
  );
}
