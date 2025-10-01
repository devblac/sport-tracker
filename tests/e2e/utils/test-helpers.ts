import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the app to be fully loaded and ready
   */
  async waitForAppReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  }

  /**
   * Setup test user with specific data
   */
  async setupTestUser(userData: any = {}) {
    const defaultUser = {
      id: 'test-user-e2e',
      email: 'test@example.com',
      username: 'testuser',
      role: 'basic',
      profile: {
        display_name: 'Test User',
        fitness_level: 'intermediate',
        goals: ['strength', 'muscle_gain'],
        scheduled_days: ['monday', 'wednesday', 'friday']
      },
      gamification: {
        level: 5,
        total_xp: 1250,
        current_streak: 3,
        best_streak: 7,
        achievements_unlocked: ['first_workout', 'week_warrior']
      },
      ...userData
    };

    await this.page.evaluate((user) => {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('is_authenticated', 'true');
    }, defaultUser);
  }

  /**
   * Clear all test data
   */
  async clearTestData() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('fitness-app-db');
      }
    });
  }

  /**
   * Simulate network conditions
   */
  async simulateSlowNetwork() {
    await this.page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
  }

  async simulateNetworkError() {
    await this.page.route('**/*', async (route) => {
      await route.abort('failed');
    });
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for element with custom timeout and error message
   */
  async waitForElementWithTimeout(selector: string, timeout: number = 5000, errorMessage?: string) {
    try {
      await this.page.waitForSelector(selector, { timeout });
    } catch (error) {
      if (errorMessage) {
        throw new Error(`${errorMessage}: ${error}`);
      }
      throw error;
    }
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fill form with data object
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.locator(`[data-testid="${field}"]`);
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  /**
   * Verify toast notification appears
   */
  async verifyToastNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const toast = this.page.locator(`[data-testid="toast-${type}"]`);
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
    
    // Wait for toast to disappear
    await expect(toast).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState(isLoading: boolean = true) {
    const loadingIndicator = this.page.locator('[data-testid="loading"]');
    if (isLoading) {
      await expect(loadingIndicator).toBeVisible();
    } else {
      await expect(loadingIndicator).not.toBeVisible();
    }
  }

  /**
   * Mock API responses
   */
  async mockApiResponse(endpoint: string, response: any, status: number = 200) {
    await this.page.route(`**/${endpoint}`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Verify accessibility of current page
   */
  async verifyPageAccessibility() {
    // This would integrate with axe-core
    const violations = await this.page.evaluate(async () => {
      // @ts-ignore
      if (typeof axe !== 'undefined') {
        // @ts-ignore
        const results = await axe.run();
        return results.violations;
      }
      return [];
    });

    expect(violations).toHaveLength(0);
  }

  /**
   * Measure page performance
   */
  async measurePagePerformance() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    return metrics;
  }

  /**
   * Verify responsive design at different viewports
   */
  async testResponsiveDesign(breakpoints: { name: string; width: number; height: number }[]) {
    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForTimeout(500); // Allow layout to settle
      
      // Verify navigation is accessible
      await expect(this.page.locator('[data-testid="bottom-navigation"]')).toBeVisible();
      
      // Take screenshot for visual regression testing
      await this.page.screenshot({ 
        path: `test-results/responsive/${breakpoint.name}.png`,
        fullPage: true 
      });
    }
  }

  /**
   * Simulate user interactions with delays
   */
  async simulateHumanInteraction(actions: Array<{ type: 'click' | 'type' | 'wait'; selector?: string; text?: string; delay?: number }>) {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await this.page.locator(action.selector).click();
          }
          break;
        case 'type':
          if (action.selector && action.text) {
            await this.page.locator(action.selector).type(action.text, { delay: 100 });
          }
          break;
        case 'wait':
          await this.page.waitForTimeout(action.delay || 1000);
          break;
      }
      
      // Add small delay between actions to simulate human behavior
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Verify data persistence across page reloads
   */
  async verifyDataPersistence(dataSelector: string, expectedValue: string) {
    // Get initial value
    const initialValue = await this.page.locator(dataSelector).textContent();
    expect(initialValue).toContain(expectedValue);
    
    // Reload page
    await this.page.reload();
    await this.waitForAppReady();
    
    // Verify value persisted
    const persistedValue = await this.page.locator(dataSelector).textContent();
    expect(persistedValue).toContain(expectedValue);
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(expectedFocusOrder: string[]) {
    // Start from first element
    await this.page.keyboard.press('Tab');
    
    for (const selector of expectedFocusOrder) {
      await expect(this.page.locator(selector)).toBeFocused();
      await this.page.keyboard.press('Tab');
    }
  }

  /**
   * Verify error handling
   */
  async verifyErrorHandling(triggerError: () => Promise<void>, expectedErrorMessage: string) {
    await triggerError();
    
    const errorElement = this.page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(expectedErrorMessage);
  }
}