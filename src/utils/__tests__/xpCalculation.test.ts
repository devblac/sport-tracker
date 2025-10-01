/**
 * XP Calculation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWorkoutXP,
  calculatePersonalRecordXP,
  calculateStreakMilestoneXP,
  calculateSocialXP,
  calculateChallengeXP,
  calculateConsistencyXP,
  validateXPAmount,
  applyDailyXPLimit,
  DEFAULT_XP_CONFIG
} from '../xpCalculation';
import type { Workout } from '@/types/workout';
import type { UserStreak } from '@/types/gamification';
import type { PersonalRecord } from '@/types/analytics';

describe('XP Calculation', () => {
  const mockWorkout: Workout = {
    id: 'workout-1',
    userId: 'user-1',
    name: 'Test Workout',
    exercises: [
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        sets: [
          { type: 'working', actualReps: 8, actualWeight: 80, completedAt: new Date() },
          { type: 'working', actualReps: 8, actualWeight: 80, completedAt: new Date() },
          { type: 'failure', actualReps: 6, actualWeight: 80, completedAt: new Date() }
        ],
        restTime: 180,
        notes: ''
      },
      {
        exerciseId: 'squat',
        exerciseName: 'Squat',
        sets: [
          { type: 'working', actualReps: 10, actualWeight: 100, completedAt: new Date() },
          { type: 'working', actualReps: 10, actualWeight: 100, completedAt: new Date() }
        ],
        restTime: 180,
        notes: ''
      }
    ],
    isTemplate: false,
    isCompleted: true,
    duration: 3600, // 1 hour
    totalVolume: 1640, // (80*8*2 + 80*6) + (100*10*2) = 1280 + 360 = 1640
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserStreak: UserStreak = {
    userId: 'user-1',
    currentStreak: 7,
    longestStreak: 14,
    totalWorkouts: 25,
    scheduledDays: ['monday', 'wednesday', 'friday'],
    compensationsUsed: 0,
    sickDaysUsed: 0,
    vacationDaysUsed: 0,
    maxSickDays: 14,
    maxVacationDays: 30,
    lastSickDayReset: new Date(),
    lastVacationDayReset: new Date(),
    streakFreezes: [],
    updatedAt: new Date()
  };

  describe('calculateWorkoutXP', () => {
    it('should calculate base workout XP correctly', () => {
      const xp = calculateWorkoutXP(mockWorkout, mockUserStreak);
      
      // Base XP: 20
      // Duration XP: 60 (1 hour, max 60)
      // Volume XP: 16 (1640kg / 100 = 16.4, rounded down)
      // Exercise variety XP: 10 (2 exercises * 5)
      // Set XP: 10 (5 sets * 2)
      // Streak multiplier: 1.2 (7-day streak)
      // Difficulty multiplier: 1.1 (1 failure set)
      
      expect(xp).toBeGreaterThan(100);
      expect(xp).toBeLessThan(200);
    });

    it('should apply premium multiplier', () => {
      const regularXP = calculateWorkoutXP(mockWorkout, mockUserStreak, false);
      const premiumXP = calculateWorkoutXP(mockWorkout, mockUserStreak, true);
      
      expect(premiumXP).toBeGreaterThan(regularXP);
      expect(premiumXP / regularXP).toBeCloseTo(DEFAULT_XP_CONFIG.premiumMultiplier, 1);
    });

    it('should apply weekend bonus', () => {
      const weekdayWorkout = {
        ...mockWorkout,
        completedAt: new Date('2025-01-27T10:00:00Z') // Monday
      };
      
      const weekendWorkout = {
        ...mockWorkout,
        completedAt: new Date('2025-01-26T10:00:00Z') // Sunday
      };
      
      const weekdayXP = calculateWorkoutXP(weekdayWorkout, mockUserStreak);
      const weekendXP = calculateWorkoutXP(weekendWorkout, mockUserStreak);
      
      expect(weekendXP).toBeGreaterThan(weekdayXP);
    });

    it('should cap individual bonuses at maximum values', () => {
      const longWorkout = {
        ...mockWorkout,
        duration: 7200, // 2 hours
        totalVolume: 10000, // Very high volume
        exercises: Array(20).fill(mockWorkout.exercises[0]) // Many exercises
      };
      
      const xp = calculateWorkoutXP(longWorkout, mockUserStreak);
      
      // Should still be reasonable due to caps
      expect(xp).toBeLessThan(1000);
    });
  });

  describe('calculatePersonalRecordXP', () => {
    const mockPR: PersonalRecord = {
      id: 'pr-1',
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      type: 'max_weight',
      value: 100,
      unit: 'kg',
      achievedAt: new Date(),
      workoutId: 'workout-1',
      previousRecord: 95,
      improvement: 5.26 // 5.26% improvement
    };

    it('should calculate PR XP with improvement bonus', () => {
      const xp = calculatePersonalRecordXP(mockPR, 5.26);
      
      // Base: 50, Improvement multiplier: ~1.05, Type multiplier: 1.0
      expect(xp).toBeGreaterThan(50);
      expect(xp).toBeLessThan(60);
    });

    it('should apply different multipliers for PR types', () => {
      const weightPR = { ...mockPR, type: 'max_weight' as const };
      const repsPR = { ...mockPR, type: 'max_reps' as const };
      const oneRMPR = { ...mockPR, type: 'max_1rm' as const };
      
      const weightXP = calculatePersonalRecordXP(weightPR, 5);
      const repsXP = calculatePersonalRecordXP(repsPR, 5);
      const oneRMXP = calculatePersonalRecordXP(oneRMPR, 5);
      
      expect(oneRMXP).toBeGreaterThan(weightXP);
      expect(weightXP).toBeGreaterThan(repsXP);
    });

    it('should cap improvement multiplier', () => {
      const hugeImprovement = calculatePersonalRecordXP(mockPR, 200); // 200% improvement
      const normalImprovement = calculatePersonalRecordXP(mockPR, 10); // 10% improvement
      
      // Should not be more than 2x the base
      expect(hugeImprovement / normalImprovement).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateStreakMilestoneXP', () => {
    it('should return correct XP for milestone streaks', () => {
      expect(calculateStreakMilestoneXP(7)).toBe(100);
      expect(calculateStreakMilestoneXP(14)).toBe(200);
      expect(calculateStreakMilestoneXP(30)).toBe(500);
      expect(calculateStreakMilestoneXP(365)).toBe(10000);
    });

    it('should return 0 for non-milestone streaks', () => {
      expect(calculateStreakMilestoneXP(5)).toBe(0);
      expect(calculateStreakMilestoneXP(15)).toBe(0);
      expect(calculateStreakMilestoneXP(100)).toBe(0);
    });

    it('should return highest applicable milestone', () => {
      expect(calculateStreakMilestoneXP(31)).toBe(500); // 30-day milestone
      expect(calculateStreakMilestoneXP(61)).toBe(1000); // 60-day milestone
    });
  });

  describe('calculateSocialXP', () => {
    it('should return correct XP for different social interactions', () => {
      expect(calculateSocialXP('like_given')).toBe(1);
      expect(calculateSocialXP('like_received')).toBe(2);
      expect(calculateSocialXP('comment_given')).toBe(3);
      expect(calculateSocialXP('friend_added')).toBe(20);
      expect(calculateSocialXP('mentor_session')).toBe(100);
    });

    it('should return 0 for unknown interaction types', () => {
      expect(calculateSocialXP('unknown_interaction')).toBe(0);
    });
  });

  describe('calculateChallengeXP', () => {
    it('should calculate XP based on rank and difficulty', () => {
      const winnerXP = calculateChallengeXP('individual', 1, 100, 3); // 1st place
      const middleXP = calculateChallengeXP('individual', 50, 100, 3); // 50th place
      const lastXP = calculateChallengeXP('individual', 100, 100, 3); // Last place
      
      expect(winnerXP).toBeGreaterThan(middleXP);
      expect(middleXP).toBeGreaterThan(lastXP);
    });

    it('should apply challenge type multipliers', () => {
      const individualXP = calculateChallengeXP('individual', 1, 10, 1);
      const groupXP = calculateChallengeXP('group', 1, 10, 1);
      const globalXP = calculateChallengeXP('global', 1, 10, 1);
      
      expect(globalXP).toBeGreaterThan(groupXP);
      expect(groupXP).toBeGreaterThan(individualXP);
    });
  });

  describe('calculateConsistencyXP', () => {
    it('should award perfect week bonus', () => {
      expect(calculateConsistencyXP(3, 3)).toBe(100); // Perfect week
    });

    it('should award good consistency bonus', () => {
      expect(calculateConsistencyXP(4, 5)).toBe(50); // 80% consistency
    });

    it('should award decent consistency bonus', () => {
      expect(calculateConsistencyXP(3, 5)).toBe(25); // 60% consistency
    });

    it('should not award bonus for poor consistency', () => {
      expect(calculateConsistencyXP(2, 5)).toBe(0); // 40% consistency
      expect(calculateConsistencyXP(0, 3)).toBe(0); // No workouts
    });
  });

  describe('validateXPAmount', () => {
    it('should validate XP amounts within limits', () => {
      expect(validateXPAmount(50, 'workout_completion')).toBe(true);
      expect(validateXPAmount(500, 'personal_record')).toBe(true);
      expect(validateXPAmount(10000, 'streak_milestone')).toBe(true);
    });

    it('should reject negative XP', () => {
      expect(validateXPAmount(-10, 'workout_completion')).toBe(false);
    });

    it('should reject XP above limits', () => {
      expect(validateXPAmount(2000, 'workout_completion')).toBe(false);
      expect(validateXPAmount(1000, 'personal_record')).toBe(false);
      expect(validateXPAmount(20000, 'streak_milestone')).toBe(false);
    });
  });

  describe('applyDailyXPLimit', () => {
    it('should allow XP within daily limit', () => {
      expect(applyDailyXPLimit(500, 200, false)).toBe(200); // Regular user
      expect(applyDailyXPLimit(1000, 500, true)).toBe(500); // Premium user
    });

    it('should cap XP at daily limit', () => {
      expect(applyDailyXPLimit(900, 200, false)).toBe(100); // 1000 - 900 = 100
      expect(applyDailyXPLimit(1800, 300, true)).toBe(200); // 2000 - 1800 = 200
    });

    it('should return 0 when daily limit reached', () => {
      expect(applyDailyXPLimit(1000, 100, false)).toBe(0); // Regular limit reached
      expect(applyDailyXPLimit(2000, 100, true)).toBe(0); // Premium limit reached
    });

    it('should have higher limit for premium users', () => {
      const regularLimit = applyDailyXPLimit(0, 1500, false);
      const premiumLimit = applyDailyXPLimit(0, 1500, true);
      
      expect(premiumLimit).toBeGreaterThan(regularLimit);
    });
  });
});