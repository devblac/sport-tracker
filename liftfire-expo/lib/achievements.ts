/**
 * Achievement System - MVP Version
 * 
 * Simple achievement definitions and unlock logic.
 * Focuses on basic milestones: first workout, workout count, and streaks.
 */

import type { AchievementDefinition, UserStats } from '../types';

// ============================================================================
// Achievement Definitions
// ============================================================================

/**
 * All available achievements in the MVP
 * 
 * Each achievement has:
 * - type: Unique identifier
 * - title: Display name
 * - description: What the user needs to do
 * - icon: Emoji icon
 * - checkUnlock: Function to check if achievement should be unlocked
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // First Workout
  {
    type: 'first_workout',
    title: 'First Steps',
    description: 'Complete your very first workout',
    icon: '🏆',
    checkUnlock: (stats: UserStats) => stats.workoutCount >= 1,
  },

  // Workout Count Milestones
  {
    type: 'workout_10',
    title: 'Getting Into It',
    description: 'Complete 10 workouts',
    icon: '✅',
    checkUnlock: (stats: UserStats) => stats.workoutCount >= 10,
  },
  {
    type: 'workout_25',
    title: 'Quarter Century',
    description: 'Complete 25 workouts',
    icon: '🎯',
    checkUnlock: (stats: UserStats) => stats.workoutCount >= 25,
  },
  {
    type: 'workout_50',
    title: 'Halfway Hero',
    description: 'Reach 50 completed workouts',
    icon: '🏅',
    checkUnlock: (stats: UserStats) => stats.workoutCount >= 50,
  },
  {
    type: 'workout_100',
    title: 'Century Club',
    description: 'Join the exclusive 100 workout club',
    icon: '👑',
    checkUnlock: (stats: UserStats) => stats.workoutCount >= 100,
  },

  // Streak Achievements
  {
    type: 'streak_3_days',
    title: 'Getting Started',
    description: 'Complete workouts for 3 consecutive days',
    icon: '🔥',
    checkUnlock: (stats: UserStats) => stats.currentStreak >= 3,
  },
  {
    type: 'streak_7_days',
    title: 'Week Warrior',
    description: 'Maintain a 7-day workout streak',
    icon: '📅',
    checkUnlock: (stats: UserStats) => stats.currentStreak >= 7,
  },
  {
    type: 'streak_14_days',
    title: 'Two Week Champion',
    description: 'Keep your streak going for 14 days',
    icon: '⚡',
    checkUnlock: (stats: UserStats) => stats.currentStreak >= 14,
  },
  {
    type: 'streak_30_days',
    title: 'Monthly Master',
    description: 'Achieve a 30-day workout streak',
    icon: '🎯',
    checkUnlock: (stats: UserStats) => stats.currentStreak >= 30,
  },
  {
    type: 'streak_100_days',
    title: 'Centurion',
    description: 'Reach the legendary 100-day streak',
    icon: '✨',
    checkUnlock: (stats: UserStats) => stats.currentStreak >= 100,
  },

  // Level Achievements
  {
    type: 'level_5',
    title: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
    checkUnlock: (stats: UserStats) => stats.level >= 5,
  },
  {
    type: 'level_10',
    title: 'Dedicated Athlete',
    description: 'Reach level 10',
    icon: '💪',
    checkUnlock: (stats: UserStats) => stats.level >= 10,
  },
  {
    type: 'level_20',
    title: 'Fitness Legend',
    description: 'Reach the legendary level 20',
    icon: '👑',
    checkUnlock: (stats: UserStats) => stats.level >= 20,
  },
];

// ============================================================================
// Achievement Checking Functions
// ============================================================================

/**
 * Check which achievements should be unlocked based on user stats
 * 
 * @param stats - Current user statistics
 * @param unlockedAchievements - Array of already unlocked achievement types
 * @returns Array of newly unlocked achievement types
 */
export function checkNewAchievements(
  stats: UserStats,
  unlockedAchievements: string[]
): string[] {
  const newAchievements: string[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlockedAchievements.includes(achievement.type)) {
      continue;
    }

    // Check if achievement should be unlocked
    if (achievement.checkUnlock(stats)) {
      newAchievements.push(achievement.type);
    }
  }

  return newAchievements;
}

/**
 * Get achievement definition by type
 * 
 * @param type - Achievement type identifier
 * @returns Achievement definition or undefined
 */
export function getAchievementDefinition(type: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find(a => a.type === type);
}

/**
 * Get all achievement definitions
 * 
 * @returns Array of all achievement definitions
 */
export function getAllAchievements(): AchievementDefinition[] {
  return ACHIEVEMENTS;
}

/**
 * Get achievement progress for display
 * 
 * @param stats - Current user statistics
 * @param unlockedAchievements - Array of already unlocked achievement types
 * @returns Array of achievements with unlock status and progress
 */
export function getAchievementProgress(
  stats: UserStats,
  unlockedAchievements: string[]
) {
  return ACHIEVEMENTS.map(achievement => {
    const isUnlocked = unlockedAchievements.includes(achievement.type);
    const canUnlock = achievement.checkUnlock(stats);

    return {
      ...achievement,
      isUnlocked,
      canUnlock,
    };
  });
}

/**
 * Calculate achievement completion percentage
 * 
 * @param unlockedAchievements - Array of unlocked achievement types
 * @returns Percentage of achievements unlocked (0-100)
 */
export function getAchievementCompletionPercentage(unlockedAchievements: string[]): number {
  if (ACHIEVEMENTS.length === 0) {
    return 0;
  }

  const percentage = (unlockedAchievements.length / ACHIEVEMENTS.length) * 100;
  return Math.round(percentage);
}
