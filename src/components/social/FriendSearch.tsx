/**
 * Friend Search Component
 * 
 * Allows users to search for other users and send friend requests.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  UserPlus, 
  UserCheck, 
  UserX,
  Clock,
  Shield,
  X,
  Loader2
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { getFitnessLevelInfo, formatLastActive } from '@/utils/socialUtils';

import type { UserProfile, UserSearchQuery } from '@/types/social';

interface FriendSearchProps {
  userId: string;
  className?: string;
  onUserSelect?: (user: UserProfile) => void;
}

export const FriendSearch: React.FC<FriendSearchProps> = ({
  userId,
  className = '',
  onUserSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<UserSearchQuery>>({
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const {
    searchUsers,
    friendSuggestions,
    sendFriendRequest,
    getFriendship,
    isSearching,
    isSendingRequest
  } = useSocial(userId);

  // Debounced search
  const debouncedSearch = useCallback(
    async (query: string, searchFilters: Partial<UserSearchQuery>) => {
      if (query.trim().length < 2 && !Object.keys(searchFilters).length) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchUsers({
          query: query.trim() || undefined,
          ...searchFilters,
          limit: 20
        });
        setSearchResults(results.users);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      }
    },
    [searchUsers]
  );

  // Effect for debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      debouncedSearch(searchQuery, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters, debouncedSearch]);

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await sendFriendRequest(targetUserId, `¡Hola! Me gustaría ser tu gym buddy.`);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const getFriendshipStatus = (targetUserId: string) => {
    const friendship = getFriendship(targetUserId);
    return friendship?.status;
  };

  const getActionButton = (user: UserProfile) => {
    const status = getFriendshipStatus(user.id);
    
    switch (status) {
      case 'accepted':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <UserCheck className="w-4 h-4" />
            <span>Amigos</span>
          </div>
        );
      
      case 'pending_sent':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>Enviada</span>
          </div>
        );
      
      case 'pending_received':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>Pendiente</span>
          </div>
        );
      
      case 'blocked':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            <UserX className="w-4 h-4" />
            <span>Bloqueado</span>
          </div>
        );
      
      case 'blocked_by':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            <Shield className="w-4 h-4" />
            <span>No disponible</span>
          </div>
        );
      
      default:
        return (
          <button
            onClick={() => handleSendFriendRequest(user.id)}
            disabled={isSendingRequest}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSendingRequest ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>Agregar</span>
          </button>
        );
    }
  };

  const displayUsers = searchQuery.trim().length >= 2 || Object.keys(filters).length > 1 
    ? searchResults 
    : friendSuggestions.slice(0, 10);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Header */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Filters Panel */}
        {showFilters && (
          <div
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">Filtros de Búsqueda</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fitness Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel de Fitness
                </label>
                <select
                  value={filters.fitnessLevel?.[0] || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    fitnessLevel: e.target.value ? [e.target.value as any] : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos los niveles</option>
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="expert">Experto</option>
                </select>
              </div>

              {/* Online Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filters.isOnline === undefined ? '' : filters.isOnline.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    isOnline: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="true">En línea</option>
                  <option value="false">Desconectado</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy || 'relevance'}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="level">Nivel</option>
                  <option value="streak">Racha</option>
                  <option value="recent_activity">Actividad reciente</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => setFilters({ sortBy: 'relevance', sortOrder: 'desc' })}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {searchQuery.trim().length >= 2 ? 'Resultados de Búsqueda' : 'Sugerencias de Amistad'}
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {displayUsers.length} usuario{displayUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* User Results */}
      <div className="space-y-3">
          {displayUsers.map((user, index) => {
            const fitnessInfo = getFitnessLevelInfo(user.fitnessLevel);
            
            return (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onUserSelect?.(user)}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        user.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.displayName}
                      </h4>
                      {user.isVerified && (
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                          <span className="text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      @{user.username}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {/* Fitness Level */}
                      <div className={`px-2 py-1 rounded-full ${fitnessInfo.color}`}>
                        <span>{fitnessInfo.icon} {fitnessInfo.label}</span>
                      </div>

                      {/* Level */}
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Nivel {user.stats.currentLevel}</span>
                      </div>

                      {/* Location */}
                      {user.location && user.privacy.showLocation && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{user.location}</span>
                        </div>
                      )}

                      {/* Last Active */}
                      <span>{formatLastActive(user.lastActiveAt)}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {getActionButton(user)}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {user.bio}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Empty State */}
      {displayUsers.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery.trim().length >= 2 ? 'No se encontraron usuarios' : 'No hay sugerencias disponibles'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery.trim().length >= 2 
              ? 'Intenta con diferentes términos de búsqueda o ajusta los filtros'
              : 'Completa tu perfil para recibir mejores sugerencias de amistad'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FriendSearch;