/**
 * Streak Notification Service
 * 
 * Specialized service for handling streak-related notifications with risk detection.
 */

import { notificationService } from './notificationService';
import type { NotificationContext } from '@/types/notifications';

export interface StreakRiskLevel {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  hoursRemaining: number;
  message: string;
}

export interface StreakNotificationConfig {
  userId: string;
  currentStreak: number;
  scheduledDays: number[]; // 0-6, Sunday = 0
  lastWorkoutDate?: Date;
  streakDeadline?: Date;
  enableRiskNotifications: boolean;
  warningThresholds: {
    early: number; // hours before deadline
    urgent: number; // hours before deadline
    critical: number; // hours before deadline
  };
}

export class StreakNotificationService {
  private static instance: StreakNotificationService;
  private scheduledRiskChecks: Map<string, number> = new Map(); // userId -> timeout ID
  private lastRiskNotification: Map<string, Date> = new Map(); // userId -> last notification time

  private constructor() {
    // Initialize service
  }

  public static getInstance(): StreakNotificationService {
    if (!StreakNotificationService.instance) {
      StreakNotificationService.instance = new StreakNotificationService();
    }
    return StreakNotificationService.instance;
  }

  /**
   * Set up streak monitoring for a user
   */
  public setupStreakMonitoring(config: StreakNotificationConfig): void {
    if (!config.enableRiskNotifications) {
      this.clearStreakMonitoring(config.userId);
      return;
    }

    // Clear existing monitoring
    this.clearStreakMonitoring(config.userId);

    // Calculate next deadline
    const deadline = this.calculateNextDeadline(config);
    if (!deadline) {
      console.log('No deadline calculated for user:', config.userId);
      return;
    }

    // Schedule risk checks
    this.scheduleRiskChecks(config, deadline);
    
    console.log(`Streak monitoring set up for user ${config.userId}, deadline: ${deadline.toLocaleString()}`);
  }

  /**
   * Clear streak monitoring for a user
   */
  public clearStreakMonitoring(userId: string): void {
    const timeoutId = this.scheduledRiskChecks.get(userId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledRiskChecks.delete(userId);
    }
    
    this.lastRiskNotification.delete(userId);
    console.log(`Streak monitoring cleared for user: ${userId}`);
  }

  /**
   * Calculate the next streak deadline based on user's schedule
   */
  private calculateNextDeadline(config: StreakNotificationConfig): Date | null {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // If user has scheduled days, find next scheduled day
    if (config.scheduledDays.length > 0) {
      // Find next scheduled day
      let daysUntilNext = 0;
      let found = false;
      
      for (let i = 0; i < 7; i++) {
        const checkDay = (today + i) % 7;
        if (config.scheduledDays.includes(checkDay)) {
          daysUntilNext = i;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return null; // No scheduled days
      }
      
      // If it's today and we haven't worked out yet, deadline is end of today
      if (daysUntilNext === 0 && !this.hasWorkedOutToday(config)) {
        const deadline = new Date(now);
        deadline.setHours(23, 59, 59, 999);
        return deadline;
      }
      
      // Otherwise, deadline is end of the next scheduled day
      const deadline = new Date(now);
      deadline.setDate(deadline.getDate() + daysUntilNext);
      deadline.setHours(23, 59, 59, 999);
      return deadline;
    }
    
    // Default: daily streak, deadline is end of today
    const deadline = new Date(now);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }

  /**
   * Check if user has worked out today
   */
  private hasWorkedOutToday(config: StreakNotificationConfig): boolean {
    if (!config.lastWorkoutDate) {
      return false;
    }
    
    const today = new Date();
    const lastWorkout = new Date(config.lastWorkoutDate);
    
    return (
      today.getFullYear() === lastWorkout.getFullYear() &&
      today.getMonth() === lastWorkout.getMonth() &&
      today.getDate() === lastWorkout.getDate()
    );
  }

  /**
   * Schedule risk checks for a user
   */
  private scheduleRiskChecks(config: StreakNotificationConfig, deadline: Date): void {
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    
    if (timeUntilDeadline <= 0) {
      // Deadline has passed, send critical notification immediately
      this.sendStreakRiskNotification(config, {
        level: 'critical',
        hoursRemaining: 0,
        message: 'Tu racha ha expirado'
      });
      return;
    }
    
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);
    
    // Schedule notifications based on thresholds
    const { early, urgent, critical } = config.warningThresholds;
    
    // Schedule early warning
    if (hoursUntilDeadline > early) {
      const earlyTime = deadline.getTime() - (early * 60 * 60 * 1000);
      this.scheduleNotificationAt(config, earlyTime, 'warning', early);
    }
    
    // Schedule urgent warning
    if (hoursUntilDeadline > urgent) {
      const urgentTime = deadline.getTime() - (urgent * 60 * 60 * 1000);
      this.scheduleNotificationAt(config, urgentTime, 'danger', urgent);
    }
    
    // Schedule critical warning
    if (hoursUntilDeadline > critical) {
      const criticalTime = deadline.getTime() - (critical * 60 * 60 * 1000);
      this.scheduleNotificationAt(config, criticalTime, 'critical', critical);
    }
    
    // If we're already in a warning period, send notification now
    if (hoursUntilDeadline <= early) {
      const level = hoursUntilDeadline <= critical ? 'critical' : 
                   hoursUntilDeadline <= urgent ? 'danger' : 'warning';
      
      this.sendStreakRiskNotification(config, {
        level,
        hoursRemaining: Math.ceil(hoursUntilDeadline),
        message: this.getRiskMessage(level, Math.ceil(hoursUntilDeadline))
      });
    }
  }

  /**
   * Schedule a notification at a specific time
   */
  private scheduleNotificationAt(
    config: StreakNotificationConfig,
    scheduledTime: number,
    level: StreakRiskLevel['level'],
    hoursRemaining: number
  ): void {
    const delay = scheduledTime - Date.now();
    
    if (delay <= 0) {
      return; // Time has passed
    }
    
    const timeoutId = setTimeout(() => {
      this.sendStreakRiskNotification(config, {
        level,
        hoursRemaining,
        message: this.getRiskMessage(level, hoursRemaining)
      });
    }, delay);
    
    // Store the timeout ID (we only store the last one for simplicity)
    this.scheduledRiskChecks.set(config.userId, timeoutId);
  }

  /**
   * Send streak risk notification
   */
  private async sendStreakRiskNotification(
    config: StreakNotificationConfig,
    risk: StreakRiskLevel
  ): Promise<void> {
    // Check if we've sent a notification recently to avoid spam
    const lastNotification = this.lastRiskNotification.get(config.userId);
    const now = new Date();
    
    if (lastNotification) {
      const timeSinceLastNotification = now.getTime() - lastNotification.getTime();
      const minInterval = risk.level === 'critical' ? 30 * 60 * 1000 : 60 * 60 * 1000; // 30 min for critical, 1 hour for others
      
      if (timeSinceLastNotification < minInterval) {
        console.log('Skipping notification due to rate limiting');
        return;
      }
    }
    
    // Send the notification
    let success = false;
    
    switch (risk.level) {
      case 'critical':
        success = await notificationService.showStreakAtRiskNotification(
          config.currentStreak,
          risk.hoursRemaining
        );
        break;
      
      case 'danger':
        success = await notificationService.showStreakAtRiskNotification(
          config.currentStreak,
          risk.hoursRemaining
        );
        break;
      
      case 'warning':
        success = await notificationService.showDailyStreakReminder(config.currentStreak);
        break;
      
      default:
        success = await notificationService.showDailyStreakReminder(config.currentStreak);
        break;
    }
    
    if (success) {
      this.lastRiskNotification.set(config.userId, now);
      console.log(`Streak risk notification sent for user ${config.userId}: ${risk.level}`);
    }
  }

  /**
   * Get risk message based on level and hours remaining
   */
  private getRiskMessage(level: StreakRiskLevel['level'], hoursRemaining: number): string {
    switch (level) {
      case 'critical':
        return hoursRemaining <= 0 
          ? 'Tu racha ha expirado' 
          : `¡Solo ${hoursRemaining} horas para mantener tu racha!`;
      
      case 'danger':
        return `¡Atención! Tu racha expira en ${hoursRemaining} horas`;
      
      case 'warning':
        return `Recordatorio: Tienes ${hoursRemaining} horas para entrenar`;
      
      default:
        return 'Es hora de entrenar para mantener tu racha';
    }
  }

  /**
   * Update streak after workout completion
   */
  public onWorkoutCompleted(userId: string, newStreakCount: number): void {
    // Clear current monitoring since streak is safe now
    this.clearStreakMonitoring(userId);
    
    // Send celebration notification for milestone streaks
    this.checkStreakMilestone(userId, newStreakCount);
    
    console.log(`Workout completed for user ${userId}, new streak: ${newStreakCount}`);
  }

  /**
   * Check if streak reached a milestone and send celebration
   */
  private async checkStreakMilestone(userId: string, streakCount: number): Promise<void> {
    const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    
    if (milestones.includes(streakCount)) {
      // Send milestone celebration
      await notificationService.showNotification({
        id: `streak-milestone-${streakCount}`,
        type: 'milestone_reached',
        title: `🎉 ¡${streakCount} días de racha!`,
        body: `¡Increíble! Has alcanzado ${streakCount} días consecutivos de entrenamiento.`,
        priority: 'high',
        requireInteraction: true,
        icon: '/icons/milestone-celebration.png',
        actions: [
          {
            action: 'share_milestone',
            title: 'Compartir',
            icon: '📱'
          },
          {
            action: 'view_progress',
            title: 'Ver Progreso',
            icon: '📊'
          }
        ]
      });
    }
    
    // Check for approaching milestones
    const nextMilestone = milestones.find(m => m > streakCount);
    if (nextMilestone && nextMilestone - streakCount <= 3) {
      await notificationService.showStreakMilestoneApproachingNotification(
        streakCount,
        nextMilestone
      );
    }
  }

  /**
   * Get current risk level for a user
   */
  public getCurrentRiskLevel(config: StreakNotificationConfig): StreakRiskLevel {
    const deadline = this.calculateNextDeadline(config);
    
    if (!deadline) {
      return {
        level: 'safe',
        hoursRemaining: 24,
        message: 'Sin horario definido'
      };
    }
    
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDeadline <= 0) {
      return {
        level: 'critical',
        hoursRemaining: 0,
        message: 'Tu racha ha expirado'
      };
    }
    
    const { early, urgent, critical } = config.warningThresholds;
    
    if (hoursUntilDeadline <= critical) {
      return {
        level: 'critical',
        hoursRemaining: Math.ceil(hoursUntilDeadline),
        message: this.getRiskMessage('critical', Math.ceil(hoursUntilDeadline))
      };
    }
    
    if (hoursUntilDeadline <= urgent) {
      return {
        level: 'danger',
        hoursRemaining: Math.ceil(hoursUntilDeadline),
        message: this.getRiskMessage('danger', Math.ceil(hoursUntilDeadline))
      };
    }
    
    if (hoursUntilDeadline <= early) {
      return {
        level: 'warning',
        hoursRemaining: Math.ceil(hoursUntilDeadline),
        message: this.getRiskMessage('warning', Math.ceil(hoursUntilDeadline))
      };
    }
    
    return {
      level: 'safe',
      hoursRemaining: Math.ceil(hoursUntilDeadline),
      message: 'Tu racha está segura'
    };
  }

  /**
   * Get default warning thresholds
   */
  public static getDefaultThresholds() {
    return {
      early: 6, // 6 hours before deadline
      urgent: 3, // 3 hours before deadline
      critical: 1 // 1 hour before deadline
    };
  }
}

export const streakNotificationService = StreakNotificationService.getInstance();