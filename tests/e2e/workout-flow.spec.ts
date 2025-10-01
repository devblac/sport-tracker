import { test, expect } from '@playwright/test';
import { WorkoutPage } from './pages/WorkoutPage';

test.describe('Workout Flow E2E Tests', () => {
  let workoutPage: WorkoutPage;

  test.beforeEach(async ({ page }) => {
    workoutPage = new WorkoutPage(page);
    await workoutPage.goto('/');
    await workoutPage.waitForPageLoad();
  });

  test('Complete workout flow - Quick start', async ({ page }) => {
    // Navigate to workout section
    await workoutPage.navigateToWorkout();
    
    // Start a quick workout
    await workoutPage.startQuickWorkout();
    
    // Verify workout player is active
    await workoutPage.verifyWorkoutInProgress();
    
    // Add an exercise
    await workoutPage.addExercise('Bench Press');
    
    // Log first set
    await workoutPage.logSet(80, 10, 'normal');
    
    // Verify set was logged
    await workoutPage.verifySetLogged('Bench Press', 1);
    
    // Start rest timer
    await workoutPage.startRestTimer();
    
    // Skip rest timer for test speed
    await workoutPage.skipRestTimer();
    
    // Log second set
    await workoutPage.logSet(80, 8, 'normal');
    
    // Verify second set was logged
    await workoutPage.verifySetLogged('Bench Press', 2);
    
    // Complete workout
    await workoutPage.completeWorkout();
    
    // Verify workout completion
    await expect(page.locator('[data-testid="workout-completed"]')).toBeVisible();
    await expect(page.locator('[data-testid="workout-summary"]')).toBeVisible();
  });

  test('Workout flow with template', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    
    // Select a workout template
    await workoutPage.selectTemplate('Push Day');
    
    // Verify template loaded
    await workoutPage.verifyWorkoutInProgress();
    
    // Verify exercises from template are loaded
    await expect(page.locator('[data-testid="exercise-list"]')).toBeVisible();
    
    // Log sets for first exercise
    await workoutPage.logSet(100, 8, 'normal');
    await workoutPage.logSet(100, 6, 'normal');
    await workoutPage.logSet(90, 8, 'dropset');
    
    // Complete workout
    await workoutPage.completeWorkout();
    
    // Verify completion and XP gained
    await expect(page.locator('[data-testid="xp-gained"]')).toBeVisible();
  });

  test('Workout pause and resume functionality', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    
    // Add exercise and log a set
    await workoutPage.addExercise('Squat');
    await workoutPage.logSet(120, 5, 'normal');
    
    // Pause workout
    await workoutPage.pauseWorkout();
    
    // Verify workout is paused
    await expect(page.locator('[data-testid="workout-paused"]')).toBeVisible();
    
    // Resume workout
    await workoutPage.resumeWorkout();
    
    // Verify workout resumed
    await workoutPage.verifyWorkoutInProgress();
    
    // Continue and complete workout
    await workoutPage.logSet(120, 5, 'normal');
    await workoutPage.completeWorkout();
  });

  test('Workout auto-save functionality', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    
    // Add exercise and log sets
    await workoutPage.addExercise('Deadlift');
    await workoutPage.logSet(140, 5, 'normal');
    await workoutPage.logSet(150, 3, 'normal');
    
    // Simulate page refresh (auto-save test)
    await page.reload();
    await workoutPage.waitForPageLoad();
    
    // Navigate back to workout
    await workoutPage.navigateToWorkout();
    
    // Verify workout recovery
    await expect(page.locator('[data-testid="workout-recovery"]')).toBeVisible();
    
    // Resume recovered workout
    await page.locator('[data-testid="resume-recovered-workout"]').click();
    
    // Verify sets are still there
    await workoutPage.verifySetLogged('Deadlift', 1);
    await workoutPage.verifySetLogged('Deadlift', 2);
    
    // Complete workout
    await workoutPage.completeWorkout();
  });

  test('Offline workout functionality', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    
    // Start workout while online
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Pull-ups');
    
    // Go offline
    await workoutPage.simulateOffline();
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Continue workout offline
    await workoutPage.logSet(0, 12, 'normal'); // Bodyweight exercise
    await workoutPage.logSet(0, 10, 'normal');
    await workoutPage.logSet(0, 8, 'failure');
    
    // Complete workout offline
    await workoutPage.completeWorkout();
    
    // Verify offline completion
    await expect(page.locator('[data-testid="offline-workout-saved"]')).toBeVisible();
    
    // Go back online
    await workoutPage.simulateOnline();
    
    // Verify sync indicator
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();
    
    // Wait for sync completion
    await page.waitForSelector('[data-testid="sync-completed"]', { timeout: 10000 });
  });

  test('Rest timer functionality', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    
    // Log first set
    await workoutPage.logSet(80, 10, 'normal');
    
    // Start rest timer
    await workoutPage.startRestTimer();
    
    // Verify timer is running
    await expect(page.locator('[data-testid="timer-running"]')).toBeVisible();
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();
    
    // Wait a few seconds and verify countdown
    await page.waitForTimeout(3000);
    
    // Skip timer for test completion
    await workoutPage.skipRestTimer();
    
    // Verify timer stopped
    await expect(page.locator('[data-testid="timer-running"]')).not.toBeVisible();
  });

  test('Exercise history and previous sets display', async ({ page }) => {
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    
    // Verify previous workout data is shown (if exists)
    const previousSetsIndicator = page.locator('[data-testid="previous-sets"]');
    if (await previousSetsIndicator.isVisible()) {
      await expect(previousSetsIndicator).toContainText('Last workout:');
    }
    
    // Log sets
    await workoutPage.logSet(80, 10, 'normal');
    await workoutPage.logSet(85, 8, 'normal');
    
    // Complete workout
    await workoutPage.completeWorkout();
    
    // Start new workout to test history
    await workoutPage.navigateToWorkout();
    await workoutPage.startQuickWorkout();
    await workoutPage.addExercise('Bench Press');
    
    // Verify previous sets are now displayed
    await expect(page.locator('[data-testid="previous-sets"]')).toBeVisible();
    await expect(page.locator('[data-testid="previous-sets"]')).toContainText('80kg x 10');
  });
});