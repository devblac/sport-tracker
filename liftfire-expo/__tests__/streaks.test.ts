/**
 * Streak Tracking Tests
 * 
 * Tests for streak calculation logic
 */

import {
  calculateCurrentStreak,
  calculateLongestStreak,
  hasWorkoutToday,
  getStreakStatus,
} from '../lib/streaks';

describe('Current Streak Calculation', () => {
  it('returns 0 for empty workout array', () => {
    expect(calculateCurrentStreak([])).toBe(0);
  });

  it('returns 1 for single workout today', () => {
    const today = new Date();
    expect(calculateCurrentStreak([today])).toBe(1);
  });

  it('returns 1 for single workout yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(calculateCurrentStreak([yesterday])).toBe(1);
  });

  it('returns 0 if last workout was 2+ days ago', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(calculateCurrentStreak([twoDaysAgo])).toBe(0);
  });

  it('calculates consecutive days correctly', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const workouts = [today, yesterday, twoDaysAgo];
    expect(calculateCurrentStreak(workouts)).toBe(3);
  });

  it('stops counting at first gap', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const workouts = [today, yesterday, fourDaysAgo];
    expect(calculateCurrentStreak(workouts)).toBe(2); // Only today and yesterday
  });

  it('handles multiple workouts on same day', () => {
    const today = new Date();
    const todayMorning = new Date(today);
    todayMorning.setHours(8, 0, 0, 0);
    const todayEvening = new Date(today);
    todayEvening.setHours(18, 0, 0, 0);

    const workouts = [todayMorning, todayEvening];
    expect(calculateCurrentStreak(workouts)).toBe(1); // Same day counts as 1
  });
});

describe('Longest Streak Calculation', () => {
  it('returns 0 for empty workout array', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it('returns 1 for single workout', () => {
    const today = new Date();
    expect(calculateLongestStreak([today])).toBe(1);
  });

  it('finds longest consecutive streak', () => {
    const dates: Date[] = [];
    const baseDate = new Date('2024-01-01');

    // Create streak: 3 days, gap, 5 days, gap, 2 days
    // Days 1-3
    for (let i = 0; i < 3; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    // Gap (day 4 missing)

    // Days 5-9
    for (let i = 4; i < 9; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    // Gap (day 10 missing)

    // Days 11-12
    for (let i = 10; i < 12; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    expect(calculateLongestStreak(dates)).toBe(5); // Days 5-9
  });

  it('handles multiple workouts on same day', () => {
    const date1 = new Date('2024-01-01T08:00:00');
    const date2 = new Date('2024-01-01T18:00:00');
    const date3 = new Date('2024-01-02T10:00:00');

    expect(calculateLongestStreak([date1, date2, date3])).toBe(2);
  });
});

describe('Has Workout Today', () => {
  it('returns false for empty array', () => {
    expect(hasWorkoutToday([])).toBe(false);
  });

  it('returns true if workout completed today', () => {
    const today = new Date();
    expect(hasWorkoutToday([today])).toBe(true);
  });

  it('returns false if last workout was yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(hasWorkoutToday([yesterday])).toBe(false);
  });

  it('returns true if any workout was today', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    expect(hasWorkoutToday([yesterday, today])).toBe(true);
  });
});

describe('Streak Status', () => {
  it('returns correct status for no workouts', () => {
    const status = getStreakStatus([]);
    expect(status.currentStreak).toBe(0);
    expect(status.longestStreak).toBe(0);
    expect(status.workedOutToday).toBe(false);
    expect(status.atRisk).toBe(false);
  });

  it('returns correct status for active streak with workout today', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const status = getStreakStatus([today, yesterday]);
    expect(status.currentStreak).toBe(2);
    expect(status.workedOutToday).toBe(true);
    expect(status.atRisk).toBe(false);
  });

  it('marks streak as at risk if no workout today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const status = getStreakStatus([yesterday, twoDaysAgo]);
    expect(status.currentStreak).toBe(2);
    expect(status.workedOutToday).toBe(false);
    expect(status.atRisk).toBe(true);
  });
});
