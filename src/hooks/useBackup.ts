/**
 * React Hooks for Backup & Recovery Operations
 * Seamless integration with React components
 * Built for data safety and user experience
 */

import { useState, useEffect, useCallback } from 'react';
import { backupManager } from '@/services/BackupManager';
import type { BackupMetadata, BackupStats, DataCategory, RecoveryOptions } from '@/services/BackupManager';
import { useAuthStore } from '@/stores';

export interface UseBackupResult {
  backups: BackupMetadata[];
  stats: BackupStats | null;
  isLoading: boolean;
  isCreatingBackup: boolean;
  createBackup: (categories?: DataCategory[]) => Promise<string>;
  deleteBackup: (backupId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export interface UseRecoveryResult {
  isRestoring: boolean;
  restoreFromBackup: (backupId: string, options: RecoveryOptions) => Promise<boolean>;
  recoverLostData: (categories?: DataCategory[]) => Promise<string | null>;
}

export interface UseMigrationResult {
  migrationToken: string | null;
  isGeneratingToken: boolean;
  isMigrating: boolean;
  generateMigrationToken: () => Promise<string>;
  migrateFromToken: (token: string) => Promise<boolean>;
}

/**
 * Hook for backup operations
 */
export const useBackup = (): UseBackupResult => {
  const { user } = useAuthStore();
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const userId = user?.id || 'current_user';

  const loadBackupData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userBackups, backupStats] = await Promise.all([
        backupManager.getUserBackups(userId),
        backupManager.getBackupStats(userId)
      ]);
      
      setBackups(userBackups);
      setStats(backupStats);
    } catch (error) {
      console.error('Error loading backup data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createBackup = useCallback(async (categories: DataCategory[] = ['all']): Promise<string> => {
    try {
      setIsCreatingBackup(true);
      const backupId = await backupManager.createBackup(userId, 'manual', categories);
      await loadBackupData(); // Refresh data
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    } finally {
      setIsCreatingBackup(false);
    }
  }, [userId, loadBackupData]);

  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const success = await backupManager.deleteBackup(backupId, userId);
      if (success) {
        await loadBackupData(); // Refresh data
      }
      return success;
    } catch (error) {
      console.error('Error deleting backup:', error);
      return false;
    }
  }, [userId, loadBackupData]);

  useEffect(() => {
    loadBackupData();
  }, [loadBackupData]);

  return {
    backups,
    stats,
    isLoading,
    isCreatingBackup,
    createBackup,
    deleteBackup,
    refresh: loadBackupData
  };
};

/**
 * Hook for recovery operations
 */
export const useRecovery = (): UseRecoveryResult => {
  const { user } = useAuthStore();
  const [isRestoring, setIsRestoring] = useState(false);

  const userId = user?.id || 'current_user';

  const restoreFromBackup = useCallback(async (
    backupId: string, 
    options: RecoveryOptions
  ): Promise<boolean> => {
    try {
      setIsRestoring(true);
      const success = await backupManager.restoreFromBackup(backupId, userId, options);
      return success;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [userId]);

  const recoverLostData = useCallback(async (
    categories: DataCategory[] = ['all']
  ): Promise<string | null> => {
    try {
      setIsRestoring(true);
      const backupId = await backupManager.recoverLostData(userId, categories);
      return backupId;
    } catch (error) {
      console.error('Error recovering lost data:', error);
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [userId]);

  return {
    isRestoring,
    restoreFromBackup,
    recoverLostData
  };
};

/**
 * Hook for device migration
 */
export const useMigration = (): UseMigrationResult => {
  const { user } = useAuthStore();
  const [migrationToken, setMigrationToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const userId = user?.id || 'current_user';

  const generateMigrationToken = useCallback(async (): Promise<string> => {
    try {
      setIsGeneratingToken(true);
      const token = await backupManager.generateMigrationToken(userId);
      setMigrationToken(token);
      return token;
    } catch (error) {
      console.error('Error generating migration token:', error);
      throw error;
    } finally {
      setIsGeneratingToken(false);
    }
  }, [userId]);

  const migrateFromToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      setIsMigrating(true);
      const success = await backupManager.migrateFromToken(token, userId);
      return success;
    } catch (error) {
      console.error('Error migrating from token:', error);
      throw error;
    } finally {
      setIsMigrating(false);
    }
  }, [userId]);

  return {
    migrationToken,
    isGeneratingToken,
    isMigrating,
    generateMigrationToken,
    migrateFromToken
  };
};

/**
 * Hook for automatic backup status
 */
export const useAutomaticBackup = () => {
  const { user } = useAuthStore();
  const [nextBackup, setNextBackup] = useState<Date | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const userId = user?.id || 'current_user';

  useEffect(() => {
    const checkBackupStatus = async () => {
      try {
        const stats = await backupManager.getBackupStats(userId);
        setNextBackup(stats.nextScheduledBackup);
      } catch (error) {
        console.error('Error checking backup status:', error);
      }
    };

    checkBackupStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkBackupStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const toggleAutomaticBackup = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    // In a real implementation, this would update the backup manager configuration
  }, []);

  return {
    nextBackup,
    isEnabled,
    toggleAutomaticBackup
  };
};

/**
 * Hook for emergency recovery
 */
export const useEmergencyRecovery = () => {
  const { user } = useAuthStore();
  const [hasEmergencyBackup, setHasEmergencyBackup] = useState(false);

  const userId = user?.id || 'current_user';

  useEffect(() => {
    // Check for emergency backup flag
    const checkEmergencyBackup = () => {
      try {
        const emergencyFlag = localStorage.getItem('emergency_backup_flag');
        if (emergencyFlag) {
          const data = JSON.parse(emergencyFlag);
          if (data.userId === userId && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setHasEmergencyBackup(true);
          }
        }
      } catch (error) {
        console.error('Error checking emergency backup:', error);
      }
    };

    checkEmergencyBackup();
  }, [userId]);

  const performEmergencyRecovery = useCallback(async (): Promise<boolean> => {
    try {
      // Attempt to recover from the most recent automatic backup
      const backupId = await backupManager.recoverLostData(userId, ['all']);
      
      if (backupId) {
        // Clear emergency flag
        localStorage.removeItem('emergency_backup_flag');
        setHasEmergencyBackup(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Emergency recovery failed:', error);
      return false;
    }
  }, [userId]);

  const dismissEmergencyBackup = useCallback(() => {
    localStorage.removeItem('emergency_backup_flag');
    setHasEmergencyBackup(false);
  }, []);

  return {
    hasEmergencyBackup,
    performEmergencyRecovery,
    dismissEmergencyBackup
  };
};

/**
 * Hook for backup validation
 */
export const useBackupValidation = () => {
  const validateBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      // This would validate backup integrity
      // For now, we'll simulate validation
      return true;
    } catch (error) {
      console.error('Backup validation failed:', error);
      return false;
    }
  }, []);

  const estimateRestoreTime = useCallback((backupSize: number): number => {
    // Estimate restore time based on backup size (simplified)
    const bytesPerSecond = 1024 * 1024; // 1MB/s
    return Math.ceil(backupSize / bytesPerSecond);
  }, []);

  return {
    validateBackup,
    estimateRestoreTime
  };
};