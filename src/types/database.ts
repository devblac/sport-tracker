/**
 * Database Entity Types
 * 
 * TypeScript interfaces for all database entities used in the fitness app.
 */

// ============================================================================
// Base Types
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOwnedEntity extends BaseEntity {
  userId: string;
}

// ============================================================================
// User System
// ============================================================================

export interface User extends BaseEntity {
  username: string;
  email: string;
  role: 'guest' | 'basic' | 'premium';
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface UserProfile extends UserOwnedEntity {
  displayName: string;
  bio?: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  currentLevel: number;
  profileImageUrl?: string;
  dateOfBirth?: Date;
  height?: number; // in cm
  weight?: number; // in kg
  fitnessGoals: string[];
  preferredWorkoutDays: number[]; // 0-6 (Sunday-Saturday)
}

// ============================================================================
// Exercise System
// ============================================================================

export interface Exercise extends BaseEntity {
  name: string;
  category: string;
  bodyPart: string;
  equipment: string;
  muscleGroups: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  videoUrl?: string;
  tips?: string[];
}

// ============================================================================
// Workout System
// ============================================================================

export interface WorkoutTemplate extends UserOwnedEntity {
  name: string;
  description?: string;
  category: string;
  estimatedDuration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  tags: string[];
  exercises: WorkoutTemplateExercise[];
}

export interface WorkoutTemplateExercise {
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
  restTime?: number; // in seconds
  notes?: string;
}

export interface Workout extends UserOwnedEntity {
  templateId?: string;
  name: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in minutes
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  totalVolume?: number;
  caloriesBurned?: number;
}

export interface WorkoutExercise extends BaseEntity {
  workoutId: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  restTime?: number;
  notes?: string;
}

export interface WorkoutSet extends BaseEntity {
  workoutExerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completedAt?: Date;
  notes?: string;
}

// ============================================================================
// Social System
// ============================================================================

export interface SocialPost extends UserOwnedEntity {
  type: 'workout_completed' | 'achievement_unlocked' | 'personal_record' | 'general';
  content: string;
  visibility: 'public' | 'friends' | 'private';
  workoutId?: string;
  achievementId?: string;
  imageUrls?: string[];
  tags?: string[];
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export interface PostLike extends BaseEntity {
  postId: string;
  userId: string;
}

export interface PostComment extends BaseEntity {
  postId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  isEdited: boolean;
  likesCount: number;
}

export interface PostShare extends BaseEntity {
  postId: string;
  userId: string;
  platform: 'internal' | 'facebook' | 'twitter' | 'instagram';
  sharedAt: Date;
}

export interface Friendship extends BaseEntity {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiatedBy: string;
}

export interface FriendRequest extends BaseEntity {
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
}

// ============================================================================
// Privacy System
// ============================================================================

export interface PrivacySettings extends UserOwnedEntity {
  profileVisibility: 'public' | 'friends' | 'private';
  workoutVisibility: 'public' | 'friends' | 'private';
  achievementVisibility: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  allowWorkoutInvites: boolean;
  showOnlineStatus: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
}

export interface BlockedUser extends BaseEntity {
  userId: string;
  blockedUserId: string;
  reason?: string;
  blockedAt: Date;
}

// ============================================================================
// Gamification System
// ============================================================================

export interface UserXP extends UserOwnedEntity {
  currentLevel: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  weeklyXP: number;
  monthlyXP: number;
}

export interface XPTransaction extends BaseEntity {
  userId: string;
  amount: number;
  source: 'workout_completed' | 'achievement_unlocked' | 'streak_milestone' | 'social_interaction' | 'daily_login';
  sourceId?: string;
  description: string;
  multiplier: number;
}

export interface Achievement extends BaseEntity {
  name: string;
  description: string;
  category: 'workout' | 'social' | 'streak' | 'progress' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  type: 'count' | 'streak' | 'milestone' | 'special';
  iconUrl: string;
  xpReward: number;
  requirements: Record<string, any>;
  isHidden: boolean;
}

export interface UserAchievement extends BaseEntity {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: Record<string, any>;
}

export interface UserStreak extends BaseEntity {
  userId: string;
  type: 'workout' | 'login' | 'social';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  isActive: boolean;
  streakStartDate: Date;
}

export interface StreakEntry extends BaseEntity {
  streakId: string;
  date: Date;
  activityType: string;
  activityId?: string;
  value?: number;
}

export interface StreakReward extends BaseEntity {
  userId: string;
  streakId: string;
  milestone: number;
  rewardType: 'xp' | 'achievement' | 'badge';
  rewardValue: number;
  claimedAt?: Date;
}

// ============================================================================
// Progress Tracking
// ============================================================================

export interface PersonalRecord extends BaseEntity {
  userId: string;
  exerciseId: string;
  recordType: 'max_weight' | 'max_reps' | 'max_duration' | 'max_volume';
  value: number;
  unit: string;
  achievedAt: Date;
  workoutId?: string;
  previousRecord?: number;
}

export interface ProgressSnapshot extends BaseEntity {
  userId: string;
  date: Date;
  type: 'weight' | 'body_fat' | 'measurements' | 'photos';
  data: Record<string, any>;
  notes?: string;
}

// ============================================================================
// Sync System
// ============================================================================

export interface SyncOperation extends BaseEntity {
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data?: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncMetadata {
  key: string;
  lastSync: Date;
  syncVersion: number;
  checksum?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DatabaseEntity = 
  | User 
  | UserProfile 
  | Exercise 
  | Workout 
  | WorkoutExercise 
  | WorkoutSet
  | SocialPost 
  | PostLike 
  | PostComment 
  | PostShare
  | Friendship 
  | FriendRequest
  | PrivacySettings 
  | BlockedUser
  | UserXP 
  | XPTransaction 
  | Achievement 
  | UserAchievement
  | UserStreak 
  | StreakEntry 
  | StreakReward
  | PersonalRecord 
  | ProgressSnapshot
  | SyncOperation 
  | SyncMetadata;

export type EntityId<T extends BaseEntity> = T['id'];

export type CreateEntityInput<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateEntityInput<T extends BaseEntity> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt?: Date;
};