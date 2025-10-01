/**
 * Social Integration Tests
 * 
 * Tests for the real social service integration with Supabase.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { realSocialService } from '@/services/RealSocialService';
import { useSocialStore } from '@/stores/useSocialStore';

// Mock Supabase
vi.mock('@/services/SupabaseService', () => ({
  supabaseService: {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ 
                data: { 
                  id: 'test-id', 
                  content: 'Test post',
                  user_id: 'user-1',
                  created_at: new Date().toISOString()
                }, 
                error: null 
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null }))
              }))
            }))
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null }))
          }))
        })),
        channel: vi.fn(() => ({
          on: vi.fn(() => ({
            subscribe: vi.fn(() => 'subscription-id')
          }))
        })),
        removeChannel: vi.fn()
      }))
    }
  }
}));

describe('Social Integration', () => {
  beforeEach(() => {
    // Reset store state
    useSocialStore.getState().clearSocialData();
  });

  afterEach(() => {
    // Clean up subscriptions
    realSocialService.unsubscribeAll();
  });

  describe('RealSocialService', () => {
    it('should create a social post', async () => {
      const userId = 'test-user-1';
      const postData = {
        type: 'workout_completed' as const,
        content: 'Just finished an amazing workout!',
        visibility: 'friends' as const
      };

      const post = await realSocialService.createPost(userId, postData);

      expect(post).toBeDefined();
      expect(post.content).toBe(postData.content);
      expect(post.type).toBe(postData.type);
      expect(post.user_id).toBe(userId);
    });

    it('should get social feed', async () => {
      const userId = 'test-user-1';
      
      const feed = await realSocialService.getSocialFeed(userId);

      expect(Array.isArray(feed)).toBe(true);
    });

    it('should send friend request', async () => {
      const userId = 'test-user-1';
      const targetUserId = 'test-user-2';

      const request = await realSocialService.sendFriendRequest(userId, targetUserId);

      expect(request).toBeDefined();
      expect(request.requester_id).toBe(userId);
      expect(request.addressee_id).toBe(targetUserId);
    });

    it('should get friends list', async () => {
      const userId = 'test-user-1';
      
      const friends = await realSocialService.getFriends(userId);

      expect(Array.isArray(friends)).toBe(true);
    });

    it('should search users', async () => {
      const query = 'test';
      
      const results = await realSocialService.searchUsers(query);

      expect(Array.isArray(results)).toBe(true);
    });

    it('should manage real-time subscriptions', () => {
      const userId = 'test-user-1';
      
      // Subscribe to social feed
      const subscriptionId = realSocialService.subscribeToSocialFeed(userId, () => {});
      
      expect(subscriptionId).toBeDefined();
      expect(typeof subscriptionId).toBe('string');
      
      // Check active subscriptions
      const activeSubscriptions = realSocialService.getActiveSubscriptions();
      expect(activeSubscriptions).toContain(subscriptionId);
      
      // Unsubscribe
      realSocialService.unsubscribe(subscriptionId);
      
      const updatedSubscriptions = realSocialService.getActiveSubscriptions();
      expect(updatedSubscriptions).not.toContain(subscriptionId);
    });

    it('should handle subscription cleanup', () => {
      const userId = 'test-user-1';
      const postId = 'test-post-1';
      
      // Create multiple subscriptions
      const feedSub = realSocialService.subscribeToSocialFeed(userId, () => {});
      const commentsSub = realSocialService.subscribeToPostComments(postId, () => {});
      const likesSub = realSocialService.subscribeToPostLikes(postId, () => {});
      
      expect(realSocialService.getActiveSubscriptions()).toHaveLength(3);
      
      // Unsubscribe all
      realSocialService.unsubscribeAll();
      
      expect(realSocialService.getActiveSubscriptions()).toHaveLength(0);
    });
  });

  describe('Social Store Integration', () => {
    it('should load social feed', async () => {
      const store = useSocialStore.getState();
      const userId = 'test-user-1';

      await store.loadSocialFeed(userId, true);

      expect(store.socialFeed).toBeDefined();
      expect(Array.isArray(store.socialFeed)).toBe(true);
    });

    it('should load friends', async () => {
      const store = useSocialStore.getState();
      const userId = 'test-user-1';

      await store.loadFriends(userId);

      expect(store.friends).toBeDefined();
      expect(Array.isArray(store.friends)).toBe(true);
    });

    it('should load friend requests', async () => {
      const store = useSocialStore.getState();
      const userId = 'test-user-1';

      await store.loadFriendRequests(userId);

      expect(store.friendRequests).toBeDefined();
      expect(Array.isArray(store.friendRequests)).toBe(true);
    });

    it('should manage subscriptions through store', () => {
      const store = useSocialStore.getState();
      const userId = 'test-user-1';

      const subscriptionId = store.subscribeToSocialFeed(userId);

      expect(subscriptionId).toBeDefined();
      expect(store.subscriptions.has('social_feed')).toBe(true);

      store.unsubscribe(subscriptionId);

      expect(store.subscriptions.has('social_feed')).toBe(false);
    });

    it('should clear all data and subscriptions', () => {
      const store = useSocialStore.getState();
      const userId = 'test-user-1';

      // Add some data and subscriptions
      store.subscribeToSocialFeed(userId);
      store.subscribeToFriendRequests(userId);

      expect(store.subscriptions.size).toBeGreaterThan(0);

      // Clear all data
      store.clearSocialData();

      expect(store.socialFeed).toHaveLength(0);
      expect(store.friends).toHaveLength(0);
      expect(store.friendRequests).toHaveLength(0);
      expect(store.subscriptions.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a service error
      vi.mocked(realSocialService.createPost).mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const store = useSocialStore.getState();
      
      await expect(
        store.createPost('user-1', { content: 'Test', type: 'custom', visibility: 'public' })
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle subscription errors', () => {
      const userId = 'test-user-1';
      
      // This should not throw even if there are connection issues
      expect(() => {
        const subscriptionId = realSocialService.subscribeToSocialFeed(userId, () => {});
        realSocialService.unsubscribe(subscriptionId);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid subscriptions', () => {
      const userId = 'test-user-1';
      const subscriptions: string[] = [];

      // Create multiple subscriptions rapidly
      for (let i = 0; i < 10; i++) {
        const sub = realSocialService.subscribeToSocialFeed(userId, () => {});
        subscriptions.push(sub);
      }

      expect(realSocialService.getActiveSubscriptions()).toHaveLength(10);

      // Clean up
      subscriptions.forEach(sub => realSocialService.unsubscribe(sub));
      expect(realSocialService.getActiveSubscriptions()).toHaveLength(0);
    });

    it('should prevent memory leaks in subscriptions', () => {
      const userId = 'test-user-1';
      const initialSubscriptions = realSocialService.getActiveSubscriptions().length;

      // Create and immediately clean up subscriptions
      for (let i = 0; i < 5; i++) {
        const sub = realSocialService.subscribeToSocialFeed(userId, () => {});
        realSocialService.unsubscribe(sub);
      }

      expect(realSocialService.getActiveSubscriptions()).toHaveLength(initialSubscriptions);
    });
  });
});

describe('Integration Components', () => {
  it('should render social components without errors', () => {
    // This would require a more complex test setup with React Testing Library
    // For now, we just verify the components can be imported
    expect(() => {
      require('@/components/social/SocialFeedIntegrated');
      require('@/components/social/FriendsManagerIntegrated');
      require('@/components/social/RealTimeNotifications');
      require('@/components/social/RealTimeActivityFeed');
      require('@/components/social/SocialIntegrationDemo');
    }).not.toThrow();
  });
});