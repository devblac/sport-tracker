/**
 * Streak Rewards Hook
 * 
 * React hook for managing streak rewards, titles, shields, and notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import { StreakRewardService } from '@/services/StreakRewardService';
import { useStreaks } from '@/hooks/useStreaks';

import type {
  StreakReward,
  StreakTitle,
  StreakShield,
  UserStreakRewards,
  StreakRewardNotification
} from '@/types/streakRewards';

interface UseStreakRewardsReturn {
  // Data
  userRewards: UserStreakRewards | null;
  activeTitle: StreakTitle | null;
  availableShields: StreakShield[];
  activeShields: StreakShield[];
  notifications: StreakRewardNotification[];
  unreadNotifications: number;
  
  // XP Multiplier
  currentXPMultiplier: number;
  
  // Actions
  checkForNewRewards: () => Promise<StreakReward[]>;
  setActiveTitle: (titleId: string) => Promise<boolean>;
  useShield: (shieldId: string) => Promise<{ success: boolean; message: string }>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  isCheckingRewards: boolean;
}

export function useStreakRewards(userId: string): UseStreakRewardsReturn {
  const [userRewards, setUserRewards] = useState<UserStreakRewards | null>(null);
  const [notifications, setNotifications] = useState<StreakRewardNotification[]>([]);
  const [activeShields, setActiveShields] = useState<StreakShield[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingRewards, setIsCheckingRewards] = useState(false);

  const { streakStats } = useStreaks(userId);
  const streakRewardService = StreakRewardService.getInstance();

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [rewards, notifs, shields] = await Promise.all([
          streakRewardService.getUserRewards(userId),
          streakRewardService.getNotifications(userId),
          streakRewardService.getActiveShields(userId)
        ]);

        setUserRewards(rewards);
        setNotifications(notifs);
        setActiveShields(shields);
      } catch (error) {
        console.error('Error loading streak rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, streakRewardService]);

  // Check for new rewards when streak stats change
  const checkForNewRewards = useCallback(async (): Promise<StreakReward[]> => {
    if (!userId || !streakStats || isCheckingRewards) return [];

    try {
      setIsCheckingRewards(true);

      // Check milestone rewards
      const milestoneRewards = await streakRewardService.checkMilestoneRewards(userId, streakStats);
      
      // Check title unlocks
      const newTitles = await streakRewardService.checkTitleUnlocks(userId, streakStats);

      // Refresh data if new rewards were found
      if (milestoneRewards.length > 0 || newTitles.length > 0) {
        const [updatedRewards, updatedNotifications, updatedShields] = await Promise.all([
          streakRewardService.getUserRewards(userId),
          streakRewardService.getNotifications(userId),
          streakRewardService.getActiveShields(userId)
        ]);

        setUserRewards(updatedRewards);
        setNotifications(updatedNotifications);
        setActiveShields(updatedShields);
      }

      return milestoneRewards;
    } catch (error) {
      console.error('Error checking for new rewards:', error);
      return [];
    } finally {
      setIsCheckingRewards(false);
    }
  }, [userId, streakStats, streakRewardService, isCheckingRewards]);

  // Auto-check for rewards when streak changes
  useEffect(() => {
    if (streakStats && streakStats.currentStreak > 0) {
      checkForNewRewards();
    }
  }, [streakStats?.currentStreak, checkForNewRewards]);

  // Set active title
  const setActiveTitle = useCallback(async (titleId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await streakRewardService.setActiveTitle(userId, titleId);
      
      if (success) {
        const updatedRewards = await streakRewardService.getUserRewards(userId);
        setUserRewards(updatedRewards);
      }

      return success;
    } catch (error) {
      console.error('Error setting active title:', error);
      return false;
    }
  }, [userId, streakRewardService]);

  // Use shield
  const useShield = useCallback(async (shieldId: string): Promise<{ success: boolean; message: string }> => {
    if (!userId) return { success: false, message: 'Usuario no válido' };

    try {
      const result = await streakRewardService.useShield(userId, shieldId);
      
      if (result.success) {
        // Refresh active shields
        const updatedShields = await streakRewardService.getActiveShields(userId);
        setActiveShields(updatedShields);
        
        // Refresh user rewards
        const updatedRewards = await streakRewardService.getUserRewards(userId);
        setUserRewards(updatedRewards);
      }

      return result;
    } catch (error) {
      console.error('Error using shield:', error);
      return { success: false, message: 'Error al usar el escudo' };
    }
  }, [userId, streakRewardService]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId) return;

    try {
      await streakRewardService.markNotificationAsRead(userId, notificationId);
      
      // Update local notifications
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [userId, streakRewardService]);

  // Computed values
  const activeTitle = userRewards?.titles.find(title => title.isActive) || null;
  const availableShields = userRewards?.shields.filter(shield => 
    shield.usesRemaining > 0 && 
    (!shield.expiresAt || shield.expiresAt > new Date())
  ) || [];
  
  const unreadNotifications = notifications.filter(notif => !notif.isRead).length;
  
  const currentXPMultiplier = streakStats 
    ? streakRewardService.getStreakXPMultiplier(streakStats.currentStreak)
    : 1.0;

  return {
    // Data
    userRewards,
    activeTitle,
    availableShields,
    activeShields,
    notifications,
    unreadNotifications,
    
    // XP Multiplier
    currentXPMultiplier,
    
    // Actions
    checkForNewRewards,
    setActiveTitle,
    useShield,
    markNotificationAsRead,
    
    // Loading states
    isLoading,
    isCheckingRewards
  };
}

export default useStreakRewards;