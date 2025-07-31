/**
 * Social Feed Component
 * 
 * Infinite scrolling feed that displays posts from friends with temporal sorting and pagination.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Users,
  TrendingUp,
  Filter,
  ChevronDown
} from 'lucide-react';
import { SocialPostComponent } from './SocialPost';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useSocial } from '@/hooks/useSocial';

import type { SocialPost, PostType } from '@/types/socialPosts';
import type { GymFriend } from '@/types/social';

interface SocialFeedProps {
  userId: string;
  className?: string;
  pageSize?: number;
  showFilters?: boolean;
}

interface FeedItem {
  post: SocialPost;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    currentLevel: number;
    isOnline: boolean;
  };
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  userId,
  className = '',
  pageSize = 10,
  showFilters = true
}) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Filters
  const [selectedPostTypes, setSelectedPostTypes] = useState<PostType[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'friends'>('recent');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { friends } = useSocial(userId);
  const { feedPosts, loadFeed, refreshFeed } = useSocialPosts(userId);

  // Get friend IDs for feed loading
  const friendIds = friends
    .filter(friend => friend.status === 'accepted')
    .map(friend => friend.friendId);

  // Load initial feed
  useEffect(() => {
    loadInitialFeed();
  }, [userId, friendIds.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMorePosts && !isLoadingMore) {
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMorePosts, isLoadingMore]);

  const loadInitialFeed = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(0);

      if (friendIds.length === 0) {
        setFeedItems([]);
        setHasMorePosts(false);
        return;
      }

      await loadFeed(friendIds);
      const posts = await getFeedPosts(0, pageSize);
      
      setFeedItems(posts);
      setHasMorePosts(posts.length === pageSize);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      console.error('Failed to load initial feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;

    try {
      setIsLoadingMore(true);
      setError(null);

      const nextPage = currentPage + 1;
      const newPosts = await getFeedPosts(nextPage, pageSize);

      if (newPosts.length === 0) {
        setHasMorePosts(false);
      } else {
        setFeedItems(prev => [...prev, ...newPosts]);
        setCurrentPage(nextPage);
        setHasMorePosts(newPosts.length === pageSize);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
      console.error('Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getFeedPosts = async (page: number, limit: number): Promise<FeedItem[]> => {
    // Get posts from feed (this would normally come from the backend)
    // For now, we'll simulate pagination with the existing feedPosts
    let allPosts = [...feedPosts];

    // Apply filters
    if (selectedPostTypes.length > 0) {
      allPosts = allPosts.filter(post => selectedPostTypes.includes(post.type));
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        allPosts.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
        break;
      case 'friends':
        // Sort by friend activity level (could be based on interaction frequency)
        allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    // Paginate
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    // Convert to FeedItems with author information
    const feedItems: FeedItem[] = [];
    
    for (const post of paginatedPosts) {
      // Find author information from friends list
      const friendInfo = friends.find(friend => friend.friendId === post.userId);
      
      if (friendInfo) {
        feedItems.push({
          post,
          author: {
            id: friendInfo.friendId,
            displayName: friendInfo.friend.displayName,
            username: friendInfo.friend.username,
            avatar: friendInfo.friend.avatar,
            currentLevel: friendInfo.friend.currentLevel,
            isOnline: friendInfo.friend.isOnline
          }
        });
      }
    }

    return feedItems;
  };

  const handleRefresh = async () => {
    await loadInitialFeed();
    
    // Scroll to top
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePostTypeFilter = (postType: PostType) => {
    setSelectedPostTypes(prev => {
      const newTypes = prev.includes(postType)
        ? prev.filter(type => type !== postType)
        : [...prev, postType];
      
      // Reload feed with new filters
      setTimeout(() => loadInitialFeed(), 100);
      return newTypes;
    });
  };

  const handleSortChange = (newSort: 'recent' | 'popular' | 'friends') => {
    setSortBy(newSort);
    // Reload feed with new sorting
    setTimeout(() => loadInitialFeed(), 100);
  };

  const postTypeOptions = [
    { value: 'workout_completed', label: 'Entrenamientos', icon: '💪' },
    { value: 'achievement_unlocked', label: 'Logros', icon: '🏆' },
    { value: 'personal_record', label: 'Récords', icon: '🎯' },
    { value: 'streak_milestone', label: 'Rachas', icon: '🔥' },
    { value: 'level_up', label: 'Subidas de Nivel', icon: '⬆️' },
    { value: 'manual_post', label: 'Posts Manuales', icon: '💬' }
  ];

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando feed social...</p>
        </div>
      </div>
    );
  }

  if (friendIds.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No tienes amigos aún
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Agrega algunos gym friends para ver su actividad en el feed
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Feed Social
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actividad de tus {friendIds.length} gym friends
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-2 rounded-lg border transition-colors ${
                showFiltersPanel || selectedPostTypes.length > 0
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Last Refresh Info */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Última actualización: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          {/* Sort Options */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Ordenar por</h4>
            <div className="flex space-x-2">
              {[
                { value: 'recent', label: 'Más recientes' },
                { value: 'popular', label: 'Más populares' },
                { value: 'friends', label: 'Amigos activos' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value as any)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Post Type Filters */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tipos de posts</h4>
            <div className="flex flex-wrap gap-2">
              {postTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePostTypeFilter(option.value as PostType)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedPostTypes.includes(option.value as PostType)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Feed Content */}
      <div ref={feedContainerRef} className="space-y-6">
        {feedItems.length > 0 ? (
          <>
            {feedItems.map((item, index) => (
              <SocialPostComponent
                key={`${item.post.id}-${index}`}
                post={item.post}
                currentUserId={userId}
                author={item.author}
                onEdit={(post) => console.log('Edit post:', post)}
                onShare={(post) => console.log('Share post:', post)}
              />
            ))}

            {/* Load More Trigger */}
            {hasMorePosts && (
              <div
                ref={loadMoreRef}
                className="flex items-center justify-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Cargando más posts...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={loadMorePosts}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                    <span>Cargar más posts</span>
                  </button>
                )}
              </div>
            )}

            {/* End of Feed */}
            {!hasMorePosts && feedItems.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Has visto todos los posts recientes
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay posts en el feed
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tus amigos aún no han compartido actividad reciente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialFeed;