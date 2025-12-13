# Red Cup

A React Native mobile application for Beer Pong analytics and tournament management with a focus on "Moneyball-style" performance tracking.

## 🚀 Tech Stack

- **Framework**: React Native with Expo (~54.0.25)
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

## 🎯 Key Features (MVP)

### ✅ Implemented Features

1. **Game Setup:**

   - Support for 1v1 and 2v2 matches (Ad-hoc teams)
   - Cup count selection (6 or 10 cups)
   - Player name entry for each team
   - Game type automatically configures player count

2. **The Input Interface:**

   - Visual beer pong table with clickable cup formations (pyramid layout)
   - Real-time timer tracking game duration
   - Cup sink recording with player attribution
   - Shot type tracking: Regular, Bounce (with second cup selection), and Grenade (2v2 only, coming soon)
   - Table rotation for perspective switching (180° rotation)
   - Pause/Resume game functionality
   - Undo functionality for correcting mistakes
   - Bounce shot selection dialog with mirrored cup layout

3. **Game Tracking:**

   - Event sourcing pattern - every cup sink is logged with full game state
   - Tracks timestamp, player, shot type, and cups remaining
   - Complete game state snapshots for replay/analytics
   - Visual feedback for sunk cups
   - Bounce shots linked via `bounceGroupId` for coordinated undo
   - UUID-based event IDs for collision prevention
   - Soft-delete pattern (isUndone flag) for analytics

4. **Game Flow:**

   - Victory condition detection (last cup or bounce on second-to-last cup)
   - Redemption dialog with "Play on" or "Win" options
   - Redemption restores last cup(s) without undoing events
   - Victory overlay with player name and Home button
   - Automatic player selection for 1v1 games

5. **User Interface:**
   - Material Design 3 theme (React Native Paper)
   - Dark theme optimized for low-light gaming environments
   - Responsive table sizing based on device screen
   - Intuitive controls and navigation
   - Web support (React Native Web) for browser testing

6. **Firebase Integration:**
   - Match persistence to Firestore
   - Event sourcing with real-time event storage
   - Match completion tracking with timestamps

### 🚧 Planned Features

- **Tournament Mode:** Bracket organization and progress tracking
- **Stats Engine:** Efficiency metrics, clutch factor, cup isolation heatmaps
- **User Profiles & Authentication:** Firebase Auth integration
- **Grenade Shot Type:** Full implementation (UI present, logic pending)

## 🏗️ Project Structure

```text
RedCup/
├── src/
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── QuickGameSetupScreen.tsx
│   │   └── GameScreen.tsx
│   ├── components/game/     # Game-specific UI components
│   │   ├── CupFormation.tsx
│   │   ├── GameTable.tsx
│   │   ├── SinkDialog.tsx
│   │   ├── BounceSelectionDialog.tsx
│   │   ├── RedemptionDialog.tsx
│   │   ├── VictoryDialog.tsx
│   │   └── EventsDialog.tsx (dev-only)
│   ├── services/            # Backend services
│   │   ├── firebase.ts      # Firebase initialization
│   │   └── firestoreService.ts  # Firestore operations
│   ├── hooks/               # Custom React hooks
│   │   ├── useGameTimer.ts
│   │   ├── useGameState.ts
│   │   └── useCupManagement.ts
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions
│   ├── constants/           # App constants
│   └── theme/               # Theme and design system
├── .secure/                 # Gitignored secrets (Firebase config)
├── assets/                  # Images and static assets
├── App.tsx                  # Root component
└── package.json
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app (for mobile testing) or iOS Simulator/Android Emulator
- Firebase project (for data persistence)

### Setup Steps

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd RedCup
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Get your Firebase config from Project Settings → Your apps → Web app
   - Create `.secure/firebase.config.ts` (see `.secure/README.md` for template)
   - The `.secure` folder is gitignored to protect credentials

3. **Start development server**

   ```bash
   npm start
   # Then press: a (Android), i (iOS), or w (web)
   ```

4. **Run on device**
   - Scan QR code with Expo Go app, or
   - Use platform-specific commands: `npm run android` | `npm run ios` | `npm run web`

## 📊 Data Model

The app uses an **Event Sourcing** pattern, storing discrete timestamped events for granular replay and analytics.

### Firestore Collections

- **matches**: Match metadata (participants, rules, timestamps, winner)
- **events**: Individual cup sink events with full game state snapshots

### Key Design Decisions

- **Only track made shots** (never misses) for speed of play
- **Event-based architecture** enables replay and analytics
- **Soft-delete pattern** (`isUndone` flag) preserves analytics integrity
- **UUID-based event IDs** prevent collisions
- **Bounce shots** linked via `bounceGroupId` for coordinated undo

See `FIREBASE_DATA_MODEL_ANALYSIS.md` for detailed schema documentation.

## 📝 Notes

- Firebase config stored in `.secure/` folder (gitignored)
- See `.secure/README.md` for secrets management guide
- See `FIREBASE_DATA_MODEL_ANALYSIS.md` for detailed data model documentation

## 📄 License

Private - All rights reserved
