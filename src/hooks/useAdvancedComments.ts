/**
 * Advanced Comments Hook
 * 
 * React hook for managing nested comments, likes, mentions, and advanced comment features.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseCommentsService } from '@/services/SupabaseCommentsService';
import { supabase } from '@/lib/supabase';

import type {
  AdvancedComment,
  CommentThread,
  CommentFormData,
  CommentLike,
  MentionSuggestion,
  ParsedComment,
  CommentValidation,
  CommentStats
} from '@/types/comments';

interface UseAdvancedCommentsReturn {
  // Comments
  commentThreads: CommentThread[];
  loadCommentThreads: (postId: string, limit?: number, offset?: number) => Promise<void>;
  createComment: (postId: string, formData: CommentFormData) => Promise<AdvancedComment>;
  updateComment: (commentId: string, content: string, mentions: any[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  // Likes
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  hasUserLikedComment: (commentId: string) => boolean;
  getCommentLikes: (commentId: string) => CommentLike[];
  
  // Mentions
  getMentionSuggestions: (query: string) => Promise<MentionSuggestion[]>;
  parseComment: (content: string) => ParsedComment;
  validateComment: (content: string, mentions: any[]) => CommentValidation;
  
  // Statistics
  commentStats: CommentStats | null;
  loadCommentStats: (postId: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreComments: boolean;
}

export function useAdvancedComments(userId: string): UseAdvancedCommentsReturn {
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [commentLikes, setCommentLikes] = useState<Map<string, CommentLike[]>>(new Map());
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentStats, setCommentStats] = useState<CommentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentPostId) return;

    // Subscribe to comment changes for the current post
    const channel = supabaseCommentsService.subscribeToComments(
      currentPostId,
      (payload) => {
        console.log('Real-time comment update:', payload);
        
        // Reload comments when changes occur
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
          loadCommentThreads(currentPostId, 20, 0);
        }
      }
    );

    setRealtimeChannel(channel);

    // Cleanup subscription on unmount or post change
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentPostId, loadCommentThreads]);

  // Load comment threads for a post
  const loadCommentThreads = useCallback(async (
    postId: string,
    limit: number = 20,
    offset: number = 0
  ) => {
    try {
      if (offset === 0) {
        setIsLoading(true);
        setCommentThreads([]);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      setCurrentPostId(postId);

      const threads = await supabaseCommentsService.getCommentThreads(postId, userId, limit, offset);
      
      if (offset === 0) {
        setCommentThreads(threads);
      } else {
        setCommentThreads(prev => [...prev, ...threads]);
      }
      
      setHasMoreComments(threads.length === limit);
      setCurrentOffset(offset + threads.length);
      
      // Load likes for all comments in threads
      await loadCommentLikes(threads);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Failed to load comment threads:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [userId]);

  // Load likes for comment threads
  const loadCommentLikes = async (threads: CommentThread[]) => {
    const newLikes = new Map<string, CommentLike[]>();
    const newUserLikes = new Set<string>();

    const processThread = async (thread: CommentThread) => {
      try {
        const likes = await supabaseCommentsService.getCommentLikes(thread.comment.id);
        newLikes.set(thread.comment.id, likes);
        
        if (thread.userInteraction.hasLiked) {
          newUserLikes.add(thread.comment.id);
        }
        
        // Process replies recursively
        for (const reply of thread.replies) {
          await processThread(reply);
        }
      } catch (err) {
        console.warn(`Failed to load likes for comment ${thread.comment.id}:`, err);
      }
    };

    for (const thread of threads) {
      await processThread(thread);
    }

    setCommentLikes(prev => new Map([...prev, ...newLikes]));
    setUserLikes(prev => new Set([...prev, ...newUserLikes]));
  };

  // Create a new comment
  const createComment = useCallback(async (
    postId: string,
    formData: CommentFormData
  ): Promise<AdvancedComment> => {
    try {
      setError(null);
      const newComment = await supabaseCommentsService.createComment(postId, userId, formData);
      
      // Reload comments to show the new comment in context
      if (currentPostId === postId) {
        await loadCommentThreads(postId, 20, 0);
      }
      
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      throw err;
    }
  }, [userId, currentPostId, loadCommentThreads]);

  // Update a comment
  const updateComment = useCallback(async (
    commentId: string,
    content: string,
    mentions: any[]
  ) => {
    try {
      setError(null);
      await supabaseCommentsService.updateComment(commentId, userId, content, mentions);
      
      // Reload comments to show the updated comment
      if (currentPostId) {
        await loadCommentThreads(currentPostId, 20, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, [userId, currentPostId, loadCommentThreads]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      setError(null);
      await supabaseCommentsService.deleteComment(commentId, userId);
      
      // Reload comments to reflect the deletion
      if (currentPostId) {
        await loadCommentThreads(currentPostId, 20, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, [userId, currentPostId, loadCommentThreads]);

  // Like a comment
  const likeComment = useCallback(async (commentId: string) => {
    try {
      setError(null);
      await supabaseCommentsService.likeComment(commentId, userId);
      
      // Update local state
      const updatedLikes = await supabaseCommentsService.getCommentLikes(commentId);
      setCommentLikes(prev => new Map(prev).set(commentId, updatedLikes));
      setUserLikes(prev => new Set(prev).add(commentId));
      
      // Update comment threads to reflect new like count
      setCommentThreads(prev => updateCommentInThreads(prev, commentId, { likesCount: updatedLikes.length }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like comment');
      throw err;
    }
  }, [userId]);

  // Unlike a comment
  const unlikeComment = useCallback(async (commentId: string) => {
    try {
      setError(null);
      await supabaseCommentsService.unlikeComment(commentId, userId);
      
      // Update local state
      const updatedLikes = await supabaseCommentsService.getCommentLikes(commentId);
      setCommentLikes(prev => new Map(prev).set(commentId, updatedLikes));
      setUserLikes(prev => {
        const newUserLikes = new Set(prev);
        newUserLikes.delete(commentId);
        return newUserLikes;
      });
      
      // Update comment threads to reflect new like count
      setCommentThreads(prev => updateCommentInThreads(prev, commentId, { likesCount: updatedLikes.length }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlike comment');
      throw err;
    }
  }, [userId]);

  // Helper function to update a comment in threads
  const updateCommentInThreads = (
    threads: CommentThread[],
    commentId: string,
    updates: Partial<AdvancedComment>
  ): CommentThread[] => {
    return threads.map(thread => {
      if (thread.comment.id === commentId) {
        return {
          ...thread,
          comment: { ...thread.comment, ...updates }
        };
      }
      
      if (thread.replies.length > 0) {
        return {
          ...thread,
          replies: updateCommentInThreads(thread.replies, commentId, updates)
        };
      }
      
      return thread;
    });
  };

  // Check if user has liked a comment
  const hasUserLikedComment = useCallback((commentId: string): boolean => {
    return userLikes.has(commentId);
  }, [userLikes]);

  // Get comment likes
  const getCommentLikes = useCallback((commentId: string): CommentLike[] => {
    return commentLikes.get(commentId) || [];
  }, [commentLikes]);

  // Get mention suggestions
  const getMentionSuggestions = useCallback(async (
    query: string
  ): Promise<MentionSuggestion[]> => {
    try {
      return await supabaseCommentsService.getMentionSuggestions(query, userId, 10);
    } catch (err) {
      console.error('Failed to get mention suggestions:', err);
      return [];
    }
  }, [userId]);

  // Parse comment content
  const parseComment = useCallback((content: string): ParsedComment => {
    return supabaseCommentsService.parseComment(content);
  }, []);

  // Validate comment
  const validateComment = useCallback((content: string, mentions: any[]): CommentValidation => {
    return supabaseCommentsService.validateComment(content, mentions);
  }, []);

  // Load comment statistics
  const loadCommentStats = useCallback(async (postId: string) => {
    try {
      setError(null);
      const stats = await supabaseCommentsService.getCommentStats(postId);
      setCommentStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comment stats');
      console.error('Failed to load comment stats:', err);
    }
  }, []);

  return {
    // Comments
    commentThreads,
    loadCommentThreads,
    createComment,
    updateComment,
    deleteComment,
    
    // Likes
    likeComment,
    unlikeComment,
    hasUserLikedComment,
    getCommentLikes,
    
    // Mentions
    getMentionSuggestions,
    parseComment,
    validateComment,
    
    // Statistics
    commentStats,
    loadCommentStats,
    
    // State
    isLoading,
    isLoadingMore,
    error,
    hasMoreComments
  };
}