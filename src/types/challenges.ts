// Challenge System Types and Interfaces
// Implements requirement 12 - Sistema de Challenges y Competencias

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  category: 'strength' | 'consistency' | 'volume' | 'endurance';
  start_date: Date;
  end_date: Date;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  participants_count: number;
  max_participants?: number;
  created_by: string;
  is_active: boolean;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  image_url?: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ChallengeRequirement {
  id: string;
  type: 'workout_count' | 'total_volume' | 'specific_exercise' | 'streak_days' | 'frequency';
  target_value: number;
  target_unit: 'workouts' | 'kg' | 'reps' | 'days' | 'sessions_per_week';
  exercise_id?: string; // For specific exercise challenges
  timeframe: 'daily' | 'weekly' | 'total'; // Total means for entire challenge duration
  description: string;
}

export interface ChallengeReward {
  id: string;
  type: 'xp' | 'badge' | 'title' | 'premium_content' | 'discount';
  value: number | string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlock_condition: 'participation' | 'completion' | 'top_10' | 'top_3' | 'winner';
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number; // Percentage (0-100)
  current_value: number; // Current achievement towards target
  rank: number;
  joined_at: Date;
  last_activity: Date;
  is_completed: boolean;
  completion_date?: Date;
  notes?: string;
}

export interface ChallengeProgress {
  participant_id: string;
  requirement_id: string;
  current_value: number;
  target_value: number;
  progress_percentage: number;
  is_completed: boolean;
  last_updated: Date;
}

export interface ChallengeLeaderboard {
  challenge_id: string;
  participants: ChallengeLeaderboardEntry[];
  last_updated: Date;
}

export interface ChallengeLeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  rank: number;
  progress: number;
  current_value: number;
  is_completed: boolean;
  badge_count?: number; // For gamification display
}

// Challenge creation and management types
export interface CreateChallengeRequest {
  name: string;
  description: string;
  type: Challenge['type'];
  category: Challenge['category'];
  start_date: Date;
  end_date: Date;
  requirements: Omit<ChallengeRequirement, 'id'>[];
  rewards: Omit<ChallengeReward, 'id'>[];
  max_participants?: number;
  difficulty_level: Challenge['difficulty_level'];
  image_url?: string;
  tags: string[];
}

export interface JoinChallengeRequest {
  challenge_id: string;
  user_id: string;
}

export interface UpdateChallengeProgressRequest {
  participant_id: string;
  requirement_id: string;
  value_increment: number;
  activity_data?: any; // Additional context about the activity
}

// Challenge filtering and search
export interface ChallengeFilters {
  type?: Challenge['type'];
  category?: Challenge['category'];
  difficulty_level?: Challenge['difficulty_level'];
  is_active?: boolean;
  has_spots_available?: boolean;
  created_by_friends?: boolean;
  tags?: string[];
}

export interface ChallengeSearchParams {
  query?: string;
  filters?: ChallengeFilters;
  sort_by?: 'created_at' | 'start_date' | 'participants_count' | 'difficulty_level';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Challenge statistics and analytics
export interface ChallengeStats {
  challenge_id: string;
  total_participants: number;
  active_participants: number;
  completion_rate: number;
  average_progress: number;
  top_performer: {
    user_id: string;
    username: string;
    progress: number;
  };
  daily_activity: {
    date: string;
    active_users: number;
    progress_made: number;
  }[];
}

// Challenge notifications
export interface ChallengeNotification {
  id: string;
  challenge_id: string;
  user_id: string;
  type: 'challenge_started' | 'progress_milestone' | 'rank_changed' | 'challenge_ending' | 'challenge_completed';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: Date;
}

// Validation schemas and constants
export const CHALLENGE_CONSTANTS = {
  MIN_DURATION_DAYS: 1,
  MAX_DURATION_DAYS: 365,
  MIN_PARTICIPANTS: 1,
  MAX_PARTICIPANTS: 10000,
  MAX_REQUIREMENTS: 5,
  MAX_REWARDS: 10,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
} as const;

export const CHALLENGE_CATEGORIES = [
  'strength',
  'consistency', 
  'volume',
  'endurance'
] as const;

export const CHALLENGE_TYPES = [
  'individual',
  'group', 
  'global'
] as const;

export const REQUIREMENT_TYPES = [
  'workout_count',
  'total_volume',
  'specific_exercise',
  'streak_days',
  'frequency'
] as const;

export const REWARD_TYPES = [
  'xp',
  'badge',
  'title',
  'premium_content',
  'discount'
] as const;

export const REWARD_RARITIES = [
  'common',
  'rare',
  'epic',
  'legendary'
] as const;

// Error types for challenge operations
export enum ChallengeErrorType {
  CHALLENGE_NOT_FOUND = 'challenge_not_found',
  CHALLENGE_FULL = 'challenge_full',
  CHALLENGE_ENDED = 'challenge_ended',
  ALREADY_PARTICIPATING = 'already_participating',
  INVALID_REQUIREMENTS = 'invalid_requirements',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  INVALID_DATE_RANGE = 'invalid_date_range',
  VALIDATION_ERROR = 'validation_error'
}

export class ChallengeError extends Error {
  constructor(
    public type: ChallengeErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ChallengeError';
  }
}
// I
mport comprehensive challenge models for enhanced functionality
// These provide more detailed interfaces for advanced challenge features
export type {
  Challenge as DetailedChallenge,
  ChallengeParticipant as DetailedChallengeParticipant,
  ChallengeRequirement as DetailedChallengeRequirement,
  ChallengeRule,
  ChallengeReward as DetailedChallengeReward,
  ChallengeTeam,
  ChallengeProgressRecord as DetailedChallengeProgressRecord,
  ChallengeLeaderboardEntry as DetailedChallengeLeaderboardEntry,
  ChallengeStats as DetailedChallengeStats,
  ChallengeNotificationSettings,
  ScoringMethod,
  RankingFactor,
  TiebreakerRule,
  RuleCondition,
  ChallengeType as DetailedChallengeType,
  ChallengeCategory as DetailedChallengeCategory,
  ChallengeDifficulty as DetailedChallengeDifficulty,
  ChallengeStatus as DetailedChallengeStatus,
  ParticipantStatus,
  RequirementType as DetailedRequirementType,
  RequirementOperator,
  RewardType as DetailedRewardType,
  UnlockCondition
} from './challengeModels';

// Export validation utilities
export { ChallengeValidator, ChallengeValidationUtils } from '../utils/challengeModelValidation';
export type { ValidationResult, ValidationError, ValidationWarning } from '../utils/challengeModelValidation';

// Export factory utilities
export { ChallengeFactory, CHALLENGE_TEMPLATES } from '../utils/challengeFactory';
export type { ChallengeTemplate } from '../utils/challengeFactory';