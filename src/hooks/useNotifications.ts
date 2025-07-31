/**
 * Notifications Hook
 * 
 * React hook for managing notifications, settings, and permissions.
 */

import { useState, useEffect, useCallback } from 'react';
import { NotificationManager } from '@/services/NotificationManager';

import type {
  NotificationSettings,
  InAppNotification,
  NotificationStats,
  NotificationPermission
} from '@/types/notifications';

interface UseNotificationsReturn {
  // Permission
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  
  // Settings
  settings: NotificationSettings | null;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // In-app notifications
  notifications: InAppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Statistics
  stats: NotificationStats | null;
  
  // Sending notifications
  sendWorkoutReminder: () => Promise<boolean>;
  sendStreakReminder: (isAtRisk?: boolean) => Promise<boolean>;
  sendAchievementCelebration: (
    achievementId: string,
    name: string,
    description: string,
    rarity?: string
  ) => Promise<boolean>;
  sendLevelUpCelebration: (newLevel: number, xpGained: number) => Promise<boolean>;
  
  // Loading states
  isLoading: boolean;
  isUpdatingSettings: boolean;
}

export function useNotifications(userId: string): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const notificationManager = NotificationManager.getInstance();

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check permission status
        const permissionStatus = notificationManager.getPermissionStatus();
        setPermission(permissionStatus);
        
        // Load user settings
        const userSettings = await notificationManager.getUserSettings(userId);
        setSettings(userSettings);
        
        // Load notifications
        const userNotifications = await notificationManager.getInAppNotifications(userId);
        setNotifications(userNotifications);
        
        // Load stats
        const userStats = await notificationManager.getNotificationStats(userId);
        setStats(userStats);
      } catch (error) {
        console.error('Error loading notification data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, notificationManager]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const newPermission = await notificationManager.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return permission;
    }
  }, [notificationManager, permission]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    if (!userId || !settings) return;

    try {
      setIsUpdatingSettings(true);
      await notificationManager.updateUserSettings(userId, newSettings);
      
      const updatedSettings = await notificationManager.getUserSettings(userId);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
    } finally {
      setIsUpdatingSettings(false);
    }
  }, [userId, settings, notificationManager]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId) return;

    try {
      await notificationManager.markNotificationAsRead(userId, notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId, notificationManager]);

  // Clear all notifications
  const clearAll = useCallback(async (): Promise<void> => {
    if (!userId) return;

    try {
      await notificationManager.clearAllNotifications(userId);
      setNotifications([]);
      setStats(null);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [userId, notificationManager]);

  // Send workout reminder
  const sendWorkoutReminder = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      const context = {
        userId,
        userSettings: settings!,
        currentStreak: 5, // Would come from streak service
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language
      };

      const success = await notificationManager.sendWorkoutReminder(userId, context);
      
      if (success) {
        // Refresh notifications
        const updatedNotifications = await notificationManager.getInAppNotifications(userId);
        setNotifications(updatedNotifications);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending workout reminder:', error);
      return false;
    }
  }, [userId, settings, notificationManager]);

  // Send streak reminder
  const sendStreakReminder = useCallback(async (isAtRisk: boolean = false): Promise<boolean> => {
    if (!userId) return false;

    try {
      const context = {
        userId,
        userSettings: settings!,
        currentStreak: 10, // Would come from streak service
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language
      };

      const success = await notificationManager.sendStreakReminder(userId, context, isAtRisk);
      
      if (success) {
        // Refresh notifications
        const updatedNotifications = await notificationManager.getInAppNotifications(userId);
        setNotifications(updatedNotifications);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending streak reminder:', error);
      return false;
    }
  }, [userId, settings, notificationManager]);

  // Send achievement celebration
  const sendAchievementCelebration = useCallback(async (
    achievementId: string,
    name: string,
    description: string,
    rarity: string = 'common'
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await notificationManager.sendAchievementCelebration(
        userId,
        achievementId,
        name,
        description,
        rarity
      );
      
      if (success) {
        // Refresh notifications
        const updatedNotifications = await notificationManager.getInAppNotifications(userId);
        setNotifications(updatedNotifications);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending achievement celebration:', error);
      return false;
    }
  }, [userId, notificationManager]);

  // Send level up celebration
  const sendLevelUpCelebration = useCallback(async (
    newLevel: number,
    xpGained: number
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await notificationManager.sendLevelUpCelebration(userId, newLevel, xpGained);
      
      if (success) {
        // Refresh notifications
        const updatedNotifications = await notificationManager.getInAppNotifications(userId);
        setNotifications(updatedNotifications);
      }
      
      return success;
    } catch (error) {
      console.error('Error sending level up celebration:', error);
      return false;
    }
  }, [userId, notificationManager]);

  // Computed values
  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  return {
    // Permission
    permission,
    requestPermission,
    
    // Settings
    settings,
    updateSettings,
    
    // In-app notifications
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    
    // Statistics
    stats,
    
    // Sending notifications
    sendWorkoutReminder,
    sendStreakReminder,
    sendAchievementCelebration,
    sendLevelUpCelebration,
    
    // Loading states
    isLoading,
    isUpdatingSettings
  };
}

export default useNotifications;