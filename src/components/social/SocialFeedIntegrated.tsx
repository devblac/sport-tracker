/**
 * Integrated Social Feed Component
 * 
 * Real social feed connected to Supabase with friend filtering and real-time updates.
 */

import React, { useEffect, useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { useSocialStore } from '@/stores/useSocialStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { SocialPost } from '@/types/socialPosts';

interface SocialFeedIntegratedProps {
  className?: string;
  showCreatePost?: boolean;
}

export const SocialFeedIntegrated: React.FC<SocialFeedIntegratedProps> = ({
  className = '',
  showCreatePost = true
}) => {
  const { user } = useAuthStore();
  const {
    socialFeed,
    feedLoading,
    feedError,
    feedHasMore,
    loadSocialFeed,
    likePost,
    unlikePost,
    subscribeToSocialFeed,
    unsubscribeAll
  } = useSocialStore();

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Load initial feed
  useEffect(() => {
    if (user?.id) {
      loadSocialFeed(user.id, true);
    }
  }, [user?.id, loadSocialFeed]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (user?.id && !subscriptionId) {
      const id = subscribeToSocialFeed(user.id);
      setSubscriptionId(id);
    }

    return () => {
      if (subscriptionId) {
        unsubscribeAll();
      }
    };
  }, [user?.id, subscriptionId, subscribeToSocialFeed, unsubscribeAll]);

  const handleLikePost = async (post: SocialPost) => {
    if (!user?.id) return;

    try {
      const isLiked = likedPosts.has(post.id);
      
      if (isLiked) {
        await unlikePost(user.id, post.id);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(post.id);
          return newSet;
        });
      } else {
        await likePost(user.id, post.id);
        setLikedPosts(prev => new Set(prev).add(post.id));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleLoadMore = () => {
    if (user?.id && feedHasMore && !feedLoading) {
      loadSocialFeed(user.id, false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return '💪';
      case 'achievement_unlocked':
        return '🏆';
      case 'personal_record':
        return '🔥';
      case 'level_up':
        return '⬆️';
      case 'streak_milestone':
        return '🔥';
      default:
        return '📝';
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'workout_completed':
        return 'Entrenamiento completado';
      case 'achievement_unlocked':
        return 'Logro desbloqueado';
      case 'personal_record':
        return 'Récord personal';
      case 'level_up':
        return 'Subió de nivel';
      case 'streak_milestone':
        return 'Hito de racha';
      default:
        return 'Publicación';
    }
  };

  if (feedError) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-red-500 mb-4">
          <MessageCircle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error al cargar el feed</h3>
          <p className="text-sm">{feedError}</p>
        </div>
        <button
          onClick={() => user?.id && loadSocialFeed(user.id, true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Feed Social
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actividad de tus gym buddies
            </p>
          </div>
        </div>

        {subscriptionId && (
          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>En vivo</span>
          </div>
        )}
      </div>

      {/* Create Post Section */}
      {showCreatePost && user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <button className="w-full text-left px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                ¿Qué tal fue tu entrenamiento?
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-4">
        {socialFeed.map((post) => {
          const isLiked = likedPosts.has(post.id);
          
          return (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.user?.avatar_url ? (
                        <img 
                          src={post.user.avatar_url} 
                          alt={post.user.display_name} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        post.user?.display_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {post.user?.display_name || 'Usuario'}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          @{post.user?.username || 'usuario'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{getPostTypeIcon(post.type)}</span>
                        <span>{getPostTypeLabel(post.type)}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(post.created_at, { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-gray-900 dark:text-white">
                  {post.content}
                </p>
                
                {/* Post Data */}
                {post.data && Object.keys(post.data).length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {JSON.stringify(post.data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Images */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {post.image_urls.slice(0, 4).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLikePost(post)}
                      className={`flex items-center space-x-2 transition-colors ${
                        isLiked
                          ? 'text-red-500 hover:text-red-600'
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes_count}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm">{post.shares_count}</span>
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {post.visibility === 'public' ? '🌍 Público' : 
                     post.visibility === 'friends' ? '👥 Amigos' : '🔒 Privado'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading State */}
      {feedLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Cargando posts...
          </span>
        </div>
      )}

      {/* Load More Button */}
      {feedHasMore && !feedLoading && socialFeed.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Cargar más posts
          </button>
        </div>
      )}

      {/* Empty State */}
      {!feedLoading && socialFeed.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay posts en tu feed
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Agrega amigos para ver su actividad aquí
          </p>
        </div>
      )}
    </div>
  );
};

export default SocialFeedIntegrated;