import type { 
  NotificationPermission, 
  NotificationSettings, 
  PushNotification, 
  NotificationType,
  ScheduledNotification 
} from '@/types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = {
    granted: false,
    denied: false,
    default: true
  };
  private settings: NotificationSettings;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private scheduledNotifications: Map<string, number> = new Map(); // notification ID -> timeout ID
  private doNotDisturbMode: boolean = false;

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.checkPermission();
    this.initializeServiceWorker();
    this.loadSettings();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      workoutReminders: true,
      achievementCelebrations: true,
      streakReminders: true,
      socialUpdates: false,
      weeklyProgress: true,
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00'
      },
      frequency: {
        workoutReminders: 'workout_days',
        achievementCelebrations: 'immediate',
        streakReminders: 'at_risk'
      },
      customSchedule: {
        days: [1, 3, 5], // Monday, Wednesday, Friday
        times: ['09:00', '18:00']
      }
    };
  }

  /**
   * Initialize service worker for push notifications
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      
      console.log('Service worker registered for push notifications');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      try {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
    
    // Load do not disturb mode
    const dndStored = localStorage.getItem('doNotDisturbMode');
    if (dndStored) {
      this.doNotDisturbMode = JSON.parse(dndStored);
    }
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      const permission = Notification.permission;
      this.permission = {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default'
      };
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission.granted) {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.checkPermission();
      
      // If permission granted, set up push subscription
      if (permission === 'granted') {
        await this.setupPushSubscription();
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Set up push subscription for real push notifications
   */
  private async setupPushSubscription(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('Service worker not available for push subscription');
      return;
    }

    try {
      // Check if already subscribed
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      
      if (!this.pushSubscription) {
        // Create new subscription
        const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'demo-key';
        
        this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('Push subscription created');
        
        // Send subscription to server (would be implemented with backend)
        // await this.sendSubscriptionToServer(this.pushSubscription);
      }
    } catch (error) {
      console.error('Failed to set up push subscription:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  public async showNotification(notification: Partial<PushNotification>): Promise<boolean> {
    if (!this.settings.enabled || !this.permission.granted) {
      return false;
    }

    // Check do not disturb mode
    if (this.doNotDisturbMode && notification.priority !== 'urgent') {
      console.log('Notification blocked by Do Not Disturb mode');
      return false;
    }

    // Check quiet hours (unless urgent)
    if (this.isQuietHours() && notification.priority !== 'urgent') {
      console.log('Notification blocked by quiet hours');
      return false;
    }

    // Check notification type settings
    if (!this.isNotificationTypeEnabled(notification.type)) {
      return false;
    }

    try {
      const options: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || '/pwa-192x192.png',
        badge: notification.badge || '/pwa-192x192.png',
        data: notification.data,
        tag: notification.id,
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        vibrate: notification.vibrate || [200, 100, 200],
        timestamp: Date.now()
      };

      // Add actions if supported
      if (notification.actions && 'actions' in Notification.prototype) {
        options.actions = notification.actions.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon
        }));
      }

      // Add image if supported
      if (notification.image && 'image' in Notification.prototype) {
        options.image = notification.image;
      }

      // Use service worker for better notification handling if available
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(
          notification.title || 'Fitness App', 
          options
        );
      } else {
        new Notification(notification.title || 'Fitness App', options);
      }

      // Track notification
      this.trackNotificationSent(notification);
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  /**
   * Check if notification type is enabled in settings
   */
  private isNotificationTypeEnabled(type?: NotificationType): boolean {
    if (!type) return true;

    switch (type) {
      case 'workout_reminder':
        return this.settings.workoutReminders;
      case 'achievement_unlocked':
      case 'level_up':
      case 'milestone_reached':
        return this.settings.achievementCelebrations;
      case 'streak_reminder':
      case 'streak_at_risk':
        return this.settings.streakReminders;
      case 'friend_request':
      case 'friend_achievement':
      case 'challenge_invitation':
        return this.settings.socialUpdates;
      case 'weekly_progress':
        return this.settings.weeklyProgress;
      default:
        return true;
    }
  }

  /**
   * Track notification sent for analytics
   */
  private trackNotificationSent(notification: Partial<PushNotification>): void {
    const stats = JSON.parse(localStorage.getItem('notificationStats') || '{}');
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats[today]) {
      stats[today] = {};
    }
    
    const type = notification.type || 'unknown';
    stats[today][type] = (stats[today][type] || 0) + 1;
    
    localStorage.setItem('notificationStats', JSON.stringify(stats));
  }

  public async showRestTimerNotification(timeRemaining: number): Promise<boolean> {
    if (timeRemaining === 0) {
      return this.showNotification({
        id: 'rest-timer-complete',
        type: 'workout_reminder',
        title: '🔔 Rest Complete!',
        body: 'Time to get back to your workout!',
        icon: '/pwa-192x192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
          {
            action: 'continue',
            title: 'Continue Workout'
          },
          {
            action: 'add-time',
            title: 'Add 30s'
          }
        ]
      });
    } else if (timeRemaining === 10) {
      return this.showNotification({
        id: 'rest-timer-warning',
        type: 'workout_reminder',
        title: '⏰ 10 seconds left',
        body: 'Get ready for your next set!',
        silent: true,
        vibrate: [100]
      });
    }

    return false;
  }

  public async showWorkoutPausedNotification(): Promise<boolean> {
    return this.showNotification({
      id: 'workout-paused',
      type: 'workout_reminder',
      title: '⏸️ Workout Paused',
      body: 'Don\'t forget to resume your workout!',
      requireInteraction: false,
      actions: [
        {
          action: 'resume',
          title: 'Resume Workout'
        },
        {
          action: 'cancel',
          title: 'Cancel Workout'
        }
      ]
    });
  }

  public async showWorkoutRecoveryNotification(workoutName: string): Promise<boolean> {
    return this.showNotification({
      id: 'workout-recovery',
      type: 'workout_reminder',
      title: '🔄 Workout Recovery',
      body: `Resume your "${workoutName}" workout?`,
      requireInteraction: true,
      actions: [
        {
          action: 'resume',
          title: 'Resume'
        },
        {
          action: 'discard',
          title: 'Start Fresh'
        }
      ]
    });
  }

  /**
   * Show streak at risk notification (urgent priority)
   */
  public async showStreakAtRiskNotification(streakCount: number, hoursLeft: number): Promise<boolean> {
    return this.showNotification({
      id: `streak-at-risk-${Date.now()}`,
      type: 'streak_at_risk',
      title: '🚨 ¡Tu racha está en peligro!',
      body: `Tu racha de ${streakCount} días expira en ${hoursLeft} horas. ¡No la pierdas ahora!`,
      priority: 'urgent',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      icon: '/icons/streak-warning.png',
      actions: [
        {
          action: 'start_workout',
          title: 'Entrenar Ahora',
          icon: '💪'
        },
        {
          action: 'snooze_1h',
          title: 'Recordar en 1h',
          icon: '⏰'
        }
      ]
    });
  }

  /**
   * Show streak milestone approaching notification
   */
  public async showStreakMilestoneApproachingNotification(
    currentStreak: number, 
    nextMilestone: number
  ): Promise<boolean> {
    const daysLeft = nextMilestone - currentStreak;
    
    return this.showNotification({
      id: `streak-milestone-${nextMilestone}`,
      type: 'streak_reminder',
      title: `🎯 ¡Casi alcanzas ${nextMilestone} días!`,
      body: `Solo ${daysLeft} días más para alcanzar este increíble hito. ¡Sigue así!`,
      priority: 'normal',
      icon: '/icons/milestone-approaching.png',
      actions: [
        {
          action: 'view_progress',
          title: 'Ver Progreso',
          icon: '📊'
        },
        {
          action: 'start_workout',
          title: 'Entrenar',
          icon: '💪'
        }
      ]
    });
  }

  /**
   * Show daily streak reminder
   */
  public async showDailyStreakReminder(streakCount: number): Promise<boolean> {
    return this.showNotification({
      id: `daily-streak-${Date.now()}`,
      type: 'streak_reminder',
      title: `🔥 Racha de ${streakCount} días`,
      body: `¡Increíble consistencia! ¿Listo para el día ${streakCount + 1}?`,
      priority: 'normal',
      icon: '/icons/streak-fire.png',
      actions: [
        {
          action: 'start_workout',
          title: 'Entrenar',
          icon: '💪'
        },
        {
          action: 'view_progress',
          title: 'Ver Progreso',
          icon: '📊'
        }
      ]
    });
  }

  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Enable/disable do not disturb mode
   */
  public setDoNotDisturbMode(enabled: boolean, duration?: number): void {
    this.doNotDisturbMode = enabled;
    localStorage.setItem('doNotDisturbMode', JSON.stringify(enabled));
    
    if (enabled && duration) {
      // Auto-disable after duration (in minutes)
      setTimeout(() => {
        this.setDoNotDisturbMode(false);
      }, duration * 60 * 1000);
    }
    
    console.log(`Do Not Disturb mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get do not disturb status
   */
  public getDoNotDisturbMode(): boolean {
    return this.doNotDisturbMode;
  }

  /**
   * Schedule a notification for later
   */
  public scheduleNotification(
    notification: Partial<PushNotification>, 
    scheduledTime: Date
  ): string {
    const notificationId = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Show immediately if time has passed
      this.showNotification({ ...notification, id: notificationId });
      return notificationId;
    }
    
    const timeoutId = setTimeout(() => {
      this.showNotification({ ...notification, id: notificationId });
      this.scheduledNotifications.delete(notificationId);
    }, delay);
    
    this.scheduledNotifications.set(notificationId, timeoutId);
    
    console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`);
    return notificationId;
  }

  /**
   * Cancel a scheduled notification
   */
  public cancelScheduledNotification(notificationId: string): boolean {
    const timeoutId = this.scheduledNotifications.get(notificationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(notificationId);
      console.log(`Cancelled scheduled notification: ${notificationId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all scheduled notifications
   */
  public getScheduledNotifications(): string[] {
    return Array.from(this.scheduledNotifications.keys());
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
      case 'notification_action':
        this.handleNotificationAction(data);
        break;
    }
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(data: any): void {
    console.log('Notification clicked:', data);
    
    // Track click event
    const stats = JSON.parse(localStorage.getItem('notificationClickStats') || '{}');
    const today = new Date().toISOString().split('T')[0];
    stats[today] = (stats[today] || 0) + 1;
    localStorage.setItem('notificationClickStats', JSON.stringify(stats));
    
    // Handle specific notification actions
    if (data.action) {
      this.handleNotificationAction(data);
    }
  }

  /**
   * Handle notification dismiss events
   */
  private handleNotificationDismiss(data: any): void {
    console.log('Notification dismissed:', data);
    
    // Track dismiss event
    const stats = JSON.parse(localStorage.getItem('notificationDismissStats') || '{}');
    const today = new Date().toISOString().split('T')[0];
    stats[today] = (stats[today] || 0) + 1;
    localStorage.setItem('notificationDismissStats', JSON.stringify(stats));
  }

  /**
   * Handle notification action events
   */
  private handleNotificationAction(data: any): void {
    console.log('Notification action:', data);
    
    switch (data.action) {
      case 'start_workout':
        // Navigate to workout page
        window.location.href = '/workout';
        break;
      case 'view_progress':
        // Navigate to progress page
        window.location.href = '/progress';
        break;
      case 'snooze_1h':
        // Schedule reminder for 1 hour later
        const snoozeTime = new Date(Date.now() + 60 * 60 * 1000);
        this.scheduleNotification({
          type: data.originalType,
          title: data.originalTitle,
          body: 'Recordatorio: ' + data.originalBody
        }, snoozeTime);
        break;
    }
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    
    console.log('Notification settings updated:', this.settings);
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public getPermission(): NotificationPermission {
    return { ...this.permission };
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats(): {
    sent: Record<string, number>;
    clicked: Record<string, number>;
    dismissed: Record<string, number>;
  } {
    return {
      sent: JSON.parse(localStorage.getItem('notificationStats') || '{}'),
      clicked: JSON.parse(localStorage.getItem('notificationClickStats') || '{}'),
      dismissed: JSON.parse(localStorage.getItem('notificationDismissStats') || '{}')
    };
  }

  /**
   * Test notification system
   */
  public async testNotification(): Promise<boolean> {
    return this.showNotification({
      id: 'test-notification',
      type: 'system_update',
      title: '🧪 Notificación de Prueba',
      body: 'Si ves esto, las notificaciones están funcionando correctamente.',
      priority: 'normal',
      requireInteraction: false
    });
  }

  /**
   * Clear specific notification (if supported by browser)
   */
  public async clearNotification(id: string): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        const notifications = await this.serviceWorkerRegistration.getNotifications();
        const notification = notifications.find(n => n.tag === id);
        if (notification) {
          notification.close();
        }
      } catch (error) {
        console.error('Failed to clear notification:', error);
      }
    }
  }

  /**
   * Clear all notifications (if supported by browser)
   */
  public async clearAllNotifications(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        const notifications = await this.serviceWorkerRegistration.getNotifications();
        notifications.forEach(notification => notification.close());
        console.log(`Cleared ${notifications.length} notifications`);
      } catch (error) {
        console.error('Failed to clear all notifications:', error);
      }
    }
  }

  /**
   * Check if notifications are supported
   */
  public isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get next quiet hours period
   */
  public getNextQuietHoursPeriod(): { start: Date; end: Date } | null {
    if (!this.settings.quietHours.enabled) {
      return null;
    }

    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [startHour, startMinute] = this.settings.quietHours.startTime.split(':').map(Number);
    const [endHour, endMinute] = this.settings.quietHours.endTime.split(':').map(Number);

    const startToday = new Date(today);
    startToday.setHours(startHour, startMinute, 0, 0);

    const endToday = new Date(today);
    endToday.setHours(endHour, endMinute, 0, 0);

    // Handle overnight quiet hours
    if (this.settings.quietHours.startTime > this.settings.quietHours.endTime) {
      if (now < endToday) {
        // Currently in quiet hours that started yesterday
        const startYesterday = new Date(today);
        startYesterday.setDate(startYesterday.getDate() - 1);
        startYesterday.setHours(startHour, startMinute, 0, 0);
        return { start: startYesterday, end: endToday };
      } else if (now >= startToday) {
        // Currently in quiet hours that will end tomorrow
        const endTomorrow = new Date(tomorrow);
        endTomorrow.setHours(endHour, endMinute, 0, 0);
        return { start: startToday, end: endTomorrow };
      } else {
        // Next quiet hours period starts today
        const endTomorrow = new Date(tomorrow);
        endTomorrow.setHours(endHour, endMinute, 0, 0);
        return { start: startToday, end: endTomorrow };
      }
    } else {
      // Same-day quiet hours
      if (now < startToday) {
        return { start: startToday, end: endToday };
      } else {
        const startTomorrow = new Date(tomorrow);
        startTomorrow.setHours(startHour, startMinute, 0, 0);
        const endTomorrow = new Date(tomorrow);
        endTomorrow.setHours(endHour, endMinute, 0, 0);
        return { start: startTomorrow, end: endTomorrow };
      }
    }
  }
}

export const notificationService = NotificationService.getInstance();