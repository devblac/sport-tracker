/**
 * Streak Reward Notifications Component
 * 
 * Displays notifications for streak milestones, titles, and rewards.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakRewards } from '@/hooks/useStreakRewards';

interface StreakRewardNotificationsProps {
  userId: string;
  className?: string;
  maxNotifications?: number;
  showOnlyUnread?: boolean;
}

export const StreakRewardNotifications: React.FC<StreakRewardNotificationsProps> = ({
  userId,
  className = '',
  maxNotifications = 5,
  showOnlyUnread = false
}) => {
  const {
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    isLoading
  } = useStreakRewards(userId);

  const filteredNotifications = showOnlyUnread 
    ? notifications.filter(notif => !notif.isRead)
    : notifications;

  const displayNotifications = filteredNotifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxNotifications);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-l-gray-400';
      case 'uncommon': return 'border-l-green-400';
      case 'rare': return 'border-l-blue-400';
      case 'epic': return 'border-l-purple-400';
      case 'legendary': return 'border-l-yellow-400';
      case 'mythic': return 'border-l-red-400';
      default: return 'border-l-gray-400';
    }
  };

  const getRarityBg = (rarity: string, isRead: boolean) => {
    const opacity = isRead ? '10' : '20';
    switch (rarity) {
      case 'common': return `bg-gray-50/${opacity} dark:bg-gray-800/${opacity}`;
      case 'uncommon': return `bg-green-50/${opacity} dark:bg-green-900/${opacity}`;
      case 'rare': return `bg-blue-50/${opacity} dark:bg-blue-900/${opacity}`;
      case 'epic': return `bg-purple-50/${opacity} dark:bg-purple-900/${opacity}`;
      case 'legendary': return `bg-yellow-50/${opacity} dark:bg-yellow-900/${opacity}`;
      case 'mythic': return `bg-red-50/${opacity} dark:bg-red-900/${opacity}`;
      default: return `bg-gray-50/${opacity} dark:bg-gray-800/${opacity}`;
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🏆';
      case 'title': return '🎖️';
      case 'shield': return '🛡️';
      case 'warning': return '⚠️';
      default: return '🔔';
    }
  };

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    await markNotificationAsRead(notificationId);
    
    if (actionUrl) {
      // Navigate to action URL (would need router integration)
      console.log('Navigate to:', actionUrl);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (displayNotifications.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">🔔</div>
        <h3 className="text-lg font-semibold mb-2">
          {showOnlyUnread ? 'No hay notificaciones nuevas' : 'No hay notificaciones'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {showOnlyUnread 
            ? 'Todas las notificaciones han sido leídas'
            : 'Las notificaciones de recompensas aparecerán aquí'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Unread Counter */}
      {unreadNotifications > 0 && !showOnlyUnread && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notificaciones</h3>
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadNotifications} nuevas
          </div>
        </div>
      )}

      {/* Notifications List */}
      <AnimatePresence>
        {displayNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`
              relative p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md
              ${getRarityColor(notification.rarity)}
              ${getRarityBg(notification.rarity, notification.isRead)}
              ${notification.isRead ? 'opacity-75' : 'shadow-sm'}
            `}
            onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
          >
            {/* Unread Indicator */}
            {!notification.isRead && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}

            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                <span className="text-2xl">{notification.icon || getNotificationTypeIcon(notification.type)}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : ''}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(notification.createdAt))}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                {notification.actionRequired && notification.actionText && (
                  <div className="mt-3">
                    <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                      {notification.actionText}
                    </button>
                  </div>
                )}

                {/* Rarity Badge */}
                <div className="mt-2">
                  <span className={`inline-block text-xs px-2 py-1 rounded-full capitalize ${
                    notification.rarity === 'common' ? 'bg-gray-200 text-gray-800' :
                    notification.rarity === 'uncommon' ? 'bg-green-200 text-green-800' :
                    notification.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                    notification.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                    notification.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                    notification.rarity === 'mythic' ? 'bg-red-200 text-red-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {notification.rarity}
                  </span>
                </div>
              </div>
            </div>

            {/* Expiration Warning */}
            {notification.expiresAt && new Date(notification.expiresAt) > new Date() && (
              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                ⏰ Expira: {new Date(notification.expiresAt).toLocaleDateString()}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show More Link */}
      {filteredNotifications.length > maxNotifications && (
        <div className="text-center pt-4">
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            Ver todas las notificaciones ({filteredNotifications.length - maxNotifications} más)
          </button>
        </div>
      )}
    </div>
  );
};

export default StreakRewardNotifications;