/**
 * Challenge Models - Core data structures for the challenge system
 * Implements task 14.1 - Implementar modelos de challenges
 */

// Base challenge types
export type ChallengeType = 'individual' | 'group' | 'global' | 'team';
export type ChallengeCategory = 'strength' | 'endurance' | 'consistency' | 'volume' | 'technique' | 'social';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'paused';
export type ParticipantStatus = 'pending' | 'active' | 'completed' | 'dropped' | 'disqualified';

// Challenge requirement types
export type RequirementType = 'exercise_reps' | 'exercise_weight' | 'exercise_volume' | 'workout_count' | 'streak_days' | 'time_duration' | 'custom_metric';
export type RequirementOperator = 'equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'between';

// Challenge reward types
export type RewardType = 'xp' | 'badge' | 'title' | 'avatar_item' | 'premium_feature' | 'custom';
export type UnlockCondition = 'participation' | 'completion' | 'top_10' | 'top_3' | 'winner' | 'milestone' | 'perfect_score';

// Core Challenge interface
export interface Challenge {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  
  // Challenge classification
  type: ChallengeType;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  difficulty_level: number; // 1-10 numeric difficulty
  
  // Timing
  start_date: Date;
  end_date: Date;
  duration_days: number;
  timezone?: string;
  
  // Requirements and rules
  requirements: ChallengeRequirement[];
  rules: ChallengeRule[];
  scoring_method: ScoringMethod;
  
  // Participation
  max_participants?: number;
  min_participants?: number;
  current_participants: number;
  is_public: boolean;
  requires_approval: boolean;
  
  // Rewards and incentives
  rewards: ChallengeReward[];
  entry_fee?: number; // For premium challenges
  prize_pool?: number;
  
  // Metadata
  created_by: string; // User ID or 'system'
  created_at: Date;
  updated_at: Date;
  status: ChallengeStatus;
  
  // Visual and content
  image_url?: string;
  banner_url?: string;
  tags: string[];
  
  // Special properties
  is_featured: boolean;
  is_special_event: boolean;
  event_multiplier?: number; // XP multiplier for special events
  
  // Group/Team specific
  team_size?: number; // For team challenges
  allow_team_creation?: boolean;
  
  // Social features
  allow_comments: boolean;
  allow_sharing: boolean;
  leaderboard_visible: boolean;
}

// Challenge requirements - what participants need to achieve
export interface ChallengeRequirement {
  id: string;
  challenge_id: string;
  name: string;
  description: string;
  
  // Requirement specification
  type: RequirementType;
  target_value: number;
  operator: RequirementOperator;
  unit: string; // 'reps', 'lbs', 'kg', 'minutes', 'days', etc.
  
  // Exercise-specific (if applicable)
  exercise_id?: string;
  exercise_name?: string;
  muscle_group?: string;
  
  // Validation rules
  min_value?: number;
  max_value?: number;
  allowed_values?: number[];
  
  // Timing constraints
  deadline?: Date;
  frequency?: 'daily' | 'weekly' | 'total'; // How often this must be met
  
  // Scoring weight
  weight: number; // How much this requirement contributes to overall score
  is_mandatory: boolean; // Must be completed to finish challenge
  
  // Progress tracking
  allows_partial_credit: boolean;
  verification_required: boolean; // Requires photo/video proof
}

// Challenge rules - behavioral constraints and guidelines
export interface ChallengeRule {
  id: string;
  challenge_id: string;
  title: string;
  description: string;
  
  // Rule classification
  type: 'eligibility' | 'behavior' | 'scoring' | 'disqualification' | 'bonus';
  is_mandatory: boolean;
  
  // Enforcement
  auto_enforced: boolean; // Can be automatically checked
  violation_penalty?: 'warning' | 'point_deduction' | 'disqualification';
  penalty_value?: number;
  
  // Conditions
  conditions?: RuleCondition[];
}

// Rule conditions for complex rule logic
export interface RuleCondition {
  field: string; // What to check (e.g., 'age', 'fitness_level', 'previous_challenges')
  operator: RequirementOperator;
  value: any;
  logical_operator?: 'AND' | 'OR'; // For chaining conditions
}

// Scoring methods for determining winners
export interface ScoringMethod {
  type: 'points' | 'percentage' | 'time' | 'rank' | 'custom';
  description: string;
  
  // Point-based scoring
  max_points?: number;
  point_calculation?: 'sum' | 'average' | 'weighted_average';
  
  // Percentage-based scoring
  percentage_of_target?: boolean;
  
  // Time-based scoring
  time_direction?: 'fastest' | 'slowest'; // For time challenges
  
  // Ranking factors
  ranking_factors?: RankingFactor[];
  
  // Tie-breaking rules
  tiebreaker_rules?: TiebreakerRule[];
}

// Factors that contribute to ranking
export interface RankingFactor {
  name: string;
  weight: number; // Relative importance (0-1)
  direction: 'ascending' | 'descending'; // Higher is better or lower is better
}

// Rules for breaking ties
export interface TiebreakerRule {
  priority: number; // Order of application
  factor: string; // What to compare
  direction: 'ascending' | 'descending';
}

// Challenge rewards
export interface ChallengeReward {
  id: string;
  challenge_id: string;
  name: string;
  description: string;
  
  // Reward specification
  type: RewardType;
  value: number | string; // XP amount, badge ID, title text, etc.
  
  // Unlock conditions
  unlock_condition: UnlockCondition;
  rank_requirement?: number; // Must finish in top N
  percentage_requirement?: number; // Must complete X% of requirements
  
  // Reward properties
  is_unique: boolean; // Only one person can get this reward
  is_transferable: boolean; // Can be given to someone else
  expires_at?: Date;
  
  // Visual
  icon_url?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Challenge participant
export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  
  // Participation details
  joined_at: Date;
  status: ParticipantStatus;
  
  // Progress tracking
  progress: number; // 0-100 percentage
  current_score: number;
  max_possible_score: number;
  
  // Performance metrics
  rank: number;
  percentile: number;
  
  // Completion tracking
  requirements_completed: number;
  requirements_total: number;
  is_completed: boolean;
  completed_at?: Date;
  
  // Team information (for group challenges)
  team_id?: string;
  team_role?: 'member' | 'captain' | 'co_captain';
  
  // Social features
  is_public: boolean; // Show on leaderboards
  allow_messages: boolean;
  
  // Metadata
  notes?: string;
  last_activity_at: Date;
  
  // Calculated fields (not stored, computed on demand)
  days_remaining?: number;
  average_daily_progress?: number;
  projected_completion?: Date;
}

// Progress records for individual requirements
export interface ChallengeProgressRecord {
  id: string;
  participant_id: string;
  requirement_id: string;
  
  // Progress data
  current_value: number;
  target_value: number;
  percentage_complete: number;
  
  // Verification
  is_verified: boolean;
  verification_type?: 'photo' | 'video' | 'witness' | 'auto';
  verification_data?: any; // URLs, witness info, etc.
  
  // Timing
  recorded_at: Date;
  workout_id?: string; // If tied to a specific workout
  
  // Notes and context
  notes?: string;
  tags?: string[];
}

// Team structure for group challenges
export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  name: string;
  description?: string;
  
  // Team composition
  captain_id: string;
  member_ids: string[];
  max_members: number;
  current_members: number;
  
  // Team performance
  total_score: number;
  average_score: number;
  rank: number;
  
  // Team settings
  is_public: boolean;
  requires_approval: boolean;
  allow_invites: boolean;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  
  // Visual
  avatar_url?: string;
  banner_url?: string;
  color_scheme?: string;
}

// Challenge leaderboard entry
export interface ChallengeLeaderboardEntry {
  participant_id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  
  // Performance
  rank: number;
  score: number;
  progress: number;
  
  // Team info (if applicable)
  team_id?: string;
  team_name?: string;
  
  // Status
  is_completed: boolean;
  last_activity: Date;
  
  // Social
  is_friend: boolean; // From current user's perspective
  is_following: boolean;
}

// Challenge statistics and analytics
export interface ChallengeStats {
  challenge_id: string;
  
  // Participation metrics
  total_participants: number;
  active_participants: number;
  completion_rate: number;
  dropout_rate: number;
  
  // Performance metrics
  average_score: number;
  median_score: number;
  highest_score: number;
  lowest_score: number;
  
  // Progress metrics
  average_progress: number;
  daily_progress_rate: number;
  projected_completions: number;
  
  // Engagement metrics
  total_activities: number;
  average_activities_per_user: number;
  most_active_day: string;
  
  // Time-based metrics
  average_completion_time: number; // In days
  fastest_completion: number;
  
  // Updated timestamp
  calculated_at: Date;
}

// Challenge notification preferences
export interface ChallengeNotificationSettings {
  user_id: string;
  challenge_id: string;
  
  // Notification types
  progress_updates: boolean;
  rank_changes: boolean;
  milestone_achievements: boolean;
  deadline_reminders: boolean;
  social_interactions: boolean;
  
  // Frequency settings
  daily_summary: boolean;
  weekly_summary: boolean;
  
  // Delivery preferences
  push_notifications: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
}

// Export all types for easy importing
export type {
  ChallengeType,
  ChallengeCategory,
  ChallengeDifficulty,
  ChallengeStatus,
  ParticipantStatus,
  RequirementType,
  RequirementOperator,
  RewardType,
  UnlockCondition
};