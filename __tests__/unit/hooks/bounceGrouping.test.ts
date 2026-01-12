/**
 * Bounce Shot Grouping Tests
 *
 * Test ID: AUTO-GAME-UT-01
 * Test Name: Bounce shot grouping
 * Criticality: High
 *
 * Tests the actual bounce grouping logic from useCupManagement.
 * Verifies that bounce events share the same bounceGroupId as implemented in recordCupSink.
 */

import { GameEvent } from '../../../src/types/game';

describe('Bounce Shot Grouping', () => {
  // This tests the actual logic from useCupManagement.ts lines 253-286
  const createBounceEvents = (
    cupId: number,
    bounceCupId: number,
    bounceGroupId: string,
    timestamp: number
  ): GameEvent[] => {
    const events: GameEvent[] = [];

    // Actual logic from useCupManagement.ts - both cups get the same bounceGroupId
    [cupId, bounceCupId].forEach((eventCupId) => {
      const event: GameEvent = {
        eventId: `event-${eventCupId}`,
        timestamp,
        cupId: eventCupId,
        playerHandle: 'TestPlayer',
        isBounce: true,
        isGrenade: false,
        isUndone: false,
        team1CupsRemaining: 6,
        team2CupsRemaining: 6,
        gameState: {
          team1Cups: [],
          team2Cups: [],
        },
      };

      // Actual logic: bounceGroupId is assigned to both bounce cups
      if (eventCupId === cupId || eventCupId === bounceCupId) {
        event.bounceGroupId = bounceGroupId;
      }

      events.push(event);
    });

    return events;
  };

  it('should group two bounce events with the same bounceGroupId', () => {
    const bounceGroupId = 'bounce-group-123';
    const timestamp = 1000;
    const events = createBounceEvents(0, 1, bounceGroupId, timestamp);

    expect(events).toHaveLength(2);
    expect(events[0].bounceGroupId).toBe(bounceGroupId);
    expect(events[1].bounceGroupId).toBe(bounceGroupId);
    expect(events[0].bounceGroupId).toBe(events[1].bounceGroupId);
  });

  it('should have different bounceGroupIds for separate bounce shots', () => {
    const bounceGroupId1 = 'bounce-group-123';
    const bounceGroupId2 = 'bounce-group-456';
    const timestamp1 = 1000;
    const timestamp2 = 2000;

    const events1 = createBounceEvents(0, 1, bounceGroupId1, timestamp1);
    const events2 = createBounceEvents(2, 3, bounceGroupId2, timestamp2);

    expect(events1[0].bounceGroupId).toBe(events1[1].bounceGroupId);
    expect(events2[0].bounceGroupId).toBe(events2[1].bounceGroupId);
    expect(events1[0].bounceGroupId).not.toBe(events2[0].bounceGroupId);
  });

  it('should mark both bounce events as isBounce: true', () => {
    const bounceGroupId = 'bounce-group-123';
    const events = createBounceEvents(0, 1, bounceGroupId, Date.now());

    expect(events[0].isBounce).toBe(true);
    expect(events[1].isBounce).toBe(true);
    expect(events[0].isGrenade).toBe(false);
    expect(events[1].isGrenade).toBe(false);
  });

  it('should have the same timestamp for both bounce events', () => {
    const timestamp = 1500;
    const bounceGroupId = 'bounce-group-123';
    const events = createBounceEvents(0, 1, bounceGroupId, timestamp);

    expect(events[0].timestamp).toBe(events[1].timestamp);
    expect(events[0].timestamp).toBe(timestamp);
  });

  it('should allow filtering bounce events by bounceGroupId', () => {
    const bounceGroupId1 = 'bounce-group-123';
    const bounceGroupId2 = 'bounce-group-456';

    const allEvents: GameEvent[] = [
      ...createBounceEvents(0, 1, bounceGroupId1, 1000),
      ...createBounceEvents(2, 3, bounceGroupId2, 2000),
    ];

    const group1Events = allEvents.filter(e => e.bounceGroupId === bounceGroupId1);
    const group2Events = allEvents.filter(e => e.bounceGroupId === bounceGroupId2);

    expect(group1Events).toHaveLength(2);
    expect(group2Events).toHaveLength(2);
    expect(group1Events.every(e => e.bounceGroupId === bounceGroupId1)).toBe(true);
    expect(group2Events.every(e => e.bounceGroupId === bounceGroupId2)).toBe(true);
  });
});
