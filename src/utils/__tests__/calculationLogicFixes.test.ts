/**
 * Calculation Logic Fixes Tests
 * 
 * Comprehensive tests for the calculation logic issues mentioned in task 5:
 * - XP calculation weekend bonus logic
 * - Personal record detection algorithm
 * - Streak milestone XP calculation
 * - Workout metrics personal records count detection
 * - 1RM calculation formula validation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateWorkoutXP,
  calculatePersonalRecordXP,
  calculateStreakMilestoneXP,
  DEFAULT_XP_CONFIG
} from '../xpCalculation';
import {
  calculateOneRepMax,
  findPersonalRecords,
  calculateWorkoutMetrics
} from '../workoutCalculations';
import type { Workout, SetType } from '@/types/workout';
import type { UserStreak } from '@/types/gamification';
import type { PersonalRecord } from '@/types/analytics';
import { 
  TestDataFactory, 
  TestDataValidator, 
  TestAssertions, 
  TestScenarios,
  PerformanceTestUtils 
} from './testUtils';

describe('Calculation Logic Fixes', () => {
  // Validate test data consistency before running tests
  beforeAll(() => {
    expect(TestDataValidator.validateUserStreak(mockUserStreak)).toBe(true);
    
    const testWorkout = createMockWorkout();
    expect(TestDataValidator.validateWorkout(testWorkout)).toBe(true);
  });
  const mockUserStreak = TestDataFactory.createUserStreak();

  // Enhanced factory with better defaults and validation
  const createMockWorkout = (overrides: Partial<Workout> = {}): Workout => ({
    id: 'workout-1',
    user_id: 'user-1',
    name: 'Test Workout',
    is_template: false,
    status: 'completed' as const,
    exercises: [
      {
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        order: 1,
        rest_time: 120,
        sets: [
          { id: 'set-1', weight: 100, reps: 10, completed: true, type: 'normal' as SetType },
          { id: 'set-2', weight: 105, reps: 8, completed: true, type: 'normal' as SetType },
          { id: 'set-3', weight: 110, reps: 6, completed: true, type: 'normal' as SetType }
        ]
      }
    ],
    duration: 60, // 1 hour in minutes
    total_volume: 2500,
    total_sets: 3,
    total_reps: 24,
    started_at: new Date('2025-01-25T10:00:00Z'),
    completed_at: new Date('2025-01-25T11:00:00Z'),
    is_completed: true,
    auto_rest_timer: false,
    default_rest_time: 120,
    created_at: new Date('2025-01-25T10:00:00Z'),
    updated_at: new Date('2025-01-25T11:00:00Z'),
    ...overrides
  });

  describe('XP Calculation Weekend Bonus Logic', () => {
    it('should properly apply weekend bonus multiplier', () => {
      // Saturday workout (weekend)
      const saturdayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-25T11:00:00Z') // Saturday
      });

      // Monday workout (weekday)
      const mondayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-27T11:00:00Z') // Monday
      });

      const saturdayXP = calculateWorkoutXP(saturdayWorkout, mockUserStreak);
      const mondayXP = calculateWorkoutXP(mondayWorkout, mockUserStreak);

      // Weekend XP should be higher due to weekend bonus (10% more)
      expect(saturdayXP).toBeGreaterThan(mondayXP);
      
      // Verify the exact multiplier is applied
      const expectedWeekendXP = Math.round(mondayXP * DEFAULT_XP_CONFIG.weekendBonus);
      expect(saturdayXP).toBeCloseTo(expectedWeekendXP, 0);
    });

    it('should apply weekend bonus on Sunday', () => {
      const sundayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-26T11:00:00Z') // Sunday
      });

      const mondayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-27T11:00:00Z') // Monday
      });

      const sundayXP = calculateWorkoutXP(sundayWorkout, mockUserStreak);
      const mondayXP = calculateWorkoutXP(mondayWorkout, mockUserStreak);

      expect(sundayXP).toBeGreaterThan(mondayXP);
    });

    it('should not apply weekend bonus on weekdays', () => {
      const tuesdayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-28T11:00:00Z') // Tuesday
      });

      const wednesdayWorkout = createMockWorkout({
        completed_at: new Date('2025-01-29T11:00:00Z') // Wednesday
      });

      const tuesdayXP = calculateWorkoutXP(tuesdayWorkout, mockUserStreak);
      const wednesdayXP = calculateWorkoutXP(wednesdayWorkout, mockUserStreak);

      // Should be equal (no weekend bonus)
      expect(tuesdayXP).toBe(wednesdayXP);
    });
  });

  describe('Personal Record Detection Algorithm', () => {
    it('should accurately detect max weight personal records', () => {
      const workout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 100, reps: 10, completed: true, type: 'normal' as SetType },
            { id: 'set-2', weight: 120, reps: 5, completed: true, type: 'normal' as SetType }, // New PR
            { id: 'set-3', weight: 110, reps: 8, completed: true, type: 'normal' as SetType }
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_weight: 115 }
      };

      const records = findPersonalRecords(workout, previousRecords);
      
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('max_weight');
      expect(records[0].value).toBe(120);
      expect(records[0].previousRecord).toBe(115);
    });

    it('should accurately detect max reps personal records', () => {
      const workout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 100, reps: 12, completed: true, type: 'normal' as SetType }, // New PR
            { id: 'set-2', weight: 105, reps: 8, completed: true, type: 'normal' as SetType },
            { id: 'set-3', weight: 110, reps: 6, completed: true, type: 'normal' as SetType }
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_reps: 10 }
      };

      const records = findPersonalRecords(workout, previousRecords);
      
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('max_reps');
      expect(records[0].value).toBe(12);
      expect(records[0].previousRecord).toBe(10);
    });

    it('should accurately detect max 1RM personal records', () => {
      const workout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 120, reps: 5, completed: true, type: 'normal' as SetType }, // 1RM = 140
            { id: 'set-2', weight: 100, reps: 10, completed: true, type: 'normal' as SetType }, // 1RM = 133
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_1rm: 135 }
      };

      const records = findPersonalRecords(workout, previousRecords);
      
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('max_1rm');
      expect(records[0].value).toBe(140); // 120 * (1 + 5/30) = 140
      expect(records[0].previousRecord).toBe(135);
    });

    it('should not detect records when no improvement', () => {
      const workout = createMockWorkout();

      const previousRecords = {
        'bench-press': { 
          max_weight: 120,
          max_reps: 15,
          max_1rm: 150
        }
      };

      const records = findPersonalRecords(workout, previousRecords);
      
      expect(records).toHaveLength(0);
    });
  });

  describe('Streak Milestone XP Calculation', () => {
    it('should return proper bonus amounts for exact milestones', () => {
      expect(calculateStreakMilestoneXP(7)).toBe(100);
      expect(calculateStreakMilestoneXP(14)).toBe(200);
      expect(calculateStreakMilestoneXP(30)).toBe(500);
      expect(calculateStreakMilestoneXP(60)).toBe(1000);
      expect(calculateStreakMilestoneXP(90)).toBe(2000);
      expect(calculateStreakMilestoneXP(180)).toBe(5000);
      expect(calculateStreakMilestoneXP(365)).toBe(10000);
    });

    it('should return 0 for non-milestone days', () => {
      expect(calculateStreakMilestoneXP(1)).toBe(0);
      expect(calculateStreakMilestoneXP(5)).toBe(0);
      expect(calculateStreakMilestoneXP(15)).toBe(0);
      expect(calculateStreakMilestoneXP(25)).toBe(0);
      expect(calculateStreakMilestoneXP(100)).toBe(0);
    });

    it('should return highest applicable milestone for specific cases', () => {
      // These test cases suggest the function should return the previous milestone XP
      // for certain days after milestones
      expect(calculateStreakMilestoneXP(31)).toBe(500); // 30-day milestone
      expect(calculateStreakMilestoneXP(61)).toBe(1000); // 60-day milestone
    });
  });

  describe('Workout Metrics Personal Records Count Detection', () => {
    it('should correctly count personal records in workout metrics', () => {
      const workout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 125, reps: 12, completed: true, type: 'normal' as SetType }, // Weight + Reps PR
            { id: 'set-2', weight: 120, reps: 8, completed: true, type: 'normal' as SetType },
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { 
          max_weight: 120,
          max_reps: 10,
          max_1rm: 140
        }
      };

      const metrics = calculateWorkoutMetrics(workout, previousRecords);
      
      expect(metrics.personalRecords.length).toBeGreaterThanOrEqual(2); // At least Weight and Reps PRs
      
      const weightPR = metrics.personalRecords.find(pr => pr.type === 'max_weight');
      const repsPR = metrics.personalRecords.find(pr => pr.type === 'max_reps');
      
      expect(weightPR).toBeDefined();
      expect(weightPR!.value).toBe(125);
      
      expect(repsPR).toBeDefined();
      expect(repsPR!.value).toBe(12);
    });

    it('should handle empty previous records gracefully', () => {
      const workout = createMockWorkout();
      const metrics = calculateWorkoutMetrics(workout, {});
      
      expect(metrics.personalRecords).toHaveLength(0);
    });

    it('should handle undefined previous records gracefully', () => {
      const workout = createMockWorkout();
      const metrics = calculateWorkoutMetrics(workout);
      
      expect(metrics.personalRecords).toHaveLength(0);
    });
  });

  describe('1RM Calculation Formula Validation', () => {
    it('should validate 1RM calculation against expected test results', () => {
      // Test cases based on Epley formula: 1RM = weight × (1 + reps/30)
      
      // 1 rep should return the weight itself
      expect(calculateOneRepMax(100, 1)).toBe(100);
      
      // Standard test cases
      expect(calculateOneRepMax(100, 5)).toBe(117); // 100 * (1 + 5/30) = 116.67 → 117
      expect(calculateOneRepMax(100, 10)).toBe(133); // 100 * (1 + 10/30) = 133.33 → 133
      expect(calculateOneRepMax(80, 8)).toBe(101); // 80 * (1 + 8/30) = 101.33 → 101
      expect(calculateOneRepMax(120, 3)).toBe(132); // 120 * (1 + 3/30) = 132
      
      // Edge cases
      expect(calculateOneRepMax(0, 10)).toBe(0);
      expect(calculateOneRepMax(100, 0)).toBe(0);
      
      // High rep ranges
      expect(calculateOneRepMax(60, 20)).toBe(100); // 60 * (1 + 20/30) = 100
      expect(calculateOneRepMax(50, 30)).toBe(100); // 50 * (1 + 30/30) = 100
    });

    it('should handle fractional results correctly', () => {
      // Test that results are properly rounded
      expect(calculateOneRepMax(75, 7)).toBe(93); // 75 * (1 + 7/30) = 92.5 → 93
      expect(calculateOneRepMax(85, 6)).toBe(102); // 85 * (1 + 6/30) = 102
    });

    it('should be consistent with personal record detection', () => {
      // Ensure 1RM calculation used in PR detection matches standalone function
      const weight = 100;
      const reps = 8;
      
      const standalone1RM = calculateOneRepMax(weight, reps);
      
      const workout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight, reps, completed: true, type: 'normal' as SetType }
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_1rm: standalone1RM - 1 }
      };

      const records = findPersonalRecords(workout, previousRecords);
      const prRecord = records.find(pr => pr.type === 'max_1rm');
      
      expect(prRecord).toBeDefined();
      expect(prRecord!.value).toBe(standalone1RM);
    });
  });

  describe('Personal Record XP Calculation', () => {
    it('should apply improvement multipliers correctly', () => {
      const mockPR: PersonalRecord = {
        id: 'pr-1',
        user_id: 'user-1',
        exercise_id: 'bench-press',
        type: 'max_weight',
        value: 105,
        unit: 'kg',
        achieved_at: new Date(),
        previous_record: 100,
        improvement_percentage: 5
      };

      // 5% improvement
      const xp5 = calculatePersonalRecordXP(mockPR, 5);
      // 10% improvement  
      const xp10 = calculatePersonalRecordXP(mockPR, 10);
      // 20% improvement
      const xp20 = calculatePersonalRecordXP(mockPR, 20);

      expect(xp10).toBeGreaterThan(xp5);
      expect(xp20).toBeGreaterThan(xp10);
    });

    it('should apply type multipliers correctly', () => {
      const basePR: PersonalRecord = {
        id: 'pr-1',
        user_id: 'user-1',
        exercise_id: 'bench-press',
        type: 'max_weight',
        value: 105,
        unit: 'kg',
        achieved_at: new Date(),
        previous_record: 100,
        improvement_percentage: 5
      };

      const weightPR = { ...basePR, type: 'max_weight' as const };
      const repsPR = { ...basePR, type: 'max_reps' as const };
      const volumePR = { ...basePR, type: 'max_volume' as const };
      const oneRMPR = { ...basePR, type: 'max_1rm' as const };

      const weightXP = calculatePersonalRecordXP(weightPR, 10);
      const repsXP = calculatePersonalRecordXP(repsPR, 10);
      const volumeXP = calculatePersonalRecordXP(volumePR, 10);
      const oneRMXP = calculatePersonalRecordXP(oneRMPR, 10);

      // Based on type multipliers: max_1rm (1.5) > max_volume (1.2) > max_weight (1.0) > max_reps (0.8)
      expect(oneRMXP).toBeGreaterThan(volumeXP);
      expect(volumeXP).toBeGreaterThan(weightXP);
      expect(weightXP).toBeGreaterThan(repsXP);
    });

    it('should cap improvement multiplier at 2x', () => {
      const mockPR: PersonalRecord = {
        id: 'pr-1',
        user_id: 'user-1',
        exercise_id: 'bench-press',
        type: 'max_weight',
        value: 200,
        unit: 'kg',
        achieved_at: new Date(),
        previous_record: 100,
        improvement_percentage: 100
      };

      // 100% improvement should be capped
      const xp100 = calculatePersonalRecordXP(mockPR, 100);
      // 200% improvement should also be capped at same level
      const xp200 = calculatePersonalRecordXP(mockPR, 200);

      expect(xp100).toBe(xp200);
      
      // Should not exceed 2x base XP * type multiplier
      const maxExpectedXP = DEFAULT_XP_CONFIG.personalRecordBonus * 2.0 * 1.0; // weight type multiplier
      expect(xp100).toBeLessThanOrEqual(maxExpectedXP);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should calculate XP efficiently for large workouts', () => {
      const largeWorkout = createMockWorkout({
        exercises: Array.from({ length: 20 }, (_, i) => ({
          exercise_id: `exercise-${i}`,
          exercise_name: `Exercise ${i}`,
          order: i + 1,
          rest_time: 120,
          sets: Array.from({ length: 5 }, (_, j) => ({
            id: `set-${i}-${j}`,
            weight: 100 + j * 5,
            reps: 10 - j,
            completed: true,
            type: 'normal' as SetType
          }))
        }))
      });

      const start = performance.now();
      const xp = calculateWorkoutXP(largeWorkout, mockUserStreak);
      const end = performance.now();

      expect(xp).toBeGreaterThan(0);
      expect(end - start).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should find personal records efficiently', () => {
      const workout = createMockWorkout();
      const previousRecords = {
        'bench-press': { max_weight: 100, max_reps: 8, max_1rm: 120 }
      };

      const start = performance.now();
      const records = findPersonalRecords(workout, previousRecords);
      const end = performance.now();

      expect(Array.isArray(records)).toBe(true);
      expect(end - start).toBeLessThan(10); // Should complete in under 10ms
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid workout data gracefully', () => {
      const invalidWorkout = null as any;
      const xp = calculateWorkoutXP(invalidWorkout, mockUserStreak);
      expect(xp).toBe(0);
    });

    it('should handle invalid user streak data gracefully', () => {
      const workout = createMockWorkout();
      const invalidStreak = null as any;
      const xp = calculateWorkoutXP(workout, invalidStreak);
      expect(xp).toBe(0);
    });

    it('should handle negative improvement in PR calculation', () => {
      const mockPR: PersonalRecord = {
        id: 'pr-1',
        exerciseId: 'bench-press',
        type: 'max_weight',
        value: 95,
        previousValue: 100,
        achievedAt: new Date(),
        userId: 'user-1'
      };

      const xp = calculatePersonalRecordXP(mockPR, -5); // Negative improvement
      expect(xp).toBe(0);
    });

    it('should handle invalid streak days in milestone calculation', () => {
      expect(calculateStreakMilestoneXP(-1)).toBe(0);
      expect(calculateStreakMilestoneXP(1.5)).toBe(0); // Non-integer
      expect(calculateStreakMilestoneXP(NaN)).toBe(0);
      expect(calculateStreakMilestoneXP(Infinity)).toBe(0);
    });

    it('should handle invalid inputs in 1RM calculation', () => {
      expect(calculateOneRepMax(-100, 10)).toBe(0); // Negative weight
      expect(calculateOneRepMax(100, -5)).toBe(0); // Negative reps
      expect(calculateOneRepMax(NaN, 10)).toBe(0); // NaN weight
      expect(calculateOneRepMax(100, NaN)).toBe(0); // NaN reps
      expect(calculateOneRepMax(Infinity, 10)).toBe(0); // Infinite weight
      expect(calculateOneRepMax(100, Infinity)).toBe(0); // Infinite reps
    });

    it('should handle workout with no working sets in personal records', () => {
      const workoutWithOnlyWarmups = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 50, reps: 10, completed: true, type: 'warmup' as SetType },
            { id: 'set-2', weight: 60, reps: 8, completed: true, type: 'warmup' as SetType }
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_weight: 100 }
      };

      const records = findPersonalRecords(workoutWithOnlyWarmups, previousRecords);
      expect(records).toHaveLength(0);
    });

    it('should handle workout with incomplete sets in personal records', () => {
      const workoutWithIncompleteSets = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 120, reps: 10, completed: false, type: 'normal' as SetType },
            { id: 'set-2', weight: 100, reps: 8, completed: true, type: 'normal' as SetType }
          ]
        }]
      });

      const previousRecords = {
        'bench-press': { max_weight: 105 }
      };

      const records = findPersonalRecords(workoutWithIncompleteSets, previousRecords);
      expect(records).toHaveLength(0); // 100 is not > 105
    });

    it('should handle malformed workout data in metrics calculation', () => {
      const malformedWorkout = {
        id: 'workout-1',
        name: 'Test Workout',
        exercises: null // Invalid exercises
      } as any;

      const metrics = calculateWorkoutMetrics(malformedWorkout);
      
      expect(metrics.duration).toBe(0);
      expect(metrics.totalVolume).toBe(0);
      expect(metrics.personalRecords).toHaveLength(0);
    });

    it('should handle very large numbers in calculations', () => {
      const largeNumberWorkout = createMockWorkout({
        exercises: [{
          exercise_id: 'bench-press',
          exercise_name: 'Bench Press',
          order: 1,
          rest_time: 120,
          sets: [
            { id: 'set-1', weight: 999999, reps: 100, completed: true, type: 'normal' as SetType }
          ]
        }]
      });

      const xp = calculateWorkoutXP(largeNumberWorkout, mockUserStreak);
      expect(Number.isFinite(xp)).toBe(true);
      expect(xp).toBeGreaterThan(0);

      const oneRM = calculateOneRepMax(999999, 100);
      expect(Number.isFinite(oneRM)).toBe(true);
      expect(oneRM).toBeGreaterThan(0);
    });
  });
});