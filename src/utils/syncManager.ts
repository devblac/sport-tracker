/**
 * Sync Manager
 * Handles conflict resolution and coordination between local and remote data
 */

import { syncQueue } from './syncQueue';
import type { SyncOperation } from './syncQueue';
import { dbManager } from '@/db/IndexedDBManager';

export interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual';
  resolvedData?: any;
  requiresUserInput?: boolean;
}

export interface SyncConflict {
  id: string;
  entity: string;
  entityId: string;
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
  conflictType: 'update_conflict' | 'delete_conflict' | 'create_conflict';
  resolution?: ConflictResolution;
  createdAt: number;
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  synced: number;
  failed: number;
  errors: string[];
}

export class SyncManager {
  private static instance: SyncManager;
  private conflictResolvers: Map<string, (conflict: SyncConflict) => Promise<ConflictResolution>> = new Map();
  private syncListeners: Set<(result: SyncResult) => void> = new Set();

  private constructor() {
    this.initializeDefaultResolvers();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Initialize default conflict resolvers
   */
  private initializeDefaultResolvers(): void {
    // Workout conflict resolver
    this.conflictResolvers.set('workout', async (conflict) => {
      return this.resolveWorkoutConflict(conflict);
    });

    // Exercise conflict resolver
    this.conflictResolvers.set('exercise', async (conflict) => {
      return this.resolveExerciseConflict(conflict);
    });

    // Profile conflict resolver
    this.conflictResolvers.set('profile', async (conflict) => {
      return this.resolveProfileConflict(conflict);
    });

    // Settings conflict resolver
    this.conflictResolvers.set('settings', async (conflict) => {
      return this.resolveSettingsConflict(conflict);
    });
  }

  /**
   * Perform full synchronization
   */
  async performSync(): Promise<SyncResult> {
    console.log('[SyncManager] Starting full synchronization');
    
    const result: SyncResult = {
      success: true,
      conflicts: [],
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all pending operations
      const pendingOperations = await syncQueue.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        console.log('[SyncManager] No pending operations to sync');
        result.success = true;
        return result;
      }

      console.log(`[SyncManager] Processing ${pendingOperations.length} pending operations`);

      // Process each operation
      for (const operation of pendingOperations) {
        try {
          const syncResult = await this.syncOperation(operation);
          
          if (syncResult.conflicts.length > 0) {
            result.conflicts.push(...syncResult.conflicts);
          }
          
          if (syncResult.success && syncResult.synced > 0) {
            result.synced += syncResult.synced;
            // Mark operation as completed in the queue
            await syncQueue.updateOperationStatus(operation.id, 'completed');
          } else if (syncResult.failed > 0) {
            result.failed += syncResult.failed;
            result.errors.push(...syncResult.errors);
            // Mark operation as failed in the queue
            await syncQueue.updateOperationStatus(operation.id, 'failed', syncResult.errors.join('; '));
          }
          
        } catch (error) {
          result.failed++;
          result.errors.push(error instanceof Error ? error.message : String(error));
          console.error('[SyncManager] Operation sync failed:', error);
          // Mark operation as failed in the queue
          try {
            await syncQueue.updateOperationStatus(operation.id, 'failed', error instanceof Error ? error.message : String(error));
          } catch (updateError) {
            console.error('[SyncManager] Failed to update operation status:', updateError);
          }
        }
      }

      // Resolve conflicts
      if (result.conflicts.length > 0) {
        try {
          await this.resolveConflicts(result.conflicts);
        } catch (error) {
          result.failed++;
          result.errors.push(`Conflict resolution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      result.success = result.failed === 0 && result.errors.length === 0;
      
      console.log('[SyncManager] Sync completed:', {
        success: result.success,
        synced: result.synced,
        failed: result.failed,
        conflicts: result.conflicts.length,
        errors: result.errors.length
      });
      
      this.notifySyncListeners(result);
      
      return result;
      
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      result.success = false;
      result.failed = Math.max(result.failed, 1);
      result.errors.push(error instanceof Error ? error.message : String(error));
      this.notifySyncListeners(result);
      return result;
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: SyncOperation): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      conflicts: [],
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Check for conflicts before syncing
      const conflict = await this.detectConflict(operation);
      
      if (conflict) {
        result.conflicts.push(conflict);
        console.log(`[SyncManager] Conflict detected for operation ${operation.id}`);
        return result;
      }

      // No conflict, proceed with sync by processing the operation directly
      try {
        await this.executeOperationSync(operation);
        result.synced = 1;
        console.log(`[SyncManager] Operation ${operation.id} synced successfully`);
      } catch (syncError) {
        result.success = false;
        result.failed = 1;
        result.errors.push(syncError instanceof Error ? syncError.message : String(syncError));
        console.error(`[SyncManager] Operation ${operation.id} sync failed:`, syncError);
      }
      
    } catch (error) {
      result.success = false;
      result.failed = 1;
      result.errors.push(error instanceof Error ? error.message : String(error));
      console.error(`[SyncManager] Failed to process operation ${operation.id}:`, error);
    }

    return result;
  }

  /**
   * Execute operation synchronization directly
   */
  private async executeOperationSync(operation: SyncOperation): Promise<void> {
    const { type, entity, data } = operation;

    switch (entity) {
      case 'workout':
        await this.syncWorkoutOperation(type, data);
        break;
      case 'exercise':
        await this.syncExerciseOperation(type, data);
        break;
      case 'profile':
        await this.syncProfileOperation(type, data);
        break;
      case 'settings':
        await this.syncSettingsOperation(type, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Sync workout operations
   */
  private async syncWorkoutOperation(type: SyncOperation['type'], data: any): Promise<void> {
    const response = await fetch(`/api/workouts${type === 'UPDATE' ? `/${data.id}` : ''}`, {
      method: type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sync exercise operations
   */
  private async syncExerciseOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Simulate API call for exercises
    const response = await fetch(`/api/exercises${type === 'UPDATE' ? `/${data.id}` : ''}`, {
      method: type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sync profile operations
   */
  private async syncProfileOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Simulate API call for profile
    const response = await fetch(`/api/profile${type === 'UPDATE' ? `/${data.id}` : ''}`, {
      method: type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sync settings operations
   */
  private async syncSettingsOperation(type: SyncOperation['type'], data: any): Promise<void> {
    // Simulate API call for settings
    const response = await fetch(`/api/settings${type === 'UPDATE' ? `/${data.id}` : ''}`, {
      method: type === 'CREATE' ? 'POST' : type === 'UPDATE' ? 'PUT' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: type !== 'DELETE' ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Detect conflicts for an operation
   */
  private async detectConflict(operation: SyncOperation): Promise<SyncConflict | null> {
    try {
      // Get remote data to compare
      const remoteData = await this.fetchRemoteData(operation.entity, operation.data.id);
      
      if (!remoteData) {
        // No remote data, no conflict
        return null;
      }

      // Compare timestamps and data
      const localTimestamp = operation.data.updated_at || operation.data.created_at || operation.timestamp;
      const remoteTimestamp = remoteData.updated_at || remoteData.created_at;

      // Check if there's a conflict
      if (this.hasDataConflict(operation.data, remoteData) && 
          Math.abs(localTimestamp - remoteTimestamp) > 1000) { // 1 second tolerance
        
        return {
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          entity: operation.entity,
          entityId: operation.data.id,
          localData: operation.data,
          remoteData,
          localTimestamp,
          remoteTimestamp,
          conflictType: this.determineConflictType(operation, remoteData),
          createdAt: Date.now(),
        };
      }

      return null;
      
    } catch (error) {
      console.error('[SyncManager] Conflict detection failed:', error);
      return null;
    }
  }

  /**
   * Check if there's a data conflict
   */
  private hasDataConflict(localData: any, remoteData: any): boolean {
    // Simple deep comparison (you might want to use a more sophisticated approach)
    return JSON.stringify(localData) !== JSON.stringify(remoteData);
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(operation: SyncOperation, remoteData: any): SyncConflict['conflictType'] {
    if (operation.type === 'DELETE' && remoteData) {
      return 'delete_conflict';
    }
    
    if (operation.type === 'CREATE' && remoteData) {
      return 'create_conflict';
    }
    
    return 'update_conflict';
  }

  /**
   * Fetch remote data for comparison
   */
  private async fetchRemoteData(entity: string, entityId: string): Promise<any> {
    try {
      const response = await fetch(`/api/${entity}s/${entityId}`);
      
      if (response.status === 404) {
        return null; // Entity doesn't exist remotely
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('[SyncManager] Failed to fetch remote data:', error);
      return null;
    }
  }

  /**
   * Resolve conflicts
   */
  private async resolveConflicts(conflicts: SyncConflict[]): Promise<void> {
    for (const conflict of conflicts) {
      try {
        const resolver = this.conflictResolvers.get(conflict.entity);
        
        if (!resolver) {
          console.warn(`[SyncManager] No resolver for entity: ${conflict.entity}`);
          continue;
        }

        const resolution = await resolver(conflict);
        conflict.resolution = resolution;

        // Apply resolution
        await this.applyResolution(conflict, resolution);
        
      } catch (error) {
        console.error('[SyncManager] Conflict resolution failed:', error);
      }
    }
  }

  /**
   * Apply conflict resolution
   */
  private async applyResolution(conflict: SyncConflict, resolution: ConflictResolution): Promise<void> {
    try {
      switch (resolution.strategy) {
        case 'local_wins':
          // Keep local data, sync to remote
          await this.syncToRemote(conflict.entity, conflict.localData);
          break;
          
        case 'remote_wins':
          // Use remote data, update local
          await this.updateLocal(conflict.entity, conflict.remoteData);
          break;
          
        case 'merge':
          // Use merged data
          if (resolution.resolvedData) {
            await this.updateLocal(conflict.entity, resolution.resolvedData);
            await this.syncToRemote(conflict.entity, resolution.resolvedData);
          }
          break;
          
        case 'manual':
          // Store conflict for manual resolution
          await this.storeConflictForManualResolution(conflict);
          break;
      }
    } catch (error) {
      console.error(`[SyncManager] Failed to apply resolution for conflict ${conflict.id}:`, error);
      // Re-throw to be handled by caller
      throw error;
    }
  }

  /**
   * Workout conflict resolver
   */
  private async resolveWorkoutConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    const { localData, remoteData, localTimestamp, remoteTimestamp } = conflict;

    // If local is newer, prefer local
    if (localTimestamp > remoteTimestamp) {
      return { strategy: 'local_wins' };
    }

    // If remote is newer, prefer remote
    if (remoteTimestamp > localTimestamp) {
      return { strategy: 'remote_wins' };
    }

    // If timestamps are equal, try to merge
    try {
      const mergedData = this.mergeWorkoutData(localData, remoteData);
      return {
        strategy: 'merge',
        resolvedData: mergedData,
      };
    } catch (error) {
      // Merge failed, require manual resolution
      return {
        strategy: 'manual',
        requiresUserInput: true,
      };
    }
  }

  /**
   * Exercise conflict resolver
   */
  private async resolveExerciseConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    // Exercises are usually read-only for users, so prefer remote
    return { strategy: 'remote_wins' };
  }

  /**
   * Profile conflict resolver
   */
  private async resolveProfileConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    // For profile data, prefer the most recent update
    return conflict.localTimestamp > conflict.remoteTimestamp
      ? { strategy: 'local_wins' }
      : { strategy: 'remote_wins' };
  }

  /**
   * Settings conflict resolver
   */
  private async resolveSettingsConflict(conflict: SyncConflict): Promise<ConflictResolution> {
    // Settings can usually be merged
    try {
      const mergedData = { ...conflict.remoteData, ...conflict.localData };
      return {
        strategy: 'merge',
        resolvedData: mergedData,
      };
    } catch (error) {
      return { strategy: 'local_wins' };
    }
  }

  /**
   * Merge workout data
   */
  private mergeWorkoutData(localData: any, remoteData: any): any {
    // Simple merge strategy - you might want to implement more sophisticated merging
    return {
      ...remoteData,
      ...localData,
      // Merge exercises arrays
      exercises: this.mergeExerciseArrays(localData.exercises || [], remoteData.exercises || []),
      // Use the latest timestamp
      updated_at: Math.max(localData.updated_at || 0, remoteData.updated_at || 0),
    };
  }

  /**
   * Merge exercise arrays
   */
  private mergeExerciseArrays(localExercises: any[], remoteExercises: any[]): any[] {
    const merged = [...remoteExercises];
    
    localExercises.forEach(localEx => {
      const remoteIndex = merged.findIndex(remoteEx => remoteEx.id === localEx.id);
      
      if (remoteIndex >= 0) {
        // Merge existing exercise
        merged[remoteIndex] = { ...merged[remoteIndex], ...localEx };
      } else {
        // Add new exercise
        merged.push(localEx);
      }
    });
    
    return merged;
  }

  /**
   * Sync data to remote
   */
  private async syncToRemote(entity: string, data: any): Promise<void> {
    try {
      const response = await fetch(`/api/${entity}s/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync to remote: HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`[SyncManager] Failed to sync ${entity} to remote:`, error);
      throw error;
    }
  }

  /**
   * Update local data
   */
  private async updateLocal(entity: string, data: any): Promise<void> {
    const storeName = `${entity}s`; // e.g., 'workouts', 'exercises'
    await dbManager.put(storeName, data);
  }

  /**
   * Store conflict for manual resolution
   */
  private async storeConflictForManualResolution(conflict: SyncConflict): Promise<void> {
    try {
      // Store conflicts in IndexedDB for manual resolution
      await dbManager.put('syncConflicts', conflict);
      console.log('[SyncManager] Conflict stored for manual resolution:', conflict.id);
    } catch (error) {
      // Fallback to in-memory storage if IndexedDB fails
      console.warn('[SyncManager] Failed to store conflict in IndexedDB, using fallback:', error);
      this.inMemoryConflicts.set(conflict.id, conflict);
    }
  }

  // In-memory fallback for conflicts
  private inMemoryConflicts = new Map<string, SyncConflict>();

  /**
   * Get pending conflicts
   */
  async getPendingConflicts(): Promise<SyncConflict[]> {
    try {
      // Try to get from IndexedDB first
      const dbConflicts = await dbManager.getAll<SyncConflict>('syncConflicts');
      
      // Merge with in-memory conflicts
      const memoryConflicts = Array.from(this.inMemoryConflicts.values());
      
      // Combine and deduplicate
      const allConflicts = [...dbConflicts, ...memoryConflicts];
      const uniqueConflicts = allConflicts.filter((conflict, index, array) => 
        array.findIndex(c => c.id === conflict.id) === index
      );
      
      return uniqueConflicts;
    } catch (error) {
      console.error('[SyncManager] Failed to get pending conflicts:', error);
      // Return in-memory conflicts as fallback
      return Array.from(this.inMemoryConflicts.values());
    }
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflictManually(conflictId: string, resolution: ConflictResolution): Promise<void> {
    try {
      // Try to get from IndexedDB first
      let conflict: SyncConflict | null = null;
      
      try {
        conflict = await dbManager.get<SyncConflict>('syncConflicts', conflictId);
      } catch (error) {
        console.warn('[SyncManager] Failed to get conflict from IndexedDB:', error);
      }
      
      // Fallback to in-memory storage
      if (!conflict) {
        conflict = this.inMemoryConflicts.get(conflictId) || null;
      }
      
      if (!conflict) {
        throw new Error(`Conflict not found: ${conflictId}`);
      }

      // Apply resolution
      await this.applyResolution(conflict, resolution);
      
      // Remove from both storage locations
      try {
        await dbManager.delete('syncConflicts', conflictId);
      } catch (error) {
        console.warn('[SyncManager] Failed to delete conflict from IndexedDB:', error);
      }
      
      this.inMemoryConflicts.delete(conflictId);
      
      console.log('[SyncManager] Conflict resolved manually:', conflictId);
      
    } catch (error) {
      console.error('[SyncManager] Manual conflict resolution failed:', error);
      throw error;
    }
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.add(listener);
  }

  /**
   * Remove sync listener
   */
  removeSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.delete(listener);
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(result);
      } catch (error) {
        console.error('[SyncManager] Sync listener error:', error);
      }
    });
  }

  /**
   * Register custom conflict resolver
   */
  registerConflictResolver(
    entity: string, 
    resolver: (conflict: SyncConflict) => Promise<ConflictResolution>
  ): void {
    this.conflictResolvers.set(entity, resolver);
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();