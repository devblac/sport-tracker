/**
 * Real-time Notifications Component
 * 
 * Displays live notifications for social interactions and friend activities.
 */

import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Users,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { realSocialService } from '@/services/RealSocialService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocialStore } from '@/stores/useSocialStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { FriendRequest, PostLike, PostComment } from '@/types/socialPosts';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_activity';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  isRead: boolean;
}

interface RealTimeNotificationsProps {
  className?: string;
  maxNotifications?: number;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  className = '',
  maxNotifications = 10
}) => {
  const { user } = useAuthStore();
  const { acceptFriendRequest, rejectFriendRequest } = useSocialStore();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const subs: string[] = [];

    // Subscribe to friend requests
    const friendRequestSub = realSocialService.subscribeToFriendRequests(
      user.id,
      (request: FriendRequest) => {
        const notification: Notification = {
          id: `friend_request_${request.id}`,
          type: 'friend_request',
          title: 'Nueva solicitud de amistad',
          message: `${request.requester.display_name} te envió una solicitud de amistad`,
          timestamp: new Date(),
          data: request,
          isRead: false
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
      }
    );
    subs.push(friendRequestSub);

    // Subscribe to friend activity
    const friendActivitySub = realSocialService.subscribeToFriendActivity(
      user.id,
      (activity: any) => {
        if (activity.type === 'friend_post') {
          const notification: Notification = {
            id: `friend_activity_${activity.data.id}`,
            type: 'friend_activity',
            title: 'Actividad de amigo',
            message: `${activity.data.user?.display_name} publicó algo nuevo`,
            timestamp: activity.timestamp,
            data: activity.data,
            isRead: false
          };
          
          setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
        }
      }
    );
    subs.push(friendActivitySub);

    setSubscriptions(subs);

    // Cleanup subscriptions on unmount
    return () => {
      subs.forEach(sub => realSocialService.unsubscribe(sub));
    };
  }, [user?.id, maxNotifications]);

  // Handle friend request acceptance
  const handleAcceptFriendRequest = async (request: FriendRequest) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(request.id);
      await acceptFriendRequest(user.id, request.id);
      
      // Mark notification as read and update message
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === `friend_request_${request.id}`
            ? { 
                ...notif, 
                isRead: true,
                message: `Aceptaste la solicitud de ${request.requester.display_name}`
              }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle friend request rejection
  const handleRejectFriendRequest = async (request: FriendRequest) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(request.id);
      await rejectFriendRequest(user.id, request.id);
      
      // Remove notification
      setNotifications(prev => 
        prev.filter(notif => notif.id !== `friend_request_${request.id}`)
      );
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'friend_activity':
        return <Users className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
      onClick={() => !notification.isRead && markAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(notification.timestamp, { 
                addSuffix: true, 
                locale: es 
              })}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>

          {/* Friend Request Actions */}
          {notification.type === 'friend_request' && !notification.isRead && notification.data && (
            <div className="flex space-x-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptFriendRequest(notification.data);
                }}
                disabled={processingRequest === notification.data.id}
                className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {processingRequest === notification.data.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>Aceptar</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectFriendRequest(notification.data);
                }}
                disabled={processingRequest === notification.data.id}
                className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                <span>Rechazar</span>
              </button>
            </div>
          )}
        </div>

        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notificaciones
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount} sin leer
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(renderNotification)
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay notificaciones
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Las notificaciones aparecerán aquí en tiempo real
                  </p>
                </div>
              )}
            </div>

            {/* Real-time Status */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Conectado en tiempo real</span>
                <span>•</span>
                <span>{subscriptions.length} suscripciones activas</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RealTimeNotifications;