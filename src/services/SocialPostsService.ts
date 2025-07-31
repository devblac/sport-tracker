/**
 * Social Posts Service
 * 
 * Service for managing social posts, automatic post generation, likes, and comments.
 */

import type {
  SocialPost,
  PostType,
  PostData,
  PostVisibility,
  PostLike,
  PostComment,
  PostShare,
  FeedItem,
  ActivityTrigger,
  POST_TEMPLATES
} from '@/types/socialPosts';

export class SocialPostsService {
  private static instance: SocialPostsService;
  private posts: Map<string, SocialPost> = new Map();
  private likes: Map<string, PostLike[]> = new Map(); // postId -> likes
  private comments: Map<string, PostComment[]> = new Map(); // postId -> comments
  private shares: Map<string, PostShare[]> = new Map(); // postId -> shares
  private userPosts: Map<string, string[]> = new Map(); // userId -> postIds
  private lastPostTime: Map<string, Date> = new Map(); // userId_postType -> lastTime

  static getInstance(): SocialPostsService {
    if (!SocialPostsService.instance) {
      SocialPostsService.instance = new SocialPostsService();
    }
    return SocialPostsService.instance;
  }

  // ============================================================================
  // Post Management
  // ============================================================================

  /**
   * Create a new social post
   */
  async createPost(
    userId: string,
    type: PostType,
    data: PostData,
    visibility: PostVisibility = 'friends',
    customTitle?: string,
    customDescription?: string
  ): Promise<SocialPost> {
    const template = POST_TEMPLATES[type];
    
    // Check cooldown for auto-generated posts
    if (template.autoGenerate && template.cooldownMinutes) {
      const lastPostKey = `${userId}_${type}`;
      const lastPost = this.lastPostTime.get(lastPostKey);
      
      if (lastPost) {
        const timeSinceLastPost = Date.now() - lastPost.getTime();
        const cooldownMs = template.cooldownMinutes * 60 * 1000;
        
        if (timeSinceLastPost < cooldownMs) {
          throw new Error(`Post cooldown active. Wait ${Math.ceil((cooldownMs - timeSinceLastPost) / 60000)} minutes.`);
        }
      }
    }

    const post: SocialPost = {
      id: `post_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      visibility,
      title: customTitle || this.generateTitle(template.titleTemplate, data),
      description: customDescription || this.generateDescription(template.descriptionTemplate, data),
      data,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      isPinned: false
    };

    // Store post
    this.posts.set(post.id, post);
    
    // Update user posts index
    const userPostIds = this.userPosts.get(userId) || [];
    userPostIds.unshift(post.id); // Add to beginning (newest first)
    this.userPosts.set(userId, userPostIds);
    
    // Update last post time
    if (template.autoGenerate) {
      this.lastPostTime.set(`${userId}_${type}`, new Date());
    }

    return post;
  }

  /**
   * Generate post from activity trigger
   */
  async generatePostFromActivity(trigger: ActivityTrigger): Promise<SocialPost | null> {
    if (!trigger.shouldCreatePost) {
      return null;
    }

    const template = POST_TEMPLATES[trigger.type];
    if (!template.autoGenerate) {
      return null;
    }

    try {
      return await this.createPost(
        trigger.userId,
        trigger.type,
        trigger.data,
        trigger.visibility || template.defaultVisibility
      );
    } catch (error) {
      console.warn('Failed to generate post from activity:', error);
      return null;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(
    postId: string,
    userId: string,
    updates: {
      title?: string;
      description?: string;
      visibility?: PostVisibility;
      isPinned?: boolean;
    }
  ): Promise<SocialPost> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Not authorized to update this post');
    }

    const updatedPost: SocialPost = {
      ...post,
      ...updates,
      updatedAt: new Date(),
      isEdited: true
    };

    this.posts.set(postId, updatedPost);
    return updatedPost;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (post.userId !== userId) {
      throw new Error('Not authorized to delete this post');
    }

    // Remove from posts
    this.posts.delete(postId);
    
    // Remove from user posts index
    const userPostIds = this.userPosts.get(userId) || [];
    const filteredIds = userPostIds.filter(id => id !== postId);
    this.userPosts.set(userId, filteredIds);
    
    // Clean up engagement data
    this.likes.delete(postId);
    this.comments.delete(postId);
    this.shares.delete(postId);
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<SocialPost | null> {
    return this.posts.get(postId) || null;
  }

  /**
   * Get posts by user
   */
  async getUserPosts(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SocialPost[]> {
    const userPostIds = this.userPosts.get(userId) || [];
    const paginatedIds = userPostIds.slice(offset, offset + limit);
    
    return paginatedIds
      .map(id => this.posts.get(id))
      .filter((post): post is SocialPost => post !== undefined);
  }

  // ============================================================================
  // Likes System
  // ============================================================================

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const postLikes = this.likes.get(postId) || [];
    
    // Check if already liked
    const existingLike = postLikes.find(like => like.userId === userId);
    if (existingLike) {
      throw new Error('Post already liked');
    }

    const like: PostLike = {
      id: `like_${postId}_${userId}_${Date.now()}`,
      postId,
      userId,
      createdAt: new Date()
    };

    postLikes.push(like);
    this.likes.set(postId, postLikes);

    // Update post likes count
    const updatedPost = { ...post, likesCount: postLikes.length };
    this.posts.set(postId, updatedPost);
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const postLikes = this.likes.get(postId) || [];
    const filteredLikes = postLikes.filter(like => like.userId !== userId);
    
    if (filteredLikes.length === postLikes.length) {
      throw new Error('Post not liked');
    }

    this.likes.set(postId, filteredLikes);

    // Update post likes count
    const updatedPost = { ...post, likesCount: filteredLikes.length };
    this.posts.set(postId, updatedPost);
  }

  /**
   * Check if user has liked a post
   */
  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const postLikes = this.likes.get(postId) || [];
    return postLikes.some(like => like.userId === userId);
  }

  /**
   * Get post likes
   */
  async getPostLikes(postId: string): Promise<PostLike[]> {
    return this.likes.get(postId) || [];
  }

  // ============================================================================
  // Comments System
  // ============================================================================

  /**
   * Add comment to post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ): Promise<PostComment> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    const comment: PostComment = {
      id: `comment_${postId}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      postId,
      userId,
      content: content.trim(),
      parentCommentId,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false
    };

    const postComments = this.comments.get(postId) || [];
    postComments.push(comment);
    this.comments.set(postId, postComments);

    // Update post comments count
    const updatedPost = { ...post, commentsCount: postComments.length };
    this.posts.set(postId, updatedPost);

    // If this is a reply, update parent comment replies count
    if (parentCommentId) {
      const parentComment = postComments.find(c => c.id === parentCommentId);
      if (parentComment) {
        parentComment.repliesCount++;
      }
    }

    return comment;
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<PostComment> {
    // Find comment across all posts
    let foundComment: PostComment | null = null;
    let postId: string | null = null;

    for (const [pId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        foundComment = comment;
        postId = pId;
        break;
      }
    }

    if (!foundComment || !postId) {
      throw new Error('Comment not found');
    }

    if (foundComment.userId !== userId) {
      throw new Error('Not authorized to update this comment');
    }

    if (!content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    foundComment.content = content.trim();
    foundComment.updatedAt = new Date();
    foundComment.isEdited = true;

    return foundComment;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Find and remove comment
    for (const [postId, comments] of this.comments.entries()) {
      const commentIndex = comments.findIndex(c => c.id === commentId);
      if (commentIndex !== -1) {
        const comment = comments[commentIndex];
        
        if (comment.userId !== userId) {
          throw new Error('Not authorized to delete this comment');
        }

        comments.splice(commentIndex, 1);
        
        // Update post comments count
        const post = this.posts.get(postId);
        if (post) {
          const updatedPost = { ...post, commentsCount: comments.length };
          this.posts.set(postId, updatedPost);
        }
        
        return;
      }
    }

    throw new Error('Comment not found');
  }

  /**
   * Get post comments
   */
  async getPostComments(postId: string): Promise<PostComment[]> {
    return this.comments.get(postId) || [];
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate title from template
   */
  private generateTitle(template: string, data: PostData): string {
    if (!template) return '';
    
    let title = template;
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return title;
  }

  /**
   * Generate description from template
   */
  private generateDescription(template: string | undefined, data: PostData): string | undefined {
    if (!template) return undefined;
    
    let description = template;
    
    // Replace placeholders with actual data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      description = description.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return description;
  }

  /**
   * Get feed for user (posts from friends)
   */
  async getFeedForUser(
    userId: string,
    friendIds: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<SocialPost[]> {
    const allPosts: SocialPost[] = [];
    
    // Get posts from friends
    for (const friendId of friendIds) {
      const friendPosts = await this.getUserPosts(friendId, 50); // Get more to sort later
      allPosts.push(...friendPosts);
    }
    
    // Sort by creation date (newest first)
    allPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    return allPosts.slice(offset, offset + limit);
  }

  /**
   * Get post statistics
   */
  async getPostStats(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  }> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    return {
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount
    };
  }

  /**
   * Get user's post activity summary
   */
  async getUserPostSummary(userId: string): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    postsByType: Record<PostType, number>;
  }> {
    const userPostIds = this.userPosts.get(userId) || [];
    const posts = userPostIds
      .map(id => this.posts.get(id))
      .filter((post): post is SocialPost => post !== undefined);

    const postsByType: Record<PostType, number> = {} as Record<PostType, number>;
    let totalLikes = 0;
    let totalComments = 0;

    posts.forEach(post => {
      postsByType[post.type] = (postsByType[post.type] || 0) + 1;
      totalLikes += post.likesCount;
      totalComments += post.commentsCount;
    });

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      postsByType
    };
  }
}

export const socialPostsService = SocialPostsService.getInstance();