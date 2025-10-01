/**
 * Edge Case Test Factories
 * 
 * Specialized factories for testing boundary conditions, error scenarios,
 * and edge cases that might break the application.
 */

import type {
  User, Exercise, Workout, SetData, SocialActivity, GymFriend
} from '@/types';
import { UserFactory, ExerciseFactory, WorkoutFactory, SetFactory, SocialFactory } from './test-factories';

// ============================================================================
// Boundary Value Factories
// ============================================================================

export class BoundaryFactories {
  /**
   * Creates users at the extreme boundaries of valid values
   */
  static users = {
    // Minimum valid values
    minimal: (): User => UserFactory.create({
      username: 'abc', // 3 chars minimum
      profile: {
        display_name: 'A', // 1 char minimum
        bio: undefined,
        goals: ['general_fitness'], // 1 goal minimum
        scheduled_days: ['monday'], // 1 day minimum
        height: 100, // Minimum reasonable height
        weight: 30 // Minimum reasonable weight
      },
      gamification: {
        level: 1,
        total_xp: 0,
        current_streak: 0,
        best_streak: 0,
        sick_days_used: 0,
        last_sick_day_reset: new Date(),
        achievements_unlocked: []
      }
    }),

    // Maximum valid values
    maximal: (): User => UserFactory.create({
      username: 'a'.repeat(30), // 30 chars maximum
      profile: {
        display_name: 'A'.repeat(50), // 50 chars maximum
        bio: 'A'.repeat(500), // 500 chars maximum
        goals: Array.from({ length: 10 }, (_, i) => `goal_${i}`), // 10 goals maximum
        scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        height: 250, // Maximum reasonable height
        weight: 200 // Maximum reasonable weight
      },
      gamification: {
        level: 100,
        total_xp: 1000000,
        current_streak: 1000,
        best_streak: 2000,
        sick_days_used: 12, // Maximum sick days
        last_sick_day_reset: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        achievements_unlocked: Array.from({ length: 100 }, (_, i) => `achievement_${i}`)
      }
    }),

    // Edge case: User with special characters
    specialCharacters: (): User => UserFactory.create({
      username: 'user_123-test',
      profile: {
        display_name: 'Test User with Émojis 🏋️‍♂️',
        bio: 'Bio with special chars: àáâãäåæçèéêë & symbols !@#$%^&*()',
        location: 'São Paulo, Brazil 🇧🇷'
      }
    }),

    // Edge case: User with exactly boundary values
    exactBoundary: (): User => UserFactory.create({
      username: 'a'.repeat(3), // Exactly 3 chars
      profile: {
        display_name: 'A'.repeat(1), // Exactly 1 char
        bio: 'A'.repeat(500), // Exactly 500 chars
        goals: ['fitness'] // Exactly 1 goal
      }
    })
  };

  /**
   * Creates exercises at boundary conditions
   */
  static exercises = {
    minimal: (): Exercise => ExerciseFactory.create({
      name: 'A', // Minimum name length
      body_parts: ['chest'], // Minimum body parts
      muscle_groups: ['pectorals'], // Minimum muscle groups
      difficulty_level: 1, // Minimum difficulty
      instructions: [{
        step_number: 1,
        instruction: 'Do it.' // Minimal instruction
      }],
      tips: [], // No tips
      variations: [], // No variations
      tags: [], // No tags
      aliases: [] // No aliases
    }),

    maximal: (): Exercise => ExerciseFactory.create({
      name: 'A'.repeat(100), // Maximum name length
      body_parts: ['chest', 'shoulders', 'arms', 'core', 'legs'], // Many body parts
      muscle_groups: ['pectorals', 'deltoids', 'triceps_brachii', 'rectus_abdominis', 'quadriceps_femoris'],
      difficulty_level: 5, // Maximum difficulty
      instructions: Array.from({ length: 20 }, (_, i) => ({
        step_number: i + 1,
        instruction: `Very detailed instruction step ${i + 1} with comprehensive explanation of proper form and technique.`,
        image_url: `https://example.com/instruction_${i + 1}.jpg`
      })),
      tips: Array.from({ length: 10 }, (_, i) => ({
        category: ['form', 'breathing', 'safety', 'progression', 'common_mistakes'][i % 5] as any,
        tip: `Advanced tip ${i + 1} for optimal performance and injury prevention.`
      })),
      variations: Array.from({ length: 8 }, (_, i) => ({
        name: `Advanced Variation ${i + 1}`,
        description: `Complex variation that significantly modifies the exercise mechanics and difficulty.`,
        difficulty_modifier: 2
      })),
      tags: Array.from({ length: 20 }, (_, i) => `tag_${i + 1}`),
      aliases: Array.from({ length: 10 }, (_, i) => `alias_${i + 1}`)
    })
  };

  /**
   * Creates workouts at boundary conditions
   */
  static workouts = {
    empty: (): Workout => WorkoutFactory.create({
      name: 'Empty',
      exercises: [],
      total_duration: 0,
      total_volume: 0,
      total_sets: 0,
      total_reps: 0
    }),

    maximal: (): Workout => WorkoutFactory.create({
      name: 'A'.repeat(100), // Maximum name length
      description: 'A'.repeat(500), // Maximum description length
      exercises: Array.from({ length: 50 }, (_, i) => ({
        id: `exercise_${i}`,
        exercise_id: `ex_${i}`,
        order: i,
        sets: Array.from({ length: 10 }, (_, j) => SetFactory.create({
          set_number: j + 1,
          weight: 999.99, // Maximum weight
          reps: 999, // Maximum reps
          duration: 3600 // Maximum duration (1 hour)
        })),
        rest_time: 600, // Maximum rest time
        notes: 'A'.repeat(200) // Long notes
      })),
      notes: 'A'.repeat(1000) // Maximum notes length
    }),

    singleExercise: (): Workout => WorkoutFactory.create({
      name: 'Single Exercise',
      exercises: [
        {
          id: 'single_ex',
          exercise_id: 'ex_1',
          order: 0,
          sets: [SetFactory.create({ set_number: 1 })],
          rest_time: 60
        }
      ]
    })
  };
}

// ============================================================================
// Error Scenario Factories
// ============================================================================

export class ErrorScenarioFactories {
  /**
   * Creates data that should trigger validation errors
   */
  static invalidData = {
    // User with invalid email format
    invalidEmail: () => ({
      ...UserFactory.create(),
      email: 'not-an-email'
    }),

    // User with username too short
    shortUsername: () => ({
      ...UserFactory.create(),
      username: 'ab' // Less than 3 chars
    }),

    // User with invalid characters in username
    invalidUsername: () => ({
      ...UserFactory.create(),
      username: 'user@invalid!' // Invalid characters
    }),

    // Exercise with empty name
    emptyExerciseName: () => ({
      ...ExerciseFactory.create(),
      name: ''
    }),

    // Exercise with invalid difficulty
    invalidDifficulty: () => ({
      ...ExerciseFactory.create(),
      difficulty_level: 6 // Out of range (1-5)
    }),

    // Workout with negative duration
    negativeDuration: () => ({
      ...WorkoutFactory.create(),
      total_duration: -100
    }),

    // Set with negative weight
    negativeWeight: () => ({
      ...SetFactory.create(),
      weight: -50
    }),

    // Set with zero reps
    zeroReps: () => ({
      ...SetFactory.create(),
      reps: 0
    })
  };

  /**
   * Creates data for testing error handling
   */
  static errorConditions = {
    // Network timeout simulation
    networkTimeout: () => ({
      error: 'NETWORK_TIMEOUT',
      message: 'Request timed out after 30 seconds',
      code: 408
    }),

    // Server error simulation
    serverError: () => ({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred on the server',
      code: 500
    }),

    // Validation error simulation
    validationError: () => ({
      error: 'VALIDATION_ERROR',
      message: 'The provided data is invalid',
      code: 400,
      details: {
        field: 'email',
        message: 'Invalid email format'
      }
    }),

    // Authentication error simulation
    authError: () => ({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      code: 401
    }),

    // Permission error simulation
    permissionError: () => ({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions',
      code: 403
    }),

    // Not found error simulation
    notFoundError: () => ({
      error: 'NOT_FOUND',
      message: 'The requested resource was not found',
      code: 404
    })
  };
}

// ============================================================================
// Performance Test Factories
// ============================================================================

export class PerformanceTestFactories {
  /**
   * Creates large datasets for performance testing
   */
  static largeDatasets = {
    // Large user list
    manyUsers: (count: number = 1000) => 
      Array.from({ length: count }, () => UserFactory.create()),

    // Large exercise database
    manyExercises: (count: number = 500) => 
      Array.from({ length: count }, () => ExerciseFactory.create()),

    // Large workout history
    manyWorkouts: (count: number = 200, userId?: string) => 
      Array.from({ length: count }, () => WorkoutFactory.create(
        userId ? { user_id: userId } : {}
      )),

    // Workout with many exercises
    workoutManyExercises: (exerciseCount: number = 50) => 
      WorkoutFactory.create({
        exercises: Array.from({ length: exerciseCount }, (_, i) => ({
          id: `ex_${i}`,
          exercise_id: `exercise_${i}`,
          order: i,
          sets: Array.from({ length: 5 }, (_, j) => SetFactory.create({
            set_number: j + 1
          })),
          rest_time: 90
        }))
      }),

    // Social feed with many posts
    manySocialPosts: (count: number = 1000) => 
      Array.from({ length: count }, () => SocialFactory.createPost()),

    // User with many friends
    userManyFriends: (friendCount: number = 500) => {
      const user = UserFactory.create();
      const friends = Array.from({ length: friendCount }, () => 
        SocialFactory.createFriend({ userId: user.id, status: 'accepted' })
      );
      return { user, friends };
    }
  };

  /**
   * Creates memory-intensive test data
   */
  static memoryIntensive = {
    // Deep nested workout structure
    deepNestedWorkout: () => WorkoutFactory.create({
      exercises: Array.from({ length: 20 }, (_, i) => ({
        id: `ex_${i}`,
        exercise_id: `exercise_${i}`,
        order: i,
        sets: Array.from({ length: 10 }, (_, j) => SetFactory.create({
          set_number: j + 1,
          notes: 'A'.repeat(1000), // Large notes
          cluster_reps: Array.from({ length: 20 }, () => Math.floor(Math.random() * 10) + 1)
        })),
        notes: 'B'.repeat(2000) // Large exercise notes
      })),
      notes: 'C'.repeat(5000) // Large workout notes
    }),

    // User with extensive data
    dataHeavyUser: () => UserFactory.create({
      profile: {
        ...UserFactory.create().profile,
        bio: 'A'.repeat(500),
        goals: Array.from({ length: 10 }, (_, i) => `very_long_goal_name_${i}_with_detailed_description`)
      },
      gamification: {
        level: 100,
        total_xp: 1000000,
        current_streak: 1000,
        best_streak: 2000,
        sick_days_used: 12,
        last_sick_day_reset: new Date(),
        achievements_unlocked: Array.from({ length: 100 }, (_, i) => `achievement_${i}_with_long_name`)
      }
    })
  };
}

// ============================================================================
// Concurrency Test Factories
// ============================================================================

export class ConcurrencyTestFactories {
  /**
   * Creates data for testing concurrent operations
   */
  static concurrent = {
    // Multiple users editing same workout
    conflictingWorkoutEdits: () => {
      const workout = WorkoutFactory.create();
      const user1Edit = { ...workout, name: 'User 1 Edit', updated_at: new Date() };
      const user2Edit = { ...workout, name: 'User 2 Edit', updated_at: new Date() };
      return { original: workout, user1Edit, user2Edit };
    },

    // Simultaneous friend requests
    simultaneousFriendRequests: () => {
      const user1 = UserFactory.create();
      const user2 = UserFactory.create();
      
      const request1to2 = SocialFactory.createFriend({
        userId: user1.id,
        friendId: user2.id,
        status: 'pending_sent'
      });
      
      const request2to1 = SocialFactory.createFriend({
        userId: user2.id,
        friendId: user1.id,
        status: 'pending_sent'
      });
      
      return { user1, user2, request1to2, request2to1 };
    },

    // Race condition in XP calculation
    raceConditionXP: () => {
      const user = UserFactory.create({ gamification: { ...UserFactory.create().gamification, total_xp: 1000 } });
      const workout1 = WorkoutFactory.createCompleted({ user_id: user.id });
      const workout2 = WorkoutFactory.createCompleted({ user_id: user.id });
      return { user, workout1, workout2 };
    }
  };
}

// ============================================================================
// Accessibility Test Factories
// ============================================================================

export class AccessibilityTestFactories {
  /**
   * Creates data for accessibility testing scenarios
   */
  static a11y = {
    // User with accessibility needs
    accessibilityUser: () => UserFactory.create({
      profile: {
        ...UserFactory.create().profile,
        display_name: 'Screen Reader User',
        bio: 'I use assistive technology to navigate fitness apps'
      },
      settings: {
        ...UserFactory.create().settings,
        theme: 'dark' // High contrast preference
      }
    }),

    // Content with accessibility challenges
    challengingContent: () => ({
      workout: WorkoutFactory.create({
        name: '🏋️‍♂️ Intense Workout 💪 (Advanced) 🔥',
        exercises: Array.from({ length: 5 }, (_, i) => ({
          id: `ex_${i}`,
          exercise_id: `exercise_${i}`,
          order: i,
          sets: Array.from({ length: 3 }, (_, j) => SetFactory.create({
            set_number: j + 1,
            notes: `Set ${j + 1}: Focus on form ⚠️ and breathing 🫁`
          }))
        }))
      }),
      
      socialPost: SocialFactory.createPost({
        data: {
          content: 'Just crushed my workout! 💪🔥💯 #fitness #gains #nopainnogain',
          emojis: ['💪', '🔥', '💯', '🏋️‍♂️', '💦']
        }
      })
    }),

    // Long content for screen readers
    longContent: () => ({
      exercise: ExerciseFactory.create({
        name: 'Complex Multi-Joint Compound Movement with Detailed Instructions',
        instructions: Array.from({ length: 15 }, (_, i) => ({
          step_number: i + 1,
          instruction: `Step ${i + 1}: This is a very detailed instruction that explains exactly how to perform this movement with proper form, breathing technique, and safety considerations. Pay attention to your body positioning and maintain control throughout the entire range of motion.`
        }))
      })
    })
  };
}

// ============================================================================
// Export All Edge Case Factories
// ============================================================================

// All factories are already exported as classes above
// Convenience exports for common edge cases
export const EdgeCases = {
  boundary: BoundaryFactories,
  errors: ErrorScenarioFactories,
  performance: PerformanceTestFactories,
  concurrency: ConcurrencyTestFactories,
  accessibility: AccessibilityTestFactories
};