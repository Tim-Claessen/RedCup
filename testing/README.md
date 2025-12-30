# Testing Documentation

Testing infrastructure and documentation for the SINK application.

## Files

- **`TEST_REGISTRY.md`** - High-level test checklist for releases. Complete this registry for each test run.
- **`results/`** - Directory containing timestamped copies of TEST_REGISTRY.md from each test run (created automatically by test runner).

---

## Quick Start

```bash
npm test              # Run all Jest tests
npm run test:watch    # Watch mode
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e      # Maestro E2E tests
npm run test:coverage # Coverage report
```

## Test Structure

- **Unit Tests** (`src/__tests__/unit/`) - Isolated functions/utilities with mocked dependencies
- **Integration Tests** (`src/__tests__/integration/`) - Hook-service interactions with mocked external services
- **E2E Tests** (`.maestro/`) - Complete user flows on real devices/simulators

## CI/CD

Tests run automatically on push/PR to `main` or `develop`. The test runner (`scripts/test-runner.js`) creates timestamped copies of `TEST_REGISTRY.md` in `testing/results/` for tracking.

## Configuration

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup and mocks
- `.maestro/config.yaml` - Maestro configuration
- `.github/workflows/test.yml` - GitHub Actions workflow

## Test Mocks

- `src/__mocks__/firebase.ts` - Firebase/Firestore mocks
- `src/__tests__/utils/__mocks__/testHelpers.ts` - Test helper utilities

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

