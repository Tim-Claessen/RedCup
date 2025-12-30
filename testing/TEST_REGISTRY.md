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
| Authentication | 5 | | | | |
| Core Game Logic | 12 | | | | |
| Data Integrity | 13 | | | | |
| UI/UX | 10 | | | | |
| Performance | 5 | | | | |
| Error Handling | 5 | | | | |
| **TOTAL** | **50** | | | | |

---

## Test Cases

| ID | Test Name | Reason/Risk | Platform | Type | Criticality | Status |
|----|-----------|-------------|----------|------|-------------|--------|
| **AUTHENTICATION** | | | | | | |
| AUTH-01 | Guest session creation | Speed-of-play: Users must start games immediately without account friction | Both | Automated (E2E) | High | [ ] |
| AUTH-02 | Handle creation and validation | Analytics integrity: Handles must be unique for accurate player stats | Both | Automated (Unit) | High | [ ] |
| AUTH-03 | Handle uniqueness enforcement | Data integrity: Duplicate handles break player search and stats | Both | Automated (Unit) | High | [ ] |
| AUTH-04 | Email sign-up flow | User acquisition: Account creation must work for authenticated users | Both | Automated (E2E) | Med | [ ] |
| AUTH-05 | Email sign-in flow | User retention: Returning users must access their stats | Both | Automated (E2E) | Med | [ ] |
| **CORE GAME LOGIC** | | | | | | |
| GAME-01 | Regular shot recording | Speed-of-play: Core game mechanic must be fast and accurate | Both | Automated (E2E) | High | [ ] |
| GAME-02 | Bounce shot grouping | Analytics integrity: Bounce shots must be grouped correctly for stats | Both | Automated (Unit) | High | [ ] |
| GAME-03 | Grenade shot adjacency detection | Analytics integrity: Grenade must sink target + all touching cups correctly | Both | Automated (Unit) | High | [ ] |
| GAME-04 | Victory detection (last cup) | Game flow: Must detect win condition correctly | Both | Automated (Unit) | High | [ ] |
| GAME-05 | Victory detection (bounce on second-to-last) | Game rules: Bounce on second-to-last cup triggers victory | Both | Automated (Unit) | High | [ ] |
| GAME-06 | Redemption flow - Play On (regular shot) | Game rules: Redemption must restore all cups from last shot | Both | Automated (Unit) | High | [ ] |
| GAME-07 | Redemption flow - Play On (bounce shot) | Game rules: Bounce redemption restores only trigger cup, second stays sunk | Both | Automated (Unit) | High | [ ] |
| GAME-08 | Redemption flow - Play On (grenade shot) | Game rules: Grenade redemption restores only target cup, touching cups stay sunk | Both | Automated (Unit) | High | [ ] |
| GAME-09 | Redemption flow - Win | Analytics integrity: Redemption win must complete match with correct scores | Both | Automated (Unit) | High | [ ] |
| GAME-10 | Undo operation (regular shot) | Speed-of-play: Undo must be instant and restore correct state | Both | Automated (Unit) | Med | [ ] |
| GAME-11 | Undo operation (bounce shot) | Analytics integrity: Undo must mark both bounce events as undone | Both | Automated (Unit) | Med | [ ] |
| GAME-12 | Undo operation (grenade shot) | Analytics integrity: Undo must mark all grenade events as undone | Both | Automated (Unit) | Med | [ ] |
| GAME-13 | Re-rack functionality | Game flow: Re-rack must preserve sunk cups and rearrange remaining cups | Both | Automated (Unit) | Med | [ ] |
| GAME-14 | Surrender flow | Analytics integrity: Surrender must mark match as DNF with correct scores | Both | Automated (Unit) | Med | [ ] |
| GAME-15 | 1v1 automatic player selection | Speed-of-play: 1v1 games must auto-select player (no dialog delay) | Both | Automated (Unit) | Med | [ ] |
| GAME-16 | 2v2 player selection | Analytics integrity: 2v2 must track individual player shots correctly | Both | Automated (Unit) | Med | [ ] |
| **DATA INTEGRITY** | | | | | | |
| DATA-01 | Match document creation | Analytics foundation: Match must be created in Firestore on game start | Both | Automated (Unit) | High | [ ] |
| DATA-02 | Event persistence to made_shots | Analytics integrity: Every shot must be saved to Firestore | Both | Automated (Unit) | High | [ ] |
| DATA-03 | Event ID uniqueness (UUID) | Data integrity: UUID prevents collisions and enables direct lookup | Both | Automated (Unit) | High | [ ] |
| DATA-04 | Soft-delete pattern (isUndone) | Analytics integrity: Undone events must be marked, not deleted (preserves history) | Both | Automated (Unit) | High | [ ] |
| DATA-05 | Bounce group ID linking | Analytics integrity: Bounce events must share bounceGroupId for coordinated undo | Both | Automated (Unit) | High | [ ] |
| DATA-06 | Grenade group ID linking | Analytics integrity: Grenade events must share grenadeGroupId for coordinated undo | Both | Automated (Unit) | High | [ ] |
| DATA-07 | Match completion with scores | Analytics integrity: Completed matches must have correct team scores | Both | Automated (Unit) | High | [ ] |
| DATA-08 | User stats increment (overall) | Analytics integrity: User stats must increment correctly after match completion | Both | Automated (Unit) | High | [ ] |
| DATA-09 | User stats increment (by game type) | Analytics integrity: Stats must be tracked separately for 1v1 vs 2v2 | Both | Automated (Unit) | Med | [ ] |
| DATA-10 | User stats increment (by cup count) | Analytics integrity: Stats must be tracked separately for 6-cup vs 10-cup | Both | Automated (Unit) | Med | [ ] |
| DATA-11 | Partner stats tracking (2v2) | Analytics integrity: Partner-specific stats must be tracked in subcollection | Both | Automated (Unit) | Med | [ ] |
| DATA-12 | Guest player normalization | Analytics integrity: Guest players must be normalized to 'Guest' handle | Both | Automated (Unit) | Med | [ ] |
| DATA-13 | Offline event queuing | Data integrity: Events must be saved when connection restored | Both | Automated (Unit) | Med | [ ] |
| **UI/UX** | | | | | | |
| UI-01 | Table rotation (180°) | UX: Rotation must switch team perspectives correctly | Both | Automated (E2E) | Med | [ ] |
| UI-02 | Timer tabular number alignment (iOS) | UX: Timer must use tabular numbers for perfect alignment (iOS-specific) | iOS | Manual | Low | [ ] |
| UI-03 | Timer shadow/glow effects (iOS) | UX: Timer must have proper shadow effects on iOS | iOS | Manual | Low | [ ] |
| UI-04 | Android elevation for timer card | UX: Timer card must have proper elevation on Android | Android | Manual | Low | [ ] |
| UI-05 | Cup formation visual accuracy | UX: Cups must be positioned correctly in pyramid formation | Both | Automated (Unit) | Med | [ ] |
| UI-06 | SinkDialog responsiveness | Speed-of-play: Dialog must open instantly on cup tap | Both | Automated | Med | [ ] |
| UI-07 | Error snackbar display | UX: Errors must be shown with clear, user-friendly messages | Both | Automated (E2E) | Med | [ ] |
| UI-08 | Victory dialog display | UX: Victory dialog must show correct winning team | Both | Automated (E2E) | Med | [ ] |
| UI-09 | Pause/Resume functionality | UX: Timer must pause/resume correctly | Both | Automated (Unit) | Med | [ ] |
| UI-10 | Exit game confirmation | UX: Exit dialog must prevent accidental game loss | Both | Automated (E2E) | Low | [ ] |
| **PERFORMANCE** | | | | | | |
| PERF-01 | SinkDialog latency | Speed-of-play: Dialog must open in <100ms after cup tap | Both | Automated | High | [ ] |
| PERF-02 | Timer persistence (background) | UX: Timer must continue when app goes to background | Both | Automated (E2E) | Med | [ ] |
| PERF-03 | Timer persistence (app resume) | UX: Timer must resume correctly when app returns to foreground | Both | Automated (E2E) | Med | [ ] |
| PERF-04 | Firestore write latency | Analytics integrity: Events must save without blocking UI | Both | Automated | Med | [ ] |
| PERF-05 | Match initialization latency | Speed-of-play: Game must start in <2s after setup | Both | Automated | Med | [ ] |
| **ERROR HANDLING** | | | | | | |
| ERROR-01 | Offline mode graceful degradation | UX: Game must continue when offline, save when online | Both | Automated (E2E) | High | [ ] |
| ERROR-02 | Firestore initialization failure | UX: App must handle missing Firebase config gracefully | Both | Automated (Unit) | Med | [ ] |
| ERROR-03 | Network timeout handling | UX: Network errors must show user-friendly messages | Both | Automated (Unit) | Med | [ ] |
| ERROR-04 | Error boundary crash prevention | UX: Component crashes must not crash entire app | Both | Automated (Unit) | High | [ ] |
| ERROR-05 | Invalid handle format validation | Data integrity: Invalid handles must be rejected with clear error | Both | Automated (Unit) | Med | [ ] |

## Notes

- **Criticality**: High = Blocks release, Med = Should fix before release, Low = Nice to have
- **Type**: 
  - **Manual** = Requires human interaction (visual verification, device-specific behavior)
  - **Automated (Unit)** = Can be tested with unit/integration tests (mocked dependencies)
  - **Automated (E2E)** = Can be tested with E2E framework (Detox/Maestro)
  - **Automated** = Can be fully automated (performance, logic tests)
- **Platform**: Both = Test on both iOS and Android, specific platform = Test only on that platform
- All tests must verify Firestore state via `made_shots` collection for data integrity tests
- **Test Framework**: Recommended setup: Jest (unit), React Native Testing Library (component), Detox/Maestro (E2E)

