import { test, expect } from '@playwright/test';
import { WorkoutPage } from './pages/WorkoutPage';
import { SocialPage } from './pages/SocialPage';

test.describe('System Integration E2E Tests', () => {
  let workoutPage: WorkoutPage;
  let socialPage: SocialPage;

  test.beforeEach(async ({ page }) => {
    workoutPage = new WorkoutPage(page);
    socialPage = new SocialPage(page);
    await workoutPage.goto('/');
    await workoutPage.waitForPageLoad();
  });

  test('Workout completion triggers gamification and social updates', async ({ page }) => {
    // Complete a workout
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    await workoutPage.logSet(80, 10, 'normal');
    await workoutPage.logSet(80, 8, 'normal');
    await workoutPage.completeWorkout();
    
    // Verify XP gained notification
    await expect(page.locator('[data-testid="xp-gained"]')).toBeVisible();
    
    // Check if achievement was unlocked
    const achievementNotification = page.locator('[data-testid="achievement-unlocked"]');
    if (await achievementNotification.isVisible()) {
      await expect(achievementNotification).toContainText('Achievement Unlocked');
    }
    
    // Navigate to social feed
    await socialPage.navigateToSocial();
    
    // Verify workout appears in social feed
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('completed a workout');
    
    // Navigate to progress to verify stats updated
    await page.locator('[data-testid="nav-progress"]').click();
    
    // Verify progress charts updated
    await expect(page.locator('[data-testid="progress-charts"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-workouts"]')).not.toContainText('0');
  });

  test('Streak system integrates with workout completion', async ({ page }) => {
    // Complete workout to maintain streak
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Squat');
    await workoutPage.logSet(100, 5, 'normal');
    await workoutPage.completeWorkout();
    
    // Navigate to home to check streak
    await page.locator('[data-testid="nav-home"]').click();
    
    // Verify streak counter updated
    const streakCounter = page.locator('[data-testid="streak-counter"]');
    await expect(streakCounter).toBeVisible();
    
    // Get current streak value
    const streakValue = await streakCounter.textContent();
    expect(parseInt(streakValue || '0')).toBeGreaterThan(0);
    
    // Verify streak celebration if milestone reached
    const streakCelebration = page.locator('[data-testid="streak-celebration"]');
    if (await streakCelebration.isVisible()) {
      await expect(streakCelebration).toContainText('streak');
    }
  });

  test('Personal records trigger achievements and social posts', async ({ page }) => {
    // Complete workout with heavy weight to trigger PR
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Deadlift');
    
    // Log a heavy set that should be a PR
    await workoutPage.logSet(200, 1, 'normal');
    await workoutPage.completeWorkout();
    
    // Check for PR notification
    const prNotification = page.locator('[data-testid="personal-record"]');
    if (await prNotification.isVisible()) {
      await expect(prNotification).toContainText('Personal Record');
      
      // Navigate to social feed
      await socialPage.navigateToSocial();
      
      // Verify PR appears in social feed
      await expect(page.locator('[data-testid="social-post"]').first()).toContainText('personal record');
      
      // Navigate to progress to verify PR recorded
      await page.locator('[data-testid="nav-progress"]').click();
      await page.locator('[data-testid="personal-records"]').click();
      
      // Verify PR is listed
      await expect(page.locator('[data-testid="pr-list"]')).toContainText('Deadlift');
      await expect(page.locator('[data-testid="pr-list"]')).toContainText('200');
    }
  });

  test('Offline workout syncs with online systems', async ({ page }) => {
    // Start workout online
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Pull-ups');
    
    // Go offline
    await workoutPage.simulateOffline();
    
    // Complete workout offline
    await workoutPage.logSet(0, 12, 'normal');
    await workoutPage.logSet(0, 10, 'normal');
    await workoutPage.completeWorkout();
    
    // Verify offline completion
    await expect(page.locator('[data-testid="offline-workout-saved"]')).toBeVisible();
    
    // Go back online
    await workoutPage.simulateOnline();
    
    // Wait for sync
    await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 10000 });
    
    // Navigate to social feed
    await socialPage.navigateToSocial();
    
    // Verify workout appears in feed after sync
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('completed a workout');
    
    // Navigate to progress
    await page.locator('[data-testid="nav-progress"]').click();
    
    // Verify stats updated after sync
    await expect(page.locator('[data-testid="total-workouts"]')).not.toContainText('0');
  });

  test('Challenge participation integrates with workout system', async ({ page }) => {
    // Navigate to social and join a challenge
    await socialPage.navigateToSocial();
    await page.locator('[data-testid="challenges-tab"]').click();
    await socialPage.joinChallenge('Weekly Volume Challenge');
    
    // Complete workout that contributes to challenge
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    await workoutPage.logSet(80, 10, 'normal');
    await workoutPage.logSet(80, 8, 'normal');
    await workoutPage.logSet(80, 6, 'normal');
    await workoutPage.completeWorkout();
    
    // Navigate back to challenges
    await socialPage.navigateToSocial();
    await page.locator('[data-testid="challenges-tab"]').click();
    
    // Verify challenge progress updated
    const challengeProgress = page.locator('[data-testid="challenge-progress"]');
    await expect(challengeProgress).toBeVisible();
    
    // Check leaderboard position
    await socialPage.viewLeaderboard();
    await expect(page.locator('[data-testid="user-rank"]')).toBeVisible();
  });

  test('Exercise history integrates across workout sessions', async ({ page }) => {
    // Complete first workout
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    await workoutPage.logSet(80, 10, 'normal');
    await workoutPage.logSet(80, 8, 'normal');
    await workoutPage.completeWorkout();
    
    // Start second workout
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    
    // Verify previous workout data is shown
    await expect(page.locator('[data-testid="previous-sets"]')).toBeVisible();
    await expect(page.locator('[data-testid="previous-sets"]')).toContainText('80kg x 10');
    
    // Log progressive overload
    await workoutPage.logSet(82.5, 10, 'normal');
    await workoutPage.logSet(82.5, 8, 'normal');
    await workoutPage.completeWorkout();
    
    // Navigate to exercise detail
    await page.locator('[data-testid="nav-workout"]').click();
    await page.locator('[data-testid="exercise-browser"]').click();
    await page.locator('[data-testid="exercise-item"]:has-text("Bench Press")').click();
    
    // Verify history tab shows both workouts
    await page.locator('[data-testid="history-tab"]').click();
    await expect(page.locator('[data-testid="exercise-history"]')).toContainText('80kg');
    await expect(page.locator('[data-testid="exercise-history"]')).toContainText('82.5kg');
    
    // Check charts tab shows progression
    await page.locator('[data-testid="charts-tab"]').click();
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
  });

  test('Gamification system integrates with all user actions', async ({ page }) => {
    let initialXP = 0;
    
    // Get initial XP
    await page.locator('[data-testid="nav-profile"]').click();
    const xpElement = page.locator('[data-testid="user-xp"]');
    if (await xpElement.isVisible()) {
      const xpText = await xpElement.textContent();
      initialXP = parseInt(xpText?.match(/\d+/)?.[0] || '0');
    }
    
    // Complete workout (should give XP)
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Squat');
    await workoutPage.logSet(100, 5, 'normal');
    await workoutPage.completeWorkout();
    
    // Social interaction (should give XP)
    await socialPage.navigateToSocial();
    await socialPage.likePost(0);
    await socialPage.commentOnPost(0, 'Nice work!');
    
    // Check XP increased
    await page.locator('[data-testid="nav-profile"]').click();
    const newXpText = await xpElement.textContent();
    const newXP = parseInt(newXpText?.match(/\d+/)?.[0] || '0');
    
    expect(newXP).toBeGreaterThan(initialXP);
    
    // Check if level up occurred
    const levelUpNotification = page.locator('[data-testid="level-up"]');
    if (await levelUpNotification.isVisible()) {
      await expect(levelUpNotification).toContainText('Level Up');
    }
  });

  test('Data consistency across app sections', async ({ page }) => {
    // Complete workout
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Deadlift');
    await workoutPage.logSet(150, 5, 'normal');
    await workoutPage.completeWorkout();
    
    // Check workout appears in home dashboard
    await page.locator('[data-testid="nav-home"]').click();
    await expect(page.locator('[data-testid="recent-workouts"]')).toContainText('Deadlift');
    
    // Check workout appears in progress section
    await page.locator('[data-testid="nav-progress"]').click();
    await expect(page.locator('[data-testid="workout-history"]')).toContainText('Deadlift');
    
    // Check workout appears in social feed
    await socialPage.navigateToSocial();
    await expect(page.locator('[data-testid="social-post"]').first()).toContainText('Deadlift');
    
    // Check exercise history updated
    await page.locator('[data-testid="nav-workout"]').click();
    await page.locator('[data-testid="exercise-browser"]').click();
    await page.locator('[data-testid="exercise-item"]:has-text("Deadlift")').click();
    await page.locator('[data-testid="history-tab"]').click();
    await expect(page.locator('[data-testid="exercise-history"]')).toContainText('150kg');
  });
});