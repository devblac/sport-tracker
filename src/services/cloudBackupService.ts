import { supabase } from '@/lib/supabase';
import { storage, logger } from '@/utils';
import { supabaseAuthService } from './supabaseAuthService';
import { syncService } from './SyncService';
import type { User } from '@/schemas/user';
import type { Workout } from '@/types/workoutModels';

interface BackupData {
  workouts: Workout[];
  achievements: any[];
  userStats: any;
  settings: any;
  lastBackup: string;
}

interface BackupStatus {
  isBackupEnabled: boolean;
  lastBackupTime: Date | null;
  nextBackupTime: Date | null;
  backupSize: number;
  isRestoring: boolean;
  autoBackupEnabled: boolean;
}

class CloudBackupService {
  private readonly BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly LOCAL_BACKUP_KEY = 'sport-tracker-local-backup';
  private readonly BACKUP_STATUS_KEY = 'sport-tracker-backup-status';
  
  private backupInterval: NodeJS.Timeout | null = null;
  private isRestoring = false;

  constructor() {
    // Start auto backup for premium users
    this.initializeAutoBackup();
  }

  /**
   * Check if user is eligible for cloud backup
   */
  isBackupEligible(): boolean {
    const user = supabaseAuthService.getCurrentUser();
    return user !== null && 
           user.role !== 'guest' && 
           (user.role === 'premium' || user.role === 'trainer' || user.role === 'admin');
  }

  /**
   * Perform full backup to cloud
   */
  async performBackup(): Promise<boolean> {
    if (!this.isBackupEligible()) {
      throw new Error('Cloud backup is only available for premium users');
    }

    const user = supabaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      logger.info('Starting cloud backup', { userId: user.id });

      // Collect all local data
      const backupData = await this.collectLocalData();
      
      // Upload to Supabase
      const success = await this.uploadBackupData(user.id, backupData);
      
      if (success) {
        // Update backup status
        this.updateBackupStatus({
          lastBackupTime: new Date(),
          backupSize: JSON.stringify(backupData).length,
        });
        
        logger.info('Cloud backup completed successfully', { 
          userId: user.id,
          dataSize: JSON.stringify(backupData).length 
        });
      }
      
      return success;
    } catch (error) {
      logger.error('Cloud backup failed', error);
      throw error;
    }
  }

  /**
   * Restore data from cloud backup
   */
  async restoreFromCloud(): Promise<boolean> {
    if (!this.isBackupEligible()) {
      throw new Error('Cloud restore is only available for premium users');
    }

    const user = supabaseAuthService.getCurrentUser();
    if (!user) {
      throw new Error('No authenticated user found');
    }

    if (this.isRestoring) {
      throw new Error('Restore already in progress');
    }

    this.isRestoring = true;

    try {
      logger.info('Starting cloud restore', { userId: user.id });

      // Download backup data from Supabase
      const backupData = await this.downloadBackupData(user.id);
      
      if (!backupData) {
        throw new Error('No backup data found in cloud');
      }

      // Restore local data
      await this.restoreLocalData(backupData);
      
      // Update status
      this.updateBackupStatus({
        isRestoring: false,
      });
      
      logger.info('Cloud restore completed successfully', { userId: user.id });
      
      this.isRestoring = false;
      return true;
    } catch (error) {
      this.isRestoring = false;
      logger.error('Cloud restore failed', error);
      throw error;
    }
  }

  /**
   * Get backup status
   */
  getBackupStatus(): BackupStatus {
    const stored = storage.get<Partial<BackupStatus>>(this.BACKUP_STATUS_KEY) || {};
    const user = supabaseAuthService.getCurrentUser();
    
    return {
      isBackupEnabled: this.isBackupEligible(),
      lastBackupTime: stored.lastBackupTime ? new Date(stored.lastBackupTime) : null,
      nextBackupTime: stored.lastBackupTime ? 
        new Date(new Date(stored.lastBackupTime).getTime() + this.BACKUP_INTERVAL) : null,
      backupSize: stored.backupSize || 0,
      isRestoring: this.isRestoring,
      autoBackupEnabled: stored.autoBackupEnabled !== false, // Default to true
    };
  }

  /**
   * Enable/disable auto backup
   */
  setAutoBackup(enabled: boolean): void {
    this.updateBackupStatus({ autoBackupEnabled: enabled });
    
    if (enabled && this.isBackupEligible()) {
      this.startAutoBackup();
    } else {
      this.stopAutoBackup();
    }
  }

  /**
   * Sync specific data type to cloud immediately
   */
  async syncToCloud(dataType: 'workouts' | 'achievements' | 'profile', data: any): Promise<boolean> {
    if (!this.isBackupEligible()) {
      return false;
    }

    const user = supabaseAuthService.getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      switch (dataType) {
        case 'workouts':
          return await this.syncWorkouts(user.id, data);
        case 'achievements':
          return await this.syncAchievements(user.id, data);
        case 'profile':
          return await this.syncProfile(user.id, data);
        default:
          return false;
      }
    } catch (error) {
      logger.error('Cloud sync failed', { dataType, error });
      return false;
    }
  }

  /**
   * Check for cloud updates and sync down
   */
  async pullCloudUpdates(): Promise<boolean> {
    if (!this.isBackupEligible()) {
      return false;
    }

    const user = supabaseAuthService.getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      // Get last sync timestamp
      const lastSync = this.getLastSyncTime();
      
      // Pull updates from each table
      const updates = await Promise.all([
        this.pullWorkoutUpdates(user.id, lastSync),
        this.pullAchievementUpdates(user.id, lastSync),
        this.pullProfileUpdates(user.id, lastSync),
      ]);

      const hasUpdates = updates.some(update => update);
      
      if (hasUpdates) {
        this.updateLastSyncTime();
        logger.info('Cloud updates pulled successfully', { userId: user.id });
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to pull cloud updates', error);
      return false;
    }
  }

  /**
   * Private methods
   */
  private async collectLocalData(): Promise<BackupData> {
    // Collect all local data that needs to be backed up
    const workouts = storage.get<Workout[]>('sport-tracker-workouts') || [];
    const achievements = storage.get<any[]>('sport-tracker-achievements') || [];
    const userStats = storage.get<any>('sport-tracker-user-stats') || {};
    const settings = storage.get<any>('sport-tracker-settings') || {};

    return {
      workouts,
      achievements,
      userStats,
      settings,
      lastBackup: new Date().toISOString(),
    };
  }

  private async uploadBackupData(userId: string, data: BackupData): Promise<boolean> {
    try {
      // Store backup data in a dedicated backup table or use storage
      const { error } = await supabase
        .from('user_backups')
        .upsert({
          user_id: userId,
          backup_data: data,
          created_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      return !error;
    } catch (error) {
      logger.error('Failed to upload backup data', error);
      return false;
    }
  }

  private async downloadBackupData(userId: string): Promise<BackupData | null> {
    try {
      const { data, error } = await supabase
        .from('user_backups')
        .select('backup_data')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return data.backup_data as BackupData;
    } catch (error) {
      logger.error('Failed to download backup data', error);
      return null;
    }
  }

  private async restoreLocalData(backupData: BackupData): Promise<void> {
    // Restore each data type to local storage
    if (backupData.workouts) {
      storage.set('sport-tracker-workouts', backupData.workouts);
    }
    
    if (backupData.achievements) {
      storage.set('sport-tracker-achievements', backupData.achievements);
    }
    
    if (backupData.userStats) {
      storage.set('sport-tracker-user-stats', backupData.userStats);
    }
    
    if (backupData.settings) {
      storage.set('sport-tracker-settings', backupData.settings);
    }
  }

  private async syncWorkouts(userId: string, workouts: Workout[]): Promise<boolean> {
    try {
      // Sync workouts to cloud
      for (const workout of workouts) {
        syncService.getInstance().queueOperation('CREATE', 'workout', workout).catch(error => {
          logger.warn('Workout sync queue failed', error);
        });
      }
      return true;
    } catch (error) {
      logger.error('Failed to sync workouts', error);
      return false;
    }
  }

  private async syncAchievements(userId: string, achievements: any[]): Promise<boolean> {
    try {
      // Sync achievements to cloud
      for (const achievement of achievements) {
        syncService.getInstance().queueOperation('CREATE', 'achievement', achievement).catch(error => {
          logger.warn('Achievement sync queue failed', error);
        });
      }
      return true;
    } catch (error) {
      logger.error('Failed to sync achievements', error);
      return false;
    }
  }

  private async syncProfile(userId: string, profile: any): Promise<boolean> {
    try {
      syncService.getInstance().queueOperation('UPDATE', 'profile', profile).catch(error => {
        logger.warn('Profile sync queue failed', error);
      });
      return true;
    } catch (error) {
      logger.error('Failed to sync profile', error);
      return false;
    }
  }

  private async pullWorkoutUpdates(userId: string, since: Date | null): Promise<boolean> {
    try {
      const query = supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId);

      if (since) {
        query.gt('updated_at', since.toISOString());
      }

      const { data, error } = await query;

      if (error || !data) {
        return false;
      }

      // Update local storage with cloud data
      if (data.length > 0) {
        const localWorkouts = storage.get<Workout[]>('sport-tracker-workouts') || [];
        // Merge logic here - prioritize cloud data for conflicts
        // This is a simplified version
        storage.set('sport-tracker-workouts', [...localWorkouts, ...data]);
      }

      return true;
    } catch (error) {
      logger.error('Failed to pull workout updates', error);
      return false;
    }
  }

  private async pullAchievementUpdates(userId: string, since: Date | null): Promise<boolean> {
    try {
      const query = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (since) {
        query.gt('created_at', since.toISOString());
      }

      const { data, error } = await query;

      if (error || !data) {
        return false;
      }

      if (data.length > 0) {
        const localAchievements = storage.get<any[]>('sport-tracker-achievements') || [];
        storage.set('sport-tracker-achievements', [...localAchievements, ...data]);
      }

      return true;
    } catch (error) {
      logger.error('Failed to pull achievement updates', error);
      return false;
    }
  }

  private async pullProfileUpdates(userId: string, since: Date | null): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      // Update local user profile if cloud version is newer
      const user = supabaseAuthService.getCurrentUser();
      if (user && since && new Date(data.updated_at) > since) {
        // Update local profile with cloud data
        await supabaseAuthService.updateUserProfile({
          display_name: data.display_name,
          bio: data.bio,
          fitness_level: data.fitness_level,
          height: data.height_cm,
          weight: data.weight_kg,
        });
      }

      return true;
    } catch (error) {
      logger.error('Failed to pull profile updates', error);
      return false;
    }
  }

  private initializeAutoBackup(): void {
    const status = this.getBackupStatus();
    
    if (status.isBackupEnabled && status.autoBackupEnabled) {
      this.startAutoBackup();
    }
  }

  private startAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(async () => {
      if (this.isBackupEligible()) {
        try {
          await this.performBackup();
        } catch (error) {
          logger.error('Auto backup failed', error);
        }
      }
    }, this.BACKUP_INTERVAL);
  }

  private stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  private updateBackupStatus(updates: Partial<BackupStatus>): void {
    const current = storage.get<Partial<BackupStatus>>(this.BACKUP_STATUS_KEY) || {};
    const updated = { ...current, ...updates };
    storage.set(this.BACKUP_STATUS_KEY, updated);
  }

  private getLastSyncTime(): Date | null {
    const timestamp = storage.get<string>('sport-tracker-last-cloud-sync');
    return timestamp ? new Date(timestamp) : null;
  }

  private updateLastSyncTime(): void {
    storage.set('sport-tracker-last-cloud-sync', new Date().toISOString());
  }
}

// Export singleton instance
export const cloudBackupService = new CloudBackupService();