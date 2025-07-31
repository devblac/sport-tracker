/**
 * Friend Request List Component
 * 
 * Displays and manages incoming and outgoing friend requests.
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Send,
  Star,
  MapPin,
  Users,
  Heart,
  Calendar,
  Loader2
} from 'lucide-react';
import { useSocial } from '@/hooks/useSocial';
import { getFitnessLevelInfo, formatLastActive } from '@/utils/socialUtils';

import type { FriendRequest } from '@/types/social';

interface FriendRequestListProps {
  userId: string;
  className?: string;
  showOutgoing?: boolean;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({
  userId,
  className = '',
  showOutgoing = false
}) => {
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const {
    friendRequests,
    respondToFriendRequest,
    cancelFriendRequest,
    isLoading
  } = useSocial(userId);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await respondToFriendRequest(requestId, 'accept');
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await respondToFriendRequest(requestId, 'decline');
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await cancelFriendRequest(requestId);
    } catch (error) {
      console.error('Failed to cancel friend request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const incomingRequests = friendRequests.filter(req => req.status === 'pending');
  const outgoingRequests = friendRequests.filter(req => req.status === 'pending'); // Would need separate tracking

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  const renderRequestCard = (request: FriendRequest, isOutgoing: boolean = false) => {
    const user = request.fromUser;
    const fitnessInfo = getFitnessLevelInfo(user.fitnessLevel);
    const isProcessing = processingRequest === request.id;

    return (
      <div
        key={request.id}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {user.displayName}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username}
              </span>
            </div>

            {/* User Stats */}
            <div className="flex items-center space-x-4 mb-2 text-xs text-gray-500 dark:text-gray-400">
              <div className={`px-2 py-1 rounded-full ${fitnessInfo.color}`}>
                <span>{fitnessInfo.icon} {fitnessInfo.label}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>Nivel {user.currentLevel}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{user.currentStreak} días</span>
              </div>
            </div>

            {/* Mutual Friends */}
            {user.mutualFriends > 0 && (
              <div className="flex items-center space-x-1 mb-2 text-xs text-blue-600 dark:text-blue-400">
                <Users className="w-3 h-3" />
                <span>{user.mutualFriends} amigo{user.mutualFriends > 1 ? 's' : ''} en común</span>
              </div>
            )}

            {/* Common Interests */}
            {user.commonInterests.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {user.commonInterests.slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                  {user.commonInterests.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">
                      +{user.commonInterests.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Request Message */}
            {request.message && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  "{request.message}"
                </p>
              </div>
            )}

            {/* Request Time */}
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{getTimeAgo(request.createdAt)}</span>
              {request.expiresAt && (
                <>
                  <span>•</span>
                  <span>Expira en {Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0">
            {isOutgoing ? (
              <button
                onClick={() => handleCancelRequest(request.id)}
                disabled={isProcessing}
                className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span className="text-sm">Cancelar</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span className="text-sm">Aceptar</span>
                </button>
                
                <button
                  onClick={() => handleDeclineRequest(request.id)}
                  disabled={isProcessing}
                  className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm">Rechazar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tabs */}
      {showOutgoing && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'incoming'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Recibidas ({incomingRequests.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'outgoing'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Enviadas ({outgoingRequests.length})</span>
          </button>
        </div>
      )}

      {/* Request List */}
      <div className="space-y-3">
          {activeTab === 'incoming' ? (
            incomingRequests.length > 0 ? (
              incomingRequests.map(request => renderRequestCard(request, false))
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tienes solicitudes pendientes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Las solicitudes de amistad aparecerán aquí
                </p>
              </div>
            )
          ) : (
            outgoingRequests.length > 0 ? (
              outgoingRequests.map(request => renderRequestCard(request, true))
            ) : (
              <div className="text-center py-12">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No has enviado solicitudes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Las solicitudes que envíes aparecerán aquí
                </p>
              </div>
            )
          )}
      </div>

      {/* Quick Stats */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                <UserPlus className="w-4 h-4" />
                <span>{incomingRequests.length} recibidas</span>
              </div>
              {showOutgoing && (
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <Send className="w-4 h-4" />
                  <span>{outgoingRequests.length} enviadas</span>
                </div>
              )}
            </div>
            
            <div className="text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendRequestList;