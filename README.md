# Red Cup

A React Native mobile application for Beer Pong analytics and tournament management with a focus on "Moneyball-style" performance tracking.

## 🚀 Tech Stack

### Core Stack

- **Framework**: React Native
- **Language**: TypeScript
- **Development Toolset**: Expo (~54.0.25)
- **UI Components**: React Native Paper (Material Design 3)
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

### 🚧 Planned Features

5. **Tournament Mode:** Ability to organize a bracket and track progress.

6. **Stats Engine:**

   - _Efficiency:_ How fast a player clears the rack.
   - _Clutch Factor:_ Performance on the final cup or "Rebuttals/Redemptions."
   - _Cup Isolation:_ Which specific cups a player hits most often.

7. **User Profiles:** User profile creation to enable the above features.
8. **Firebase Integration:** Match persistence, user authentication, cloud sync.

## 🏗️ Technical Architecture

### Project Structure

```text
RedCup/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── QuickGameSetupScreen.tsx
│   │   └── GameScreen.tsx
│   ├── services/            # Firebase, analytics, etc. (future)
│   ├── types/               # TypeScript type definitions
│   │   ├── navigation.ts
│   │   └── game.ts          # Game-related types
│   ├── utils/               # Helper functions
│   │   ├── cupPositions.ts  # Cup position generation
│   │   └── timeFormatter.ts # Time formatting utilities
│   ├── constants/           # App constants
│   │   └── gameConstants.ts # Game configuration constants
│   └── theme/               # Theme and design system
│       ├── colors.ts
│       ├── DesignSystem.ts
│       └── RedCupTheme.ts
├── assets/
│   └── images/              # App images and logos
├── App.tsx                  # Root component
├── index.ts                 # Entry point
├── package.json
└── CODE_REVIEW.md           # Code review and improvement recommendations
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- Expo CLI (optional, but recommended)
- iOS Simulator (for Mac) or Android Emulator / physical device
- Firebase project setup

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd RedCup
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   Or use the platform-specific commands:

   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For web browser (Chrome/Edge)
   ```

4. **Run on your device**

   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 📊 Data Model

The data model follows an **Event Sourcing** pattern, storing discrete timestamped events for granular replay and analysis.

### Core Tables

_**TODO: Review this section**_

#### 1. Users (The Constant)

Standard user profile information.

| Field     | Type        | Description                      |
| --------- | ----------- | -------------------------------- |
| `user_id` | String (PK) | Unique user identifier           |
| `handle`  | String      | Display name (e.g., "BeerBaron") |

#### 2. Matches (The Container)

Holds the state of each game/match.

| Field           | Type                  | Description                                               |
| --------------- | --------------------- | --------------------------------------------------------- |
| `match_id`      | String (PK)           | Unique match identifier                                   |
| `tournament_id` | String (FK, Nullable) | Links to tournament (null for ad-hoc games)               |
| `rules_config`  | JSON                  | Stores cup count (6 or 10) and game rules                 |
| `started_at`    | Timestamp             | Match start time                                          |
| `ended_at`      | Timestamp             | Match end time (crucial for calculating speed/efficiency) |
| `winning_side`  | Enum                  | `'Home'` or `'Away'` (or `0` or `1`)                      |

#### 3. Match_Participants (The "Partner" Logic)

Junction table that solves team composition. Instead of a Team ID, users are grouped by `match_id` and `side`. Everyone on Side 0 are partners; everyone on Side 1 are opponents.

| Field        | Type        | Description                       |
| ------------ | ----------- | --------------------------------- |
| `match_id`   | String (FK) | References the match              |
| `user_id`    | String (FK) | References the user               |
| `side`       | Integer     | `0` or `1` - Team assignment      |
| `is_captain` | Boolean     | Optional: Who finalized the score |

#### 4. Made_Shots (The Event Stream)

Since we only track makes, this table is "sparse" (low volume, high value). This is the core event stream that enables all analytics.

| Field           | Type        | Description                                               |
| --------------- | ----------- | --------------------------------------------------------- |
| `shot_id`       | String (PK) | Unique shot identifier                                    |
| `match_id`      | String (FK) | References the match                                      |
| `user_id`       | String (FK) | Who threw the shot                                        |
| `cup_index`     | Integer     | See "Cup Mapping" below                                   |
| `timestamp`     | Timestamp   | When the shot was made (allows runs/hot streaks analysis) |
| `is_redemption` | Boolean     | Was this a clutch save/redemption?                        |

### Technical Detail: Cup Mapping

To make the data useful for analytics later (heatmaps, cup isolation stats), we use a standard coordinate system for cups.

- **10-Cup Rack:** Pyramid indices `0` through `9`
- **6-Cup Rack:** Pyramid indices `0` through `5`

## 🐛 Known Issues & Limitations

- Grenade feature is temporarily disabled (UI present but non-functional)
- Game events are stored in-memory only (not persisted to database yet)
- No error boundaries or comprehensive error handling yet
- No unit tests (testing infrastructure to be added)

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the project maintainer.

## 📄 License

Private - All rights reserved
