import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager, swHelpers } from '@/utils/serviceWorkerManager';

export interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  updateAvailable: boolean;
  syncInProgress: boolean;
  lastSyncTime: Date | null;
}

export interface OfflineActions {
  retry: () => void;
  syncData: () => Promise<void>;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isServiceWorkerReady: false,
    updateAvailable: false,
    syncInProgress: false,
    lastSyncTime: null,
  });

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      if (state.isServiceWorkerReady) {
        syncData();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    const handleUpdateAvailable = () => {
      setState(prev => ({ ...prev, updateAvailable: true }));
    };

    const handleOnlineStatusChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      setState(prev => ({ ...prev, isOnline: event.detail.isOnline }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-update-available', handleUpdateAvailable);
    window.addEventListener('sw-online-status-change', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      window.removeEventListener('sw-online-status-change', handleOnlineStatusChange);
    };
  }, [state.isServiceWorkerReady]);

  // Initialize service worker
  useEffect(() => {
    const initializeServiceWorker = async () => {
      try {
        await swHelpers.initialize();
        setState(prev => ({ ...prev, isServiceWorkerReady: true }));
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
      }
    };

    initializeServiceWorker();
  }, []);

  // Retry function
  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  // Sync data function
  const syncData = useCallback(async () => {
    if (!state.isServiceWorkerReady || !state.isOnline) {
      return;
    }

    setState(prev => ({ ...prev, syncInProgress: true }));

    try {
      await Promise.all([
        swHelpers.syncWorkouts(),
        swHelpers.syncExercises(),
        swHelpers.syncProfile(),
        swHelpers.syncOfflineActions(),
      ]);

      setState(prev => ({ 
        ...prev, 
        syncInProgress: false,
        lastSyncTime: new Date()
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [state.isServiceWorkerReady, state.isOnline]);

  // Update app function
  const updateApp = useCallback(async () => {
    try {
      await swHelpers.handleUpdate();
    } catch (error) {
      console.error('App update failed:', error);
    }
  }, []);

  // Clear cache function
  const clearCache = useCallback(async () => {
    try {
      await serviceWorkerManager.clearCache();
      window.location.reload();
    } catch (error) {
      console.error('Clear cache failed:', error);
    }
  }, []);

  const actions: OfflineActions = {
    retry,
    syncData,
    updateApp,
    clearCache,
  };

  return {
    ...state,
    actions,
  };
};

// Hook for checking if a specific feature is available offline
export const useOfflineCapability = (feature: 'workouts' | 'exercises' | 'progress' | 'social') => {
  const { isOnline } = useOffline();

  const capabilities = {
    workouts: {
      view: true,      // Can view cached workouts
      create: true,    // Can create workouts offline
      edit: true,      // Can edit workouts offline
      delete: true,    // Can delete workouts offline
      sync: isOnline,  // Can sync with server
    },
    exercises: {
      view: true,      // Can view cached exercises
      create: false,   // Cannot create new exercises offline
      edit: false,     // Cannot edit exercises offline
      delete: false,   // Cannot delete exercises offline
      sync: isOnline,  // Can sync with server
    },
    progress: {
      view: true,      // Can view cached progress
      create: false,   // Progress is calculated, not created
      edit: false,     // Progress is calculated, not edited
      delete: false,   // Progress is calculated, not deleted
      sync: isOnline,  // Can sync with server
    },
    social: {
      view: false,     // Social features require network
      create: false,   // Cannot create social content offline
      edit: false,     // Cannot edit social content offline
      delete: false,   // Cannot delete social content offline
      sync: isOnline,  // Can sync with server
    },
  };

  return capabilities[feature];
};

// Hook for managing offline queue
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(0);
  const { isOnline, actions } = useOffline();

  // This would integrate with your actual offline queue implementation
  // For now, it's a placeholder
  useEffect(() => {
    // Check queue size from IndexedDB or other storage
    // setQueueSize(actualQueueSize);
  }, []);

  const addToQueue = useCallback(async (action: any) => {
    // Add action to offline queue
    setQueueSize(prev => prev + 1);
  }, []);

  const processQueue = useCallback(async () => {
    if (isOnline && queueSize > 0) {
      await actions.syncData();
      setQueueSize(0);
    }
  }, [isOnline, queueSize, actions]);

  return {
    queueSize,
    addToQueue,
    processQueue,
    hasQueuedActions: queueSize > 0,
  };
};