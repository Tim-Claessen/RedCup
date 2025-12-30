# Test Registry

High-level test checklist for SINK releases. Complete this registry for each test run.

## Test Run Metadata

| Field | Value |
|-------|-------|
| **Run ID** | |
| **Tester** | |
| **Date** | |
| **Environment** | Development / Staging / Production |
| **App Version** | |
| **Build Number** | |
| **Notes** | |

---

## Test Completion Summary

| Category | Total | Passed | Failed | Blocked | Not Run |
|----------|-------|--------|--------|---------|---------|
| Authentication | 7 | | | | |
| Core Game Logic | 20 | | | | |
| Data Integrity | 16 | | | | |
| UI/UX | 16 | | | | |
| Performance | 5 | | | | |
| Error Handling | 7 | | | | |
| **TOTAL** | **71** | | | | |

---

## Automated Tests

| ID | Test Name | Reason/Risk | Platform | Type | Method | Criticality | Status |
|----|-----------|-------------|----------|------|--------|-------------|--------|
| **AUTHENTICATION** | | | | | | | |
| AUTO-AUTH-E2E-01 | Guest session creation | Speed-of-play: Users must start games immediately without account friction | Both | E2E | Automated | High | [ ] |
| AUTO-AUTH-UT-01 | Handle creation and validation | Analytics integrity: Handles must be unique for accurate player stats | Both | UT | Automated | High | [ ] |
| AUTO-AUTH-UT-02 | Handle uniqueness enforcement | Data integrity: Duplicate handles break player search and stats | Both | UT | Automated | High | [ ] |
| AUTO-AUTH-E2E-02 | Email sign-up flow | User acquisition: Account creation must work for authenticated users | Both | E2E | Automated | Med | [ ] |
| AUTO-AUTH-E2E-03 | Email sign-in flow | User retention: Returning users must access their stats | Both | E2E | Automated | Med | [ ] |
| AUTO-AUTH-IT-01 | AuthContext + userService handle creation | Data integrity: Handle creation must integrate with user service correctly | Both | IT | Automated | High | [ ] |
| AUTO-AUTH-IT-02 | AuthContext + userService handle retrieval | Data integrity: Handle retrieval must work with authentication state | Both | IT | Automated | Med | [ ] |
| **CORE GAME LOGIC** | | | | | | | |
| AUTO-GAME-E2E-01 | Regular shot recording | Speed-of-play: Core game mechanic must be fast and accurate | Both | E2E | Automated | High | [ ] |
| AUTO-GAME-UT-01 | Bounce shot grouping | Analytics integrity: Bounce shots must be grouped correctly for stats | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-02 | Grenade shot adjacency detection | Analytics integrity: Grenade must sink target + all touching cups correctly | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-03 | Victory detection (last cup) | Game flow: Must detect win condition correctly | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-04 | Victory detection (bounce on second-to-last) | Game rules: Bounce on second-to-last cup triggers victory | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-05 | Redemption flow - Play On (regular shot) | Game rules: Redemption must restore all cups from last shot | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-06 | Redemption flow - Play On (bounce shot) | Game rules: Bounce redemption restores only trigger cup, second stays sunk | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-07 | Redemption flow - Play On (grenade shot) | Game rules: Grenade redemption restores only target cup, touching cups stay sunk | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-08 | Redemption flow - Win | Analytics integrity: Redemption win must complete match with correct scores | Both | UT | Automated | High | [ ] |
| AUTO-GAME-UT-09 | Undo operation (regular shot) | Speed-of-play: Undo must be instant and restore correct state | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-10 | Undo operation (bounce shot) | Analytics integrity: Undo must mark both bounce events as undone | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-11 | Undo operation (grenade shot) | Analytics integrity: Undo must mark all grenade events as undone | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-12 | Re-rack functionality | Game flow: Re-rack must preserve sunk cups and rearrange remaining cups | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-13 | Surrender flow | Analytics integrity: Surrender must mark match as DNF with correct scores | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-14 | 1v1 automatic player selection | Speed-of-play: 1v1 games must auto-select player (no dialog delay) | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-UT-15 | 2v2 player selection | Analytics integrity: 2v2 must track individual player shots correctly | Both | UT | Automated | Med | [ ] |
| AUTO-GAME-IT-01 | useCupManagement + useGameState integration | Game flow: Cup state must sync correctly between hooks | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-02 | useCupManagement + Firestore event persistence | Analytics integrity: Events must persist to Firestore when matchId available | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-03 | SinkDialog + useCupManagement integration | Game flow: Shot recording must update cup state and events correctly | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-04 | RedemptionDialog + useCupManagement integration | Game flow: Redemption must restore cups and maintain event history | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-05 | GameScreen + useCupManagement + useGameState | Game flow: Full game flow must work with all hooks integrated | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-06 | VictoryDialog + Firestore match completion | Analytics integrity: Match completion must save to Firestore correctly | Both | IT | Automated | High | [ ] |
| AUTO-GAME-IT-07 | SurrenderDialog + Firestore DNF tracking | Analytics integrity: Surrender must mark match as DNF with correct scores | Both | IT | Automated | Med | [ ] |
| AUTO-GAME-IT-08 | useGameTimer + GameScreen integration | UX: Timer must pause/resume correctly with game screen state | Both | IT | Automated | Med | [ ] |
| **DATA INTEGRITY** | | | | | | | |
| AUTO-DATA-UT-01 | Match document creation | Analytics foundation: Match must be created in Firestore on game start | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-02 | Event persistence to made_shots | Analytics integrity: Every shot must be saved to Firestore | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-03 | Event ID uniqueness (UUID) | Data integrity: UUID prevents collisions and enables direct lookup | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-04 | Soft-delete pattern (isUndone) | Analytics integrity: Undone events must be marked, not deleted (preserves history) | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-05 | Bounce group ID linking | Analytics integrity: Bounce events must share bounceGroupId for coordinated undo | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-06 | Grenade group ID linking | Analytics integrity: Grenade events must share grenadeGroupId for coordinated undo | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-07 | Match completion with scores | Analytics integrity: Completed matches must have correct team scores | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-08 | User stats increment (overall) | Analytics integrity: User stats must increment correctly after match completion | Both | UT | Automated | High | [ ] |
| AUTO-DATA-UT-09 | User stats increment (by game type) | Analytics integrity: Stats must be tracked separately for 1v1 vs 2v2 | Both | UT | Automated | Med | [ ] |
| AUTO-DATA-UT-10 | User stats increment (by cup count) | Analytics integrity: Stats must be tracked separately for 6-cup vs 10-cup | Both | UT | Automated | Med | [ ] |
| AUTO-DATA-UT-11 | Partner stats tracking (2v2) | Analytics integrity: Partner-specific stats must be tracked in subcollection | Both | UT | Automated | Med | [ ] |
| AUTO-DATA-UT-12 | Guest player normalization | Analytics integrity: Guest players must be normalized to 'Guest' handle | Both | UT | Automated | Med | [ ] |
| AUTO-DATA-UT-13 | Offline event queuing | Data integrity: Events must be saved when connection restored | Both | UT | Automated | Med | [ ] |
| AUTO-DATA-IT-01 | useGameState + Firestore match creation | Analytics foundation: Match creation must integrate with game state hook | Both | IT | Automated | High | [ ] |
| AUTO-DATA-IT-02 | useCupManagement + Firestore event persistence flow | Analytics integrity: Event persistence must work with real Firestore connection | Both | IT | Automated | High | [ ] |
| AUTO-DATA-IT-03 | Undo operation + Firestore soft-delete | Analytics integrity: Undo must mark events as undone in Firestore | Both | IT | Automated | High | [ ] |
| **UI/UX** | | | | | | | |
| AUTO-UI-E2E-01 | Table rotation (180°) | UX: Rotation must switch team perspectives correctly | Both | E2E | Automated | Med | [ ] |
| AUTO-UI-UT-01 | Cup formation visual accuracy | UX: Cups must be positioned correctly in pyramid formation | Both | UT | Automated | Med | [ ] |
| AUTO-UI-IT-01 | SinkDialog responsiveness | Speed-of-play: Dialog must open instantly on cup tap | Both | IT | Automated | Med | [ ] |
| AUTO-UI-E2E-02 | Error snackbar display | UX: Errors must be shown with clear, user-friendly messages | Both | E2E | Automated | Med | [ ] |
| AUTO-UI-E2E-03 | Victory dialog display | UX: Victory dialog must show correct winning team | Both | E2E | Automated | Med | [ ] |
| AUTO-UI-UT-02 | Pause/Resume functionality | UX: Timer must pause/resume correctly | Both | UT | Automated | Med | [ ] |
| AUTO-UI-E2E-04 | Exit game confirmation | UX: Exit dialog must prevent accidental game loss | Both | E2E | Automated | Low | [ ] |
| AUTO-UI-IT-02 | QuickGameSetupScreen → GameScreen navigation | UX: Game setup parameters must pass correctly to game screen | Both | IT | Automated | High | [ ] |
| AUTO-UI-IT-03 | ErrorNotificationContext + component integration | UX: Error notifications must display correctly from components | Both | IT | Automated | Med | [ ] |
| AUTO-UI-IT-04 | BounceSelectionDialog + useCupManagement | Game flow: Bounce cup selection must record both cups correctly | Both | IT | Automated | High | [ ] |
| AUTO-UI-IT-05 | GameControlsMenu + useCupManagement undo | Game flow: Undo button must work with cup management hook | Both | IT | Automated | Med | [ ] |
| AUTO-UI-IT-06 | RerackDialog + useCupManagement | Game flow: Re-rack must update cup positions correctly | Both | IT | Automated | Med | [ ] |
| **PERFORMANCE** | | | | | | | |
| AUTO-PERF-IT-01 | SinkDialog latency | Speed-of-play: Dialog must open in <100ms after cup tap | Both | IT | Automated | High | [ ] |
| AUTO-PERF-E2E-01 | Timer persistence (background) | UX: Timer must continue when app goes to background | Both | E2E | Automated | Med | [ ] |
| AUTO-PERF-E2E-02 | Timer persistence (app resume) | UX: Timer must resume correctly when app returns to foreground | Both | E2E | Automated | Med | [ ] |
| AUTO-PERF-IT-02 | Firestore write latency | Analytics integrity: Events must save without blocking UI | Both | IT | Automated | Med | [ ] |
| AUTO-PERF-IT-03 | Match initialization latency | Speed-of-play: Game must start in <2s after setup | Both | IT | Automated | Med | [ ] |
| **ERROR HANDLING** | | | | | | | |
| AUTO-ERROR-E2E-01 | Offline mode graceful degradation | UX: Game must continue when offline, save when online | Both | E2E | Automated | High | [ ] |
| AUTO-ERROR-UT-01 | Firestore initialization failure | UX: App must handle missing Firebase config gracefully | Both | UT | Automated | Med | [ ] |
| AUTO-ERROR-UT-02 | Network timeout handling | UX: Network errors must show user-friendly messages | Both | UT | Automated | Med | [ ] |
| AUTO-ERROR-UT-03 | Error boundary crash prevention | UX: Component crashes must not crash entire app | Both | UT | Automated | High | [ ] |
| AUTO-ERROR-UT-04 | Invalid handle format validation | Data integrity: Invalid handles must be rejected with clear error | Both | UT | Automated | Med | [ ] |
| AUTO-ERROR-IT-01 | ErrorNotificationContext + Firestore error handling | UX: Firestore errors must display user-friendly messages via context | Both | IT | Automated | Med | [ ] |
| AUTO-ERROR-IT-02 | GameScreen + ErrorNotificationContext integration | UX: Game screen errors must be handled gracefully with notifications | Both | IT | Automated | Med | [ ] |

---

## Manual Tests

| ID | Test Name | Reason/Risk | Platform | Type | Method | Automation Built | Criticality | Status |
|----|-----------|-------------|----------|------|--------|------------------|-------------|--------|
| **UI/UX** | | | | | | | | |
| MAN-UI-MAN-01 | Timer tabular number alignment (iOS) | UX: Timer must use tabular numbers for perfect alignment (iOS-specific) | iOS | MAN | Manual | No | Low | [ ] |
| MAN-UI-MAN-02 | Timer shadow/glow effects (iOS) | UX: Timer must have proper shadow effects on iOS | iOS | MAN | Manual | No | Low | [ ] |
| MAN-UI-MAN-03 | Android elevation for timer card | UX: Timer card must have proper elevation on Android | Android | MAN | Manual | No | Low | [ ] |

---

## Notes

- **Criticality**: High = Blocks release, Med = Should fix before release, Low = Nice to have
- **Type**:
  - **UT** = Unit Test (tested with unit/integration tests, mocked dependencies)
  - **IT** = Integration Test (tested with integration tests, real dependencies)
  - **E2E** = End-to-End Test (tested with E2E framework like Detox/Maestro)
  - **MAN** = Manual Test (requires human interaction for visual verification, device-specific behavior)
- **Method**:
  - **Automated** = Can be fully automated
  - **Manual** = Requires human interaction
- **Automation Built**: Indicates whether automation has been built for manual tests (Yes/No/In Progress)
- **Platform**: Both = Test on both iOS and Android, specific platform = Test only on that platform
- All tests must verify Firestore state via `made_shots` collection for data integrity tests
- **Test Framework**: Recommended setup: Jest (unit), React Native Testing Library (component), Detox/Maestro (E2E)
- **ID Format**:
  - Automated tests: `AUTO-{STAGE}-{TYPE}-{NUM}` (e.g., AUTO-AUTH-UT-01, AUTO-GAME-E2E-01)
  - Manual tests: `MAN-{STAGE}-{TYPE}-{NUM}` (e.g., MAN-UI-MAN-01)
