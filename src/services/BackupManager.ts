/**
 * Enterprise-Grade Backup & Recovery Manager
 * Automatic backups, data recovery, and device migration
 * Built for data safety and seamless user experience
 */

import { dbManager } from '@/db/IndexedDBManager';
import { analyticsManager } from './AnalyticsManager';
import { logger } from '@/utils';

export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
export type BackupType = 'automatic' | 'manual' | 'migration' | 'recovery';
export type DataCategory = 'workouts' | 'exercises' | 'progress' | 'settings' | 'gamification' | 'social' | 'all';

export interface BackupMetadata {
  readonly id: string;
  readonly userId: string;
  readonly type: BackupType;
  readonly status: BackupStatus;
  readonly categories: DataCategory[];
  readonly size: number; // Size in bytes
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly deviceInfo: {
    readonly userAgent: string;
    readonly platform: string;
    readonly appVersion: string;
  };
  readonly checksum: string; // Data integrity verification
}

export interface BackupData {
  readonly metadata: BackupMetadata;
  readonly data: {
    readonly workouts?: any[];
    readonly exercises?: any[];
    readonly progress?: any[];
    readonly settings?: any;
    readonly gamification?: any;
    readonly social?: any[];
    readonly version: string;
  };
}

export interface RecoveryOptions {
  readonly categories: DataCategory[];
  readonly mergeStrategy: 'replace' | 'merge' | 'keep_newer';
  readonly validateIntegrity: boolean;
  readonly createBackupBeforeRestore: boolean;
}

export interface MigrationToken {
  readonly token: string;
  readonly userId: string;
  readonly backupId: string;
  readonly expiresAt: Date;
  readonly deviceFingerprint: string;
}

export interface BackupStats {
  readonly totalBackups: number;
  readonly totalSize: number;
  readonly lastBackup: Date | null;
  readonly nextScheduledBackup: Date | null;
  readonly successRate: number;
  readonly averageBackupTime: number;
}

/**
 * Comprehensive Backup & Recovery Manager
 */
export class BackupManager {
  private static instance: BackupManager;
  private isBackupInProgress = false;
  private backupScheduleInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly config = {
    maxBackupsPerUser: 10,
    backupRetentionDays: 30,
    automaticBackupInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxBackupSize: 50 * 1024 * 1024, // 50MB
    compressionEnabled: true,
    encryptionEnabled: true,
    migrationTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  };

  private constructor() {
    this.initializeBackupSchedule();
    logger.info('BackupManager initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  // ============================================================================
  // Backup Operations
  // ============================================================================

  /**
   * Create a comprehensive backup
   */
  public async createBackup(
    userId: string,
    type: BackupType = 'manual',
    categories: DataCategory[] = ['all']
  ): Promise<string> {
    if (this.isBackupInProgress) {
      throw new Error('Backup already in progress');
    }

    this.isBackupInProgress = true;
    const startTime = Date.now();

    try {
      logger.info('Starting backup creation', { userId, type, categories });

      // Generate backup ID
      const backupId = this.generateBackupId();

      // Collect data based on categories
      const data = await this.collectBackupData(userId, categories);

      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(data);

      // Compress data if enabled
      const processedData = this.config.compressionEnabled 
        ? await this.compressData(data)
        : data;

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        userId,
        type,
        status: 'completed',
        categories,
        size: JSON.stringify(processedData).length,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (this.config.backupRetentionDays * 24 * 60 * 60 * 1000)),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          appVersion: '1.0.0' // Should come from app config
        },
        checksum
      };

      // Validate backup size
      if (metadata.size > this.config.maxBackupSize) {
        throw new Error(`Backup size (${metadata.size}) exceeds maximum allowed (${this.config.maxBackupSize})`);
      }

      // Store backup
      const backup: BackupData = { metadata, data: processedData };
      await this.storeBackup(backup);

      // Clean up old backups
      await this.cleanupOldBackups(userId);

      // Track analytics
      analyticsManager.track('backup_created', {
        backup_id: backupId,
        backup_type: type,
        backup_size: metadata.size,
        categories: categories.join(','),
        duration: Date.now() - startTime
      });

      logger.info('Backup created successfully', { 
        backupId, 
        size: metadata.size, 
        duration: Date.now() - startTime 
      });

      return backupId;

    } catch (error) {
      logger.error('Backup creation failed', error);
      
      analyticsManager.trackError(error as Error, {
        operation: 'backup_creation',
        userId,
        type,
        categories
      });

      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Get all backups for a user
   */
  public async getUserBackups(userId: string): Promise<BackupMetadata[]> {
    try {
      await dbManager.init();
      const backups = await dbManager.getAll<BackupData>('backups');
      
      return backups
        .filter(backup => backup.metadata.userId === userId)
        .map(backup => backup.metadata)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    } catch (error) {
      logger.error('Error getting user backups', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  public async deleteBackup(backupId: string, userId: string): Promise<boolean> {
    try {
      await dbManager.init();
      const backup = await dbManager.get<BackupData>('backups', backupId);
      
      if (!backup || backup.metadata.userId !== userId) {
        return false;
      }

      await dbManager.delete('backups', backupId);
      
      analyticsManager.track('backup_deleted', {
        backup_id: backupId,
        backup_size: backup.metadata.size
      });

      logger.info('Backup deleted', { backupId });
      return true;

    } catch (error) {
      logger.error('Error deleting backup', error);
      return false;
    }
  }

  // ============================================================================
  // Recovery Operations
  // ============================================================================

  /**
   * Restore data from backup
   */
  public async restoreFromBackup(
    backupId: string,
    userId: string,
    options: RecoveryOptions
  ): Promise<boolean> {
    try {
      logger.info('Starting data restoration', { backupId, userId, options });

      // Get backup data
      await dbManager.init();
      const backup = await dbManager.get<BackupData>('backups', backupId);
      
      if (!backup || backup.metadata.userId !== userId) {
        throw new Error('Backup not found or access denied');
      }

      // Verify backup integrity
      if (options.validateIntegrity) {
        const isValid = await this.verifyBackupIntegrity(backup);
        if (!isValid) {
          throw new Error('Backup integrity check failed');
        }
      }

      // Create backup before restore if requested
      if (options.createBackupBeforeRestore) {
        await this.createBackup(userId, 'recovery', options.categories);
      }

      // Decompress data if needed
      const data = this.config.compressionEnabled 
        ? await this.decompressData(backup.data)
        : backup.data;

      // Restore data by category
      for (const category of options.categories) {
        if (category === 'all') {
          await this.restoreAllData(data, options.mergeStrategy);
        } else {
          await this.restoreCategoryData(category, data, options.mergeStrategy);
        }
      }

      // Track analytics
      analyticsManager.track('data_restored', {
        backup_id: backupId,
        categories: options.categories.join(','),
        merge_strategy: options.mergeStrategy
      });

      logger.info('Data restoration completed', { backupId });
      return true;

    } catch (error) {
      logger.error('Data restoration failed', error);
      
      analyticsManager.trackError(error as Error, {
        operation: 'data_restoration',
        backupId,
        userId
      });

      throw error;
    }
  }

  /**
   * Recover lost data using automatic backups
   */
  public async recoverLostData(
    userId: string,
    categories: DataCategory[] = ['all']
  ): Promise<string | null> {
    try {
      // Find the most recent automatic backup
      const backups = await this.getUserBackups(userId);
      const automaticBackup = backups.find(b => 
        b.type === 'automatic' && 
        b.status === 'completed' &&
        categories.some(cat => b.categories.includes(cat) || b.categories.includes('all'))
      );

      if (!automaticBackup) {
        logger.warn('No automatic backup found for recovery', { userId, categories });
        return null;
      }

      // Restore from the most recent backup
      await this.restoreFromBackup(automaticBackup.id, userId, {
        categories,
        mergeStrategy: 'merge',
        validateIntegrity: true,
        createBackupBeforeRestore: true
      });

      logger.info('Lost data recovered successfully', { 
        backupId: automaticBackup.id,
        categories 
      });

      return automaticBackup.id;

    } catch (error) {
      logger.error('Lost data recovery failed', error);
      throw error;
    }
  }

  // ============================================================================
  // Device Migration
  // ============================================================================

  /**
   * Generate migration token for device transfer
   */
  public async generateMigrationToken(userId: string): Promise<string> {
    try {
      // Create a comprehensive backup for migration
      const backupId = await this.createBackup(userId, 'migration', ['all']);

      // Generate secure token
      const token = this.generateSecureToken();
      const deviceFingerprint = this.generateDeviceFingerprint();

      const migrationToken: MigrationToken = {
        token,
        userId,
        backupId,
        expiresAt: new Date(Date.now() + this.config.migrationTokenExpiry),
        deviceFingerprint
      };

      // Store migration token
      await dbManager.init();
      await dbManager.set('migration_tokens', token, migrationToken);

      analyticsManager.track('migration_token_generated', {
        user_id: userId,
        backup_id: backupId
      });

      logger.info('Migration token generated', { token: token.substring(0, 8) + '...' });
      return token;

    } catch (error) {
      logger.error('Migration token generation failed', error);
      throw error;
    }
  }

  /**
   * Migrate data to new device using token
   */
  public async migrateFromToken(
    token: string,
    newUserId: string
  ): Promise<boolean> {
    try {
      logger.info('Starting device migration', { token: token.substring(0, 8) + '...' });

      // Get migration token
      await dbManager.init();
      const migrationToken = await dbManager.get<MigrationToken>('migration_tokens', token);

      if (!migrationToken) {
        throw new Error('Invalid migration token');
      }

      // Check token expiry
      if (new Date() > migrationToken.expiresAt) {
        throw new Error('Migration token has expired');
      }

      // Restore data from migration backup
      await this.restoreFromBackup(migrationToken.backupId, newUserId, {
        categories: ['all'],
        mergeStrategy: 'replace',
        validateIntegrity: true,
        createBackupBeforeRestore: false
      });

      // Invalidate migration token
      await dbManager.delete('migration_tokens', token);

      analyticsManager.track('device_migration_completed', {
        original_user_id: migrationToken.userId,
        new_user_id: newUserId,
        backup_id: migrationToken.backupId
      });

      logger.info('Device migration completed successfully');
      return true;

    } catch (error) {
      logger.error('Device migration failed', error);
      
      analyticsManager.trackError(error as Error, {
        operation: 'device_migration',
        token: token.substring(0, 8) + '...'
      });

      throw error;
    }
  }

  // ============================================================================
  // Automatic Backup Scheduling
  // ============================================================================

  /**
   * Initialize automatic backup scheduling
   */
  private initializeBackupSchedule(): void {
    // Schedule automatic backups
    this.backupScheduleInterval = setInterval(async () => {
      try {
        await this.performScheduledBackups();
      } catch (error) {
        logger.error('Scheduled backup failed', error);
      }
    }, this.config.automaticBackupInterval);

    // Backup on app close
    window.addEventListener('beforeunload', () => {
      this.performEmergencyBackup();
    });

    // Backup on visibility change (app backgrounded)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performEmergencyBackup();
      }
    });
  }

  /**
   * Perform scheduled automatic backups
   */
  private async performScheduledBackups(): Promise<void> {
    try {
      // Get all users (in a real app, this would come from auth service)
      const currentUserId = 'current_user'; // Placeholder
      
      // Check if backup is needed
      const lastBackup = await this.getLastBackupTime(currentUserId);
      const timeSinceLastBackup = Date.now() - (lastBackup?.getTime() || 0);

      if (timeSinceLastBackup >= this.config.automaticBackupInterval) {
        await this.createBackup(currentUserId, 'automatic', ['all']);
        logger.info('Scheduled backup completed', { userId: currentUserId });
      }

    } catch (error) {
      logger.error('Scheduled backup failed', error);
    }
  }

  /**
   * Perform emergency backup (app closing)
   */
  private performEmergencyBackup(): void {
    // Use synchronous storage for emergency backup
    try {
      const currentUserId = 'current_user';
      const emergencyData = {
        timestamp: Date.now(),
        userId: currentUserId,
        type: 'emergency'
      };
      
      localStorage.setItem('emergency_backup_flag', JSON.stringify(emergencyData));
      logger.info('Emergency backup flag set');
    } catch (error) {
      logger.error('Emergency backup failed', error);
    }
  }

  // ============================================================================
  // Data Collection and Processing
  // ============================================================================

  /**
   * Collect backup data based on categories
   */
  private async collectBackupData(
    userId: string,
    categories: DataCategory[]
  ): Promise<any> {
    const data: any = { version: '1.0.0' };

    await dbManager.init();

    if (categories.includes('all') || categories.includes('workouts')) {
      data.workouts = await dbManager.getAll('workouts');
    }

    if (categories.includes('all') || categories.includes('exercises')) {
      data.exercises = await dbManager.getAll('exercises');
    }

    if (categories.includes('all') || categories.includes('progress')) {
      data.progress = await dbManager.getAll('progress');
    }

    if (categories.includes('all') || categories.includes('settings')) {
      data.settings = {
        preferences: localStorage.getItem('user_preferences'),
        theme: localStorage.getItem('theme'),
        language: localStorage.getItem('language')
      };
    }

    if (categories.includes('all') || categories.includes('gamification')) {
      data.gamification = await dbManager.getAll('achievements');
    }

    if (categories.includes('all') || categories.includes('social')) {
      data.social = await dbManager.getAll('social_posts');
    }

    return data;
  }

  /**
   * Store backup data
   */
  private async storeBackup(backup: BackupData): Promise<void> {
    await dbManager.init();
    await dbManager.set('backups', backup.metadata.id, backup);
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(userId: string): Promise<void> {
    try {
      const backups = await this.getUserBackups(userId);
      
      // Remove expired backups
      const expiredBackups = backups.filter(b => new Date() > b.expiresAt);
      for (const backup of expiredBackups) {
        await this.deleteBackup(backup.id, userId);
      }

      // Keep only the most recent backups within limit
      const validBackups = backups.filter(b => new Date() <= b.expiresAt);
      if (validBackups.length > this.config.maxBackupsPerUser) {
        const toDelete = validBackups
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, validBackups.length - this.config.maxBackupsPerUser);

        for (const backup of toDelete) {
          await this.deleteBackup(backup.id, userId);
        }
      }

    } catch (error) {
      logger.error('Backup cleanup failed', error);
    }
  }

  // ============================================================================
  // Data Restoration
  // ============================================================================

  /**
   * Restore all data categories
   */
  private async restoreAllData(data: any, mergeStrategy: RecoveryOptions['mergeStrategy']): Promise<void> {
    await dbManager.init();

    if (data.workouts) {
      await this.restoreTableData('workouts', data.workouts, mergeStrategy);
    }

    if (data.exercises) {
      await this.restoreTableData('exercises', data.exercises, mergeStrategy);
    }

    if (data.progress) {
      await this.restoreTableData('progress', data.progress, mergeStrategy);
    }

    if (data.settings) {
      this.restoreSettings(data.settings, mergeStrategy);
    }

    if (data.gamification) {
      await this.restoreTableData('achievements', data.gamification, mergeStrategy);
    }

    if (data.social) {
      await this.restoreTableData('social_posts', data.social, mergeStrategy);
    }
  }

  /**
   * Restore specific category data
   */
  private async restoreCategoryData(
    category: DataCategory,
    data: any,
    mergeStrategy: RecoveryOptions['mergeStrategy']
  ): Promise<void> {
    switch (category) {
      case 'workouts':
        if (data.workouts) {
          await this.restoreTableData('workouts', data.workouts, mergeStrategy);
        }
        break;
      case 'exercises':
        if (data.exercises) {
          await this.restoreTableData('exercises', data.exercises, mergeStrategy);
        }
        break;
      case 'progress':
        if (data.progress) {
          await this.restoreTableData('progress', data.progress, mergeStrategy);
        }
        break;
      case 'settings':
        if (data.settings) {
          this.restoreSettings(data.settings, mergeStrategy);
        }
        break;
      case 'gamification':
        if (data.gamification) {
          await this.restoreTableData('achievements', data.gamification, mergeStrategy);
        }
        break;
      case 'social':
        if (data.social) {
          await this.restoreTableData('social_posts', data.social, mergeStrategy);
        }
        break;
    }
  }

  /**
   * Restore table data with merge strategy
   */
  private async restoreTableData(
    tableName: string,
    backupData: any[],
    mergeStrategy: RecoveryOptions['mergeStrategy']
  ): Promise<void> {
    for (const item of backupData) {
      switch (mergeStrategy) {
        case 'replace':
          await dbManager.set(tableName, item.id, item);
          break;
          
        case 'merge':
          const existing = await dbManager.get(tableName, item.id);
          if (existing) {
            const merged = { ...existing, ...item };
            await dbManager.set(tableName, item.id, merged);
          } else {
            await dbManager.set(tableName, item.id, item);
          }
          break;
          
        case 'keep_newer':
          const current = await dbManager.get(tableName, item.id);
          if (!current || new Date(item.updatedAt) > new Date(current.updatedAt)) {
            await dbManager.set(tableName, item.id, item);
          }
          break;
      }
    }
  }

  /**
   * Restore settings data
   */
  private restoreSettings(
    settings: any,
    mergeStrategy: RecoveryOptions['mergeStrategy']
  ): void {
    if (mergeStrategy === 'replace') {
      if (settings.preferences) localStorage.setItem('user_preferences', settings.preferences);
      if (settings.theme) localStorage.setItem('theme', settings.theme);
      if (settings.language) localStorage.setItem('language', settings.language);
    } else {
      // For merge and keep_newer, only restore if not already set
      if (settings.preferences && !localStorage.getItem('user_preferences')) {
        localStorage.setItem('user_preferences', settings.preferences);
      }
      if (settings.theme && !localStorage.getItem('theme')) {
        localStorage.setItem('theme', settings.theme);
      }
      if (settings.language && !localStorage.getItem('language')) {
        localStorage.setItem('language', settings.language);
      }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Calculate data checksum for integrity verification
   */
  private async calculateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify backup integrity
   */
  private async verifyBackupIntegrity(backup: BackupData): Promise<boolean> {
    try {
      const calculatedChecksum = await this.calculateChecksum(backup.data);
      return calculatedChecksum === backup.metadata.checksum;
    } catch (error) {
      logger.error('Integrity verification failed', error);
      return false;
    }
  }

  /**
   * Compress backup data
   */
  private async compressData(data: any): Promise<any> {
    // Simple compression simulation (in production, use actual compression)
    return data;
  }

  /**
   * Decompress backup data
   */
  private async decompressData(data: any): Promise<any> {
    // Simple decompression simulation
    return data;
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate secure migration token
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString()
    ];
    return btoa(components.join('|'));
  }

  /**
   * Get last backup time for user
   */
  private async getLastBackupTime(userId: string): Promise<Date | null> {
    const backups = await this.getUserBackups(userId);
    return backups.length > 0 ? backups[0].createdAt : null;
  }

  /**
   * Get backup statistics
   */
  public async getBackupStats(userId: string): Promise<BackupStats> {
    try {
      const backups = await this.getUserBackups(userId);
      const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
      const lastBackup = backups.length > 0 ? backups[0].createdAt : null;
      
      // Calculate success rate (simplified)
      const successfulBackups = backups.filter(b => b.status === 'completed').length;
      const successRate = backups.length > 0 ? successfulBackups / backups.length : 0;

      return {
        totalBackups: backups.length,
        totalSize,
        lastBackup,
        nextScheduledBackup: lastBackup 
          ? new Date(lastBackup.getTime() + this.config.automaticBackupInterval)
          : new Date(Date.now() + this.config.automaticBackupInterval),
        successRate,
        averageBackupTime: 2000 // Placeholder - would track actual times
      };

    } catch (error) {
      logger.error('Error getting backup stats', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        nextScheduledBackup: null,
        successRate: 0,
        averageBackupTime: 0
      };
    }
  }

  /**
   * Cleanup on app shutdown
   */
  public cleanup(): void {
    if (this.backupScheduleInterval) {
      clearInterval(this.backupScheduleInterval);
    }
  }
}

// Export singleton instance
export const backupManager = BackupManager.getInstance();