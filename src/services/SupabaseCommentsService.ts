/**
 * Supabase Comments Service
 * 
 * Service for managing advanced comments with Supabase backend integration.
 * Handles online/offline synchronization and real-time updates.
 */

import { supabase, supabaseHelpers } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type {
  AdvancedComment,
  CommentThread,
  CommentFormData,
  CommentLike,
  CommentStats,
  MentionSuggestion,
  ParsedComment,
  CommentValidation
} from '@/types/comments';

type DbComment = Database['public']['Tables']['comments']['Row'];
type DbCommentInsert = Database['public']['Tables']['comments']['Insert'];
type DbCommentUpdate = Database['public']['Tables']['comments']['Update'];
type DbCommentLike = Database['public']['Tables']['comment_likes']['Row'];

export class SupabaseCommentsService {
  private static instance: SupabaseCommentsService;
  
  static getInstance(): SupabaseCommentsService {
    if (!SupabaseCommentsService.instance) {
      SupabaseCommentsService.instance = new SupabaseCommentsService();
    }
    return SupabaseCommentsService.instance;
  }

  // ============================================================================
  // Comment Management
  // ============================================================================

  /**
   * Create a new comment
   */
  async createComment(
    postId: string,
    userId: string,
    formData: CommentFormData
  ): Promise<AdvancedComment> {
    // Validate comment
    const validation = this.validateComment(formData.content, formData.mentions);
    if (!validation.isValid) {
      throw new Error(`Comment validation failed: ${validation.errors.join(', ')}`);
    }

    // Check nesting depth if it's a reply
    if (formData.parentCommentId) {
      const depth = await this.getCommentDepth(formData.parentCommentId);
      if (depth >= 5) {
        throw new Error('Maximum nesting depth exceeded');
      }
    }

    const commentData: DbCommentInsert = {
      post_id: postId,
      user_id: userId,
      content: validation.processedContent,
      parent_comment_id: formData.parentCommentId || null,
      mentions: validation.mentions,
      is_edited: false,
      is_pinned: false,
      is_deleted: false
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }

    return this.transformDbCommentToAdvanced(data);
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    content: string,
    mentions: any[]
  ): Promise<AdvancedComment> {
    // Validate updated content
    const validation = this.validateComment(content, mentions);
    if (!validation.isValid) {
      throw new Error(`Comment validation failed: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('comments')
      .update({
        content: validation.processedContent,
        mentions: validation.mentions,
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId) // Ensure user owns the comment
      .eq('is_deleted', false) // Can't update deleted comments
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      throw new Error('Failed to update comment');
    }

    if (!data) {
      throw new Error('Comment not found or not authorized');
    }

    return this.transformDbCommentToAdvanced(data);
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        content: '[Comentario eliminado]'
      })
      .eq('id', commentId)
      .eq('user_id', userId); // Ensure user owns the comment

    if (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }

  /**
   * Get comment by ID
   */
  async getComment(commentId: string): Promise<AdvancedComment | null> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (error) {
      console.error('Error fetching comment:', error);
      return null;
    }

    return this.transformDbCommentToAdvanced(data);
  }

  // ============================================================================
  // Comment Threading
  // ============================================================================

  /**
   * Get comment threads for a post
   */
  async getCommentThreads(
    postId: string,
    currentUserId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CommentThread[]> {
    // Get all comments for the post with user profiles
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user_profiles!comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          current_level,
          is_online
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }

    // Get top-level comments (no parent)
    const topLevelComments = comments
      .filter(comment => !comment.parent_comment_id)
      .sort((a, b) => {
        // Pinned comments first, then by creation date
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(offset, offset + limit);

    // Build threads with replies
    const threads: CommentThread[] = [];
    
    for (const comment of topLevelComments) {
      const thread = await this.buildCommentThread(comment, comments, currentUserId);
      threads.push(thread);
    }

    return threads;
  }

  /**
   * Build a comment thread with nested replies
   */
  private async buildCommentThread(
    comment: any,
    allComments: any[],
    currentUserId: string,
    depth: number = 0
  ): Promise<CommentThread> {
    // Get direct replies to this comment
    const replies = allComments
      .filter(c => c.parent_comment_id === comment.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Build reply threads recursively (with depth limit)
    const replyThreads: CommentThread[] = [];
    if (depth < 5) {
      for (const reply of replies) {
        const replyThread = await this.buildCommentThread(reply, allComments, currentUserId, depth + 1);
        replyThreads.push(replyThread);
      }
    }

    // Check if user has liked this comment
    const hasLiked = await this.hasUserLikedComment(comment.id, currentUserId);

    // Transform comment data
    const advancedComment = this.transformDbCommentToAdvanced(comment);
    
    // Build author info
    const author = {
      id: comment.user_profiles.id,
      displayName: comment.user_profiles.display_name,
      username: comment.user_profiles.username,
      avatar: comment.user_profiles.avatar_url,
      currentLevel: comment.user_profiles.current_level,
      isOnline: comment.user_profiles.is_online
    };

    // Check user interactions
    const userInteraction = {
      hasLiked,
      canReply: true, // Could be based on privacy settings
      canEdit: comment.user_id === currentUserId,
      canDelete: comment.user_id === currentUserId
    };

    return {
      comment: advancedComment,
      replies: replyThreads,
      author,
      userInteraction
    };
  }

  /**
   * Get comment depth (nesting level)
   */
  private async getCommentDepth(commentId: string): Promise<number> {
    const { data, error } = await supabase
      .from('comments')
      .select('parent_comment_id')
      .eq('id', commentId)
      .single();

    if (error || !data || !data.parent_comment_id) {
      return 0;
    }
    
    return 1 + await this.getCommentDepth(data.parent_comment_id);
  }

  // ============================================================================
  // Comment Likes
  // ============================================================================

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      throw new Error('Comment already liked');
    }

    // Insert like
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId
      });

    if (error) {
      console.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error unliking comment:', error);
      throw new Error('Failed to unlike comment');
    }
  }

  /**
   * Check if user has liked a comment
   */
  async hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }

  /**
   * Get comment likes
   */
  async getCommentLikes(commentId: string): Promise<CommentLike[]> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId);

    if (error) {
      console.error('Error fetching comment likes:', error);
      return [];
    }

    return data.map(like => ({
      id: like.id,
      commentId: like.comment_id,
      userId: like.user_id,
      createdAt: new Date(like.created_at)
    }));
  }

  // ============================================================================
  // Mentions System
  // ============================================================================

  /**
   * Get mention suggestions based on input
   */
  async getMentionSuggestions(
    query: string,
    currentUserId: string,
    limit: number = 10
  ): Promise<MentionSuggestion[]> {
    // Get user's friends for mention suggestions
    const friends = await supabaseHelpers.getUserFriends(currentUserId);
    
    const lowerQuery = query.toLowerCase();
    
    return friends
      .filter(friendship => {
        const friend = friendship.friend;
        return friend.username.toLowerCase().includes(lowerQuery) ||
               friend.display_name.toLowerCase().includes(lowerQuery);
      })
      .map(friendship => {
        const friend = friendship.friend;
        return {
          id: friend.id,
          username: friend.username,
          displayName: friend.display_name,
          avatar: friend.avatar_url,
          currentLevel: friend.current_level,
          isOnline: friend.is_online,
          relevanceScore: this.calculateRelevanceScore(friend, query)
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Parse comment content for mentions
   */
  parseComment(content: string): ParsedComment {
    const segments: any[] = [];
    const mentions: any[] = [];
    let lastIndex = 0;

    // Find mentions
    const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    const mentionMatches = Array.from(content.matchAll(mentionPattern));
    
    for (const match of mentionMatches) {
      const startIndex = match.index!;
      const endIndex = startIndex + match[0].length;
      const username = match[1];

      // Add text before mention
      if (startIndex > lastIndex) {
        segments.push({
          type: 'text',
          content: content.slice(lastIndex, startIndex)
        });
      }

      // Add mention segment
      segments.push({
        type: 'mention',
        content: match[0],
        data: { username }
      });

      // Store mention for processing
      mentions.push({
        id: `mention_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userId: '', // Will be resolved later
        username,
        displayName: '', // Will be resolved later
        startIndex,
        endIndex
      });

      lastIndex = endIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return {
      segments,
      mentions,
      plainText: content.replace(mentionPattern, '@$1')
    };
  }

  /**
   * Calculate relevance score for mention suggestions
   */
  private calculateRelevanceScore(user: any, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact username match
    if (user.username.toLowerCase() === lowerQuery) score += 100;
    // Username starts with query
    else if (user.username.toLowerCase().startsWith(lowerQuery)) score += 80;
    // Username contains query
    else if (user.username.toLowerCase().includes(lowerQuery)) score += 60;

    // Display name matches
    if (user.display_name.toLowerCase().includes(lowerQuery)) score += 40;

    // Online users get bonus
    if (user.is_online) score += 10;

    // Higher level users get small bonus
    score += user.current_level * 0.5;

    return score;
  }

  // ============================================================================
  // Comment Validation
  // ============================================================================

  /**
   * Validate comment content and mentions
   */
  validateComment(content: string, mentions: any[]): CommentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check content length
    if (!content.trim()) {
      errors.push('Comment content cannot be empty');
    }

    if (content.length > 2000) {
      errors.push('Comment exceeds maximum length of 2000 characters');
    }

    // Check mentions count
    if (mentions.length > 10) {
      errors.push('Too many mentions. Maximum 10 allowed');
    }

    // Validate mention format
    const parsedComment = this.parseComment(content);
    if (parsedComment.mentions.length !== mentions.length) {
      warnings.push('Mention count mismatch between content and mentions array');
    }

    // Check for spam patterns
    const repeatedChars = /(..)\\1{4,}/g;
    if (repeatedChars.test(content)) {
      warnings.push('Comment contains repeated characters that might be considered spam');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      processedContent: content.trim(),
      mentions: parsedComment.mentions
    };
  }

  // ============================================================================
  // Comment Statistics
  // ============================================================================

  /**
   * Get comment statistics for a post
   */
  async getCommentStats(postId: string): Promise<CommentStats> {
    // Get all comments for the post
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false);

    if (error) {
      console.error('Error fetching comment stats:', error);
      throw new Error('Failed to fetch comment statistics');
    }

    const totalComments = comments.length;
    const totalReplies = comments.filter(c => c.parent_comment_id).length;
    const totalLikes = comments.reduce((sum, c) => sum + c.likes_count, 0);

    // Calculate average depth
    let totalDepth = 0;
    for (const comment of comments) {
      if (comment.parent_comment_id) {
        totalDepth += await this.getCommentDepth(comment.id);
      }
    }
    const averageDepth = totalReplies > 0 ? totalDepth / totalReplies : 0;

    // Get top contributors
    const contributorMap = new Map<string, number>();
    comments.forEach(comment => {
      const count = contributorMap.get(comment.user_id) || 0;
      contributorMap.set(comment.user_id, count + 1);
    });

    // Get user profiles for top contributors
    const topContributorIds = Array.from(contributorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId]) => userId);

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, username')
      .in('id', topContributorIds);

    const topContributors = topContributorIds.map(userId => {
      const profile = profiles?.find(p => p.id === userId);
      return {
        userId,
        username: profile?.username || `user_${userId.slice(-4)}`,
        commentCount: contributorMap.get(userId) || 0
      };
    });

    // Calculate engagement rate
    const engagementRate = totalComments > 0 ? (totalLikes / totalComments) : 0;

    return {
      totalComments,
      totalReplies,
      totalLikes,
      averageDepth,
      topContributors,
      engagementRate
    };
  }

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  /**
   * Subscribe to comment changes for a post
   */
  subscribeToComments(postId: string, callback: (payload: any) => void) {
    return supabaseHelpers.subscribeToTable(
      'comments',
      callback,
      `post_id=eq.${postId}`
    );
  }

  /**
   * Subscribe to comment like changes
   */
  subscribeToCommentLikes(callback: (payload: any) => void) {
    return supabaseHelpers.subscribeToTable('comment_likes', callback);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Transform database comment to AdvancedComment type
   */
  private transformDbCommentToAdvanced(dbComment: DbComment): AdvancedComment {
    return {
      id: dbComment.id,
      postId: dbComment.post_id,
      userId: dbComment.user_id,
      content: dbComment.content,
      parentCommentId: dbComment.parent_comment_id || undefined,
      likesCount: dbComment.likes_count,
      repliesCount: dbComment.replies_count,
      mentions: Array.isArray(dbComment.mentions) ? dbComment.mentions as any[] : [],
      createdAt: new Date(dbComment.created_at),
      updatedAt: new Date(dbComment.updated_at),
      isEdited: dbComment.is_edited,
      isPinned: dbComment.is_pinned,
      isDeleted: dbComment.is_deleted,
      deletedAt: dbComment.deleted_at ? new Date(dbComment.deleted_at) : undefined,
      deletedBy: dbComment.deleted_by || undefined
    };
  }
}

export const supabaseCommentsService = SupabaseCommentsService.getInstance();