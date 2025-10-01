/**
 * Test Fixtures
 * Predefined test data for consistent testing
 */

import type { User, Workout, Exercise, Achievement } from '@/types';

// Re-export all factories for easy access
export * from '../test-factories';
export * from '../edge-case-factories';
export * from '../schema-validation-factories';

// User fixtures
export const userFixtures = {
  newUser: {
    id: 'user-new',
    email: 'newuser@example.com',
    username: 'newuser',
    display_name: 'New User',
    role: 'basic' as const,
    profile: {
      fitness_level: 'beginner' as const,
      goals: ['weight_loss'],
      scheduled_days: ['monday', 'wednesday', 'friday'],
      privacy_settings: {
        profile_visibility: 'private' as const,
        workout_sharing: 'private' as const,
        leaderboard_participation: false,
      },
    },
    stats: {
      level: 1,
      total_xp: 0,
      current_streak: 0,
      best_streak: 0,
      workouts_completed: 0,
      total_sets: 0,
      total_reps: 0,
      total_weight_lifted: 0,
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as User,

  experiencedUser: {
    id: 'user-experienced',
    email: 'experienced@example.com',
    username: 'experienced',
    display_name: 'Experienced User',
    role: 'basic' as const,
    profile: {
      fitness_level: 'advanced' as const,
      goals: ['strength', 'muscle_gain'],
      scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      privacy_settings: {
        profile_visibility: 'public' as const,
        workout_sharing: 'friends' as const,
        leaderboard_participation: true,
      },
    },
    stats: {
      level: 15,
      total_xp: 7500,
      current_streak: 21,
      best_streak: 45,
      workouts_completed: 150,
      total_sets: 1500,
      total_reps: 15000,
      total_weight_lifted: 300000,
    },
    created_at: '2023-06-01T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
  } as User,

  premiumUser: {
    id: 'user-premium',
    email: 'premium@example.com',
    username: 'premium',
    display_name: 'Premium User',
    role: 'premium' as const,
    profile: {
      fitness_level: 'advanced' as const,
      goals: ['strength', 'muscle_gain', 'endurance'],
      scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      privacy_settings: {
        profile_visibility: 'public' as const,
        workout_sharing: 'public' as const,
        leaderboard_participation: true,
      },
    },
    stats: {
      level: 25,
      total_xp: 15000,
      current_streak: 67,
      best_streak: 89,
      workouts_completed: 300,
      total_sets: 3000,
      total_reps: 30000,
      total_weight_lifted: 750000,
    },
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2024-01-15T00:00:00.000Z',
  } as User,
};

// Exercise fixtures
export const exerciseFixtures = {
  benchPress: {
    id: 'exercise-bench-press',
    name: 'Bench Press',
    category: 'strength' as const,
    body_parts: ['chest', 'shoulders', 'triceps'],
    muscle_groups: ['pectorals', 'anterior_deltoids', 'triceps'],
    equipment: 'barbell',
    difficulty_level: 'intermediate' as const,
    instructions: [
      'Lie flat on the bench with your feet on the floor',
      'Grip the barbell with hands slightly wider than shoulder-width',
      'Lower the bar to your chest with control',
      'Press the bar back up to starting position',
    ],
    tips: [
      'Keep your shoulder blades retracted',
      'Maintain a slight arch in your back',
      'Control the descent, explode on the ascent',
    ],
    media: {
      images: ['bench-press-1.jpg', 'bench-press-2.jpg'],
      videos: ['bench-press-demo.mp4'],
      gifs: ['bench-press-animation.gif'],
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as Exercise,

  squat: {
    id: 'exercise-squat',
    name: 'Squat',
    category: 'strength' as const,
    body_parts: ['legs', 'glutes', 'core'],
    muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
    equipment: 'barbell',
    difficulty_level: 'intermediate' as const,
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body by bending at the hips and knees',
      'Keep your chest up and knees tracking over toes',
      'Return to starting position by driving through your heels',
    ],
    tips: [
      'Keep your core engaged throughout',
      'Don\'t let your knees cave inward',
      'Go as deep as your mobility allows',
    ],
    media: {
      images: ['squat-1.jpg', 'squat-2.jpg'],
      videos: ['squat-demo.mp4'],
      gifs: ['squat-animation.gif'],
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as Exercise,

  pushUp: {
    id: 'exercise-push-up',
    name: 'Push-Up',
    category: 'strength' as const,
    body_parts: ['chest', 'shoulders', 'triceps', 'core'],
    muscle_groups: ['pectorals', 'anterior_deltoids', 'triceps'],
    equipment: 'bodyweight',
    difficulty_level: 'beginner' as const,
    instructions: [
      'Start in a plank position with hands under shoulders',
      'Lower your body until chest nearly touches the floor',
      'Keep your body in a straight line',
      'Push back up to starting position',
    ],
    tips: [
      'Engage your core throughout the movement',
      'Don\'t let your hips sag or pike up',
      'Control both the descent and ascent',
    ],
    media: {
      images: ['pushup-1.jpg', 'pushup-2.jpg'],
      videos: ['pushup-demo.mp4'],
      gifs: ['pushup-animation.gif'],
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as Exercise,
};

// Workout fixtures
export const workoutFixtures = {
  emptyWorkout: {
    id: 'workout-empty',
    user_id: 'user-test',
    name: 'Empty Workout',
    description: 'A workout with no exercises',
    status: 'planned' as const,
    exercises: [],
    started_at: null,
    completed_at: null,
    duration: null,
    is_template: false,
    template_id: null,
    notes: '',
    tags: [],
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
  } as Workout,

  pushWorkout: {
    id: 'workout-push',
    user_id: 'user-test',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps workout',
    status: 'planned' as const,
    exercises: [
      {
        id: 'we-1',
        exercise_id: 'exercise-bench-press',
        exercise: exerciseFixtures.benchPress,
        sets: [
          { id: 'set-1', weight: 80, reps: 10, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: 7, created_at: '2024-01-15T10:00:00.000Z' },
          { id: 'set-2', weight: 85, reps: 8, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: 8, created_at: '2024-01-15T10:01:00.000Z' },
          { id: 'set-3', weight: 90, reps: 6, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: 9, created_at: '2024-01-15T10:02:00.000Z' },
        ],
        notes: 'Focus on form',
        order: 1,
      },
      {
        id: 'we-2',
        exercise_id: 'exercise-push-up',
        exercise: exerciseFixtures.pushUp,
        sets: [
          { id: 'set-4', weight: 0, reps: 15, type: 'normal' as const, completed: false, rest_time: 60, notes: '', rpe: 6, created_at: '2024-01-15T10:03:00.000Z' },
          { id: 'set-5', weight: 0, reps: 12, type: 'normal' as const, completed: false, rest_time: 60, notes: '', rpe: 7, created_at: '2024-01-15T10:04:00.000Z' },
          { id: 'set-6', weight: 0, reps: 10, type: 'normal' as const, completed: false, rest_time: 60, notes: '', rpe: 8, created_at: '2024-01-15T10:05:00.000Z' },
        ],
        notes: 'Burnout set',
        order: 2,
      },
    ],
    started_at: null,
    completed_at: null,
    duration: null,
    is_template: false,
    template_id: null,
    notes: 'Focus on progressive overload',
    tags: ['push', 'strength'],
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
  } as Workout,

  completedWorkout: {
    id: 'workout-completed',
    user_id: 'user-test',
    name: 'Completed Push Day',
    description: 'Successfully completed push workout',
    status: 'completed' as const,
    exercises: [
      {
        id: 'we-3',
        exercise_id: 'exercise-bench-press',
        exercise: exerciseFixtures.benchPress,
        sets: [
          { id: 'set-7', weight: 80, reps: 10, type: 'normal' as const, completed: true, rest_time: 120, notes: 'Felt good', rpe: 7, created_at: '2024-01-15T09:00:00.000Z' },
          { id: 'set-8', weight: 85, reps: 8, type: 'normal' as const, completed: true, rest_time: 120, notes: 'Challenging', rpe: 8, created_at: '2024-01-15T09:05:00.000Z' },
          { id: 'set-9', weight: 90, reps: 6, type: 'normal' as const, completed: true, rest_time: 120, notes: 'Max effort', rpe: 9, created_at: '2024-01-15T09:10:00.000Z' },
        ],
        notes: 'New PR on last set!',
        order: 1,
      },
    ],
    started_at: '2024-01-15T09:00:00.000Z',
    completed_at: '2024-01-15T09:45:00.000Z',
    duration: 2700, // 45 minutes
    is_template: false,
    template_id: null,
    notes: 'Great workout, hit new PR!',
    tags: ['push', 'strength', 'pr'],
    created_at: '2024-01-15T08:30:00.000Z',
    updated_at: '2024-01-15T09:45:00.000Z',
  } as Workout,

  templateWorkout: {
    id: 'workout-template',
    user_id: 'user-test',
    name: 'Push Day Template',
    description: 'Standard push day template',
    status: 'planned' as const,
    exercises: [
      {
        id: 'we-4',
        exercise_id: 'exercise-bench-press',
        exercise: exerciseFixtures.benchPress,
        sets: [
          { id: 'set-10', weight: 0, reps: 10, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: null, created_at: '2024-01-01T00:00:00.000Z' },
          { id: 'set-11', weight: 0, reps: 8, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: null, created_at: '2024-01-01T00:00:00.000Z' },
          { id: 'set-12', weight: 0, reps: 6, type: 'normal' as const, completed: false, rest_time: 120, notes: '', rpe: null, created_at: '2024-01-01T00:00:00.000Z' },
        ],
        notes: 'Progressive overload',
        order: 1,
      },
    ],
    started_at: null,
    completed_at: null,
    duration: null,
    is_template: true,
    template_id: null,
    notes: 'Standard push template',
    tags: ['push', 'template'],
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  } as Workout,
};

// Achievement fixtures
export const achievementFixtures = {
  firstWorkout: {
    id: 'achievement-first-workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: 'workout' as const,
    rarity: 'common' as const,
    xp_reward: 50,
    icon: '🏃‍♂️',
    requirements: {
      type: 'workout_count',
      target: 1,
    },
    unlocked_at: null,
    progress: 0,
  } as Achievement,

  streakMaster: {
    id: 'achievement-streak-master',
    name: 'Streak Master',
    description: 'Maintain a 30-day workout streak',
    category: 'streak' as const,
    rarity: 'epic' as const,
    xp_reward: 500,
    icon: '🔥',
    requirements: {
      type: 'streak_count',
      target: 30,
    },
    unlocked_at: null,
    progress: 0,
  } as Achievement,

  strengthGuru: {
    id: 'achievement-strength-guru',
    name: 'Strength Guru',
    description: 'Lift a total of 100,000 lbs',
    category: 'strength' as const,
    rarity: 'legendary' as const,
    xp_reward: 1000,
    icon: '💪',
    requirements: {
      type: 'total_weight',
      target: 100000,
    },
    unlocked_at: null,
    progress: 0,
  } as Achievement,
};

// XP calculation fixtures
export const xpFixtures = {
  workoutCompletion: {
    base: 100,
    bonuses: {
      firstWorkout: 50,
      perfectForm: 25,
      personalRecord: 100,
      streakBonus: 50,
      weekendWarrior: 25,
    },
  },
  setCompletion: {
    base: 5,
    bonuses: {
      heavySet: 10,
      highReps: 5,
      personalRecord: 25,
    },
  },
  achievements: {
    common: 50,
    rare: 100,
    epic: 250,
    legendary: 500,
  },
};

// API response fixtures
export const apiFixtures = {
  successResponse: {
    data: null,
    error: null,
    status: 200,
    message: 'Success',
  },
  errorResponse: {
    data: null,
    error: {
      code: 'GENERIC_ERROR',
      message: 'An error occurred',
      details: {},
    },
    status: 500,
    message: 'Internal Server Error',
  },
  validationErrorResponse: {
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: {
        field: 'email',
        message: 'Invalid email format',
      },
    },
    status: 400,
    message: 'Bad Request',
  },
};

// Performance benchmarks
export const performanceFixtures = {
  renderTime: {
    excellent: 16, // 60fps
    good: 33, // 30fps
    acceptable: 100,
    poor: 500,
  },
  bundleSize: {
    small: 50 * 1024, // 50KB
    medium: 200 * 1024, // 200KB
    large: 500 * 1024, // 500KB
    huge: 1024 * 1024, // 1MB
  },
  memoryUsage: {
    low: 10 * 1024 * 1024, // 10MB
    medium: 50 * 1024 * 1024, // 50MB
    high: 100 * 1024 * 1024, // 100MB
    excessive: 500 * 1024 * 1024, // 500MB
  },
};

// Export all fixtures
export const fixtures = {
  users: userFixtures,
  exercises: exerciseFixtures,
  workouts: workoutFixtures,
  achievements: achievementFixtures,
  xp: xpFixtures,
  api: apiFixtures,
  performance: performanceFixtures,
};