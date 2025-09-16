import { supabase } from '@/lib/supabase';
import { storage, logger } from '@/utils';
import { supabaseAuthService } from './supabaseAuthService';
import type { User } from '@/schemas/user';

interface SyncQueueItem {
  id: string;
  type: 'workout' | 'achievement' | 'profile' | 'social_post' | 'friendship';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  userId: string;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingItems: number;
  failedItems: number;
}

class SyncService {
  private readonly SYNC_QUEUE_KEY = 'sport-tracker-sync-queue';
  private readonly LAST_SYNC_KEY = 'sport-tracker-last-sync';
  private readonly MAX_RETRIES = 3;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly BATCH_SIZE = 10;
  
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = navigator.onLine;
  
  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Start periodic sync if online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  /**
   * Add item to sync queue
   */
  queueForSync(
    type: SyncQueueItem['type'],
    action: SyncQueueItem['action'],
    data: any,
    userId?: string
  ): void {
    const user = supabaseAuthService.getCurrentUser();
    
    // Only queue for registered users (not guests)
    if (!user || user.role === 'guest') {
      return;
    }
    
    const item: SyncQueueItem = {
      id: `${type}_${action}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      userId: userId || user.id,
    };
    
    const queue = this.getSyncQueue();
    queue.push(item);
    this.saveSyncQueue(queue);
    
    logger.info('Item queued for sync', { type, action, itemId: item.id });
    
    // Try immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      this.syncNow();
    }
  }

  /**
   * Perform immediate sync
   */
  async syncNow(): Promise<boolean> {
    if (this.isSyncing || !this.isOnline) {
      return false;
    }
    
    const user = supabaseAuthService.getCurrentUser();
    if (!user || user.role === 'guest') {
      return false;
    }
    
    this.isSyncing = true;
    
    try {
      const queue = this.getSyncQueue();
      const userQueue = queue.filter(item => item.userId === user.id);
      
      if (userQueue.length === 0) {
        this.isSyncing = false;
        return true;
      }
      
      logger.info('Starting sync', { itemCount: userQueue.length });
      
      // Process items in batches
      const batches = this.chunkArray(userQueue, this.BATCH_SIZE);
      let successCount = 0;
      let failureCount = 0;
      
      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map(item => this.syncItem(item))
        );
        
        results.forEach((result, index) => {
          const item = batch[index];
          if (result.status === 'fulfilled' && result.value) {
            successCount++;
            this.removeFromQueue(item.id);
          } else {
            failureCount++;
            this.handleSyncFailure(item);
          }
        });
      }
      
      // Update last sync time
      storage.set(this.LAST_SYNC_KEY, new Date().toISOString());
      
      logger.info('Sync completed', { successCount, failureCount });
      
      this.isSyncing = false;
      return failureCount === 0;
    } catch (error) {
      logger.error('Sync failed', error);
      this.isSyncing = false;
      return false;
    }
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const queue = this.getSyncQueue();
    const user = supabaseAuthService.getCurrentUser();
    const userQueue = user ? queue.filter(item => item.userId === user.id) : [];
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.getLastSyncTime(),
      pendingItems: userQueue.length,
      failedItems: userQueue.filter(item => item.retryCount >= this.MAX_RETRIES).length,
    };
  }

  /**
   * Clear failed items from queue
   */
  clearFailedItems(): void {
    const queue = this.getSyncQueue();
    const user = supabaseAuthService.getCurrentUser();
    
    if (!user) return;
    
    const filteredQueue = queue.filter(
      item => item.userId !== user.id || item.retryCount < this.MAX_RETRIES
    );
    
    this.saveSyncQueue(filteredQueue);
    logger.info('Failed items cleared from sync queue');
  }

  /**
   * Force sync for premium users (cloud backup)
   */
  async forcePremiumSync(): Promise<boolean> {
    const user = supabaseAuthService.getCurrentUser();
    
    if (!user || (user.role !== 'premium' && user.role !== 'trainer' && user.role !== 'admin')) {
      throw new Error('Premium sync is only available for premium users');
    }
    
    if (!this.isOnline) {
      throw new Error('Premium sync requires internet connection');
    }
    
    try {
      // Sync all local data to cloud
      await this.syncAllUserData(user);
      
      // Pull latest data from cloud
      await this.pullCloudData(user);
      
      logger.info('Premium sync completed', { userId: user.id });
      return true;
    } catch (error) {
      logger.error('Premium sync failed', error);
      throw error;
    }
  }

  /**
   * Private methods
   */
  private async syncItem(item: SyncQueueItem): Promise<boolean> {
    try {
      switch (item.type) {
        case 'workout':
          return await this.syncWorkout(item);
        case 'achievement':
          return await this.syncAchievement(item);
        case 'profile':
          return await this.syncProfile(item);
        case 'social_post':
          return await this.syncSocialPost(item);
        case 'friendship':
          return await this.syncFriendship(item);
        default:
          logger.warn('Unknown sync item type', { type: item.type });
          return false;
      }
    } catch (error) {
      logger.error('Failed to sync item', { itemId: item.id, error });
      return false;
    }
  }

  private async syncWorkout(item: SyncQueueItem): Promise<boolean> {
    const { action, data } = item;
    
    try {
      switch (action) {
        case 'create':
          const { error: createError } = await supabase
            .from('workout_sessions')
            .insert({
              id: data.id,
              user_id: data.userId,
              name: data.name,
              exercises: data.exercises,
              started_at: data.startedAt,
              completed_at: data.completedAt,
              duration_seconds: data.duration,
              total_volume_kg: data.totalVolume,
              total_reps: data.totalReps,
              total_sets: data.totalSets,
              xp_earned: data.xpEarned || 0,
              status: data.isCompleted ? 'completed' : 'in_progress',
            });
          return !createError;
          
        case 'update':
          const { error: updateError } = await supabase
            .from('workout_sessions')
            .update({
              name: data.name,
              exercises: data.exercises,
              completed_at: data.completedAt,
              duration_seconds: data.duration,
              total_volume_kg: data.totalVolume,
              total_reps: data.totalReps,
              total_sets: data.totalSets,
              xp_earned: data.xpEarned || 0,
              status: data.isCompleted ? 'completed' : 'in_progress',
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.id)
            .eq('user_id', item.userId);
          return !updateError;
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from('workout_sessions')
            .delete()
            .eq('id', data.id)
            .eq('user_id', item.userId);
          return !deleteError;
          
        default:
          return false;
      }
    } catch (error) {
      logger.error('Workout sync failed', error);
      return false;
    }
  }

  private async syncAchievement(item: SyncQueueItem): Promise<boolean> {
    const { action, data } = item;
    
    try {
      if (action === 'create') {
        const { error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: item.userId,
            achievement_id: data.achievementId,
            progress: data.progress,
            is_completed: data.isCompleted,
            completed_at: data.completedAt,
            xp_earned: data.xpEarned || 0,
          });
        return !error;
      }
      return false;
    } catch (error) {
      logger.error('Achievement sync failed', error);
      return false;
    }
  }

  private async syncProfile(item: SyncQueueItem): Promise<boolean> {
    const { action, data } = item;
    
    try {
      if (action === 'update') {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            display_name: data.display_name,
            bio: data.bio,
            fitness_level: data.fitness_level,
            height_cm: data.height_cm,
            weight_kg: data.weight_kg,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.userId);
        return !error;
      }
      return false;
    } catch (error) {
      logger.error('Profile sync failed', error);
      return false;
    }
  }

  private async syncSocialPost(item: SyncQueueItem): Promise<boolean> {
    const { action, data } = item;
    
    try {
      if (action === 'create') {
        const { error } = await supabase
          .from('social_posts')
          .insert({
            id: data.id,
            user_id: item.userId,
            type: data.type,
            content: data.content,
            data: data.postData,
            visibility: data.visibility || 'friends',
          });
        return !error;
      }
      return false;
    } catch (error) {
      logger.error('Social post sync failed', error);
      return false;
    }
  }

  private async syncFriendship(item: SyncQueueItem): Promise<boolean> {
    const { action, data } = item;
    
    try {
      switch (action) {
        case 'create':
          const { error: createError } = await supabase
            .from('friendships')
            .insert({
              requester_id: data.requesterId,
              addressee_id: data.addresseeId,
              status: data.status || 'pending',
            });
          return !createError;
          
        case 'update':
          const { error: updateError } = await supabase
            .from('friendships')
            .update({
              status: data.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', data.id);
          return !updateError;
          
        default:
          return false;
      }
    } catch (error) {
      logger.error('Friendship sync failed', error);
      return false;
    }
  }

  private async syncAllUserData(user: User): Promise<void> {
    // This would sync all local data to cloud for premium users
    // Implementation depends on local data structure
    logger.info('Syncing all user data to cloud', { userId: user.id });
  }

  private async pullCloudData(user: User): Promise<void> {
    // This would pull latest data from cloud for premium users
    // Implementation depends on local data structure
    logger.info('Pulling cloud data for user', { userId: user.id });
  }

  private handleOnline(): void {
    this.isOnline = true;
    logger.info('Connection restored - starting sync');
    this.startPeriodicSync();
    this.syncNow();
  }

  private handleOffline(): void {
    this.isOnline = false;
    logger.info('Connection lost - stopping sync');
    this.stopPeriodicSync();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, this.SYNC_INTERVAL);
  }

  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private handleSyncFailure(item: SyncQueueItem): void {
    item.retryCount++;
    
    if (item.retryCount >= this.MAX_RETRIES) {
      logger.warn('Item exceeded max retries', { itemId: item.id, type: item.type });
    }
    
    // Update item in queue
    const queue = this.getSyncQueue();
    const index = queue.findIndex(q => q.id === item.id);
    if (index >= 0) {
      queue[index] = item;
      this.saveSyncQueue(queue);
    }
  }

  private getSyncQueue(): SyncQueueItem[] {
    return storage.get<SyncQueueItem[]>(this.SYNC_QUEUE_KEY) || [];
  }

  private saveSyncQueue(queue: SyncQueueItem[]): void {
    storage.set(this.SYNC_QUEUE_KEY, queue);
  }

  private removeFromQueue(itemId: string): void {
    const queue = this.getSyncQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    this.saveSyncQueue(filteredQueue);
  }

  private getLastSyncTime(): Date | null {
    const lastSync = storage.get<string>(this.LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
export const syncService = new SyncService();