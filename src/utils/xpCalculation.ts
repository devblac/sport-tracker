/**
 * XP Calculation Utilities
 * 
 * This module contains all the logic for calculating XP rewards based on user activities.
 * It implements the gamification requirements from the design document.
 */

import type { 
  XPSource, 
  XPCalculationConfig, 
  UserStreak,
  GamificationEvent 
} from '@/types/gamification';
import type { Workout, WorkoutExercise } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';

// ============================================================================
// Default XP Configuration
// ============================================================================

export const DEFAULT_XP_CONFIG: XPCalculationConfig = {
  baseWorkoutXP: 20,
  durationMultiplier: 1, // 1 XP per minute (max 60)
  volumeMultiplier: 0.01, // 1 XP per 100kg (max 50)
  exerciseVarietyBonus: 5, // 5 XP per exercise (max 30)
  personalRecordBonus: 50, // 50 XP per PR
  streakMultipliers: {
    7: 1.2,   // 20% bonus after 1 week
    14: 1.3,  // 30% bonus after 2 weeks
    30: 1.5,  // 50% bonus after 1 month
    60: 1.7,  // 70% bonus after 2 months
    90: 2.0,  // 100% bonus after 3 months
  },
  premiumMultiplier: 1.25, // 25% bonus for premium users
  weekendBonus: 1.1, // 10% bonus on weekends
};

// ============================================================================
// XP Calculation Functions
// ============================================================================

/**
 * Calculate XP for completing a workout
 */
export function calculateWorkoutXP(
  workout: Workout,
  userStreak: UserStreak,
  isPremium: boolean = false,
  config: XPCalculationConfig = DEFAULT_XP_CONFIG
): number {
  let totalXP = config.baseWorkoutXP;

  // Duration bonus (1 XP per minute, max 60)
  if (workout.duration) {
    const durationMinutes = Math.floor(workout.duration / 60);
    const durationXP = Math.min(durationMinutes * config.durationMultiplier, 60);
    totalXP += durationXP;
  }

  // Volume bonus (1 XP per 100kg, max 50)
  if (workout.total_volume) {
    const volumeXP = Math.min(
      Math.floor(workout.total_volume / 100) * (1 / config.volumeMultiplier),
      50
    );
    totalXP += volumeXP;
  }

  // Exercise variety bonus (5 XP per exercise, max 30)
  const uniqueExercises = new Set(workout.exercises.map(e => e.exercise_id)).size;
  const varietyXP = Math.min(uniqueExercises * config.exerciseVarietyBonus, 30);
  totalXP += varietyXP;

  // Set count bonus (2 XP per set, max 40)
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const setXP = Math.min(totalSets * 2, 40);
  totalXP += setXP;

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(userStreak.currentStreak, config);
  totalXP *= streakMultiplier;

  // Apply premium multiplier
  if (isPremium) {
    totalXP *= config.premiumMultiplier;
  }

  // Apply weekend bonus
  const workoutDate = workout.completed_at || new Date();
  if (isWeekend(workoutDate)) {
    totalXP *= config.weekendBonus;
  }

  // Apply difficulty multiplier based on workout intensity
  const difficultyMultiplier = calculateDifficultyMultiplier(workout);
  totalXP *= difficultyMultiplier;

  return Math.round(totalXP);
}

/**
 * Calculate XP for achieving a personal record
 */
export function calculatePersonalRecordXP(
  personalRecord: PersonalRecord,
  improvement: number,
  config: XPCalculationConfig = DEFAULT_XP_CONFIG
): number {
  let baseXP = config.personalRecordBonus;

  // Bonus based on improvement percentage
  const improvementMultiplier = Math.min(1 + (improvement / 100), 2.0); // Max 2x multiplier
  baseXP *= improvementMultiplier;

  // Bonus for different types of PRs
  const typeMultipliers = {
    max_weight: 1.0,
    max_reps: 0.8,
    max_volume: 1.2,
    max_1rm: 1.5,
    best_time: 0.9,
  };

  const typeMultiplier = typeMultipliers[personalRecord.type] || 1.0;
  baseXP *= typeMultiplier;

  return Math.round(baseXP);
}

/**
 * Calculate XP for streak milestones
 */
export function calculateStreakMilestoneXP(streakDays: number): number {
  const milestones = [
    { days: 7, xp: 100 },
    { days: 14, xp: 200 },
    { days: 30, xp: 500 },
    { days: 60, xp: 1000 },
    { days: 90, xp: 2000 },
    { days: 180, xp: 5000 },
    { days: 365, xp: 10000 },
  ];

  const milestone = milestones
    .reverse()
    .find(m => streakDays >= m.days);

  return milestone?.xp || 0;
}

/**
 * Calculate XP for social interactions
 */
export function calculateSocialXP(interactionType: string): number {
  const socialXPValues = {
    like_given: 1,
    like_received: 2,
    comment_given: 3,
    comment_received: 5,
    share_given: 5,
    share_received: 10,
    friend_added: 20,
    workout_shared: 15,
    achievement_shared: 25,
    challenge_created: 50,
    challenge_joined: 10,
    mentor_session: 100,
  };

  return (socialXPValues as any)[interactionType] || 0;
}

/**
 * Calculate XP for challenge completion
 */
export function calculateChallengeXP(
  challengeType: string,
  rank: number,
  totalParticipants: number,
  challengeDifficulty: number
): number {
  let baseXP = 100 * challengeDifficulty;

  // Rank-based multiplier
  const rankPercentile = rank / totalParticipants;
  let rankMultiplier = 1.0;

  if (rankPercentile <= 0.1) {
    rankMultiplier = 3.0; // Top 10%
  } else if (rankPercentile <= 0.25) {
    rankMultiplier = 2.0; // Top 25%
  } else if (rankPercentile <= 0.5) {
    rankMultiplier = 1.5; // Top 50%
  }

  // Challenge type multiplier
  const typeMultipliers = {
    individual: 1.0,
    group: 1.2,
    global: 1.5,
    seasonal: 2.0,
  };

  const typeMultiplier = (typeMultipliers as any)[challengeType] || 1.0;

  return Math.round(baseXP * rankMultiplier * typeMultiplier);
}

/**
 * Calculate XP for consistency bonus
 */
export function calculateConsistencyXP(
  workoutsThisWeek: number,
  scheduledDaysThisWeek: number
): number {
  if (workoutsThisWeek === 0 || scheduledDaysThisWeek === 0) {
    return 0;
  }

  const consistencyRatio = workoutsThisWeek / scheduledDaysThisWeek;
  
  if (consistencyRatio >= 1.0) {
    return 100; // Perfect week bonus
  } else if (consistencyRatio >= 0.8) {
    return 50; // Good consistency bonus
  } else if (consistencyRatio >= 0.6) {
    return 25; // Decent consistency bonus
  }

  return 0;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get streak multiplier based on current streak
 */
function getStreakMultiplier(
  currentStreak: number,
  config: XPCalculationConfig
): number {
  const streakLevels = Object.keys(config.streakMultipliers)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const level of streakLevels) {
    if (currentStreak >= level) {
      return config.streakMultipliers[level];
    }
  }

  return 1.0; // No multiplier
}

/**
 * Check if a date is on weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculate difficulty multiplier based on workout characteristics
 */
function calculateDifficultyMultiplier(workout: Workout): number {
  let multiplier = 1.0;

  // Count failure sets (higher difficulty)
  const failureSets = workout.exercises.reduce((count, exercise) => {
    return count + exercise.sets.filter(set => set.type === 'failure').length;
  }, 0);

  // Count drop sets (higher difficulty)
  const dropSets = workout.exercises.reduce((count, exercise) => {
    return count + exercise.sets.filter(set => set.type === 'dropset').length;
  }, 0);

  // Bonus for intensity techniques
  if (failureSets > 0) {
    multiplier += 0.1 * failureSets; // 10% per failure set
  }

  if (dropSets > 0) {
    multiplier += 0.05 * dropSets; // 5% per drop set
  }

  // Bonus for workout duration (longer workouts are harder)
  if (workout.duration) {
    const durationHours = workout.duration / 3600;
    if (durationHours > 1.5) {
      multiplier += 0.2; // 20% bonus for long workouts
    } else if (durationHours > 1.0) {
      multiplier += 0.1; // 10% bonus for medium workouts
    }
  }

  // Cap the multiplier at 2.0
  return Math.min(multiplier, 2.0);
}

/**
 * Calculate total XP for any gamification event
 */
export function calculateEventXP(
  event: GamificationEvent,
  userStreak: UserStreak,
  isPremium: boolean = false,
  config: XPCalculationConfig = DEFAULT_XP_CONFIG
): number {
  switch (event.type) {
    case 'workout_completed':
      return calculateWorkoutXP(
        event.data.workout,
        userStreak,
        isPremium,
        config
      );

    case 'pr_achieved':
      return calculatePersonalRecordXP(
        event.data.personalRecord,
        event.data.improvement,
        config
      );

    case 'streak_milestone':
      return calculateStreakMilestoneXP(event.data.streakDays);

    case 'social_interaction':
      return calculateSocialXP(event.data.interactionType);

    case 'challenge_joined':
      return 10; // Fixed XP for joining challenges

    case 'achievement_unlocked':
      return event.data.achievement?.rewards?.xp || 0;

    default:
      return 0;
  }
}

/**
 * Calculate XP with all bonuses and multipliers applied
 */
export function calculateFinalXP(
  baseXP: number,
  bonuses: {
    streakMultiplier?: number;
    premiumMultiplier?: number;
    weekendBonus?: number;
    eventMultiplier?: number;
  }
): number {
  let finalXP = baseXP;

  // Apply all multipliers
  if (bonuses.streakMultiplier) {
    finalXP *= bonuses.streakMultiplier;
  }

  if (bonuses.premiumMultiplier) {
    finalXP *= bonuses.premiumMultiplier;
  }

  if (bonuses.weekendBonus) {
    finalXP *= bonuses.weekendBonus;
  }

  if (bonuses.eventMultiplier) {
    finalXP *= bonuses.eventMultiplier;
  }

  return Math.round(finalXP);
}

// ============================================================================
// XP Validation and Limits
// ============================================================================

/**
 * Validate XP amount to prevent exploitation
 */
export function validateXPAmount(xp: number, source: XPSource): boolean {
  const maxXPLimits = {
    workout_completion: 1000,
    personal_record: 500,
    streak_milestone: 10000,
    achievement_unlock: 5000,
    social_interaction: 100,
    challenge_completion: 2000,
    consistency_bonus: 200,
    volume_milestone: 300,
    first_time_bonus: 100,
    perfect_week: 500,
    mentor_activity: 1000,
  };

  const maxXP = maxXPLimits[source] || 100;
  return xp >= 0 && xp <= maxXP;
}

/**
 * Apply daily XP limits to prevent grinding
 */
export function applyDailyXPLimit(
  currentDailyXP: number,
  newXP: number,
  isPremium: boolean = false
): number {
  const dailyLimit = isPremium ? 2000 : 1000;
  const remainingXP = Math.max(0, dailyLimit - currentDailyXP);
  
  return Math.min(newXP, remainingXP);
}

// All functions are exported individually above