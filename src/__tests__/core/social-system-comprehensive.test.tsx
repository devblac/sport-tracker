/**
 * Comprehensive Social System Tests
 * Tests friend management, social posts, leaderboards, and real-time features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SocialFeed } from '@/components/social/SocialFeed';
import { FriendsManagerIntegrated } from '@/components/social/FriendsManagerIntegrated';
import { LeagueView } from '@/components/social/LeagueView';
import { RealTimeActivityFeed } from '@/components/social/RealTimeActivityFeed';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocialStore } from '@/stores/useSocialStore';
import { 
  createMockUser, 
  createMockSocialPost, 
  createMockComment,
  createMockFriendship,
  createMockLeague,
  createSocialScenario
} from '@/test/test-factories';

// Mock services
const mockSocialService = {
  getFeed: vi.fn(),
  createPost: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  commentOnPost: vi.fn(),
  sharePost: vi.fn(),
  deletePost: vi.fn(),
  reportPost: vi.fn(),
  getFriends: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  searchUsers: vi.fn()
};

const mockLeagueService = {
  getLeagues: vi.fn(),
  joinLeague: vi.fn(),
  getLeaderboard: vi.fn(),
  getUserRank: vi.fn()
};

const mockRealTimeService = {
  subscribeToFeed: vi.fn(),
  subscribeToNotifications: vi.fn(),
  unsubscribe: vi.fn(),
  sendMessage: vi.fn()
};

vi.mock('@/services/SocialService', () => ({
  socialService: mockSocialService
}));

vi.mock('@/services/LeagueManager', () => ({
  leagueManager: mockLeagueService
}));

vi.mock('@/services/RealTimeManager', () => ({
  realTimeManager: mockRealTimeService
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Social System', () => {
  const user = userEvent.setup();
  let mockUser: any;
  let mockFriends: any[];
  let mockPosts: any[];
  let mockComments: any[];
  let socialScenario: any;

  beforeEach(() => {
    socialScenario = createSocialScenario();
    mockUser = socialScenario.users[0];
    mockFriends = socialScenario.users.slice(1);
    mockPosts = socialScenario.posts;
    
    mockComments = [
      createMockComment({ 
        post_id: mockPosts[0].id,
        content: 'Great workout!',
        user: mockFriends[0]
      }),
      createMockComment({ 
        post_id: mockPosts[0].id,
        content: 'Keep it up!',
        user: mockFriends[1]
      })
    ];

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup stores
    useAuthStore.getState().setUser(mockUser);
    useSocialStore.getState().clearPosts();
    
    // Setup default mock responses
    mockSocialService.getFeed.mockResolvedValue(mockPosts);
    mockSocialService.getFriends.mockResolvedValue(mockFriends);
    mockRealTimeService.subscribeToFeed.mockResolvedValue(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Social Feed', () => {
    it('should display social feed with posts', async () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        mockPosts.forEach(post => {
          expect(screen.getByText(post.content)).toBeInTheDocument();
          expect(screen.getByText(post.user.display_name)).toBeInTheDocument();
        });
      });
    });

    it('should create a new post', async () => {
      const newPost = createMockSocialPost({
        user_id: mockUser.id,
        content: 'Just finished an amazing workout!'
      });

      mockSocialService.createPost.mockResolvedValue(newPost);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const postInput = screen.getByPlaceholderText(/share your workout/i);
      const postButton = screen.getByRole('button', { name: /post/i });

      await user.type(postInput, 'Just finished an amazing workout!');
      await user.click(postButton);

      await waitFor(() => {
        expect(mockSocialService.createPost).toHaveBeenCalledWith({
          content: 'Just finished an amazing workout!',
          visibility: 'friends'
        });
      });
    });

    it('should like and unlike posts', async () => {
      mockSocialService.likePost.mockResolvedValue({ success: true });
      mockSocialService.unlikePost.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].content)).toBeInTheDocument();
      });

      const likeButton = screen.getByRole('button', { name: /like post/i });
      await user.click(likeButton);

      await waitFor(() => {
        expect(mockSocialService.likePost).toHaveBeenCalledWith(mockPosts[0].id);
      });

      // Click again to unlike
      await user.click(likeButton);

      await waitFor(() => {
        expect(mockSocialService.unlikePost).toHaveBeenCalledWith(mockPosts[0].id);
      });
    });

    it('should add comments to posts', async () => {
      const newComment = createMockComment({
        post_id: mockPosts[0].id,
        content: 'Nice work!',
        user: mockUser
      });

      mockSocialService.commentOnPost.mockResolvedValue(newComment);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].content)).toBeInTheDocument();
      });

      const commentButton = screen.getByRole('button', { name: /comment/i });
      await user.click(commentButton);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      const submitButton = screen.getByRole('button', { name: /submit comment/i });

      await user.type(commentInput, 'Nice work!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSocialService.commentOnPost).toHaveBeenCalledWith(
          mockPosts[0].id,
          'Nice work!'
        );
      });
    });

    it('should share posts', async () => {
      mockSocialService.sharePost.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].content)).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share post/i });
      await user.click(shareButton);

      const shareModal = screen.getByRole('dialog', { name: /share post/i });
      const confirmShareButton = within(shareModal).getByRole('button', { name: /share/i });
      
      await user.click(confirmShareButton);

      await waitFor(() => {
        expect(mockSocialService.sharePost).toHaveBeenCalledWith(mockPosts[0].id);
      });
    });

    it('should filter posts by visibility', async () => {
      const publicPosts = mockPosts.filter(post => post.visibility === 'public');
      const friendsPosts = mockPosts.filter(post => post.visibility === 'friends');

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const visibilityFilter = screen.getByLabelText(/filter by visibility/i);
      await user.selectOptions(visibilityFilter, 'public');

      await waitFor(() => {
        publicPosts.forEach(post => {
          expect(screen.getByText(post.content)).toBeInTheDocument();
        });
      });
    });

    it('should handle post deletion', async () => {
      const userPost = createMockSocialPost({ 
        user_id: mockUser.id,
        content: 'My post to delete'
      });

      mockSocialService.getFeed.mockResolvedValue([userPost]);
      mockSocialService.deletePost.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('My post to delete')).toBeInTheDocument();
      });

      const moreButton = screen.getByRole('button', { name: /more options/i });
      await user.click(moreButton);

      const deleteButton = screen.getByRole('button', { name: /delete post/i });
      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSocialService.deletePost).toHaveBeenCalledWith(userPost.id);
      });
    });
  });

  describe('Friend Management', () => {
    it('should display friends list', async () => {
      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      await waitFor(() => {
        mockFriends.forEach(friend => {
          expect(screen.getByText(friend.display_name)).toBeInTheDocument();
        });
      });
    });

    it('should search for users', async () => {
      const searchResults = [
        createMockUser({ display_name: 'John Doe', username: 'johndoe' })
      ];

      mockSocialService.searchUsers.mockResolvedValue(searchResults);

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john');

      await waitFor(() => {
        expect(mockSocialService.searchUsers).toHaveBeenCalledWith('john');
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should send friend request', async () => {
      const newUser = createMockUser({ display_name: 'Jane Smith' });
      
      mockSocialService.searchUsers.mockResolvedValue([newUser]);
      mockSocialService.sendFriendRequest.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'jane');

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const addFriendButton = screen.getByRole('button', { name: /add friend/i });
      await user.click(addFriendButton);

      await waitFor(() => {
        expect(mockSocialService.sendFriendRequest).toHaveBeenCalledWith(newUser.id);
      });
    });

    it('should accept friend request', async () => {
      const pendingRequest = createMockFriendship({
        user_id: mockFriends[0].id,
        friend_id: mockUser.id,
        status: 'pending'
      });

      mockSocialService.getFriendRequests = vi.fn().mockResolvedValue([pendingRequest]);
      mockSocialService.acceptFriendRequest.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      const requestsTab = screen.getByRole('tab', { name: /requests/i });
      await user.click(requestsTab);

      await waitFor(() => {
        expect(screen.getByText(/friend request from/i)).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(mockSocialService.acceptFriendRequest).toHaveBeenCalledWith(pendingRequest.id);
      });
    });

    it('should remove friend', async () => {
      mockSocialService.removeFriend.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(mockFriends[0].display_name)).toBeInTheDocument();
      });

      const friendItem = screen.getByTestId(`friend-${mockFriends[0].id}`);
      const moreButton = within(friendItem).getByRole('button', { name: /more options/i });
      await user.click(moreButton);

      const removeButton = screen.getByRole('button', { name: /remove friend/i });
      await user.click(removeButton);

      const confirmButton = screen.getByRole('button', { name: /confirm remove/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSocialService.removeFriend).toHaveBeenCalledWith(mockFriends[0].id);
      });
    });

    it('should block user', async () => {
      mockSocialService.blockUser.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      const friendItem = screen.getByTestId(`friend-${mockFriends[0].id}`);
      const moreButton = within(friendItem).getByRole('button', { name: /more options/i });
      await user.click(moreButton);

      const blockButton = screen.getByRole('button', { name: /block user/i });
      await user.click(blockButton);

      const confirmButton = screen.getByRole('button', { name: /confirm block/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockSocialService.blockUser).toHaveBeenCalledWith(mockFriends[0].id);
      });
    });
  });

  describe('Leagues and Competition', () => {
    it('should display league leaderboard', async () => {
      const league = createMockLeague({ name: 'Gold League' });
      const leaderboard = [
        { user: mockFriends[0], score: 2500, rank: 1 },
        { user: mockUser, score: 2200, rank: 2 },
        { user: mockFriends[1], score: 1800, rank: 3 }
      ];

      mockLeagueService.getLeagues.mockResolvedValue([league]);
      mockLeagueService.getLeaderboard.mockResolvedValue(leaderboard);

      render(
        <TestWrapper>
          <LeagueView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Gold League')).toBeInTheDocument();
        expect(screen.getByText(mockFriends[0].display_name)).toBeInTheDocument();
        expect(screen.getByText('2,500')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
      });
    });

    it('should show user rank and progress', async () => {
      const userRank = {
        current_rank: 2,
        total_participants: 50,
        points_to_next: 300,
        points_to_prev: 700
      };

      mockLeagueService.getUserRank.mockResolvedValue(userRank);

      render(
        <TestWrapper>
          <LeagueView />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Rank #2')).toBeInTheDocument();
        expect(screen.getByText('of 50 participants')).toBeInTheDocument();
        expect(screen.getByText('300 points to rank up')).toBeInTheDocument();
      });
    });

    it('should handle league promotion/relegation', async () => {
      const promotionData = {
        promoted: true,
        old_league: 'Silver League',
        new_league: 'Gold League',
        bonus_xp: 500
      };

      render(
        <TestWrapper>
          <LeagueView promotionData={promotionData} />
        </TestWrapper>
      );

      expect(screen.getByText(/promoted to gold league/i)).toBeInTheDocument();
      expect(screen.getByText('+500 XP bonus')).toBeInTheDocument();
    });

    it('should show weekly competition results', async () => {
      const weeklyResults = {
        user_rank: 5,
        total_participants: 100,
        xp_earned: 1200,
        workouts_completed: 6,
        achievement: 'Top 10 Finisher'
      };

      render(
        <TestWrapper>
          <LeagueView weeklyResults={weeklyResults} />
        </TestWrapper>
      );

      expect(screen.getByText('Weekly Rank: #5')).toBeInTheDocument();
      expect(screen.getByText('1,200 XP earned')).toBeInTheDocument();
      expect(screen.getByText('6 workouts completed')).toBeInTheDocument();
      expect(screen.getByText('Top 10 Finisher')).toBeInTheDocument();
    });
  });

  describe('Real-time Features', () => {
    it('should subscribe to real-time feed updates', async () => {
      render(
        <TestWrapper>
          <RealTimeActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockRealTimeService.subscribeToFeed).toHaveBeenCalledWith(
          mockUser.id,
          expect.any(Function)
        );
      });
    });

    it('should display real-time activity updates', async () => {
      const activityUpdate = {
        type: 'workout_completed',
        user: mockFriends[0],
        data: { workout_name: 'Morning Cardio', xp_gained: 150 },
        timestamp: new Date().toISOString()
      };

      let updateCallback: Function;
      mockRealTimeService.subscribeToFeed.mockImplementation((userId, callback) => {
        updateCallback = callback;
        return () => {};
      });

      render(
        <TestWrapper>
          <RealTimeActivityFeed />
        </TestWrapper>
      );

      // Simulate real-time update
      await waitFor(() => {
        expect(updateCallback).toBeDefined();
      });

      updateCallback(activityUpdate);

      await waitFor(() => {
        expect(screen.getByText(/completed morning cardio/i)).toBeInTheDocument();
        expect(screen.getByText('+150 XP')).toBeInTheDocument();
      });
    });

    it('should show online status of friends', async () => {
      const onlineFriends = mockFriends.map(friend => ({
        ...friend,
        online_status: 'online',
        last_seen: new Date().toISOString()
      }));

      mockSocialService.getFriends.mockResolvedValue(onlineFriends);

      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      await waitFor(() => {
        onlineFriends.forEach(friend => {
          const friendItem = screen.getByTestId(`friend-${friend.id}`);
          expect(within(friendItem).getByText('Online')).toBeInTheDocument();
        });
      });
    });

    it('should handle real-time notifications', async () => {
      const notification = {
        type: 'friend_request',
        from_user: mockFriends[0],
        message: 'sent you a friend request',
        timestamp: new Date().toISOString()
      };

      let notificationCallback: Function;
      mockRealTimeService.subscribeToNotifications.mockImplementation((userId, callback) => {
        notificationCallback = callback;
        return () => {};
      });

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(notificationCallback).toBeDefined();
      });

      notificationCallback(notification);

      await waitFor(() => {
        expect(screen.getByText(/sent you a friend request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Privacy and Safety', () => {
    it('should respect privacy settings', async () => {
      const privatePost = createMockSocialPost({
        visibility: 'private',
        user_id: mockFriends[0].id
      });

      mockSocialService.getFeed.mockResolvedValue([privatePost]);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByText(privatePost.content)).not.toBeInTheDocument();
      });
    });

    it('should allow reporting inappropriate content', async () => {
      mockSocialService.reportPost.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(mockPosts[0].content)).toBeInTheDocument();
      });

      const moreButton = screen.getByRole('button', { name: /more options/i });
      await user.click(moreButton);

      const reportButton = screen.getByRole('button', { name: /report post/i });
      await user.click(reportButton);

      const reasonSelect = screen.getByLabelText(/reason for report/i);
      await user.selectOptions(reasonSelect, 'inappropriate');

      const submitButton = screen.getByRole('button', { name: /submit report/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSocialService.reportPost).toHaveBeenCalledWith(
          mockPosts[0].id,
          'inappropriate'
        );
      });
    });

    it('should filter blocked users from feed', async () => {
      const blockedUser = createMockUser({ id: 'blocked-user' });
      const blockedPost = createMockSocialPost({
        user_id: blockedUser.id,
        user: blockedUser
      });

      mockSocialService.getFeed.mockResolvedValue([...mockPosts, blockedPost]);
      mockSocialService.getBlockedUsers = vi.fn().mockResolvedValue([blockedUser]);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        mockPosts.forEach(post => {
          expect(screen.getByText(post.content)).toBeInTheDocument();
        });
        expect(screen.queryByText(blockedPost.content)).not.toBeInTheDocument();
      });
    });
  });

  describe('Content Moderation', () => {
    it('should validate post content', async () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const postInput = screen.getByPlaceholderText(/share your workout/i);
      const postButton = screen.getByRole('button', { name: /post/i });

      // Try to post inappropriate content
      await user.type(postInput, '<script>alert("xss")</script>');
      await user.click(postButton);

      await waitFor(() => {
        expect(screen.getByText(/content contains invalid characters/i)).toBeInTheDocument();
      });
    });

    it('should limit post length', async () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const postInput = screen.getByPlaceholderText(/share your workout/i);
      const longContent = 'a'.repeat(1001); // Exceeds limit

      await user.type(postInput, longContent);

      await waitFor(() => {
        expect(screen.getByText(/post is too long/i)).toBeInTheDocument();
      });
    });

    it('should detect and prevent spam', async () => {
      mockSocialService.createPost.mockRejectedValue(new Error('Rate limit exceeded'));

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const postInput = screen.getByPlaceholderText(/share your workout/i);
      const postButton = screen.getByRole('button', { name: /post/i });

      // Try to post multiple times quickly
      for (let i = 0; i < 5; i++) {
        await user.clear(postInput);
        await user.type(postInput, `Spam post ${i}`);
        await user.click(postButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should implement infinite scroll for feed', async () => {
      const initialPosts = mockPosts.slice(0, 10);
      const nextPosts = mockPosts.slice(10, 20);

      mockSocialService.getFeed
        .mockResolvedValueOnce(initialPosts)
        .mockResolvedValueOnce(nextPosts);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getAllByTestId(/post-item/i)).toHaveLength(10);
      });

      // Scroll to bottom to trigger load more
      const loadMoreTrigger = screen.getByTestId('load-more-trigger');
      fireEvent.scroll(loadMoreTrigger);

      await waitFor(() => {
        expect(mockSocialService.getFeed).toHaveBeenCalledTimes(2);
      });
    });

    it('should cache friend data', async () => {
      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockSocialService.getFriends).toHaveBeenCalledTimes(1);
      });

      // Re-render should use cached data
      render(
        <TestWrapper>
          <FriendsManagerIntegrated />
        </TestWrapper>
      );

      expect(mockSocialService.getFriends).toHaveBeenCalledTimes(1);
    });

    it('should optimize image loading', async () => {
      const postWithImage = createMockSocialPost({
        content: 'Check out my workout!',
        image_url: 'https://example.com/workout.jpg'
      });

      mockSocialService.getFeed.mockResolvedValue([postWithImage]);

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        const image = screen.getByRole('img', { name: /workout image/i });
        expect(image).toHaveAttribute('loading', 'lazy');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle feed loading errors', async () => {
      mockSocialService.getFeed.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to load feed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle post creation failures', async () => {
      mockSocialService.createPost.mockRejectedValue(new Error('Failed to create post'));

      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const postInput = screen.getByPlaceholderText(/share your workout/i);
      const postButton = screen.getByRole('button', { name: /post/i });

      await user.type(postInput, 'Test post');
      await user.click(postButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create post/i)).toBeInTheDocument();
      });
    });

    it('should handle real-time connection failures', async () => {
      mockRealTimeService.subscribeToFeed.mockRejectedValue(new Error('Connection failed'));

      render(
        <TestWrapper>
          <RealTimeActivityFeed />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/real-time updates unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for social interactions', () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', /social feed/i);
      expect(screen.getByRole('button', { name: /like post/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /comment/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const firstPost = screen.getByTestId(`post-${mockPosts[0].id}`);
      const likeButton = within(firstPost).getByRole('button', { name: /like/i });
      
      likeButton.focus();
      expect(document.activeElement).toBe(likeButton);

      await user.tab();
      const commentButton = within(firstPost).getByRole('button', { name: /comment/i });
      expect(document.activeElement).toBe(commentButton);
    });

    it('should announce social updates to screen readers', async () => {
      render(
        <TestWrapper>
          <SocialFeed />
        </TestWrapper>
      );

      const likeButton = screen.getByRole('button', { name: /like post/i });
      await user.click(likeButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/post liked/i);
      });
    });
  });
});