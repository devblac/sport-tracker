import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { PersonalRecord } from '../types';

interface PersonalRecordsState {
  records: PersonalRecord[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UsePersonalRecordsReturn {
  // Data
  records: PersonalRecord[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  
  // Actions
  refreshRecords: () => Promise<void>;
  getRecordsByExercise: (exerciseId: string) => PersonalRecord[];
  getRecordsByMuscleGroup: (muscleGroup: string) => PersonalRecord[];
  getRecordsByTimePeriod: (days: number) => PersonalRecord[];
  
  // Utilities
  clearError: () => void;
}

// Simple in-memory cache with TTL
interface CacheEntry {
  data: PersonalRecord[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

/**
 * Clear the PR cache (for testing purposes)
 * @internal
 */
export const clearPRCache = () => {
  cache.clear();
};

/**
 * Hook for managing personal records (PRs)
 * 
 * Features:
 * - Fetch all PRs for authenticated user
 * - Filter PRs by exercise, muscle group, time period
 * - Refresh PRs (pull-to-refresh)
 * - Automatic loading on mount
 */
export const usePersonalRecords = (): UsePersonalRecordsReturn => {
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<PersonalRecordsState>({
    records: [],
    loading: true,
    error: null,
    refreshing: false,
  });

  // Load PRs on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadRecords();
    } else {
      setState({
        records: [],
        loading: false,
        error: null,
        refreshing: false,
      });
    }
  }, [isAuthenticated, user]);

  /**
   * Load personal records from Supabase with caching
   */
  const loadRecords = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cacheKey = `pr_${user.id}`;
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setState(prev => ({
            ...prev,
            records: cached.data,
            loading: false,
            error: null,
          }));
          return;
        }
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (error) {
        throw error;
      }

      const records = data || [];
      
      // Update cache
      const cacheKey = `pr_${user.id}`;
      cache.set(cacheKey, {
        data: records,
        timestamp: Date.now(),
      });

      setState(prev => ({
        ...prev,
        records,
        loading: false,
        error: null,
      }));

    } catch (error) {
      console.error('[usePersonalRecords] Failed to load records:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load personal records';
      setState(prev => ({
        ...prev,
        records: [],
        loading: false,
        error: errorMessage,
      }));
    }
  }, [user]);

  /**
   * Refresh personal records (for pull-to-refresh)
   * Forces a fresh fetch from the database, bypassing cache
   */
  const refreshRecords = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, refreshing: true, error: null }));
    
    try {
      await loadRecords(true); // Force refresh
    } finally {
      setState(prev => ({ ...prev, refreshing: false }));
    }
  }, [user, loadRecords]);

  /**
   * Get all PRs for a specific exercise
   * Returns records sorted by achieved_at (most recent first)
   */
  const getRecordsByExercise = useCallback((exerciseId: string): PersonalRecord[] => {
    return state.records
      .filter(record => record.exercise_id === exerciseId)
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime());
  }, [state.records]);

  /**
   * Get PRs filtered by muscle group
   * Note: This requires exercise metadata to map exercises to muscle groups
   * For MVP, this returns empty array as we don't have muscle group mapping yet
   */
  const getRecordsByMuscleGroup = useCallback((muscleGroup: string): PersonalRecord[] => {
    // TODO: Implement muscle group filtering when exercise library is integrated
    // For now, return empty array
    console.warn('[usePersonalRecords] Muscle group filtering not yet implemented');
    return [];
  }, []);

  /**
   * Get PRs achieved within the last N days
   */
  const getRecordsByTimePeriod = useCallback((days: number): PersonalRecord[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return state.records
      .filter(record => new Date(record.achieved_at) >= cutoffDate)
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime());
  }, [state.records]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    records: state.records,
    loading: state.loading,
    error: state.error,
    refreshing: state.refreshing,
    refreshRecords,
    getRecordsByExercise,
    getRecordsByMuscleGroup,
    getRecordsByTimePeriod,
    clearError,
  };
};
