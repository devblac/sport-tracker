/**
 * Social Posts Hook
 * 
 * React hook for managing social posts, likes, comments, and feed.
 */

import { useState, useEffect, useCallback } from 'react';
import { socialPostsService } from '@/services/SocialPostsService';

import type {
  SocialPost,
  PostType,
  PostData,
  PostVisibility,
  PostLike,
  PostComment,
  ActivityTrigger
} from '@/types/socialPosts';

interface UseSocialPostsReturn {
  // Posts
  posts: SocialPost[];
  userPosts: SocialPost[];
  createPost: (
    type: PostType,
    data: PostData,
    visibility?: PostVisibility,
    customTitle?: string,
    customDescription?: string
  ) => Promise<SocialPost>;
  updatePost: (
    postId: string,
    updates: {
      title?: string;
      description?: string;
      visibility?: PostVisibility;
      isPinned?: boolean;
    }
  ) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  generatePostFromActivity: (trigger: ActivityTrigger) => Promise<SocialPost | null>;
  
  // Likes
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  hasUserLikedPost: (postId: string) => boolean;
  getPostLikes: (postId: string) => PostLike[];
  
  // Comments
  addComment: (postId: string, content: string, parentCommentId?: string) => Promise<PostComment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  getPostComments: (postId: string) => PostComment[];
  
  // Feed
  feedPosts: SocialPost[];
  loadFeed: (friendIds: string[]) => Promise<void>;
  refreshFeed: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Statistics
  userPostSummary: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    postsByType: Record<PostType, number>;
  } | null;
}

export function useSocialPosts(userId: string): UseSocialPostsReturn {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [feedPosts, setFeedPosts] = useState<SocialPost[]>([]);
  const [likes, setLikes] = useState<Map<string, PostLike[]>>(new Map());
  const [comments, setComments] = useState<Map<string, PostComment[]>>(new Map());
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [userPostSummary, setUserPostSummary] = useState<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    postsByType: Record<PostType, number>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [userPostsData, summaryData] = await Promise.all([
          socialPostsService.getUserPosts(userId, 50),
          socialPostsService.getUserPostSummary(userId)
        ]);

        setUserPosts(userPostsData);
        setUserPostSummary(summaryData);

        // Load engagement data for user posts
        await loadEngagementData(userPostsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load posts');
        console.error('Failed to load social posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId]);

  // Load engagement data (likes, comments, user interactions)
  const loadEngagementData = async (postsToLoad: SocialPost[]) => {
    const newLikes = new Map<string, PostLike[]>();
    const newComments = new Map<string, PostComment[]>();
    const newUserLikes = new Set<string>();

    for (const post of postsToLoad) {
      try {
        const [postLikes, postComments] = await Promise.all([
          socialPostsService.getPostLikes(post.id),
          socialPostsService.getPostComments(post.id)
        ]);

        newLikes.set(post.id, postLikes);
        newComments.set(post.id, postComments);

        // Check if current user has liked this post
        const hasLiked = await socialPostsService.hasUserLikedPost(post.id, userId);
        if (hasLiked) {
          newUserLikes.add(post.id);
        }
      } catch (err) {
        console.warn(`Failed to load engagement data for post ${post.id}:`, err);
      }
    }

    setLikes(newLikes);
    setComments(newComments);
    setUserLikes(newUserLikes);
  };

  // Create post
  const createPost = useCallback(async (
    type: PostType,
    data: PostData,
    visibility: PostVisibility = 'friends',
    customTitle?: string,
    customDescription?: string
  ): Promise<SocialPost> => {
    try {
      setError(null);
      const newPost = await socialPostsService.createPost(
        userId,
        type,
        data,
        visibility,
        customTitle,
        customDescription
      );

      // Update user posts
      setUserPosts(prev => [newPost, ...prev]);
      
      // Initialize engagement data for new post
      setLikes(prev => new Map(prev).set(newPost.id, []));
      setComments(prev => new Map(prev).set(newPost.id, []));

      // Update summary
      const summary = await socialPostsService.getUserPostSummary(userId);
      setUserPostSummary(summary);

      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      throw err;
    }
  }, [userId]);

  // Generate post from activity
  const generatePostFromActivity = useCallback(async (trigger: ActivityTrigger): Promise<SocialPost | null> => {
    try {
      setError(null);
      const newPost = await socialPostsService.generatePostFromActivity(trigger);
      
      if (newPost) {
        // Update user posts
        setUserPosts(prev => [newPost, ...prev]);
        
        // Initialize engagement data
        setLikes(prev => new Map(prev).set(newPost.id, []));
        setComments(prev => new Map(prev).set(newPost.id, []));

        // Update summary
        const summary = await socialPostsService.getUserPostSummary(userId);
        setUserPostSummary(summary);
      }

      return newPost;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post from activity');
      console.warn('Failed to generate post from activity:', err);
      return null;
    }
  }, [userId]);

  // Update post
  const updatePost = useCallback(async (
    postId: string,
    updates: {
      title?: string;
      description?: string;
      visibility?: PostVisibility;
      isPinned?: boolean;
    }
  ) => {
    try {
      setError(null);
      const updatedPost = await socialPostsService.updatePost(postId, userId, updates);
      
      // Update in user posts
      setUserPosts(prev => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
      
      // Update in feed posts if present
      setFeedPosts(prev => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
      throw err;
    }
  }, [userId]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    try {
      setError(null);
      await socialPostsService.deletePost(postId, userId);
      
      // Remove from user posts
      setUserPosts(prev => prev.filter(post => post.id !== postId));
      
      // Remove from feed posts
      setFeedPosts(prev => prev.filter(post => post.id !== postId));
      
      // Clean up engagement data
      setLikes(prev => {
        const newLikes = new Map(prev);
        newLikes.delete(postId);
        return newLikes;
      });
      setComments(prev => {
        const newComments = new Map(prev);
        newComments.delete(postId);
        return newComments;
      });
      setUserLikes(prev => {
        const newUserLikes = new Set(prev);
        newUserLikes.delete(postId);
        return newUserLikes;
      });

      // Update summary
      const summary = await socialPostsService.getUserPostSummary(userId);
      setUserPostSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      throw err;
    }
  }, [userId]);

  // Like post
  const likePost = useCallback(async (postId: string) => {
    try {
      setError(null);
      await socialPostsService.likePost(postId, userId);
      
      // Update likes
      const updatedLikes = await socialPostsService.getPostLikes(postId);
      setLikes(prev => new Map(prev).set(postId, updatedLikes));
      setUserLikes(prev => new Set(prev).add(postId));
      
      // Update post likes count in all arrays
      const updatePostLikesCount = (posts: SocialPost[]) => 
        posts.map(post => 
          post.id === postId ? { ...post, likesCount: updatedLikes.length } : post
        );
      
      setUserPosts(updatePostLikesCount);
      setFeedPosts(updatePostLikesCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
      throw err;
    }
  }, [userId]);

  // Unlike post
  const unlikePost = useCallback(async (postId: string) => {
    try {
      setError(null);
      await socialPostsService.unlikePost(postId, userId);
      
      // Update likes
      const updatedLikes = await socialPostsService.getPostLikes(postId);
      setLikes(prev => new Map(prev).set(postId, updatedLikes));
      setUserLikes(prev => {
        const newUserLikes = new Set(prev);
        newUserLikes.delete(postId);
        return newUserLikes;
      });
      
      // Update post likes count in all arrays
      const updatePostLikesCount = (posts: SocialPost[]) => 
        posts.map(post => 
          post.id === postId ? { ...post, likesCount: updatedLikes.length } : post
        );
      
      setUserPosts(updatePostLikesCount);
      setFeedPosts(updatePostLikesCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlike post');
      throw err;
    }
  }, [userId]);

  // Check if user has liked post
  const hasUserLikedPost = useCallback((postId: string): boolean => {
    return userLikes.has(postId);
  }, [userLikes]);

  // Get post likes
  const getPostLikes = useCallback((postId: string): PostLike[] => {
    return likes.get(postId) || [];
  }, [likes]);

  // Add comment
  const addComment = useCallback(async (
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<PostComment> => {
    try {
      setError(null);
      const newComment = await socialPostsService.addComment(postId, userId, content, parentCommentId);
      
      // Update comments
      const updatedComments = await socialPostsService.getPostComments(postId);
      setComments(prev => new Map(prev).set(postId, updatedComments));
      
      // Update post comments count
      const updatePostCommentsCount = (posts: SocialPost[]) => 
        posts.map(post => 
          post.id === postId ? { ...post, commentsCount: updatedComments.length } : post
        );
      
      setUserPosts(updatePostCommentsCount);
      setFeedPosts(updatePostCommentsCount);
      
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [userId]);

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      setError(null);
      await socialPostsService.updateComment(commentId, userId, content);
      
      // Refresh comments for all posts (since we don't know which post the comment belongs to)
      const newComments = new Map<string, PostComment[]>();
      for (const [postId] of comments) {
        const postComments = await socialPostsService.getPostComments(postId);
        newComments.set(postId, postComments);
      }
      setComments(newComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, [userId, comments]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      setError(null);
      await socialPostsService.deleteComment(commentId, userId);
      
      // Refresh comments for all posts
      const newComments = new Map<string, PostComment[]>();
      for (const [postId] of comments) {
        const postComments = await socialPostsService.getPostComments(postId);
        newComments.set(postId, postComments);
      }
      setComments(newComments);
      
      // Update post comments count
      for (const [postId, postComments] of newComments) {
        const updatePostCommentsCount = (posts: SocialPost[]) => 
          posts.map(post => 
            post.id === postId ? { ...post, commentsCount: postComments.length } : post
          );
        
        setUserPosts(updatePostCommentsCount);
        setFeedPosts(updatePostCommentsCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, [userId, comments]);

  // Get post comments
  const getPostComments = useCallback((postId: string): PostComment[] => {
    return comments.get(postId) || [];
  }, [comments]);

  // Load feed
  const loadFeed = useCallback(async (friendIds: string[]) => {
    try {
      setError(null);
      const feed = await socialPostsService.getFeedForUser(userId, friendIds, 20, 0);
      setFeedPosts(feed);
      
      // Load engagement data for feed posts
      await loadEngagementData(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
      console.error('Failed to load feed:', err);
    }
  }, [userId]);

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    // This would typically reload with the same friend IDs
    // For now, we'll just reload user posts
    try {
      setError(null);
      const userPostsData = await socialPostsService.getUserPosts(userId, 50);
      setUserPosts(userPostsData);
      await loadEngagementData(userPostsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh feed');
      console.error('Failed to refresh feed:', err);
    }
  }, [userId]);

  return {
    // Posts
    posts,
    userPosts,
    createPost,
    updatePost,
    deletePost,
    generatePostFromActivity,
    
    // Likes
    likePost,
    unlikePost,
    hasUserLikedPost,
    getPostLikes,
    
    // Comments
    addComment,
    updateComment,
    deleteComment,
    getPostComments,
    
    // Feed
    feedPosts,
    loadFeed,
    refreshFeed,
    
    // State
    isLoading,
    error,
    
    // Statistics
    userPostSummary,
  };
}