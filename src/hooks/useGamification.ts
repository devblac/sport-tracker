/**
 * Gamification Hook
 * 
 * Custom hook for managing gamification state, XP awards, level ups,
 * and achievement unlocks throughout the application.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GamificationService } from '@/services/GamificationService';
import { logger } from '@/utils/logger';
import type {
  UserLevel,
  GamificationStats,
  UserStreak,
  Achievement,
  UserAchievement,
  XPSource,
  XPAwardResult,
  GamificationEvent
} from '@/types/gamification';

interface UseGamificationOptions {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGamificationReturn {
  // State
  userLevel: UserLevel | null;
  userStats: GamificationStats | null;
  userStreak: UserStreak | null;
  userAchievements: UserAchievement[];
  recentAchievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  
  // Recent activity
  recentXPGain: number;
  levelUpData: XPAwardResult['levelUp'] | null;
  newAchievements: Achievement[];
  
  // Actions
  awardXP: (amount: number, source: XPSource, sourceId?: string) => Promise<XPAwardResult | null>;
  updateStreak: (workoutDate?: Date) => Promise<void>;
  refreshData: () => Promise<void>;
  clearRecentActivity: () => void;
  dismissLevelUp: () => void;
  dismissNewAchievements: () => void;
  
  // Utilities
  calculateXPForActivity: (activityType: string, activityData: any) => number;
  isFeatureUnlocked: (feature: string) => boolean;
}

export const useGamification = ({
  userId,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseGamificationOptions): UseGamificationReturn => {
  // Core state
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userStats, setUserStats] = useState<GamificationStats | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Recent activity state
  const [recentXPGain, setRecentXPGain] = useState(0);
  const [levelUpData, setLevelUpData] = useState<XPAwardResult['levelUp'] | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  
  // Services
  const gamificationService = useRef(GamificationService.getInstance());
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const recentXPTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Load all gamification data for the user
   */
  const loadGamificationData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load all data in parallel
      const [level, stats, streak, achievements] = await Promise.all([
        gamificationService.current.getUserLevel(userId),
        gamificationService.current.getUserStats(userId),
        gamificationService.current.getUserStreak(userId),
        gamificationService.current.getUserAchievements(userId)
      ]);

      setUserLevel(level);
      setUserStats(stats);
      setUserStreak(streak);
      setUserAchievements(achievements);

      // Get recent achievements (unlocked in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recent = achievements
        .filter(ua => ua.isUnlocked && ua.unlockedAt && ua.unlockedAt > weekAgo)
        .map(ua => {
          // This would normally come from a service call to get achievement details
          // For now, we'll create a mock achievement
          return {
            id: ua.achievementId,
            name: 'Achievement',
            description: 'Achievement unlocked',
            icon: '🏆',
            category: 'milestone' as const,
            rarity: 'common' as const,
            requirements: [],
            rewards: { xp: 0 },
            isSecret: false,
            isRepeatable: false,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });

      setRecentAchievements(recent);
    } catch (err) {
      logger.error('Failed to load gamification data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gamification data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Award XP to the user and handle side effects
   */
  const awardXP = useCallback(async (
    amount: number,
    source: XPSource,
    sourceId?: string
  ): Promise<XPAwardResult | null> => {
    if (!userId) return null;

    try {
      const result = await gamificationService.current.awardXP(userId, amount, source, sourceId);
      
      // Update recent XP gain with animation
      setRecentXPGain(prev => prev + result.xpAwarded);
      
      // Clear recent XP gain after animation
      if (recentXPTimeoutRef.current) {
        clearTimeout(recentXPTimeoutRef.current);
      }
      recentXPTimeoutRef.current = setTimeout(() => {
        setRecentXPGain(0);
      }, 3000);

      // Handle level up
      if (result.levelUp) {
        setLevelUpData(result.levelUp);
      }

      // Handle new achievements
      if (result.achievementsUnlocked.length > 0) {
        setNewAchievements(prev => [...prev, ...result.achievementsUnlocked]);
      }

      // Refresh data to get updated state
      await loadGamificationData();

      return result;
    } catch (err) {
      logger.error('Failed to award XP:', err);
      setError(err instanceof Error ? err.message : 'Failed to award XP');
      return null;
    }
  }, [userId, loadGamificationData]);

  /**
   * Update user's workout streak
   */
  const updateStreak = useCallback(async (workoutDate: Date = new Date()) => {
    if (!userId) return;

    try {
      const updatedStreak = await gamificationService.current.updateStreak(userId, workoutDate);
      setUserStreak(updatedStreak);
      
      // Check for streak milestone XP
      const milestones = [7, 14, 30, 60, 90, 180, 365];
      if (milestones.includes(updatedStreak.currentStreak)) {
        await awardXP(updatedStreak.currentStreak * 10, 'streak_milestone');
      }
    } catch (err) {
      logger.error('Failed to update streak:', err);
      setError(err instanceof Error ? err.message : 'Failed to update streak');
    }
  }, [userId, awardXP]);

  /**
   * Calculate XP for a specific activity
   */
  const calculateXPForActivity = useCallback((activityType: string, activityData: any): number => {
    return gamificationService.current.calculateXPForActivity(activityType, activityData);
  }, []);

  /**
   * Check if a feature is unlocked for the current user level
   */
  const isFeatureUnlocked = useCallback((feature: string): boolean => {
    if (!userLevel) return false;
    
    // This would normally use the level progression utility
    // For now, we'll do a simple check
    const featureUnlockLevels = {
      'workout_creation': 1,
      'exercise_search': 1,
      'workout_templates': 2,
      'basic_analytics': 2,
      'personal_records': 3,
      'achievements': 3,
      'social_feed': 4,
      'gym_friends': 4,
      'advanced_analytics': 5,
      'progress_charts': 5,
      'challenges': 6,
      'leaderboards': 6,
      'custom_achievements': 7,
      'streak_protection': 7,
      'mentorship': 8,
      'premium_trial': 8,
      'content_creation': 9,
      'advanced_customization': 9,
      'all_features': 10,
      'exclusive_content': 10
    };

    const requiredLevel = featureUnlockLevels[feature] || 999;
    return userLevel.level >= requiredLevel;
  }, [userLevel]);

  /**
   * Refresh all gamification data
   */
  const refreshData = useCallback(async () => {
    await loadGamificationData();
  }, [loadGamificationData]);

  /**
   * Clear recent activity indicators
   */
  const clearRecentActivity = useCallback(() => {
    setRecentXPGain(0);
    setNewAchievements([]);
    
    if (recentXPTimeoutRef.current) {
      clearTimeout(recentXPTimeoutRef.current);
    }
  }, []);

  /**
   * Dismiss level up notification
   */
  const dismissLevelUp = useCallback(() => {
    setLevelUpData(null);
  }, []);

  /**
   * Dismiss new achievement notifications
   */
  const dismissNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  // Initial data load
  useEffect(() => {
    if (userId) {
      loadGamificationData();
    }
  }, [userId, loadGamificationData]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && userId) {
      const setupRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(() => {
          loadGamificationData().then(setupRefresh);
        }, refreshInterval);
      };

      setupRefresh();

      return () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
      };
    }
  }, [autoRefresh, userId, refreshInterval, loadGamificationData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (recentXPTimeoutRef.current) {
        clearTimeout(recentXPTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    userLevel,
    userStats,
    userStreak,
    userAchievements,
    recentAchievements,
    isLoading,
    error,
    
    // Recent activity
    recentXPGain,
    levelUpData,
    newAchievements,
    
    // Actions
    awardXP,
    updateStreak,
    refreshData,
    clearRecentActivity,
    dismissLevelUp,
    dismissNewAchievements,
    
    // Utilities
    calculateXPForActivity,
    isFeatureUnlocked
  };
};

/**
 * Hook for quick XP operations without full gamification state
 */
export const useXPOperations = (userId: string) => {
  const gamificationService = useRef(GamificationService.getInstance());

  const quickAwardXP = useCallback(async (
    amount: number,
    source: XPSource,
    sourceId?: string
  ) => {
    if (!userId) return null;
    
    try {
      return await gamificationService.current.awardXP(userId, amount, source, sourceId);
    } catch (err) {
      logger.error('Failed to award XP:', err);
      return null;
    }
  }, [userId]);

  const calculateXP = useCallback((activityType: string, activityData: any) => {
    return gamificationService.current.calculateXPForActivity(activityType, activityData);
  }, []);

  return {
    awardXP: quickAwardXP,
    calculateXP
  };
};

export default useGamification;