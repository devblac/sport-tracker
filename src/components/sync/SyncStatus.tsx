import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useSync } from '@/hooks/useSync';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const { 
    isOnline, 
    isSyncing, 
    queueSize, 
    lastSyncTime, 
    conflicts, 
    syncResult,
    actions 
  } = useSync();
  
  const [showConflicts, setShowConflicts] = useState(false);

  const handleSync = async () => {
    if (!isOnline) return;
    
    try {
      await actions.performSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (isSyncing) return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    if (conflicts.length > 0) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (queueSize > 0) return <Clock className="w-4 h-4 text-orange-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (conflicts.length > 0) return `${conflicts.length} conflicts`;
    if (queueSize > 0) return `${queueSize} pending`;
    return 'Up to date';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 dark:text-red-400';
    if (isSyncing) return 'text-blue-600 dark:text-blue-400';
    if (conflicts.length > 0) return 'text-yellow-600 dark:text-yellow-400';
    if (queueSize > 0) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (!showDetails) {
    // Compact status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {isOnline && queueSize > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-6 px-2"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>Sync Status</span>
          </div>
          {isOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection</span>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Queue Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pending Changes</span>
          <span className={`text-sm font-medium ${queueSize > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {queueSize}
          </span>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conflicts</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  {conflicts.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConflicts(!showConflicts)}
                  className="h-6 px-2"
                >
                  {showConflicts ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
            
            {showConflicts && (
              <div className="space-y-2">
                {conflicts.map((conflict) => (
                  <ConflictItem
                    key={conflict.id}
                    conflict={conflict}
                    onResolve={actions.resolveConflict}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Last Sync */}
        {lastSyncTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Sync</span>
            <span className="text-sm text-foreground">
              {lastSyncTime.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                Last sync {syncResult.success ? 'successful' : 'failed'}
              </span>
            </div>
            
            {syncResult.synced > 0 && (
              <div className="text-sm text-muted-foreground">
                Synced {syncResult.synced} items
              </div>
            )}
            
            {syncResult.failed > 0 && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {syncResult.failed} items failed
              </div>
            )}
          </div>
        )}

        {/* Offline Message */}
        {!isOnline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">
                  You're offline
                </div>
                <div className="text-yellow-700 dark:text-yellow-300">
                  Changes will sync automatically when you're back online.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Conflict resolution component
interface ConflictItemProps {
  conflict: any;
  onResolve: (conflictId: string, strategy: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<void>;
}

const ConflictItem: React.FC<ConflictItemProps> = ({ conflict, onResolve }) => {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (strategy: 'local' | 'remote') => {
    setIsResolving(true);
    try {
      await onResolve(conflict.id, strategy);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {conflict.entity} conflict
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Local and remote versions differ
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResolve('local')}
            disabled={isResolving}
            className="h-6 px-2 text-xs"
          >
            Keep Local
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResolve('remote')}
            disabled={isResolving}
            className="h-6 px-2 text-xs"
          >
            Use Remote
          </Button>
        </div>
      </div>
    </div>
  );
};