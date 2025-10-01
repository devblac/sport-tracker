/**
 * Test Data Generators
 * Comprehensive mock data for all entities
 */

import type { User, Workout, Exercise, WorkoutExercise, Set, Achievement, SocialPost } from '@/types';

// User data generator
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  role: 'basic',
  profile: {
    fitness_level: 'intermediate',
    goals: ['strength', 'muscle_gain'],
    scheduled_days: ['monday', 'wednesday', 'friday'],
    privacy_settings: {
      profile_visibility: 'public',
      workout_sharing: 'friends',
      leaderboard_participation: true,
    },
  },
  stats: {
    level: 5,
    total_xp: 1250,
    current_streak: 7,
    best_streak: 15,
    workouts_completed: 42,
    total_sets: 420,
    total_reps: 8400,
    total_weight_lifted: 50000,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Exercise data generator
export const createMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: `exercise-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Bench Press',
  category: 'strength',
  body_parts: ['chest', 'shoulders', 'triceps'],
  muscle_groups: ['pectorals', 'anterior_deltoids', 'triceps'],
  equipment: 'barbell',
  difficulty_level: 'intermediate',
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Set data generator
export const createMockSet = (overrides: Partial<Set> = {}): Set => ({
  id: `set-${Math.random().toString(36).substr(2, 9)}`,
  weight: 80,
  reps: 10,
  type: 'normal',
  completed: false,
  rest_time: 120,
  notes: '',
  rpe: 7,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Workout Exercise data generator
export const createMockWorkoutExercise = (overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  id: `workout-exercise-${Math.random().toString(36).substr(2, 9)}`,
  exercise_id: 'exercise-123',
  exercise: createMockExercise(),
  sets: [
    createMockSet({ weight: 80, reps: 10 }),
    createMockSet({ weight: 85, reps: 8 }),
    createMockSet({ weight: 90, reps: 6 }),
  ],
  notes: 'Focus on form',
  order: 1,
  ...overrides,
});

// Workout data generator
export const createMockWorkout = (overrides: Partial<Workout> = {}): Workout => ({
  id: `workout-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-123',
  name: 'Push Day',
  description: 'Chest, shoulders, and triceps workout',
  status: 'planned',
  exercises: [
    createMockWorkoutExercise({ exercise: createMockExercise({ name: 'Bench Press' }) }),
    createMockWorkoutExercise({ exercise: createMockExercise({ name: 'Overhead Press' }) }),
    createMockWorkoutExercise({ exercise: createMockExercise({ name: 'Dips' }) }),
  ],
  started_at: null,
  completed_at: null,
  duration: null,
  is_template: false,
  template_id: null,
  notes: '',
  tags: ['push', 'strength'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Achievement data generator
export const createMockAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: `achievement-${Math.random().toString(36).substr(2, 9)}`,
  name: 'First Workout',
  description: 'Complete your first workout',
  category: 'workout',
  rarity: 'common',
  xp_reward: 50,
  icon: '🏆',
  requirements: {
    type: 'workout_count',
    target: 1,
  },
  unlocked_at: null,
  progress: 0,
  ...overrides,
});

// Social Post data generator
export const createMockSocialPost = (overrides: Partial<SocialPost> = {}): SocialPost => ({
  id: `post-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-123',
  user: createMockUser(),
  type: 'workout_completed',
  content: 'Just crushed my workout! 💪',
  workout_data: {
    name: 'Push Day',
    duration: 45,
    exercises_count: 5,
    total_sets: 15,
    total_reps: 150,
    total_weight: 2500,
  },
  visibility: 'public',
  likes_count: 12,
  comments_count: 3,
  shares_count: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// XP Gain data generator
export const createMockXPGain = (overrides = {}) => ({
  xp: 50,
  reason: 'Workout completed',
  source: 'workout',
  timestamp: new Date().toISOString(),
  ...overrides,
});

// Personal Record data generator
export const createMockPersonalRecord = (overrides = {}) => ({
  id: `pr-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-123',
  exercise_id: 'exercise-123',
  exercise_name: 'Bench Press',
  type: 'max_weight',
  value: 100,
  previous_value: 95,
  date: new Date().toISOString(),
  workout_id: 'workout-123',
  ...overrides,
});

// Streak data generator
export const createMockStreak = (overrides = {}) => ({
  current_streak: 7,
  best_streak: 15,
  last_workout_date: new Date().toISOString(),
  streak_start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  scheduled_days: ['monday', 'wednesday', 'friday'],
  streak_shields: 2,
  ...overrides,
});

// Challenge data generator
export const createMockChallenge = (overrides = {}) => ({
  id: `challenge-${Math.random().toString(36).substr(2, 9)}`,
  name: '30-Day Push-Up Challenge',
  description: 'Complete 1000 push-ups in 30 days',
  type: 'exercise_volume',
  category: 'strength',
  difficulty: 'intermediate',
  duration_days: 30,
  target_value: 1000,
  current_progress: 250,
  participants_count: 156,
  rewards: {
    xp: 500,
    badge: 'push_up_master',
    title: 'Push-Up Champion',
  },
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  ...overrides,
});

// League data generator
export const createMockLeague = (overrides = {}) => ({
  id: `league-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Diamond League',
  tier: 'diamond',
  participants: Array.from({ length: 10 }, (_, i) => ({
    user: createMockUser({ display_name: `User ${i + 1}` }),
    xp: 1000 - i * 50,
    rank: i + 1,
  })),
  season_start: new Date().toISOString(),
  season_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  rewards: {
    promotion: { xp: 200, badge: 'promoted' },
    top_3: { xp: 100, badge: 'top_performer' },
    participation: { xp: 25 },
  },
  ...overrides,
});

// Notification data generator
export const createMockNotification = (overrides = {}) => ({
  id: `notification-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-123',
  type: 'achievement_unlocked',
  title: 'Achievement Unlocked!',
  message: 'You earned the "First Workout" achievement',
  data: {
    achievement_id: 'achievement-123',
    xp_gained: 50,
  },
  read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Marketplace content data generator
export const createMockMarketplaceContent = (overrides = {}) => ({
  id: `content-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Advanced Powerlifting Program',
  description: 'A comprehensive 12-week powerlifting program',
  type: 'workout_program',
  category: 'strength',
  price: 29.99,
  currency: 'USD',
  trainer: createMockUser({ role: 'trainer' }),
  rating: 4.8,
  reviews_count: 124,
  purchase_count: 456,
  preview_content: {
    images: ['preview1.jpg', 'preview2.jpg'],
    video: 'preview.mp4',
    sample_workouts: 2,
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

// Batch data generators for performance testing
export const generateMockWorkouts = (count: number): Workout[] => 
  Array.from({ length: count }, (_, i) => 
    createMockWorkout({ 
      name: `Workout ${i + 1}`,
      created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    })
  );

export const generateMockExercises = (count: number): Exercise[] => 
  Array.from({ length: count }, (_, i) => 
    createMockExercise({ 
      name: `Exercise ${i + 1}`,
      category: ['strength', 'cardio', 'flexibility'][i % 3] as any,
    })
  );

export const generateMockSocialPosts = (count: number): SocialPost[] => 
  Array.from({ length: count }, (_, i) => 
    createMockSocialPost({ 
      content: `Post content ${i + 1}`,
      created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    })
  );

export const generateMockAchievements = (count: number): Achievement[] => 
  Array.from({ length: count }, (_, i) => 
    createMockAchievement({ 
      name: `Achievement ${i + 1}`,
      xp_reward: 50 + i * 10,
    })
  );

// Complex scenario generators
export const createWorkoutScenario = {
  // Empty workout
  empty: () => createMockWorkout({ exercises: [] }),
  
  // Workout in progress
  inProgress: () => createMockWorkout({
    status: 'in_progress',
    started_at: new Date().toISOString(),
    exercises: [
      createMockWorkoutExercise({
        sets: [
          createMockSet({ completed: true }),
          createMockSet({ completed: true }),
          createMockSet({ completed: false }),
        ],
      }),
    ],
  }),
  
  // Completed workout
  completed: () => createMockWorkout({
    status: 'completed',
    started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    completed_at: new Date().toISOString(),
    duration: 3600,
    exercises: [
      createMockWorkoutExercise({
        sets: [
          createMockSet({ completed: true }),
          createMockSet({ completed: true }),
          createMockSet({ completed: true }),
        ],
      }),
    ],
  }),
  
  // Template workout
  template: () => createMockWorkout({
    is_template: true,
    name: 'Push Day Template',
    exercises: [
      createMockWorkoutExercise({ exercise: createMockExercise({ name: 'Bench Press' }) }),
      createMockWorkoutExercise({ exercise: createMockExercise({ name: 'Overhead Press' }) }),
    ],
  }),
};

export const createUserScenario = {
  // New user
  newUser: () => createMockUser({
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
  }),
  
  // Experienced user
  experienced: () => createMockUser({
    stats: {
      level: 25,
      total_xp: 15000,
      current_streak: 45,
      best_streak: 67,
      workouts_completed: 200,
      total_sets: 2000,
      total_reps: 20000,
      total_weight_lifted: 500000,
    },
  }),
  
  // Premium user
  premium: () => createMockUser({
    role: 'premium',
    profile: {
      fitness_level: 'advanced',
      goals: ['strength', 'muscle_gain', 'endurance'],
      scheduled_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      privacy_settings: {
        profile_visibility: 'public',
        workout_sharing: 'public',
        leaderboard_participation: true,
      },
    },
  }),
};