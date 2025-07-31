/**
 * Shareable Content Types
 * 
 * Type definitions for generating and sharing visual content cards.
 */

export type ShareableContentType = 
  | 'workout_card'
  | 'achievement_card'
  | 'personal_record_card'
  | 'streak_milestone_card'
  | 'level_up_card'
  | 'progress_summary_card';

export type SharePlatform = 
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'whatsapp'
  | 'telegram'
  | 'linkedin'
  | 'copy_link'
  | 'download_image';

export interface ShareableContent {
  id: string;
  type: ShareableContentType;
  title: string;
  description: string;
  data: ShareableContentData;
  
  // Visual properties
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  template: string;
  
  // Metadata
  createdAt: Date;
  userId: string;
  isPublic: boolean;
}

export type ShareableContentData = 
  | WorkoutCardData
  | AchievementCardData
  | PersonalRecordCardData
  | StreakMilestoneCardData
  | LevelUpCardData
  | ProgressSummaryCardData;

export interface WorkoutCardData {
  type: 'workout_card';
  workoutName: string;
  duration: number; // minutes
  exerciseCount: number;
  totalVolume: number; // kg
  personalRecords: string[];
  date: Date;
  workoutType: string;
  topExercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
  }>;
}

export interface AchievementCardData {
  type: 'achievement_card';
  achievementName: string;
  achievementDescription: string;
  achievementIcon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlockedAt: Date;
  progress: {
    current: number;
    total: number;
    unit: string;
  };
}

export interface PersonalRecordCardData {
  type: 'personal_record_card';
  exerciseName: string;
  recordType: '1rm' | 'volume' | 'reps' | 'duration';
  previousValue: number;
  newValue: number;
  improvement: number; // percentage
  achievedAt: Date;
  exerciseCategory: string;
}

export interface StreakMilestoneCardData {
  type: 'streak_milestone_card';
  streakDays: number;
  streakType: 'workout' | 'daily_activity' | 'custom';
  milestoneType: 'weekly' | 'monthly' | 'milestone';
  startDate: Date;
  currentDate: Date;
  consistency: number; // percentage
}

export interface LevelUpCardData {
  type: 'level_up_card';
  previousLevel: number;
  newLevel: number;
  totalXP: number;
  xpGained: number;
  levelUpAt: Date;
  nextLevelXP: number;
  achievements: string[];
}

export interface ProgressSummaryCardData {
  type: 'progress_summary_card';
  period: 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  stats: {
    workoutsCompleted: number;
    totalVolume: number;
    personalRecords: number;
    streakDays: number;
    xpGained: number;
  };
  topAchievements: string[];
}

export interface ShareOptions {
  platform: SharePlatform;
  includeAppBranding: boolean;
  includeUserInfo: boolean;
  customMessage?: string;
  hashtags?: string[];
}

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  shareUrl?: string;
  error?: string;
}

// Template configurations
export interface CardTemplate {
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  gradientColors?: string[];
  pattern?: 'none' | 'dots' | 'lines' | 'geometric';
  layout: 'minimal' | 'detailed' | 'epic';
}

export const CARD_TEMPLATES: Record<ShareableContentType, CardTemplate[]> = {
  workout_card: [
    {
      name: 'Power Blue',
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      accentColor: '#60a5fa',
      gradientColors: ['#1e40af', '#3b82f6'],
      pattern: 'geometric',
      layout: 'detailed'
    },
    {
      name: 'Energy Orange',
      backgroundColor: '#ea580c',
      textColor: '#ffffff',
      accentColor: '#fb923c',
      gradientColors: ['#ea580c', '#f97316'],
      pattern: 'lines',
      layout: 'detailed'
    },
    {
      name: 'Minimal Dark',
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      accentColor: '#10b981',
      pattern: 'none',
      layout: 'minimal'
    }
  ],
  achievement_card: [
    {
      name: 'Golden Glory',
      backgroundColor: '#fbbf24',
      textColor: '#1f2937',
      accentColor: '#f59e0b',
      gradientColors: ['#fbbf24', '#f59e0b'],
      pattern: 'dots',
      layout: 'epic'
    },
    {
      name: 'Royal Purple',
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      accentColor: '#a78bfa',
      gradientColors: ['#7c3aed', '#8b5cf6'],
      pattern: 'geometric',
      layout: 'epic'
    },
    {
      name: 'Champion Red',
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      accentColor: '#f87171',
      gradientColors: ['#dc2626', '#ef4444'],
      pattern: 'lines',
      layout: 'epic'
    }
  ],
  personal_record_card: [
    {
      name: 'Victory Green',
      backgroundColor: '#059669',
      textColor: '#ffffff',
      accentColor: '#34d399',
      gradientColors: ['#059669', '#10b981'],
      pattern: 'geometric',
      layout: 'detailed'
    },
    {
      name: 'Fire Red',
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      accentColor: '#f87171',
      gradientColors: ['#dc2626', '#ef4444'],
      pattern: 'lines',
      layout: 'detailed'
    }
  ],
  streak_milestone_card: [
    {
      name: 'Flame Orange',
      backgroundColor: '#ea580c',
      textColor: '#ffffff',
      accentColor: '#fb923c',
      gradientColors: ['#ea580c', '#f97316'],
      pattern: 'dots',
      layout: 'detailed'
    },
    {
      name: 'Consistency Blue',
      backgroundColor: '#2563eb',
      textColor: '#ffffff',
      accentColor: '#60a5fa',
      gradientColors: ['#2563eb', '#3b82f6'],
      pattern: 'geometric',
      layout: 'detailed'
    }
  ],
  level_up_card: [
    {
      name: 'Level Up Gold',
      backgroundColor: '#d97706',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      gradientColors: ['#d97706', '#f59e0b'],
      pattern: 'geometric',
      layout: 'epic'
    },
    {
      name: 'Progress Purple',
      backgroundColor: '#7c3aed',
      textColor: '#ffffff',
      accentColor: '#a78bfa',
      gradientColors: ['#7c3aed', '#8b5cf6'],
      pattern: 'dots',
      layout: 'epic'
    }
  ],
  progress_summary_card: [
    {
      name: 'Summary Blue',
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      accentColor: '#60a5fa',
      gradientColors: ['#1e40af', '#3b82f6'],
      pattern: 'lines',
      layout: 'detailed'
    },
    {
      name: 'Growth Green',
      backgroundColor: '#059669',
      textColor: '#ffffff',
      accentColor: '#34d399',
      gradientColors: ['#059669', '#10b981'],
      pattern: 'geometric',
      layout: 'detailed'
    }
  ]
};

// Share platform configurations
export const SHARE_PLATFORMS: Record<SharePlatform, {
  name: string;
  icon: string;
  color: string;
  urlTemplate?: string;
  supportsImage: boolean;
  maxTextLength?: number;
}> = {
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    urlTemplate: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}',
    supportsImage: true,
    maxTextLength: 63206
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1da1f2',
    urlTemplate: 'https://twitter.com/intent/tweet?text={text}&url={url}',
    supportsImage: true,
    maxTextLength: 280
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: '#e4405f',
    supportsImage: true
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25d366',
    urlTemplate: 'https://wa.me/?text={text}%20{url}',
    supportsImage: false,
    maxTextLength: 65536
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    color: '#0088cc',
    urlTemplate: 'https://t.me/share/url?url={url}&text={text}',
    supportsImage: true
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0077b5',
    urlTemplate: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
    supportsImage: true
  },
  copy_link: {
    name: 'Copiar Enlace',
    icon: '🔗',
    color: '#6b7280',
    supportsImage: false
  },
  download_image: {
    name: 'Descargar Imagen',
    icon: '💾',
    color: '#059669',
    supportsImage: true
  }
};