import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WorkoutPage extends BasePage {
  readonly startWorkoutButton: Locator;
  readonly templatesList: Locator;
  readonly exerciseSearch: Locator;
  readonly workoutPlayer: Locator;
  readonly setLogger: Locator;
  readonly restTimer: Locator;
  readonly completeWorkoutButton: Locator;
  readonly exerciseList: Locator;
  readonly addExerciseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.startWorkoutButton = page.locator('[data-testid="start-workout"]');
    this.templatesList = page.locator('[data-testid="workout-templates"]');
    this.exerciseSearch = page.locator('[data-testid="exercise-search"]');
    this.workoutPlayer = page.locator('[data-testid="workout-player"]');
    this.setLogger = page.locator('[data-testid="set-logger"]');
    this.restTimer = page.locator('[data-testid="rest-timer"]');
    this.completeWorkoutButton = page.locator('[data-testid="complete-workout"]');
    this.exerciseList = page.locator('[data-testid="exercise-list"]');
    this.addExerciseButton = page.locator('[data-testid="add-exercise"]');
  }

  async startQuickWorkout() {
    await this.startWorkoutButton.click();
    await this.page.waitForSelector('[data-testid="workout-player"]');
  }

  async selectTemplate(templateName: string) {
    await this.templatesList.locator(`text=${templateName}`).click();
    await this.page.waitForSelector('[data-testid="workout-player"]');
  }

  async addExercise(exerciseName: string) {
    await this.addExerciseButton.click();
    await this.exerciseSearch.fill(exerciseName);
    await this.page.locator(`[data-testid="exercise-item"]:has-text("${exerciseName}")`).first().click();
    await this.page.locator('[data-testid="add-selected-exercise"]').click();
  }

  async logSet(weight: number, reps: number, setType: string = 'normal') {
    const weightInput = this.setLogger.locator('[data-testid="weight-input"]');
    const repsInput = this.setLogger.locator('[data-testid="reps-input"]');
    const setTypeSelect = this.setLogger.locator('[data-testid="set-type-select"]');
    const logSetButton = this.setLogger.locator('[data-testid="log-set"]');

    await weightInput.fill(weight.toString());
    await repsInput.fill(reps.toString());
    
    if (setType !== 'normal') {
      await setTypeSelect.selectOption(setType);
    }
    
    await logSetButton.click();
    
    // Wait for set to be logged
    await this.page.waitForSelector('[data-testid="set-logged"]', { timeout: 5000 });
  }

  async startRestTimer() {
    const startTimerButton = this.restTimer.locator('[data-testid="start-timer"]');
    await startTimerButton.click();
    
    // Verify timer is running
    await expect(this.restTimer.locator('[data-testid="timer-running"]')).toBeVisible();
  }

  async skipRestTimer() {
    const skipButton = this.restTimer.locator('[data-testid="skip-timer"]');
    await skipButton.click();
  }

  async completeWorkout() {
    await this.completeWorkoutButton.click();
    
    // Wait for workout summary or completion confirmation
    await this.page.waitForSelector('[data-testid="workout-completed"]', { timeout: 10000 });
  }

  async verifyWorkoutInProgress() {
    await expect(this.workoutPlayer).toBeVisible();
    await expect(this.page.locator('[data-testid="workout-status"]')).toContainText('In Progress');
  }

  async verifySetLogged(exerciseName: string, setNumber: number) {
    const setElement = this.page.locator(
      `[data-testid="exercise-${exerciseName}"] [data-testid="set-${setNumber}"]`
    );
    await expect(setElement).toHaveClass(/completed/);
  }

  async pauseWorkout() {
    await this.page.locator('[data-testid="pause-workout"]').click();
    await expect(this.page.locator('[data-testid="workout-paused"]')).toBeVisible();
  }

  async resumeWorkout() {
    await this.page.locator('[data-testid="resume-workout"]').click();
    await expect(this.page.locator('[data-testid="workout-status"]')).toContainText('In Progress');
  }
}