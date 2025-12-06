/**
 * App Root Component
 * 
 * Sets up the React Native app with:
 * - React Navigation for screen navigation
 * - React Native Paper theme provider
 * - Main navigation stack (Home, QuickGameSetup, Game)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { RedCupTheme } from './src/theme';
import { RootStackParamList } from './src/types/navigation';
import HomeScreen from './src/screens/HomeScreen';
import QuickGameSetupScreen from './src/screens/QuickGameSetupScreen';
import GameScreen from './src/screens/GameScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider theme={RedCupTheme}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'default',
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="QuickGameSetup" component={QuickGameSetupScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
