import { describe, it, expect } from 'vitest';
import {
  validateWorkout,
  validateWorkoutCreate,
  validateWorkoutUpdate,
  validateWorkoutTemplate,
  validateSetData,
  validateSetCreate,
  validateWorkoutFilter,
  transformWorkoutData,
  generateWorkoutId,
  generateSetId,
  generateWorkoutExerciseId,
  isWorkoutInProgress,
  isWorkoutCompleted,
  isWorkingSet,
  getSetTypeDisplay,
  getWorkoutStatusDisplay,
} from '../workoutValidation';
import type { Workout, WorkoutCreate, SetData } from '@/types';

describe('workoutValidation', () => {
  const validSetData: SetData = {
    id: 'set-1',
    set_number: 1,
    type: 'normal',
    weight: 100,
    reps: 10,
    completed: true,
    planned_rest_time: 90,
  };

  const validWorkoutData: Workout = {
    id: 'workout-1',
    user_id: 'user-1',
    name: 'Test Workout',
    status: 'completed',
    is_template: false,
    exercises: [{
      id: 'exercise-1',
      exercise_id: 'bench-press',
      order: 0,
      sets: [validSetData],
    }],
    auto_rest_timer: true,
    default_rest_time: 90,
    is_public: false,
    created_at: new Date(),
  };

  describe('validateWorkout', () => {
    it('should validate correct workout data', () => {
      const result = validateWorkout(validWorkoutData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject workout with missing required fields', () => {
      const invalidData = {
        name: 'Test Workout',
        // Missing id, user_id, status, etc.
      };

      const result = validateWorkout(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject workout with invalid status', () => {
      const invalidData = {
        ...validWorkoutData,
        status: 'invalid_status',
      };

      const result = validateWorkout(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('status'))).toBe(true);
    });

    it('should reject workout with empty exercises array', () => {
      const invalidData = {
        ...validWorkoutData,
        exercises: [],
      };

      const result = validateWorkout(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should reject workout with invalid exercise data', () => {
      const invalidData = {
        ...validWorkoutData,
        exercises: [{
          // Missing required fields
          order: 0,
        }],
      };

      const result = validateWorkout(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('validateWorkoutCreate', () => {
    it('should validate workout creation data', () => {
      const createData: WorkoutCreate = {
        user_id: 'user-1',
        name: 'New Workout',
        status: 'planned',
        is_template: false,
        exercises: [{
          id: 'exercise-1',
          exercise_id: 'bench-press',
          order: 0,
          sets: [validSetData],
        }],
        auto_rest_timer: true,
        default_rest_time: 90,
        is_public: false,
      };

      const result = validateWorkoutCreate(createData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject creation data with invalid fields', () => {
      const invalidData = {
        user_id: '', // Empty string should fail
        name: 'Test',
        status: 'planned',
        exercises: [],
      };

      const result = validateWorkoutCreate(invalidData);
      
      expect(result.success).toBe(false);
    });
  });

  describe('validateSetData', () => {
    it('should validate correct set data', () => {
      const result = validateSetData(validSetData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject set with negative weight', () => {
      const invalidSet = {
        ...validSetData,
        weight: -10,
      };

      const result = validateSetData(invalidSet);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('weight'))).toBe(true);
    });

    it('should reject set with negative reps', () => {
      const invalidSet = {
        ...validSetData,
        reps: -5,
      };

      const result = validateSetData(invalidSet);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('reps'))).toBe(true);
    });

    it('should reject set with invalid RPE', () => {
      const invalidSet = {
        ...validSetData,
        rpe: 15, // RPE should be 1-10
      };

      const result = validateSetData(invalidSet);
      
      expect(result.success).toBe(false);
    });

    it('should accept valid RPE values', () => {
      const validRPEs = [1, 5, 10];
      
      validRPEs.forEach(rpe => {
        const setWithRPE = {
          ...validSetData,
          rpe,
        };

        const result = validateSetData(setWithRPE);
        expect(result.success).toBe(true);
      });
    });

    it('should validate different set types', () => {
      const setTypes = ['normal', 'warmup', 'failure', 'dropset', 'restpause', 'cluster', 'myorep', 'amrap', 'tempo', 'isometric'];
      
      setTypes.forEach(type => {
        const setWithType = {
          ...validSetData,
          type: type as any,
        };

        const result = validateSetData(setWithType);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateWorkoutFilter', () => {
    it('should validate empty filter', () => {
      const result = validateWorkoutFilter({});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate filter with all fields', () => {
      const filter = {
        user_id: 'user-1',
        status: 'completed',
        is_template: false,
        date_from: new Date('2025-01-01'),
        date_to: new Date('2025-01-31'),
        exercise_ids: ['bench-press', 'squats'],
        difficulty_rating: [3, 4],
      };

      const result = validateWorkoutFilter(filter);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject filter with invalid status', () => {
      const filter = {
        status: 'invalid_status',
      };

      const result = validateWorkoutFilter(filter);
      
      expect(result.success).toBe(false);
    });
  });

  describe('transformWorkoutData', () => {
    it('should transform date strings to Date objects', () => {
      const rawData = {
        ...validWorkoutData,
        created_at: '2025-01-01T10:00:00Z',
        started_at: '2025-01-01T10:00:00Z',
        completed_at: '2025-01-01T11:00:00Z',
        exercises: [{
          id: 'exercise-1',
          exercise_id: 'bench-press',
          order: 0,
          started_at: '2025-01-01T10:05:00Z',
          completed_at: '2025-01-01T10:30:00Z',
          sets: [{
            ...validSetData,
            started_at: '2025-01-01T10:05:00Z',
            ended_at: '2025-01-01T10:07:00Z',
            completed_at: '2025-01-01T10:07:00Z',
          }],
        }],
      };

      const result = transformWorkoutData(rawData);
      
      expect(result).toBeDefined();
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.started_at).toBeInstanceOf(Date);
      expect(result?.completed_at).toBeInstanceOf(Date);
      expect(result?.exercises[0].started_at).toBeInstanceOf(Date);
      expect(result?.exercises[0].completed_at).toBeInstanceOf(Date);
      expect(result?.exercises[0].sets[0].started_at).toBeInstanceOf(Date);
      expect(result?.exercises[0].sets[0].ended_at).toBeInstanceOf(Date);
      expect(result?.exercises[0].sets[0].completed_at).toBeInstanceOf(Date);
    });

    it('should return null for invalid data', () => {
      const invalidData = {
        // Missing required fields
        name: 'Test',
      };

      const result = transformWorkoutData(invalidData);
      
      expect(result).toBeNull();
    });

    it('should handle data without date fields', () => {
      const dataWithoutDates = {
        ...validWorkoutData,
        started_at: undefined,
        completed_at: undefined,
      };

      const result = transformWorkoutData(dataWithoutDates);
      
      expect(result).toBeDefined();
      expect(result?.started_at).toBeUndefined();
      expect(result?.completed_at).toBeUndefined();
    });
  });

  describe('ID generation functions', () => {
    it('should generate unique workout IDs', () => {
      const id1 = generateWorkoutId();
      const id2 = generateWorkoutId();
      
      expect(id1).toMatch(/^workout-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^workout-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique set IDs', () => {
      const id1 = generateSetId();
      const id2 = generateSetId();
      
      expect(id1).toMatch(/^set-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^set-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate unique workout exercise IDs', () => {
      const id1 = generateWorkoutExerciseId();
      const id2 = generateWorkoutExerciseId();
      
      expect(id1).toMatch(/^workout-exercise-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^workout-exercise-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('status checking functions', () => {
    it('should identify workout in progress', () => {
      const inProgressWorkout = { ...validWorkoutData, status: 'in_progress' as const };
      const pausedWorkout = { ...validWorkoutData, status: 'paused' as const };
      const completedWorkout = { ...validWorkoutData, status: 'completed' as const };
      
      expect(isWorkoutInProgress(inProgressWorkout)).toBe(true);
      expect(isWorkoutInProgress(pausedWorkout)).toBe(true);
      expect(isWorkoutInProgress(completedWorkout)).toBe(false);
    });

    it('should identify completed workout', () => {
      const completedWorkout = { ...validWorkoutData, status: 'completed' as const };
      const inProgressWorkout = { ...validWorkoutData, status: 'in_progress' as const };
      
      expect(isWorkoutCompleted(completedWorkout)).toBe(true);
      expect(isWorkoutCompleted(inProgressWorkout)).toBe(false);
    });

    it('should identify working sets', () => {
      const workingSet = { ...validSetData, type: 'normal' as const };
      const warmupSet = { ...validSetData, type: 'warmup' as const };
      
      expect(isWorkingSet(workingSet)).toBe(true);
      expect(isWorkingSet(warmupSet)).toBe(false);
    });
  });

  describe('display functions', () => {
    it('should return correct set type displays', () => {
      expect(getSetTypeDisplay('normal')).toBe('Working Set');
      expect(getSetTypeDisplay('warmup')).toBe('Warm-up');
      expect(getSetTypeDisplay('failure')).toBe('To Failure');
      expect(getSetTypeDisplay('dropset')).toBe('Drop Set');
      expect(getSetTypeDisplay('unknown')).toBe('unknown');
    });

    it('should return correct workout status displays', () => {
      expect(getWorkoutStatusDisplay('planned')).toBe('Planned');
      expect(getWorkoutStatusDisplay('in_progress')).toBe('In Progress');
      expect(getWorkoutStatusDisplay('completed')).toBe('Completed');
      expect(getWorkoutStatusDisplay('cancelled')).toBe('Cancelled');
      expect(getWorkoutStatusDisplay('paused')).toBe('Paused');
      expect(getWorkoutStatusDisplay('unknown')).toBe('unknown');
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', () => {
      const result = validateWorkout(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle transformation errors gracefully', () => {
      const result = transformWorkoutData(null);
      
      expect(result).toBeNull();
    });
  });
});