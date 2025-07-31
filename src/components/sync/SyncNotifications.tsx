import React, { useEffect, useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { useSync } from '@/hooks/useSync';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';

interface SyncNotification {
  id: string;
  type: 'success' | 'error' | 'conflict' | 'offline' | 'online';
  title: string;
  message: string;
  timestamp: number;
  autoHide?: boolean;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SyncNotifications: React.FC = () => {
  const { syncResult, conflicts, isOnline, lastSyncTime } = useSync();
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);

  // Handle sync results
  useEffect(() => {
    if (!syncResult || !lastSyncTime) return;

    const notification: SyncNotification = {
      id: `sync-${Date.now()}`,
      type: syncResult.success ? 'success' : 'error',
      title: syncResult.success ? 'Sync Complete' : 'Sync Failed',
      message: syncResult.success 
        ? `Successfully synced ${syncResult.synced} items`
        : `Failed to sync ${syncResult.failed} items`,
      timestamp: Date.now(),
      autoHide: syncResult.success,
      duration: 5000,
    };

    if (!syncResult.success && syncResult.errors.length > 0) {
      notification.message += `: ${syncResult.errors[0]}`;
    }

    addNotification(notification);
  }, [syncResult, lastSyncTime]);

  // Handle conflicts
  useEffect(() => {
    if (conflicts.length === 0) return;

    const notification: SyncNotification = {
      id: `conflicts-${Date.now()}`,
      type: 'conflict',
      title: 'Sync Conflicts',
      message: `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''} need${conflicts.length === 1 ? 's' : ''} resolution`,
      timestamp: Date.now(),
      autoHide: false,
      action: {
        label: 'Resolve',
        onClick: () => {
          // Navigate to conflicts resolution
          console.log('Navigate to conflicts resolution');
        },
      },
    };

    addNotification(notification);
  }, [conflicts.length]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnlineChange = () => {
      const notification: SyncNotification = {
        id: `connection-${Date.now()}`,
        type: isOnline ? 'online' : 'offline',
        title: isOnline ? 'Back Online' : 'You\'re Offline',
        message: isOnline 
          ? 'Connection restored. Syncing pending changes...'
          : 'Working offline. Changes will sync when connection is restored.',
        timestamp: Date.now(),
        autoHide: true,
        duration: isOnline ? 3000 : 5000,
      };

      addNotification(notification);
    };

    // Only show notification if this is a change, not initial state
    const timer = setTimeout(handleOnlineChange, 100);
    return () => clearTimeout(timer);
  }, [isOnline]);

  const addNotification = (notification: SyncNotification) => {
    setNotifications(prev => {
      // Remove existing notification of the same type
      const filtered = prev.filter(n => n.type !== notification.type);
      return [...filtered, notification];
    });

    // Auto-hide if specified
    if (notification.autoHide) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: SyncNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'conflict':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'online':
        return <Wifi className="w-5 h-5 text-green-500" />;
      default:
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: SyncNotification['type']) => {
    switch (type) {
      case 'success':
      case 'online':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'error':
      case 'offline':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'conflict':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card 
          key={notification.id}
          className={`border-l-4 ${getNotificationColor(notification.type)} shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.type)}
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm">
                  {notification.title}
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  {notification.message}
                </div>
                
                {notification.action && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={notification.action.onClick}
                      className="h-7 px-3 text-xs"
                    >
                      {notification.action.label}
                    </Button>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Toast-style notification for quick feedback
export const SyncToast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`${getToastStyles()} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm`}>
        {getToastIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// Hook for showing toast notifications
export const useSyncToast = () => {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};