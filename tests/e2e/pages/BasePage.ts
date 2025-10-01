import { Page, Locator } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly bottomNavigation: Locator;
  readonly homeTab: Locator;
  readonly progressTab: Locator;
  readonly workoutTab: Locator;
  readonly socialTab: Locator;
  readonly profileTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.bottomNavigation = page.locator('[data-testid="bottom-navigation"]');
    this.homeTab = page.locator('[data-testid="nav-home"]');
    this.progressTab = page.locator('[data-testid="nav-progress"]');
    this.workoutTab = page.locator('[data-testid="nav-workout"]');
    this.socialTab = page.locator('[data-testid="nav-social"]');
    this.profileTab = page.locator('[data-testid="nav-profile"]');
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToHome() {
    await this.homeTab.click();
    await this.page.waitForURL('**/');
  }

  async navigateToProgress() {
    await this.progressTab.click();
    await this.page.waitForURL('**/progress');
  }

  async navigateToWorkout() {
    await this.workoutTab.click();
    await this.page.waitForURL('**/workout');
  }

  async navigateToSocial() {
    await this.socialTab.click();
    await this.page.waitForURL('**/social');
  }

  async navigateToProfile() {
    await this.profileTab.click();
    await this.page.waitForURL('**/profile');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  }

  async checkOfflineIndicator() {
    return await this.page.locator('[data-testid="offline-indicator"]').isVisible();
  }

  async simulateOffline() {
    await this.page.context().setOffline(true);
  }

  async simulateOnline() {
    await this.page.context().setOffline(false);
  }
}