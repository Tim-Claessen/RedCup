# Red Cup - Development Workbook

**Last Updated**: 2025-12-07 (Updated with Firebase integration and bug fixes)

This workbook consolidates development planning, code review findings, and refactoring progress for the Red Cup beer pong analytics app.

---

## 📋 Table of Contents

1. [Refactoring Summary](#refactoring-summary)
2. [Code Review & Improvement Recommendations](#code-review--improvement-recommendations)
3. [Development TODO & Future Work](#development-todo--future-work)

---

## 🔄 Refactoring Summary

### Changes Made (2025-12-07)

#### 1. Created Type Definitions (`src/types/game.ts`)

- Extracted all game-related types from `GameScreen.tsx`
- Centralized type definitions for better reusability
- Types include: `Cup`, `GameEvent`, `GameType`, `CupCount`, `TeamSide`, `ShotType`, `TeamId`, `Player`, `SelectedCup`

#### 2. Created Utility Functions

- **`src/utils/cupPositions.ts`**: Extracted cup position generation logic
- **`src/utils/timeFormatter.ts`**: Extracted time formatting logic

#### 3. Created Constants File (`src/constants/gameConstants.ts`)

- Centralized game configuration constants
- Table sizing constants
- UI sizing constants

#### 4. Updated README.md

- Added current features (bounce shots, redemption, victory screen)
- Updated project structure
- Added web support information
- Added code quality section
- Added known issues and limitations

### Files Created

- `src/types/game.ts` - Game type definitions
- `src/utils/cupPositions.ts` - Cup position utilities
- `src/utils/timeFormatter.ts` - Time formatting utilities
- `src/constants/gameConstants.ts` - Game constants

### Files Updated

- `README.md` - Updated with current features and structure
- `src/screens/GameScreen.tsx` - Refactored to use new types, utilities, and constants

### Impact

✅ **Improved Modularity**: Types and utilities are now reusable  
✅ **Better Organization**: Code is better structured and easier to navigate  
✅ **Maintainability**: Centralized constants and types make changes easier  
✅ **Type Safety**: Stronger typing with centralized type definitions

### Notes

- The refactoring maintains backward compatibility
- No breaking changes to existing functionality
- All new files follow TypeScript best practices

---

## 🔍 Code Review & Improvement Recommendations

### Executive Summary

The Red Cup codebase is functional and well-documented, but there are opportunities to improve sustainability, modularity, stability, and maintainability. The primary concern is the large `GameScreen.tsx` component (1200+ lines) which should be broken down into smaller, reusable pieces.

### Key Findings

#### ✅ Strengths

1. **Good TypeScript Usage**: Strong type safety throughout
2. **Clear Documentation**: Good inline comments and JSDoc
3. **Consistent Styling**: Uses Design System and theme consistently
4. **Event Sourcing Pattern**: Well-implemented for analytics
5. **Separation of Concerns**: Navigation, theme, and screens separated

#### ⚠️ Areas for Improvement

##### 1. **Component Size & Modularity** (High Priority)

**Issue**: `GameScreen.tsx` is 1200+ lines - too large for maintainability

**Recommendations**:

- Extract custom hooks (`useGameTimer`, `useGameState`, `useCupManagement`)
- Extract sub-components (`CupFormation`, `GameTable`, `SinkDialog`, `BounceSelectionDialog`, `RedemptionDialog`, `VictoryDialog`)
- Move business logic to separate files

**Impact**: Improves testability, reusability, and maintainability

##### 2. **Type Definitions** (Medium Priority) ✅

**Status**: ✅ Completed - Created `src/types/game.ts` for centralized game types

**Remaining Work**:

- Move all type definitions to appropriate type files
- Create `src/types/index.ts` for easy imports

**Impact**: Better type reusability and consistency

##### 3. **Utility Functions** (Medium Priority) ✅

**Status**: ✅ Completed - Created utilities for cup positions and time formatting

**Remaining Work**:

- Extract more utilities (cup validation, event helpers, etc.)

**Impact**: Code reusability and easier testing

##### 4. **Error Handling** (High Priority)

**Issue**: No error boundaries or try-catch blocks

**Recommendations**:

- Add React Error Boundaries
- Add try-catch for async operations
- Add validation for user inputs
- Add error states in UI

**Impact**: Better user experience and debugging

##### 5. **State Management** (Medium Priority)

**Issue**: Many useState hooks in GameScreen

**Recommendations**:

- Consider using `useReducer` for complex game state
- Extract state logic into custom hooks
- Consider context for shared game state (if needed)

**Impact**: Cleaner component code, easier state management

##### 6. **Constants** (Low Priority) ✅

**Status**: ✅ Completed - Created `src/constants/gameConstants.ts`

**Remaining Work**:

- Move all constants to centralized files
- Use named constants instead of magic numbers

**Impact**: Easier configuration and maintenance

##### 7. **Performance** (Medium Priority)

**Issues**:

- No memoization for expensive calculations
- Potential re-renders on every state change

**Recommendations**:

- Use `useMemo` for cup position calculations
- Use `useCallback` for event handlers
- Consider `React.memo` for sub-components

**Impact**: Better performance, especially on lower-end devices

##### 8. **Testing** (High Priority)

**Issue**: No test files or testing infrastructure

**Recommendations**:

- Set up Jest and React Native Testing Library
- Add unit tests for utilities
- Add component tests for critical paths
- Add integration tests for game flow

**Impact**: Prevents regressions, enables confident refactoring

##### 9. **Accessibility** (Medium Priority)

**Issue**: Limited accessibility features

**Recommendations**:

- Add `accessibilityLabel` to interactive elements
- Add `accessibilityRole` where appropriate
- Test with screen readers
- Ensure sufficient color contrast

**Impact**: Better user experience for all users

##### 10. **Code Organization** (Low Priority)

**Recommendations**:

- Create `src/hooks/` directory for custom hooks
- Create `src/components/game/` for game-specific components
- Organize by feature rather than by type
- Consider feature-based folder structure

**Impact**: Easier navigation and maintenance

### Implementation Priority

#### Phase 1: Critical (Do First)

1. ✅ Extract types to `src/types/game.ts`
2. ✅ Extract utilities to `src/utils/`
3. ✅ Update GameScreen.tsx to use new utilities
4. **Add error handling and validation**
5. **Break down GameScreen into smaller components**

#### Phase 2: Important (Do Soon)

1. **Create custom hooks for game logic**
2. **Add React.memo and useMemo for performance**
3. **Set up testing infrastructure**
4. **Add error boundaries**

#### Phase 3: Nice to Have (Do Later)

1. **Refactor to useReducer for complex state**
2. **Add accessibility features**
3. **Optimize bundle size**
4. **Add performance monitoring**

### Best Practices

#### ✅ Good Practices Already in Place

1. **TypeScript**: Strong typing throughout
2. **Documentation**: Good inline comments
3. **Design System**: Centralized theme and spacing
4. **Event Sourcing**: Well-implemented data pattern
5. **Separation of Concerns**: Navigation, theme, and screens separated

#### 📝 Additional Best Practices to Adopt

1. **Single Responsibility Principle**: Each component/function should do one thing
2. **DRY (Don't Repeat Yourself)**: Extract common logic
3. **Error First**: Handle errors explicitly
4. **Test Coverage**: Aim for 80%+ coverage on critical paths
5. **Code Reviews**: Regular reviews for quality
6. **Linting**: Use ESLint with strict rules
7. **Prettier**: Consistent code formatting
8. **Git Hooks**: Pre-commit hooks for linting/testing

### Metrics to Track

1. **Component Size**: Keep components under 300 lines
2. **Cyclomatic Complexity**: Keep functions simple
3. **Test Coverage**: Aim for 80%+ on critical paths
4. **Bundle Size**: Monitor and optimize
5. **Performance**: Track render times and memory usage

---

## 📝 Development TODO & Future Work

### ✅ MVP Stack (Current)

#### Framework & Tools

- ✅ **Framework**: React Native
- ✅ **Language**: TypeScript
- ✅ **Development Toolset**: Expo (~54.0.25)
- ✅ **Version Control**: GitHub
- ✅ **Coding Help**: VS Code & Cursor
- ✅ **UI Components**: React Native Paper (Material Design 3)
- ✅ **Navigation**: React Navigation (Native Stack)
- ✅ **Web Support**: React Native Web

#### Completed Features

- ✅ Project initialization with Expo TypeScript template
- ✅ React Native Paper theme setup
- ✅ Navigation setup (React Navigation)
- ✅ Screen structure (Home, QuickGameSetup, Game)
- ✅ Design system architecture (centralized constants)
- ✅ Game setup (1v1/2v2, cup count selection, player entry)
- ✅ Visual beer pong table with clickable cup formations
- ✅ Real-time timer tracking
- ✅ Cup sink recording with player attribution
- ✅ Shot type tracking (Regular, Bounce, Grenade - grenade coming soon)
- ✅ Table rotation (180° rotation)
- ✅ Pause/Resume game functionality
- ✅ Undo functionality
- ✅ Bounce shot selection with mirrored cup layout
- ✅ Victory condition detection
- ✅ Redemption dialog with "Play on" or "Win" options
- ✅ Victory overlay with player name and Home button
- ✅ Event sourcing pattern with UUID-based event IDs
- ✅ Bounce shots linked via `bounceGroupId` for coordinated undo
- ✅ Soft-delete pattern (isUndone flag) for analytics
- ✅ Firebase/Firestore integration for match and event persistence
- ✅ Development-only Events dialog for inspecting raw event data

### 🔧 Recent Bug Fixes (2025-12-07)

#### Firebase Integration Fixes

1. **Multiple Match Creation Fix**
   - Added `matchInitializedRef` guard in `GameScreen.tsx` to prevent duplicate match creation
   - Prevents issues from React Strict Mode remounts or component lifecycle issues
   - Ensures only one match is created per game session

2. **bounceGroupId Undefined Error Fix**
   - Fixed Firestore errors caused by `undefined` values in `bounceGroupId` field
   - Modified `useCupManagement.ts` to conditionally include `bounceGroupId` only when defined
   - Updated `firestoreService.ts` to handle optional fields correctly
   - Regular shots no longer include `bounceGroupId` in the event object

### 🚀 Future State Implementation Plan

#### 1. Code Quality Improvements (High Priority)

- [ ] Add error handling and validation
  - [ ] React Error Boundaries
  - [ ] Try-catch for async operations
  - [ ] Input validation
  - [ ] Error states in UI
- [x] Break down GameScreen into smaller components
  - [x] Extract `CupFormation` component
  - [x] Extract `GameTable` component
  - [x] Extract dialog components (SinkDialog, BounceSelectionDialog, RedemptionDialog, VictoryDialog)
  - [x] Create custom hooks (`useGameTimer`, `useGameState`, `useCupManagement`)
- [ ] Set up testing infrastructure
  - [ ] Jest and React Native Testing Library
  - [ ] Unit tests for utilities
  - [ ] Component tests for critical paths
  - [ ] Integration tests for game flow

#### 2. Performance & Optimization (Medium Priority)

- [ ] Add performance optimizations
  - [ ] Use `useMemo` for cup position calculations
  - [ ] Use `useCallback` for event handlers
  - [ ] Consider `React.memo` for sub-components
- [ ] Optimize bundle size
- [ ] Add performance monitoring

#### 3. Backend Integration

- [ ] **Local Storage**

  - [ ] Integrate **AsyncStorage** for local, non-critical data
  - [ ] Implement data persistence for user preferences
  - [ ] Cache game history locally

- [x] **Database**

  - [x] Set up a new project in the **Firebase Console**
  - [x] Install Firebase packages (`firebase`)
  - [x] Integrate **Cloud Firestore** for data storage
  - [ ] Configure security rules for Firestore (pending authentication)
  - [x] Implement data models for matches and game events
  - [x] Persist game events to Firestore
  - [x] Match creation and completion tracking
  - [x] Event saving with deferred mechanism for race conditions
  - [x] Undo functionality integrated with Firestore

- [ ] **Authentication**

  - [ ] Install Firebase Authentication packages
  - [ ] Integrate **Firebase Authentication** for user sign-up/login
  - [ ] Implement authentication flows (email/password, social login if needed)
  - [ ] Add user profile management
  - [ ] Secure API endpoints with authentication

- [ ] **Analytics**

  - [ ] Set up **Google Analytics for Firebase**
  - [ ] Implement event logging to track key user actions
  - [ ] Define custom events for game completion, shot types, etc.
  - [ ] Set up user properties and user segments

- [ ] **Performance Monitoring**
  - [ ] Set up **Firebase Performance Monitoring**
  - [ ] Track app startup time
  - [ ] Monitor network request performance
  - [ ] Add custom performance traces for critical user flows

#### 4. Notifications

- [ ] Install and configure **expo-notifications** library
- [ ] Implement logic for requesting user permission
- [ ] Set up notification scheduling for game reminders
- [ ] Configure notification channels (Android) and categories (iOS)

#### 5. Build & Deployment

- [ ] Adopt **Expo Application Services (EAS) Build**
- [ ] Configure `eas.json` for different build profiles (development, staging, production)
- [ ] Set up EAS Build for creating native build artifacts (`.apk`, `.aab`, `.ipa`)
- [ ] Use **EAS Submit** for streamlined deployment to:
  - Apple App Store
  - Google Play Store
- [ ] Configure app signing certificates
- [ ] Set up CI/CD pipeline for automated builds

#### 6. Feature Enhancements

- [ ] **Tournament Mode**: Ability to organize a bracket and track progress
- [ ] **Stats Engine**:
  - [ ] _Efficiency_: How fast a player clears the rack
  - [ ] _Clutch Factor_: Performance on the final cup or "Rebuttals/Redemptions"
  - [ ] _Cup Isolation_: Which specific cups a player hits most often
- [ ] **User Profiles**: User profile creation to enable stats and tournaments
- [ ] **Grenade Feature**: Complete implementation of grenade shot tracking (currently disabled)
- [ ] **Accessibility Features**:
  - [ ] Add `accessibilityLabel` to interactive elements
  - [ ] Add `accessibilityRole` where appropriate
  - [ ] Test with screen readers
  - [ ] Ensure sufficient color contrast

#### 7. Code Organization (Low Priority)

- [ ] Create `src/hooks/` directory for custom hooks
- [ ] Create `src/components/game/` for game-specific components
- [ ] Organize by feature rather than by type
- [ ] Consider feature-based folder structure
- [ ] Refactor to useReducer for complex state

---

## 🎯 Quick Reference

### Current Status

- **MVP Features**: ✅ Complete
- **Code Refactoring**: ✅ Types, utilities, and constants extracted
- **Component Breakdown**: ✅ Complete (custom hooks and sub-components extracted)
- **Backend Integration**: ✅ Firebase/Firestore implemented
- **Error Handling**: ⏳ Pending
- **Testing**: ⏳ Pending

### Next Immediate Steps

1. Add error handling and validation
2. Set up testing infrastructure
3. Implement Firebase Authentication
4. Configure Firestore security rules

### Key Files

- `src/screens/GameScreen.tsx` - Main game screen (refactored with custom hooks)
- `src/hooks/` - Custom hooks (`useGameTimer`, `useGameState`, `useCupManagement`)
- `src/components/game/` - Game-specific components (dialogs, table, formations)
- `src/services/firestoreService.ts` - Firebase/Firestore integration
- `src/services/firebase.ts` - Firebase initialization
- `src/types/game.ts` - Game type definitions
- `src/utils/` - Utility functions
- `src/constants/gameConstants.ts` - Game constants
- `README.md` - Project documentation
- `FIREBASE_DATA_MODEL_ANALYSIS.md` - Firebase data model documentation

---

**Note**: This workbook should be updated as work progresses. Mark completed items with ✅ and update priorities as needed.
