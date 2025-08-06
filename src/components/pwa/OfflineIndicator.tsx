// Offline Indicator Component
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      
      // Trigger sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Hide message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    // Check pending sync items
    const checkPendingSync = () => {
      const pendingWorkouts = localStorage.getItem('pending_sync_workouts');
      const pendingData = pendingWorkouts ? JSON.parse(pendingWorkouts) : [];
      setPendingSyncCount(pendingData.length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check pending sync on mount and periodically
    checkPendingSync();
    const syncInterval = setInterval(checkPendingSync, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  const triggerSync = async () => {
    try {
      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      } else {
        // Fallback: manual sync
        await manualSync();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const manualSync = async () => {
    const pendingWorkouts = localStorage.getItem('pending_sync_workouts');
    if (!pendingWorkouts) return;

    const workouts = JSON.parse(pendingWorkouts);
    const synced: string[] = [];

    for (const workout of workouts) {
      try {
        // Attempt to sync workout
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workout),
        });

        if (response.ok) {
          synced.push(workout.id);
        }
      } catch (error) {
        console.error('Failed to sync workout:', workout.id, error);
      }
    }

    // Remove synced workouts from pending list
    if (synced.length > 0) {
      const remaining = workouts.filter((w: any) => !synced.includes(w.id));
      localStorage.setItem('pending_sync_workouts', JSON.stringify(remaining));
      setPendingSyncCount(remaining.length);
    }
  };

  return (
    <div className={className}>
      {/* Connection Status */}
      <div className={`flex items-center gap-2 text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Pending Sync Indicator */}
      {pendingSyncCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <CloudOff className="w-4 h-4" />
          <span className="hidden sm:inline">
            {pendingSyncCount} pending sync
          </span>
          {isOnline && (
            <button
              onClick={triggerSync}
              className="p-1 hover:bg-orange-100 rounded"
              title="Retry sync"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Offline Message */}
      {showOfflineMessage && (
        <div className="fixed top-4 left-4 right-4 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            <div>
              <div className="font-medium">You're offline</div>
              <div className="text-sm">Your data will sync when you're back online</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for offline functionality
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueForSync = (data: any) => {
    const pending = JSON.parse(localStorage.getItem('pending_sync_workouts') || '[]');
    pending.push(data);
    localStorage.setItem('pending_sync_workouts', JSON.stringify(pending));
    setPendingSync(pending);
  };

  const clearSyncQueue = () => {
    localStorage.removeItem('pending_sync_workouts');
    setPendingSync([]);
  };

  return {
    isOnline,
    pendingSync,
    queueForSync,
    clearSyncQueue
  };
};