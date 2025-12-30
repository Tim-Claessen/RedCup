# SINK

A React Native mobile application for Beer Pong analytics and tournament management with "Moneyball-style" performance tracking. The Strava for Beer Pong.

> **Brand Identity:** See [`documentation/branding/branding.md`](./documentation/branding/branding.md) for complete brand guidelines, color palette, and voice guidelines.

> **Version:** 1.0.0 | **Status:** Active Development

## 🚀 Tech Stack

- **Framework**: React Native with Expo (~54.0.30)
- **Language**: TypeScript
- **UI**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation (Native Stack)
- **Backend**: Firebase (Firestore)
- **Local Storage**: AsyncStorage integration
- **Notifications**: reminders via expo-notifications
- **Database**: Cloud Firestore for data persistence
- **Authentication**: Firebase Authentication
- **Analytics**: Google Analytics for Firebase
- **Performance Monitoring**: Firebase Performance Monitoring
- **Build & Deployment**: EAS Build for app store distribution
- **Version Control**: GitHub
- **Development Tools**: VS Code & Cursor

## 📱 App Concept

**Core Concept:** A digital scoreboard and tournament manager for Beer Pong that focuses on "Moneyball-style" analytics.

**Key Constraint:** We prioritize speed of play—we ONLY track _made shots_, never misses.

### Game Setup

- 1v1 and 2v2 matches with ad-hoc teams
- Cup count selection (6 or 10 cups)
- Player name entry per team

### Game Interface

- Visual beer pong table with clickable cup formations (pyramid layout)
- Real-time game timer
- Shot type tracking: Regular, Bounce, Grenade (2v2 only)
- Table rotation (180° perspective switching)
- Pause/Resume functionality
- Undo with coordinated bounce/grenade group handling
- Re-rack support for rearranging remaining cups

### Game Flow

- Victory detection (last cup or bounce on second-to-last cup)
- Redemption dialog (Play on / Win)
- Surrender flow with DNF tracking
- Automatic player selection for 1v1 games

### Data & Analytics

- Event sourcing pattern with full game state snapshots
- UUID-based event IDs with soft-delete pattern (`isUndone` flag)
- Real-time Firestore persistence
- Match completion tracking with timestamps

## 🏗️ Project Structure

```text
RedCup/
├── src/
│   ├── screens/                    # Screen components
│   │   ├── LoginScreen.tsx         # Authentication screen (sign in, sign up, guest mode, handle creation)
│   │   ├── HomeScreen.tsx          # Main entry screen with navigation options
│   │   ├── QuickGameSetupScreen.tsx # Game configuration (players, cup count, game type)
│   │   └── GameScreen.tsx          # Main game interface with table and controls
│   │
│   ├── components/game/            # Game-specific UI components
│   │   ├── CupFormation.tsx        # Visual cup pyramid layout with click handlers
│   │   ├── GameTable.tsx           # Table container with rotation and cup formations
│   │   ├── SinkDialog.tsx          # Shot type selection and player attribution
│   │   ├── BounceSelectionDialog.tsx # Second cup selection for bounce shots
│   │   ├── RedemptionDialog.tsx    # Redemption flow (Play on / Win)
│   │   ├── VictoryDialog.tsx       # Victory overlay with winner display
│   │   ├── SurrenderDialog.tsx     # Surrender confirmation and DNF tracking
│   │   ├── ExitGameDialog.tsx      # Exit confirmation dialog
│   │   ├── RerackDialog.tsx        # Cup rearrangement interface
│   │   ├── GameControlsMenu.tsx    # Pause, undo, rerack, exit controls
│   │   └── EventsDialog.tsx        # Development-only event inspector
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useGameTimer.ts         # Game duration tracking with pause/resume
│   │   ├── useGameState.ts         # Match initialization and Firestore integration
│   │   └── useCupManagement.ts     # Cup sink operations, undo, redemption, rerack logic
│   │
│   ├── services/                   # Backend services
│   │   ├── firebase.ts             # Firebase initialization and configuration
│   │   ├── firestoreService.ts     # Firestore operations (matches, made_shots, undo)
│   │   └── userService.ts          # User handle management (create, retrieve, search)
│   │
│   ├── contexts/                   # React contexts
│   │   └── AuthContext.tsx         # Authentication state and methods (login, signup, guest mode)
│   │
│   ├── types/                      # TypeScript type definitions
│   │   ├── game.ts                 # Game entities (Cup, GameEvent, Player, etc.)
│   │   └── navigation.ts           # Navigation stack type definitions
│   │
│   ├── utils/                      # Helper functions
│   │   ├── cupPositions.ts         # Cup position calculations for pyramid layouts
│   │   ├── cupAdjacency.ts         # Adjacent cup detection (for grenade shots)
│   │   └── timeFormatter.ts        # Game timer display formatting
│   │
│   ├── constants/                  # App constants
│   │   └── gameConstants.ts        # Game rules and configuration constants
│   │
│   └── theme/                      # Theme and design system
│       ├── colors.ts               # Color palette definitions
│       ├── DesignSystem.ts         # Spacing, typography, border radius constants
│       ├── RedCupTheme.ts          # Main app theme (Material Design 3)
│       ├── DuskTheme.ts            # Alternative theme option
│       └── index.ts               # Theme exports
│
├── assets/
│   ├── images/                     # App icons and logos
│   │   ├── RedCup_Logo.png
│   │   └── RedCup_Logo.jpg
│   └── config/                     # Configuration assets
│
├── .secure/                        # Gitignored secrets (Firebase config)
│
├── App.tsx                         # Root component (Navigation + Theme setup)
├── index.ts                       # Expo entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── dev_workbook.md                 # Development planning and progress tracking
└── documentation/                 # Project documentation
    ├── branding/                  # Brand guidelines
    ├── coding/                    # Coding standards
    ├── project/                   # Project documentation
    └── testing/                   # Testing documentation
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app (for mobile testing) or iOS Simulator/Android Emulator
- Firebase project (for data persistence)

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   - Create `.secure/firebase.config.ts` with your Firebase config
   - See `.secure/README.md` for template

3. **Start development server**
   ```bash
   npm start
   # Press: a (Android), i (iOS), or w (web)
   ```

## 🚀 Quick Start

After setup, the app will open in Expo Go or your simulator. Navigate through:

1. **Home Screen** → Select "New Game"
2. **Setup Screen** → Configure players, cup count (6 or 10), and game type (1v1 or 2v2)
3. **Game Screen** → Track shots by tapping cups on the visual table

## 💻 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Open on Android device/emulator
- `npm run ios` - Open on iOS simulator
- `npm run web` - Open in web browser

### Development Workflow

1. **Hot Reloading**: Changes automatically reload in Expo Go
2. **Debugging**: Use React Native Debugger or Chrome DevTools
3. **Event Inspection**: Access `EventsDialog` from game controls menu (dev-only feature)
4. **Firebase Console**: Monitor Firestore collections in real-time at [Firebase Console](https://console.firebase.google.com)

### Architecture Highlights

- **Event Sourcing**: All game state derived from event sequence
- **Custom Hooks**: Business logic separated into reusable hooks (`useCupManagement`, `useGameState`, `useGameTimer`)
- **Type Safety**: Full TypeScript coverage with strict type checking (no `any` types, proper type definitions)
- **Material Design 3**: Consistent UI via React Native Paper theme system
- **Error Handling**: Structured error system with retry logic, graceful degradation, and user-friendly notifications
  - Centralized error types with unique codes (`ErrorCodes`) for testing
  - Exponential backoff retry for transient failures
  - Offline support with graceful degradation
  - Error boundaries prevent app crashes
  - TODO: Integrate Firebase Crashlytics for production error tracking
- **Code Quality**: Codebase follows [`documentation/coding/CODING_STANDARDS.md`](./documentation/coding/CODING_STANDARDS.md) for consistency and maintainability

### Development Documentation

For detailed development information, see:

- **[`dev_workbook.md`](./dev_workbook.md)** - Development planning, code review findings, refactoring progress, and TODO tracking
- **[`documentation/coding/CODING_STANDARDS.md`](./documentation/coding/CODING_STANDARDS.md)** - Code style guide, naming conventions, and best practices

These documents provide comprehensive guidance for contributing to the project.

## 📊 Data Model

Event-sourcing pattern optimized for analytics. Only tracks **made shots**.

### Firestore Collections

#### **users**

User handle mapping. Document ID is the `userId` (Firebase Auth UID).

**Fields:**

- `userId`: `string` - Firebase Auth UID (same as document ID)
- `handle`: `string` - User's display name/handle (unique, used for player search)
- `createdAt`: `number` - Timestamp when handle was created (milliseconds since epoch)
- `updatedAt`: `number` - Timestamp when handle was last updated

#### **matches**

Match metadata and completion tracking. Document ID is the `matchId` (not stored as a field).

**Fields:**

- `tournamentId`: `string | null` - Links to tournament (null for ad-hoc games, reserved for future)
- `rulesConfig`: `{ cupCount: 6 | 10, gameType: '1v1' | '2v2' }` - Game configuration
- `participants`: `Array<{ userId?: string, handle: string, side: 0 | 1, isCaptain?: boolean }>` - Player list
  - `side`: `0` = team1 (top), `1` = team2 (bottom)
  - `userId`: Optional Firebase Auth UID for authenticated users
- `startedAt`: `Timestamp` - Match start time (server timestamp)
- `endedAt`: `Timestamp | null` - Match end time (only set when match completes)
- `winningSide`: `0 | 1 | undefined` - Winning team (only set when match completes)
- `team1Score`: `number | undefined` - Final score - cups made by team1
- `team2Score`: `number | undefined` - Final score - cups made by team2
- `completed`: `boolean` - `true` = match finished normally, `false` = DNF (did not finish/abandoned)

#### **made_shots**

Top-level collection for analytics. Each document represents a single made shot event. Document ID is the `shotId` (same as `eventId` from game events).

**Fields:**

- `shotId`: `string` - Unique identifier (UUID v4, same as `eventId`)
- `matchId`: `string` - Reference to match document
- `userId?`: `string` - Firebase Auth user ID (optional, for authenticated users)
- `playerHandle`: `string` - Player display name/handle (stored in Firestore `users` collection)
- `cupIndex`: `number` - Standard cup mapping (0-5 for 6-cup, 0-9 for 10-cup)
- `timestamp`: `number` - Milliseconds since epoch (for chronological ordering)
- `isBounce`: `boolean` - Whether this was a bounce shot
- `isGrenade`: `boolean` - Whether this was a grenade shot (2v2 only, sinks target + adjacent cups)
- `isRedemption`: `boolean` - Auto-calculated: true if shot made when opponent had 0 cups remaining
- `isUndone`: `boolean` - Soft-delete flag (true = event was undone, filtered out for analytics)
- `bounceGroupId?`: `string` - Links multi-cup bounce shots together for coordinated undo
- `grenadeGroupId?`: `string` - Links grenade shot events together (target + all adjacent cups)
- `team1CupsRemaining`: `number` - Game state snapshot at time of shot
- `team2CupsRemaining`: `number` - Game state snapshot at time of shot

**Note:** `gameState` (full cup array snapshots) was removed from Firestore documents to reduce storage. Game state can be reconstructed from the event sequence.

### Key Design Decisions

- **Only track made shots** (never misses) - Prioritizes speed of play
- **Top-level `made_shots` collection** - Enables efficient player stats and leaderboards queries
- **Soft-delete pattern** (`isUndone` flag) - Preserves full history for analytics while allowing undo
- **UUID-based event IDs** - Prevents collisions and enables direct document lookup
- **Document ID = shotId** - No queries needed for individual shot lookups
- **No gameState in Firestore** - Reduces storage; state can be reconstructed from events

### Event Sourcing Pattern

The app uses an event-sourcing architecture where:

1. **Events are immutable** - Once created, events are never modified
2. **State is derived** - Current game state calculated from event sequence
3. **Undo via soft-delete** - Events marked `isUndone: true` rather than deleted
4. **Full history preserved** - All events stored for analytics and replay
5. **Group coordination** - Bounce/grenade shots linked via `bounceGroupId`/`grenadeGroupId` for atomic undo

## 🔮 Planned Features

- **Tournament Mode**: Bracket organization and progress tracking
- **Stats Engine**: Efficiency metrics, clutch factor, cup isolation heatmaps
- **Advanced Analytics**: Shot patterns, win probability, player rankings

## ⚠️ Known Limitations

- **Offline Mode**: App continues functioning when offline, but data persistence requires Firebase connection (graceful degradation implemented)
- **No Tournament Support**: Only ad-hoc games supported (tournament mode pending)
- **Web Limitations**: Some native features may not work in web build

## 🔒 Security & Configuration

- **Firebase Config**: Stored in `.secure/firebase.config.ts` (gitignored)
- **Secrets Management**: See `.secure/README.md` for configuration template
- **Firestore Rules**: Security rules pending authentication implementation
- **Environment Variables**: No additional env vars required beyond Firebase config

## 🐛 Troubleshooting

### Common Issues

**Firebase not initialized**

- Ensure `.secure/firebase.config.ts` exists with valid Firebase config
- Check Firebase project is active in Firebase Console

**Expo Go connection issues**

- Ensure device and computer are on same network
- Try clearing Expo cache: `npx expo start -c`

**TypeScript errors**

- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration

**Firestore permission errors**

- Verify Firestore security rules allow read/write operations
- Check Firebase project billing status (Blaze plan required for some features)

## 📚 Additional Resources

### External Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Navigation](https://reactnavigation.org/)

### Project Documentation

- **[Development Workbook](./dev_workbook.md)** - Comprehensive development planning, code review findings, refactoring progress, and feature tracking
- **[Coding Standards](./documentation/coding/CODING_STANDARDS.md)** - Code style guide, naming conventions, TypeScript practices, and React best practices

## 📄 License

Private - All rights reserved
