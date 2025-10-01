/**
 * Integrated Friends Manager Component
 * 
 * Real friends management connected to Supabase with friend requests and search.
 */

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X,
  Loader2,
  Heart,
  MessageCircle
} from 'lucide-react';
import { useSocialStore } from '@/stores/useSocialStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { realSocialService } from '@/services/RealSocialService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { Friendship, FriendRequest } from '@/types/socialPosts';

interface FriendsManagerIntegratedProps {
  className?: string;
}

export const FriendsManagerIntegrated: React.FC<FriendsManagerIntegratedProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore();
  const {
    friends,
    friendsLoading,
    friendRequests,
    friendRequestsLoading,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadFriends(user.id);
      loadFriendRequests(user.id);
    }
  }, [user?.id, loadFriends, loadFriendRequests]);

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    try {
      setIsSearching(true);
      const results = await realSocialService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(targetUserId);
      await sendFriendRequest(user.id, targetUserId);
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(requestId);
      await acceptFriendRequest(user.id, requestId);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Reject friend request
  const handleRejectRequest = async (requestId: string) => {
    if (!user?.id) return;

    try {
      setProcessingRequest(requestId);
      await rejectFriendRequest(user.id, requestId);
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const renderFriendCard = (friendship: Friendship) => (
    <div
      key={friendship.id}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {friendship.friend.avatar_url ? (
            <img 
              src={friendship.friend.avatar_url} 
              alt={friendship.friend.display_name} 
              className="w-12 h-12 rounded-full object-cover" 
            />
          ) : (
            friendship.friend.display_name.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {friendship.friend.display_name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{friendship.friend.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Amigos desde {formatDistanceToNow(friendship.created_at, { locale: es })}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderFriendRequestCard = (request: FriendRequest) => (
    <div
      key={request.id}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {request.requester.avatar_url ? (
            <img 
              src={request.requester.avatar_url} 
              alt={request.requester.display_name} 
              className="w-12 h-12 rounded-full object-cover" 
            />
          ) : (
            request.requester.display_name.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {request.requester.display_name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{request.requester.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Hace {formatDistanceToNow(request.created_at, { locale: es })}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleAcceptRequest(request.id)}
            disabled={processingRequest === request.id}
            className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {processingRequest === request.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm">Aceptar</span>
          </button>
          
          <button
            onClick={() => handleRejectRequest(request.id)}
            disabled={processingRequest === request.id}
            className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Rechazar</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSearchResultCard = (user: any) => (
    <div
      key={user.id}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.display_name} 
              className="w-12 h-12 rounded-full object-cover" 
            />
          ) : (
            user.display_name.charAt(0).toUpperCase()
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {user.display_name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{user.username}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Nivel: {user.fitness_level}
          </p>
        </div>
        
        <button
          onClick={() => handleSendFriendRequest(user.id)}
          disabled={processingRequest === user.id}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {processingRequest === user.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          <span className="text-sm">Agregar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Gym Buddies
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {friends.length} amigos • {friendRequests.length} solicitudes pendientes
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'friends'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Amigos ({friends.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Solicitudes ({friendRequests.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Buscar</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {friendsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Cargando amigos...
              </span>
            </div>
          ) : friends.length > 0 ? (
            friends.map(renderFriendCard)
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aún no tienes gym buddies
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Busca usuarios y envía solicitudes de amistad
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {friendRequestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Cargando solicitudes...
              </span>
            </div>
          ) : friendRequests.length > 0 ? (
            friendRequests.map(renderFriendRequestCard)
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tienes solicitudes pendientes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Las solicitudes de amistad aparecerán aquí
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar usuarios por nombre o username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  Buscando usuarios...
                </span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map(renderSearchResultCard)
            ) : searchQuery.trim() ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Intenta con diferentes términos de búsqueda
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Buscar nuevos gym buddies
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ingresa un nombre o username para buscar usuarios
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsManagerIntegrated;