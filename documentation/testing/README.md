# Testing Documentation

Testing infrastructure and documentation for the SINK application.

## Files

- **`TEST_REGISTRY.md`** - High-level test checklist for releases. Complete this registry for each test run.
- **`results/`** - Directory containing timestamped copies of TEST_REGISTRY.md from each test run (created automatically by test runner).

---

## Quick Start

### Test Registry Runner

The test registry runner parses `TEST_REGISTRY.md`, runs all Jest tests, and creates timestamped result files.

```bash
# Run all tests and update registry
npm run test:registry
```

The test runner will:
- Parse TEST_REGISTRY.md to identify all automated tests
- Run all Jest tests matching those test IDs
- Create a timestamped copy of TEST_REGISTRY in `results/` with results
- Exit with appropriate status code (0 for pass, 1 for fail)

### All Jest Tests

```bash
npm test              # Run all Jest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ci       # CI-optimized test run
```

## Test Structure

```
__tests__/
├── __mocks__/              # Mock implementations (Firebase, AsyncStorage, etc.)
├── unit/                   # Unit tests (isolated components, hooks, services)
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── components/
├── integration/            # Integration tests (components working together)
│   ├── hooks/
│   ├── screens/
│   └── services/
└── utils/                  # Test utilities and helpers
```

- **Unit Tests** (`__tests__/unit/`) - Isolated functions/utilities with mocked dependencies
- **Integration Tests** (`__tests__/integration/`) - Hook-service interactions with mocked external services
- **E2E Tests** (`.maestro/`) - Complete user flows on real devices/simulators

## CI/CD

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual trigger via workflow_dispatch

The workflow (`.github/workflows/test.yml`) will:
1. Run all tests
2. Create timestamped test result files in `documentation/testing/results/`
3. Upload results as artifacts
4. Comment on PRs with test summary

### Manual Local Execution

You can run tests locally:

```bash
# Set environment variables (optional)
export RUN_ID="local-run-$(date +%s)"
export TESTER="Your Name"
export ENVIRONMENT="Development"
export APP_VERSION="1.0.0"
export BUILD_NUMBER="local"

# Run all tests
npm run test:registry
```

Results will be saved to `documentation/testing/results/TEST_REGISTRY_{timestamp}.md`

## Configuration

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and mocks
- `scripts/test-runner.js` - Unified test runner (parses TEST_REGISTRY, runs Jest, updates results)
- `.github/workflows/test.yml` - GitHub Actions workflow for automated testing

## Test Mocks

- **Firebase** (`__tests__/__mocks__/firebase.ts`) - Firestore operations, Firebase Auth, Firebase App initialization
- **AsyncStorage** - Automatically mocked in `jest.setup.js` (simple mock if package not installed)
- **Test Helpers** (`__tests__/utils/testHelpers.ts`) - Test utility functions

## Writing Tests

### Unit Test Example

```typescript
import { renderHook } from '@testing-library/react-native';
import { useGameState } from '../../../src/hooks/useGameState';

describe('useGameState', () => {
  it('should initialize with correct cup count', () => {
    const { result } = renderHook(() => useGameState({ cupCount: 6 }));
    expect(result.current.team1Cups).toHaveLength(6);
  });
});
```

### Integration Test Example

```typescript
import { renderHook } from '@testing-library/react-native';
import { useCupManagement } from '../../../src/hooks/useCupManagement';
import { useGameState } from '../../../src/hooks/useGameState';

describe('Hook Integration', () => {
  it('should sync state between hooks', () => {
    const { result: gameState } = renderHook(() => useGameState({ cupCount: 6 }));
    // Test integration...
  });
});
```

### Test ID Format

Include TEST_REGISTRY IDs in test files for tracking:

```typescript
/**
 * AUTO-DATA-UT-01: Match document creation
 */
describe('AUTO-DATA-UT-01: Match document creation', () => {
  it('should create match document with correct structure', () => {
    // test code
  });
});
```

## Troubleshooting

- **Tests not running**: Ensure Jest is installed, check `jest.config.js` exists, verify test files match pattern `**/*.test.{ts,tsx}`
- **Firebase mocks not working**: Check `__tests__/__mocks__/firebase.ts` exists, verify mocks are imported before tests
- **AsyncStorage errors**: Mock is automatically created in `jest.setup.js` if package not installed

---

## Manual Test Specifications

The following tests require human interaction for visual verification or device-specific behavior.

### MAN-UI-MAN-01: Timer Tabular Number Alignment (iOS)

**Objective**: Verify timer uses tabular numbers for perfect alignment on iOS.

**Steps**:
1. Launch app on iOS
2. Start a game
3. Observe timer display
4. Wait for timer to reach double-digit minutes (e.g., 10:00)
5. Observe number alignment during transitions

**Expected Result**: Timer numbers use tabular (monospaced) font with perfect alignment, no visual "jumping" during digit changes.

**Platform**: iOS-specific

---

### MAN-UI-MAN-02: Timer Shadow/Glow Effects (iOS)

**Objective**: Verify timer has proper shadow effects on iOS for visual depth.

**Steps**:
1. Launch app on iOS
2. Start a game
3. Observe the timer card/display
4. Check shadow effects

**Expected Result**: Timer card has visible shadow/glow effect providing visual depth, consistent with iOS design guidelines.

**Platform**: iOS-specific

---

### MAN-UI-MAN-03: Android Elevation for Timer Card

**Objective**: Verify timer card has proper elevation on Android.

**Steps**:
1. Launch app on Android
2. Start a game
3. Observe the timer card/display
4. Check elevation effect

**Expected Result**: Timer card has proper Material Design elevation, appears elevated above background.

**Platform**: Android-specific

---

### MAN-UI-MAN-04: SinkDialog Responsiveness

**Objective**: Verify SinkDialog opens instantly on cup tap for speed-of-play.

**Steps**:
1. Start a game
2. Tap on an unsunk cup
3. Observe dialog appearance time
4. Repeat with multiple cups
5. Test on both iOS and Android

**Expected Result**: Dialog opens immediately (<100ms) after cup tap with no visible delay or lag.

**Platform**: Both platforms

---

## Test Execution Notes

- **Visual Verification**: Use real devices when possible, compare against design specs
- **Performance**: For MAN-UI-MAN-04, use device performance monitoring if available
- **Platform-Specific**: iOS tests must run on iOS, Android tests on Android
- **Reporting**: Document issues, note device/OS version, update TEST_REGISTRY.md with results

