import { describe, it, expect } from 'vitest';
import {
  SetDataSchema,
  WorkoutExerciseSchema,
  WorkoutSchema,
  WorkoutTemplateSchema,
  WorkoutCreateSchema,
  SetCreateSchema,
  WorkoutFilterSchema,
} from '../workout';

describe('workout schemas', () => {
  describe('SetDataSchema', () => {
    const validSetData = {
      id: 'set-1',
      set_number: 1,
      type: 'normal',
      weight: 100,
      reps: 10,
      completed: true,
      planned_rest_time: 90,
    };

    it('should validate correct set data', () => {
      const result = SetDataSchema.safeParse(validSetData);
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const { id, ...dataWithoutId } = validSetData;
      const result = SetDataSchema.safeParse(dataWithoutId);
      expect(result.success).toBe(false);
    });

    it('should require positive set_number', () => {
      const invalidData = { ...validSetData, set_number: 0 };
      const result = SetDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate all set types', () => {
      const setTypes = ['normal', 'warmup', 'failure', 'dropset', 'restpause', 'cluster', 'myorep', 'amrap', 'tempo', 'isometric'];
      
      setTypes.forEach(type => {
        const data = { ...validSetData, type };
        const result = SetDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid set type', () => {
      const invalidData = { ...validSetData, type: 'invalid_type' };
      const result = SetDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require non-negative weight', () => {
      const invalidData = { ...validSetData, weight: -10 };
      const result = SetDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require non-negative reps', () => {
      const invalidData = { ...validSetData, reps: -5 };
      const result = SetDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate RPE range 1-10', () => {
      const validRPEs = [1, 5, 10];
      const invalidRPEs = [0, 11, -1];

      validRPEs.forEach(rpe => {
        const data = { ...validSetData, rpe };
        const result = SetDataSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      invalidRPEs.forEach(rpe => {
        const data = { ...validSetData, rpe };
        const result = SetDataSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should accept optional fields', () => {
      const dataWithOptionals = {
        ...validSetData,
        rpe: 8,
        distance: 1000,
        duration: 60,
        rest_time: 120,
        drop_weight: 80,
        cluster_reps: [5, 3, 2],
        tempo: '3-1-2-1',
        hold_duration: 30,
        notes: 'Good set',
        difficulty_rating: 4,
        started_at: new Date(),
        ended_at: new Date(),
        completed_at: new Date(),
      };

      const result = SetDataSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkoutExerciseSchema', () => {
    const validExerciseData = {
      id: 'exercise-1',
      exercise_id: 'bench-press',
      order: 0,
      sets: [{
        id: 'set-1',
        set_number: 1,
        type: 'normal',
        weight: 100,
        reps: 10,
        completed: true,
      }],
    };

    it('should validate correct exercise data', () => {
      const result = WorkoutExerciseSchema.safeParse(validExerciseData);
      expect(result.success).toBe(true);
    });

    it('should require at least one set', () => {
      const invalidData = { ...validExerciseData, sets: [] };
      const result = WorkoutExerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require non-negative order', () => {
      const invalidData = { ...validExerciseData, order: -1 };
      const result = WorkoutExerciseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const dataWithOptionals = {
        ...validExerciseData,
        rest_time: 90,
        notes: 'Good exercise',
        superset_id: 'superset-1',
        circuit_id: 'circuit-1',
        target_sets: 3,
        target_reps: 10,
        target_weight: 100,
        target_rpe: 8,
        started_at: new Date(),
        completed_at: new Date(),
      };

      const result = WorkoutExerciseSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkoutSchema', () => {
    const validWorkoutData = {
      id: 'workout-1',
      user_id: 'user-1',
      name: 'Test Workout',
      status: 'completed',
      is_template: false,
      exercises: [{
        id: 'exercise-1',
        exercise_id: 'bench-press',
        order: 0,
        sets: [{
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 100,
          reps: 10,
          completed: true,
        }],
      }],
      auto_rest_timer: true,
      default_rest_time: 90,
      is_public: false,
      created_at: new Date(),
    };

    it('should validate correct workout data', () => {
      const result = WorkoutSchema.safeParse(validWorkoutData);
      expect(result.success).toBe(true);
    });

    it('should require non-empty name', () => {
      const invalidData = { ...validWorkoutData, name: '' };
      const result = WorkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate workout status', () => {
      const validStatuses = ['planned', 'in_progress', 'completed', 'cancelled', 'paused'];
      
      validStatuses.forEach(status => {
        const data = { ...validWorkoutData, status };
        const result = WorkoutSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid workout status', () => {
      const invalidData = { ...validWorkoutData, status: 'invalid_status' };
      const result = WorkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should limit name length', () => {
      const longName = 'a'.repeat(101);
      const invalidData = { ...validWorkoutData, name: longName };
      const result = WorkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should limit description length', () => {
      const longDescription = 'a'.repeat(501);
      const invalidData = { ...validWorkoutData, description: longDescription };
      const result = WorkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept all optional fields', () => {
      const dataWithOptionals = {
        ...validWorkoutData,
        description: 'Test description',
        template_id: 'template-1',
        template_name: 'Template Name',
        scheduled_date: new Date(),
        started_at: new Date(),
        completed_at: new Date(),
        paused_at: new Date(),
        total_duration: 3600,
        total_volume: 5000,
        total_sets: 10,
        total_reps: 100,
        difficulty_rating: 4,
        energy_level: 3,
        mood_rating: 5,
        notes: 'Great workout',
        location: 'Home Gym',
        weather: 'Sunny',
        shared_with: ['user-2', 'user-3'],
        updated_at: new Date(),
      };

      const result = WorkoutSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkoutTemplateSchema', () => {
    const validTemplateData = {
      id: 'template-1',
      user_id: 'user-1',
      name: 'Push Day Template',
      status: 'planned',
      is_template: true,
      exercises: [{
        id: 'exercise-1',
        exercise_id: 'bench-press',
        order: 0,
        sets: [{
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 100,
          reps: 10,
          completed: false,
        }],
      }],
      auto_rest_timer: true,
      default_rest_time: 90,
      is_public: false,
      created_at: new Date(),
      times_used: 0,
      is_public_template: false,
    };

    it('should validate correct template data', () => {
      const result = WorkoutTemplateSchema.safeParse(validTemplateData);
      expect(result.success).toBe(true);
    });

    it('should require is_template to be true', () => {
      const invalidData = { ...validTemplateData, is_template: false };
      const result = WorkoutTemplateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require status to be planned', () => {
      const invalidData = { ...validTemplateData, status: 'completed' };
      const result = WorkoutTemplateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept template-specific fields', () => {
      const dataWithTemplateFields = {
        ...validTemplateData,
        category: 'Push',
        difficulty_level: 3,
        estimated_duration: 60,
        equipment_needed: ['barbell', 'dumbbell'],
        last_used: new Date(),
        created_by: 'user-1',
        tags: ['push', 'upper_body'],
      };

      const result = WorkoutTemplateSchema.safeParse(dataWithTemplateFields);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkoutCreateSchema', () => {
    const validCreateData = {
      user_id: 'user-1',
      name: 'New Workout',
      status: 'planned',
      is_template: false,
      exercises: [{
        id: 'exercise-1',
        exercise_id: 'bench-press',
        order: 0,
        sets: [{
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 100,
          reps: 10,
          completed: false,
        }],
      }],
      auto_rest_timer: true,
      default_rest_time: 90,
      is_public: false,
    };

    it('should validate workout creation data', () => {
      const result = WorkoutCreateSchema.safeParse(validCreateData);
      expect(result.success).toBe(true);
    });

    it('should not require id, created_at, or calculated fields', () => {
      // These fields should be omitted from create schema
      const dataWithExtraFields = {
        ...validCreateData,
        id: 'workout-1',
        created_at: new Date(),
        total_volume: 1000,
      };

      const result = WorkoutCreateSchema.safeParse(dataWithExtraFields);
      // Should still pass but extra fields should be ignored
      expect(result.success).toBe(true);
    });
  });

  describe('SetCreateSchema', () => {
    const validSetCreateData = {
      set_number: 1,
      type: 'normal',
      weight: 100,
      reps: 10,
      completed: false,
      planned_rest_time: 90,
    };

    it('should validate set creation data', () => {
      const result = SetCreateSchema.safeParse(validSetCreateData);
      expect(result.success).toBe(true);
    });

    it('should not require id or timestamp fields', () => {
      const dataWithExtraFields = {
        ...validSetCreateData,
        id: 'set-1',
        completed_at: new Date(),
        started_at: new Date(),
      };

      const result = SetCreateSchema.safeParse(dataWithExtraFields);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkoutFilterSchema', () => {
    it('should validate empty filter', () => {
      const result = WorkoutFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate complete filter', () => {
      const filterData = {
        user_id: 'user-1',
        status: 'completed',
        is_template: false,
        template_id: 'template-1',
        date_from: new Date('2025-01-01'),
        date_to: new Date('2025-01-31'),
        exercise_ids: ['bench-press', 'squats'],
        location: 'Home Gym',
        difficulty_rating: [3, 4, 5],
        tags: ['push', 'legs'],
      };

      const result = WorkoutFilterSchema.safeParse(filterData);
      expect(result.success).toBe(true);
    });

    it('should validate partial filter', () => {
      const filterData = {
        status: 'in_progress',
        is_template: true,
      };

      const result = WorkoutFilterSchema.safeParse(filterData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status in filter', () => {
      const filterData = {
        status: 'invalid_status',
      };

      const result = WorkoutFilterSchema.safeParse(filterData);
      expect(result.success).toBe(false);
    });

    it('should validate difficulty rating arrays', () => {
      const validRatings = [[1], [1, 2, 3], [5]];
      const invalidRatings = [[0], [6], [-1, 2]];

      validRatings.forEach(difficulty_rating => {
        const filterData = { difficulty_rating };
        const result = WorkoutFilterSchema.safeParse(filterData);
        expect(result.success).toBe(true);
      });

      invalidRatings.forEach(difficulty_rating => {
        const filterData = { difficulty_rating };
        const result = WorkoutFilterSchema.safeParse(filterData);
        expect(result.success).toBe(false);
      });
    });
  });
});