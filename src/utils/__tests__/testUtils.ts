/**
 * Test Utilities for Calculation Logic Tests
 * 
 * Reusable utilities and factories for testing calculation logic
 */

import type { Workout, SetType, WorkoutExercise } from '@/types/workout';
import type { UserStreak } from '@/types/gamification';
import type { PersonalRecord } from '@/types/analytics';

// ============================================================================
// Test Data Factories
// ============================================================================

export const TestDataFactory = {
  /**
   * Create a mock UserStreak with sensible defaults
   */
  createUserStreak(overrides: Partial<UserStreak> = {}): UserStreak {
    return {
      userId: 'test-user-1',
      currentStreak: 7,
      longestStreak: 14,
      totalWorkouts: 15,
      lastWorkoutDate: new Date('2025-01-25'),
      streakStartDate: new Date('2025-01-19'),
      scheduledDays: ['monday', 'wednesday', 'friday'],
      compensationsUsed: 0,
      sickDaysUsed: 0,
      vacationDaysUsed: 0,
      maxSickDays: 5,
      maxVacationDays: 10,
      lastSickDayReset: new Date('2025-01-01'),
      lastVacationDayReset: new Date('2025-01-01'),
      streakFreezes: [],
      updatedAt: new Date('2025-01-25'),
      ...overrides
    };
  },

  /**
   * Create a mock WorkoutExercise with sensible defaults
   */
  createWorkoutExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
    return {
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      order: 1,
      rest_time: 120,
      sets: [
        { id: 'set-1', weight: 100, reps: 10, completed: true, type: 'normal' as SetType },
        { id: 'set-2', weight: 105, reps: 8, completed: true, type: 'normal' as SetType },
        { id: 'set-3', weight: 110, reps: 6, completed: true, type: 'normal' as SetType }
      ],
      ...overrides
    };
  },

  /**
   * Create a mock Workout with sensible defaults
   */
  createWorkout(overrides: Partial<Workout> = {}): Workout {
    const baseWorkout: Workout = {
      id: 'workout-1',
      user_id: 'test-user-1',
      name: 'Test Workout',
      is_template: false,
      status: 'completed' as const,
      exercises: [this.createWorkoutExercise()],
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
    };

    return baseWorkout;
  },

  /**
   * Create a mock PersonalRecord with sensible defaults
   */
  createPersonalRecord(overrides: Partial<PersonalRecord> = {}): PersonalRecord {
    return {
      id: 'pr-1',
      user_id: 'test-user-1',
      exercise_id: 'bench-press',
      type: 'max_weight',
      value: 105,
      unit: 'kg',
      achieved_at: new Date(),
      previous_record: 100,
      improvement_percentage: 5,
      ...overrides
    };
  }
};

// ============================================================================
// Test Data Validators
// ============================================================================

export const TestDataValidator = {
  /**
   * Validate workout data structure
   */
  validateWorkout(workout: Workout): boolean {
    return !!(
      workout.id &&
      workout.user_id &&
      workout.exercises.length > 0 &&
      workout.exercises.every(ex => ex.exercise_id && ex.sets.length > 0)
    );
  },

  /**
   * Validate user streak data structure
   */
  validateUserStreak(streak: UserStreak): boolean {
    return !!(
      streak.userId &&
      streak.currentStreak >= 0 &&
      streak.longestStreak >= 0 &&
      Array.isArray(streak.scheduledDays)
    );
  },

  /**
   * Validate personal record data structure
   */
  validatePersonalRecord(pr: PersonalRecord): boolean {
    return !!(
      pr.id &&
      pr.user_id &&
      pr.exercise_id &&
      pr.value > 0 &&
      pr.type &&
      pr.unit
    );
  }
};

// ============================================================================
// Test Assertion Helpers
// ============================================================================

export const TestAssertions = {
  /**
   * Assert XP calculation is within expected range
   */
  assertXPInRange(xp: number, min: number, max: number): void {
    expect(xp).toBeGreaterThanOrEqual(min);
    expect(xp).toBeLessThanOrEqual(max);
    expect(Number.isFinite(xp)).toBe(true);
  },

  /**
   * Assert performance is within acceptable limits
   */
  assertPerformance(executionTime: number, maxTime: number): void {
    expect(executionTime).toBeLessThan(maxTime);
    expect(executionTime).toBeGreaterThan(0);
  },

  /**
   * Assert personal record detection accuracy
   */
  assertPersonalRecordDetection(
    records: any[],
    expectedCount: number,
    expectedTypes: string[]
  ): void {
    expect(records).toHaveLength(expectedCount);
    expectedTypes.forEach(type => {
      expect(records.some(r => r.type === type)).toBe(true);
    });
  }
};

// ============================================================================
// Test Scenarios
// ============================================================================

export const TestScenarios = {
  /**
   * Weekend workout scenario
   */
  weekendWorkout: {
    saturday: new Date('2025-01-25T11:00:00Z'), // Saturday
    sunday: new Date('2025-01-26T11:00:00Z'),   // Sunday
  },

  /**
   * Weekday workout scenario
   */
  weekdayWorkout: {
    monday: new Date('2025-01-27T11:00:00Z'),    // Monday
    tuesday: new Date('2025-01-28T11:00:00Z'),   // Tuesday
    wednesday: new Date('2025-01-29T11:00:00Z'), // Wednesday
  },

  /**
   * Personal record scenarios
   */
  personalRecords: {
    weightPR: { weight: 120, previousMax: 115 },
    repsPR: { reps: 12, previousMax: 10 },
    oneRMPR: { weight: 120, reps: 5, previousMax: 135 }, // 1RM = 140
  },

  /**
   * Streak milestone scenarios
   */
  streakMilestones: [
    { days: 7, expectedXP: 100 },
    { days: 14, expectedXP: 200 },
    { days: 30, expectedXP: 500 },
    { days: 60, expectedXP: 1000 },
    { days: 90, expectedXP: 2000 },
    { days: 180, expectedXP: 5000 },
    { days: 365, expectedXP: 10000 },
  ]
};

// ============================================================================
// Performance Testing Utilities
// ============================================================================

export const PerformanceTestUtils = {
  /**
   * Measure execution time of a function
   */
  measureExecutionTime<T>(fn: () => T): { result: T; executionTime: number } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    return {
      result,
      executionTime: end - start
    };
  },

  /**
   * Run performance benchmark with multiple iterations
   */
  benchmark<T>(
    fn: () => T,
    iterations: number = 100
  ): { averageTime: number; minTime: number; maxTime: number } {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const { executionTime } = this.measureExecutionTime(fn);
      times.push(executionTime);
    }
    
    return {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }
};