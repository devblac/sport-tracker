/**
 * Real-time Activity Feed Component
 * 
 * Shows live friend activity updates with efficient subscription management.
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  Users, 
  Heart, 
  MessageCircle,
  Trophy,
  Flame,
  Star,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { realSocialService } from '@/services/RealSocialService';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { SocialPost } from '@/types/socialPosts';

interface ActivityItem {
  id: string;
  type: 'friend_post' | 'friend_like' | 'friend_comment' | 'friend_achievement';
  user: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  content: string;
  data?: any;
  timestamp: Date;
}

interface RealTimeActivityFeedProps {
  className?: string;
  maxItems?: number;
  autoScroll?: boolean;
}

export const RealTimeActivityFeed: React.FC<RealTimeActivityFeedProps> = ({
  className = '',
  maxItems = 20,
  autoScroll = true
}) => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [newActivityCount, setNewActivityCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Track visibility for smart updates
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
      if (!document.hidden) {
        setNewActivityCount(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Initialize real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const subscriptionId = realSocialService.subscribeToFriendActivity(
      user.id,
      (activity: any) => {
        const activityItem: ActivityItem = {
          id: `${activity.type}_${activity.data.id}_${Date.now()}`,
          type: activity.type,
          user: activity.data.user || {
            id: activity.data.user_id,
            display_name: 'Usuario',
            username: 'usuario',
            avatar_url: undefined
          },
          content: generateActivityContent(activity),
          data: activity.data,
          timestamp: activity.timestamp
        };

        setActivities(prev => {
          const newActivities = [activityItem, ...prev.slice(0, maxItems - 1)];
          return newActivities;
        });

        // Update new activity count if not visible
        if (!isVisible) {
          setNewActivityCount(prev => prev + 1);
        }

        // Auto-scroll to top if enabled and visible
        if (autoScroll && isVisible && feedRef.current) {
          feedRef.current.scrollTop = 0;
        }
      }
    );

    setSubscriptionId(subscriptionId);
    setIsConnected(true);

    // Cleanup subscription
    return () => {
      if (subscriptionId) {
        realSocialService.unsubscribe(subscriptionId);
        setIsConnected(false);
      }
    };
  }, [user?.id, maxItems, autoScroll, isVisible]);

  const generateActivityContent = (activity: any): string => {
    switch (activity.type) {
      case 'friend_post':
        const post = activity.data as SocialPost;
        switch (post.type) {
          case 'workout_completed':
            return 'completó un entrenamiento';
          case 'achievement_unlocked':
            return 'desbloqueó un logro';
          case 'personal_record':
            return 'estableció un récord personal';
          case 'level_up':
            return 'subió de nivel';
          case 'streak_milestone':
            return 'alcanzó un hito de racha';
          default:
            return 'publicó algo nuevo';
        }
      case 'friend_like':
        return 'le gustó una publicación';
      case 'friend_comment':
        return 'comentó en una publicación';
      case 'friend_achievement':
        return 'desbloqueó un logro';
      default:
        return 'tuvo actividad';
    }
  };

  const getActivityIcon = (type: string, postType?: string) => {
    switch (type) {
      case 'friend_post':
        switch (postType) {
          case 'workout_completed':
            return <Activity className="w-4 h-4 text-blue-500" />;
          case 'achievement_unlocked':
            return <Trophy className="w-4 h-4 text-yellow-500" />;
          case 'personal_record':
            return <Flame className="w-4 h-4 text-red-500" />;
          case 'level_up':
            return <Star className="w-4 h-4 text-purple-500" />;
          case 'streak_milestone':
            return <Flame className="w-4 h-4 text-orange-500" />;
          default:
            return <MessageCircle className="w-4 h-4 text-gray-500" />;
        }
      case 'friend_like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'friend_comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'friend_achievement':
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const scrollToTop = () => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
    setNewActivityCount(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-purple-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad en Vivo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actividad reciente de tus gym buddies
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm">
              <Wifi className="w-4 h-4" />
              <span>En vivo</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Desconectado</span>
            </div>
          )}
        </div>
      </div>

      {/* New Activity Indicator */}
      {newActivityCount > 0 && (
        <button
          onClick={scrollToTop}
          className="w-full py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          {newActivityCount} nueva{newActivityCount > 1 ? 's' : ''} actividad{newActivityCount > 1 ? 'es' : ''}
        </button>
      )}

      {/* Activity Feed */}
      <div
        ref={feedRef}
        className="space-y-3 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index === 0 ? 'animate-fadeIn' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* User Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {activity.user.avatar_url ? (
                    <img 
                      src={activity.user.avatar_url} 
                      alt={activity.user.display_name} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  ) : (
                    activity.user.display_name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {activity.user.display_name}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {activity.content}
                    </span>
                  </div>

                  {/* Activity Details */}
                  {activity.data && activity.type === 'friend_post' && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                        {activity.data.content}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>

                {/* Activity Icon */}
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type, activity.data?.type)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay actividad reciente
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              La actividad de tus amigos aparecerá aquí en tiempo real
            </p>
          </div>
        )}
      </div>

      {/* Activity Stats */}
      {activities.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>{activities.length} actividades</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Última: {formatDistanceToNow(activities[0]?.timestamp || new Date(), { locale: es })}</span>
              </div>
            </div>
            
            {isConnected && (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Actualizando</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeActivityFeed;