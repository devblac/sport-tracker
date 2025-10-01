import { test, expect } from '@playwright/test';
import { SocialPage } from './pages/SocialPage';
import { WorkoutPage } from './pages/WorkoutPage';

test.describe('Social System E2E Tests', () => {
  let socialPage: SocialPage;
  let workoutPage: WorkoutPage;

  test.beforeEach(async ({ page }) => {
    socialPage = new SocialPage(page);
    workoutPage = new WorkoutPage(page);
    await socialPage.goto('/');
    await socialPage.waitForPageLoad();
  });

  test('Social feed displays and interactions work', async ({ page }) => {
    // Navigate to social section
    await socialPage.navigateToSocial();
    
    // Verify social feed loads
    await socialPage.verifyFeedLoaded();
    
    // Like a post
    await socialPage.likePost(0);
    
    // Comment on a post
    await socialPage.commentOnPost(0, 'Great workout! 💪');
    
    // Share a post
    await socialPage.sharePost(0);
    
    // Verify interactions were successful
    const firstPost = page.locator('[data-testid="social-post"]').first();
    await expect(firstPost.locator('[data-testid="like-count"]')).not.toContainText('0');
    await expect(firstPost.locator('[data-testid="comment-count"]')).not.toContainText('0');
  });

  test('Add gym friend flow', async ({ page }) => {
    await socialPage.navigateToSocial();
    
    // Add a friend
    await socialPage.addFriend('gymbuddy123');
    
    // Verify friend request was sent
    await expect(page.locator('[data-testid="friend-request-sent"]')).toBeVisible();
    
    // Navigate to friends list
    await page.locator('[data-testid="friends-tab"]').click();
    
    // Verify friends list
    await socialPage.verifyFriendsList();
  });

  test('Challenge participation flow', async ({ page }) => {
    await socialPage.navigateToSocial();
    
    // Navigate to challenges
    await page.locator('[data-testid="challenges-tab"]').click();
    
    // Join a challenge
    await socialPage.joinChallenge('30-Day Consistency Challenge');
    
    // Verify challenge joined
    await expect(page.locator('[data-testid="challenge-joined"]')).toBeVisible();
    
    // View leaderboard
    await socialPage.viewLeaderboard();
    
    // Verify user appears in leaderboard
    await expect(page.locator('[data-testid="leaderboard-rankings"]')).toContainText('testuser');
  });

  test('Workout sharing creates social post', async ({ page }) => {
    // Complete a workout first
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    await workoutPage.logSet(80, 10, 'normal');
    await workoutPage.logSet(80, 8, 'normal');
    await workoutPage.completeWorkout();
    
    // Share workout from completion screen
    await page.locator('[data-testid="share-workout"]').click();
    
    // Verify share options
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();
    
    // Share to social feed
    await page.locator('[data-testid="share-to-feed"]').click();
    
    // Navigate to social feed
    await socialPage.navigateToSocial();
    
    // Verify workout appears in feed
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('completed a workout');
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('Bench Press');
  });

  test('Achievement sharing creates social post', async ({ page }) => {
    // Navigate to profile to trigger achievement
    await socialPage.navigateToProfile();
    
    // Simulate achievement unlock (this would normally happen after workout)
    await page.evaluate(() => {
      // Trigger achievement unlock event
      window.dispatchEvent(new CustomEvent('achievement-unlocked', {
        detail: {
          id: 'strength_milestone',
          name: '100kg Club',
          description: 'Lifted 100kg in any exercise',
          rarity: 'rare'
        }
      }));
    });
    
    // Verify achievement notification
    await expect(page.locator('[data-testid="achievement-notification"]')).toBeVisible();
    
    // Share achievement
    await page.locator('[data-testid="share-achievement"]').click();
    
    // Navigate to social feed
    await socialPage.navigateToSocial();
    
    // Verify achievement appears in feed
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('unlocked an achievement');
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('100kg Club');
  });

  test('Social notifications work', async ({ page }) => {
    await socialPage.navigateToSocial();
    
    // Simulate receiving a friend request
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('friend-request-received', {
        detail: {
          from: 'newgymbuddy',
          message: 'Hey, let\'s be gym friends!'
        }
      }));
    });
    
    // Verify notification appears
    await expect(page.locator('[data-testid="notification-badge"]')).toBeVisible();
    
    // Click notifications
    await page.locator('[data-testid="notifications-button"]').click();
    
    // Verify notification content
    await expect(page.locator('[data-testid="notification-item"]')).toContainText('newgymbuddy');
    await expect(page.locator('[data-testid="notification-item"]')).toContainText('friend request');
    
    // Accept friend request
    await page.locator('[data-testid="accept-friend-request"]').click();
    
    // Verify friend was added
    await expect(page.locator('[data-testid="friend-added"]')).toBeVisible();
  });

  test('Privacy settings affect social visibility', async ({ page }) => {
    // Navigate to profile settings
    await socialPage.navigateToProfile();
    await page.locator('[data-testid="privacy-settings"]').click();
    
    // Set profile to private
    await page.locator('[data-testid="profile-visibility"]').selectOption('private');
    await page.locator('[data-testid="save-privacy-settings"]').click();
    
    // Verify privacy settings saved
    await expect(page.locator('[data-testid="privacy-saved"]')).toBeVisible();
    
    // Navigate to social feed
    await socialPage.navigateToSocial();
    
    // Verify private profile indicator
    await expect(page.locator('[data-testid="private-profile-indicator"]')).toBeVisible();
    
    // Test that workout sharing respects privacy
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Squat');
    await workoutPage.logSet(100, 5, 'normal');
    await workoutPage.completeWorkout();
    
    // Verify share options respect privacy setting
    await page.locator('[data-testid="share-workout"]').click();
    await expect(page.locator('[data-testid="privacy-warning"]')).toBeVisible();
  });

  test('Leaderboard and rankings display correctly', async ({ page }) => {
    await socialPage.navigateToSocial();
    
    // Navigate to leaderboards
    await page.locator('[data-testid="leaderboards-tab"]').click();
    
    // View different leaderboard categories
    await page.locator('[data-testid="weekly-leaderboard"]').click();
    await expect(page.locator('[data-testid="leaderboard-rankings"]')).toBeVisible();
    
    await page.locator('[data-testid="monthly-leaderboard"]').click();
    await expect(page.locator('[data-testid="leaderboard-rankings"]')).toBeVisible();
    
    await page.locator('[data-testid="all-time-leaderboard"]').click();
    await expect(page.locator('[data-testid="leaderboard-rankings"]')).toBeVisible();
    
    // Verify user's position is shown
    await expect(page.locator('[data-testid="user-rank"]')).toBeVisible();
    
    // Verify ranking details
    const rankings = page.locator('[data-testid="ranking-item"]');
    await expect(rankings.first()).toBeVisible();
    await expect(rankings.first()).toContainText('#1');
  });
});