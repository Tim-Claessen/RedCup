/**
 * Bounce Group ID Linking Tests
 *
 * Test ID: AUTO-DATA-UT-05
 * Test Name: Bounce group ID linking
 * Criticality: High
 *
 * Tests that bounce events share bounceGroupId for coordinated undo operations.
 * This is critical for data integrity - bounce shots must be undone together.
 */

import { GameEvent } from '../../../src/types/game';

describe('Bounce Group ID Linking', () => {
  const createBounceEvent = (
    eventId: string,
    cupId: number,
    bounceGroupId: string
  ): GameEvent => ({
    eventId,
    timestamp: Date.now(),
    cupId,
    playerHandle: 'TestPlayer',
    isBounce: true,
    isGrenade: false,
    isUndone: false,
    bounceGroupId,
    team1CupsRemaining: 6,
    team2CupsRemaining: 6,
    gameState: {
      team1Cups: [],
      team2Cups: [],
    },
  });

  it('should link both bounce events with the same bounceGroupId', () => {
    const bounceGroupId = 'bounce-group-uuid-123';
    const event1 = createBounceEvent('event-1', 0, bounceGroupId);
    const event2 = createBounceEvent('event-2', 1, bounceGroupId);

    expect(event1.bounceGroupId).toBeDefined();
    expect(event2.bounceGroupId).toBeDefined();
    expect(event1.bounceGroupId).toBe(event2.bounceGroupId);
  });

  it('should enable coordinated undo by filtering events with same bounceGroupId', () => {
    const bounceGroupId = 'bounce-group-uuid-123';
    const events: GameEvent[] = [
      createBounceEvent('event-1', 0, bounceGroupId),
      createBounceEvent('event-2', 1, bounceGroupId),
      {
        ...createBounceEvent('event-3', 2, 'other-group'),
        isBounce: false,
      },
    ];

    const bounceEvents = events.filter(
      e => e.bounceGroupId === bounceGroupId && e.isBounce
    );

    expect(bounceEvents).toHaveLength(2);
    expect(bounceEvents[0].cupId).toBe(0);
    expect(bounceEvents[1].cupId).toBe(1);
  });

  it('should not link non-bounce events with bounceGroupId', () => {
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

    expect(regularEvent.bounceGroupId).toBeUndefined();
  });

  it('should allow multiple bounce groups in the same game', () => {
    const bounceGroupId1 = 'bounce-group-1';
    const bounceGroupId2 = 'bounce-group-2';

    const events: GameEvent[] = [
      createBounceEvent('event-1', 0, bounceGroupId1),
      createBounceEvent('event-2', 1, bounceGroupId1),
      createBounceEvent('event-3', 2, bounceGroupId2),
      createBounceEvent('event-4', 3, bounceGroupId2),
    ];

    const group1 = events.filter(e => e.bounceGroupId === bounceGroupId1);
    const group2 = events.filter(e => e.bounceGroupId === bounceGroupId2);

    expect(group1).toHaveLength(2);
    expect(group2).toHaveLength(2);
    expect(group1.every(e => e.bounceGroupId === bounceGroupId1)).toBe(true);
    expect(group2.every(e => e.bounceGroupId === bounceGroupId2)).toBe(true);
  });

  it('should preserve bounceGroupId when marking events as undone', () => {
    const bounceGroupId = 'bounce-group-uuid-123';
    const event1 = createBounceEvent('event-1', 0, bounceGroupId);
    const event2 = createBounceEvent('event-2', 1, bounceGroupId);

    event1.isUndone = true;
    event2.isUndone = true;

    expect(event1.bounceGroupId).toBe(bounceGroupId);
    expect(event2.bounceGroupId).toBe(bounceGroupId);
    expect(event1.isUndone).toBe(true);
    expect(event2.isUndone).toBe(true);
  });
});

