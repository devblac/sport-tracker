/**
 * Social Post Component
 * 
 * Individual social post display with engagement features (likes, comments).
 */

import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Trophy,
  Flame,
  TrendingUp,
  Target,
  ArrowUp,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  Globe,
  Users,
  Lock,
  Calendar,
  Clock
} from 'lucide-react';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { sanitizeUserContent } from '@/utils/xssProtection';

import type { SocialPost, PostType } from '@/types/socialPosts';

interface SocialPostProps {
  post: SocialPost;
  currentUserId: string;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatar?: string;
    currentLevel: number;
  };
  onEdit?: (post: SocialPost) => void;
  onShare?: (post: SocialPost) => void;
  className?: string;
}

export const SocialPostComponent: React.FC<SocialPostProps> = ({
  post,
  currentUserId,
  author,
  onEdit,
  onShare,
  className = ''
}) => {
  const {
    likePost,
    unlikePost,
    hasUserLikedPost,
    getPostLikes,
    addComment,
    getPostComments,
    deletePost,
    updatePost
  } = useSocialPosts(currentUserId);

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isOwnPost = post.userId === currentUserId;
  const hasLiked = hasUserLikedPost(post.id);
  const likes = getPostLikes(post.id);
  const comments = getPostComments(post.id);

  const handleLike = async () => {
    try {
      if (hasLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      await addComment(post.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;

    try {
      await deletePost(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleTogglePin = async () => {
    try {
      await updatePost(post.id, { isPinned: !post.isPinned });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const getPostTypeIcon = (type: PostType) => {
    switch (type) {
      case 'workout_completed':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'achievement_unlocked':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'personal_record':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'streak_milestone':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'level_up':
        return <ArrowUp className="w-5 h-5 text-purple-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'friends':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'private':
        return <Lock className="w-4 h-4 text-red-500" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return new Intl.DateTimeFormat('es-ES', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Post Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Author Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {author.avatar ? (
                <img 
                  src={author.avatar} 
                  alt={author.displayName} 
                  className="w-10 h-10 rounded-full object-cover" 
                />
              ) : (
                author.displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Author Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {author.displayName}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  @{author.username}
                </span>
                <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                  <ArrowUp className="w-3 h-3" />
                  <span>{author.currentLevel}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatTimeAgo(post.createdAt)}</span>
                {post.isEdited && (
                  <>
                    <span>•</span>
                    <span>editado</span>
                  </>
                )}
                <span>•</span>
                {getVisibilityIcon()}
              </div>
            </div>
          </div>

          {/* Post Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
                {isOwnPost && (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(post);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleTogglePin();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      <span>{post.isPinned ? 'Desfijar' : 'Fijar'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => {
                    onShare?.(post);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Indicator */}
        {post.isPinned && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
            <Pin className="w-3 h-3" />
            <span>Post fijado</span>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <div className="flex items-start space-x-3">
          {/* Post Type Icon */}
          <div className="flex-shrink-0 mt-1">
            {getPostTypeIcon(post.type)}
          </div>

          {/* Post Text */}
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
              {post.title}
            </h3>
            
            {post.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {sanitizeUserContent(post.description)}
              </p>
            )}

            {/* Post-specific content based on type */}
            {post.type === 'workout_completed' && post.data.type === 'workout_completed' && (
              <div className="mt-2 flex flex-wrap gap-2">
                {post.data.personalRecords && post.data.personalRecords.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <Trophy className="w-3 h-3 mr-1" />
                    {post.data.personalRecords.length} PR{post.data.personalRecords.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {post.type === 'achievement_unlocked' && post.data.type === 'achievement_unlocked' && (
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  post.data.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  post.data.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                  post.data.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {post.data.rarity.charAt(0).toUpperCase() + post.data.rarity.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full rounded-lg max-h-96 object-cover"
          />
        </div>
      )}

      {/* Engagement Bar */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors ${
                hasLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likesCount}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.commentsCount}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => onShare?.(post)}
              className="flex items-center space-x-2 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">{post.sharesCount}</span>
            </button>
          </div>

          {/* Timestamp */}
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {sanitizeUserContent(comment.content)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(comment.createdAt)}</span>
                      {comment.isEdited && (
                        <>
                          <span>•</span>
                          <span>editado</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {currentUserId.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  disabled={isSubmittingComment}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default SocialPostComponent;