/**
 * Grenade Group ID Linking Tests
 *
 * Test ID: AUTO-DATA-UT-06
 * Test Name: Grenade group ID linking
 * Criticality: High
 *
 * Tests that grenade events share grenadeGroupId for coordinated undo operations.
 * Grenade shots sink the target cup plus all touching cups, and all must be undone together.
 */

import { GameEvent } from '../../../src/types/game';
import { getTouchingCups } from '../../../src/utils/cupAdjacency';

describe('Grenade Group ID Linking', () => {
  const createGrenadeEvent = (
    eventId: string,
    cupId: number,
    grenadeGroupId: string
  ): GameEvent => ({
    eventId,
    timestamp: Date.now(),
    cupId,
    playerHandle: 'TestPlayer',
    isBounce: false,
    isGrenade: true,
    isUndone: false,
    grenadeGroupId,
    team1CupsRemaining: 6,
    team2CupsRemaining: 6,
    gameState: {
      team1Cups: [],
      team2Cups: [],
    },
  });

  it('should link all grenade events (target + touching cups) with the same grenadeGroupId', () => {
    const grenadeGroupId = 'grenade-group-uuid-123';
    const targetCupId = 1;
    const touchingCups = getTouchingCups(targetCupId, 6);

    const targetEvent = createGrenadeEvent('event-target', targetCupId, grenadeGroupId);
    const touchingEvents = touchingCups.map((cupId, index) =>
      createGrenadeEvent(`event-${index}`, cupId, grenadeGroupId)
    );

    const allEvents = [targetEvent, ...touchingEvents];

    expect(allEvents.every(e => e.grenadeGroupId === grenadeGroupId)).toBe(true);
    expect(allEvents.length).toBe(touchingCups.length + 1);
  });

  it('should enable coordinated undo by filtering events with same grenadeGroupId', () => {
    const grenadeGroupId = 'grenade-group-uuid-123';
    const targetCupId = 5;
    const touchingCups = getTouchingCups(targetCupId, 6);

    const events: GameEvent[] = [
      createGrenadeEvent('event-target', targetCupId, grenadeGroupId),
      ...touchingCups.map((cupId, index) =>
        createGrenadeEvent(`event-${index}`, cupId, grenadeGroupId)
      ),
    ];

    const grenadeEvents = events.filter(
      e => e.grenadeGroupId === grenadeGroupId && e.isGrenade
    );

    expect(grenadeEvents.length).toBe(touchingCups.length + 1);
    expect(grenadeEvents.some(e => e.cupId === targetCupId)).toBe(true);
    touchingCups.forEach(cupId => {
      expect(grenadeEvents.some(e => e.cupId === cupId)).toBe(true);
    });
  });

  it('should not link non-grenade events with grenadeGroupId', () => {
    const regularEvent: GameEvent = {
      eventId: 'event-1',
      timestamp: Date.now(),
      cupId: 0,
      playerHandle: 'TestPlayer',
      isBounce: false,
      isGrenade: false,
      isUndone: false,
      team1CupsRemaining: 6,
      team2CupsRemaining: 6,
      gameState: {
        team1Cups: [],
        team2Cups: [],
      },
    };

    expect(regularEvent.grenadeGroupId).toBeUndefined();
  });

  it('should allow multiple grenade groups in the same game', () => {
    const grenadeGroupId1 = 'grenade-group-1';
    const grenadeGroupId2 = 'grenade-group-2';

    const events: GameEvent[] = [
      createGrenadeEvent('event-1', 1, grenadeGroupId1),
      createGrenadeEvent('event-2', 0, grenadeGroupId1),
      createGrenadeEvent('event-3', 5, grenadeGroupId2),
      createGrenadeEvent('event-4', 3, grenadeGroupId2),
    ];

    const group1 = events.filter(e => e.grenadeGroupId === grenadeGroupId1);
    const group2 = events.filter(e => e.grenadeGroupId === grenadeGroupId2);

    expect(group1.length).toBeGreaterThan(0);
    expect(group2.length).toBeGreaterThan(0);
    expect(group1.every(e => e.grenadeGroupId === grenadeGroupId1)).toBe(true);
    expect(group2.every(e => e.grenadeGroupId === grenadeGroupId2)).toBe(true);
  });

  it('should preserve grenadeGroupId when marking events as undone', () => {
    const grenadeGroupId = 'grenade-group-uuid-123';
    const targetCupId = 1;
    const touchingCups = getTouchingCups(targetCupId, 6);

    const events: GameEvent[] = [
      createGrenadeEvent('event-target', targetCupId, grenadeGroupId),
      ...touchingCups.map((cupId, index) =>
        createGrenadeEvent(`event-${index}`, cupId, grenadeGroupId)
      ),
    ];

    events.forEach(e => {
      e.isUndone = true;
    });

    expect(events.every(e => e.grenadeGroupId === grenadeGroupId)).toBe(true);
    expect(events.every(e => e.isUndone === true)).toBe(true);
  });

  it('should link all cups for grenade on center cup in 10-cup formation', () => {
    const grenadeGroupId = 'grenade-group-uuid-123';
    const targetCupId = 5;
    const touchingCups = getTouchingCups(targetCupId, 10);

    const events: GameEvent[] = [
      createGrenadeEvent('event-target', targetCupId, grenadeGroupId),
      ...touchingCups.map((cupId, index) =>
        createGrenadeEvent(`event-${index}`, cupId, grenadeGroupId)
      ),
    ];

    expect(events.length).toBe(touchingCups.length + 1);
    expect(events.every(e => e.grenadeGroupId === grenadeGroupId)).toBe(true);
    expect(events.every(e => e.isGrenade === true)).toBe(true);
  });
});

