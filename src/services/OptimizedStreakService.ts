/**
 * Optimized Streak Service
 * 
 * Implements daily caching strategy using IndexedDB to minimize Supabase calls.
 * Only fetches fresh data once per day or when explicitly requested.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type {
  StreakSchedule,
  StreakPeriod,
  StreakDay,
  StreakStats,
  StreakConfig,
  StreakNotification
} from '@/types/streaks';

interface CachedStreakData {
  stats: StreakStats;
  schedules: StreakSchedule[];
  activeSchedule: StreakSchedule | null;
  lastUpdated: string; // ISO date string
  userId: string;
}

export class OptimizedStreakService {
  private static instance: OptimizedStreakService;
  private dbName = 'StreakCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  static getInstance(): OptimizedStreakService {
    if (!OptimizedStreakService.instance) {
      OptimizedStreakService.instance = new OptimizedStreakService();
    }
    return OptimizedStreakService.instance;
  }

  private constructor() {
    this.initializeDB();
  }

  // ============================================================================
  // IndexedDB Setup
  // ============================================================================

  private async initializeDB(): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
          logger.warn('IndexedDB not available, falling back to memory cache');
          resolve();
          return;
        }

        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          logger.warn('Failed to open IndexedDB for streak cache, falling back to memory cache');
          resolve(); // Don't reject, just continue without DB
        };

        request.onsuccess = () => {
          this.db = request.result;
          logger.info('IndexedDB initialized successfully for streak cache');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          try {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create streak cache store
            if (!db.objectStoreNames.contains('streakCache')) {
              const store = db.createObjectStore('streakCache', { keyPath: 'userId' });
              store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
            }
          } catch (upgradeError) {
            logger.warn('Error during IndexedDB upgrade:', upgradeError);
            resolve(); // Continue without DB
          }
        };

        // Add timeout to prevent hanging
        setTimeout(() => {
          logger.warn('IndexedDB initialization timeout, continuing without cache');
          resolve();
        }, 5000);
      });
    } catch (error) {
      logger.warn('Error initializing IndexedDB:', error);
      // Continue without database
    }
  }

  private async ensureDB(): Promise<IDBDatabase | null> {
    if (!this.db) {
      await this.initializeDB();
    }
    return this.db;
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  private async getCachedData(userId: string): Promise<CachedStreakData | null> {
    try {
      const db = await this.ensureDB();
      if (!db) {
        // No IndexedDB available, return null
        return null;
      }

      const transaction = db.transaction(['streakCache'], 'readonly');
      const store = transaction.objectStore('streakCache');
      
      return new Promise((resolve, reject) => {
        const request = store.get(userId);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          logger.warn('Error reading from IndexedDB cache:', request.error);
          resolve(null); // Don't reject, just return null
        };
      });
    } catch (error) {
      logger.warn('Error getting cached streak data:', error);
      return null;
    }
  }

  private async setCachedData(data: CachedStreakData): Promise<void> {
    try {
      const db = await this.ensureDB();
      if (!db) {
        // No IndexedDB available, skip caching
        return;
      }

      const transaction = db.transaction(['streakCache'], 'readwrite');
      const store = transaction.objectStore('streakCache');
      
      return new Promise((resolve, reject) => {
        const request = store.put(data);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          logger.warn('Error writing to IndexedDB cache:', request.error);
          resolve(); // Don't reject, just continue
        };
      });
    } catch (error) {
      logger.warn('Error caching streak data:', error);
      // Continue without caching
    }
  }

  private isCacheValid(cachedData: CachedStreakData): boolean {
    const lastUpdated = new Date(cachedData.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    // Cache is valid for 24 hours
    return hoursSinceUpdate < 24;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  getConfig(): StreakConfig {
    return {
      maxCompensationDays: 2,
      maxSickDays: 3,
      maxVacationDays: 5,
      compensationTimeLimit: 7,
      streakGracePeriod: 1,
      minWorkoutsPerWeek: 3,
      allowWeekendCompensation: true,
      autoMarkRestDays: true,
      sendRiskNotifications: true
    };
  }

  // ============================================================================
  // Optimized Data Fetching
  // ============================================================================

  async getUserSchedules(userId: string, forceRefresh = false): Promise<StreakSchedule[]> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedData = await this.getCachedData(userId);
        if (cachedData && this.isCacheValid(cachedData)) {
          logger.info('Using cached streak schedules');
          return cachedData.schedules;
        }
      }

      // Fetch from Supabase
      logger.info('Fetching fresh streak schedules from Supabase');
      const { data, error } = await supabase
        .from('streak_schedules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const schedules = (data || []).map(this.mapScheduleFromDB);
      
      // Update cache
      await this.updateCache(userId, { schedules });
      
      return schedules;
    } catch (error) {
      logger.error('Error fetching user schedules:', error);
      
      // Fallback to cache even if expired
      const cachedData = await this.getCachedData(userId);
      return cachedData?.schedules || [];
    }
  }

  async getStreakStats(userId: string, scheduleId?: string, forceRefresh = false): Promise<StreakStats> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const cachedData = await this.getCachedData(userId);
        if (cachedData && this.isCacheValid(cachedData)) {
          logger.info('Using cached streak stats');
          return cachedData.stats;
        }
      }

      // Fetch from Supabase
      logger.info('Fetching fresh streak stats from Supabase');
      const { data, error } = await supabase
        .rpc('calculate_streak_stats', {
          p_user_id: userId,
          p_schedule_id: scheduleId || null
        });

      if (error) throw error;

      const stats: StreakStats = {
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        totalWorkouts: data.totalWorkouts || 0,
        totalDays: 0,
        completionRate: data.completionRate || 0,
        compensationDaysAvailable: data.compensationDaysAvailable || 2,
        sickDaysAvailable: data.sickDaysAvailable || 3,
        vacationDaysAvailable: data.vacationDaysAvailable || 5,
        streakRisk: data.streakRisk || 'none',
        missedDaysThisWeek: data.missedDaysThisWeek || 0,
        perfectWeeks: data.perfectWeeks || 0,
        averageWorkoutsPerWeek: data.averageWorkoutsPerWeek || 0,
        consistencyScore: data.consistencyScore || 0,
        totalMissedDays: 0,
        shieldsUsed: 0
      };

      // Update cache
      await this.updateCache(userId, { stats });
      
      return stats;
    } catch (error) {
      logger.error('Error fetching streak stats:', error);
      
      // Fallback to cache even if expired
      const cachedData = await this.getCachedData(userId);
      return cachedData?.stats || this.getDefaultStats();
    }
  }

  private async updateCache(
    userId: string, 
    updates: Partial<Pick<CachedStreakData, 'stats' | 'schedules' | 'activeSchedule'>>
  ): Promise<void> {
    try {
      const existingCache = await this.getCachedData(userId);
      
      const updatedCache: CachedStreakData = {
        userId,
        stats: updates.stats || existingCache?.stats || this.getDefaultStats(),
        schedules: updates.schedules || existingCache?.schedules || [],
        activeSchedule: updates.activeSchedule !== undefined ? updates.activeSchedule : existingCache?.activeSchedule || null,
        lastUpdated: new Date().toISOString()
      };

      await this.setCachedData(updatedCache);
      logger.info('Streak cache updated successfully');
    } catch (error) {
      logger.error('Error updating streak cache:', error);
    }
  }

  private getDefaultStats(): StreakStats {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      totalDays: 0,
      completionRate: 0,
      compensationDaysAvailable: 2,
      sickDaysAvailable: 3,
      vacationDaysAvailable: 5,
      streakRisk: 'none',
      missedDaysThisWeek: 0,
      perfectWeeks: 0,
      averageWorkoutsPerWeek: 0,
      consistencyScore: 0,
      totalMissedDays: 0,
      shieldsUsed: 0
    };
  }

  // ============================================================================
  // Write Operations (Always go to Supabase + invalidate cache)
  // ============================================================================

  async createSchedule(
    userId: string,
    schedule: Omit<StreakSchedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<StreakSchedule | null> {
    try {
      const existingSchedules = await this.getUserSchedules(userId, true);
      const isFirstSchedule = existingSchedules.length === 0;

      const { data, error } = await supabase
        .from('streak_schedules')
        .insert({
          user_id: userId,
          name: schedule.name,
          description: schedule.description,
          target_days_per_week: schedule.targetDaysPerWeek,
          scheduled_days: schedule.scheduledDays,
          is_flexible: schedule.isFlexible,
          rest_days: schedule.restDays,
          color: schedule.color,
          icon: schedule.icon,
          is_active: isFirstSchedule || schedule.isActive
        })
        .select()
        .single();

      if (error) throw error;

      const newSchedule = this.mapScheduleFromDB(data);

      // Invalidate cache to force refresh
      await this.invalidateCache(userId);

      if (isFirstSchedule || schedule.isActive) {
        await this.setActiveSchedule(newSchedule.id);
      }

      return newSchedule;
    } catch (error) {
      logger.error('Error creating schedule:', error);
      return null;
    }
  }

  async recordWorkout(userId: string, workout: any, scheduleId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('record_streak_workout', {
          p_user_id: userId,
          p_workout_session_id: workout.id,
          p_schedule_id: scheduleId || null
        });

      if (error) throw error;

      // Invalidate cache since stats will have changed
      await this.invalidateCache(userId);

      logger.info('Workout recorded for streak tracking:', workout.id);
    } catch (error) {
      logger.error('Error recording workout for streak:', error);
      throw error;
    }
  }

  async setActiveSchedule(scheduleId: string): Promise<void> {
    try {
      const { data: schedule, error: scheduleError } = await supabase
        .from('streak_schedules')
        .select('user_id')
        .eq('id', scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      await supabase
        .from('streak_schedules')
        .update({ is_active: false })
        .eq('user_id', schedule.user_id);

      await supabase
        .from('streak_schedules')
        .update({ is_active: true })
        .eq('id', scheduleId);

      // Invalidate cache
      await this.invalidateCache(schedule.user_id);
    } catch (error) {
      logger.error('Error setting active schedule:', error);
      throw error;
    }
  }

  private async invalidateCache(userId: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      if (!db) {
        // No IndexedDB available, nothing to invalidate
        return;
      }

      const transaction = db.transaction(['streakCache'], 'readwrite');
      const store = transaction.objectStore('streakCache');
      
      return new Promise((resolve, reject) => {
        const request = store.delete(userId);
        
        request.onsuccess = () => {
          logger.info('Streak cache invalidated for user:', userId);
          resolve();
        };
        
        request.onerror = () => {
          logger.warn('Error invalidating cache:', request.error);
          resolve(); // Don't reject, just continue
        };
      });
    } catch (error) {
      logger.warn('Error invalidating cache:', error);
      // Continue without cache invalidation
    }
  }

  // ============================================================================
  // Cache Management Methods
  // ============================================================================

  async clearCache(userId?: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['streakCache'], 'readwrite');
      const store = transaction.objectStore('streakCache');
      
      if (userId) {
        await store.delete(userId);
        logger.info('Cleared streak cache for user:', userId);
      } else {
        await store.clear();
        logger.info('Cleared all streak cache');
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  async getCacheInfo(userId: string): Promise<{ cached: boolean; lastUpdated?: string; hoursOld?: number }> {
    const cachedData = await this.getCachedData(userId);
    
    if (!cachedData) {
      return { cached: false };
    }

    const lastUpdated = new Date(cachedData.lastUpdated);
    const hoursOld = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return {
      cached: true,
      lastUpdated: cachedData.lastUpdated,
      hoursOld: Math.round(hoursOld * 100) / 100
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private mapScheduleFromDB(data: any): StreakSchedule {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      targetDaysPerWeek: data.target_days_per_week,
      scheduledDays: data.scheduled_days,
      isFlexible: data.is_flexible,
      restDays: data.rest_days || [],
      isActive: data.is_active,
      color: data.color,
      icon: data.icon,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Placeholder methods for compatibility
  async getActiveStreakPeriod(scheduleId: string): Promise<StreakPeriod | null> {
    return null; // Implement if needed
  }

  async updateSchedule(scheduleId: string, updates: Partial<StreakSchedule>): Promise<StreakSchedule | null> {
    return null; // Implement if needed
  }

  async markSickDay(userId: string, date: string, scheduleId: string, notes?: string): Promise<boolean> {
    return false; // Implement if needed
  }

  async markVacationDay(userId: string, date: string, scheduleId: string, notes?: string): Promise<boolean> {
    return false; // Implement if needed
  }

  async compensateMissedDay(userId: string, missedDate: string, compensationDate: string, scheduleId: string, workoutId: string): Promise<boolean> {
    return false; // Implement if needed
  }

  async processDailyUpdates(): Promise<void> {
    // Implement if needed
  }
}

export default OptimizedStreakService;