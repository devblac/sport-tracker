import type { 
  NotificationPermission, 
  NotificationSettings, 
  PushNotification, 
  NotificationType 
} from '@/types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = {
    granted: false,
    denied: false,
    default: true
  };
  private settings: NotificationSettings;

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.checkPermission();
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
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      },
      frequency: {
        workoutReminders: 'workout_days',
        achievementCelebrations: 'immediate',
        streakReminders: 'at_risk'
      }
    };
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
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public async showNotification(notification: Partial<PushNotification>): Promise<boolean> {
    if (!this.settings.enabled || !this.permission.granted) {
      return false;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
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
        vibrate: notification.vibrate || [200, 100, 200]
      };

      // Note: actions and image are not supported in all browsers
      // They would be added here if supported

      new Notification(notification.title || 'Fitness App', options);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
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

  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.settings.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  public updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    // In a real app, you'd save this to localStorage or database
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public getPermission(): NotificationPermission {
    return { ...this.permission };
  }

  public clearNotification(id: string): void {
    // This would clear a specific notification if the browser supports it
    // Most browsers don't support programmatic notification clearing
    console.log(`Clearing notification: ${id}`);
  }

  public clearAllNotifications(): void {
    // This would clear all notifications if the browser supports it
    console.log('Clearing all notifications');
  }
}

export const notificationService = NotificationService.getInstance();