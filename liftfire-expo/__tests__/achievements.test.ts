/**
 * Achievement System Tests
 * 
 * Tests for achievement unlock logic
 */

import {
  checkNewAchievements,
  getAchievementDefinition,
  getAllAchievements,
  getAchievementCompletionPercentage,
  ACHIEVEMENTS,
} from '../lib/achievements';
import type { UserStats } from '../types';

describe('Achievement Checking', () => {
  it('unlocks first workout achievement', () => {
    const stats: UserStats = {
      workoutCount: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 50,
      level: 1,
    };

    const newAchievements = checkNewAchievements(stats, []);
    expect(newAchievements).toContain('first_workout');
  });

  it('unlocks workout count milestones', () => {
    const stats10: UserStats = {
      workoutCount: 10,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 500,
      level: 2,
    };

    const new10 = checkNewAchievements(stats10, ['first_workout']);
    expect(new10).toContain('workout_10');

    const stats50: UserStats = {
      workoutCount: 50,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 2500,
      level: 5,
    };

    const new50 = checkNewAchievements(stats50, ['first_workout', 'workout_10', 'workout_25']);
    expect(new50).toContain('workout_50');
  });

  it('unlocks streak achievements', () => {
    const stats7: UserStats = {
      workoutCount: 7,
      currentStreak: 7,
      longestStreak: 7,
      totalXP: 500,
      level: 2,
    };

    const new7 = checkNewAchievements(stats7, ['first_workout', 'streak_3_days']);
    expect(new7).toContain('streak_7_days');

    const stats30: UserStats = {
      workoutCount: 30,
      currentStreak: 30,
      longestStreak: 30,
      totalXP: 2000,
      level: 5,
    };

    const new30 = checkNewAchievements(stats30, ['first_workout', 'streak_3_days', 'streak_7_days', 'streak_14_days']);
    expect(new30).toContain('streak_30_days');
  });

  it('unlocks level achievements', () => {
    const stats5: UserStats = {
      workoutCount: 20,
      currentStreak: 5,
      longestStreak: 10,
      totalXP: 2000,
      level: 5,
    };

    const new5 = checkNewAchievements(stats5, ['first_workout']);
    expect(new5).toContain('level_5');

    const stats10: UserStats = {
      workoutCount: 50,
      currentStreak: 10,
      longestStreak: 20,
      totalXP: 15000,
      level: 10,
    };

    const new10 = checkNewAchievements(stats10, ['first_workout', 'level_5']);
    expect(new10).toContain('level_10');
  });

  it('does not return already unlocked achievements', () => {
    const stats: UserStats = {
      workoutCount: 10,
      currentStreak: 7,
      longestStreak: 7,
      totalXP: 500,
      level: 2,
    };

    const alreadyUnlocked = ['first_workout', 'workout_10', 'streak_7_days'];
    const newAchievements = checkNewAchievements(stats, alreadyUnlocked);

    expect(newAchievements).not.toContain('first_workout');
    expect(newAchievements).not.toContain('workout_10');
    expect(newAchievements).not.toContain('streak_7_days');
  });

  it('returns multiple new achievements at once', () => {
    const stats: UserStats = {
      workoutCount: 10,
      currentStreak: 7,
      longestStreak: 7,
      totalXP: 2000,
      level: 5,
    };

    const newAchievements = checkNewAchievements(stats, []);
    
    // Should unlock multiple achievements
    expect(newAchievements.length).toBeGreaterThan(1);
    expect(newAchievements).toContain('first_workout');
    expect(newAchievements).toContain('workout_10');
    expect(newAchievements).toContain('streak_7_days');
    expect(newAchievements).toContain('level_5');
  });
});

describe('Achievement Definitions', () => {
  it('returns achievement definition by type', () => {
    const def = getAchievementDefinition('first_workout');
    expect(def).toBeDefined();
    expect(def?.type).toBe('first_workout');
    expect(def?.title).toBe('First Steps');
  });

  it('returns undefined for non-existent achievement', () => {
    const def = getAchievementDefinition('non_existent');
    expect(def).toBeUndefined();
  });

  it('returns all achievement definitions', () => {
    const all = getAllAchievements();
    expect(all).toBeDefined();
    expect(all.length).toBeGreaterThan(0);
    expect(all).toEqual(ACHIEVEMENTS);
  });
});

describe('Achievement Completion', () => {
  it('calculates completion percentage correctly', () => {
    const totalAchievements = ACHIEVEMENTS.length;
    
    // 0% completion
    expect(getAchievementCompletionPercentage([])).toBe(0);

    // 50% completion
    const halfUnlocked = ACHIEVEMENTS.slice(0, Math.floor(totalAchievements / 2)).map(a => a.type);
    const halfPercent = getAchievementCompletionPercentage(halfUnlocked);
    expect(halfPercent).toBeCloseTo(50, 0);

    // 100% completion
    const allUnlocked = ACHIEVEMENTS.map(a => a.type);
    expect(getAchievementCompletionPercentage(allUnlocked)).toBe(100);
  });

  it('handles empty achievement list', () => {
    expect(getAchievementCompletionPercentage([])).toBe(0);
  });
});
