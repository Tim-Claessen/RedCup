/**
 * Cup Adjacency Tests
 *
 * Test ID: AUTO-GAME-UT-02
 * Test Name: Grenade shot adjacency detection
 * Criticality: High
 *
 * Tests the getTouchingCups function which determines which cups are
 * touching (adjacent) in the pyramid formation. This is critical for
 * grenade shots which sink the target cup plus all touching cups.
 */

import { getTouchingCups } from '../../../src/utils/cupAdjacency';

describe('Grenade Shot Adjacency Detection', () => {

  describe('6-Cup Formation', () => {
    it('should return correct adjacent cups for cup 0 (top-left)', () => {
      const touching = getTouchingCups(0, 6);
      expect(touching).toHaveLength(2);
      expect(touching).toContain(1);
      expect(touching).toContain(3);
    });

    it('should return correct adjacent cups for cup 1 (top-middle)', () => {
      const touching = getTouchingCups(1, 6);
      expect(touching).toHaveLength(4);
      expect(touching).toContain(0);
      expect(touching).toContain(2);
      expect(touching).toContain(3);
      expect(touching).toContain(4);
    });

    it('should return correct adjacent cups for cup 2 (top-right)', () => {
      const touching = getTouchingCups(2, 6);
      expect(touching).toHaveLength(2);
      expect(touching).toContain(1);
      expect(touching).toContain(4);
    });

    it('should return correct adjacent cups for cup 3 (middle-left)', () => {
      const touching = getTouchingCups(3, 6);
      expect(touching).toHaveLength(4);
      expect(touching).toContain(0);
      expect(touching).toContain(1);
      expect(touching).toContain(4);
      expect(touching).toContain(5);
    });

    it('should return correct adjacent cups for cup 4 (middle-right)', () => {
      const touching = getTouchingCups(4, 6);
      expect(touching).toHaveLength(4);
      expect(touching).toContain(1);
      expect(touching).toContain(2);
      expect(touching).toContain(3);
      expect(touching).toContain(5);
    });

    it('should return correct adjacent cups for cup 5 (bottom)', () => {
      const touching = getTouchingCups(5, 6);
      expect(touching).toHaveLength(2);
      expect(touching).toContain(3);
      expect(touching).toContain(4);
    });

    it('should return empty array for invalid cup ID', () => {
      const touching = getTouchingCups(99, 6);
      expect(touching).toEqual([]);
    });
  });

  describe('10-Cup Formation', () => {
    it('should return correct adjacent cups for cup 0 (top-left)', () => {
      const touching = getTouchingCups(0, 10);
      expect(touching).toHaveLength(2);
      expect(touching).toContain(1);
      expect(touching).toContain(4);
    });

    it('should return correct adjacent cups for cup 5 (center)', () => {
      const touching = getTouchingCups(5, 10);
      expect(touching).toHaveLength(6);
      expect(touching).toContain(1);
      expect(touching).toContain(2);
      expect(touching).toContain(4);
      expect(touching).toContain(6);
      expect(touching).toContain(7);
      expect(touching).toContain(8);
    });

    it('should return correct adjacent cups for cup 9 (bottom)', () => {
      const touching = getTouchingCups(9, 10);
      expect(touching).toHaveLength(2);
      expect(touching).toContain(7);
      expect(touching).toContain(8);
    });

    it('should return correct adjacent cups for all edge cups', () => {
      expect(getTouchingCups(0, 10)).toContain(1);
      expect(getTouchingCups(3, 10)).toContain(2);

      const bottomTouching = getTouchingCups(9, 10);
      expect(bottomTouching.length).toBe(2);
      expect(bottomTouching).toContain(7);
      expect(bottomTouching).toContain(8);
    });

    it('should return empty array for invalid cup ID', () => {
      const touching = getTouchingCups(99, 10);
      expect(touching).toEqual([]);
    });
  });

  describe('Grenade Shot Scenarios', () => {
    it('should detect all touching cups for grenade on cup 1 in 6-cup formation', () => {
      // Grenade on cup 1 should sink target cup (1) plus all touching cups (0, 2, 3, 4)
      const touching = getTouchingCups(1, 6);
      expect(touching).toHaveLength(4);
      expect(touching).toEqual(expect.arrayContaining([0, 2, 3, 4]));
    });

    it('should detect all touching cups for grenade on cup 5 in 6-cup formation', () => {
      // Grenade on bottom cup (5) should sink target plus touching cups (3, 4)
      const touching = getTouchingCups(5, 6);
      expect(touching).toHaveLength(2);
      expect(touching).toEqual(expect.arrayContaining([3, 4]));
    });

    it('should detect all touching cups for grenade on cup 5 in 10-cup formation', () => {
      // Grenade on center cup (5) should sink target plus all 6 touching cups
      const touching = getTouchingCups(5, 10);
      expect(touching).toHaveLength(6);
      expect(touching).toEqual(expect.arrayContaining([1, 2, 4, 6, 7, 8]));
    });
  });
});
