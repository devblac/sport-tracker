/**
 * Notification System Types
 * 
 * Type definitions for push notifications, workout reminders, and achievement celebrations.
 */

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  workoutReminders: boolean;
  achievementCelebrations: boolean;
  streakReminders: boolean;
  socialUpdates: boolean;
  weeklyProgress: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  frequency: {
    workoutReminders: 'never' | 'daily' | 'workout_days' | 'custom';
    achievementCelebrations: 'immediate' | 'daily_summary' | 'weekly_summary';
    streakReminders: 'never' | 'at_risk' | 'daily' | 'weekly';
  };
  customSchedule?: {
    days: number[]; // 0-6, Sunday = 0
    times: string[]; // HH:MM format
  };
}

export interface BaseNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  timestamp: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: NotificationCategory;
  tags: string[];
}

export interface PushNotification extends BaseNotification {
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  sound?: string;
}

export interface InAppNotification extends BaseNotification {
  isRead: boolean;
  isArchived: boolean;
  actionTaken?: string;
  readAt?: Date;
  archivedAt?: Date;
}

export interface ScheduledNotification extends BaseNotification {
  isScheduled: true;
  scheduledFor: Date;
  recurrence?: NotificationRecurrence;
  isActive: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
}

export type NotificationType = 
  | 'workout_reminder'
  | 'streak_reminder'
  | 'streak_at_risk'
  | 'streak_milestone_approaching'
  | 'achievement_unlocked'
  | 'level_up'
  | 'milestone_reached'
  | 'weekly_progress'
  | 'friend_request'
  | 'friend_achievement'
  | 'challenge_invitation'
  | 'challenge_update'
  | 'system_update'
  | 'maintenance'
  | 'test_notification';

export type NotificationCategory = 
  | 'workout'
  | 'achievement'
  | 'social'
  | 'progress'
  | 'system';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
  requireInteraction?: boolean;
}

export interface NotificationRecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // For weekly recurrence
  dayOfMonth?: number;   // For monthly recurrence
  endDate?: Date;
  maxOccurrences?: number;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  variables: string[]; // Template variables like {userName}, {streakCount}
}

export interface NotificationEvent {
  id: string;
  userId: string;
  notificationId: string;
  event: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'action_taken';
  eventData?: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  platform?: string;
}

export interface NotificationStats {
  userId: string;
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalDismissed: number;
  clickRate: number;
  dismissRate: number;
  byType: Record<NotificationType, {
    sent: number;
    clicked: number;
    dismissed: number;
  }>;
  byCategory: Record<NotificationCategory, {
    sent: number;
    clicked: number;
    dismissed: number;
  }>;
  lastUpdated: Date;
}

export interface NotificationQueue {
  id: string;
  userId: string;
  notifications: (PushNotification | ScheduledNotification)[];
  isProcessing: boolean;
  lastProcessed?: Date;
  errors: NotificationError[];
}

export interface NotificationError {
  id: string;
  notificationId: string;
  error: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  nextRetry?: Date;
}

export interface NotificationContext {
  userId: string;
  userSettings: NotificationSettings;
  currentStreak?: number;
  lastWorkout?: Date;
  upcomingWorkouts?: Date[];
  recentAchievements?: string[];
  timezone: string;
  locale: string;
}

// Service Worker related types
export interface ServiceWorkerNotificationData {
  notificationId: string;
  userId: string;
  type: NotificationType;
  data: Record<string, any>;
  timestamp: number;
}

export interface NotificationClickEvent {
  notification: {
    data: ServiceWorkerNotificationData;
    tag?: string;
  };
  action?: string;
}

export default {
  NotificationPermission,
  NotificationSettings,
  BaseNotification,
  PushNotification,
  InAppNotification,
  ScheduledNotification,
  NotificationType,
  NotificationCategory,
  NotificationAction,
  NotificationRecurrence,
  NotificationTemplate,
  NotificationEvent,
  NotificationStats,
  NotificationQueue,
  NotificationError,
  NotificationContext,
  ServiceWorkerNotificationData,
  NotificationClickEvent
};