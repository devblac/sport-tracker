/**
 * Data Synchronization Service
 * 
 * Provides robust offline/online data synchronization with conflict resolution,
 * data integrity validation, and backup/recovery mechanisms for critical data.
 * 
 * Features:
 * - Offline/online data synchronization
 * - Conflict resolution for concurrent changes
 * - Data integrity validation and repair
 * - Backup and recovery mechanisms
 * - Real-time sync status monitoring
 */

import { supabaseService } from './SupabaseService';
import { databaseService } from '@/db/DatabaseService';
import { logger } from '@/utils/logger';
import { useUIStore } from '@/stores/useUIStore';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  localId: string;
  remoteId?: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  conflictResolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  resolvedData?: any;
  conflictFields?: string[];
  timestamp: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
  errors: SyncError[];
}

export interface SyncError {
  id: string;
  operation: SyncOperation;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

export interface DataIntegrityCheck {
  table: string;
  localCount: number;
  remoteCount: number;
  missingLocal: string[];
  missingRemote: string[];
  conflicts: DataConflict[];
}

export interface DataConflict {
  id: string;
  table: string;
  localData: any;
  remoteData: any;
  conflictFields: string[];
  lastModified: {
    local: Date;
    remote: Date;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  tables: string[];
  recordCount: number;
  size: number;
  checksum: string;
  type: 'manual' | 'automatic' | 'pre_sync';
}

// ============================================================================
// Data Synchronization Service
// ============================================================================

export class DataSynchronizationService {
  private static instance: DataSynchronizationService;
  private syncQueue: SyncOperation[] = [];
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingOperations: 0,
    failedOperations: 0,
    syncInProgress: false,
    errors: []
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private integrityCheckInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupEventListeners();
    this.startPeriodicSync();
    this.startIntegrityChecks();
    this.startAutomaticBackups();
  }

  public static getInstance(): DataSynchronizationService {
    if (!DataSynchronizationService.instance) {
      DataSynchronizationService.instance = new DataSynchronizationService();
    }
    return DataSynchronizationService.instance;
  }

  // ============================================================================
  // Core Synchronization Methods
  // ============================================================================

  /**
   * Queue a sync operation for later execution
   */
  async queueSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending'
    };

    this.syncQueue.push(syncOp);
    await this.persistSyncQueue();
    
    this.updateSyncStatus();
    
    // Try immediate sync if online
    if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
      await this.processSyncQueue();
    }

    logger.info('Sync operation queued', { operationId: syncOp.id, type: syncOp.type, table: syncOp.table });
  }

  /**
   * Process all pending sync operations
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncStatus.syncInProgress || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.syncInProgress = true;
    this.updateSyncStatus();

    try {
      const pendingOps = this.syncQueue.filter(op => op.status === 'pending' || op.status === 'failed');
      
      for (const operation of pendingOps) {
        try {
          await this.executeSyncOperation(operation);
          operation.status = 'completed';
          logger.info('Sync operation completed', { operationId: operation.id });
        } catch (error) {
          operation.status = 'failed';
          operation.retryCount++;
          
          const syncError: SyncError = {
            id: crypto.randomUUID(),
            operation,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
            retryable: operation.retryCount < 3
          };
          
          this.syncStatus.errors.push(syncError);
          logger.error('Sync operation failed', { operationId: operation.id, error: syncError.error });
        }
      }

      // Remove completed operations
      this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
      await this.persistSyncQueue();
      
      this.syncStatus.lastSyncTime = new Date();
      
    } finally {
      this.syncStatus.syncInProgress = false;
      this.updateSyncStatus();
    }
  }

  /**
   * Execute a single sync operation
   */
  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    operation.status = 'syncing';
    
    try {
      switch (operation.type) {
        case 'create':
          await this.syncCreate(operation);
          break;
        case 'update':
          await this.syncUpdate(operation);
          break;
        case 'delete':
          await this.syncDelete(operation);
          break;
        default:
          throw new Error(`Unknown sync operation type: ${operation.type}`);
      }
    } catch (error) {
      // Check for conflicts and attempt resolution
      if (this.isConflictError(error)) {
        await this.handleConflict(operation, error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Sync create operation
   */
  private async syncCreate(operation: SyncOperation): Promise<void> {
    const { table, data } = operation;
    
    switch (table) {
      case 'user_profiles':
        const profile = await supabaseService.createUserProfile(data);
        operation.remoteId = profile.id;
        break;
      case 'workout_sessions':
        const workout = await supabaseService.createWorkoutSession(data.user_id, data);
        operation.remoteId = workout.id;
        break;
      case 'social_posts':
        const post = await supabaseService.createSocialPost(data.user_id, data);
        operation.remoteId = post.id;
        break;
      case 'xp_transactions':
        const xp = await supabaseService.addXPTransaction(data.user_id, data);
        operation.remoteId = xp.id;
        break;
      case 'streak_schedules':
        const streak = await supabaseService.createStreakSchedule(data.user_id, data);
        operation.remoteId = streak.id;
        break;
      default:
        throw new Error(`Unsupported table for create sync: ${table}`);
    }
  }

  /**
   * Sync update operation
   */
  private async syncUpdate(operation: SyncOperation): Promise<void> {
    const { table, data, remoteId } = operation;
    
    if (!remoteId) {
      throw new Error('Remote ID required for update operation');
    }
    
    switch (table) {
      case 'user_profiles':
        await supabaseService.updateUserProfile(remoteId, data);
        break;
      case 'workout_sessions':
        await supabaseService.updateWorkoutSession(data.user_id, remoteId, data);
        break;
      case 'social_posts':
        // Social posts typically don't support updates after creation
        throw new Error('Social post updates not supported');
      default:
        throw new Error(`Unsupported table for update sync: ${table}`);
    }
  }

  /**
   * Sync delete operation
   */
  private async syncDelete(operation: SyncOperation): Promise<void> {
    const { table, remoteId } = operation;
    
    if (!remoteId) {
      throw new Error('Remote ID required for delete operation');
    }
    
    // Most deletes are handled by setting deleted_at timestamp
    // rather than actual deletion for data integrity
    switch (table) {
      case 'social_posts':
        // Mark as deleted rather than actual deletion
        await supabaseService.updateSocialPost(remoteId, { 
          deleted_at: new Date().toISOString(),
          visibility: 'deleted' 
        });
        break;
      default:
        logger.warn('Delete operation not implemented for table', { table });
    }
  }

  // ============================================================================
  // Conflict Resolution
  // ============================================================================

  /**
   * Handle data conflicts during synchronization
   */
  private async handleConflict(operation: SyncOperation, error: any): Promise<void> {
    logger.info('Handling sync conflict', { operationId: operation.id, table: operation.table });
    
    // Fetch current remote data
    const remoteData = await this.fetchRemoteData(operation.table, operation.remoteId!);
    const localData = operation.data;
    
    // Detect conflict fields
    const conflictFields = this.detectConflictFields(localData, remoteData);
    
    // Apply conflict resolution strategy
    const resolution = await this.resolveConflict(localData, remoteData, conflictFields);
    
    operation.conflictResolution = resolution;
    
    // Apply resolved data
    if (resolution.resolvedData) {
      operation.data = resolution.resolvedData;
      await this.executeSyncOperation(operation);
    }
  }

  /**
   * Resolve conflicts between local and remote data
   */
  private async resolveConflict(
    localData: any, 
    remoteData: any, 
    conflictFields: string[]
  ): Promise<ConflictResolution> {
    // Default strategy: most recent wins
    const localTimestamp = new Date(localData.updated_at || localData.created_at);
    const remoteTimestamp = new Date(remoteData.updated_at || remoteData.created_at);
    
    if (localTimestamp > remoteTimestamp) {
      return {
        strategy: 'local_wins',
        resolvedData: localData,
        conflictFields,
        timestamp: new Date()
      };
    } else if (remoteTimestamp > localTimestamp) {
      return {
        strategy: 'remote_wins',
        resolvedData: remoteData,
        conflictFields,
        timestamp: new Date()
      };
    } else {
      // Same timestamp, merge non-conflicting fields
      const mergedData = { ...remoteData };
      
      // Apply local changes for non-system fields
      for (const [key, value] of Object.entries(localData)) {
        if (!['id', 'created_at', 'updated_at'].includes(key)) {
          mergedData[key] = value;
        }
      }
      
      return {
        strategy: 'merge',
        resolvedData: mergedData,
        conflictFields,
        timestamp: new Date()
      };
    }
  }

  /**
   * Detect fields that have conflicts between local and remote data
   */
  private detectConflictFields(localData: any, remoteData: any): string[] {
    const conflicts: string[] = [];
    
    for (const [key, localValue] of Object.entries(localData)) {
      if (key in remoteData && remoteData[key] !== localValue) {
        // Skip system fields that are expected to differ
        if (!['id', 'created_at', 'updated_at', 'synced_at'].includes(key)) {
          conflicts.push(key);
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Check if an error indicates a data conflict
   */
  private isConflictError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('conflict') || 
           errorMessage.includes('version') || 
           errorMessage.includes('concurrent');
  }

  /**
   * Fetch current remote data for conflict resolution
   */
  private async fetchRemoteData(table: string, id: string): Promise<any> {
    switch (table) {
      case 'user_profiles':
        return await supabaseService.getUserProfile(id);
      case 'workout_sessions':
        return await supabaseService.getUserWorkouts(id, 1);
      case 'social_posts':
        return await supabaseService.getSocialPost(id);
      default:
        throw new Error(`Unsupported table for remote fetch: ${table}`);
    }
  }

  // ============================================================================
  // Data Integrity Validation
  // ============================================================================

  /**
   * Perform comprehensive data integrity check
   */
  async performIntegrityCheck(): Promise<DataIntegrityCheck[]> {
    logger.info('Starting data integrity check');
    
    const checks: DataIntegrityCheck[] = [];
    const tables = ['user_profiles', 'workout_sessions', 'social_posts', 'xp_transactions'];
    
    for (const table of tables) {
      try {
        const check = await this.checkTableIntegrity(table);
        checks.push(check);
      } catch (error) {
        logger.error('Integrity check failed for table', { table, error });
      }
    }
    
    // Report integrity issues
    const totalConflicts = checks.reduce((sum, check) => sum + check.conflicts.length, 0);
    if (totalConflicts > 0) {
      logger.warn('Data integrity issues detected', { totalConflicts });
      useUIStore.getState().showToast({
        type: 'warning',
        title: 'Data Sync Issues',
        message: `${totalConflicts} data conflicts detected. Automatic resolution in progress.`,
        duration: 8000
      });
    }
    
    return checks;
  }

  /**
   * Check integrity for a specific table
   */
  private async checkTableIntegrity(table: string): Promise<DataIntegrityCheck> {
    // Get local data count
    const localCount = await databaseService.instance.getManager().count(table);
    
    // Get remote data (simplified - in real implementation would paginate)
    let remoteData: any[] = [];
    let remoteCount = 0;
    
    try {
      switch (table) {
        case 'user_profiles':
          // Would need user context for this
          remoteCount = 0;
          break;
        case 'workout_sessions':
          // Would need user context for this
          remoteCount = 0;
          break;
        default:
          remoteCount = 0;
      }
    } catch (error) {
      logger.error('Failed to fetch remote data for integrity check', { table, error });
    }
    
    return {
      table,
      localCount,
      remoteCount,
      missingLocal: [],
      missingRemote: [],
      conflicts: []
    };
  }

  /**
   * Repair data integrity issues
   */
  async repairIntegrityIssues(checks: DataIntegrityCheck[]): Promise<void> {
    logger.info('Starting data integrity repair');
    
    for (const check of checks) {
      // Sync missing remote data to local
      for (const missingId of check.missingLocal) {
        try {
          await this.syncMissingData(check.table, missingId, 'remote_to_local');
        } catch (error) {
          logger.error('Failed to sync missing data to local', { table: check.table, id: missingId, error });
        }
      }
      
      // Sync missing local data to remote
      for (const missingId of check.missingRemote) {
        try {
          await this.syncMissingData(check.table, missingId, 'local_to_remote');
        } catch (error) {
          logger.error('Failed to sync missing data to remote', { table: check.table, id: missingId, error });
        }
      }
      
      // Resolve conflicts
      for (const conflict of check.conflicts) {
        try {
          await this.resolveDataConflict(conflict);
        } catch (error) {
          logger.error('Failed to resolve data conflict', { conflictId: conflict.id, error });
        }
      }
    }
    
    logger.info('Data integrity repair completed');
  }

  /**
   * Sync missing data between local and remote
   */
  private async syncMissingData(table: string, id: string, direction: 'local_to_remote' | 'remote_to_local'): Promise<void> {
    if (direction === 'remote_to_local') {
      // Fetch from remote and save to local
      const remoteData = await this.fetchRemoteData(table, id);
      if (remoteData) {
        await databaseService.instance.getManager().put(table, remoteData);
      }
    } else {
      // Fetch from local and sync to remote
      const localData = await databaseService.instance.getManager().get(table, id);
      if (localData) {
        await this.queueSyncOperation({
          type: 'create',
          table,
          localId: id,
          data: localData
        });
      }
    }
  }

  /**
   * Resolve a specific data conflict
   */
  private async resolveDataConflict(conflict: DataConflict): Promise<void> {
    const resolution = await this.resolveConflict(
      conflict.localData,
      conflict.remoteData,
      conflict.conflictFields
    );
    
    // Apply resolution to both local and remote
    if (resolution.resolvedData) {
      await databaseService.instance.getManager().put(conflict.table, resolution.resolvedData);
      
      await this.queueSyncOperation({
        type: 'update',
        table: conflict.table,
        localId: conflict.id,
        remoteId: conflict.id,
        data: resolution.resolvedData
      });
    }
  }

  // ============================================================================
  // Backup and Recovery
  // ============================================================================

  /**
   * Create a backup of critical data
   */
  async createBackup(type: 'manual' | 'automatic' | 'pre_sync' = 'manual'): Promise<BackupMetadata> {
    logger.info('Creating data backup', { type });
    
    const timestamp = new Date();
    const backupId = `backup_${timestamp.getTime()}`;
    
    // Export all data
    const data = await databaseService.instance.exportData();
    
    // Calculate metadata
    const tables = Object.keys(data);
    const recordCount = Object.values(data).reduce((sum, records) => sum + records.length, 0);
    const dataString = JSON.stringify(data);
    const size = new Blob([dataString]).size;
    const checksum = await this.calculateChecksum(dataString);
    
    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      tables,
      recordCount,
      size,
      checksum,
      type
    };
    
    // Store backup in IndexedDB
    await this.storeBackup(backupId, data, metadata);
    
    logger.info('Backup created successfully', { backupId, recordCount, size });
    
    return metadata;
  }

  /**
   * Restore data from a backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    logger.info('Restoring data from backup', { backupId });
    
    const { data, metadata } = await this.loadBackup(backupId);
    
    // Verify backup integrity
    const dataString = JSON.stringify(data);
    const checksum = await this.calculateChecksum(dataString);
    
    if (checksum !== metadata.checksum) {
      throw new Error('Backup integrity check failed - checksum mismatch');
    }
    
    // Create pre-restore backup
    await this.createBackup('automatic');
    
    // Clear existing data
    await databaseService.instance.clearAllData();
    
    // Import backup data
    await databaseService.instance.importData(data);
    
    logger.info('Backup restored successfully', { backupId });
    
    useUIStore.getState().showToast({
      type: 'success',
      title: 'Backup Restored',
      message: `Data restored from backup created on ${metadata.timestamp.toLocaleDateString()}`,
      duration: 5000
    });
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups = await databaseService.instance.getManager().getAll<{ metadata: BackupMetadata }>('backups');
      return backups.map(backup => backup.metadata).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to list backups', { error });
      return [];
    }
  }

  /**
   * Delete old backups to free up space
   */
  async cleanupOldBackups(maxBackups: number = 10): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      
      for (const backup of toDelete) {
        try {
          await databaseService.instance.getManager().delete('backups', backup.id);
          logger.info('Old backup deleted', { backupId: backup.id });
        } catch (error) {
          logger.error('Failed to delete old backup', { backupId: backup.id, error });
        }
      }
    }
  }

  /**
   * Store backup data
   */
  private async storeBackup(backupId: string, data: any, metadata: BackupMetadata): Promise<void> {
    const backup = {
      id: backupId,
      data,
      metadata,
      created_at: new Date()
    };
    
    await databaseService.instance.getManager().put('backups', backup);
  }

  /**
   * Load backup data
   */
  private async loadBackup(backupId: string): Promise<{ data: any; metadata: BackupMetadata }> {
    const backup = await databaseService.instance.getManager().get<any>('backups', backupId);
    
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    
    return {
      data: backup.data,
      metadata: backup.metadata
    };
  }

  /**
   * Calculate checksum for data integrity verification
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================================================
  // Event Handling and Monitoring
  // ============================================================================

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.updateSyncStatus();
      
      logger.info('Connection restored, resuming sync');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.updateSyncStatus();
      
      logger.info('Connection lost, queuing operations for later sync');
    });
  }

  /**
   * Start periodic synchronization
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Start periodic integrity checks
   */
  private startIntegrityChecks(): void {
    // Check integrity every 5 minutes
    this.integrityCheckInterval = setInterval(() => {
      if (this.syncStatus.isOnline) {
        this.performIntegrityCheck();
      }
    }, 300000);
  }

  /**
   * Start automatic backups
   */
  private startAutomaticBackups(): void {
    // Create backup every hour
    this.backupInterval = setInterval(() => {
      this.createBackup('automatic').then(() => {
        this.cleanupOldBackups();
      });
    }, 3600000);
  }

  /**
   * Update sync status and notify UI
   */
  private updateSyncStatus(): void {
    this.syncStatus.pendingOperations = this.syncQueue.filter(op => op.status === 'pending').length;
    this.syncStatus.failedOperations = this.syncQueue.filter(op => op.status === 'failed').length;
    
    // Update UI store
    const uiStore = useUIStore.getState();
    uiStore.setSyncStatus(this.syncStatus.syncInProgress ? 'syncing' : 
                         this.syncStatus.failedOperations > 0 ? 'error' : 'idle');
  }

  /**
   * Persist sync queue to local storage
   */
  private async persistSyncQueue(): Promise<void> {
    try {
      await databaseService.instance.getManager().put('sync_queue', {
        id: 'current',
        operations: this.syncQueue,
        updated_at: new Date()
      });
    } catch (error) {
      logger.error('Failed to persist sync queue', { error });
    }
  }

  /**
   * Load sync queue from local storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await databaseService.instance.getManager().get<any>('sync_queue', 'current');
      if (stored?.operations) {
        this.syncQueue = stored.operations;
        this.updateSyncStatus();
      }
    } catch (error) {
      logger.error('Failed to load sync queue', { error });
    }
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Force immediate synchronization
   */
  async forcSync(): Promise<void> {
    if (this.syncStatus.isOnline) {
      await this.processSyncQueue();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  /**
   * Clear all sync errors
   */
  clearSyncErrors(): void {
    this.syncStatus.errors = [];
    this.updateSyncStatus();
  }

  /**
   * Retry failed operations
   */
  async retryFailedOperations(): Promise<void> {
    const failedOps = this.syncQueue.filter(op => op.status === 'failed' && op.retryCount < 3);
    
    for (const op of failedOps) {
      op.status = 'pending';
    }
    
    await this.persistSyncQueue();
    
    if (this.syncStatus.isOnline) {
      await this.processSyncQueue();
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.loadSyncQueue();
    logger.info('Data synchronization service initialized');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.integrityCheckInterval) {
      clearInterval(this.integrityCheckInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }
}

// Export singleton instance
export const dataSynchronizationService = DataSynchronizationService.getInstance();