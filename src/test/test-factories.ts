/**
 * Comprehensive Test Data Factories
 * 
 * Provides consistent test data generation for all test suites with schema validation.
 * Supports edge cases, boundary conditions, and realistic test scenarios.
 */

import type {
  User, UserRole, FitnessLevel, Theme, Units, ProfileVisibility, WorkoutSharing, DayOfWeek,
  Exercise, ExerciseType, ExerciseCategory, BodyPart, MuscleGroup, Equipment, DifficultyLevel,
  Workout, WorkoutExercise, SetData, SetType, WorkoutStatus,
  SocialActivity, SocialActivityType, GymFriend, FriendshipStatus, Comment,
  Achievement, AchievementRequirement
} from '@/types';

// ============================================================================
// Utility Functions
// ============================================================================

const randomId = () => `test-${Math.random().toString(36).substr(2, 9)}`;
const randomEmail = () => `test${Math.random().toString(36).substr(2, 5)}@example.com`;
const randomUsername = () => `user_${Math.random().toString(36).substr(2, 6)}`;
const randomName = () => `Test User ${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomBool = () => Math.random() > 0.5;
const randomDate = (daysAgo = 30) => new Date(Date.now() - Math.random() * 86400000 * daysAgo);
const randomFutureDate = (daysAhead = 30) => new Date(Date.now() + Math.random() * 86400000 * daysAhead);

// ============================================================================
// User Factory
// ============================================================================

export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    const baseUser: User = {
      id: randomId(),
      email: randomEmail(),
      username: randomUsername(),
      role: randomChoice(['guest', 'basic', 'premium'] as UserRole[]),
      profile: {
        display_name: randomName(),
        bio: `Test user bio for ${randomName()}. Fitness enthusiast and test data.`,
        avatar_url: `https://example.com/avatars/${randomId()}.jpg`,
        fitness_level: randomChoice(['beginner', 'intermediate', 'advanced', 'expert'] as FitnessLevel[]),
        goals: randomChoice([
          ['strength', 'muscle_gain'],
          ['weight_loss', 'endurance'],
          ['flexibility', 'general_fitness'],
          ['strength', 'endurance', 'muscle_gain']
        ]),
        scheduled_days: randomChoice([
          ['monday', 'wednesday', 'friday'],
          ['tuesday', 'thursday', 'saturday'],
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ['monday', 'wednesday', 'friday', 'sunday']
        ] as DayOfWeek[][]),
        height: randomFloat(150, 200, 1), // cm
        weight: randomFloat(50, 120, 1), // kg
        birth_date: new Date(1990 + randomInt(0, 25), randomInt(0, 11), randomInt(1, 28)),
        location: randomChoice(['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', null])
      },
      settings: {
        theme: randomChoice(['light', 'dark', 'system'] as Theme[]),
        notifications: {
          workout_reminders: randomBool(),
          social_activity: randomBool(),
          achievements: randomBool(),
          challenges: randomBool(),
          quiet_hours: {
            enabled: randomBool(),
            start: '22:00',
            end: '07:00'
          }
        },
        privacy: {
          profile_visibility: randomChoice(['public', 'friends', 'private'] as ProfileVisibility[]),
          workout_sharing: randomChoice(['public', 'friends', 'private'] as WorkoutSharing[]),
          allow_friend_requests: randomBool()
        },
        units: randomChoice(['metric', 'imperial'] as Units[])
      },
      gamification: {
        level: randomInt(1, 50),
        total_xp: randomInt(0, 25000),
        current_streak: randomInt(0, 100),
        best_streak: randomInt(0, 200),
        sick_days_used: randomInt(0, 12),
        last_sick_day_reset: randomDate(365),
        achievements_unlocked: Array.from({ length: randomInt(0, 10) }, () => randomId())
      },
      created_at: randomDate(365),
      updated_at: randomDate(30),
      last_login: randomDate(7),
      is_active: true
    };

    return { ...baseUser, ...overrides };
  }

  static createGuest(): User {
    return this.create({
      id: 'guest-user',
      email: undefined,
      username: 'guest',
      role: 'guest',
      profile: {
        ...this.create().profile,
        display_name: 'Guest User',
        bio: undefined,
        avatar_url: undefined
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
    });
  }

  static createPremium(): User {
    return this.create({
      role: 'premium',
      gamification: {
        level: randomInt(10, 50),
        total_xp: randomInt(5000, 50000),
        current_streak: randomInt(20, 100),
        best_streak: randomInt(50, 200),
        sick_days_used: randomInt(0, 5),
        last_sick_day_reset: randomDate(365),
        achievements_unlocked: Array.from({ length: randomInt(5, 20) }, () => randomId())
      }
    });
  }

  static createNewbie(): User {
    return this.create({
      profile: {
        ...this.create().profile,
        fitness_level: 'beginner',
        goals: ['general_fitness']
      },
      gamification: {
        level: 1,
        total_xp: randomInt(0, 500),
        current_streak: randomInt(0, 7),
        best_streak: randomInt(0, 10),
        sick_days_used: 0,
        last_sick_day_reset: new Date(),
        achievements_unlocked: []
      }
    });
  }

  static createVeteran(): User {
    return this.create({
      profile: {
        ...this.create().profile,
        fitness_level: 'expert',
        goals: ['strength', 'muscle_gain', 'endurance']
      },
      gamification: {
        level: randomInt(30, 50),
        total_xp: randomInt(20000, 100000),
        current_streak: randomInt(50, 200),
        best_streak: randomInt(100, 365),
        sick_days_used: randomInt(0, 8),
        last_sick_day_reset: randomDate(365),
        achievements_unlocked: Array.from({ length: randomInt(15, 30) }, () => randomId())
      }
    });
  }

  // Edge cases
  static createMinimal(): User {
    return this.create({
      profile: {
        display_name: 'Min User',
        fitness_level: 'beginner',
        goals: ['general_fitness'],
        scheduled_days: ['monday']
      }
    });
  }

  static createMaximal(): User {
    return this.create({
      profile: {
        display_name: 'Max User with Very Long Display Name That Tests Limits',
        bio: 'A'.repeat(500), // Max bio length
        fitness_level: 'expert',
        goals: Array.from({ length: 10 }, (_, i) => `goal_${i}`), // Max goals
        scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    });
  }
}

// ============================================================================
// Exercise Factory
// ============================================================================

export class ExerciseFactory {
  static create(overrides: Partial<Exercise> = {}): Exercise {
    const exerciseNames = [
      'Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Push-up', 'Overhead Press',
      'Barbell Row', 'Dumbbell Curl', 'Tricep Dip', 'Plank', 'Lunges', 'Burpees'
    ];

    const baseExercise: Exercise = {
      id: randomId(),
      name: randomChoice(exerciseNames),
      type: randomChoice(['machine', 'dumbbell', 'barbell', 'bodyweight', 'cable'] as ExerciseType[]),
      category: randomChoice(['strength', 'cardio', 'flexibility', 'balance'] as ExerciseCategory[]),
      body_parts: randomChoice([
        ['chest'], ['back'], ['legs'], ['shoulders'], ['arms'],
        ['chest', 'shoulders'], ['legs', 'glutes'], ['back', 'arms']
      ] as BodyPart[][]),
      muscle_groups: randomChoice([
        ['pectorals'], ['latissimus_dorsi'], ['quadriceps'], ['deltoids'],
        ['pectorals', 'deltoids'], ['quadriceps', 'gluteus_maximus']
      ] as MuscleGroup[][]),
      equipment: randomChoice([
        'none', 'barbell', 'dumbbell', 'cable_machine', 'bench', 'pull_up_bar'
      ] as Equipment[]),
      difficulty_level: randomChoice([1, 2, 3, 4, 5] as DifficultyLevel[]),
      instructions: Array.from({ length: randomInt(3, 6) }, (_, i) => ({
        step_number: i + 1,
        instruction: `Step ${i + 1}: Perform the movement with proper form and control.`,
        image_url: `https://example.com/instructions/${randomId()}.jpg`
      })),
      tips: Array.from({ length: randomInt(2, 5) }, () => ({
        category: randomChoice(['form', 'breathing', 'safety', 'progression'] as const),
        tip: 'Focus on proper form and controlled movement throughout the exercise.'
      })),
      variations: Array.from({ length: randomInt(0, 3) }, () => ({
        name: `${randomChoice(['Incline', 'Decline', 'Single-arm', 'Wide-grip'])} Variation`,
        description: 'A variation that targets the muscles differently.',
        difficulty_modifier: randomChoice([-2, -1, 0, 1, 2])
      })),
      gif_url: `https://example.com/gifs/${randomId()}.gif`,
      video_url: `https://example.com/videos/${randomId()}.mp4`,
      muscle_diagram_url: `https://example.com/diagrams/${randomId()}.jpg`,
      thumbnail_url: `https://example.com/thumbnails/${randomId()}.jpg`,
      created_at: randomDate(365),
      updated_at: randomDate(30),
      created_by: randomBool() ? randomId() : undefined,
      is_custom: randomBool(),
      is_verified: randomBool(),
      tags: Array.from({ length: randomInt(0, 5) }, () => randomChoice(['compound', 'isolation', 'beginner', 'advanced'])),
      aliases: Array.from({ length: randomInt(0, 3) }, () => `Alt ${randomChoice(exerciseNames)}`),
      default_sets: randomInt(2, 5),
      default_reps: randomInt(8, 15),
      default_rest_time: randomInt(60, 180),
      prerequisites: [],
      contraindications: [],
      safety_notes: []
    };

    return { ...baseExercise, ...overrides };
  }

  static createBodyweight(): Exercise {
    return this.create({
      type: 'bodyweight',
      equipment: 'none',
      name: randomChoice(['Push-up', 'Pull-up', 'Squat', 'Plank', 'Burpee'])
    });
  }

  static createBarbell(): Exercise {
    return this.create({
      type: 'barbell',
      equipment: 'barbell',
      name: randomChoice(['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row'])
    });
  }

  static createCardio(): Exercise {
    return this.create({
      category: 'cardio',
      type: 'machine',
      equipment: randomChoice(['treadmill', 'stationary_bike', 'elliptical']),
      name: randomChoice(['Treadmill Run', 'Cycling', 'Elliptical'])
    });
  }

  // Edge cases
  static createMinimal(): Exercise {
    return this.create({
      name: 'Min Exercise',
      instructions: [{
        step_number: 1,
        instruction: 'Do the exercise.'
      }],
      tips: [],
      variations: []
    });
  }

  static createComplex(): Exercise {
    return this.create({
      name: 'Complex Multi-Joint Compound Movement with Very Long Name',
      body_parts: ['chest', 'shoulders', 'arms', 'core'],
      muscle_groups: ['pectorals', 'deltoids', 'triceps_brachii', 'rectus_abdominis'],
      instructions: Array.from({ length: 10 }, (_, i) => ({
        step_number: i + 1,
        instruction: `Detailed step ${i + 1} with comprehensive instructions for proper form.`,
        image_url: `https://example.com/instructions/${i + 1}.jpg`
      })),
      tips: Array.from({ length: 8 }, (_, i) => ({
        category: randomChoice(['form', 'breathing', 'safety', 'progression'] as const),
        tip: `Advanced tip ${i + 1} for optimal performance and safety.`
      })),
      variations: Array.from({ length: 5 }, (_, i) => ({
        name: `Advanced Variation ${i + 1}`,
        description: `Complex variation that significantly changes the exercise dynamics.`,
        difficulty_modifier: randomChoice([1, 2])
      }))
    });
  }
}

// ============================================================================
// Workout Factory
// ============================================================================

export class WorkoutFactory {
  static create(overrides: Partial<Workout> = {}): Workout {
    const workoutNames = [
      'Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Upper Body', 'Lower Body',
      'Chest & Triceps', 'Back & Biceps', 'Shoulders & Arms', 'HIIT Cardio'
    ];

    const baseWorkout: Workout = {
      id: randomId(),
      user_id: randomId(),
      name: randomChoice(workoutNames),
      description: `A comprehensive ${randomChoice(['strength', 'cardio', 'hybrid'])} workout designed for optimal results.`,
      status: randomChoice(['planned', 'in_progress', 'completed', 'cancelled', 'paused'] as WorkoutStatus[]),
      scheduled_date: randomBool() ? randomFutureDate(30) : undefined,
      started_at: randomBool() ? randomDate(7) : undefined,
      completed_at: randomBool() ? randomDate(7) : undefined,
      paused_at: undefined,
      exercises: Array.from({ length: randomInt(3, 8) }, (_, i) => 
        WorkoutExerciseFactory.create({ order: i })
      ),
      total_duration: randomInt(1800, 7200), // 30min to 2h in seconds
      total_volume: randomFloat(1000, 15000, 1),
      total_sets: randomInt(10, 40),
      total_reps: randomInt(100, 500),
      auto_rest_timer: randomBool(),
      default_rest_time: randomChoice([60, 90, 120, 180]),
      difficulty_rating: randomInt(1, 5),
      energy_level: randomInt(1, 5),
      mood_rating: randomInt(1, 5),
      notes: randomBool() ? 'Great workout! Felt strong today.' : undefined,
      location: randomChoice(['Home Gym', 'Commercial Gym', 'Outdoor', 'Hotel Gym', undefined]),
      weather: randomBool() ? randomChoice(['Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold']) : undefined,
      is_public: randomBool(),
      shared_with: randomBool() ? Array.from({ length: randomInt(1, 5) }, () => randomId()) : undefined,
      created_at: randomDate(365),
      updated_at: randomDate(30)
    };

    return { ...baseWorkout, ...overrides };
  }

  static createTemplate(overrides: Partial<Workout> = {}): Workout {
    return this.create({
      status: 'planned',
      is_template: true,
      started_at: undefined,
      completed_at: undefined,
      total_duration: undefined,
      total_volume: undefined,
      total_sets: undefined,
      total_reps: undefined,
      exercises: Array.from({ length: randomInt(4, 6) }, (_, i) => 
        WorkoutExerciseFactory.createTemplate({ order: i })
      ),
      ...overrides
    });
  }

  static createInProgress(overrides: Partial<Workout> = {}): Workout {
    const startTime = randomDate(1);
    return this.create({
      status: 'in_progress',
      started_at: startTime,
      completed_at: undefined,
      exercises: Array.from({ length: randomInt(4, 6) }, (_, i) => 
        WorkoutExerciseFactory.create({ 
          order: i,
          started_at: i === 0 ? startTime : undefined
        })
      ),
      ...overrides
    });
  }

  static createCompleted(overrides: Partial<Workout> = {}): Workout {
    const startTime = randomDate(7);
    const endTime = new Date(startTime.getTime() + randomInt(1800, 7200) * 1000);
    
    return this.create({
      status: 'completed',
      started_at: startTime,
      completed_at: endTime,
      total_duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
      exercises: Array.from({ length: randomInt(4, 6) }, (_, i) => 
        WorkoutExerciseFactory.createCompleted({ order: i })
      ),
      ...overrides
    });
  }

  // Edge cases
  static createEmpty(): Workout {
    return this.create({
      name: 'Empty Workout',
      exercises: [],
      total_duration: 0,
      total_volume: 0,
      total_sets: 0,
      total_reps: 0
    });
  }

  static createMaximal(): Workout {
    return this.create({
      name: 'Maximum Intensity Full Body Workout with Extended Duration',
      description: 'A'.repeat(500), // Max description length
      exercises: Array.from({ length: 15 }, (_, i) => 
        WorkoutExerciseFactory.create({ order: i })
      ),
      notes: 'B'.repeat(1000) // Long notes
    });
  }
}

// ============================================================================
// Workout Exercise Factory
// ============================================================================

export class WorkoutExerciseFactory {
  static create(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
    const baseWorkoutExercise: WorkoutExercise = {
      id: randomId(),
      exercise_id: randomId(),
      order: randomInt(0, 10),
      sets: Array.from({ length: randomInt(2, 5) }, (_, i) => 
        SetFactory.create({ set_number: i + 1 })
      ),
      rest_time: randomChoice([60, 90, 120, 180]),
      notes: randomBool() ? 'Focus on form and control' : undefined,
      superset_id: randomBool() ? randomId() : undefined,
      circuit_id: randomBool() ? randomId() : undefined,
      target_sets: randomInt(2, 5),
      target_reps: randomInt(8, 15),
      target_weight: randomFloat(20, 200, 1),
      target_rpe: randomInt(6, 9),
      started_at: randomBool() ? randomDate(1) : undefined,
      completed_at: randomBool() ? randomDate(1) : undefined
    };

    return { ...baseWorkoutExercise, ...overrides };
  }

  static createTemplate(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
    return this.create({
      sets: Array.from({ length: randomInt(3, 4) }, (_, i) => 
        SetFactory.createTemplate({ set_number: i + 1 })
      ),
      started_at: undefined,
      completed_at: undefined,
      ...overrides
    });
  }

  static createCompleted(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
    const startTime = randomDate(1);
    const endTime = new Date(startTime.getTime() + randomInt(300, 1800) * 1000);
    
    return this.create({
      sets: Array.from({ length: randomInt(3, 4) }, (_, i) => 
        SetFactory.createCompleted({ set_number: i + 1 })
      ),
      started_at: startTime,
      completed_at: endTime,
      ...overrides
    });
  }
}

// ============================================================================
// Set Factory
// ============================================================================

export class SetFactory {
  static create(overrides: Partial<SetData> = {}): SetData {
    const baseSet: SetData = {
      id: randomId(),
      set_number: randomInt(1, 5),
      type: randomChoice(['normal', 'warmup', 'failure', 'dropset'] as SetType[]),
      weight: randomFloat(10, 200, 1),
      reps: randomInt(5, 20),
      distance: randomBool() ? randomFloat(100, 5000, 0) : undefined,
      duration: randomBool() ? randomInt(30, 300) : undefined,
      rpe: randomInt(6, 10),
      completed: randomBool(),
      completed_at: randomBool() ? randomDate(1) : undefined,
      skipped: false,
      rest_time: randomInt(60, 180),
      planned_rest_time: randomChoice([60, 90, 120, 180]),
      drop_weight: randomBool() ? randomFloat(5, 50, 1) : undefined,
      cluster_reps: randomBool() ? Array.from({ length: randomInt(2, 4) }, () => randomInt(3, 8)) : undefined,
      tempo: randomBool() ? randomChoice(['3-1-2-1', '2-0-2-0', '4-2-1-0']) : undefined,
      hold_duration: randomBool() ? randomInt(5, 30) : undefined,
      notes: randomBool() ? 'Felt strong on this set' : undefined,
      started_at: randomBool() ? randomDate(1) : undefined,
      ended_at: randomBool() ? randomDate(1) : undefined
    };

    return { ...baseSet, ...overrides };
  }

  static createTemplate(overrides: Partial<SetData> = {}): SetData {
    return this.create({
      weight: 0,
      reps: randomInt(8, 12),
      completed: false,
      completed_at: undefined,
      rpe: undefined,
      notes: undefined,
      started_at: undefined,
      ended_at: undefined,
      ...overrides
    });
  }

  static createCompleted(overrides: Partial<SetData> = {}): SetData {
    const startTime = randomDate(1);
    const endTime = new Date(startTime.getTime() + randomInt(30, 180) * 1000);
    
    return this.create({
      completed: true,
      completed_at: endTime,
      started_at: startTime,
      ended_at: endTime,
      skipped: false,
      ...overrides
    });
  }

  static createWarmup(): SetData {
    return this.create({
      type: 'warmup',
      weight: randomFloat(10, 50, 1),
      reps: randomInt(10, 15),
      rpe: randomInt(4, 6)
    });
  }

  static createFailure(): SetData {
    return this.create({
      type: 'failure',
      rpe: 10,
      notes: 'Taken to complete failure'
    });
  }

  static createDropset(): SetData {
    return this.create({
      type: 'dropset',
      drop_weight: randomFloat(10, 30, 1),
      notes: 'Drop set performed'
    });
  }
}

// ============================================================================
// Social Factory
// ============================================================================

export class SocialFactory {
  static createPost(overrides: Partial<SocialActivity> = {}): SocialActivity {
    const basePost: SocialActivity = {
      id: randomId(),
      userId: randomId(),
      type: randomChoice([
        'workout_completed', 'achievement_unlocked', 'level_up', 
        'streak_milestone', 'personal_record'
      ] as SocialActivityType[]),
      timestamp: randomDate(30),
      data: {
        workout_name: randomChoice(['Push Day', 'Pull Day', 'Leg Day']),
        duration: randomInt(30, 120),
        exercises_count: randomInt(4, 8),
        total_volume: randomFloat(1000, 5000, 0)
      },
      visibility: randomChoice(['public', 'friends', 'private']),
      likes: randomInt(0, 50),
      comments: randomInt(0, 20),
      shares: randomInt(0, 10),
      user: {
        id: randomId(),
        username: randomUsername(),
        displayName: randomName(),
        avatar: `https://example.com/avatars/${randomId()}.jpg`,
        currentLevel: randomInt(1, 30)
      }
    };

    return { ...basePost, ...overrides };
  }

  static createFriend(overrides: Partial<GymFriend> = {}): GymFriend {
    const baseFriend: GymFriend = {
      id: randomId(),
      userId: randomId(),
      friendId: randomId(),
      status: randomChoice(['pending_sent', 'pending_received', 'accepted', 'blocked'] as FriendshipStatus[]),
      createdAt: randomDate(365),
      acceptedAt: randomBool() ? randomDate(300) : undefined,
      friend: {
        id: randomId(),
        username: randomUsername(),
        displayName: randomName(),
        avatar: `https://example.com/avatars/${randomId()}.jpg`,
        isOnline: randomBool(),
        lastActiveAt: randomDate(7),
        currentStreak: randomInt(0, 50),
        currentLevel: randomInt(1, 30),
        fitnessLevel: randomChoice(['beginner', 'intermediate', 'advanced', 'expert'] as FitnessLevel[])
      },
      connectionStrength: randomInt(0, 100),
      commonInterests: Array.from({ length: randomInt(1, 5) }, () => 
        randomChoice(['strength', 'cardio', 'flexibility', 'nutrition', 'motivation'])
      ),
      sharedWorkouts: randomInt(0, 20),
      mutualFriends: randomInt(0, 10),
      lastInteraction: randomBool() ? randomDate(30) : undefined,
      totalInteractions: randomInt(0, 100),
      interactionTypes: {
        likes: randomInt(0, 50),
        comments: randomInt(0, 30),
        workoutsTogether: randomInt(0, 10),
        challenges: randomInt(0, 5)
      },
      notifyOnWorkout: randomBool(),
      notifyOnAchievement: randomBool(),
      notifyOnStreak: randomBool()
    };

    return { ...baseFriend, ...overrides };
  }

  static createComment(overrides: Partial<Comment> = {}): Comment {
    const baseComment: Comment = {
      id: randomId(),
      userId: randomId(),
      targetId: randomId(),
      targetType: randomChoice(['activity', 'workout', 'achievement']),
      content: randomChoice([
        'Great workout! 💪',
        'Keep it up!',
        'Awesome progress!',
        'You\'re crushing it!',
        'Inspiring stuff! 🔥'
      ]),
      timestamp: randomDate(30),
      editedAt: randomBool() ? randomDate(25) : undefined,
      likes: randomInt(0, 20),
      replies: [],
      user: {
        id: randomId(),
        username: randomUsername(),
        displayName: randomName(),
        avatar: `https://example.com/avatars/${randomId()}.jpg`,
        currentLevel: randomInt(1, 30)
      }
    };

    return { ...baseComment, ...overrides };
  }

  // Edge cases
  static createPrivatePost(): SocialActivity {
    return this.createPost({
      visibility: 'private',
      likes: 0,
      comments: 0,
      shares: 0
    });
  }

  static createViralPost(): SocialActivity {
    return this.createPost({
      visibility: 'public',
      likes: randomInt(100, 1000),
      comments: randomInt(50, 200),
      shares: randomInt(20, 100)
    });
  }

  static createBlockedFriend(): GymFriend {
    return this.createFriend({
      status: 'blocked',
      acceptedAt: undefined,
      connectionStrength: 0,
      totalInteractions: 0
    });
  }
}

// ============================================================================
// Achievement Factory
// ============================================================================

export class AchievementFactory {
  static create(overrides: Partial<Achievement> = {}): Achievement {
    const achievementNames = [
      'First Steps', 'Streak Master', 'Heavy Lifter', 'Cardio King', 'Consistency Champion',
      'Social Butterfly', 'Goal Crusher', 'PR Breaker', 'Dedication Award', 'Fitness Guru'
    ];

    const baseAchievement: Achievement = {
      id: randomId(),
      name: randomChoice(achievementNames),
      description: 'Complete this challenge to unlock the achievement and earn XP rewards.',
      icon: randomChoice(['🏆', '💪', '🔥', '⭐', '🎯', '🚀', '💎', '👑', '🏅', '🌟']),
      category: randomChoice(['strength', 'consistency', 'social', 'milestone']),
      rarity: randomChoice(['common', 'rare', 'epic', 'legendary']),
      requirements: [{
        type: randomChoice(['workout_count', 'streak_days', 'weight_lifted', 'social_action']),
        target_value: randomInt(1, 100),
        timeframe: randomChoice(['daily', 'weekly', 'monthly', 'all_time'])
      }] as AchievementRequirement[],
      xp_reward: randomChoice([50, 100, 250, 500, 1000]),
      unlock_content: randomBool() ? 'Unlocked special workout template!' : undefined
    };

    return { ...baseAchievement, ...overrides };
  }

  static createCommon(): Achievement {
    return this.create({
      rarity: 'common',
      xp_reward: randomChoice([50, 100]),
      requirements: [{
        type: 'workout_count',
        target_value: randomInt(1, 10),
        timeframe: 'all_time'
      }]
    });
  }

  static createLegendary(): Achievement {
    return this.create({
      rarity: 'legendary',
      xp_reward: randomChoice([500, 1000]),
      requirements: [{
        type: 'streak_days',
        target_value: randomInt(100, 365),
        timeframe: 'all_time'
      }]
    });
  }

  static createSocial(): Achievement {
    return this.create({
      category: 'social',
      requirements: [{
        type: 'social_action',
        target_value: randomInt(10, 50),
        timeframe: 'monthly'
      }]
    });
  }
}

// ============================================================================
// Batch Factories
// ============================================================================

export const BatchFactories = {
  users: (count: number) => Array.from({ length: count }, () => UserFactory.create()),
  exercises: (count: number) => Array.from({ length: count }, () => ExerciseFactory.create()),
  workouts: (count: number, userId?: string) => 
    Array.from({ length: count }, () => WorkoutFactory.create(userId ? { user_id: userId } : {})),
  socialPosts: (count: number, userId?: string) => 
    Array.from({ length: count }, () => SocialFactory.createPost(userId ? { userId } : {})),
  achievements: (count: number) => Array.from({ length: count }, () => AchievementFactory.create())
};

// ============================================================================
// Scenario Factories
// ============================================================================

export const ScenarioFactories = {
  completeWorkoutFlow: () => {
    const user = UserFactory.create();
    const exercises = BatchFactories.exercises(5);
    const workout = WorkoutFactory.createInProgress({ user_id: user.id });
    
    return { user, exercises, workout };
  },

  socialInteraction: () => {
    const users = BatchFactories.users(3);
    const [user1, user2, user3] = users;
    
    const friendships = [
      SocialFactory.createFriend({ userId: user1.id, friendId: user2.id, status: 'accepted' }),
      SocialFactory.createFriend({ userId: user1.id, friendId: user3.id, status: 'pending_sent' })
    ];
    
    const posts = [
      SocialFactory.createPost({ userId: user1.id }),
      SocialFactory.createPost({ userId: user2.id })
    ];
    
    return { users, friendships, posts };
  },

  gamificationProgression: () => {
    const user = UserFactory.createNewbie();
    const achievements = [
      AchievementFactory.createCommon(),
      AchievementFactory.create({ category: 'consistency' }),
      AchievementFactory.createLegendary()
    ];
    
    const workouts = BatchFactories.workouts(5, user.id);
    
    return { user, achievements, workouts };
  },

  edgeCaseValidation: () => ({
    minimalUser: UserFactory.createMinimal(),
    maximalUser: UserFactory.createMaximal(),
    emptyWorkout: WorkoutFactory.createEmpty(),
    complexExercise: ExerciseFactory.createComplex(),
    privatePost: SocialFactory.createPrivatePost(),
    blockedFriend: SocialFactory.createBlockedFriend()
  })
};

// ============================================================================
// Exports
// ============================================================================

// All factories are already exported as classes above
// Additional convenience exports
export const TestFactories = {
  User: UserFactory,
  Exercise: ExerciseFactory,
  Workout: WorkoutFactory,
  WorkoutExercise: WorkoutExerciseFactory,
  Set: SetFactory,
  Social: SocialFactory,
  Achievement: AchievementFactory
};