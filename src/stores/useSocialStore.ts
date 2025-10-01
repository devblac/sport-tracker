/**
 * Social Store
 * 
 * Zustand store for managing social features, friends, and real-time updates.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { realSocialService } from '@/services/RealSocialService';
import { logger } from '@/utils/logger';

import type {
  SocialPost,
  PostComment,
  PostLike,
  Friendship,
  FriendRequest
} from '@/types/socialPosts';

interface SocialState {
  // Social Feed
  socialFeed: SocialPost[];
  feedLoading: boolean;
  feedError: string | null;
  feedHasMore: boolean;
  feedOffset: number;

  // User Posts
  userPosts: Map<string, SocialPost[]>;
  userPostsLoading: boolean;

  // Friends
  friends: Friendship[];
  friendsLoading: boolean;
  friendRequests: FriendRequest[];
  friendRequestsLoading: boolean;

  // Real-time subscriptions
  subscriptions: Map<string, string>;

  // Actions
  loadSocialFeed: (userId: string, refresh?: boolean) => Promise<void>;
  loadUserPosts: (userId: string, targetUserId?: string) => Promise<void>;
  createPost: (userId: string, postData: any) => Promise<SocialPost>;
  updatePost: (userId: string, postId: string, updates: any) => Promise<SocialPost>;
  deletePost: (userId: string, postId: string) => Promise<void>;
  
  likePost: (userId: string, postId: string) => Promise<void>;
  unlikePost: (userId: string, postId: string) => Promise<void>;
  
  createComment: (userId: string, postId: string, commentData: any) => Promise<PostComment>;
  updateComment: (userId: string, commentId: string, content: string) => Promise<PostComment>;
  deleteComment: (userId: string, commentId: string) => Promise<void>;
  
  loadFriends: (userId: string) => Promise<void>;
  loadFriendRequests: (userId: string) => Promise<void>;
  sendFriendRequest: (userId: string, targetUserId: string) => Promise<FriendRequest>;
  acceptFriendRequest: (userId: string, requestId: string) => Promise<void>;
  rejectFriendRequest: (userId: string, requestId: string) => Promise<void>;
  
  subscribeToSocialFeed: (userId: string) => string;
  subscribeToPostComments: (postId: string) => string;
  subscribeToPostLikes: (postId: string) => string;
  subscribeToFriendRequests: (userId: string) => string;
  subscribeToFriendActivity: (userId: string) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  
  clearSocialData: () => void;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      // Initial state
      socialFeed: [],
      feedLoading: false,
      feedError: null,
      feedHasMore: true,
      feedOffset: 0,

      userPosts: new Map(),
      userPostsLoading: false,

      friends: [],
      friendsLoading: false,
      friendRequests: [],
      friendRequestsLoading: false,

      subscriptions: new Map(),

      // Load social feed
      loadSocialFeed: async (userId: string, refresh = false) => {
        const state = get();
        
        if (state.feedLoading) return;

        try {
          set({ feedLoading: true, feedError: null });

          const offset = refresh ? 0 : state.feedOffset;
          const limit = 20;

          const posts = await realSocialService.getSocialFeed(userId, limit, offset);

          set(state => ({
            socialFeed: refresh ? posts : [...state.socialFeed, ...posts],
            feedOffset: offset + posts.length,
            feedHasMore: posts.length === limit,
            feedLoading: false
          }));

          logger.info('Social feed loaded', { userId, postsCount: posts.length, refresh });
        } catch (error) {
          logger.error('Failed to load social feed', { error, userId });
          set({ 
            feedLoading: false, 
            feedError: error instanceof Error ? error.message : 'Failed to load feed'
          });
        }
      },

      // Load user posts
      loadUserPosts: async (userId: string, targetUserId?: string) => {
        const state = get();
        
        if (state.userPostsLoading) return;

        try {
          set({ userPostsLoading: true });

          const posts = await realSocialService.getUserPosts(userId, targetUserId);
          const key = targetUserId || userId;

          set(state => ({
            userPosts: new Map(state.userPosts.set(key, posts)),
            userPostsLoading: false
          }));

          logger.info('User posts loaded', { userId, targetUserId, postsCount: posts.length });
        } catch (error) {
          logger.error('Failed to load user posts', { error, userId, targetUserId });
          set({ userPostsLoading: false });
        }
      },

      // Create post
      createPost: async (userId: string, postData: any) => {
        try {
          const post = await realSocialService.createPost(userId, postData);

          // Add to social feed if it's the current user's post
          set(state => ({
            socialFeed: [post, ...state.socialFeed],
            userPosts: new Map(state.userPosts.set(userId, [post, ...(state.userPosts.get(userId) || [])]))
          }));

          logger.info('Post created', { userId, postId: post.id });
          return post;
        } catch (error) {
          logger.error('Failed to create post', { error, userId });
          throw error;
        }
      },

      // Update post
      updatePost: async (userId: string, postId: string, updates: any) => {
        try {
          const updatedPost = await realSocialService.updatePost(userId, postId, updates);

          // Update in all relevant arrays
          set(state => ({
            socialFeed: state.socialFeed.map(post => 
              post.id === postId ? updatedPost : post
            ),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(post => post.id === postId ? updatedPost : post)
              ])
            )
          }));

          logger.info('Post updated', { userId, postId });
          return updatedPost;
        } catch (error) {
          logger.error('Failed to update post', { error, userId, postId });
          throw error;
        }
      },

      // Delete post
      deletePost: async (userId: string, postId: string) => {
        try {
          await realSocialService.deletePost(userId, postId);

          // Remove from all arrays
          set(state => ({
            socialFeed: state.socialFeed.filter(post => post.id !== postId),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.filter(post => post.id !== postId)
              ])
            )
          }));

          logger.info('Post deleted', { userId, postId });
        } catch (error) {
          logger.error('Failed to delete post', { error, userId, postId });
          throw error;
        }
      },

      // Like post
      likePost: async (userId: string, postId: string) => {
        try {
          await realSocialService.likePost(userId, postId);

          // Optimistically update like count
          const updatePost = (post: SocialPost) => 
            post.id === postId 
              ? { ...post, likes_count: post.likes_count + 1 }
              : post;

          set(state => ({
            socialFeed: state.socialFeed.map(updatePost),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(updatePost)
              ])
            )
          }));

          logger.info('Post liked', { userId, postId });
        } catch (error) {
          logger.error('Failed to like post', { error, userId, postId });
          throw error;
        }
      },

      // Unlike post
      unlikePost: async (userId: string, postId: string) => {
        try {
          await realSocialService.unlikePost(userId, postId);

          // Optimistically update like count
          const updatePost = (post: SocialPost) => 
            post.id === postId 
              ? { ...post, likes_count: Math.max(0, post.likes_count - 1) }
              : post;

          set(state => ({
            socialFeed: state.socialFeed.map(updatePost),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(updatePost)
              ])
            )
          }));

          logger.info('Post unliked', { userId, postId });
        } catch (error) {
          logger.error('Failed to unlike post', { error, userId, postId });
          throw error;
        }
      },

      // Create comment
      createComment: async (userId: string, postId: string, commentData: any) => {
        try {
          const comment = await realSocialService.createComment(userId, postId, commentData);

          // Optimistically update comment count
          const updatePost = (post: SocialPost) => 
            post.id === postId 
              ? { ...post, comments_count: post.comments_count + 1 }
              : post;

          set(state => ({
            socialFeed: state.socialFeed.map(updatePost),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(updatePost)
              ])
            )
          }));

          logger.info('Comment created', { userId, postId, commentId: comment.id });
          return comment;
        } catch (error) {
          logger.error('Failed to create comment', { error, userId, postId });
          throw error;
        }
      },

      // Update comment
      updateComment: async (userId: string, commentId: string, content: string) => {
        try {
          const comment = await realSocialService.updateComment(userId, commentId, content);
          logger.info('Comment updated', { userId, commentId });
          return comment;
        } catch (error) {
          logger.error('Failed to update comment', { error, userId, commentId });
          throw error;
        }
      },

      // Delete comment
      deleteComment: async (userId: string, commentId: string) => {
        try {
          await realSocialService.deleteComment(userId, commentId);
          logger.info('Comment deleted', { userId, commentId });
        } catch (error) {
          logger.error('Failed to delete comment', { error, userId, commentId });
          throw error;
        }
      },

      // Load friends
      loadFriends: async (userId: string) => {
        const state = get();
        
        if (state.friendsLoading) return;

        try {
          set({ friendsLoading: true });

          const friends = await realSocialService.getFriends(userId);

          set({ 
            friends,
            friendsLoading: false 
          });

          logger.info('Friends loaded', { userId, friendsCount: friends.length });
        } catch (error) {
          logger.error('Failed to load friends', { error, userId });
          set({ friendsLoading: false });
        }
      },

      // Load friend requests
      loadFriendRequests: async (userId: string) => {
        const state = get();
        
        if (state.friendRequestsLoading) return;

        try {
          set({ friendRequestsLoading: true });

          const requests = await realSocialService.getPendingFriendRequests(userId);

          set({ 
            friendRequests: requests,
            friendRequestsLoading: false 
          });

          logger.info('Friend requests loaded', { userId, requestsCount: requests.length });
        } catch (error) {
          logger.error('Failed to load friend requests', { error, userId });
          set({ friendRequestsLoading: false });
        }
      },

      // Send friend request
      sendFriendRequest: async (userId: string, targetUserId: string) => {
        try {
          const request = await realSocialService.sendFriendRequest(userId, targetUserId);
          logger.info('Friend request sent', { userId, targetUserId });
          return request;
        } catch (error) {
          logger.error('Failed to send friend request', { error, userId, targetUserId });
          throw error;
        }
      },

      // Accept friend request
      acceptFriendRequest: async (userId: string, requestId: string) => {
        try {
          await realSocialService.acceptFriendRequest(userId, requestId);

          // Remove from friend requests
          set(state => ({
            friendRequests: state.friendRequests.filter(req => req.id !== requestId)
          }));

          // Reload friends to get the new friendship
          await get().loadFriends(userId);

          logger.info('Friend request accepted', { userId, requestId });
        } catch (error) {
          logger.error('Failed to accept friend request', { error, userId, requestId });
          throw error;
        }
      },

      // Reject friend request
      rejectFriendRequest: async (userId: string, requestId: string) => {
        try {
          await realSocialService.rejectFriendRequest(userId, requestId);

          // Remove from friend requests
          set(state => ({
            friendRequests: state.friendRequests.filter(req => req.id !== requestId)
          }));

          logger.info('Friend request rejected', { userId, requestId });
        } catch (error) {
          logger.error('Failed to reject friend request', { error, userId, requestId });
          throw error;
        }
      },

      // Subscribe to social feed
      subscribeToSocialFeed: (userId: string) => {
        const subscriptionId = realSocialService.subscribeToSocialFeed(userId, (post) => {
          set(state => ({
            socialFeed: [post, ...state.socialFeed]
          }));
        });

        set(state => ({
          subscriptions: new Map(state.subscriptions.set('social_feed', subscriptionId))
        }));

        logger.info('Subscribed to social feed', { userId, subscriptionId });
        return subscriptionId;
      },

      // Subscribe to post comments
      subscribeToPostComments: (postId: string) => {
        const subscriptionId = realSocialService.subscribeToPostComments(postId, (comment) => {
          // Update comment count for the post
          const updatePost = (post: SocialPost) => 
            post.id === postId 
              ? { ...post, comments_count: post.comments_count + 1 }
              : post;

          set(state => ({
            socialFeed: state.socialFeed.map(updatePost),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(updatePost)
              ])
            )
          }));
        });

        set(state => ({
          subscriptions: new Map(state.subscriptions.set(`post_comments_${postId}`, subscriptionId))
        }));

        logger.info('Subscribed to post comments', { postId, subscriptionId });
        return subscriptionId;
      },

      // Subscribe to post likes
      subscribeToPostLikes: (postId: string) => {
        const subscriptionId = realSocialService.subscribeToPostLikes(postId, (like) => {
          // Update like count for the post
          const updatePost = (post: SocialPost) => 
            post.id === postId 
              ? { ...post, likes_count: post.likes_count + 1 }
              : post;

          set(state => ({
            socialFeed: state.socialFeed.map(updatePost),
            userPosts: new Map(
              Array.from(state.userPosts.entries()).map(([key, posts]) => [
                key,
                posts.map(updatePost)
              ])
            )
          }));
        });

        set(state => ({
          subscriptions: new Map(state.subscriptions.set(`post_likes_${postId}`, subscriptionId))
        }));

        logger.info('Subscribed to post likes', { postId, subscriptionId });
        return subscriptionId;
      },

      // Subscribe to friend requests
      subscribeToFriendRequests: (userId: string) => {
        const subscriptionId = realSocialService.subscribeToFriendRequests(userId, (request) => {
          set(state => ({
            friendRequests: [request, ...state.friendRequests]
          }));
        });

        set(state => ({
          subscriptions: new Map(state.subscriptions.set('friend_requests', subscriptionId))
        }));

        logger.info('Subscribed to friend requests', { userId, subscriptionId });
        return subscriptionId;
      },

      // Subscribe to friend activity
      subscribeToFriendActivity: (userId: string) => {
        const subscriptionId = realSocialService.subscribeToFriendActivity(userId, (activity) => {
          // Handle friend activity updates
          logger.info('Friend activity received', { activity });
        });

        set(state => ({
          subscriptions: new Map(state.subscriptions.set('friend_activity', subscriptionId))
        }));

        logger.info('Subscribed to friend activity', { userId, subscriptionId });
        return subscriptionId;
      },

      // Unsubscribe from specific subscription
      unsubscribe: (subscriptionId: string) => {
        realSocialService.unsubscribe(subscriptionId);

        set(state => {
          const newSubscriptions = new Map(state.subscriptions);
          for (const [key, value] of newSubscriptions.entries()) {
            if (value === subscriptionId) {
              newSubscriptions.delete(key);
              break;
            }
          }
          return { subscriptions: newSubscriptions };
        });

        logger.info('Unsubscribed', { subscriptionId });
      },

      // Unsubscribe from all subscriptions
      unsubscribeAll: () => {
        const state = get();
        
        for (const subscriptionId of state.subscriptions.values()) {
          realSocialService.unsubscribe(subscriptionId);
        }

        set({ subscriptions: new Map() });
        logger.info('Unsubscribed from all subscriptions');
      },

      // Clear all social data
      clearSocialData: () => {
        const state = get();
        
        // Unsubscribe from all real-time subscriptions
        state.unsubscribeAll();

        set({
          socialFeed: [],
          feedLoading: false,
          feedError: null,
          feedHasMore: true,
          feedOffset: 0,
          userPosts: new Map(),
          userPostsLoading: false,
          friends: [],
          friendsLoading: false,
          friendRequests: [],
          friendRequestsLoading: false,
          subscriptions: new Map()
        });

        logger.info('Social data cleared');
      }
    }),
    {
      name: 'social-store',
      partialize: (state) => ({
        // Only persist non-loading states and essential data
        socialFeed: state.socialFeed.slice(0, 50), // Keep only recent posts
        friends: state.friends,
        friendRequests: state.friendRequests
      })
    }
  )
);

export default useSocialStore;