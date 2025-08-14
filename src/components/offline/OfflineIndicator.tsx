import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { useOffline } from '@/hooks/useOffline';
import { useSync } from '@/hooks/useSync';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Loader,
  X
} from 'lucide-react';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showDetails = false,
  className = ''
}) => {
  const { isOnline, isServiceWorkerReady, actions: offlineActions } = useOffline();
  const { isSyncing, queueSize, conflicts, actions: syncActions } = useSync();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show indicator when offline or when there are pending changes
  useEffect(() => {
    const shouldShow = !isOnline || queueSize > 0 || conflicts.length > 0;
    setIsVisible(shouldShow && !isDismissed);
  }, [isOnline, queueSize, conflicts.length, isDismissed]);

  // Auto-dismiss when everything is synced and online
  useEffect(() => {
    if (isOnline && queueSize === 0 && conflicts.length === 0) {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isOnline, queueSize, conflicts.length]);

  // Reset dismissed state when going offline
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  const handleSync = async () => {
    if (!isOnline) return;
    
    try {
      await syncActions.performSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const getIndicatorContent = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'You\'re offline',
        subtext: 'Changes will sync when you\'re back online',
        color: 'bg-red-500',
        textColor: 'text-white',
        action: null,
      };
    }

    if (isSyncing) {
      return {
        icon: <Loader className="w-4 h-4 animate-spin" />,
        text: 'Syncing...',
        subtext: 'Updating your data',
        color: 'bg-blue-500',
        textColor: 'text-white',
        action: null,
      };
    }

    if (conflicts.length > 0) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: `${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`,
        subtext: 'Tap to resolve',
        color: 'bg-yellow-500',
        textColor: 'text-white',
        action: () => {
          // Navigate to conflicts resolution
          console.log('Navigate to conflicts');
        },
      };
    }

    if (queueSize > 0) {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: `${queueSize} change${queueSize > 1 ? 's' : ''} pending`,
        subtext: 'Tap to sync now',
        color: 'bg-orange-500',
        textColor: 'text-white',
        action: handleSync,
      };
    }

    // All synced
    return {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'All synced',
      subtext: 'Your data is up to date',
      color: 'bg-green-500',
      textColor: 'text-white',
      action: null,
    };
  };

  if (!isVisible || !isServiceWorkerReady) {
    return null;
  }

  const content = getIndicatorContent();
  const positionClasses = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  if (!showDetails) {
    // Compact banner
    return (
      <div className={`fixed left-0 right-0 ${positionClasses} z-50 ${className}`}>
        <div className={`${content.color} ${content.textColor} px-4 py-2 shadow-lg`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              {content.icon}
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {content.text}
                </div>
                {content.subtext && (
                  <div className="text-xs opacity-90">
                    {content.subtext}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {content.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={content.action}
                  className="text-white hover:bg-white/20 h-8 px-3"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sync
                </Button>
              )}
              
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detailed card
  return (
    <div className={`fixed ${positionClasses} left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 ${className}`}>
      <div className={`${content.color} ${content.textColor} rounded-lg shadow-lg p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {content.icon}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {content.text}
              </div>
              {content.subtext && (
                <div className="text-xs opacity-90 mt-1">
                  {content.subtext}
                </div>
              )}
              
              {/* Additional details */}
              {showDetails && (
                <div className="mt-2 space-y-1 text-xs opacity-90">
                  {!isOnline && (
                    <div>• Working offline with cached data</div>
                  )}
                  {queueSize > 0 && (
                    <div>• {queueSize} operations waiting to sync</div>
                  )}
                  {conflicts.length > 0 && (
                    <div>• {conflicts.length} conflicts need resolution</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            {content.action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={content.action}
                className="text-white hover:bg-white/20 h-7 px-2 text-xs"
              >
                {isSyncing ? (
                  <Loader className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
            )}
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subtle connection status indicator - only shows when there are issues
export const ConnectionDot: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useOffline();
  const { queueSize, isSyncing } = useSync();

  // Only show indicator when there's something to communicate
  // Top 0.001% approach: Invisible when everything is working perfectly
  const shouldShow = !isOnline || isSyncing || queueSize > 0;
  
  if (!shouldShow) return null;

  const getStatus = () => {
    if (!isOnline) return { 
      color: 'bg-red-500', 
      pulse: false, 
      tooltip: 'Offline - changes will sync when connected' 
    };
    if (isSyncing) return { 
      color: 'bg-blue-500', 
      pulse: true, 
      tooltip: 'Syncing changes...' 
    };
    if (queueSize > 0) return { 
      color: 'bg-amber-500', 
      pulse: false, 
      tooltip: `${queueSize} changes pending sync` 
    };
    return { color: 'bg-green-500', pulse: false, tooltip: 'Connected' };
  };

  const status = getStatus();

  return (
    <div className={`relative group ${className}`} title={status.tooltip}>
      {/* Subtle indicator - smaller and less prominent */}
      <div 
        className={`w-1.5 h-1.5 rounded-full ${status.color} ${
          status.pulse ? 'animate-pulse' : ''
        } opacity-75 hover:opacity-100 transition-opacity`} 
      />
      
      {/* Tooltip on hover - only for desktop */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden sm:block">
        {status.tooltip}
      </div>
      
      {!isOnline && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <X className="w-1.5 h-1.5 text-white" />
        </div>
      )}
    </div>
  );
};

// Floating action button for sync
export const SyncFAB: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useOffline();
  const { isSyncing, queueSize, actions } = useSync();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isOnline && queueSize > 0 && !isSyncing);
  }, [isOnline, queueSize, isSyncing]);

  const handleSync = async () => {
    try {
      await actions.performSync();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleSync}
      className={`fixed bottom-20 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 ${className}`}
      aria-label={`Sync ${queueSize} pending changes`}
    >
      <RefreshCw className="w-5 h-5" />
      {queueSize > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {queueSize > 9 ? '9+' : queueSize}
        </div>
      )}
    </button>
  );
};