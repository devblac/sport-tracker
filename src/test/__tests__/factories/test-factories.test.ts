/**
 * Test Factory Validation Tests
 * 
 * Comprehensive tests to ensure all test factories generate valid data
 * that matches production schemas and handles edge cases correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  UserFactory, ExerciseFactory, WorkoutFactory, SetFactory, SocialFactory, AchievementFactory,
  BatchFactories, ScenarioFactories
} from '../../test-factories';
import {
  BoundaryFactories, ErrorScenarioFactories, PerformanceTestFactories,
  ConcurrencyTestFactories, AccessibilityTestFactories
} from '../../edge-case-factories';
import {
  ValidatedFactories, SchemaComplianceTests, SchemaValidator
} from '../../schema-validation-factories';
import {
  UserSchema, ExerciseSchema, WorkoutSchema, SetDataSchema
} from '@/schemas';

describe('Test Factories', () => {
  describe('UserFactory', () => {
    it('should create valid users', () => {
      const user = UserFactory.create();
      
      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.username).toBeTruthy();
      expect(user.profile).toBeDefined();
      expect(user.settings).toBeDefined();
      expect(user.gamification).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
    });

    it('should create guest users', () => {
      const guest = UserFactory.createGuest();
      
      expect(guest.role).toBe('guest');
      expect(guest.username).toBe('guest');
      expect(guest.gamification.level).toBe(1);
      expect(guest.gamification.total_xp).toBe(0);
    });

    it('should create premium users', () => {
      const premium = UserFactory.createPremium();
      
      expect(premium.role).toBe('premium');
      expect(premium.gamification.level).toBeGreaterThanOrEqual(10);
      expect(premium.gamification.total_xp).toBeGreaterThanOrEqual(5000);
    });

    it('should create newbie users', () => {
      const newbie = UserFactory.createNewbie();
      
      expect(newbie.profile.fitness_level).toBe('beginner');
      expect(newbie.gamification.level).toBe(1);
      expect(newbie.gamification.current_streak).toBeLessThanOrEqual(7);
    });

    it('should create veteran users', () => {
      const veteran = UserFactory.createVeteran();
      
      expect(veteran.profile.fitness_level).toBe('expert');
      expect(veteran.gamification.level).toBeGreaterThanOrEqual(30);
      expect(veteran.gamification.current_streak).toBeGreaterThanOrEqual(50);
    });

    it('should apply overrides correctly', () => {
      const customUser = UserFactory.create({
        username: 'custom_user',
        role: 'premium'
      });
      
      expect(customUser.username).toBe('custom_user');
      expect(customUser.role).toBe('premium');
    });
  });

  describe('ExerciseFactory', () => {
    it('should create valid exercises', () => {
      const exercise = ExerciseFactory.create();
      
      expect(exercise).toBeDefined();
      expect(exercise.id).toBeTruthy();
      expect(exercise.name).toBeTruthy();
      expect(exercise.body_parts).toBeInstanceOf(Array);
      expect(exercise.muscle_groups).toBeInstanceOf(Array);
      expect(exercise.instructions).toBeInstanceOf(Array);
      expect(exercise.instructions.length).toBeGreaterThan(0);
    });

    it('should create bodyweight exercises', () => {
      const exercise = ExerciseFactory.createBodyweight();
      
      expect(exercise.type).toBe('bodyweight');
      expect(exercise.equipment).toBe('none');
    });

    it('should create barbell exercises', () => {
      const exercise = ExerciseFactory.createBarbell();
      
      expect(exercise.type).toBe('barbell');
      expect(exercise.equipment).toBe('barbell');
    });

    it('should create cardio exercises', () => {
      const exercise = ExerciseFactory.createCardio();
      
      expect(exercise.category).toBe('cardio');
      expect(exercise.type).toBe('machine');
    });
  });

  describe('WorkoutFactory', () => {
    it('should create valid workouts', () => {
      const workout = WorkoutFactory.create();
      
      expect(workout).toBeDefined();
      expect(workout.id).toBeTruthy();
      expect(workout.user_id).toBeTruthy();
      expect(workout.name).toBeTruthy();
      expect(workout.exercises).toBeInstanceOf(Array);
      expect(workout.created_at).toBeInstanceOf(Date);
    });

    it('should create workout templates', () => {
      const template = WorkoutFactory.createTemplate();
      
      expect(template.is_template).toBe(true);
      expect(template.status).toBe('planned');
      expect(template.started_at).toBeUndefined();
      expect(template.completed_at).toBeUndefined();
    });

    it('should create in-progress workouts', () => {
      const workout = WorkoutFactory.createInProgress();
      
      expect(workout.status).toBe('in_progress');
      expect(workout.started_at).toBeInstanceOf(Date);
      expect(workout.completed_at).toBeUndefined();
    });

    it('should create completed workouts', () => {
      const workout = WorkoutFactory.createCompleted();
      
      expect(workout.status).toBe('completed');
      expect(workout.started_at).toBeInstanceOf(Date);
      expect(workout.completed_at).toBeInstanceOf(Date);
      expect(workout.total_duration).toBeGreaterThan(0);
    });
  });

  describe('SetFactory', () => {
    it('should create valid sets', () => {
      const set = SetFactory.create();
      
      expect(set).toBeDefined();
      expect(set.id).toBeTruthy();
      expect(set.set_number).toBeGreaterThan(0);
      expect(set.weight).toBeGreaterThanOrEqual(0);
      expect(set.reps).toBeGreaterThanOrEqual(0);
    });

    it('should create warmup sets', () => {
      const set = SetFactory.createWarmup();
      
      expect(set.type).toBe('warmup');
      expect(set.rpe).toBeLessThanOrEqual(6);
    });

    it('should create failure sets', () => {
      const set = SetFactory.createFailure();
      
      expect(set.type).toBe('failure');
      expect(set.rpe).toBe(10);
    });

    it('should create dropsets', () => {
      const set = SetFactory.createDropset();
      
      expect(set.type).toBe('dropset');
      expect(set.drop_weight).toBeGreaterThan(0);
    });
  });

  describe('SocialFactory', () => {
    it('should create valid social posts', () => {
      const post = SocialFactory.createPost();
      
      expect(post).toBeDefined();
      expect(post.id).toBeTruthy();
      expect(post.userId).toBeTruthy();
      expect(post.type).toBeTruthy();
      expect(post.timestamp).toBeInstanceOf(Date);
      expect(post.user).toBeDefined();
    });

    it('should create valid friends', () => {
      const friend = SocialFactory.createFriend();
      
      expect(friend).toBeDefined();
      expect(friend.id).toBeTruthy();
      expect(friend.userId).toBeTruthy();
      expect(friend.friendId).toBeTruthy();
      expect(friend.friend).toBeDefined();
      expect(friend.connectionStrength).toBeGreaterThanOrEqual(0);
      expect(friend.connectionStrength).toBeLessThanOrEqual(100);
    });

    it('should create valid comments', () => {
      const comment = SocialFactory.createComment();
      
      expect(comment).toBeDefined();
      expect(comment.id).toBeTruthy();
      expect(comment.content).toBeTruthy();
      expect(comment.user).toBeDefined();
      expect(comment.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('AchievementFactory', () => {
    it('should create valid achievements', () => {
      const achievement = AchievementFactory.create();
      
      expect(achievement).toBeDefined();
      expect(achievement.id).toBeTruthy();
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.requirements).toBeInstanceOf(Array);
      expect(achievement.requirements.length).toBeGreaterThan(0);
      expect(achievement.xp_reward).toBeGreaterThan(0);
    });

    it('should create common achievements', () => {
      const achievement = AchievementFactory.createCommon();
      
      expect(achievement.rarity).toBe('common');
      expect(achievement.xp_reward).toBeLessThanOrEqual(100);
    });

    it('should create legendary achievements', () => {
      const achievement = AchievementFactory.createLegendary();
      
      expect(achievement.rarity).toBe('legendary');
      expect(achievement.xp_reward).toBeGreaterThanOrEqual(500);
    });
  });

  describe('BatchFactories', () => {
    it('should create multiple users', () => {
      const users = BatchFactories.users(5);
      
      expect(users).toHaveLength(5);
      expect(users.every(user => user.id && user.username)).toBe(true);
    });

    it('should create multiple exercises', () => {
      const exercises = BatchFactories.exercises(3);
      
      expect(exercises).toHaveLength(3);
      expect(exercises.every(ex => ex.id && ex.name)).toBe(true);
    });

    it('should create multiple workouts', () => {
      const workouts = BatchFactories.workouts(4);
      
      expect(workouts).toHaveLength(4);
      expect(workouts.every(w => w.id && w.name)).toBe(true);
    });
  });

  describe('ScenarioFactories', () => {
    it('should create complete workout flow scenario', () => {
      const scenario = ScenarioFactories.completeWorkoutFlow();
      
      expect(scenario.user).toBeDefined();
      expect(scenario.exercises).toBeInstanceOf(Array);
      expect(scenario.workout).toBeDefined();
      expect(scenario.workout.user_id).toBe(scenario.user.id);
    });

    it('should create social interaction scenario', () => {
      const scenario = ScenarioFactories.socialInteraction();
      
      expect(scenario.users).toHaveLength(3);
      expect(scenario.friendships).toBeInstanceOf(Array);
      expect(scenario.posts).toBeInstanceOf(Array);
    });

    it('should create gamification progression scenario', () => {
      const scenario = ScenarioFactories.gamificationProgression();
      
      expect(scenario.user).toBeDefined();
      expect(scenario.achievements).toBeInstanceOf(Array);
      expect(scenario.workouts).toBeInstanceOf(Array);
      expect(scenario.workouts.every(w => w.user_id === scenario.user.id)).toBe(true);
    });

    it('should create edge case validation scenario', () => {
      const scenario = ScenarioFactories.edgeCaseValidation();
      
      expect(scenario.minimalUser).toBeDefined();
      expect(scenario.maximalUser).toBeDefined();
      expect(scenario.emptyWorkout).toBeDefined();
      expect(scenario.complexExercise).toBeDefined();
      expect(scenario.privatePost).toBeDefined();
      expect(scenario.blockedFriend).toBeDefined();
    });
  });
});

describe('Edge Case Factories', () => {
  describe('BoundaryFactories', () => {
    it('should create minimal boundary users', () => {
      const user = BoundaryFactories.users.minimal();
      
      expect(user.username).toHaveLength(3);
      expect(user.profile.display_name).toHaveLength(1);
      expect(user.profile.goals).toHaveLength(1);
      expect(user.profile.scheduled_days).toHaveLength(1);
    });

    it('should create maximal boundary users', () => {
      const user = BoundaryFactories.users.maximal();
      
      expect(user.username).toHaveLength(30);
      expect(user.profile.display_name).toHaveLength(50);
      expect(user.profile.bio).toHaveLength(500);
      expect(user.profile.goals).toHaveLength(10);
    });

    it('should create minimal boundary exercises', () => {
      const exercise = BoundaryFactories.exercises.minimal();
      
      expect(exercise.name).toHaveLength(1);
      expect(exercise.body_parts).toHaveLength(1);
      expect(exercise.muscle_groups).toHaveLength(1);
      expect(exercise.instructions).toHaveLength(1);
    });

    it('should create empty boundary workouts', () => {
      const workout = BoundaryFactories.workouts.empty();
      
      expect(workout.exercises).toHaveLength(0);
      expect(workout.total_duration).toBe(0);
      expect(workout.total_volume).toBe(0);
    });
  });

  describe('ErrorScenarioFactories', () => {
    it('should create invalid data scenarios', () => {
      const invalidEmail = ErrorScenarioFactories.invalidData.invalidEmail();
      const shortUsername = ErrorScenarioFactories.invalidData.shortUsername();
      const emptyExercise = ErrorScenarioFactories.invalidData.emptyExerciseName();
      
      expect(invalidEmail.email).toBe('not-an-email');
      expect(shortUsername.username).toHaveLength(2);
      expect(emptyExercise.name).toBe('');
    });

    it('should create error condition scenarios', () => {
      const networkError = ErrorScenarioFactories.errorConditions.networkTimeout();
      const serverError = ErrorScenarioFactories.errorConditions.serverError();
      const validationError = ErrorScenarioFactories.errorConditions.validationError();
      
      expect(networkError.code).toBe(408);
      expect(serverError.code).toBe(500);
      expect(validationError.code).toBe(400);
    });
  });

  describe('PerformanceTestFactories', () => {
    it('should create large datasets', () => {
      const manyUsers = PerformanceTestFactories.largeDatasets.manyUsers(100);
      const manyExercises = PerformanceTestFactories.largeDatasets.manyExercises(50);
      
      expect(manyUsers).toHaveLength(100);
      expect(manyExercises).toHaveLength(50);
    });

    it('should create memory intensive data', () => {
      const deepWorkout = PerformanceTestFactories.memoryIntensive.deepNestedWorkout();
      const heavyUser = PerformanceTestFactories.memoryIntensive.dataHeavyUser();
      
      expect(deepWorkout.exercises).toHaveLength(20);
      expect(deepWorkout.exercises[0].sets).toHaveLength(10);
      expect(heavyUser.profile.bio).toHaveLength(500);
    });
  });

  describe('AccessibilityTestFactories', () => {
    it('should create accessibility test scenarios', () => {
      const a11yUser = AccessibilityTestFactories.a11y.accessibilityUser();
      const challengingContent = AccessibilityTestFactories.a11y.challengingContent();
      
      expect(a11yUser.settings.theme).toBe('dark');
      expect(challengingContent.workout.name).toContain('🏋️‍♂️');
      expect(challengingContent.socialPost.data.emojis).toBeInstanceOf(Array);
    });
  });
});

describe('Schema Validation Factories', () => {
  describe('ValidatedUserFactory', () => {
    it('should always create schema-compliant users', () => {
      for (let i = 0; i < 10; i++) {
        const user = ValidatedFactories.User.create();
        const result = SchemaValidator.validate(UserSchema, user);
        
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error('Validation errors:', result.errors?.issues);
        }
      }
    });

    it('should create valid registration data', () => {
      const registration = ValidatedFactories.User.createRegistration();
      
      expect(registration.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(registration.username).toMatch(/^[a-zA-Z0-9_-]{3,30}$/);
      expect(registration.password).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/);
    });

    it('should pass all validation cases', () => {
      const results = SchemaComplianceTests.testAllValidationCases(
        ValidatedFactories.User.validationCases,
        UserSchema
      );
      
      Object.entries(results).forEach(([caseName, result]) => {
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error(`${caseName} validation errors:`, result.errors);
        }
      });
    });
  });

  describe('ValidatedExerciseFactory', () => {
    it('should always create schema-compliant exercises', () => {
      for (let i = 0; i < 10; i++) {
        const exercise = ValidatedFactories.Exercise.create();
        const result = SchemaValidator.validate(ExerciseSchema, exercise);
        
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error('Validation errors:', result.errors?.issues);
        }
      }
    });

    it('should pass all validation cases', () => {
      const results = SchemaComplianceTests.testAllValidationCases(
        ValidatedFactories.Exercise.validationCases,
        ExerciseSchema
      );
      
      Object.entries(results).forEach(([caseName, result]) => {
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error(`${caseName} validation errors:`, result.errors);
        }
      });
    });
  });

  describe('ValidatedWorkoutFactory', () => {
    it('should always create schema-compliant workouts', () => {
      for (let i = 0; i < 10; i++) {
        const workout = ValidatedFactories.Workout.create();
        const result = SchemaValidator.validate(WorkoutSchema, workout);
        
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error('Validation errors:', result.errors?.issues);
        }
      }
    });

    it('should pass all validation cases', () => {
      const results = SchemaComplianceTests.testAllValidationCases(
        ValidatedFactories.Workout.validationCases,
        WorkoutSchema
      );
      
      Object.entries(results).forEach(([caseName, result]) => {
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error(`${caseName} validation errors:`, result.errors);
        }
      });
    });
  });

  describe('ValidatedSetFactory', () => {
    it('should always create schema-compliant sets', () => {
      for (let i = 0; i < 10; i++) {
        const set = ValidatedFactories.Set.create();
        const result = SchemaValidator.validate(SetDataSchema, set);
        
        expect(result.success).toBe(true);
        if (!result.success) {
          console.error('Validation errors:', result.errors?.issues);
        }
      }
    });

    it('should pass all validation cases', () => {
      const results = SchemaComplianceTests.testAllValidationCases(
        ValidatedFactories.Set.validationCases,
        SetDataSchema
      );
      
      Object.entries(results).forEach(([caseName, result]) => {
        if (!result.success) {
          console.error(`Set ${caseName} validation errors:`, result.errors);
        }
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Factory Performance', () => {
  it('should generate data efficiently', () => {
    const startTime = performance.now();
    
    // Generate a reasonable amount of test data
    const users = BatchFactories.users(100);
    const exercises = BatchFactories.exercises(50);
    const workouts = BatchFactories.workouts(20);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(users).toHaveLength(100);
    expect(exercises).toHaveLength(50);
    expect(workouts).toHaveLength(20);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle large batch generation', () => {
    const startTime = performance.now();
    
    const largeUserBatch = BatchFactories.users(1000);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(largeUserBatch).toHaveLength(1000);
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});

describe('Factory Consistency', () => {
  it('should generate consistent data structure', () => {
    const users = BatchFactories.users(10);
    
    // All users should have the same structure
    const firstUserKeys = Object.keys(users[0]).sort();
    
    users.forEach(user => {
      const userKeys = Object.keys(user).sort();
      expect(userKeys).toEqual(firstUserKeys);
    });
  });

  it('should respect overrides consistently', () => {
    const customRole = 'premium';
    const users = Array.from({ length: 5 }, () => 
      UserFactory.create({ role: customRole })
    );
    
    users.forEach(user => {
      expect(user.role).toBe(customRole);
    });
  });
});