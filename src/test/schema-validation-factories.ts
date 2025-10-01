/**
 * Schema Validation Test Factories
 * 
 * Factories that generate data guaranteed to match production Zod schemas.
 * Includes validation helpers and schema-compliant test data generation.
 */

import { z } from 'zod';
import {
  UserSchema, UserRegistrationSchema, UserLoginSchema,
  ExerciseSchema, ExerciseCreateSchema,
  WorkoutSchema, WorkoutCreateSchema, SetDataSchema,
  type User, type Exercise, type Workout, type SetData
} from '@/schemas';
import { UserFactory, ExerciseFactory, WorkoutFactory, SetFactory } from './test-factories';

// ============================================================================
// Schema Validation Helpers
// ============================================================================

export class SchemaValidator {
  /**
   * Validates data against a Zod schema and returns validation result
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  } {
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  }

  /**
   * Validates and throws if invalid (for test assertions)
   */
  static validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = this.validate(schema, data);
    
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.errors?.message}`);
    }
    
    return result.data!;
  }

  /**
   * Creates a factory function that always generates valid data
   */
  static createValidatedFactory<T>(
    schema: z.ZodSchema<T>,
    baseFactory: () => any
  ): () => T {
    return () => {
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const data = baseFactory();
          return this.validateOrThrow(schema, data);
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(`Failed to generate valid data after ${maxAttempts} attempts: ${error}`);
          }
        }
      }
      
      throw new Error('Unreachable code');
    };
  }
}

// ============================================================================
// Schema-Validated Factories
// ============================================================================

export class ValidatedUserFactory {
  /**
   * Creates a user that passes UserSchema validation
   */
  static create(overrides: Partial<User> = {}): User {
    const factory = SchemaValidator.createValidatedFactory(
      UserSchema,
      () => UserFactory.create(overrides)
    );
    return factory();
  }

  /**
   * Creates user registration data that passes validation
   */
  static createRegistration(overrides: Partial<z.infer<typeof UserRegistrationSchema>> = {}) {
    const baseData = {
      email: 'test@example.com',
      username: 'testuser123',
      password: 'TestPass123!',
      display_name: 'Test User',
      fitness_level: 'beginner' as const,
      ...overrides
    };

    return SchemaValidator.validateOrThrow(UserRegistrationSchema, baseData);
  }

  /**
   * Creates user login data that passes validation
   */
  static createLogin(overrides: Partial<z.infer<typeof UserLoginSchema>> = {}) {
    const baseData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      ...overrides
    };

    return SchemaValidator.validateOrThrow(UserLoginSchema, baseData);
  }

  /**
   * Creates users for specific validation test cases
   */
  static validationCases = {
    // Minimum valid user
    minimal: () => this.create({
      username: 'abc', // Exactly 3 chars (minimum)
      profile: {
        display_name: 'A', // Exactly 1 char (minimum)
        fitness_level: 'beginner',
        goals: ['general_fitness'], // Exactly 1 goal (minimum)
        scheduled_days: ['monday'] // Exactly 1 day (minimum)
      }
    }),

    // Maximum valid user
    maximal: () => this.create({
      username: 'a'.repeat(30), // Exactly 30 chars (maximum)
      profile: {
        display_name: 'A'.repeat(50), // Exactly 50 chars (maximum)
        bio: 'A'.repeat(500), // Exactly 500 chars (maximum)
        fitness_level: 'expert',
        goals: Array.from({ length: 10 }, (_, i) => `goal_${i}`), // Exactly 10 goals (maximum)
        scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    }),

    // User with all optional fields
    complete: () => this.create({
      email: 'complete@example.com',
      profile: {
        display_name: 'Complete User',
        bio: 'A complete user profile with all optional fields filled',
        avatar_url: 'https://example.com/avatar.jpg',
        fitness_level: 'intermediate',
        goals: ['strength', 'muscle_gain', 'endurance'],
        scheduled_days: ['monday', 'wednesday', 'friday'],
        height: 175.5,
        weight: 70.2,
        birth_date: new Date('1990-01-01'),
        location: 'New York, NY'
      }
    }),

    // User with minimal optional fields
    sparse: () => this.create({
      profile: {
        display_name: 'Sparse User',
        fitness_level: 'beginner',
        goals: ['general_fitness'],
        scheduled_days: ['monday']
        // All other optional fields undefined
      }
    })
  };
}

export class ValidatedExerciseFactory {
  /**
   * Creates an exercise that passes ExerciseSchema validation
   */
  static create(overrides: Partial<Exercise> = {}): Exercise {
    const factory = SchemaValidator.createValidatedFactory(
      ExerciseSchema,
      () => ExerciseFactory.create(overrides)
    );
    return factory();
  }

  /**
   * Creates exercise creation data that passes validation
   */
  static createForCreation(overrides: Partial<z.infer<typeof ExerciseCreateSchema>> = {}) {
    const baseData = {
      name: 'Test Exercise',
      type: 'bodyweight' as const,
      category: 'strength' as const,
      body_parts: ['chest'] as const,
      muscle_groups: ['pectorals'] as const,
      equipment: 'none' as const,
      difficulty_level: 2 as const,
      instructions: [{
        step_number: 1,
        instruction: 'Perform the exercise with proper form.'
      }],
      ...overrides
    };

    return SchemaValidator.validateOrThrow(ExerciseCreateSchema, baseData);
  }

  /**
   * Creates exercises for specific validation test cases
   */
  static validationCases = {
    // Minimum valid exercise
    minimal: () => this.create({
      name: 'A', // Minimum name length
      body_parts: ['chest'], // Minimum body parts
      muscle_groups: ['pectorals'], // Minimum muscle groups
      instructions: [{
        step_number: 1,
        instruction: 'Do it.' // Minimum instruction
      }],
      tips: [], // Empty arrays
      variations: [],
      tags: [],
      aliases: []
    }),

    // Maximum valid exercise
    maximal: () => this.create({
      name: 'A'.repeat(100), // Maximum name length
      body_parts: ['chest', 'shoulders', 'arms', 'core'],
      muscle_groups: ['pectorals', 'deltoids', 'triceps_brachii', 'rectus_abdominis'],
      instructions: Array.from({ length: 20 }, (_, i) => ({
        step_number: i + 1,
        instruction: `Detailed instruction ${i + 1} with comprehensive explanation.`,
        image_url: `https://example.com/instruction_${i + 1}.jpg`
      })),
      tips: Array.from({ length: 10 }, (_, i) => ({
        category: ['form', 'breathing', 'safety', 'progression', 'common_mistakes'][i % 5] as any,
        tip: `Advanced tip ${i + 1} for optimal performance.`
      })),
      variations: Array.from({ length: 5 }, (_, i) => ({
        name: `Variation ${i + 1}`,
        description: `Advanced variation that modifies the exercise.`,
        difficulty_modifier: 2
      })),
      tags: Array.from({ length: 10 }, (_, i) => `tag_${i + 1}`),
      aliases: Array.from({ length: 5 }, (_, i) => `alias_${i + 1}`)
    }),

    // Exercise with all difficulty levels
    allDifficulties: () => [1, 2, 3, 4, 5].map(level => 
      this.create({ 
        difficulty_level: level as any,
        name: `Level ${level} Exercise`
      })
    ),

    // Exercise with all equipment types
    allEquipment: () => [
      'none', 'barbell', 'dumbbell', 'kettlebell', 'resistance_band',
      'cable_machine', 'smith_machine', 'bench', 'pull_up_bar'
    ].map(equipment => 
      this.create({ 
        equipment: equipment as any,
        name: `${equipment} Exercise`
      })
    )
  };
}

export class ValidatedWorkoutFactory {
  /**
   * Creates a workout that passes WorkoutSchema validation
   */
  static create(overrides: Partial<Workout> = {}): Workout {
    const factory = SchemaValidator.createValidatedFactory(
      WorkoutSchema,
      () => WorkoutFactory.create(overrides)
    );
    return factory();
  }

  /**
   * Creates workout creation data that passes validation
   */
  static createForCreation(overrides: Partial<z.infer<typeof WorkoutCreateSchema>> = {}) {
    const baseData = {
      user_id: 'test-user-id',
      name: 'Test Workout',
      status: 'planned' as const,
      exercises: [],
      auto_rest_timer: true,
      default_rest_time: 90,
      is_public: false,
      created_at: new Date(),
      ...overrides
    };

    return SchemaValidator.validateOrThrow(WorkoutCreateSchema, baseData);
  }

  /**
   * Creates workouts for specific validation test cases
   */
  static validationCases = {
    // Empty workout (minimum)
    empty: () => this.create({
      name: 'Empty Workout',
      exercises: [],
      total_duration: 0,
      total_volume: 0,
      total_sets: 0,
      total_reps: 0
    }),

    // Single exercise workout
    single: () => this.create({
      name: 'Single Exercise',
      exercises: [{
        id: 'ex_1',
        exercise_id: 'exercise_1',
        order: 0,
        sets: [ValidatedSetFactory.create({ set_number: 1 })],
        rest_time: 60
      }]
    }),

    // All workout statuses
    allStatuses: () => ['planned', 'in_progress', 'completed', 'cancelled', 'paused'].map(status =>
      this.create({
        status: status as any,
        name: `${status} Workout`
      })
    ),

    // Workout with all optional fields
    complete: () => this.create({
      name: 'Complete Workout',
      description: 'A workout with all optional fields filled',
      scheduled_date: new Date(),
      started_at: new Date(),
      completed_at: new Date(),
      total_duration: 3600,
      total_volume: 5000,
      total_sets: 20,
      total_reps: 200,
      difficulty_rating: 4,
      energy_level: 3,
      mood_rating: 5,
      notes: 'Great workout with excellent form',
      location: 'Home Gym',
      weather: 'Sunny',
      is_public: true,
      shared_with: ['friend_1', 'friend_2']
    })
  };
}

export class ValidatedSetFactory {
  /**
   * Creates a set that passes SetDataSchema validation
   */
  static create(overrides: Partial<SetData> = {}): SetData {
    const factory = SchemaValidator.createValidatedFactory(
      SetDataSchema,
      () => SetFactory.create(overrides)
    );
    return factory();
  }

  /**
   * Creates sets for specific validation test cases
   */
  static validationCases = {
    // Minimum valid set
    minimal: () => this.create({
      set_number: 1,
      type: 'normal',
      weight: 0,
      reps: 0,
      completed: false
    }),

    // All set types
    allTypes: () => [
      'normal', 'warmup', 'failure', 'dropset', 'restpause', 
      'cluster', 'myorep', 'amrap', 'tempo', 'isometric'
    ].map(type => 
      this.create({ 
        type: type as any,
        set_number: 1
      })
    ),

    // Set with all optional fields
    complete: () => this.create({
      set_number: 1,
      type: 'normal',
      weight: 100,
      reps: 10,
      distance: 1000,
      duration: 60,
      rpe: 8,
      completed: true,
      completed_at: new Date(),
      skipped: false,
      rest_time: 120,
      planned_rest_time: 90,
      drop_weight: 20,
      cluster_reps: [3, 3, 4],
      tempo: '3-1-2-1',
      hold_duration: 30,
      notes: 'Perfect form on this set',
      started_at: new Date(),
      ended_at: new Date()
    }),

    // Boundary values
    boundaries: () => [
      this.create({ weight: 0, reps: 1 }),
      this.create({ weight: 50, reps: 0 }),
      this.create({ rpe: 10 }),
      this.create({ rpe: 1 }),
      this.create({ rest_time: 600 }), // 10 minutes
      this.create({ rest_time: 10 }) // 10 seconds
    ]
  };
}

// ============================================================================
// Schema Compliance Test Helpers
// ============================================================================

export class SchemaComplianceTests {
  /**
   * Tests that a factory always generates valid data
   */
  static testFactoryCompliance<T>(
    factoryFn: () => T,
    schema: z.ZodSchema<T>,
    iterations: number = 100
  ): { success: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const data = factoryFn();
        const result = SchemaValidator.validate(schema, data);
        
        if (!result.success) {
          errors.push(`Iteration ${i + 1}: ${result.errors?.message}`);
        }
      } catch (error) {
        errors.push(`Iteration ${i + 1}: Factory threw error: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Tests all validation cases for a factory
   */
  static testAllValidationCases<T>(
    validationCases: Record<string, () => T | T[]>,
    schema: z.ZodSchema<T>
  ): Record<string, { success: boolean; errors: string[] }> {
    const results: Record<string, { success: boolean; errors: string[] }> = {};
    
    for (const [caseName, caseFactory] of Object.entries(validationCases)) {
      try {
        const data = caseFactory();
        const dataArray = Array.isArray(data) ? data : [data];
        const errors: string[] = [];
        
        dataArray.forEach((item, index) => {
          const result = SchemaValidator.validate(schema, item);
          if (!result.success) {
            errors.push(`Item ${index}: ${result.errors?.message}`);
          }
        });
        
        results[caseName] = {
          success: errors.length === 0,
          errors
        };
      } catch (error) {
        results[caseName] = {
          success: false,
          errors: [`Factory error: ${error}`]
        };
      }
    }
    
    return results;
  }

  /**
   * Generates a comprehensive schema compliance report
   */
  static generateComplianceReport() {
    const report = {
      user: {
        factory: this.testFactoryCompliance(() => ValidatedUserFactory.create(), UserSchema),
        validationCases: this.testAllValidationCases(ValidatedUserFactory.validationCases, UserSchema)
      },
      exercise: {
        factory: this.testFactoryCompliance(() => ValidatedExerciseFactory.create(), ExerciseSchema),
        validationCases: this.testAllValidationCases(ValidatedExerciseFactory.validationCases, ExerciseSchema)
      },
      workout: {
        factory: this.testFactoryCompliance(() => ValidatedWorkoutFactory.create(), WorkoutSchema),
        validationCases: this.testAllValidationCases(ValidatedWorkoutFactory.validationCases, WorkoutSchema)
      },
      set: {
        factory: this.testFactoryCompliance(() => ValidatedSetFactory.create(), SetDataSchema),
        validationCases: this.testAllValidationCases(ValidatedSetFactory.validationCases, SetDataSchema)
      }
    };
    
    return report;
  }
}

// ============================================================================
// Exports
// ============================================================================

// All factories are already exported as classes above
// Convenience export for all validated factories
export const ValidatedFactories = {
  User: ValidatedUserFactory,
  Exercise: ValidatedExerciseFactory,
  Workout: ValidatedWorkoutFactory,
  Set: ValidatedSetFactory
};