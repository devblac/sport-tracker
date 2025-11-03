/**
 * Gamification Logic Tests
 * 
 * Tests for XP calculation, level progression, and streak tracking
 */

import {
  calculateWorkoutXP,
  getStreakMultiplier,
  calculateLevel,
  getLevelInfo,
  LEVEL_THRESHOLDS,
} from '../lib/gamification';

describe('XP Calculation', () => {
  it('calculates base XP correctly', () => {
    const xp = calculateWorkoutXP(0, 0, 0);
    expect(xp).toBe(20); // Base XP only
  });

  it('adds duration bonus (1 XP per minute, max 60)', () => {
    const xp30min = calculateWorkoutXP(30, 0, 0);
    expect(xp30min).toBe(50); // 20 base + 30 duration

    const xp60min = calculateWorkoutXP(60, 0, 0);
    expect(xp60min).toBe(80); // 20 base + 60 duration

    const xp120min = calculateWorkoutXP(120, 0, 0);
    expect(xp120min).toBe(80); // 20 base + 60 duration (capped)
  });

  it('adds exercise variety bonus (5 XP per exercise, max 30)', () => {
    const xp3ex = calculateWorkoutXP(0, 3, 0);
    expect(xp3ex).toBe(35); // 20 base + 15 variety

    const xp6ex = calculateWorkoutXP(0, 6, 0);
    expect(xp6ex).toBe(50); // 20 base + 30 variety

    const xp10ex = calculateWorkoutXP(0, 10, 0);
    expect(xp10ex).toBe(50); // 20 base + 30 variety (capped)
  });

  it('applies streak multiplier correctly', () => {
    // No streak bonus
    const xp0 = calculateWorkoutXP(30, 3, 0);
    expect(xp0).toBe(65); // (20 + 30 + 15) * 1.0

    // 7-day streak: 20% bonus
    const xp7 = calculateWorkoutXP(30, 3, 7);
    expect(xp7).toBe(78); // (20 + 30 + 15) * 1.2

    // 30-day streak: 50% bonus
    const xp30 = calculateWorkoutXP(30, 3, 30);
    expect(xp30).toBe(98); // (20 + 30 + 15) * 1.5
  });
});

describe('Streak Multiplier', () => {
  it('returns 1.0 for streaks less than 7 days', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(3)).toBe(1.0);
    expect(getStreakMultiplier(6)).toBe(1.0);
  });

  it('returns correct multipliers for streak milestones', () => {
    expect(getStreakMultiplier(7)).toBe(1.2);   // 20% bonus
    expect(getStreakMultiplier(14)).toBe(1.3);  // 30% bonus
    expect(getStreakMultiplier(30)).toBe(1.5);  // 50% bonus
    expect(getStreakMultiplier(60)).toBe(1.7);  // 70% bonus
    expect(getStreakMultiplier(90)).toBe(2.0);  // 100% bonus
  });

  it('uses highest applicable multiplier', () => {
    expect(getStreakMultiplier(10)).toBe(1.2);  // Uses 7-day multiplier
    expect(getStreakMultiplier(45)).toBe(1.5);  // Uses 30-day multiplier
    expect(getStreakMultiplier(100)).toBe(2.0); // Uses 90-day multiplier
  });
});

describe('Level Calculation', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('calculates correct level based on XP thresholds', () => {
    expect(calculateLevel(50)).toBe(1);    // Below level 2 threshold
    expect(calculateLevel(100)).toBe(2);   // Exactly level 2 threshold
    expect(calculateLevel(150)).toBe(2);   // Between level 2 and 3
    expect(calculateLevel(250)).toBe(3);   // Exactly level 3 threshold
    expect(calculateLevel(1000)).toBe(5);  // Level 5
    expect(calculateLevel(5000)).toBe(7);  // Level 7
  });

  it('handles XP beyond max defined level', () => {
    const maxThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const level = calculateLevel(maxThreshold + 1000);
    expect(level).toBeGreaterThanOrEqual(LEVEL_THRESHOLDS.length);
  });
});

describe('Level Info', () => {
  it('provides correct level info for level 1', () => {
    const info = getLevelInfo(50);
    expect(info.level).toBe(1);
    expect(info.currentLevelXP).toBe(0);
    expect(info.nextLevelXP).toBe(100);
    expect(info.xpToNextLevel).toBe(50);
    expect(info.progress).toBe(50); // 50% progress
  });

  it('provides correct level info for level 2', () => {
    const info = getLevelInfo(150);
    expect(info.level).toBe(2);
    expect(info.currentLevelXP).toBe(100);
    expect(info.nextLevelXP).toBe(250);
    expect(info.xpToNextLevel).toBe(100);
    expect(info.progress).toBeCloseTo(33.33, 1); // ~33% progress
  });

  it('calculates progress percentage correctly', () => {
    const info0 = getLevelInfo(0);
    expect(info0.progress).toBe(0);

    const info50 = getLevelInfo(50);
    expect(info50.progress).toBe(50);

    const info99 = getLevelInfo(99);
    expect(info99.progress).toBe(99);
  });
});
