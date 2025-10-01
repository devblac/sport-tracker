/**
 * Real Social Service
 * 
 * Production-ready social service using Supabase backend.
 * Handles posts, comments, likes, friendships, and real-time updates.
 */

import { supabaseService } from './SupabaseService';
import { realGamificationService } from './RealGamificationService';
import { logger } from '@/utils/logger';
import type { 
  SocialPost, 
  PostComment, 
  PostLike, 
  Friendship,
  FriendRequest 
} from '@/types/social';

export interface CreatePostData {
  type: 'workout_completed' | 'achievement_unlocked' | 'personal_record' | 'custom' | 'workout_shared';
  content: string;
  visibility: 'public' | 'friends' | 'private';
  workoutId?: string;
  achievementId?: string;
  imageUrls?: string[];
  tags?: string[];
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export class RealSocialService {
  private static instance: RealSocialService;
  private subscriptions: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): RealSocialService {
    if (!RealSocialService.instance) {
      RealSocialService.instance = new RealSocialService();
    }
    return RealSocialService.instance;
  }

  // ============================================================================
  // Post Management
  // ============================================================================

  async createPost(userId: string, postData: CreatePostData): Promise<SocialPost> {
    try {
      const post = await supabaseService.createSocialPost(userId, {
        type: postData.type,
        content: postData.content,
        visibility: postData.visibility,
        data: {
          workout_id: postData.workoutId,
          achievement_id: postData.achievementId
        },
        image_urls: postData.imageUrls || [],
        tags: postData.tags || []
      });

      // Award XP for social interaction
      await realGamificationService.handleSocialInteraction(userId, 'share', post.id);

      logger.info('Social post created', { userId, postId: post.id });
      return this.convertSupabasePost(post);
    } catch (error) {
      logger.error('Failed to create post', { error, userId });
      throw error;
    }
  }

  async getSocialFeed(userId: string, limit = 20, offset = 0): Promise<SocialPost[]> {
    try {
      const posts = await supabaseService.getSocialFeed(userId, limit, offset);
      return posts.map(this.convertSupabasePost);
    } catch (error) {
      logger.error('Failed to get social feed', { error, userId });
      throw error;
    }
  }

  async getUserPosts(userId: string, targetUserId?: string, limit = 20): Promise<SocialPost[]> {
    try {
      const queryUserId = targetUserId || userId;
      
      const { data, error } = await supabaseService.supabase
        .from('social_posts')
        .select(`
          *,
          user:user_profiles(*),
          likes_count,
          comments_count
        `)
        .eq('user_id', queryUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.map(this.convertSupabasePost);
    } catch (error) {
      logger.error('Failed to get user posts', { error, userId, targetUserId });
      throw error;
    }
  }

  async getPostById(postId: string): Promise<SocialPost | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('social_posts')
        .select(`
          *,
          user:user_profiles(*),
          likes_count,
          comments_count
        `)
        .eq('id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      return this.convertSupabasePost(data);
    } catch (error) {
      logger.error('Failed to get post by id', { error, postId });
      return null;
    }
  }

  async updatePost(userId: string, postId: string, updates: Partial<CreatePostData>): Promise<SocialPost> {
    try {
      // Verify ownership
      const existingPost = await this.getPostById(postId);
      if (!existingPost || existingPost.user_id !== userId) {
        throw new Error('Post not found or access denied');
      }

      const { data, error } = await supabaseService.supabase
        .from('social_posts')
        .update({
          content: updates.content,
          visibility: updates.visibility,
          image_urls: updates.imageUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select(`
          *,
          user:user_profiles(*),
          likes_count,
          comments_count
        `)
        .single();

      if (error) throw error;
      
      logger.info('Post updated', { userId, postId });
      return this.convertSupabasePost(data);
    } catch (error) {
      logger.error('Failed to update post', { error, userId, postId });
      throw error;
    }
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    try {
      // Verify ownership
      const existingPost = await this.getPostById(postId);
      if (!existingPost || existingPost.user_id !== userId) {
        throw new Error('Post not found or access denied');
      }

      const { error } = await supabaseService.supabase
        .from('social_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (error) throw error;
      
      logger.info('Post deleted', { userId, postId });
    } catch (error) {
      logger.error('Failed to delete post', { error, userId, postId });
      throw error;
    }
  }

  // ============================================================================
  // Like Management
  // ============================================================================

  async likePost(userId: string, postId: string): Promise<void> {
    try {
      await supabaseService.likePost(userId, postId);
      
      // Award XP for social interaction
      await realGamificationService.handleSocialInteraction(userId, 'like', postId);
      
      logger.info('Post liked', { userId, postId });
    } catch (error) {
      logger.error('Failed to like post', { error, userId, postId });
      throw error;
    }
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    try {
      await supabaseService.unlikePost(userId, postId);
      logger.info('Post unliked', { userId, postId });
    } catch (error) {
      logger.error('Failed to unlike post', { error, userId, postId });
      throw error;
    }
  }

  async getPostLikes(postId: string, limit = 50): Promise<PostLike[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('post_likes')
        .select(`
          *,
          user:user_profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.map(like => ({
        id: like.id,
        post_id: like.post_id,
        user_id: like.user_id,
        user: like.user,
        created_at: new Date(like.created_at)
      }));
    } catch (error) {
      logger.error('Failed to get post likes', { error, postId });
      throw error;
    }
  }

  async hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // Comment Management
  // ============================================================================

  async createComment(userId: string, postId: string, commentData: CreateCommentData): Promise<PostComment> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          parent_comment_id: commentData.parentCommentId,
          content: commentData.content,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          user:user_profiles(*)
        `)
        .single();

      if (error) throw error;

      // Update post comment count
      await supabaseService.supabase.rpc('increment_post_comments', {
        post_id: postId
      });

      // Award XP for social interaction
      await realGamificationService.handleSocialInteraction(userId, 'comment', postId);

      logger.info('Comment created', { userId, postId, commentId: data.id });
      return this.convertSupabaseComment(data);
    } catch (error) {
      logger.error('Failed to create comment', { error, userId, postId });
      throw error;
    }
  }

  async getPostComments(postId: string, limit = 50): Promise<PostComment[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('comments')
        .select(`
          *,
          user:user_profiles(*),
          replies:comments!parent_comment_id(
            *,
            user:user_profiles(*)
          )
        `)
        .eq('post_id', postId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      return data.map(this.convertSupabaseComment);
    } catch (error) {
      logger.error('Failed to get post comments', { error, postId });
      throw error;
    }
  }

  async updateComment(userId: string, commentId: string, content: string): Promise<PostComment> {
    try {
      // Verify ownership
      const { data: existingComment } = await supabaseService.supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!existingComment || existingComment.user_id !== userId) {
        throw new Error('Comment not found or access denied');
      }

      const { data, error } = await supabaseService.supabase
        .from('comments')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select(`
          *,
          user:user_profiles(*)
        `)
        .single();

      if (error) throw error;
      
      logger.info('Comment updated', { userId, commentId });
      return this.convertSupabaseComment(data);
    } catch (error) {
      logger.error('Failed to update comment', { error, userId, commentId });
      throw error;
    }
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    try {
      // Get comment details for post update
      const { data: comment } = await supabaseService.supabase
        .from('comments')
        .select('post_id, user_id')
        .eq('id', commentId)
        .single();

      if (!comment || comment.user_id !== userId) {
        throw new Error('Comment not found or access denied');
      }

      // Delete comment
      const { error } = await supabaseService.supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update post comment count
      await supabaseService.supabase.rpc('decrement_post_comments', {
        post_id: comment.post_id
      });
      
      logger.info('Comment deleted', { userId, commentId });
    } catch (error) {
      logger.error('Failed to delete comment', { error, userId, commentId });
      throw error;
    }
  }

  // ============================================================================
  // Friendship Management
  // ============================================================================

  async sendFriendRequest(userId: string, targetUserId: string): Promise<FriendRequest> {
    try {
      // Check if friendship already exists
      const { data: existingFriendship } = await supabaseService.supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${userId})`)
        .maybeSingle();

      if (existingFriendship) {
        throw new Error('Friendship request already exists');
      }

      const { data, error } = await supabaseService.supabase
        .from('friendships')
        .insert({
          requester_id: userId,
          addressee_id: targetUserId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          requester:user_profiles!friendships_requester_id_fkey(*),
          addressee:user_profiles!friendships_addressee_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      
      logger.info('Friend request sent', { userId, targetUserId });
      return this.convertSupabaseFriendRequest(data);
    } catch (error) {
      logger.error('Failed to send friend request', { error, userId, targetUserId });
      throw error;
    }
  }

  async acceptFriendRequest(userId: string, requestId: string): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('friendships')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('addressee_id', userId);

      if (error) throw error;
      
      logger.info('Friend request accepted', { userId, requestId });
    } catch (error) {
      logger.error('Failed to accept friend request', { error, userId, requestId });
      throw error;
    }
  }

  async rejectFriendRequest(userId: string, requestId: string): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)
        .eq('addressee_id', userId);

      if (error) throw error;
      
      logger.info('Friend request rejected', { userId, requestId });
    } catch (error) {
      logger.error('Failed to reject friend request', { error, userId, requestId });
      throw error;
    }
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('friendships')
        .select(`
          *,
          requester:user_profiles!friendships_requester_id_fkey(*),
          addressee:user_profiles!friendships_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;
      
      return data.map(friendship => ({
        id: friendship.id,
        user_id: userId,
        friend_id: friendship.requester_id === userId ? friendship.addressee_id : friendship.requester_id,
        friend: friendship.requester_id === userId ? friendship.addressee : friendship.requester,
        status: friendship.status,
        created_at: new Date(friendship.created_at),
        updated_at: new Date(friendship.updated_at)
      }));
    } catch (error) {
      logger.error('Failed to get friends', { error, userId });
      throw error;
    }
  }

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('friendships')
        .select(`
          *,
          requester:user_profiles!friendships_requester_id_fkey(*),
          addressee:user_profiles!friendships_addressee_id_fkey(*)
        `)
        .eq('addressee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(this.convertSupabaseFriendRequest);
    } catch (error) {
      logger.error('Failed to get pending friend requests', { error, userId });
      throw error;
    }
  }

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  subscribeToSocialFeed(userId: string, callback: (post: SocialPost) => void): string {
    const subscriptionId = `social_feed_${userId}_${Date.now()}`;
    
    const channel = supabaseService.supabase
      .channel(`social_feed_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_posts',
        filter: `visibility=eq.public`
      }, async (payload) => {
        try {
          // Get the full post with user data
          const { data: fullPost } = await supabaseService.supabase
            .from('social_posts')
            .select(`
              *,
              user:user_profiles(*),
              likes_count,
              comments_count
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullPost) {
            const post = this.convertSupabasePost(fullPost);
            callback(post);
          }
        } catch (error) {
          logger.error('Failed to process real-time post', { error, payload });
        }
      })
      .subscribe();
    
    this.subscriptions.set(subscriptionId, channel);
    logger.info('Subscribed to social feed', { userId, subscriptionId });
    return subscriptionId;
  }

  subscribeToPostComments(postId: string, callback: (comment: PostComment) => void): string {
    const subscriptionId = `post_comments_${postId}_${Date.now()}`;
    
    const channel = supabaseService.supabase
      .channel(`post_comments_${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        try {
          // Get the full comment with user data
          const { data: fullComment } = await supabaseService.supabase
            .from('comments')
            .select(`
              *,
              user:user_profiles(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullComment) {
            const comment = this.convertSupabaseComment(fullComment);
            callback(comment);
          }
        } catch (error) {
          logger.error('Failed to process real-time comment', { error, payload });
        }
      })
      .subscribe();
    
    this.subscriptions.set(subscriptionId, channel);
    logger.info('Subscribed to post comments', { postId, subscriptionId });
    return subscriptionId;
  }

  subscribeToPostLikes(postId: string, callback: (like: PostLike) => void): string {
    const subscriptionId = `post_likes_${postId}_${Date.now()}`;
    
    const channel = supabaseService.supabase
      .channel(`post_likes_${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        try {
          if (payload.eventType === 'INSERT') {
            // Get the full like with user data
            const { data: fullLike } = await supabaseService.supabase
              .from('post_likes')
              .select(`
                *,
                user:user_profiles(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (fullLike) {
              const like = {
                id: fullLike.id,
                post_id: fullLike.post_id,
                user_id: fullLike.user_id,
                user: fullLike.user,
                created_at: new Date(fullLike.created_at)
              };
              callback(like);
            }
          }
        } catch (error) {
          logger.error('Failed to process real-time like', { error, payload });
        }
      })
      .subscribe();
    
    this.subscriptions.set(subscriptionId, channel);
    logger.info('Subscribed to post likes', { postId, subscriptionId });
    return subscriptionId;
  }

  subscribeToFriendRequests(userId: string, callback: (request: FriendRequest) => void): string {
    const subscriptionId = `friend_requests_${userId}_${Date.now()}`;
    
    const channel = supabaseService.supabase
      .channel(`friend_requests_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friendships',
        filter: `addressee_id=eq.${userId}`
      }, async (payload) => {
        try {
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            // Get the full request with user data
            const { data: fullRequest } = await supabaseService.supabase
              .from('friendships')
              .select(`
                *,
                requester:user_profiles!friendships_requester_id_fkey(*),
                addressee:user_profiles!friendships_addressee_id_fkey(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (fullRequest) {
              const request = this.convertSupabaseFriendRequest(fullRequest);
              callback(request);
            }
          }
        } catch (error) {
          logger.error('Failed to process real-time friend request', { error, payload });
        }
      })
      .subscribe();
    
    this.subscriptions.set(subscriptionId, channel);
    logger.info('Subscribed to friend requests', { userId, subscriptionId });
    return subscriptionId;
  }

  subscribeToFriendActivity(userId: string, callback: (activity: any) => void): string {
    const subscriptionId = `friend_activity_${userId}_${Date.now()}`;
    
    // Subscribe to posts from friends
    const channel = supabaseService.supabase
      .channel(`friend_activity_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_posts'
      }, async (payload) => {
        try {
          // Check if the post is from a friend
          const friends = await this.getFriends(userId);
          const friendIds = friends.map(f => f.friend_id);
          
          if (friendIds.includes(payload.new.user_id)) {
            // Get the full post with user data
            const { data: fullPost } = await supabaseService.supabase
              .from('social_posts')
              .select(`
                *,
                user:user_profiles(*),
                likes_count,
                comments_count
              `)
              .eq('id', payload.new.id)
              .single();

            if (fullPost) {
              const post = this.convertSupabasePost(fullPost);
              callback({
                type: 'friend_post',
                data: post,
                timestamp: new Date()
              });
            }
          }
        } catch (error) {
          logger.error('Failed to process friend activity', { error, payload });
        }
      })
      .subscribe();
    
    this.subscriptions.set(subscriptionId, channel);
    logger.info('Subscribed to friend activity', { userId, subscriptionId });
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const channel = this.subscriptions.get(subscriptionId);
    if (channel) {
      supabaseService.supabase.removeChannel(channel);
      this.subscriptions.delete(subscriptionId);
      logger.info('Unsubscribed from channel', { subscriptionId });
    }
  }

  unsubscribeAll(): void {
    for (const [subscriptionId, channel] of this.subscriptions.entries()) {
      supabaseService.supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
    logger.info('Unsubscribed from all channels');
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private convertSupabasePost(supabasePost: any): SocialPost {
    return {
      id: supabasePost.id,
      user_id: supabasePost.user_id,
      user: supabasePost.user,
      type: supabasePost.type,
      content: supabasePost.content,
      data: supabasePost.data || {},
      image_urls: supabasePost.image_urls || [],
      likes_count: supabasePost.likes_count || 0,
      comments_count: supabasePost.comments_count || 0,
      shares_count: supabasePost.shares_count || 0,
      visibility: supabasePost.visibility,
      created_at: new Date(supabasePost.created_at),
      updated_at: new Date(supabasePost.updated_at)
    };
  }

  private convertSupabaseComment(supabaseComment: any): PostComment {
    return {
      id: supabaseComment.id,
      post_id: supabaseComment.post_id,
      user_id: supabaseComment.user_id,
      user: supabaseComment.user,
      parent_comment_id: supabaseComment.parent_comment_id,
      content: supabaseComment.content,
      mentions: supabaseComment.mentions || [],
      likes_count: supabaseComment.likes_count || 0,
      replies_count: supabaseComment.replies_count || 0,
      replies: supabaseComment.replies?.map(this.convertSupabaseComment) || [],
      is_edited: supabaseComment.is_edited || false,
      is_pinned: supabaseComment.is_pinned || false,
      is_deleted: supabaseComment.is_deleted || false,
      created_at: new Date(supabaseComment.created_at),
      updated_at: new Date(supabaseComment.updated_at)
    };
  }

  private convertSupabaseFriendRequest(supabaseFriendship: any): FriendRequest {
    return {
      id: supabaseFriendship.id,
      requester_id: supabaseFriendship.requester_id,
      addressee_id: supabaseFriendship.addressee_id,
      requester: supabaseFriendship.requester,
      addressee: supabaseFriendship.addressee,
      status: supabaseFriendship.status,
      created_at: new Date(supabaseFriendship.created_at),
      updated_at: new Date(supabaseFriendship.updated_at)
    };
  }

  // ============================================================================
  // Search and Discovery
  // ============================================================================

  async searchUsers(query: string, limit = 20): Promise<any[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url, fitness_level')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to search users', { error, query });
      throw error;
    }
  }

  async getFriendSuggestions(userId: string, limit = 10): Promise<any[]> {
    try {
      // Get users who are not already friends and have similar interests
      const { data, error } = await supabaseService.supabase
        .from('user_profiles')
        .select('id, username, display_name, avatar_url, fitness_level')
        .neq('id', userId)
        .limit(limit);

      if (error) throw error;
      
      // Filter out existing friends (would need a more complex query in production)
      const friends = await this.getFriends(userId);
      const friendIds = new Set(friends.map(f => f.friend_id));
      
      return data.filter(user => !friendIds.has(user.id));
    } catch (error) {
      logger.error('Failed to get friend suggestions', { error, userId });
      throw error;
    }
  }

  async getTrendingPosts(limit = 20): Promise<SocialPost[]> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('social_posts')
        .select(`
          *,
          user:user_profiles(*),
          likes_count,
          comments_count
        `)
        .eq('visibility', 'public')
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data.map(this.convertSupabasePost);
    } catch (error) {
      logger.error('Failed to get trending posts', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const realSocialService = RealSocialService.getInstance();