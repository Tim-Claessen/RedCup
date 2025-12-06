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

**Key Constraint:** We prioritize speed of play—we ONLY track *made shots*, never misses.

## 🎯 Key Features (MVP)

1. **Game Setup:** Support for 1v1 and 2v2 matches (Ad-hoc teams).

2. **The Input Interface:** A visual rack (10-cup or 6-cup) where users tap to log a "Make."

3. **Tournament Mode:** Ability to organize a bracket and track progress.

4. **Stats Engine:**
   - *Efficiency:* How fast a player clears the rack.
   - *Clutch Factor:* Performance on the final cup or "Rebuttals/Redemptions."
   - *Cup Isolation:* Which specific cups a player hits most often.

5. **User Profiles:** User profile creation to enable the above features.

## 🏗️ Technical Architecture

### Data Strategy

**Event Sourcing:** We log every "Made Shot" as a discrete timestamped event with a `cup_index` to allow for granular replay and analysis later.

### Project Structure

```
RedCup/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   ├── services/            # Firebase, analytics, etc.
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Helper functions
├── assets/
│   ├── images/              # App images and logos
│   └── fonts/               # Custom fonts (if any)
├── App.tsx                  # Root component
├── index.ts                 # Entry point
└── package.json
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

3. **Configure Firebase**

   - Set up Firebase project
   - Add Firebase configuration files
   - Configure Firestore database
   - Set up Firebase Authentication

4. **Start the development server**

   ```bash
   npm start
   ```

   Or use the platform-specific commands:

   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For web (limited functionality)
   ```

5. **Run on your device**

   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 📊 Data Model

### Event Structure

Each "Made Shot" event contains:
- `timestamp`: When the shot was made
- `cup_index`: Which cup was hit (0-9 for 10-cup, 0-5 for 6-cup)
- `player_id`: Who made the shot
- `game_id`: Which game this shot belongs to
- `match_id`: Which match this shot belongs to
- `tournament_id`: (Optional) Which tournament this shot belongs to

## 🔮 Future Roadmap

- Real-time multiplayer game tracking
- Advanced analytics dashboard
- Player comparison tools
- Historical game replay
- Social features (friend lists, challenges)
- Custom tournament formats
- Export/import game data

## 📝 Development Notes

- The app uses React Native Paper for Material Design 3 components
- Navigation is handled by React Navigation (Native Stack)
- All game events are stored using Event Sourcing pattern
- TypeScript ensures type safety throughout the codebase
- Firebase provides backend services and real-time data sync

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the project maintainer.

## 📄 License

Private - All rights reserved
