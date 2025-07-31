/**
 * Notification Center Component
 * 
 * Displays in-app notifications with actions and management features.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Trophy, 
  Flame, 
  Users, 
  BarChart3,
  X,
  Check,
  Archive,
  Trash2,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { InAppNotification, NotificationType } from '@/types/notifications';

interface NotificationCenterProps {
  userId: string;
  className?: string;
  maxNotifications?: number;
  showActions?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  className = '',
  maxNotifications = 20,
  showActions = true
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    isLoading
  } = useNotifications(userId);

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'workout_reminder':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'streak_reminder':
      case 'streak_at_risk':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'achievement_unlocked':
      case 'level_up':
      case 'milestone_reached':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'weekly_progress':
        return <BarChart3 className="w-5 h-5 text-purple-500" />;
      case 'friend_request':
      case 'friend_achievement':
      case 'challenge_invitation':
      case 'challenge_update':
        return <Users className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType, priority: string) => {
    if (priority === 'urgent') return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    if (priority === 'high') return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
    
    switch (type) {
      case 'workout_reminder':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'streak_reminder':
      case 'streak_at_risk':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'achievement_unlocked':
      case 'level_up':
      case 'milestone_reached':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'weekly_progress':
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'friend_request':
      case 'friend_achievement':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
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

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.isRead;
      return notification.type === filter;
    })
    .slice(0, maxNotifications);

  const handleNotificationClick = async (notification: InAppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Handle notification actions
    if (notification.data?.actionUrl) {
      // Navigate to action URL
      console.log('Navigate to:', notification.data.actionUrl);
    }
  };

  const handleActionClick = async (notification: InAppNotification, action: string) => {
    console.log('Action clicked:', action, notification.id);
    
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Handle specific actions
    switch (action) {
      case 'start_workout':
        // Navigate to workout
        break;
      case 'view_achievements':
        // Navigate to achievements
        break;
      case 'view_progress':
        // Navigate to progress
        break;
      case 'accept_friend':
        // Handle friend request
        break;
      case 'decline_friend':
        // Handle friend request
        break;
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center space-x-2">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Todas</option>
              <option value="unread">No leídas</option>
              <option value="workout_reminder">Entrenamientos</option>
              <option value="achievement_unlocked">Logros</option>
              <option value="streak_reminder">Rachas</option>
              <option value="friend_request">Social</option>
            </select>

            {/* Clear All */}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Limpiar Todo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {filter === 'unread' ? 'No hay notificaciones nuevas' : 'No hay notificaciones'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread' 
              ? 'Todas las notificaciones han sido leídas'
              : 'Las notificaciones aparecerán aquí cuando las recibas'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md
                  ${getNotificationColor(notification.type, notification.priority)}
                  ${notification.isRead ? 'opacity-75' : 'shadow-sm'}
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread Indicator */}
                {!notification.isRead && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.body}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(new Date(notification.timestamp))}
                        </span>
                        
                        {showActions && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(showMenu === notification.id ? null : notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            {showMenu === notification.id && (
                              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                      setShowMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Marcar leída</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Archive functionality would go here
                                    setShowMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Archive className="w-4 h-4" />
                                  <span>Archivar</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.actions.map((action) => (
                          <button
                            key={action.action}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(notification, action.action);
                            }}
                            className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.title}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Priority Badge */}
                    {notification.priority === 'urgent' && (
                      <div className="mt-2">
                        <span className="inline-block text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                          Urgente
                        </span>
                      </div>
                    )}

                    {/* Expiration Warning */}
                    {notification.expiresAt && new Date(notification.expiresAt) > new Date() && (
                      <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                        ⏰ Expira: {new Date(notification.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Show More */}
      {notifications.length > maxNotifications && (
        <div className="text-center pt-4">
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            Ver más notificaciones ({notifications.length - maxNotifications} más)
          </button>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;