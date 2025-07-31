/**
 * Notification Manager Service
 * 
 * Comprehensive notification system for push notifications, workout reminders,
 * and achievement celebrations with scheduling and permission management.
 */

import { GamificationService } from '@/services/GamificationService';
import { StreakRewardService } from '@/services/StreakRewardService';
import { ALL_NOTIFICATION_TEMPLATES, TEMPLATES_BY_TYPE, DEFAULT_NOTIFICATION_SETTINGS } from '@/data/notificationTemplates';

import type {
  NotificationSettings,
  PushNotification,
  InAppNotification,
  ScheduledNotification,
  NotificationTemplate,
  NotificationContext,
  NotificationEvent,
  NotificationStats,
  NotificationQueue,
  NotificationType,
  ServiceWorkerNotificationData
} from '@/types/notifications';

export class NotificationManager {
  private static instance: NotificationManager;
  private gamificationService: GamificationService;
  private streakRewardService: StreakRewardService;
  private userSettings: Map<string, NotificationSettings> = new Map();
  private notificationQueue: Map<string, NotificationQueue> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification[]> = new Map();
  private stats: Map<string, NotificationStats> = new Map();
  private isServiceWorkerReady = false;

  private constructor() {
    this.gamificationService = GamificationService.getInstance();
    this.streakRewardService = StreakRewardService.getInstance();
    this.initializeServiceWorker();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // ============================================================================
  // Initialization and Permission Management
  // ============================================================================

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
      this.isServiceWorkerReady = true;
      console.log('Service worker registered for notifications');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  /**
   * Request notification permission from user
   */
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  /**
   * Check current notification permission status
   */
  public getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  // ============================================================================
  // Settings Management
  // ============================================================================

  /**
   * Get user notification settings
   */
  public async getUserSettings(userId: string): Promise<NotificationSettings> {
    if (this.userSettings.has(userId)) {
      return this.userSettings.get(userId)!;
    }

    // Load from storage
    const stored = localStorage.getItem(`notification_settings_${userId}`);
    if (stored) {
      const settings = JSON.parse(stored);
      this.userSettings.set(userId, settings);
      return settings;
    }

    // Return default settings
    const defaultSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
    this.userSettings.set(userId, defaultSettings);
    return defaultSettings;
  }

  /**
   * Update user notification settings
   */
  public async updateUserSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    
    this.userSettings.set(userId, updatedSettings);
    localStorage.setItem(`notification_settings_${userId}`, JSON.stringify(updatedSettings));
  }

  // ============================================================================
  // Template Management
  // ============================================================================

  /**
   * Get notification template by type
   */
  private getTemplate(type: NotificationType, context?: NotificationContext): NotificationTemplate {
    const templates = TEMPLATES_BY_TYPE[type] || [];
    
    if (templates.length === 0) {
      // Fallback template
      return {
        id: 'fallback',
        type,
        category: 'system',
        title: 'Notificación',
        body: 'Tienes una nueva notificación.',
        priority: 'normal',
        variables: []
      };
    }

    // Select appropriate template based on context
    if (context) {
      // Smart template selection based on user context
      if (type === 'workout_reminder' && context.currentStreak === 0) {
        return templates.find(t => t.id === 'workout_reminder_first_time') || templates[0];
      }
      
      if (type === 'streak_at_risk' && context.currentStreak && context.currentStreak > 30) {
        return templates.find(t => t.id === 'streak_at_risk_urgent') || templates[0];
      }
    }

    // Return first template as default
    return templates[0];
  }

  /**
   * Process template variables
   */
  private processTemplate(template: NotificationTemplate, variables: Record<string, any>): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    // Replace variables in title and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { title, body };
  }

  // ============================================================================
  // Notification Creation and Sending
  // ============================================================================

  /**
   * Send workout reminder notification
   */
  public async sendWorkoutReminder(
    userId: string,
    context: NotificationContext
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings.enabled || !settings.workoutReminders) {
      return false;
    }

    // Check quiet hours
    if (this.isInQuietHours(settings)) {
      return false;
    }

    const template = this.getTemplate('workout_reminder', context);
    const variables = {
      userName: 'Usuario', // Would come from user profile
      streakCount: context.currentStreak || 0,
      hoursLeft: this.calculateHoursUntilDeadline(context)
    };

    const { title, body } = this.processTemplate(template, variables);

    const notification: PushNotification = {
      id: `workout_reminder_${Date.now()}`,
      userId,
      type: 'workout_reminder',
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      timestamp: new Date(),
      priority: template.priority,
      category: template.category,
      tags: ['workout', 'reminder'],
      data: {
        context,
        templateId: template.id
      }
    };

    return await this.sendNotification(notification);
  }

  /**
   * Send streak reminder notification
   */
  public async sendStreakReminder(
    userId: string,
    context: NotificationContext,
    isAtRisk: boolean = false
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings.enabled || !settings.streakReminders) {
      return false;
    }

    if (this.isInQuietHours(settings) && !isAtRisk) {
      return false;
    }

    const type = isAtRisk ? 'streak_at_risk' : 'streak_reminder';
    const template = this.getTemplate(type, context);
    
    const variables = {
      streakCount: context.currentStreak || 0,
      hoursLeft: this.calculateHoursUntilDeadline(context),
      nextDay: (context.currentStreak || 0) + 1,
      milestone: this.getNextMilestone(context.currentStreak || 0),
      daysLeft: this.getDaysToNextMilestone(context.currentStreak || 0)
    };

    const { title, body } = this.processTemplate(template, variables);

    const notification: PushNotification = {
      id: `streak_reminder_${Date.now()}`,
      userId,
      type,
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      timestamp: new Date(),
      priority: isAtRisk ? 'urgent' : template.priority,
      category: template.category,
      tags: ['streak', 'reminder'],
      data: {
        context,
        templateId: template.id,
        isAtRisk
      }
    };

    return await this.sendNotification(notification);
  }

  /**
   * Send achievement celebration notification
   */
  public async sendAchievementCelebration(
    userId: string,
    achievementId: string,
    achievementName: string,
    achievementDescription: string,
    rarity: string = 'common'
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings.enabled || !settings.achievementCelebrations) {
      return false;
    }

    const type = 'achievement_unlocked';
    const templateId = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary' 
      ? 'achievement_rare' 
      : 'achievement_unlocked_basic';
    
    const template = ALL_NOTIFICATION_TEMPLATES.find(t => t.id === templateId) || 
                    this.getTemplate(type);

    const variables = {
      achievementName,
      achievementDescription,
      percentage: this.getAchievementRarityPercentage(rarity)
    };

    const { title, body } = this.processTemplate(template, variables);

    const notification: PushNotification = {
      id: `achievement_${achievementId}_${Date.now()}`,
      userId,
      type,
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      timestamp: new Date(),
      priority: 'high',
      category: template.category,
      tags: ['achievement', 'celebration', rarity],
      data: {
        achievementId,
        achievementName,
        rarity,
        templateId: template.id
      }
    };

    return await this.sendNotification(notification);
  }

  /**
   * Send level up celebration notification
   */
  public async sendLevelUpCelebration(
    userId: string,
    newLevel: number,
    xpGained: number
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings.enabled || !settings.achievementCelebrations) {
      return false;
    }

    const template = this.getTemplate('level_up');
    const variables = {
      newLevel,
      xpGained
    };

    const { title, body } = this.processTemplate(template, variables);

    const notification: PushNotification = {
      id: `level_up_${newLevel}_${Date.now()}`,
      userId,
      type: 'level_up',
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      timestamp: new Date(),
      priority: 'high',
      category: template.category,
      tags: ['level_up', 'celebration'],
      data: {
        newLevel,
        xpGained,
        templateId: template.id
      }
    };

    return await this.sendNotification(notification);
  }

  /**
   * Send weekly progress summary
   */
  public async sendWeeklyProgressSummary(
    userId: string,
    workoutsCompleted: number,
    xpGained: number,
    weeklyMessage: string
  ): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings.enabled || !settings.weeklyProgress) {
      return false;
    }

    const template = this.getTemplate('weekly_progress');
    const variables = {
      workoutsCompleted,
      xpGained,
      weeklyMessage
    };

    const { title, body } = this.processTemplate(template, variables);

    const notification: PushNotification = {
      id: `weekly_progress_${Date.now()}`,
      userId,
      type: 'weekly_progress',
      title,
      body,
      icon: template.icon,
      actions: template.actions,
      timestamp: new Date(),
      priority: 'normal',
      category: template.category,
      tags: ['progress', 'weekly', 'summary'],
      data: {
        workoutsCompleted,
        xpGained,
        weeklyMessage,
        templateId: template.id
      }
    };

    return await this.sendNotification(notification);
  }

  // ============================================================================
  // Core Notification Sending
  // ============================================================================

  /**
   * Send a notification (push or in-app)
   */
  private async sendNotification(notification: PushNotification): Promise<boolean> {
    try {
      // Record notification event
      await this.recordNotificationEvent(notification.userId, notification.id, 'sent');

      // Try to send push notification first
      const pushSent = await this.sendPushNotification(notification);
      
      // Always store as in-app notification as fallback
      await this.storeInAppNotification(notification);

      // Update stats
      await this.updateNotificationStats(notification.userId, notification.type, 'sent');

      return pushSent;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Send push notification via service worker
   */
  private async sendPushNotification(notification: PushNotification): Promise<boolean> {
    if (!this.isServiceWorkerReady || !this.getPermissionStatus().granted) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icons/app-icon-192.png',
        badge: notification.badge || '/icons/badge-72.png',
        image: notification.image,
        data: {
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type,
          data: notification.data,
          timestamp: Date.now()
        } as ServiceWorkerNotificationData,
        actions: notification.actions?.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon
        })),
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        vibrate: notification.vibrate,
        tag: `${notification.type}_${notification.userId}`,
        timestamp: notification.timestamp.getTime()
      });

      await this.recordNotificationEvent(notification.userId, notification.id, 'delivered');
      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  /**
   * Store notification for in-app display
   */
  private async storeInAppNotification(notification: PushNotification): Promise<void> {
    const inAppNotification: InAppNotification = {
      ...notification,
      isRead: false,
      isArchived: false
    };

    // Store in localStorage (would be database in production)
    const key = `notifications_${notification.userId}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.unshift(inAppNotification);
    
    // Keep only last 100 notifications
    if (stored.length > 100) {
      stored.splice(100);
    }
    
    localStorage.setItem(key, JSON.stringify(stored));
  }

  // ============================================================================
  // Scheduling System
  // ============================================================================

  /**
   * Schedule a recurring notification
   */
  public async scheduleRecurringNotification(
    userId: string,
    type: NotificationType,
    scheduledFor: Date,
    recurrence: { type: 'daily' | 'weekly'; daysOfWeek?: number[] }
  ): Promise<string> {
    const notificationId = `scheduled_${type}_${userId}_${Date.now()}`;
    
    const scheduledNotification: ScheduledNotification = {
      id: notificationId,
      userId,
      type,
      title: '', // Will be filled when sent
      body: '',  // Will be filled when sent
      timestamp: new Date(),
      scheduledFor,
      recurrence: {
        type: recurrence.type,
        interval: 1,
        daysOfWeek: recurrence.daysOfWeek
      },
      isScheduled: true,
      isActive: true,
      priority: 'normal',
      category: 'workout',
      tags: ['scheduled', type]
    };

    // Store scheduled notification
    const userScheduled = this.scheduledNotifications.get(userId) || [];
    userScheduled.push(scheduledNotification);
    this.scheduledNotifications.set(userId, userScheduled);

    // Persist to storage
    localStorage.setItem(
      `scheduled_notifications_${userId}`, 
      JSON.stringify(userScheduled)
    );

    return notificationId;
  }

  /**
   * Process scheduled notifications (should be called periodically)
   */
  public async processScheduledNotifications(): Promise<void> {
    const now = new Date();

    for (const [userId, notifications] of this.scheduledNotifications.entries()) {
      for (const notification of notifications) {
        if (!notification.isActive || !notification.scheduledFor) continue;

        if (notification.scheduledFor <= now) {
          // Send the notification
          await this.sendScheduledNotification(userId, notification);
          
          // Update next scheduled time if recurring
          if (notification.recurrence) {
            this.updateNextScheduledTime(notification);
          } else {
            notification.isActive = false;
          }
        }
      }
    }
  }

  /**
   * Send a scheduled notification
   */
  private async sendScheduledNotification(
    userId: string,
    scheduledNotification: ScheduledNotification
  ): Promise<void> {
    const context = await this.buildNotificationContext(userId);
    
    switch (scheduledNotification.type) {
      case 'workout_reminder':
        await this.sendWorkoutReminder(userId, context);
        break;
      case 'streak_reminder':
        await this.sendStreakReminder(userId, context);
        break;
      case 'weekly_progress':
        // Would need to calculate weekly stats
        break;
    }

    scheduledNotification.lastSent = new Date();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Calculate hours until streak deadline
   */
  private calculateHoursUntilDeadline(context: NotificationContext): number {
    // Simplified calculation - would be more complex in real implementation
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Math.ceil((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
  }

  /**
   * Get next milestone for streak
   */
  private getNextMilestone(currentStreak: number): number {
    const milestones = [7, 14, 30, 50, 100, 200, 365];
    return milestones.find(m => m > currentStreak) || currentStreak + 100;
  }

  /**
   * Get days to next milestone
   */
  private getDaysToNextMilestone(currentStreak: number): number {
    return this.getNextMilestone(currentStreak) - currentStreak;
  }

  /**
   * Get achievement rarity percentage
   */
  private getAchievementRarityPercentage(rarity: string): string {
    const percentages: Record<string, string> = {
      common: '80',
      uncommon: '50',
      rare: '20',
      epic: '5',
      legendary: '1',
      mythic: '0.1'
    };
    return percentages[rarity] || '50';
  }

  /**
   * Build notification context for user
   */
  private async buildNotificationContext(userId: string): Promise<NotificationContext> {
    // This would integrate with other services to build context
    return {
      userId,
      userSettings: await this.getUserSettings(userId),
      currentStreak: 0, // Would get from streak service
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language
    };
  }

  /**
   * Update next scheduled time for recurring notification
   */
  private updateNextScheduledTime(notification: ScheduledNotification): void {
    if (!notification.recurrence || !notification.scheduledFor) return;

    const next = new Date(notification.scheduledFor);
    
    if (notification.recurrence.type === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (notification.recurrence.type === 'weekly') {
      next.setDate(next.getDate() + 7);
    }
    
    notification.scheduledFor = next;
    notification.nextScheduled = next;
  }

  // ============================================================================
  // Event Tracking and Statistics
  // ============================================================================

  /**
   * Record notification event
   */
  private async recordNotificationEvent(
    userId: string,
    notificationId: string,
    event: 'sent' | 'delivered' | 'clicked' | 'dismissed' | 'action_taken',
    eventData?: Record<string, any>
  ): Promise<void> {
    const notificationEvent: NotificationEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      notificationId,
      event,
      eventData,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };

    // Store event (would be in database in production)
    const events = JSON.parse(localStorage.getItem(`notification_events_${userId}`) || '[]');
    events.push(notificationEvent);
    localStorage.setItem(`notification_events_${userId}`, JSON.stringify(events));
  }

  /**
   * Update notification statistics
   */
  private async updateNotificationStats(
    userId: string,
    type: NotificationType,
    event: 'sent' | 'clicked' | 'dismissed'
  ): Promise<void> {
    let stats = this.stats.get(userId);
    
    if (!stats) {
      stats = {
        userId,
        totalSent: 0,
        totalDelivered: 0,
        totalClicked: 0,
        totalDismissed: 0,
        clickRate: 0,
        dismissRate: 0,
        byType: {} as any,
        byCategory: {} as any,
        lastUpdated: new Date()
      };
    }

    // Update totals
    if (event === 'sent') stats.totalSent++;
    if (event === 'clicked') stats.totalClicked++;
    if (event === 'dismissed') stats.totalDismissed++;

    // Update by type
    if (!stats.byType[type]) {
      stats.byType[type] = { sent: 0, clicked: 0, dismissed: 0 };
    }
    stats.byType[type][event]++;

    // Calculate rates
    stats.clickRate = stats.totalSent > 0 ? (stats.totalClicked / stats.totalSent) * 100 : 0;
    stats.dismissRate = stats.totalSent > 0 ? (stats.totalDismissed / stats.totalSent) * 100 : 0;
    
    stats.lastUpdated = new Date();
    this.stats.set(userId, stats);

    // Persist stats
    localStorage.setItem(`notification_stats_${userId}`, JSON.stringify(stats));
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'notification_clicked':
        this.handleNotificationClick(data);
        break;
      case 'notification_dismissed':
        this.handleNotificationDismiss(data);
        break;
    }
  }

  /**
   * Handle notification click
   */
  private async handleNotificationClick(data: ServiceWorkerNotificationData): Promise<void> {
    await this.recordNotificationEvent(data.userId, data.notificationId, 'clicked', data.data);
    await this.updateNotificationStats(data.userId, data.type, 'clicked');
  }

  /**
   * Handle notification dismiss
   */
  private async handleNotificationDismiss(data: ServiceWorkerNotificationData): Promise<void> {
    await this.recordNotificationEvent(data.userId, data.notificationId, 'dismissed', data.data);
    await this.updateNotificationStats(data.userId, data.type, 'dismissed');
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get user's in-app notifications
   */
  public async getInAppNotifications(userId: string, limit: number = 50): Promise<InAppNotification[]> {
    const stored = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
    return stored.slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  public async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const stored = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
    const notification = stored.find((n: InAppNotification) => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(stored));
    }
  }

  /**
   * Get notification statistics for user
   */
  public async getNotificationStats(userId: string): Promise<NotificationStats | null> {
    return this.stats.get(userId) || null;
  }

  /**
   * Clear all notifications for user
   */
  public async clearAllNotifications(userId: string): Promise<void> {
    localStorage.removeItem(`notifications_${userId}`);
    localStorage.removeItem(`notification_events_${userId}`);
    localStorage.removeItem(`notification_stats_${userId}`);
    this.stats.delete(userId);
  }
}

export default NotificationManager;