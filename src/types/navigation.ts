import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CupCount, GameType, Player } from './game';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  QuickGameSetup: undefined;
  Game: {
    cupCount: CupCount;
    team1Players: Player[];
    team2Players: Player[];
    gameType: GameType;
  };
  Tournament: undefined;
  Stats: undefined;
  MatchHistory: undefined;
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

export type StatsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Stats'
>;

