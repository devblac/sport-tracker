/**
 * Advanced Comment Thread Component
 * 
 * Component for displaying nested comment threads with likes, replies, and mentions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  AtSign,
  Send,
  X
} from 'lucide-react';
import { useAdvancedComments } from '@/hooks/useAdvancedComments';

import type { CommentThread, CommentFormData, MentionSuggestion } from '@/types/comments';

interface AdvancedCommentThreadProps {
  thread: CommentThread;
  currentUserId: string;
  postId: string;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentCommentId: string) => void;
  className?: string;
}

export const AdvancedCommentThread: React.FC<AdvancedCommentThreadProps> = ({
  thread,
  currentUserId,
  postId,
  depth = 0,
  maxDepth = 5,
  onReply,
  className = ''
}) => {
  const {
    likeComment,
    unlikeComment,
    hasUserLikedComment,
    createComment,
    updateComment,
    deleteComment,
    getMentionSuggestions,
    parseComment,
    validateComment
  } = useAdvancedComments(currentUserId);

  const [showReplies, setShowReplies] = useState(depth < 2); // Auto-expand first 2 levels
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(thread.comment.content);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const { comment, author, userInteraction, replies } = thread;
  const hasLiked = hasUserLikedComment(comment.id);
  const canNestDeeper = depth < maxDepth;

  // Handle like/unlike
  const handleLike = async () => {
    try {
      if (hasLiked) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const parsed = parseComment(replyContent);
      const validation = validateComment(replyContent, parsed.mentions);
      
      if (!validation.isValid) {
        alert(`Error: ${validation.errors.join(', ')}`);
        return;
      }

      const formData: CommentFormData = {
        content: replyContent.trim(),
        mentions: parsed.mentions,
        parentCommentId: comment.id
      };

      await createComment(postId, formData);
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true); // Show replies after adding one
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const parsed = parseComment(editContent);
      const validation = validateComment(editContent, parsed.mentions);
      
      if (!validation.isValid) {
        alert(`Error: ${validation.errors.join(', ')}`);
        return;
      }

      await updateComment(comment.id, editContent.trim(), parsed.mentions);
      setShowEditForm(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;

    try {
      await deleteComment(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // Handle mention input
  const handleMentionInput = async (content: string, cursorPos: number) => {
    const textBeforeCursor = content.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      
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
  const handleMentionSelect = (suggestion: MentionSuggestion, inputRef: React.RefObject<HTMLTextAreaElement>) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const content = input.value;
    const cursorPos = input.selectionStart || 0;
    
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
      const newContent = `${beforeMention}@${suggestion.username} ${textAfterCursor}`;
      
      if (inputRef === replyInputRef) {
        setReplyContent(newContent);
      } else {
        setEditContent(newContent);
      }
      
      setShowMentions(false);
      
      // Set cursor position after mention
      setTimeout(() => {
        const newCursorPos = beforeMention.length + suggestion.username.length + 2;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
      }, 0);
    }
  };

  // Format time ago
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

  // Render comment content with mentions
  const renderCommentContent = (content: string) => {
    const parsed = parseComment(content);
    
    return (
      <span>
        {parsed.segments.map((segment, index) => {
          if (segment.type === 'mention') {
            return (
              <span
                key={index}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                onClick={() => console.log('Navigate to user:', segment.data?.username)}
              >
                {segment.content}
              </span>
            );
          }
          return <span key={index}>{segment.content}</span>;
        })}
      </span>
    );
  };

  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : '';

  return (
    <div className={`${className} ${indentClass}`}>
      {/* Main Comment */}
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {author.avatar ? (
              <img 
                src={author.avatar} 
                alt={author.displayName} 
                className="w-8 h-8 rounded-full object-cover" 
              />
            ) : (
              author.displayName.charAt(0).toUpperCase()
            )}
          </div>
          {author.isOnline && (
            <div className="w-2 h-2 bg-green-500 rounded-full -mt-1 ml-6"></div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {author.displayName}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              @{author.username}
            </span>
            <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
              <span>Lv.{author.currentLevel}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                (editado)
              </span>
            )}
            {comment.isPinned && (
              <Pin className="w-3 h-3 text-yellow-500" />
            )}
          </div>

          {/* Comment Body */}
          {showEditForm ? (
            <form onSubmit={handleEditSubmit} className="space-y-2">
              <div className="relative">
                <textarea
                  ref={editInputRef}
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    setCursorPosition(e.target.selectionStart || 0);
                    handleMentionInput(e.target.value, e.target.selectionStart || 0);
                  }}
                  onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
                  placeholder="Edita tu comentario..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
                
                {/* Mention Suggestions */}
                {showMentions && mentionSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {mentionSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleMentionSelect(suggestion, editInputRef)}
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
                            @{suggestion.username}
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
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={!editContent.trim() || isSubmitting}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="text-sm text-gray-900 dark:text-white mb-2">
              {renderCommentContent(comment.content)}
            </div>
          )}

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 text-xs">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                hasLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{comment.likesCount}</span>
            </button>

            {canNestDeeper && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Responder</span>
              </button>
            )}

            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                {showReplies ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{replies.length} respuesta{replies.length !== 1 ? 's' : ''}</span>
              </button>
            )}

            {/* More Actions Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-32">
                  {userInteraction.canEdit && (
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}
                  
                  {userInteraction.canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3 space-y-2">
              <div className="relative">
                <textarea
                  ref={replyInputRef}
                  value={replyContent}
                  onChange={(e) => {
                    setReplyContent(e.target.value);
                    setCursorPosition(e.target.selectionStart || 0);
                    handleMentionInput(e.target.value, e.target.selectionStart || 0);
                  }}
                  onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
                  placeholder={`Responder a ${author.displayName}...`}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                />
                
                {/* Mention Suggestions */}
                {showMentions && mentionSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {mentionSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleMentionSelect(suggestion, replyInputRef)}
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
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmitting ? 'Enviando...' : 'Responder'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <AtSign className="w-3 h-3" />
                  <span>@ para mencionar</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <AdvancedCommentThread
              key={reply.comment.id}
              thread={reply}
              currentUserId={currentUserId}
              postId={postId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              className="border-l-2 border-gray-200 dark:border-gray-700 pl-4"
            />
          ))}
        </div>
      )}

      {/* Click outside handler for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};