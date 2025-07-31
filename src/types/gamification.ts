/**
 * Gamification System Types
 * 
 * This file contains all TypeScript interfaces and types for the gamification system
 * including XP, levels, achievements, streaks, and challenges.
 */

// ============================================================================
// XP and Level System
// ============================================================================

/**
 * Sources of XP that users can earn
 */
export type XPSource = 
  | 'workout_completion'
  | 'personal_record'
  | 'streak_milestone'
  | 'achievement_unlock'
  | 'social_interaction'
  | 'challenge_completion'
  | 'consistency_bonus'
  | 'volume_milestone'
  | 'first_time_bonus'
  | 'perfect_week'
  | 'mentor_activity';

/**
 * XP transaction record
 */
export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: XPSource;
  sourceId?: string; // ID of the workout, achievement, etc.
  description: string;
  multiplier?: number; // For bonus weekends, premium users, etc.
  createdAt: Date;
}

/**
 * User's current XP and level information
 */
export interface UserLevel {
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-1 percentage to next level
  title: string;
  perks: string[];
  updatedAt: Date;
}

/**
 * Level configuration and requirements
 */
export interface LevelConfig {
  level: number;
  xpRequired: number;
  title: string;
  description: string;
  perks: string[];
  unlockedFeatures: string[];
  badgeIcon?: string;
  badgeColor?: string;
}

/**
 * XP calculation configuration
 */
export interface XPCalculationConfig {
  baseWorkoutXP: number; // Base XP for completing a workout
  durationMultiplier: number; // XP per minute of workout
  volumeMultiplier: number; // XP per kg lifted
  exerciseVarietyBonus: number; // Bonus for trying new exercises
  personalRecordBonus: number; // Bonus for setting PRs
  streakMultipliers: {
    [days: number]: number; // Multiplier based on streak length
  };
  premiumMultiplier: number; // Multiplier for premium users
  weekendBonus: number; // Weekend bonus multiplier
}

// ============================================================================
// Achievement System
// ============================================================================

/**
 * Achievement categories
 */
export type AchievementCategory = 
  | 'strength'
  | 'consistency'
  | 'social'
  | 'milestone'
  | 'exploration'
  | 'mastery'
  | 'community';

/**
 * Achievement rarity levels
 */
export type AchievementRarity = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

/**
 * Achievement requirement types
 */
export type AchievementRequirementType =
  | 'workout_count'
  | 'streak_days'
  | 'total_volume'
  | 'exercise_variety'
  | 'personal_records'
  | 'social_interactions'
  | 'consistency_score'
  | 'time_period'
  | 'specific_exercise'
  | 'challenge_wins';

/**
 * Achievement requirement definition
 */
export interface AchievementRequirement {
  type: AchievementRequirementType;
  targetValue: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  exerciseId?: string; // For exercise-specific achievements
  additionalCriteria?: Record<string, any>;
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirements: AchievementRequirement[];
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
    unlockedContent?: string[];
    premiumDays?: number; // Temporary premium access
  };
  isSecret: boolean; // Hidden until unlocked
  isRepeatable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's achievement progress and unlock status
 */
export interface UserAchievement {
  userId: string;
  achievementId: string;
  progress: number; // 0-1 completion percentage
  isUnlocked: boolean;
  unlockedAt?: Date;
  currentValues: Record<string, number>; // Current progress values
  notificationSent: boolean;
  timesCompleted: number; // For repeatable achievements
}

/**
 * Achievement unlock event
 */
export interface AchievementUnlock {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  celebrationShown: boolean;
  sharedToSocial: boolean;
}

// ============================================================================
// Streak System
// ============================================================================

/**
 * User's scheduled workout days for intelligent streaks
 */
export interface StreakSchedule {
  userId: string;
  scheduledDays: string[]; // ['monday', 'wednesday', 'friday']
  timezone: string;
  allowCompensation: boolean; // Can make up missed days
  compensationWindow: number; // Days to make up missed workout
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Streak compensation record
 */
export interface StreakCompensation {
  id: string;
  userId: string;
  missedDate: Date;
  compensatedDate: Date;
  workoutId: string;
  createdAt: Date;
}

/**
 * Sick day or vacation day usage
 */
export interface StreakFreeze {
  id: string;
  userId: string;
  type: 'sick_day' | 'vacation_day' | 'emergency';
  startDate: Date;
  endDate: Date;
  reason?: string;
  approved: boolean;
  createdAt: Date;
}

/**
 * User's current streak information
 */
export interface UserStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  lastWorkoutDate?: Date;
  streakStartDate?: Date;
  scheduledDays: string[];
  compensationsUsed: number;
  sickDaysUsed: number;
  vacationDaysUsed: number;
  maxSickDays: number;
  maxVacationDays: number;
  lastSickDayReset: Date;
  lastVacationDayReset: Date;
  streakFreezes: StreakFreeze[];
  updatedAt: Date;
}

/**
 * Streak milestone rewards
 */
export interface StreakMilestone {
  days: number;
  name: string;
  description: string;
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
    premiumDays?: number;
    unlockedFeatures?: string[];
  };
  celebrationLevel: 'normal' | 'epic' | 'legendary';
}

// ============================================================================
// Challenge System
// ============================================================================

/**
 * Challenge types
 */
export type ChallengeType = 
  | 'individual'
  | 'group'
  | 'global'
  | 'guild'
  | 'seasonal';

/**
 * Challenge categories
 */
export type ChallengeCategory = 
  | 'strength'
  | 'endurance'
  | 'consistency'
  | 'volume'
  | 'variety'
  | 'social'
  | 'speed'
  | 'technique';

/**
 * Challenge status
 */
export type ChallengeStatus = 
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'cancelled';

/**
 * Challenge requirement definition
 */
export interface ChallengeRequirement {
  type: 'workout_count' | 'total_volume' | 'streak_days' | 'exercise_variety' | 'social_score';
  targetValue: number;
  unit: string;
  description: string;
}

/**
 * Challenge definition
 */
export interface Challenge {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  type: ChallengeType;
  category: ChallengeCategory;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  requirements: ChallengeRequirement[];
  rewards: {
    winner: {
      xp: number;
      badge: string;
      title: string;
      premiumDays?: number;
    };
    participant: {
      xp: number;
      badge?: string;
    };
    completion: {
      xp: number;
      badge?: string;
    };
  };
  maxParticipants?: number;
  currentParticipants: number;
  isPublic: boolean;
  createdBy: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's participation in a challenge
 */
export interface ChallengeParticipant {
  challengeId: string;
  userId: string;
  joinedAt: Date;
  progress: number; // 0-1 completion percentage
  currentValue: number;
  rank: number;
  isCompleted: boolean;
  completedAt?: Date;
  rewardsClaimed: boolean;
  lastUpdated: Date;
}

/**
 * Challenge leaderboard entry
 */
export interface ChallengeLeaderboard {
  challengeId: string;
  participants: Array<{
    userId: string;
    username: string;
    avatar?: string;
    progress: number;
    currentValue: number;
    rank: number;
    isCompleted: boolean;
  }>;
  lastUpdated: Date;
}

// ============================================================================
// Gamification Statistics
// ============================================================================

/**
 * User's overall gamification statistics
 */
export interface GamificationStats {
  userId: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  challengesCompleted: number;
  challengesWon: number;
  socialScore: number;
  consistencyScore: number; // 0-100 based on workout frequency
  strengthScore: number; // Based on PRs and volume
  varietyScore: number; // Based on exercise diversity
  lastActive: Date;
  updatedAt: Date;
}

/**
 * Gamification event for tracking user actions
 */
export interface GamificationEvent {
  id: string;
  userId: string;
  type: 'workout_completed' | 'pr_achieved' | 'streak_milestone' | 'achievement_unlocked' | 'challenge_joined' | 'social_interaction';
  data: Record<string, any>;
  xpAwarded: number;
  achievementsTriggered: string[];
  createdAt: Date;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * XP award result
 */
export interface XPAwardResult {
  xpAwarded: number;
  newTotalXP: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    newTitle: string;
    unlockedFeatures: string[];
  };
  achievementsUnlocked: Achievement[];
  streakMilestone?: StreakMilestone;
}

/**
 * Gamification engine configuration
 */
export interface GamificationConfig {
  xpCalculation: XPCalculationConfig;
  levelConfigs: LevelConfig[];
  achievements: Achievement[];
  streakMilestones: StreakMilestone[];
  challengeCategories: string[];
  maxSickDays: number;
  maxVacationDays: number;
  sickDayResetPeriod: number; // Days
  vacationDayResetPeriod: number; // Days
}

/**
 * Gamification engine interface
 */
export interface IGamificationEngine {
  // XP and Levels
  awardXP(userId: string, amount: number, source: XPSource, sourceId?: string): Promise<XPAwardResult>;
  calculateXPForActivity(activityType: string, activityData: any): number;
  getUserLevel(userId: string): Promise<UserLevel>;
  
  // Achievements
  checkAchievements(userId: string, event: GamificationEvent): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
  
  // Streaks
  updateStreak(userId: string, workoutDate: Date): Promise<UserStreak>;
  useStreakFreeze(userId: string, type: 'sick_day' | 'vacation_day', days: number): Promise<boolean>;
  compensateStreak(userId: string, missedDate: Date, workoutId: string): Promise<boolean>;
  
  // Challenges
  joinChallenge(userId: string, challengeId: string): Promise<boolean>;
  updateChallengeProgress(userId: string, challengeId: string, value: number): Promise<void>;
  getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboard>;
  
  // Statistics
  getUserStats(userId: string): Promise<GamificationStats>;
  updateUserStats(userId: string, event: GamificationEvent): Promise<void>;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export all interfaces for easier importing
  XPTransaction,
  UserLevel,
  LevelConfig,
  XPCalculationConfig,
  Achievement,
  UserAchievement,
  AchievementUnlock,
  StreakSchedule,
  StreakCompensation,
  StreakFreeze,
  UserStreak,
  StreakMilestone,
  Challenge,
  ChallengeParticipant,
  ChallengeLeaderboard,
  GamificationStats,
  GamificationEvent,
  XPAwardResult,
  GamificationConfig,
  IGamificationEngine,
};