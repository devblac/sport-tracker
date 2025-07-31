/**
 * Achievement System Utilities
 * 
 * This module handles achievement definitions, progress tracking, and unlock logic.
 * It implements the achievement system requirements from the gamification design.
 */

import type {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  AchievementRequirement,
  UserAchievement,
  GamificationEvent,
  GamificationStats
} from '@/types/gamification';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';
import { allFitnessAchievements } from '@/data/fitnessAchievements';
import { validateFitnessAchievement, type AchievementValidationContext } from '@/utils/fitnessAchievementValidators';

// ============================================================================
// Achievement Definitions
// ============================================================================

/**
 * Default achievement configurations
 * Uses the comprehensive fitness achievements from the data module
 */
export const DEFAULT_ACHIEVEMENTS: Achievement[] = allFitnessAchievements;


// ============================================================================
// Achievement Progress Tracking
// ============================================================================

/**
 * Calculate progress for a specific achievement requirement
 */
export function calculateRequirementProgress(
  requirement: AchievementRequirement,
  userStats: any,
  eventData?: any
): number {
  switch (requirement.type) {
    case 'workout_count':
      return userStats.totalWorkouts || 0;

    case 'streak_days':
      return userStats.currentStreak || 0;

    case 'total_volume':
      if (requirement.timeframe === 'daily') {
        return eventData?.dailyVolume || 0;
      }
      return userStats.totalVolume || 0;

    case 'exercise_variety':
      return userStats.uniqueExercises || 0;

    case 'personal_records':
      return userStats.personalRecords || 0;

    case 'social_interactions':
      const interactionType = requirement.additionalCriteria?.type;
      if (interactionType) {
        return userStats.socialInteractions?.[interactionType] || 0;
      }
      return userStats.totalSocialInteractions || 0;

    case 'consistency_score':
      return userStats.consistencyScore || 0;

    case 'time_period':
      // Special handling for time-based achievements
      if (requirement.additionalCriteria?.hour_range && eventData?.workoutTime) {
        const hour = new Date(eventData.workoutTime).getHours();
        const [startHour, endHour] = requirement.additionalCriteria.hour_range;
        return (hour >= startHour && hour <= endHour) ? 1 : 0;
      }
      return 0;

    case 'specific_exercise':
      if (requirement.exerciseId && eventData?.exerciseId) {
        return eventData.exerciseId === requirement.exerciseId ? 1 : 0;
      }
      return 0;

    case 'challenge_wins':
      return userStats.challengeWins || 0;

    default:
      return 0;
  }
}

/**
 * Calculate overall progress for an achievement using fitness validators
 */
export function calculateAchievementProgress(
  achievement: Achievement,
  userStats: GamificationStats,
  eventData?: any
): number {
  // Create a dummy user achievement for validation
  const dummyUserAchievement: UserAchievement = {
    userId: 'temp',
    achievementId: achievement.id,
    progress: 0,
    isUnlocked: false,
    currentValues: {},
    notificationSent: false,
    timesCompleted: 0
  };

  // Create validation context
  const context: AchievementValidationContext = {
    userStats,
    personalRecords: eventData?.personalRecords || [],
    userProfile: eventData?.userProfile || {},
    eventData
  };

  // Use the fitness achievement validator
  const result = validateFitnessAchievement(achievement, dummyUserAchievement, context);
  return result.progress;
}

/**
 * Check if an achievement is unlocked
 */
export function isAchievementUnlocked(
  achievement: Achievement,
  userStats: any,
  eventData?: any
): boolean {
  return calculateAchievementProgress(achievement, userStats, eventData) >= 1;
}

/**
 * Get achievements that should be unlocked based on an event
 */
export function getUnlockableAchievements(
  event: GamificationEvent,
  userStats: any,
  userAchievements: UserAchievement[],
  achievements: Achievement[] = DEFAULT_ACHIEVEMENTS
): Achievement[] {
  const unlockableAchievements: Achievement[] = [];
  const unlockedAchievementIds = new Set(
    userAchievements.filter(ua => ua.isUnlocked).map(ua => ua.achievementId)
  );

  for (const achievement of achievements) {
    // Skip if already unlocked and not repeatable
    if (unlockedAchievementIds.has(achievement.id) && !achievement.isRepeatable) {
      continue;
    }

    // Check if achievement should be unlocked
    if (isAchievementUnlocked(achievement, userStats, event.data)) {
      unlockableAchievements.push(achievement);
    }
  }

  return unlockableAchievements;
}

/**
 * Update user achievement progress using fitness validators
 */
export function updateAchievementProgress(
  userAchievement: UserAchievement,
  achievement: Achievement,
  userStats: GamificationStats,
  eventData?: any
): UserAchievement {
  // Create validation context
  const context: AchievementValidationContext = {
    userStats,
    personalRecords: eventData?.personalRecords || [],
    userProfile: eventData?.userProfile || {},
    eventData
  };

  // Use the fitness achievement validator
  const result = validateFitnessAchievement(achievement, userAchievement, context);

  return {
    ...userAchievement,
    progress: result.progress,
    isUnlocked: result.isUnlocked,
    currentValues: {
      [achievement.requirements.type]: result.currentValue,
      ...result.metadata
    },
    unlockedAt: result.isUnlocked && !userAchievement.isUnlocked ? new Date() : userAchievement.unlockedAt,
    timesCompleted: result.isUnlocked && achievement.isRepeatable 
      ? userAchievement.timesCompleted + 1 
      : userAchievement.timesCompleted
  };
}

// ============================================================================
// Achievement Filtering and Sorting
// ============================================================================

/**
 * Filter achievements by category
 */
export function filterAchievementsByCategory(
  achievements: Achievement[],
  category: AchievementCategory
): Achievement[] {
  return achievements.filter(achievement => achievement.category === category);
}

/**
 * Filter achievements by rarity
 */
export function filterAchievementsByRarity(
  achievements: Achievement[],
  rarity: AchievementRarity
): Achievement[] {
  return achievements.filter(achievement => achievement.rarity === rarity);
}

/**
 * Get unlocked achievements for a user
 */
export function getUnlockedAchievements(
  userAchievements: UserAchievement[],
  achievements: Achievement[] = DEFAULT_ACHIEVEMENTS
): Achievement[] {
  const unlockedIds = new Set(
    userAchievements.filter(ua => ua.isUnlocked).map(ua => ua.achievementId)
  );

  return achievements.filter(achievement => unlockedIds.has(achievement.id));
}

/**
 * Get locked achievements for a user
 */
export function getLockedAchievements(
  userAchievements: UserAchievement[],
  achievements: Achievement[] = DEFAULT_ACHIEVEMENTS
): Achievement[] {
  const unlockedIds = new Set(
    userAchievements.filter(ua => ua.isUnlocked).map(ua => ua.achievementId)
  );

  return achievements
    .filter(achievement => !unlockedIds.has(achievement.id) && !achievement.isSecret)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get achievements close to completion
 */
export function getAchievementsNearCompletion(
  userAchievements: UserAchievement[],
  achievements: Achievement[] = DEFAULT_ACHIEVEMENTS,
  threshold: number = 0.8
): Array<{ achievement: Achievement; progress: number }> {
  const nearCompletion: Array<{ achievement: Achievement; progress: number }> = [];

  for (const userAchievement of userAchievements) {
    if (!userAchievement.isUnlocked && userAchievement.progress >= threshold) {
      const achievement = achievements.find(a => a.id === userAchievement.achievementId);
      if (achievement) {
        nearCompletion.push({
          achievement,
          progress: userAchievement.progress
        });
      }
    }
  }

  return nearCompletion.sort((a, b) => b.progress - a.progress);
}

/**
 * Get achievement statistics
 */
export function getAchievementStats(
  userAchievements: UserAchievement[],
  achievements: Achievement[] = DEFAULT_ACHIEVEMENTS
): {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  rarityBreakdown: Record<AchievementRarity, { unlocked: number; total: number }>;
  categoryBreakdown: Record<AchievementCategory, { unlocked: number; total: number }>;
} {
  const unlockedIds = new Set(
    userAchievements.filter(ua => ua.isUnlocked).map(ua => ua.achievementId)
  );

  const rarityBreakdown: Record<AchievementRarity, { unlocked: number; total: number }> = {
    common: { unlocked: 0, total: 0 },
    uncommon: { unlocked: 0, total: 0 },
    rare: { unlocked: 0, total: 0 },
    epic: { unlocked: 0, total: 0 },
    legendary: { unlocked: 0, total: 0 },
    mythic: { unlocked: 0, total: 0 }
  };

  const categoryBreakdown: Record<AchievementCategory, { unlocked: number; total: number }> = {
    strength: { unlocked: 0, total: 0 },
    consistency: { unlocked: 0, total: 0 },
    social: { unlocked: 0, total: 0 },
    milestone: { unlocked: 0, total: 0 },
    exploration: { unlocked: 0, total: 0 },
    mastery: { unlocked: 0, total: 0 },
    community: { unlocked: 0, total: 0 }
  };

  for (const achievement of achievements) {
    const isUnlocked = unlockedIds.has(achievement.id);

    // Update rarity breakdown
    rarityBreakdown[achievement.rarity].total++;
    if (isUnlocked) {
      rarityBreakdown[achievement.rarity].unlocked++;
    }

    // Update category breakdown
    categoryBreakdown[achievement.category].total++;
    if (isUnlocked) {
      categoryBreakdown[achievement.category].unlocked++;
    }
  }

  return {
    totalAchievements: achievements.length,
    unlockedAchievements: unlockedIds.size,
    completionPercentage: (unlockedIds.size / achievements.length) * 100,
    rarityBreakdown,
    categoryBreakdown
  };
}

// All functions are exported individually above