/**
 * Backup Service
 * 
 * Comprehensive backup and recovery system for critical fitness app data.
 * Provides automated backups, manual backups, and disaster recovery capabilities.
 */

import { databaseService } from '@/db/DatabaseService';
import { logger } from '@/utils/logger';
import { useUIStore } from '@/stores/useUIStore';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface BackupConfig {
  enabled: boolean;
  automaticInterval: number; // in milliseconds
  maxBackups: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  includeTables: string[];
  excludeTables: string[];
}

export interface BackupMetadata {
  id: string;
  name: string;
  description?: string;
  timestamp: Date;
  type: 'manual' | 'automatic' | 'pre_sync' | 'pre_update';
  version: string;
  tables: string[];
  recordCount: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  checksum: string;
  userId?: string;
  tags: string[];
}

export interface BackupData {
  metadata: BackupMetadata;
  data: { [tableName: string]: any[] };
  schema?: { [tableName: string]: any };
}

export interface RestoreOptions {
  overwriteExisting: boolean;
  createPreRestoreBackup: boolean;
  validateIntegrity: boolean;
  selectiveTables?: string[];
  conflictResolution: 'skip' | 'overwrite' | 'merge';
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  automaticBackups: number;
  manualBackups: number;
  averageSize: number;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  restoredRecords: number;
  skippedRecords: number;
  errors: string[];
  duration: number;
  preRestoreBackupId?: string;
}

// ============================================================================
// Backup Service
// ============================================================================

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private automaticBackupInterval: NodeJS.Timeout | null = null;
  private isBackupInProgress = false;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeAutomaticBackups();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Get default backup configuration
   */
  private getDefaultConfig(): BackupConfig {
    return {
      enabled: true,
      automaticInterval: 3600000, // 1 hour
      maxBackups: 20,
      compressionEnabled: true,
      encryptionEnabled: false, // Would require additional setup
      includeTables: [
        'user_profiles',
        'workout_sessions',
        'workout_exercises',
        'workout_sets',
        'social_posts',
        'post_likes',
        'post_comments',
        'xp_transactions',
        'user_achievements',
        'streak_schedules',
        'streak_periods'
      ],
      excludeTables: [
        'sync_queue',
        'temp_data',
        'cache'
      ]
    };
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Update backup configuration
   */
  updateConfig(newConfig: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart automatic backups if interval changed
    if (newConfig.automaticInterval !== undefined) {
      this.stopAutomaticBackups();
      this.initializeAutomaticBackups();
    }
    
    logger.info('Backup configuration updated', { config: this.config });
  }

  /**
   * Get current backup configuration
   */
  getConfig(): BackupConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Backup Creation Methods
  // ============================================================================

  /**
   * Create a manual backup
   */
  async createManualBackup(
    name?: string, 
    description?: string, 
    tags: string[] = []
  ): Promise<BackupMetadata> {
    if (this.isBackupInProgress) {
      throw new Error('Another backup operation is already in progress');
    }

    this.isBackupInProgress = true;
    
    try {
      logger.info('Starting manual backup creation', { name, description });
      
      const backupId = `manual_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const timestamp = new Date();
      
      // Show progress to user
      useUIStore.getState().showToast({
        type: 'info',
        title: 'Creating Backup',
        message: 'Creating manual backup of your data...',
        duration: 0 // Don't auto-dismiss
      });

      const backup = await this.createBackup({
        id: backupId,
        name: name || `Manual Backup ${timestamp.toLocaleDateString()}`,
        description,
        timestamp,
        type: 'manual',
        tags: [...tags, 'manual']
      });

      // Dismiss progress toast and show success
      useUIStore.getState().showToast({
        type: 'success',
        title: 'Backup Created',
        message: `Manual backup "${backup.name}" created successfully`,
        duration: 5000
      });

      logger.info('Manual backup created successfully', { backupId: backup.id });
      return backup;
      
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Create an automatic backup
   */
  async createAutomaticBackup(): Promise<BackupMetadata | null> {
    if (!this.config.enabled || this.isBackupInProgress) {
      return null;
    }

    this.isBackupInProgress = true;
    
    try {
      const backupId = `auto_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const timestamp = new Date();
      
      logger.info('Starting automatic backup creation');

      const backup = await this.createBackup({
        id: backupId,
        name: `Auto Backup ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`,
        timestamp,
        type: 'automatic',
        tags: ['automatic']
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      logger.info('Automatic backup created successfully', { backupId: backup.id });
      return backup;
      
    } catch (error) {
      logger.error('Automatic backup failed', { error });
      return null;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Create a pre-sync backup
   */
  async createPreSyncBackup(): Promise<BackupMetadata> {
    const backupId = `presync_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date();
    
    logger.info('Creating pre-sync backup');

    return await this.createBackup({
      id: backupId,
      name: `Pre-Sync Backup ${timestamp.toLocaleDateString()}`,
      description: 'Automatic backup created before data synchronization',
      timestamp,
      type: 'pre_sync',
      tags: ['pre_sync', 'automatic']
    });
  }

  /**
   * Core backup creation method
   */
  private async createBackup(metadata: Partial<BackupMetadata>): Promise<BackupMetadata> {
    const startTime = Date.now();
    
    // Export data from all included tables
    const allData = await databaseService.instance.exportData();
    
    // Filter tables based on configuration
    const filteredData: { [tableName: string]: any[] } = {};
    let totalRecords = 0;
    
    for (const [tableName, records] of Object.entries(allData)) {
      if (this.shouldIncludeTable(tableName)) {
        filteredData[tableName] = records;
        totalRecords += records.length;
      }
    }

    // Calculate size and checksum
    const dataString = JSON.stringify(filteredData);
    let processedData = dataString;
    
    // Apply compression if enabled
    if (this.config.compressionEnabled) {
      processedData = await this.compressData(dataString);
    }
    
    const size = new Blob([processedData]).size;
    const checksum = await this.calculateChecksum(dataString);

    // Create complete metadata
    const completeMetadata: BackupMetadata = {
      id: metadata.id!,
      name: metadata.name!,
      description: metadata.description,
      timestamp: metadata.timestamp!,
      type: metadata.type!,
      version: '1.0.0',
      tables: Object.keys(filteredData),
      recordCount: totalRecords,
      size,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled,
      checksum,
      tags: metadata.tags || []
    };

    // Create backup object
    const backupData: BackupData = {
      metadata: completeMetadata,
      data: filteredData
    };

    // Store backup
    await this.storeBackup(backupData, processedData);
    
    const duration = Date.now() - startTime;
    logger.info('Backup created', { 
      backupId: completeMetadata.id, 
      recordCount: totalRecords, 
      size, 
      duration 
    });

    return completeMetadata;
  }

  // ============================================================================
  // Backup Storage Methods
  // ============================================================================

  /**
   * Store backup data
   */
  private async storeBackup(backup: BackupData, processedData: string): Promise<void> {
    const storageRecord = {
      id: backup.metadata.id,
      metadata: backup.metadata,
      data: processedData,
      created_at: backup.metadata.timestamp,
      updated_at: backup.metadata.timestamp
    };

    await databaseService.instance.getManager().put('backups', storageRecord);
  }

  /**
   * Load backup data
   */
  private async loadBackup(backupId: string): Promise<BackupData> {
    const stored = await databaseService.instance.getManager().get<any>('backups', backupId);
    
    if (!stored) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    let data = stored.data;
    
    // Decompress if needed
    if (stored.metadata.compressed) {
      data = await this.decompressData(data);
    }
    
    // Decrypt if needed
    if (stored.metadata.encrypted) {
      data = await this.decryptData(data);
    }

    return {
      metadata: stored.metadata,
      data: JSON.parse(data)
    };
  }

  // ============================================================================
  // Backup Management Methods
  // ============================================================================

  /**
   * List all available backups
   */
  async listBackups(type?: string, limit?: number): Promise<BackupMetadata[]> {
    try {
      const allBackups = await databaseService.instance.getManager().getAll<any>('backups');
      
      let backups = allBackups.map(backup => backup.metadata);
      
      // Filter by type if specified
      if (type) {
        backups = backups.filter(backup => backup.type === type);
      }
      
      // Sort by timestamp (newest first)
      backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Apply limit if specified
      if (limit) {
        backups = backups.slice(0, limit);
      }
      
      return backups;
    } catch (error) {
      logger.error('Failed to list backups', { error });
      return [];
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<BackupStats> {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null,
        automaticBackups: 0,
        manualBackups: 0,
        averageSize: 0
      };
    }

    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const automaticBackups = backups.filter(backup => backup.type === 'automatic').length;
    const manualBackups = backups.filter(backup => backup.type === 'manual').length;
    
    const timestamps = backups.map(backup => backup.timestamp.getTime());
    const oldestBackup = new Date(Math.min(...timestamps));
    const newestBackup = new Date(Math.max(...timestamps));

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup,
      newestBackup,
      automaticBackups,
      manualBackups,
      averageSize: Math.round(totalSize / backups.length)
    };
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await databaseService.instance.getManager().delete('backups', backupId);
      logger.info('Backup deleted', { backupId });
    } catch (error) {
      logger.error('Failed to delete backup', { backupId, error });
      throw error;
    }
  }

  /**
   * Clean up old backups based on configuration
   */
  async cleanupOldBackups(): Promise<number> {
    const backups = await this.listBackups();
    
    if (backups.length <= this.config.maxBackups) {
      return 0;
    }

    const toDelete = backups.slice(this.config.maxBackups);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await this.deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        logger.error('Failed to delete old backup during cleanup', { backupId: backup.id, error });
      }
    }

    if (deletedCount > 0) {
      logger.info('Old backups cleaned up', { deletedCount });
    }

    return deletedCount;
  }

  // ============================================================================
  // Restore Methods
  // ============================================================================

  /**
   * Restore data from a backup
   */
  async restoreBackup(
    backupId: string, 
    options: RestoreOptions = {
      overwriteExisting: true,
      createPreRestoreBackup: true,
      validateIntegrity: true,
      conflictResolution: 'overwrite'
    }
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    let preRestoreBackupId: string | undefined;
    
    try {
      logger.info('Starting backup restore', { backupId, options });
      
      // Show progress to user
      useUIStore.getState().showToast({
        type: 'info',
        title: 'Restoring Backup',
        message: 'Restoring data from backup...',
        duration: 0
      });

      // Load backup data
      const backup = await this.loadBackup(backupId);
      
      // Validate backup integrity
      if (options.validateIntegrity) {
        await this.validateBackupIntegrity(backup);
      }

      // Create pre-restore backup if requested
      if (options.createPreRestoreBackup) {
        const preRestoreBackup = await this.createBackup({
          id: `prerestore_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
          name: `Pre-Restore Backup ${new Date().toLocaleDateString()}`,
          description: `Backup created before restoring ${backup.metadata.name}`,
          timestamp: new Date(),
          type: 'pre_update',
          tags: ['pre_restore', 'automatic']
        });
        preRestoreBackupId = preRestoreBackup.id;
      }

      // Perform restore
      const result = await this.performRestore(backup, options);
      result.preRestoreBackupId = preRestoreBackupId;
      result.duration = Date.now() - startTime;

      // Show success message
      useUIStore.getState().showToast({
        type: 'success',
        title: 'Backup Restored',
        message: `Successfully restored ${result.restoredRecords} records from backup`,
        duration: 5000
      });

      logger.info('Backup restore completed', { 
        backupId, 
        restoredRecords: result.restoredRecords,
        duration: result.duration 
      });

      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      useUIStore.getState().showToast({
        type: 'error',
        title: 'Restore Failed',
        message: `Failed to restore backup: ${errorMessage}`,
        duration: 8000
      });

      logger.error('Backup restore failed', { backupId, error });
      
      return {
        success: false,
        restoredTables: [],
        restoredRecords: 0,
        skippedRecords: 0,
        errors: [errorMessage],
        duration: Date.now() - startTime,
        preRestoreBackupId
      };
    }
  }

  /**
   * Perform the actual restore operation
   */
  private async performRestore(backup: BackupData, options: RestoreOptions): Promise<RestoreResult> {
    const restoredTables: string[] = [];
    let restoredRecords = 0;
    let skippedRecords = 0;
    const errors: string[] = [];

    // Determine which tables to restore
    const tablesToRestore = options.selectiveTables || backup.metadata.tables;

    for (const tableName of tablesToRestore) {
      if (!backup.data[tableName]) {
        errors.push(`Table ${tableName} not found in backup`);
        continue;
      }

      try {
        const records = backup.data[tableName];
        let processedRecords = 0;

        if (options.overwriteExisting) {
          // Clear existing data
          await databaseService.instance.getManager().clear(tableName);
        }

        // Restore records
        for (const record of records) {
          try {
            if (options.conflictResolution === 'skip') {
              // Check if record exists
              const existing = await databaseService.instance.getManager().get(tableName, record.id);
              if (existing) {
                skippedRecords++;
                continue;
              }
            }

            await databaseService.instance.getManager().put(tableName, record);
            processedRecords++;
          } catch (recordError) {
            errors.push(`Failed to restore record ${record.id} in table ${tableName}: ${recordError}`);
            skippedRecords++;
          }
        }

        restoredTables.push(tableName);
        restoredRecords += processedRecords;
        
        logger.info('Table restored', { tableName, recordCount: processedRecords });
        
      } catch (tableError) {
        errors.push(`Failed to restore table ${tableName}: ${tableError}`);
      }
    }

    return {
      success: errors.length === 0,
      restoredTables,
      restoredRecords,
      skippedRecords,
      errors,
      duration: 0 // Will be set by caller
    };
  }

  // ============================================================================
  // Validation and Utility Methods
  // ============================================================================

  /**
   * Validate backup integrity
   */
  private async validateBackupIntegrity(backup: BackupData): Promise<void> {
    // Verify checksum
    const dataString = JSON.stringify(backup.data);
    const calculatedChecksum = await this.calculateChecksum(dataString);
    
    if (calculatedChecksum !== backup.metadata.checksum) {
      throw new Error('Backup integrity check failed: checksum mismatch');
    }

    // Verify record count
    const actualRecordCount = Object.values(backup.data)
      .reduce((sum, records) => sum + records.length, 0);
    
    if (actualRecordCount !== backup.metadata.recordCount) {
      throw new Error('Backup integrity check failed: record count mismatch');
    }

    logger.info('Backup integrity validated', { backupId: backup.metadata.id });
  }

  /**
   * Check if a table should be included in backups
   */
  private shouldIncludeTable(tableName: string): boolean {
    // Check exclude list first
    if (this.config.excludeTables.includes(tableName)) {
      return false;
    }
    
    // If include list is specified, only include those tables
    if (this.config.includeTables.length > 0) {
      return this.config.includeTables.includes(tableName);
    }
    
    // Include all tables by default
    return true;
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Compress data (simplified implementation)
   */
  private async compressData(data: string): Promise<string> {
    // In a real implementation, you would use a compression library
    // For now, just return the original data
    return data;
  }

  /**
   * Decompress data (simplified implementation)
   */
  private async decompressData(data: string): Promise<string> {
    // In a real implementation, you would use a compression library
    // For now, just return the original data
    return data;
  }

  /**
   * Encrypt data (placeholder implementation)
   */
  private async encryptData(data: string): Promise<string> {
    // In a real implementation, you would use encryption
    // For now, just return the original data
    return data;
  }

  /**
   * Decrypt data (placeholder implementation)
   */
  private async decryptData(data: string): Promise<string> {
    // In a real implementation, you would use decryption
    // For now, just return the original data
    return data;
  }

  // ============================================================================
  // Automatic Backup Management
  // ============================================================================

  /**
   * Initialize automatic backups
   */
  private initializeAutomaticBackups(): void {
    if (!this.config.enabled) {
      return;
    }

    this.automaticBackupInterval = setInterval(() => {
      this.createAutomaticBackup().catch(error => {
        logger.error('Automatic backup failed', { error });
      });
    }, this.config.automaticInterval);

    logger.info('Automatic backups initialized', { interval: this.config.automaticInterval });
  }

  /**
   * Stop automatic backups
   */
  private stopAutomaticBackups(): void {
    if (this.automaticBackupInterval) {
      clearInterval(this.automaticBackupInterval);
      this.automaticBackupInterval = null;
      logger.info('Automatic backups stopped');
    }
  }

  /**
   * Check if backup is currently in progress
   */
  isBackupInProgress(): boolean {
    return this.isBackupInProgress;
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    logger.info('Backup service initialized');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutomaticBackups();
    logger.info('Backup service destroyed');
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();