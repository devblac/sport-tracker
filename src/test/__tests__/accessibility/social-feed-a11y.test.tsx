/**
 * Accessibility Tests for Social Feed Components
 * 
 * Tests screen reader announcements, keyboard navigation, and WCAG compliance
 * for social feed interface components.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  accessibilityTester, 
  renderWithA11y, 
  testScreenReaderCompatibility,
  keyboardTestHelpers,
  a11yTestHelpers,
  screenReaderTestHelpers
} from '../../accessibility-test-utils';

// Mock social feed components
interface SocialPost {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const mockPosts: SocialPost[] = [
  {
    id: '1',
    author: 'John Doe',
    content: 'Just completed a 30-minute HIIT workout! Feeling great! 💪',
    timestamp: '2 hours ago',
    likes: 15,
    comments: 3,
    isLiked: false
  },
  {
    id: '2',
    author: 'Jane Smith',
    content: 'New personal record on deadlifts today - 150kg! 🏋️‍♀️',
    timestamp: '4 hours ago',
    likes: 28,
    comments: 7,
    isLiked: true
  }
];

const MockSocialPost = ({ 
  post, 
  onLike = vi.fn(), 
  onComment = vi.fn(), 
  onShare = vi.fn() 
}: { 
  post: SocialPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}) => (
  <article 
    className="social-post"
    aria-labelledby={`post-${post.id}-author`}
    aria-describedby={`post-${post.id}-content post-${post.id}-meta`}
    data-testid={`post-${post.id}`}
  >
    {/* Post Header */}
    <header className="post-header">
      <h2 id={`post-${post.id}-author`} className="author-name">
        {post.author}
      </h2>
      <time 
        dateTime={new Date().toISOString()} 
        className="post-timestamp"
        aria-label={`Posted ${post.timestamp}`}
      >
        {post.timestamp}
      </time>
    </header>

    {/* Post Content */}
    <div 
      id={`post-${post.id}-content`}
      className="post-content"
    >
      {post.content}
    </div>

    {/* Post Actions */}
    <div 
      id={`post-${post.id}-meta`}
      className="post-actions"
      role="group"
      aria-label="Post actions"
    >
      <button
        onClick={() => onLike(post.id)}
        aria-label={`${post.isLiked ? 'Unlike' : 'Like'} post by ${post.author}. Currently ${post.likes} likes`}
        aria-pressed={post.isLiked}
        className={`like-button ${post.isLiked ? 'liked' : ''}`}
        data-testid={`like-button-${post.id}`}
      >
        {post.isLiked ? '❤️' : '🤍'} {post.likes}
      </button>

      <button
        onClick={() => onComment(post.id)}
        aria-label={`Comment on post by ${post.author}. ${post.comments} comments`}
        className="comment-button"
        data-testid={`comment-button-${post.id}`}
      >
        💬 {post.comments}
      </button>

      <button
        onClick={() => onShare(post.id)}
        aria-label={`Share post by ${post.author}`}
        className="share-button"
        data-testid={`share-button-${post.id}`}
      >
        🔗 Share
      </button>
    </div>
  </article>
);

const MockSocialFeed = ({ 
  posts = mockPosts,
  onLike = vi.fn(),
  onComment = vi.fn(),
  onShare = vi.fn(),
  onLoadMore = vi.fn(),
  isLoading = false,
  hasNewPosts = false,
  onRefresh = vi.fn()
}: {
  posts?: SocialPost[];
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasNewPosts?: boolean;
  onRefresh?: () => void;
}) => (
  <main className="social-feed" role="main" aria-label="Social Feed">
    {/* Feed Header */}
    <header className="feed-header">
      <h1>Social Feed</h1>
      <button
        onClick={onRefresh}
        aria-label="Refresh social feed"
        className="refresh-button"
        data-testid="refresh-button"
      >
        🔄 Refresh
      </button>
    </header>

    {/* New Posts Notification */}
    {hasNewPosts && (
      <div
        role="status"
        aria-live="polite"
        className="new-posts-notification"
        data-testid="new-posts-notification"
      >
        New posts available. Click refresh to see them.
      </div>
    )}

    {/* Posts List */}
    <section 
      className="posts-list"
      aria-label={`${posts.length} posts in feed`}
      role="feed"
      aria-busy={isLoading}
    >
      {posts.map((post) => (
        <MockSocialPost
          key={post.id}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
        />
      ))}
    </section>

    {/* Loading Indicator */}
    {isLoading && (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading more posts"
        className="loading-indicator"
        data-testid="loading-indicator"
      >
        Loading more posts...
      </div>
    )}

    {/* Load More Button */}
    {!isLoading && (
      <button
        onClick={onLoadMore}
        aria-label="Load more posts"
        className="load-more-button"
        data-testid="load-more-button"
      >
        Load More
      </button>
    )}

    {/* Live Region for Announcements */}
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only announcements"
      data-testid="live-announcements"
    >
      {/* Dynamic announcements will be inserted here */}
    </div>
  </main>
);

const MockCommentForm = ({ 
  postId, 
  onSubmit = vi.fn(), 
  onCancel = vi.fn() 
}: {
  postId: string;
  onSubmit?: (postId: string, comment: string) => void;
  onCancel?: () => void;
}) => (
  <form 
    className="comment-form"
    onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const comment = formData.get('comment') as string;
      onSubmit(postId, comment);
    }}
    aria-labelledby="comment-form-title"
    data-testid="comment-form"
  >
    <h3 id="comment-form-title">Add a comment</h3>
    
    <label htmlFor={`comment-input-${postId}`} className="comment-label">
      Your comment
    </label>
    <textarea
      id={`comment-input-${postId}`}
      name="comment"
      required
      aria-required="true"
      aria-describedby={`comment-help-${postId}`}
      placeholder="Write your comment..."
      className="comment-input"
      data-testid="comment-input"
    />
    
    <div id={`comment-help-${postId}`} className="comment-help">
      Share your thoughts about this post
    </div>

    <div className="comment-actions">
      <button
        type="submit"
        aria-describedby={`comment-help-${postId}`}
        className="submit-comment-button"
        data-testid="submit-comment-button"
      >
        Post Comment
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        className="cancel-comment-button"
        data-testid="cancel-comment-button"
      >
        Cancel
      </button>
    </div>
  </form>
);

describe('Social Feed Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Automated Accessibility Checks', () => {
    it('should pass axe accessibility audit for social feed', async () => {
      const { container } = render(<MockSocialFeed />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      expect(results.violations).toHaveLength(0);
    });

    it('should pass axe audit for individual posts', async () => {
      const { container } = render(<MockSocialPost post={mockPosts[0]} />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      expect(results.violations).toHaveLength(0);
    });

    it('should pass axe audit for comment form', async () => {
      const { container } = render(<MockCommentForm postId="1" />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should properly announce post content to screen readers', async () => {
      render(<MockSocialFeed />);
      
      const firstPost = screen.getByTestId('post-1');
      
      // Check article structure
      expect(firstPost.tagName).toBe('ARTICLE');
      expect(firstPost).toHaveAttribute('aria-labelledby', 'post-1-author');
      expect(firstPost).toHaveAttribute('aria-describedby', 'post-1-content post-1-meta');
      
      // Check that author name is present
      const authorElement = screen.getByText('John Doe');
      expect(authorElement).toBeInTheDocument();
      expect(authorElement).toHaveAttribute('id', 'post-1-author');
    });

    it('should announce like button state changes', async () => {
      const onLike = vi.fn();
      const { rerender } = render(<MockSocialFeed onLike={onLike} />);
      
      const likeButton = screen.getByTestId('like-button-1');
      
      // Initial state
      expect(likeButton).toHaveAttribute('aria-pressed', 'false');
      expect(likeButton).toHaveAttribute('aria-label', 'Like post by John Doe. Currently 15 likes');
      
      // Simulate like action
      fireEvent.click(likeButton);
      
      // Update post state
      const updatedPosts = mockPosts.map(post => 
        post.id === '1' ? { ...post, isLiked: true, likes: 16 } : post
      );
      
      rerender(<MockSocialFeed posts={updatedPosts} onLike={onLike} />);
      
      const updatedLikeButton = screen.getByTestId('like-button-1');
      expect(updatedLikeButton).toHaveAttribute('aria-pressed', 'true');
      expect(updatedLikeButton).toHaveAttribute('aria-label', 'Unlike post by John Doe. Currently 16 likes');
    });

    it('should use live regions for dynamic updates', async () => {
      render(<MockSocialFeed hasNewPosts={true} />);
      
      const newPostsNotification = screen.getByTestId('new-posts-notification');
      const liveAnnouncements = screen.getByTestId('live-announcements');
      
      expect(newPostsNotification).toHaveAttribute('aria-live', 'polite');
      expect(liveAnnouncements).toHaveAttribute('aria-live', 'assertive');
      expect(liveAnnouncements).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce loading states', async () => {
      render(<MockSocialFeed isLoading={true} />);
      
      const loadingIndicator = screen.getByTestId('loading-indicator');
      const postsList = screen.getByRole('feed');
      
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(loadingIndicator).toHaveAttribute('aria-label', 'Loading more posts');
      expect(postsList).toHaveAttribute('aria-busy', 'true');
    });

    it('should provide meaningful timestamps', async () => {
      render(<MockSocialFeed />);
      
      const timestamps = screen.getAllByRole('time');
      
      timestamps.forEach(timestamp => {
        expect(timestamp).toHaveAttribute('dateTime');
        expect(timestamp).toHaveAttribute('aria-label');
        
        const ariaLabel = timestamp.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/Posted .+ ago/);
      });
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should support keyboard navigation through posts', async () => {
      render(<MockSocialFeed />);
      
      const refreshButton = screen.getByTestId('refresh-button');
      const firstPostLikeButton = screen.getByTestId('like-button-1');
      const firstPostCommentButton = screen.getByTestId('comment-button-1');
      const firstPostShareButton = screen.getByTestId('share-button-1');
      const secondPostLikeButton = screen.getByTestId('like-button-2');
      
      // Test tab navigation through interactive elements
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(refreshButton);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(firstPostLikeButton);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(firstPostCommentButton);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(firstPostShareButton);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(secondPostLikeButton);
    });

    it('should activate buttons with Enter and Space keys', async () => {
      const onLike = vi.fn();
      const onComment = vi.fn();
      const onShare = vi.fn();
      
      render(<MockSocialFeed onLike={onLike} onComment={onComment} onShare={onShare} />);
      
      const likeButton = screen.getByTestId('like-button-1');
      const commentButton = screen.getByTestId('comment-button-1');
      const shareButton = screen.getByTestId('share-button-1');
      
      // Test Enter key activation
      likeButton.focus();
      await keyboardTestHelpers.pressEnter();
      expect(onLike).toHaveBeenCalledWith('1');
      
      // Test Space key activation
      commentButton.focus();
      await keyboardTestHelpers.pressSpace();
      expect(onComment).toHaveBeenCalledWith('1');
      
      // Test Enter key on share button
      shareButton.focus();
      await keyboardTestHelpers.pressEnter();
      expect(onShare).toHaveBeenCalledWith('1');
    });

    it('should handle keyboard navigation in comment form', async () => {
      render(<MockCommentForm postId="1" />);
      
      const commentInput = screen.getByTestId('comment-input');
      const submitButton = screen.getByTestId('submit-comment-button');
      const cancelButton = screen.getByTestId('cancel-comment-button');
      
      // Test tab navigation
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(commentInput);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(submitButton);
      
      await keyboardTestHelpers.pressTab();
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  describe('Form Accessibility Tests', () => {
    it('should have proper form labels and descriptions', async () => {
      render(<MockCommentForm postId="1" />);
      
      const commentInput = screen.getByTestId('comment-input');
      
      await a11yTestHelpers.testFormField(commentInput);
      
      expect(commentInput).toHaveAttribute('aria-required', 'true');
      expect(commentInput).toHaveAttribute('aria-describedby', 'comment-help-1');
      
      const helpText = screen.getByText('Share your thoughts about this post');
      expect(helpText).toHaveAttribute('id', 'comment-help-1');
    });

    it('should handle form validation accessibly', async () => {
      const onSubmit = vi.fn();
      render(<MockCommentForm postId="1" onSubmit={onSubmit} />);
      
      const submitButton = screen.getByTestId('submit-comment-button');
      const commentInput = screen.getByTestId('comment-input');
      
      // Try to submit empty form
      fireEvent.click(submitButton);
      
      // Check that required field validation works
      expect(commentInput).toBeRequired();
      expect(commentInput).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Semantic Structure Tests', () => {
    it('should have proper heading hierarchy', async () => {
      render(<MockSocialFeed />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      const postHeadings = screen.getAllByRole('heading', { level: 2 });
      
      expect(mainHeading).toHaveTextContent('Social Feed');
      expect(postHeadings).toHaveLength(mockPosts.length);
      
      // Verify heading structure is logical (h1 followed by h3 is acceptable for post authors)
      expect(mainHeading).toBeInTheDocument();
      postHeadings.forEach(heading => {
        expect(heading).toBeInTheDocument();
      });
    });

    it('should use proper landmark roles', async () => {
      render(<MockSocialFeed />);
      
      const main = screen.getByRole('main');
      const feed = screen.getByRole('feed');
      
      expect(main).toHaveAttribute('aria-label', 'Social Feed');
      expect(feed).toHaveAttribute('aria-label', `${mockPosts.length} posts in feed`);
    });

    it('should group related elements properly', async () => {
      render(<MockSocialFeed />);
      
      const postActions = screen.getAllByRole('group');
      
      postActions.forEach(group => {
        expect(group).toHaveAttribute('aria-label', 'Post actions');
      });
    });
  });

  describe('Live Region Tests', () => {
    it('should announce new posts availability', async () => {
      const { rerender } = render(<MockSocialFeed hasNewPosts={false} />);
      
      // Simulate new posts becoming available
      rerender(<MockSocialFeed hasNewPosts={true} />);
      
      const notification = screen.getByTestId('new-posts-notification');
      expect(notification).toBeInTheDocument();
      expect(notification).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce successful actions', async () => {
      const onLike = vi.fn();
      render(<MockSocialFeed onLike={onLike} />);
      
      const likeButton = screen.getByTestId('like-button-1');
      const liveRegion = screen.getByTestId('live-announcements');
      
      fireEvent.click(likeButton);
      
      // In a real implementation, this would update the live region
      // with a success message like "Post liked"
      expect(onLike).toHaveBeenCalledWith('1');
    });

    it('should handle error announcements', async () => {
      // Mock error state component
      const MockErrorFeed = () => (
        <div>
          <MockSocialFeed />
          <div
            role="alert"
            aria-live="assertive"
            data-testid="error-alert"
          >
            Error loading posts. Please try again.
          </div>
        </div>
      );
      
      render(<MockErrorFeed />);
      
      const errorAlert = screen.getByTestId('error-alert');
      expect(errorAlert).toHaveAttribute('role', 'alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Integration Tests', () => {
    it('should provide complete screen reader experience', async () => {
      render(<MockSocialFeed />);
      
      // Verify key elements have proper accessibility attributes
      const mainElement = screen.getByRole('main');
      const feedElement = screen.getByRole('feed');
      
      expect(mainElement).toHaveAttribute('aria-label', 'Social Feed');
      expect(feedElement).toHaveAttribute('aria-label', `${mockPosts.length} posts in feed`);
      
      // Verify posts have proper structure
      const posts = screen.getAllByRole('article');
      expect(posts).toHaveLength(mockPosts.length);
      
      posts.forEach(post => {
        expect(post).toHaveAttribute('aria-labelledby');
        expect(post).toHaveAttribute('aria-describedby');
      });
    });

    it('should work with assistive technology end-to-end', async () => {
      const onLike = vi.fn();
      const onComment = vi.fn();
      
      render(<MockSocialFeed onLike={onLike} onComment={onComment} />);
      
      // Navigate to first post like button
      const likeButton = screen.getByTestId('like-button-1');
      likeButton.focus();
      
      // Verify accessible name includes context
      const accessibleName = screenReaderTestHelpers.getAccessibleName(likeButton);
      expect(accessibleName).toContain('John Doe');
      expect(accessibleName).toContain('15 likes');
      
      // Activate with keyboard
      await keyboardTestHelpers.pressEnter();
      expect(onLike).toHaveBeenCalledWith('1');
      
      // Navigate to comment button
      const commentButton = screen.getByTestId('comment-button-1');
      commentButton.focus();
      
      const commentAccessibleName = screenReaderTestHelpers.getAccessibleName(commentButton);
      expect(commentAccessibleName).toContain('Comment on post');
      expect(commentAccessibleName).toContain('3 comments');
      
      await keyboardTestHelpers.pressSpace();
      expect(onComment).toHaveBeenCalledWith('1');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should maintain accessibility with large feeds', async () => {
      const largeFeed = Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 1}`,
        author: `User ${i + 1}`,
        content: `Post content ${i + 1}`,
        timestamp: `${i + 1} hours ago`,
        likes: i * 2,
        comments: i,
        isLiked: i % 3 === 0
      }));
      
      const { container } = render(<MockSocialFeed posts={largeFeed} />);
      
      const results = await accessibilityTester.runAutomatedChecks({ container } as any);
      
      expect(results.passed).toBe(true);
      
      // Check that feed still has proper labeling
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-label', '10 posts in feed');
    });

    it('should handle dynamic content updates accessibly', async () => {
      const { rerender } = render(<MockSocialFeed posts={[mockPosts[0]]} />);
      
      // Add new post
      const updatedPosts = [mockPosts[1], mockPosts[0]];
      rerender(<MockSocialFeed posts={updatedPosts} />);
      
      // Verify feed label updates
      const feed = screen.getByRole('feed');
      expect(feed).toHaveAttribute('aria-label', '2 posts in feed');
      
      // Verify new post is accessible
      const newPost = screen.getByTestId('post-2');
      expect(newPost).toBeInTheDocument();
      
      const accessibleName = screenReaderTestHelpers.getAccessibleName(newPost);
      expect(accessibleName).toContain('Jane Smith');
    });
  });
});