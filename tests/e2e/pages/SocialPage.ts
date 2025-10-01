import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SocialPage extends BasePage {
  readonly socialFeed: Locator;
  readonly addFriendButton: Locator;
  readonly friendSearch: Locator;
  readonly friendsList: Locator;
  readonly challengesList: Locator;
  readonly leaderboard: Locator;
  readonly shareButton: Locator;
  readonly likeButton: Locator;
  readonly commentButton: Locator;

  constructor(page: Page) {
    super(page);
    this.socialFeed = page.locator('[data-testid="social-feed"]');
    this.addFriendButton = page.locator('[data-testid="add-friend"]');
    this.friendSearch = page.locator('[data-testid="friend-search"]');
    this.friendsList = page.locator('[data-testid="friends-list"]');
    this.challengesList = page.locator('[data-testid="challenges-list"]');
    this.leaderboard = page.locator('[data-testid="leaderboard"]');
    this.shareButton = page.locator('[data-testid="share-post"]');
    this.likeButton = page.locator('[data-testid="like-post"]');
    this.commentButton = page.locator('[data-testid="comment-post"]');
  }

  async addFriend(username: string) {
    await this.addFriendButton.click();
    await this.friendSearch.fill(username);
    await this.page.locator('[data-testid="search-friend"]').click();
    
    // Wait for search results
    await this.page.waitForSelector('[data-testid="friend-search-results"]');
    
    // Click on the first result and send friend request
    await this.page.locator('[data-testid="send-friend-request"]').first().click();
    
    // Verify friend request sent
    await expect(this.page.locator('[data-testid="friend-request-sent"]')).toBeVisible();
  }

  async likePost(postIndex: number = 0) {
    const post = this.socialFeed.locator('[data-testid="social-post"]').nth(postIndex);
    const likeButton = post.locator('[data-testid="like-button"]');
    
    await likeButton.click();
    
    // Verify like was registered
    await expect(post.locator('[data-testid="like-count"]')).not.toContainText('0');
  }

  async commentOnPost(postIndex: number, comment: string) {
    const post = this.socialFeed.locator('[data-testid="social-post"]').nth(postIndex);
    const commentButton = post.locator('[data-testid="comment-button"]');
    
    await commentButton.click();
    
    // Wait for comment modal/form
    await this.page.waitForSelector('[data-testid="comment-form"]');
    
    await this.page.locator('[data-testid="comment-input"]').fill(comment);
    await this.page.locator('[data-testid="submit-comment"]').click();
    
    // Verify comment was added
    await expect(post.locator('[data-testid="comment-count"]')).not.toContainText('0');
  }

  async sharePost(postIndex: number) {
    const post = this.socialFeed.locator('[data-testid="social-post"]').nth(postIndex);
    const shareButton = post.locator('[data-testid="share-button"]');
    
    await shareButton.click();
    
    // Wait for share modal
    await this.page.waitForSelector('[data-testid="share-modal"]');
    
    // Select share option (e.g., copy link)
    await this.page.locator('[data-testid="copy-link"]').click();
    
    // Verify share success
    await expect(this.page.locator('[data-testid="share-success"]')).toBeVisible();
  }

  async joinChallenge(challengeName: string) {
    const challenge = this.challengesList.locator(`[data-testid="challenge"]:has-text("${challengeName}")`);
    const joinButton = challenge.locator('[data-testid="join-challenge"]');
    
    await joinButton.click();
    
    // Verify joined challenge
    await expect(challenge.locator('[data-testid="challenge-joined"]')).toBeVisible();
  }

  async viewLeaderboard() {
    await this.leaderboard.click();
    await this.page.waitForSelector('[data-testid="leaderboard-content"]');
    
    // Verify leaderboard is displayed
    await expect(this.page.locator('[data-testid="leaderboard-rankings"]')).toBeVisible();
  }

  async verifyFeedLoaded() {
    await expect(this.socialFeed).toBeVisible();
    await expect(this.socialFeed.locator('[data-testid="social-post"]').first()).toBeVisible();
  }

  async verifyFriendsList() {
    await expect(this.friendsList).toBeVisible();
    
    // Check if there are friends or empty state
    const friendsCount = await this.friendsList.locator('[data-testid="friend-item"]').count();
    if (friendsCount === 0) {
      await expect(this.page.locator('[data-testid="no-friends-message"]')).toBeVisible();
    }
  }
}