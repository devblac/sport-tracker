/**
 * Advanced Comments Service
 * 
 * Service for managing nested comments, likes, mentions, and advanced comment features.
 */

import type {
  AdvancedComment,
  CommentLike,
  CommentThread,
  CommentFormData,
  CommentMention,
  MentionSuggestion,
  ParsedComment,
  CommentSegment,
  CommentValidation,
  CommentStats,
  COMMENT_CONSTANTS
} from '@/types/comments';

export class AdvancedCommentsService {
  private static instance: AdvancedCommentsService;
  private comments: Map<string, AdvancedComment> = new Map();
  private commentLikes: Map<string, CommentLike[]> = new Map(); // commentId -> likes
  private postComments: Map<string, string[]> = new Map(); // postId -> commentIds

  static getInstance(): AdvancedCommentsService {
    if (!AdvancedCommentsService.instance) {
      AdvancedCommentsService.instance = new AdvancedCommentsService();
    }
    return AdvancedCommentsService.instance;
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
      if (depth >= 5) { // COMMENT_CONSTANTS.MAX_NESTING_DEPTH
        throw new Error('Maximum nesting depth exceeded');
      }
    }

    const comment: AdvancedComment = {
      id: `comment_${postId}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      postId,
      userId,
      content: validation.processedContent,
      parentCommentId: formData.parentCommentId,
      likesCount: 0,
      repliesCount: 0,
      mentions: validation.mentions,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      isPinned: false,
      isDeleted: false
    };

    // Store comment
    this.comments.set(comment.id, comment);
    
    // Update post comments index
    const postCommentIds = this.postComments.get(postId) || [];
    postCommentIds.push(comment.id);
    this.postComments.set(postId, postCommentIds);
    
    // Update parent comment replies count
    if (formData.parentCommentId) {
      await this.updateRepliesCount(formData.parentCommentId);
    }

    return comment;
  }

  /**
   * Update an existing comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    content: string,
    mentions: CommentMention[]
  ): Promise<AdvancedComment> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to update this comment');
    }

    if (comment.isDeleted) {
      throw new Error('Cannot update deleted comment');
    }

    // Validate updated content
    const validation = this.validateComment(content, mentions);
    if (!validation.isValid) {
      throw new Error(`Comment validation failed: ${validation.errors.join(', ')}`);
    }

    const updatedComment: AdvancedComment = {
      ...comment,
      content: validation.processedContent,
      mentions: validation.mentions,
      updatedAt: new Date(),
      isEdited: true
    };

    this.comments.set(commentId, updatedComment);
    return updatedComment;
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    const deletedComment: AdvancedComment = {
      ...comment,
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId,
      content: '[Comentario eliminado]'
    };

    this.comments.set(commentId, deletedComment);
  }

  /**
   * Get comment by ID
   */
  async getComment(commentId: string): Promise<AdvancedComment | null> {
    return this.comments.get(commentId) || null;
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
    const postCommentIds = this.postComments.get(postId) || [];
    const allComments = postCommentIds
      .map(id => this.comments.get(id))
      .filter((comment): comment is AdvancedComment => comment !== undefined && !comment.isDeleted);

    // Get top-level comments (no parent)
    const topLevelComments = allComments
      .filter(comment => !comment.parentCommentId)
      .sort((a, b) => {
        // Pinned comments first, then by creation date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(offset, offset + limit);

    // Build threads with replies
    const threads: CommentThread[] = [];
    
    for (const comment of topLevelComments) {
      const thread = await this.buildCommentThread(comment, allComments, currentUserId);
      threads.push(thread);
    }

    return threads;
  }

  /**
   * Build a comment thread with nested replies
   */
  private async buildCommentThread(
    comment: AdvancedComment,
    allComments: AdvancedComment[],
    currentUserId: string,
    depth: number = 0
  ): Promise<CommentThread> {
    // Get direct replies to this comment
    const replies = allComments
      .filter(c => c.parentCommentId === comment.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Build reply threads recursively (with depth limit)
    const replyThreads: CommentThread[] = [];
    if (depth < 5) { // COMMENT_CONSTANTS.MAX_NESTING_DEPTH
      for (const reply of replies) {
        const replyThread = await this.buildCommentThread(reply, allComments, currentUserId, depth + 1);
        replyThreads.push(replyThread);
      }
    }

    // Get author information (mock for now)
    const author = {
      id: comment.userId,
      displayName: `User ${comment.userId.slice(-4)}`,
      username: `user_${comment.userId.slice(-4)}`,
      avatar: undefined,
      currentLevel: Math.floor(Math.random() * 20) + 1,
      isOnline: Math.random() > 0.5
    };

    // Check user interactions
    const hasLiked = await this.hasUserLikedComment(comment.id, currentUserId);
    const userInteraction = {
      hasLiked,
      canReply: true, // Could be based on privacy settings
      canEdit: comment.userId === currentUserId,
      canDelete: comment.userId === currentUserId
    };

    return {
      comment,
      replies: replyThreads,
      author,
      userInteraction
    };
  }

  /**
   * Get comment depth (nesting level)
   */
  private async getCommentDepth(commentId: string): Promise<number> {
    const comment = this.comments.get(commentId);
    if (!comment || !comment.parentCommentId) {
      return 0;
    }
    
    return 1 + await this.getCommentDepth(comment.parentCommentId);
  }

  /**
   * Update replies count for a comment
   */
  private async updateRepliesCount(commentId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) return;

    const allComments = Array.from(this.comments.values());
    const repliesCount = allComments.filter(c => c.parentCommentId === commentId && !c.isDeleted).length;

    const updatedComment = { ...comment, repliesCount };
    this.comments.set(commentId, updatedComment);
  }

  // ============================================================================
  // Comment Likes
  // ============================================================================

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.isDeleted) {
      throw new Error('Cannot like deleted comment');
    }

    const commentLikes = this.commentLikes.get(commentId) || [];
    
    // Check if already liked
    const existingLike = commentLikes.find(like => like.userId === userId);
    if (existingLike) {
      throw new Error('Comment already liked');
    }

    const like: CommentLike = {
      id: `like_${commentId}_${userId}_${Date.now()}`,
      commentId,
      userId,
      createdAt: new Date()
    };

    commentLikes.push(like);
    this.commentLikes.set(commentId, commentLikes);

    // Update comment likes count
    const updatedComment = { ...comment, likesCount: commentLikes.length };
    this.comments.set(commentId, updatedComment);
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    const comment = this.comments.get(commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const commentLikes = this.commentLikes.get(commentId) || [];
    const filteredLikes = commentLikes.filter(like => like.userId !== userId);
    
    if (filteredLikes.length === commentLikes.length) {
      throw new Error('Comment not liked');
    }

    this.commentLikes.set(commentId, filteredLikes);

    // Update comment likes count
    const updatedComment = { ...comment, likesCount: filteredLikes.length };
    this.comments.set(commentId, updatedComment);
  }

  /**
   * Check if user has liked a comment
   */
  async hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    const commentLikes = this.commentLikes.get(commentId) || [];
    return commentLikes.some(like => like.userId === userId);
  }

  /**
   * Get comment likes
   */
  async getCommentLikes(commentId: string): Promise<CommentLike[]> {
    return this.commentLikes.get(commentId) || [];
  }

  // ============================================================================
  // Mentions System
  // ============================================================================

  /**
   * Parse comment content for mentions
   */
  parseComment(content: string): ParsedComment {
    const segments: CommentSegment[] = [];
    const mentions: CommentMention[] = [];
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
   * Get mention suggestions based on input
   */
  async getMentionSuggestions(
    query: string,
    currentUserId: string,
    limit: number = 10
  ): Promise<MentionSuggestion[]> {
    // Mock suggestions - in real app, this would query friends/users
    const mockUsers = [
      { id: 'user1', username: 'gymbuddy1', displayName: 'Gym Buddy 1', currentLevel: 15, isOnline: true },
      { id: 'user2', username: 'fitnessfan', displayName: 'Fitness Fan', currentLevel: 12, isOnline: false },
      { id: 'user3', username: 'stronglifter', displayName: 'Strong Lifter', currentLevel: 20, isOnline: true },
      { id: 'user4', username: 'cardioking', displayName: 'Cardio King', currentLevel: 8, isOnline: true },
      { id: 'user5', username: 'yogamaster', displayName: 'Yoga Master', currentLevel: 18, isOnline: false }
    ];

    const lowerQuery = query.toLowerCase();
    
    return mockUsers
      .filter(user => 
        user.id !== currentUserId &&
        (user.username.toLowerCase().includes(lowerQuery) ||
         user.displayName.toLowerCase().includes(lowerQuery))
      )
      .map(user => ({
        ...user,
        relevanceScore: this.calculateRelevanceScore(user, query)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
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
    if (user.displayName.toLowerCase().includes(lowerQuery)) score += 40;

    // Online users get bonus
    if (user.isOnline) score += 10;

    // Higher level users get small bonus
    score += user.currentLevel * 0.5;

    return score;
  }

  // ============================================================================
  // Comment Validation
  // ============================================================================

  /**
   * Validate comment content and mentions
   */
  validateComment(content: string, mentions: CommentMention[]): CommentValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check content length
    if (!content.trim()) {
      errors.push('Comment content cannot be empty');
    }

    if (content.length > 2000) { // COMMENT_CONSTANTS.MAX_CONTENT_LENGTH
      errors.push(`Comment exceeds maximum length of 2000 characters`);
    }

    // Check mentions count
    if (mentions.length > 10) { // COMMENT_CONSTANTS.MAX_MENTIONS_PER_COMMENT
      errors.push(`Too many mentions. Maximum 10 allowed`);
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
    const postCommentIds = this.postComments.get(postId) || [];
    const comments = postCommentIds
      .map(id => this.comments.get(id))
      .filter((comment): comment is AdvancedComment => comment !== undefined && !comment.isDeleted);

    const totalComments = comments.length;
    const totalReplies = comments.filter(c => c.parentCommentId).length;
    const totalLikes = comments.reduce((sum, c) => sum + c.likesCount, 0);

    // Calculate average depth
    let totalDepth = 0;
    for (const comment of comments) {
      if (comment.parentCommentId) {
        totalDepth += await this.getCommentDepth(comment.id);
      }
    }
    const averageDepth = totalReplies > 0 ? totalDepth / totalReplies : 0;

    // Get top contributors
    const contributorMap = new Map<string, number>();
    comments.forEach(comment => {
      const count = contributorMap.get(comment.userId) || 0;
      contributorMap.set(comment.userId, count + 1);
    });

    const topContributors = Array.from(contributorMap.entries())
      .map(([userId, count]) => ({
        userId,
        username: `user_${userId.slice(-4)}`,
        commentCount: count
      }))
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 5);

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
}

export const advancedCommentsService = AdvancedCommentsService.getInstance();