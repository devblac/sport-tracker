/**
 * Fitness Achievement Validators
 * 
 * Functions to validate and calculate progress for fitness-specific achievements.
 * Each validator checks if an achievement requirement is met and calculates progress.
 */

import type { 
  Achievement, 
  UserAchievement, 
  GamificationStats 
} from '@/types/gamification';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';

export interface AchievementValidationContext {
  userStats: GamificationStats;
  recentWorkouts?: Workout[];
  personalRecords?: PersonalRecord[];
  userProfile?: {
    weight?: number;
    height?: number;
    age?: number;
    gender?: string;
  };
  eventData?: any;
}

export interface ValidationResult {
  isUnlocked: boolean;
  progress: number;
  currentValue: number;
  targetValue: number;
  metadata?: Record<string, any>;
}

/**
 * Base validator function type
 */
export type AchievementValidator = (
  achievement: Achievement,
  userAchievement: UserAchievement,
  context: AchievementValidationContext
) => ValidationResult;

/**
 * Streak-based achievement validator
 */
export const validateStreakAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetDays = (achievement.requirements as any).target;
  const currentStreak = (context.userStats as any).currentStreak || 0;
  
  const progress = Math.min(currentStreak / targetDays, 1);
  const isUnlocked = currentStreak >= targetDays;

  return {
    isUnlocked,
    progress,
    currentValue: currentStreak,
    targetValue: targetDays,
    metadata: {
      streakDays: currentStreak
    }
  };
};

/**
 * Weekly frequency achievement validator
 */
export const validateWeeklyFrequencyAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetWorkouts = (achievement.requirements as any).target;
  const currentWeekWorkouts = (context.userStats as any).workoutsThisWeek || 0;
  
  const progress = Math.min(currentWeekWorkouts / targetWorkouts, 1);
  const isUnlocked = currentWeekWorkouts >= targetWorkouts;

  return {
    isUnlocked,
    progress,
    currentValue: currentWeekWorkouts,
    targetValue: targetWorkouts,
    metadata: {
      weeklyWorkouts: currentWeekWorkouts
    }
  };
};

/**
 * Workout count achievement validator
 */
export const validateWorkoutCountAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetCount = (achievement.requirements as any).target;
  const currentCount = (context.userStats as any).totalWorkouts || 0;
  
  const progress = Math.min(currentCount / targetCount, 1);
  const isUnlocked = currentCount >= targetCount;

  return {
    isUnlocked,
    progress,
    currentValue: currentCount,
    targetValue: targetCount,
    metadata: {
      totalWorkouts: currentCount
    }
  };
};

/**
 * Personal records achievement validator
 */
export const validatePersonalRecordsAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetPRs = (achievement.requirements as any).target;
  const currentPRs = context.personalRecords?.length || 0;
  
  const progress = Math.min(currentPRs / targetPRs, 1);
  const isUnlocked = currentPRs >= targetPRs;

  return {
    isUnlocked,
    progress,
    currentValue: currentPRs,
    targetValue: targetPRs,
    metadata: {
      personalRecords: currentPRs
    }
  };
};

/**
 * Total volume achievement validator
 */
export const validateTotalVolumeAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetVolume = (achievement.requirements as any).target;
  const currentVolume = (context.userStats as any).totalVolumeKg || 0;
  
  const progress = Math.min(currentVolume / targetVolume, 1);
  const isUnlocked = currentVolume >= targetVolume;

  return {
    isUnlocked,
    progress,
    currentValue: currentVolume,
    targetValue: targetVolume,
    metadata: {
      totalVolumeKg: currentVolume
    }
  };
};

/**
 * Bodyweight ratio achievement validator
 */
export const validateBodyweightRatioAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetRatio = (achievement.requirements as any).target;
  const userWeight = context.userProfile?.weight || 70; // Default weight if not provided
  
  let currentMax = 0;
  let exerciseType = '';
  
  // Determine exercise type from achievement ID
  if (achievement.id.includes('bench')) {
    exerciseType = 'bench_press';
  } else if (achievement.id.includes('squat')) {
    exerciseType = 'squat';
  } else if (achievement.id.includes('deadlift')) {
    exerciseType = 'deadlift';
  }
  
  // Find the maximum weight for the specific exercise
  if (context.personalRecords && exerciseType) {
    const exerciseRecords = context.personalRecords.filter(pr => 
      pr.exercise_id.toLowerCase().includes(exerciseType)
    );
    
    if (exerciseRecords.length > 0) {
      currentMax = Math.max(...exerciseRecords.map(pr => pr.value));
    }
  }
  
  const currentRatio = currentMax / userWeight;
  const progress = Math.min(currentRatio / targetRatio, 1);
  const isUnlocked = currentRatio >= targetRatio;

  return {
    isUnlocked,
    progress,
    currentValue: currentRatio,
    targetValue: targetRatio,
    metadata: {
      currentMax,
      userWeight,
      exerciseType,
      ratio: currentRatio
    }
  };
};

/**
 * Total workout time achievement validator
 */
export const validateWorkoutTimeAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetHours = (achievement.requirements as any).target;
  const currentMinutes = (context.userStats as any).totalWorkoutTimeMinutes || 0;
  const currentHours = currentMinutes / 60;
  
  const progress = Math.min(currentHours / targetHours, 1);
  const isUnlocked = currentHours >= targetHours;

  return {
    isUnlocked,
    progress,
    currentValue: currentHours,
    targetValue: targetHours,
    metadata: {
      totalMinutes: currentMinutes,
      totalHours: currentHours
    }
  };
};

/**
 * Days since first workout achievement validator
 */
export const validateDaysSinceFirstWorkoutAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetDays = (achievement.requirements as any).target;
  const firstWorkoutDate = (context.userStats as any).firstWorkoutDate;
  
  if (!firstWorkoutDate) {
    return {
      isUnlocked: false,
      progress: 0,
      currentValue: 0,
      targetValue: targetDays
    };
  }
  
  const daysSinceFirst = Math.floor(
    (Date.now() - new Date(firstWorkoutDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const progress = Math.min(daysSinceFirst / targetDays, 1);
  const isUnlocked = daysSinceFirst >= targetDays;

  return {
    isUnlocked,
    progress,
    currentValue: daysSinceFirst,
    targetValue: targetDays,
    metadata: {
      firstWorkoutDate,
      daysSinceFirst
    }
  };
};

/**
 * Early workouts achievement validator
 */
export const validateEarlyWorkoutsAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetCount = (achievement.requirements as any).target;
  const earlyWorkouts = (context.userStats as any).earlyWorkouts || 0;
  
  const progress = Math.min(earlyWorkouts / targetCount, 1);
  const isUnlocked = earlyWorkouts >= targetCount;

  return {
    isUnlocked,
    progress,
    currentValue: earlyWorkouts,
    targetValue: targetCount,
    metadata: {
      earlyWorkouts
    }
  };
};

/**
 * Late workouts achievement validator
 */
export const validateLateWorkoutsAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetCount = (achievement.requirements as any).target;
  const lateWorkouts = (context.userStats as any).lateWorkouts || 0;
  
  const progress = Math.min(lateWorkouts / targetCount, 1);
  const isUnlocked = lateWorkouts >= targetCount;

  return {
    isUnlocked,
    progress,
    currentValue: lateWorkouts,
    targetValue: targetCount,
    metadata: {
      lateWorkouts
    }
  };
};

/**
 * Unique exercises achievement validator
 */
export const validateUniqueExercisesAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetCount = (achievement.requirements as any).target;
  const uniqueExercises = (context.userStats as any).uniqueExercises || 0;
  
  const progress = Math.min(uniqueExercises / targetCount, 1);
  const isUnlocked = uniqueExercises >= targetCount;

  return {
    isUnlocked,
    progress,
    currentValue: uniqueExercises,
    targetValue: targetCount,
    metadata: {
      uniqueExercises
    }
  };
};

/**
 * Muscle groups per week achievement validator
 */
export const validateMuscleGroupsPerWeekAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetGroups = (achievement.requirements as any).target;
  const muscleGroupsThisWeek = (context.userStats as any).muscleGroupsThisWeek || 0;
  
  const progress = Math.min(muscleGroupsThisWeek / targetGroups, 1);
  const isUnlocked = muscleGroupsThisWeek >= targetGroups;

  return {
    isUnlocked,
    progress,
    currentValue: muscleGroupsThisWeek,
    targetValue: targetGroups,
    metadata: {
      muscleGroupsThisWeek
    }
  };
};

/**
 * Short workouts achievement validator
 */
export const validateShortWorkoutsAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetCount = (achievement.requirements as any).target;
  const shortWorkouts = (context.userStats as any).shortWorkouts || 0;
  
  const progress = Math.min(shortWorkouts / targetCount, 1);
  const isUnlocked = shortWorkouts >= targetCount;

  return {
    isUnlocked,
    progress,
    currentValue: shortWorkouts,
    targetValue: targetCount,
    metadata: {
      shortWorkouts
    }
  };
};

/**
 * Long workout achievement validator
 */
export const validateLongWorkoutAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetMinutes = (achievement.requirements as any).target;
  const longestWorkout = (context.userStats as any).longestWorkoutMinutes || 0;
  
  const progress = Math.min(longestWorkout / targetMinutes, 1);
  const isUnlocked = longestWorkout >= targetMinutes;

  return {
    isUnlocked,
    progress,
    currentValue: longestWorkout,
    targetValue: targetMinutes,
    metadata: {
      longestWorkout
    }
  };
};

/**
 * Midnight workout achievement validator
 */
export const validateMidnightWorkoutAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const midnightWorkouts = (context.userStats as any).midnightWorkouts || 0;
  const isUnlocked = midnightWorkouts >= 1;
  
  return {
    isUnlocked,
    progress: isUnlocked ? 1 : 0,
    currentValue: midnightWorkouts,
    targetValue: 1,
    metadata: {
      midnightWorkouts
    }
  };
};

/**
 * Perfect form sets achievement validator
 */
export const validatePerfectFormSetsAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const targetSets = (achievement.requirements as any).target;
  const perfectFormSets = (context.userStats as any).perfectFormSets || 0;
  
  const progress = Math.min(perfectFormSets / targetSets, 1);
  const isUnlocked = perfectFormSets >= targetSets;

  return {
    isUnlocked,
    progress,
    currentValue: perfectFormSets,
    targetValue: targetSets,
    metadata: {
      perfectFormSets
    }
  };
};

/**
 * Composite mastery achievement validator (for mythic achievements)
 */
export const validateCompositeMasteryAchievement: AchievementValidator = (
  achievement,
  userAchievement,
  context
) => {
  const stats = context.userStats;
  
  // Define mastery criteria
  const masteryRequirements = {
    minLevel: 50,
    minWorkouts: 500,
    minStreak: 100,
    minVolumeKg: 100000,
    minPersonalRecords: 25,
    minUniqueExercises: 50
  };
  
  // Calculate mastery score
  const masteryChecks = [
    (stats.level || 0) >= masteryRequirements.minLevel,
    (stats.totalWorkouts || 0) >= masteryRequirements.minWorkouts,
    (stats.longestStreak || 0) >= masteryRequirements.minStreak,
    (stats.totalVolumeKg || 0) >= masteryRequirements.minVolumeKg,
    (context.personalRecords?.length || 0) >= masteryRequirements.minPersonalRecords,
    (stats.uniqueExercises || 0) >= masteryRequirements.minUniqueExercises
  ];
  
  const completedChecks = masteryChecks.filter(Boolean).length;
  const totalChecks = masteryChecks.length;
  
  const progress = completedChecks / totalChecks;
  const isUnlocked = completedChecks === totalChecks;

  return {
    isUnlocked,
    progress,
    currentValue: completedChecks,
    targetValue: totalChecks,
    metadata: {
      masteryRequirements,
      completedChecks,
      totalChecks,
      individualChecks: {
        level: (stats.level || 0) >= masteryRequirements.minLevel,
        workouts: (stats.totalWorkouts || 0) >= masteryRequirements.minWorkouts,
        streak: (stats.longestStreak || 0) >= masteryRequirements.minStreak,
        volume: (stats.totalVolumeKg || 0) >= masteryRequirements.minVolumeKg,
        personalRecords: (context.personalRecords?.length || 0) >= masteryRequirements.minPersonalRecords,
        uniqueExercises: (stats.uniqueExercises || 0) >= masteryRequirements.minUniqueExercises
      }
    }
  };
};

/**
 * Main validator mapping
 */
export const achievementValidators: Record<string, AchievementValidator> = {
  // Streak validators
  'streak_days': validateStreakAchievement,
  
  // Frequency validators
  'workouts_per_week': validateWeeklyFrequencyAchievement,
  
  // Count validators
  'workout_count': validateWorkoutCountAchievement,
  'personal_records': validatePersonalRecordsAchievement,
  'unique_exercises': validateUniqueExercisesAchievement,
  'early_workouts': validateEarlyWorkoutsAchievement,
  'late_workouts': validateLateWorkoutsAchievement,
  'short_workouts': validateShortWorkoutsAchievement,
  'perfect_form_sets': validatePerfectFormSetsAchievement,
  
  // Volume validators
  'total_volume_kg': validateTotalVolumeAchievement,
  
  // Ratio validators
  'bench_press_bodyweight_ratio': validateBodyweightRatioAchievement,
  'squat_bodyweight_ratio': validateBodyweightRatioAchievement,
  'deadlift_bodyweight_ratio': validateBodyweightRatioAchievement,
  
  // Time validators
  'total_workout_time_hours': validateWorkoutTimeAchievement,
  'days_since_first_workout': validateDaysSinceFirstWorkoutAchievement,
  'long_workout_minutes': validateLongWorkoutAchievement,
  
  // Weekly validators
  'muscle_groups_per_week': validateMuscleGroupsPerWeekAchievement,
  
  // Special validators
  'midnight_workout': validateMidnightWorkoutAchievement,
  'composite_mastery': validateCompositeMasteryAchievement
};

/**
 * Main validation function
 */
export const validateFitnessAchievement = (
  achievement: Achievement,
  userAchievement: UserAchievement,
  context: AchievementValidationContext
): ValidationResult => {
  const validator = achievementValidators[(achievement.requirements as any).type];
  
  if (!validator) {
    console.warn(`No validator found for achievement type: ${(achievement.requirements as any).type}`);
    return {
      isUnlocked: false,
      progress: 0,
      currentValue: 0,
      targetValue: (achievement.requirements as any).target
    };
  }
  
  try {
    return validator(achievement, userAchievement, context);
  } catch (error) {
    console.error(`Error validating achievement ${achievement.id}:`, error);
    return {
      isUnlocked: false,
      progress: 0,
      currentValue: 0,
      targetValue: (achievement.requirements as any).target
    };
  }
};

export default validateFitnessAchievement;