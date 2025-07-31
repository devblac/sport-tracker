/**
 * Gym Friends List Component
 * 
 * Displays user's friends with activity information and management options.
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  MessageCircle,
  UserMinus,
  Shield,
  Star,
  Flame,
  Trophy,
  Calendar,
  Clock,
  Activity,
  TrendingUp,
  Heart,
  Zap,
  MapPin
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { getFitnessLevelInfo, formatLastActive } from '@/utils/socialUtils';

import type { GymFriend } from '@/types/social';

interface GymFriendsListProps {
  userId: string;
  className?: string;
  showActivityFeed?: boolean;
  onFriendSelect?: (friend: GymFriend) => void;
}

export const GymFriendsList: React.FC<GymFriendsListProps> = ({
  userId,
  className = '',
  showActivityFeed = true,
  onFriendSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'streak' | 'level'>('activity');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const {
    friends,
    friendshipStats,
    removeFriend,
    blockUser,
    isLoading
  } = useSocial(userId);

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar a este amigo?')) {
      try {
        await removeFriend(friendId);
        setSelectedFriend(null);
      } catch (error) {
        console.error('Failed to remove friend:', error);
      }
    }
  };

  const handleBlockUser = async (friendId: string) => {
    if (confirm('¿Estás seguro de que quieres bloquear a este usuario?')) {
      try {
        await blockUser(friendId);
        setSelectedFriend(null);
      } catch (error) {
        console.error('Failed to block user:', error);
      }
    }
  };

  // Filter and sort friends
  const filteredFriends = friends
    .filter(friend => friend.status === 'accepted')
    .filter(friend => {
      if (showOnlineOnly && !friend.friend.isOnline) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          friend.friend.displayName.toLowerCase().includes(query) ||
          friend.friend.username.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.friend.displayName.localeCompare(b.friend.displayName);
        case 'activity':
          return new Date(b.friend.lastActiveAt).getTime() - new Date(a.friend.lastActiveAt).getTime();
        case 'streak':
          return b.friend.currentStreak - a.friend.currentStreak;
        case 'level':
          return b.friend.currentLevel - a.friend.currentLevel;
        default:
          return 0;
      }
    });

  const getConnectionStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
    if (strength >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
    if (strength >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getActivityIcon = (lastActive: Date) => {
    const hoursAgo = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 1) return <Zap className="w-4 h-4 text-green-500" />;
    if (hoursAgo < 24) return <Activity className="w-4 h-4 text-blue-500" />;
    if (hoursAgo < 168) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gym Buddies
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {friendshipStats?.totalFriends || 0} amigos • {friendshipStats?.onlineFriends || 0} en línea
            </p>
          </div>
        </div>

        {friendshipStats && (
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4" />
              <span>{friendshipStats.recentlyActive} activos</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{Math.round(friendshipStats.connectionStrengthAverage)}% conexión</span>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar amigos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="activity">Actividad</option>
            <option value="name">Nombre</option>
            <option value="streak">Racha</option>
            <option value="level">Nivel</option>
          </select>

          <button
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              showOnlineOnly
                ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="space-y-3">
        {filteredFriends.map((friend, index) => {
            const fitnessInfo = getFitnessLevelInfo(friend.friend.fitnessLevel);
            const connectionColor = getConnectionStrengthColor(friend.connectionStrength);
            
            return (
              <div
                key={friend.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onFriendSelect?.(friend)}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {friend.friend.avatar ? (
                        <img 
                          src={friend.friend.avatar} 
                          alt={friend.friend.displayName} 
                          className="w-12 h-12 rounded-full object-cover" 
                        />
                      ) : (
                        friend.friend.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {friend.friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {friend.friend.displayName}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        @{friend.friend.username}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {/* Fitness Level */}
                      <div className={`px-2 py-1 rounded-full ${fitnessInfo.color}`}>
                        <span>{fitnessInfo.icon} {fitnessInfo.label}</span>
                      </div>

                      {/* Level */}
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Nivel {friend.friend.currentLevel}</span>
                      </div>

                      {/* Streak */}
                      <div className="flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span>{friend.friend.currentStreak} días</span>
                      </div>

                      {/* Last Active */}
                      <div className="flex items-center space-x-1">
                        {getActivityIcon(friend.friend.lastActiveAt)}
                        <span>{formatLastActive(friend.friend.lastActiveAt)}</span>
                      </div>
                    </div>

                    {/* Connection Info */}
                    <div className="flex items-center space-x-4 text-xs">
                      <div className={`px-2 py-1 rounded-full ${connectionColor}`}>
                        <span>Conexión {friend.connectionStrength}%</span>
                      </div>

                      {friend.sharedWorkouts > 0 && (
                        <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                          <Trophy className="w-3 h-3" />
                          <span>{friend.sharedWorkouts} entrenamientos juntos</span>
                        </div>
                      )}

                      {friend.mutualFriends > 0 && (
                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                          <Users className="w-3 h-3" />
                          <span>{friend.mutualFriends} amigos en común</span>
                        </div>
                      )}
                    </div>

                    {/* Common Interests */}
                    {friend.commonInterests.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {friend.commonInterests.slice(0, 3).map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                        {friend.commonInterests.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">
                            +{friend.commonInterests.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Menu */}
                  <div className="flex-shrink-0 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFriend(selectedFriend === friend.id ? null : friend.id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {selectedFriend === friend.id && (
                      <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle message action
                            setSelectedFriend(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Enviar mensaje</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(friend.friendId);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Eliminar amigo</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockUser(friend.friendId);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Bloquear usuario</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity Preview */}
                {showActivityFeed && friend.lastInteraction && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>Última interacción: {formatLastActive(friend.lastInteraction)}</span>
                      <span>•</span>
                      <span>{friend.totalInteractions} interacciones totales</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Empty State */}
      {filteredFriends.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery.trim() ? 'No se encontraron amigos' : 'Aún no tienes gym buddies'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery.trim() 
              ? 'Intenta con diferentes términos de búsqueda'
              : 'Busca usuarios y envía solicitudes de amistad para comenzar'
            }
          </p>
        </div>
      )}

      {/* Click outside to close menu */}
      {selectedFriend && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setSelectedFriend(null)}
        />
      )}
    </div>
  );
};

export default GymFriendsList;