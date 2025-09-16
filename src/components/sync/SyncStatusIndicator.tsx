import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw as Sync, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { syncService } from '@/services/syncService';
import { cloudBackupService } from '@/services/cloudBackupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/utils';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  className = '',
  showDetails = false
}) => {
  const { user } = useAuthStore();
  const [syncStatus, setSyncStatus] = useState(syncService.getSyncStatus());
  const [backupStatus, setBackupStatus] = useState(cloudBackupService.getBackupStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    // Update status every 10 seconds
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
      setBackupStatus(cloudBackupService.getBackupStatus());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!user || user.role === 'guest') return;

    setIsManualSyncing(true);
    try {
      await syncService.syncNow();
      setSyncStatus(syncService.getSyncStatus());
      logger.info('Manual sync completed');
    } catch (error) {
      logger.error('Manual sync failed', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleManualBackup = async () => {
    if (!cloudBackupService.isBackupEligible()) return;

    try {
      await cloudBackupService.performBackup();
      setBackupStatus(cloudBackupService.getBackupStatus());
      logger.info('Manual backup completed');
    } catch (error) {
      logger.error('Manual backup failed', error);
    }
  };

  const getStatusIcon = () => {
    if (!user || user.role === 'guest') {
      return <CloudOff className="w-4 h-4 text-gray-400" />;
    }

    if (syncStatus.isSyncing || isManualSyncing) {
      return <Sync className="w-4 h-4 text-blue-500 animate-spin" />;
    }

    if (!syncStatus.isOnline) {
      return <CloudOff className="w-4 h-4 text-orange-500" />;
    }

    if (syncStatus.failedItems > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }

    if (syncStatus.pendingItems > 0) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }

    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!user || user.role === 'guest') {
      return 'Offline mode';
    }

    if (syncStatus.isSyncing || isManualSyncing) {
      return 'Syncing...';
    }

    if (!syncStatus.isOnline) {
      return 'Offline';
    }

    if (syncStatus.failedItems > 0) {
      return `${syncStatus.failedItems} failed`;
    }

    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`;
    }

    return 'Synced';
  };

  const getBackupStatusText = () => {
    if (!backupStatus.isBackupEnabled) {
      return 'Backup not available';
    }

    if (backupStatus.isRestoring) {
      return 'Restoring...';
    }

    if (!backupStatus.lastBackupTime) {
      return 'No backup yet';
    }

    const timeSince = Date.now() - backupStatus.lastBackupTime.getTime();
    const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));
    
    if (hoursSince < 1) {
      return 'Backed up recently';
    } else if (hoursSince < 24) {
      return `Backed up ${hoursSince}h ago`;
    } else {
      const daysSince = Math.floor(hoursSince / 24);
      return `Backed up ${daysSince}d ago`;
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Sync Status
        </h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Status:</span>
          <span className={`font-medium ${
            syncStatus.isOnline ? 'text-green-600' : 'text-orange-600'
          }`}>
            {getStatusText()}
          </span>
        </div>

        {syncStatus.pendingItems > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Pending:</span>
            <span className="text-yellow-600">{syncStatus.pendingItems} items</span>
          </div>
        )}

        {syncStatus.failedItems > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Failed:</span>
            <span className="text-red-600">{syncStatus.failedItems} items</span>
          </div>
        )}

        {syncStatus.lastSyncTime && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Last sync:</span>
            <span className="text-gray-900 dark:text-white">
              {syncStatus.lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Premium backup status */}
        {backupStatus.isBackupEnabled && (
          <>
            <hr className="border-gray-200 dark:border-gray-600" />
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Cloud Backup:</span>
              <span className="text-blue-600 font-medium">Premium</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Status:</span>
              <span className="text-gray-900 dark:text-white">
                {getBackupStatusText()}
              </span>
            </div>

            {backupStatus.backupSize > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Size:</span>
                <span className="text-gray-900 dark:text-white">
                  {(backupStatus.backupSize / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2 mt-4">
        {user && user.role !== 'guest' && (
          <button
            onClick={handleManualSync}
            disabled={syncStatus.isSyncing || isManualSyncing || !syncStatus.isOnline}
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            {isManualSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}

        {backupStatus.isBackupEnabled && (
          <button
            onClick={handleManualBackup}
            disabled={backupStatus.isRestoring || !syncStatus.isOnline}
            className="flex-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
          >
            {backupStatus.isRestoring ? 'Restoring...' : 'Backup Now'}
          </button>
        )}

        {syncStatus.failedItems > 0 && (
          <button
            onClick={() => {
              syncService.clearFailedItems();
              setSyncStatus(syncService.getSyncStatus());
            }}
            className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Clear Failed
          </button>
        )}
      </div>

      {/* Offline mode notice */}
      {!syncStatus.isOnline && (
        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            You're offline. Changes will sync when connection is restored.
          </p>
        </div>
      )}

      {/* Guest mode notice */}
      {user?.role === 'guest' && (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Sign up to enable cloud sync and backup.
          </p>
        </div>
      )}
    </div>
  );
};