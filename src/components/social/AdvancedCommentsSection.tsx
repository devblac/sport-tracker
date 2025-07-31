/**
 * Advanced Comments Section Component
 * 
 * Main component for displaying and managing advanced comments with nested replies, likes, and mentions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  AtSign, 
  Smile,
  Image,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Heart
} from 'lucide-react';
import { AdvancedCommentThread } from './AdvancedCommentThread';
import { useAdvancedComments } from '@/hooks/useAdvancedComments';

import type { CommentFormData, MentionSuggestion, CommentStats } from '@/types/comments';

interface AdvancedCommentsSectionProps {
  postId: string;
  currentUserId: string;
  initialCommentsCount?: number;
  className?: string;
}

export const AdvancedCommentsSection: React.FC<AdvancedCommentsSectionProps> = ({
  postId,
  currentUserId,
  initialCommentsCount = 0,
  className = ''
}) => {
  const {
    commentThreads,
    loadCommentThreads,
    createComment,
    getMentionSuggestions,
    parseComment,
    validateComment,
    commentStats,
    loadCommentStats,
    isLoading,
    isLoadingMore,
    error,
    hasMoreComments
  } = useAdvancedComments(currentUserId);

  const [newCommentContent, setNewCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Load comments when component mounts or postId changes
  useEffect(() => {
    if (showComments && postId) {
      loadCommentThreads(postId);
      loadCommentStats(postId);
    }
  }, [showComments, postId, loadCommentThreads, loadCommentStats]);

  // Handle new comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const parsed = parseComment(newCommentContent);
      const validation = validateComment(newCommentContent, parsed.mentions);
      
      if (!validation.isValid) {
        alert(`Error: ${validation.errors.join(', ')}`);
        return;
      }

      const formData: CommentFormData = {
        content: newCommentContent.trim(),
        mentions: parsed.mentions
      };

      await createComment(postId, formData);
      setNewCommentContent('');
      
      // Reload stats after new comment
      await loadCommentStats(postId);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mention input
  const handleMentionInput = async (content: string, cursorPos: number) => {
    const textBeforeCursor = content.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      
      if (query.length > 0) {
        try {
          const suggestions = await getMentionSuggestions(query);
          setMentionSuggestions(suggestions);
          setShowMentions(suggestions.length > 0);
        } catch (error) {
          console.error('Failed to get mention suggestions:', error);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (suggestion: MentionSuggestion) => {
    if (!commentInputRef.current) return;

    const input = commentInputRef.current;
    const content = input.value;
    const cursorPos = input.selectionStart || 0;
    
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const newContent = `${beforeMention}@${suggestion.username} ${textAfterCursor}`;
      
      setNewCommentContent(newContent);
      setShowMentions(false);
      
      // Set cursor position after mention
      setTimeout(() => {
        const newCursorPos = beforeMention.length + suggestion.username.length + 2;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);
    }
  };

  // Load more comments
  const handleLoadMore = async () => {
    if (hasMoreComments && !isLoadingMore) {
      await loadCommentThreads(postId, 20, commentThreads.length);
    }
  };

  // Toggle comments visibility
  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  // Format comment count
  const formatCommentCount = (count: number) => {
    if (count === 0) return 'Sin comentarios';
    if (count === 1) return '1 comentario';
    return `${count} comentarios`;
  };

  const totalComments = commentStats?.totalComments || initialCommentsCount;

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Comments Header */}
      <div className="px-4 py-3">
        <button
          onClick={handleToggleComments}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">{formatCommentCount(totalComments)}</span>
          {commentStats && (
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{commentStats.totalLikes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{commentStats.engagementRate.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4">
          {/* New Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="relative">
              <textarea
                ref={commentInputRef}
                value={newCommentContent}
                onChange={(e) => {
                  setNewCommentContent(e.target.value);
                  setCursorPosition(e.target.selectionStart || 0);
                  handleMentionInput(e.target.value, e.target.selectionStart || 0);
                }}
                onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
                placeholder="Escribe un comentario..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              {/* Mention Suggestions */}
              {showMentions && mentionSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleMentionSelect(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {suggestion.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {suggestion.displayName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          @{suggestion.username} • Lv.{suggestion.currentLevel}
                        </p>
                      </div>
                      {suggestion.isOnline && (
                        <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <AtSign className="w-3 h-3" />
                <span>@ para mencionar usuarios</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Añadir emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Añadir imagen"
                >
                  <Image className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!newCommentContent.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando...' : 'Comentar'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Comments Sort Options */}
          {commentThreads.length > 0 && (
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <button
                  onClick={() => setSortBy('newest')}
                  className={`text-sm font-medium transition-colors ${
                    sortBy === 'newest'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Más recientes
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`text-sm font-medium transition-colors ${
                    sortBy === 'popular'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Más populares
                </button>
                <button
                  onClick={() => setSortBy('oldest')}
                  className={`text-sm font-medium transition-colors ${
                    sortBy === 'oldest'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Más antiguos
                </button>
              </div>
              
              {commentStats && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {commentStats.totalReplies} respuestas • {commentStats.averageDepth.toFixed(1)} niveles promedio
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Comments List */}
          {!isLoading && (
            <div className="space-y-4">
              {commentThreads.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Sé el primero en comentar
                  </p>
                </div>
              ) : (
                <>
                  {commentThreads.map((thread) => (
                    <AdvancedCommentThread
                      key={thread.comment.id}
                      thread={thread}
                      currentUserId={currentUserId}
                      postId={postId}
                      className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMoreComments && (
                    <div className="text-center pt-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Cargando...</span>
                          </div>
                        ) : (
                          'Cargar más comentarios'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Comment Statistics */}
          {commentStats && commentStats.topContributors.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Principales contribuidores
              </h4>
              <div className="flex space-x-3">
                {commentStats.topContributors.slice(0, 3).map((contributor) => (
                  <div
                    key={contributor.userId}
                    className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {contributor.username.charAt(0).toUpperCase()}
                    </div>
                    <span>{contributor.username}</span>
                    <span className="text-gray-400">({contributor.commentCount})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};