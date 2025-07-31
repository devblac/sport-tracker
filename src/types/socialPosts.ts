/**
 * Social Posts Types
 * 
 * Type definitions for social posts, activities, likes, and comments.
 */

export type PostType = 
  | 'workout_completed'
  | 'achievement_unlocked'
  | 'personal_record'
  | 'streak_milestone'
  | 'level_up'
  | 'manual_post'
  | 'workout_shared'
  | 'challenge_completed';

export type PostVisibility = 'public' | 'friends' | 'private';

export interface SocialPost {
  id: string;
  userId: string;
  type: PostType;
  visibility: PostVisibility;
  
  // Content
  title: string;
  description?: string;
  imageUrl?: string;
  
  // Post-specific data
  data: PostData;
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isPinned: boolean;
}

export type PostData = 
  | WorkoutCompletedData
  | AchievementUnlockedData
  | PersonalRecordData
  | StreakMilestoneData
  | LevelUpData
  | ManualPostData
  | WorkoutSharedData
  | ChallengeCompletedData;

export interface WorkoutCompletedData {
  type: 'workout_completed';
  workoutId: string;
  workoutName: string;
  duration: number; // minutes
  exerciseCount: number;
  totalVolume: number; // kg
  personalRecords?: string[]; // exercise names where PRs were achieved
}

export interface AchievementUnlockedData {
  type: 'achievement_unlocked';
  achievementId: string;
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PersonalRecordData {
  type: 'personal_record';
  exerciseId: string;
  exerciseName: string;
  recordType: '1rm' | 'volume' | 'reps' | 'duration';
  previousValue: number;
  newValue: number;
  improvement: number; // percentage or absolute
}

export interface StreakMilestoneData {
  type: 'streak_milestone';
  streakDays: number;
  streakType: 'workout' | 'daily_activity' | 'custom';
  milestoneType: 'weekly' | 'monthly' | 'milestone'; // 7, 30, 50, 100, etc.
}

export interface LevelUpData {
  type: 'level_up';
  previousLevel: number;
  newLevel: number;
  totalXP: number;
  xpGained: number;
}

export interface ManualPostData {
  type: 'manual_post';
  content: string;
  tags?: string[];
  mentions?: string[]; // user IDs
}

export interface WorkoutSharedData {
  type: 'workout_shared';
  workoutId: string;
  workoutName: string;
  templateId?: string;
  isTemplate: boolean;
}

export interface ChallengeCompletedData {
  type: 'challenge_completed';
  challengeId: string;
  challengeName: string;
  completionTime: number; // days or hours
  ranking?: number;
  participantsCount: number;
}

// Engagement Types
export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string; // for replies
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface PostShare {
  id: string;
  postId: string;
  userId: string;
  platform?: 'internal' | 'facebook' | 'twitter' | 'instagram' | 'whatsapp';
  createdAt: Date;
}

// Feed Types
export interface FeedItem {
  post: SocialPost;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    currentLevel: number;
  };
  userInteraction: {
    hasLiked: boolean;
    hasShared: boolean;
    hasCommented: boolean;
  };
  recentLikes: Array<{
    userId: string;
    displayName: string;
    avatar?: string;
  }>;
  recentComments: PostComment[];
}

// Activity Generation
export interface ActivityTrigger {
  type: PostType;
  userId: string;
  data: any;
  shouldCreatePost: boolean;
  visibility?: PostVisibility;
}

// Post Templates
export interface PostTemplate {
  type: PostType;
  titleTemplate: string;
  descriptionTemplate?: string;
  defaultVisibility: PostVisibility;
  autoGenerate: boolean;
  cooldownMinutes?: number; // prevent spam
}

// Default post templates
export const POST_TEMPLATES: Record<PostType, PostTemplate> = {
  workout_completed: {
    type: 'workout_completed',
    titleTemplate: 'Completé "{workoutName}"',
    descriptionTemplate: '{exerciseCount} ejercicios • {duration} min • {totalVolume} kg levantados',
    defaultVisibility: 'friends',
    autoGenerate: true,
    cooldownMinutes: 30
  },
  achievement_unlocked: {
    type: 'achievement_unlocked',
    titleTemplate: '🏆 ¡Logro desbloqueado!',
    descriptionTemplate: 'Acabo de desbloquear "{achievementName}"',
    defaultVisibility: 'public',
    autoGenerate: true
  },
  personal_record: {
    type: 'personal_record',
    titleTemplate: '💪 ¡Nuevo récord personal!',
    descriptionTemplate: '{exerciseName}: {previousValue} → {newValue} (+{improvement}%)',
    defaultVisibility: 'friends',
    autoGenerate: true
  },
  streak_milestone: {
    type: 'streak_milestone',
    titleTemplate: '🔥 ¡{streakDays} días de racha!',
    descriptionTemplate: 'Manteniendo la consistencia en mis entrenamientos',
    defaultVisibility: 'friends',
    autoGenerate: true
  },
  level_up: {
    type: 'level_up',
    titleTemplate: '⬆️ ¡Subí al nivel {newLevel}!',
    descriptionTemplate: 'Gané {xpGained} XP y ahora tengo {totalXP} XP total',
    defaultVisibility: 'public',
    autoGenerate: true
  },
  manual_post: {
    type: 'manual_post',
    titleTemplate: '',
    defaultVisibility: 'friends',
    autoGenerate: false
  },
  workout_shared: {
    type: 'workout_shared',
    titleTemplate: 'Compartí mi entrenamiento',
    descriptionTemplate: '"{workoutName}" - ¡Pruébalo!',
    defaultVisibility: 'public',
    autoGenerate: false
  },
  challenge_completed: {
    type: 'challenge_completed',
    titleTemplate: '🎯 ¡Desafío completado!',
    descriptionTemplate: 'Terminé "{challengeName}" en {completionTime} días',
    defaultVisibility: 'public',
    autoGenerate: true
  }
};