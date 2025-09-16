import type { Gamification } from '@/schemas/user';

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

// Re-export exercise types from schemas (with validation)
export type {
  Exercise,
  ExerciseType,
  ExerciseCategory,
  BodyPart,
  MuscleGroup,
  Equipment,
  DifficultyLevel,
  InstructionStep,
  ExerciseTip,
  ExerciseVariation,
  ExerciseFilter,
  ExerciseCreate,
  ExerciseUpdate,
} from '@/schemas/exercise';

// Re-export workout types from schemas (with validation)
export type {
  Workout,
  WorkoutExercise,
  SetData,
  SetType,
  WorkoutStatus,
  WorkoutTemplate,
  WorkoutCreate,
  WorkoutUpdate,
  SetCreate,
  WorkoutFilter,
} from '@/schemas/workout';

// Additional workout types not in schemas
export * from './workout';

// Mentorship types
export * from './mentorship';

// Challenge types
export * from './challengeModels';

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

// Challenge types are now exported from challengeModels.ts

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