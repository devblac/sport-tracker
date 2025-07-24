import type { Gamification } from '@/schemas';

// Re-export user types from schemas (with validation)
export type {
  User,
  UserRole,
  UserProfile,
  UserSettings,
  UserRegistration,
  UserLogin,
  FitnessLevel,
  Theme,
  Units,
  NotificationSettings,
  PrivacySettings,
  Gamification,
  QuietHours,
  DayOfWeek,
  ProfileVisibility,
  WorkoutSharing,
  UserProfileUpdate,
  UserSettingsUpdate,
  PasswordChange,
} from '@/schemas/user';

// Legacy alias for backward compatibility
export type UserGamification = Gamification;

// Exercise Types
export interface Exercise {
  id: string;
  name: string;
  type: 'machine' | 'dumbbell' | 'barbell';
  category: string;
  body_parts: string[];
  muscle_groups: string[];
  equipment: string;
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  instructions: string;
  gif_url?: string;
  muscle_diagram_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Workout Types
export interface Workout {
  id: string;
  user_id: string;
  name: string;
  exercises: WorkoutExercise[];
  is_template: boolean;
  is_completed: boolean;
  template_id?: string;
  started_at?: Date;
  completed_at?: Date;
  duration?: number;
  total_volume: number;
  notes?: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  order: number;
  sets: SetData[];
  rest_time: number;
  notes?: string;
}

export interface SetData {
  weight: number;
  reps: number;
  rpe?: number;
  type: 'normal' | 'failure' | 'dropset' | 'warmup';
  completed: boolean;
  completed_at?: Date;
}

// Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'strength' | 'consistency' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  xp_reward: number;
  unlock_content?: string;
}

export interface AchievementRequirement {
  type: 'workout_count' | 'streak_days' | 'weight_lifted' | 'social_action';
  target_value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  category: 'strength' | 'consistency' | 'volume';
  start_date: Date;
  end_date: Date;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  participants_count: number;
  max_participants?: number;
}

export interface ChallengeRequirement {
  type: string;
  target_value: number;
  unit: string;
}

export interface ChallengeReward {
  type: 'xp' | 'badge' | 'title' | 'content';
  value: string | number;
}

export interface ChallengeParticipant {
  user_id: string;
  progress: number;
  rank: number;
  joined_at: Date;
}

// Social Types
export interface GymFriend {
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: Date;
  last_interaction?: Date;
}

export interface SocialPost {
  id: string;
  user_id: string;
  type: 'workout_completed' | 'achievement_unlocked' | 'personal_record' | 'challenge_completed';
  data: any;
  created_at: Date;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  visibility: 'public' | 'friends' | 'private';
}

// API Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// UI Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  component: React.ComponentType;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;