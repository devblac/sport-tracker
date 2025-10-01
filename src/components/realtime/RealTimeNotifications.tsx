/**
 * World-Class Real-Time Notification System
 * Ultra-smooth animations with intelligent queuing
 * Built for maximum user engagement and performance
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Trophy, Zap, Target } from 'lucide-react';
import { useRealTimeNotifications } from '@/hooks/useRealTime';
import { cn } from '@/utils';

interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  action?: {
    label: string;
    url: string;
  };
  autoClose?: number;
  persistent?: boolean;
  icon?: React.ReactNode;
}

interface ActiveNotification extends NotificationData {
  timestamp: number;
  isVisible: boolean;
  isRemoving: boolean;
}

interface RealTimeNotificationsProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxNotifications?: number;
  defaultAutoClose?: number;
  enableSound?: boolean;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  className = '',
  position = 'top-right',
  maxNotifications = 5,
  defaultAutoClose = 5000,
  enableSound = true
}) => {
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);

  // Real-time notification data
  const { data, isConnected, emit } = useRealTimeNotifications({
    priority: 'high',
    throttle: 0, // No throttling for notifications
    onlyWhenVisible: false // Show notifications even when tab is hidden
  });

  // Handle new notifications with duplicate prevention
  const processedNotificationIds = useRef(new Set<string>());
  
  useEffect(() => {
    if (data && data.id && !processedNotificationIds.current.has(data.id)) {
      // Mark as processed to prevent duplicates
      processedNotificationIds.current.add(data.id);
      
      const newNotification: ActiveNotification = {
        ...data,
        timestamp: Date.now(),
        isVisible: false,
        isRemoving: false,
        autoClose: data.autoClose ?? defaultAutoClose
      };

      // Add notification with entrance animation
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(notif => notif.id === newNotification.id);
        if (exists) return prev;
        
        const updated = [newNotification, ...prev].slice(0, maxNotifications);
        return updated;
      });

      // Trigger entrance animation
      const animationTimer = setTimeout(() => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === newNotification.id 
              ? { ...notif, isVisible: true }
              : notif
          )
        );
      }, 50);

      // Play notification sound
      if (soundEnabled) {
        playNotificationSound(data.type);
      }

      // Auto-close if specified
      if (newNotification.autoClose && newNotification.autoClose > 0 && !newNotification.persistent) {
        const autoCloseTimer = setTimeout(() => {
          removeNotification(newNotification.id);
        }, newNotification.autoClose);
        
        // Store timer reference for cleanup
        return () => {
          clearTimeout(animationTimer);
          clearTimeout(autoCloseTimer);
        };
      }
      
      return () => {
        clearTimeout(animationTimer);
      };
    }
  }, [data, defaultAutoClose, maxNotifications, soundEnabled, removeNotification, playNotificationSound]);

  // Cleanup processed IDs periodically to prevent memory leaks
  useEffect(() => {
    const cleanup = setInterval(() => {
      processedNotificationIds.current.clear();
    }, 300000); // Clear every 5 minutes
    
    return () => clearInterval(cleanup);
  }, []);

  // Remove notification with animation
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id 
          ? { ...notif, isRemoving: true }
          : notif
      )
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 300);
  }, []);

  // Handle notification action
  const handleAction = useCallback((notification: ActiveNotification) => {
    if (notification.action?.url) {
      window.open(notification.action.url, '_blank');
    }
    removeNotification(notification.id);
  }, [removeNotification]);

  // Play notification sound
  const playNotificationSound = useCallback((type: NotificationData['type']) => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        achievement: 1000,
        info: 600,
        warning: 400,
        error: 300
      };

      oscillator.frequency.setValueAtTime(frequencies[type] || 600, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silently fail if audio context is not available
    }
  }, [soundEnabled]);

  // Get notification icon
  const getNotificationIcon = (type: NotificationData['type'], customIcon?: React.ReactNode) => {
    if (customIcon) return customIcon;

    const iconProps = { className: 'w-5 h-5' };

    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'achievement':
        return <Trophy {...iconProps} className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get notification colors
  const getNotificationColors = (type: NotificationData['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'achievement':
        return 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  // Demo notifications for testing - DISABLED to prevent infinite loops
  // useEffect(() => {
  //   const demoNotifications = [
  //     {
  //       id: 'demo-1',
  //       type: 'achievement' as const,
  //       title: 'New Achievement!',
  //       message: 'You completed your first 10K workout!',
  //       icon: <Trophy className="w-5 h-5 text-yellow-500" />,
  //       autoClose: 8000
  //     },
  //     {
  //       id: 'demo-2',
  //       type: 'success' as const,
  //       title: 'Workout Complete',
  //       message: 'Great job! You burned 450 calories.',
  //       autoClose: 5000
  //     },
  //     {
  //       id: 'demo-3',
  //       type: 'info' as const,
  //       title: 'Friend Activity',
  //       message: 'Sarah just completed a 5K run!',
  //       action: {
  //         label: 'View',
  //         url: '/social'
  //       },
  //       autoClose: 6000
  //     }
  //   ];

  //   // Emit demo notifications with delays
  //   demoNotifications.forEach((notification, index) => {
  //     setTimeout(() => {
  //       emit(notification, { priority: 'high', broadcast: false });
  //     }, (index + 1) * 3000);
  //   });
  // }, [emit]);

  if (notifications.length === 0) return null;

  return (
    <div className={cn(
      'fixed z-50 flex flex-col space-y-3 pointer-events-none',
      getPositionClasses(),
      className
    )}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            'pointer-events-auto max-w-sm w-full rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform',
            getNotificationColors(notification.type),
            notification.isVisible 
              ? 'translate-x-0 opacity-100 scale-100' 
              : position.includes('right') 
                ? 'translate-x-full opacity-0 scale-95'
                : '-translate-x-full opacity-0 scale-95',
            notification.isRemoving && 'translate-x-full opacity-0 scale-95',
            notification.type === 'achievement' && 'animate-pulse'
          )}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type, notification.icon)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {notification.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {notification.message}
                    </p>

                    {/* Action Button */}
                    {notification.action && (
                      <button
                        onClick={() => handleAction(notification)}
                        className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>

                  {/* Close Button */}
                  {!notification.persistent && (
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar for Auto-close */}
            {notification.autoClose && notification.autoClose > 0 && !notification.persistent && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all ease-linear',
                    notification.type === 'success' && 'bg-green-500',
                    notification.type === 'error' && 'bg-red-500',
                    notification.type === 'warning' && 'bg-yellow-500',
                    notification.type === 'achievement' && 'bg-yellow-500',
                    notification.type === 'info' && 'bg-blue-500'
                  )}
                  style={{
                    width: '100%',
                    animation: `shrink ${notification.autoClose}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={cn(
          'pointer-events-auto self-end mt-2 p-2 rounded-full transition-colors',
          soundEnabled 
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
        )}
        title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
      >
        <Zap className="w-4 h-4" />
      </button>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};