import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  QuickGameSetup: undefined;
  Game: {
    cupCount: number;
    team1Players: Array<{ handle: string; userId?: string }>;
    team2Players: Array<{ handle: string; userId?: string }>;
    gameType: '1v1' | '2v2';
  };
  Tournament: undefined;
  Stats: undefined;
};

export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type QuickGameSetupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'QuickGameSetup'
>;

export type GameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Game'
>;

