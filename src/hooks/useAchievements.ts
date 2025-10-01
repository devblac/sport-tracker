/**
 * useAchievements Hook
 * 
 * React hook for managing achievement data, progress tracking,
 * and real-time achievement updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { achievementService } from '@/services/AchievementService';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/utils/logger';
import type { 
  Achievement, 
  UserAchievement,
  AchievementCategory,
  AchievementRarity
} from '@/types/gamification';
import type { AchievementProgress, AchievementStats } from '@/services/AchievementService';

export interface UseAchievementsOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  category?: AchievementCategory;
  rarity?: AchievementRarity;
}

export interface UseAchievementsReturn {
  // Data
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementProgress: AchievementProgress[];
  achievementStats: AchievementStats | null;
  
  // Filtered data
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  nearCompletionAchievements: Array<{ achievement: Achievement; progress: number }>;
  recentUnlocks: Achievement[];
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshAchievements: () => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<boolean>;
  shareAchievement: (achievementId: string) => Promise<boolean>;
  getAchievementProgress: (achievementId: string) => number;
  checkForNewUnlocks: (eventType: string, eventData?: any) => Promise<Achievement[]>;
  
  // Utilities
  filterAchievements: (filters: {
    category?: AchievementCategory | 'all';
    rarity?: AchievementRarity | 'all';
    unlockedOnly?: boolean;
    searchQuery?: string;
  }) => Achievement[];
}

export const useAchievements = (options: UseAchievementsOptions = {}): UseAchievementsReturn => {
  const { user } = useAuthStore();
  const userId = options.userId || user?.id;
  
  // State
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load all achievements
      const allAchievements = await achievementService.getAllAchievements();
      
      // Filter by category if specified
      const filteredAchievements = options.category 
        ? allAchievements.filter(a => a.category === options.category)
        : allAchievements;

      // Filter by rarity if specified
      const finalAchievements = options.rarity
        ? filteredAchievements.filter(a => a.rarity === options.rarity)
        : filteredAchievements;

      setAchievements(finalAchievements);

      // Load user achievements
      const userAchievementData = await achievementService.getUserAchievements(userId);
      setUserAchievements(userAchievementData);

      // Calculate progress for all achievements
      const progressData = await achievementService.calculateAllAchievementProgress(userId);
      setAchievementProgress(progressData);

      // Load achievement stats
      const stats = await achievementService.getAchievementStats(userId);
      setAchievementStats(stats);

      logger.debug('Achievements loaded', { 
        userId, 
        totalAchievements: finalAchievements.length,
        userAchievements: userAchievementData.length
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(errorMessage);
      logger.error('Failed to load achievements', { error: err, userId });
    } finally {
      setIsLoading(false);
    }
  }, [userId, options.category, options.rarity]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initial load
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Auto refresh
  useEffect(() => {
    if (!options.autoRefresh || !userId) return;

    const interval = setInterval(() => {
      loadAchievements();
    }, options.refreshInterval || 30000); // Default 30 seconds

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, loadAchievements, userId]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const unlockedAchievements = useMemo(() => {
    const unlockedIds = new Set(
      userAchievements
        .filter(ua => ua.is_completed)
        .map(ua => ua.achievement_id)
    );
    
    return achievements.filter(a => unlockedIds.has(a.id));
  }, [achievements, userAchievements]);

  const lockedAchievements = useMemo(() => {
    const unlockedIds = new Set(
      userAchievements
        .filter(ua => ua.is_completed)
        .map(ua => ua.achievement_id)
    );
    
    return achievements.filter(a => !unlockedIds.has(a.id));
  }, [achievements, userAchievements]);

  const nearCompletionAchievements = useMemo(() => {
    return achievementProgress
      .filter(p => !p.isUnlocked && p.progress > 0.75)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
      .map(p => ({ achievement: p.achievement, progress: p.progress }));
  }, [achievementProgress]);

  const recentUnlocks = useMemo(() => {
    if (!achievementStats) return [];
    return achievementStats.recentUnlocks.slice(0, 10);
  }, [achievementStats]);

  // ============================================================================
  // Actions
  // ============================================================================

  const refreshAchievements = useCallback(async () => {
    await loadAchievements();
  }, [loadAchievements]);

  const unlockAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await achievementService.unlockAchievement(userId, achievementId);
      
      if (success) {
        // Refresh data to show the unlock
        await loadAchievements();
      }
      
      return success;
    } catch (err) {
      logger.error('Failed to unlock achievement', { error: err, achievementId, userId });
      return false;
    }
  }, [userId, loadAchievements]);

  const shareAchievement = useCallback(async (achievementId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const success = await achievementService.shareAchievement(userId, achievementId);
      return success;
    } catch (err) {
      logger.error('Failed to share achievement', { error: err, achievementId, userId });
      return false;
    }
  }, [userId]);

  const getAchievementProgress = useCallback((achievementId: string): number => {
    const progress = achievementProgress.find(p => p.achievement.id === achievementId);
    return progress?.progress || 0;
  }, [achievementProgress]);

  const checkForNewUnlocks = useCallback(async (
    eventType: string, 
    eventData?: any
  ): Promise<Achievement[]> => {
    if (!userId) return [];

    try {
      const newUnlocks = await achievementService.checkAndUnlockAchievements(
        userId, 
        eventType, 
        eventData
      );
      
      if (newUnlocks.length > 0) {
        // Refresh data to show new unlocks
        await loadAchievements();
      }
      
      return newUnlocks;
    } catch (err) {
      logger.error('Failed to check for new unlocks', { error: err, eventType, userId });
      return [];
    }
  }, [userId, loadAchievements]);

  const filterAchievements = useCallback((filters: {
    category?: AchievementCategory | 'all';
    rarity?: AchievementRarity | 'all';
    unlockedOnly?: boolean;
    searchQuery?: string;
  }) => {
    let filtered = [...achievements];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(a => a.category === filters.category);
    }

    // Rarity filter
    if (filters.rarity && filters.rarity !== 'all') {
      filtered = filtered.filter(a => a.rarity === filters.rarity);
    }

    // Unlocked only filter
    if (filters.unlockedOnly) {
      const unlockedIds = new Set(
        userAchievements
          .filter(ua => ua.is_completed)
          .map(ua => ua.achievement_id)
      );
      filtered = filtered.filter(a => unlockedIds.has(a.id));
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [achievements, userAchievements]);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // Data
    achievements,
    userAchievements,
    achievementProgress,
    achievementStats,
    
    // Filtered data
    unlockedAchievements,
    lockedAchievements,
    nearCompletionAchievements,
    recentUnlocks,
    
    // State
    isLoading,
    error,
    
    // Actions
    refreshAchievements,
    unlockAchievement,
    shareAchievement,
    getAchievementProgress,
    checkForNewUnlocks,
    
    // Utilities
    filterAchievements
  };
};

export default useAchievements;