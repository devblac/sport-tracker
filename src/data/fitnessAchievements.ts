/**
 * Fitness-Specific Achievements
 * 
 * Comprehensive collection of fitness-related achievements including
 * consistency, strength, milestones, and specialized fitness goals.
 */

import type { Achievement } from '@/types/gamification';

/**
 * Consistency Achievements
 * Focus on workout frequency, streaks, and regular exercise habits
 */
export const consistencyAchievements: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak_3_days',
    name: 'Getting Started',
    description: 'Complete workouts for 3 consecutive days',
    icon: '🔥',
    category: 'consistency',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'streak_days',
      target: 3,
      timeframe: null
    },
    rewards: {
      xp: 150,
      title: 'Consistent'
    },
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'streak_7_days',
    name: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: '📅',
    category: 'consistency',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'streak_days',
      target: 7,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Week Warrior'
    },
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'streak_30_days',
    name: 'Monthly Master',
    description: 'Achieve a 30-day workout streak',
    icon: '🎯',
    category: 'consistency',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'streak_days',
      target: 30,
      timeframe: null
    },
    rewards: {
      xp: 750,
      title: 'Monthly Master'
    },
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'streak_100_days',
    name: 'Centurion',
    description: 'Reach the legendary 100-day streak',
    icon: '👑',
    category: 'consistency',
    rarity: 'legendary',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'streak_days',
      target: 100,
      timeframe: null
    },
    rewards: {
      xp: 2500,
      title: 'Centurion'
    },
    sortOrder: 4,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'streak_365_days',
    name: 'Unstoppable Force',
    description: 'Complete a full year of consecutive workouts',
    icon: '✨',
    category: 'consistency',
    rarity: 'mythic',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'streak_days',
      target: 365,
      timeframe: null
    },
    rewards: {
      xp: 10000,
      title: 'Unstoppable Force'
    },
    sortOrder: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Frequency Achievements
  {
    id: 'weekly_frequency_3',
    name: 'Regular Routine',
    description: 'Work out 3 times in a week',
    icon: '🔄',
    category: 'consistency',
    rarity: 'common',
    isSecret: false,
    isRepeatable: true,
    requirements: {
      type: 'workouts_per_week',
      target: 3,
      timeframe: 'week'
    },
    rewards: {
      xp: 100,
      title: null
    },
    sortOrder: 6,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'weekly_frequency_5',
    name: 'Dedicated Athlete',
    description: 'Complete 5 workouts in a single week',
    icon: '💪',
    category: 'consistency',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: true,
    requirements: {
      type: 'workouts_per_week',
      target: 5,
      timeframe: 'week'
    },
    rewards: {
      xp: 200,
      title: 'Dedicated'
    },
    sortOrder: 7,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'weekly_frequency_7',
    name: 'Daily Grind',
    description: 'Work out every single day of the week',
    icon: '⚡',
    category: 'consistency',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: true,
    requirements: {
      type: 'workouts_per_week',
      target: 7,
      timeframe: 'week'
    },
    rewards: {
      xp: 400,
      title: 'Daily Grinder'
    },
    sortOrder: 8,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Time-based Consistency
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 workouts before 7 AM',
    icon: '🕐',
    category: 'consistency',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'early_workouts',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Early Bird'
    },
    sortOrder: 9,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 workouts after 9 PM',
    icon: '⭐',
    category: 'consistency',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'late_workouts',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Night Owl'
    },
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Strength Achievements
 * Focus on personal records, weight progression, and strength milestones
 */
export const strengthAchievements: Achievement[] = [
  // Personal Record Achievements
  {
    id: 'first_pr',
    name: 'Personal Best',
    description: 'Set your first personal record',
    icon: '📈',
    category: 'strength',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'personal_records',
      target: 1,
      timeframe: null
    },
    rewards: {
      xp: 200,
      title: 'Record Setter'
    },
    sortOrder: 11,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pr_collector',
    name: 'PR Collector',
    description: 'Set 10 personal records',
    icon: '🏅',
    category: 'strength',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'personal_records',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 500,
      title: 'PR Collector'
    },
    sortOrder: 12,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pr_machine',
    name: 'PR Machine',
    description: 'Achieve 25 personal records',
    icon: '🚀',
    category: 'strength',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'personal_records',
      target: 25,
      timeframe: null
    },
    rewards: {
      xp: 1000,
      title: 'PR Machine'
    },
    sortOrder: 13,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Volume Achievements
  {
    id: 'volume_10k',
    name: 'Volume Rookie',
    description: 'Lift a total of 10,000 kg in your workouts',
    icon: '🏋️',
    category: 'strength',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_volume_kg',
      target: 10000,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Volume Rookie'
    },
    sortOrder: 14,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'volume_50k',
    name: 'Heavy Lifter',
    description: 'Reach 50,000 kg total volume',
    icon: '⛰️',
    category: 'strength',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_volume_kg',
      target: 50000,
      timeframe: null
    },
    rewards: {
      xp: 750,
      title: 'Heavy Lifter'
    },
    sortOrder: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'volume_100k',
    name: 'Iron Warrior',
    description: 'Achieve 100,000 kg total volume',
    icon: '👑',
    category: 'strength',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_volume_kg',
      target: 100000,
      timeframe: null
    },
    rewards: {
      xp: 1500,
      title: 'Iron Warrior'
    },
    sortOrder: 16,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'volume_500k',
    name: 'Strength Legend',
    description: 'Lift an incredible 500,000 kg total volume',
    icon: '✨',
    category: 'strength',
    rarity: 'legendary',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_volume_kg',
      target: 500000,
      timeframe: null
    },
    rewards: {
      xp: 5000,
      title: 'Strength Legend'
    },
    sortOrder: 17,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Specific Lift Achievements
  {
    id: 'bench_bodyweight',
    name: 'Bodyweight Bench',
    description: 'Bench press your own bodyweight',
    icon: '🎯',
    category: 'strength',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'bench_press_bodyweight_ratio',
      target: 1.0,
      timeframe: null
    },
    rewards: {
      xp: 400,
      title: 'Bodyweight Bencher'
    },
    sortOrder: 18,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'squat_1_5_bodyweight',
    name: 'Strong Legs',
    description: 'Squat 1.5x your bodyweight',
    icon: '🦵',
    category: 'strength',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'squat_bodyweight_ratio',
      target: 1.5,
      timeframe: null
    },
    rewards: {
      xp: 600,
      title: 'Strong Legs'
    },
    sortOrder: 19,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'deadlift_2_bodyweight',
    name: 'Deadlift Destroyer',
    description: 'Deadlift 2x your bodyweight',
    icon: '⚡',
    category: 'strength',
    rarity: 'epic',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'deadlift_bodyweight_ratio',
      target: 2.0,
      timeframe: null
    },
    rewards: {
      xp: 1000,
      title: 'Deadlift Destroyer'
    },
    sortOrder: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Milestone Achievements
 * Focus on workout count, time spent, and major fitness milestones
 */
export const milestoneAchievements: Achievement[] = [
  // Workout Count Milestones
  {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your very first workout',
    icon: '🏆',
    category: 'milestone',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 1,
      timeframe: null
    },
    rewards: {
      xp: 100,
      title: 'Beginner'
    },
    sortOrder: 21,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'workout_10',
    name: 'Getting Into It',
    description: 'Complete 10 workouts',
    icon: '✅',
    category: 'milestone',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 200,
      title: 'Committed'
    },
    sortOrder: 22,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'workout_50',
    name: 'Halfway Hero',
    description: 'Reach 50 completed workouts',
    icon: '🏅',
    category: 'milestone',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 50,
      timeframe: null
    },
    rewards: {
      xp: 500,
      title: 'Halfway Hero'
    },
    sortOrder: 23,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'workout_100',
    name: 'Century Club',
    description: 'Join the exclusive 100 workout club',
    icon: '👑',
    category: 'milestone',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 100,
      timeframe: null
    },
    rewards: {
      xp: 1000,
      title: 'Century Member'
    },
    sortOrder: 24,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'workout_500',
    name: 'Fitness Veteran',
    description: 'Complete an impressive 500 workouts',
    icon: '🥇',
    category: 'milestone',
    rarity: 'epic',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 500,
      timeframe: null
    },
    rewards: {
      xp: 2500,
      title: 'Fitness Veteran'
    },
    sortOrder: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'workout_1000',
    name: 'Legendary Athlete',
    description: 'Achieve the legendary 1000 workout milestone',
    icon: '✨',
    category: 'milestone',
    rarity: 'legendary',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'workout_count',
      target: 1000,
      timeframe: null
    },
    rewards: {
      xp: 5000,
      title: 'Legendary Athlete'
    },
    sortOrder: 26,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Time-based Milestones
  {
    id: 'time_10_hours',
    name: 'Time Investor',
    description: 'Spend 10 hours working out',
    icon: '⏱️',
    category: 'milestone',
    rarity: 'common',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_workout_time_hours',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 200,
      title: 'Time Investor'
    },
    sortOrder: 27,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'time_50_hours',
    name: 'Dedicated Trainer',
    description: 'Accumulate 50 hours of workout time',
    icon: '❤️',
    category: 'milestone',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_workout_time_hours',
      target: 50,
      timeframe: null
    },
    rewards: {
      xp: 500,
      title: 'Dedicated Trainer'
    },
    sortOrder: 28,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'time_100_hours',
    name: 'Time Champion',
    description: 'Reach 100 hours of total workout time',
    icon: '👑',
    category: 'milestone',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'total_workout_time_hours',
      target: 100,
      timeframe: null
    },
    rewards: {
      xp: 1000,
      title: 'Time Champion'
    },
    sortOrder: 29,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Special Milestones
  {
    id: 'first_month',
    name: 'Month Survivor',
    description: 'Stay active for your first month',
    icon: '📅',
    category: 'milestone',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'days_since_first_workout',
      target: 30,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Month Survivor'
    },
    sortOrder: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'first_year',
    name: 'Annual Achiever',
    description: 'Complete your first year of fitness',
    icon: '⭐',
    category: 'milestone',
    rarity: 'epic',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'days_since_first_workout',
      target: 365,
      timeframe: null
    },
    rewards: {
      xp: 2000,
      title: 'Annual Achiever'
    },
    sortOrder: 31,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Specialized Fitness Achievements
 * Unique and creative achievements for specific fitness behaviors
 */
export const specializedAchievements: Achievement[] = [
  // Exercise Variety
  {
    id: 'exercise_explorer',
    name: 'Exercise Explorer',
    description: 'Try 25 different exercises',
    icon: '🎯',
    category: 'exploration',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'unique_exercises',
      target: 25,
      timeframe: null
    },
    rewards: {
      xp: 400,
      title: 'Explorer'
    },
    sortOrder: 32,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'muscle_group_master',
    name: 'Muscle Group Master',
    description: 'Work all major muscle groups in a week',
    icon: '📊',
    category: 'exploration',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: true,
    requirements: {
      type: 'muscle_groups_per_week',
      target: 8,
      timeframe: 'week'
    },
    rewards: {
      xp: 600,
      title: 'Muscle Master'
    },
    sortOrder: 33,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Workout Duration
  {
    id: 'quick_session',
    name: 'Efficiency Expert',
    description: 'Complete 10 workouts under 30 minutes',
    icon: '⚡',
    category: 'mastery',
    rarity: 'uncommon',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'short_workouts',
      target: 10,
      timeframe: null
    },
    rewards: {
      xp: 300,
      title: 'Efficiency Expert'
    },
    sortOrder: 34,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'endurance_beast',
    name: 'Endurance Beast',
    description: 'Complete a 2-hour workout session',
    icon: '⛰️',
    category: 'mastery',
    rarity: 'rare',
    isSecret: false,
    isRepeatable: false,
    requirements: {
      type: 'long_workout_minutes',
      target: 120,
      timeframe: null
    },
    rewards: {
      xp: 800,
      title: 'Endurance Beast'
    },
    sortOrder: 35,
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Secret Achievements
  {
    id: 'midnight_warrior',
    name: 'Midnight Warrior',
    description: 'Complete a workout at exactly midnight',
    icon: '🌙',
    category: 'mastery',
    rarity: 'rare',
    isSecret: true,
    isRepeatable: false,
    requirements: {
      type: 'midnight_workout',
      target: 1,
      timeframe: null
    },
    rewards: {
      xp: 500,
      title: 'Midnight Warrior'
    },
    sortOrder: 36,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'perfect_form',
    name: 'Form Perfectionist',
    description: 'Complete 100 sets with perfect form ratings',
    icon: '🥇',
    category: 'mastery',
    rarity: 'epic',
    isSecret: true,
    isRepeatable: false,
    requirements: {
      type: 'perfect_form_sets',
      target: 100,
      timeframe: null
    },
    rewards: {
      xp: 1200,
      title: 'Form Perfectionist'
    },
    sortOrder: 37,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'fitness_deity',
    name: 'Fitness Deity',
    description: 'Achieve the ultimate level of fitness mastery',
    icon: '✨',
    category: 'mastery',
    rarity: 'mythic',
    isSecret: true,
    isRepeatable: false,
    requirements: {
      type: 'composite_mastery',
      target: 1,
      timeframe: null
    },
    rewards: {
      xp: 10000,
      title: 'Fitness Deity'
    },
    sortOrder: 38,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * All Fitness Achievements Combined
 */
export const allFitnessAchievements: Achievement[] = [
  ...consistencyAchievements,
  ...strengthAchievements,
  ...milestoneAchievements,
  ...specializedAchievements
];

/**
 * Achievement Categories for Easy Access
 */
export const achievementCategories = {
  consistency: consistencyAchievements,
  strength: strengthAchievements,
  milestone: milestoneAchievements,
  specialized: specializedAchievements
};

export default allFitnessAchievements;