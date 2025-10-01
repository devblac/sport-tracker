import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('Home page accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Workout page accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to workout section
    await page.locator('[data-testid="nav-workout"]').click();
    await page.waitForSelector('[data-testid="workout-section"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Social page accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to social section
    await page.locator('[data-testid="nav-social"]').click();
    await page.waitForSelector('[data-testid="social-section"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works throughout app', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test tab navigation through bottom navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-home"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-progress"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-workout"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-social"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-profile"]')).toBeFocused();
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    await page.waitForURL('**/profile');
  });

  test('Screen reader compatibility - ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check main navigation has proper ARIA labels
    const navigation = page.locator('[data-testid="bottom-navigation"]');
    await expect(navigation).toHaveAttribute('role', 'navigation');
    await expect(navigation).toHaveAttribute('aria-label', /main navigation/i);
    
    // Check navigation items have proper labels
    await expect(page.locator('[data-testid="nav-home"]')).toHaveAttribute('aria-label', /home/i);
    await expect(page.locator('[data-testid="nav-workout"]')).toHaveAttribute('aria-label', /workout/i);
    await expect(page.locator('[data-testid="nav-social"]')).toHaveAttribute('aria-label', /social/i);
    
    // Navigate to workout section and check form accessibility
    await page.locator('[data-testid="nav-workout"]').click();
    
    // Check workout forms have proper labels
    const exerciseSearch = page.locator('[data-testid="exercise-search"]');
    if (await exerciseSearch.isVisible()) {
      await expect(exerciseSearch).toHaveAttribute('aria-label', /search exercises/i);
    }
  });

  test('Color contrast and visual accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test both light and dark themes
    const themes = ['light', 'dark'];
    
    for (const theme of themes) {
      // Switch theme
      await page.locator('[data-testid="nav-profile"]').click();
      await page.locator('[data-testid="theme-toggle"]').click();
      
      // Wait for theme change
      await page.waitForTimeout(500);
      
      // Run accessibility scan for current theme
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      // Check for color contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      );
      
      expect(contrastViolations).toEqual([]);
    }
  });

  test('Focus management and visual indicators', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to workout section
    await page.locator('[data-testid="nav-workout"]').click();
    
    // Start a workout to test focus management in forms
    await page.locator('[data-testid="start-workout"]').click();
    
    // Check that focus moves appropriately in workout forms
    const weightInput = page.locator('[data-testid="weight-input"]');
    const repsInput = page.locator('[data-testid="reps-input"]');
    
    if (await weightInput.isVisible()) {
      await weightInput.focus();
      await expect(weightInput).toBeFocused();
      
      // Tab to next input
      await page.keyboard.press('Tab');
      await expect(repsInput).toBeFocused();
      
      // Check focus indicators are visible
      await expect(weightInput).toHaveCSS('outline-width', /[1-9]/);
    }
  });

  test('Alternative text for images and media', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise browser
    await page.locator('[data-testid="nav-workout"]').click();
    await page.locator('[data-testid="exercise-browser"]').click();
    
    // Wait for exercises to load
    await page.waitForSelector('[data-testid="exercise-list"]');
    
    // Check that exercise images have alt text
    const exerciseImages = page.locator('[data-testid="exercise-image"]');
    const imageCount = await exerciseImages.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const image = exerciseImages.nth(i);
      if (await image.isVisible()) {
        await expect(image).toHaveAttribute('alt');
        const altText = await image.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('Form validation and error messaging accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to profile to test form validation
    await page.locator('[data-testid="nav-profile"]').click();
    
    // Try to submit invalid form data
    const profileForm = page.locator('[data-testid="profile-form"]');
    if (await profileForm.isVisible()) {
      // Clear required field
      const displayNameInput = page.locator('[data-testid="display-name-input"]');
      await displayNameInput.clear();
      
      // Submit form
      await page.locator('[data-testid="save-profile"]').click();
      
      // Check error message accessibility
      const errorMessage = page.locator('[data-testid="display-name-error"]');
      if (await errorMessage.isVisible()) {
        // Error should be associated with input
        await expect(displayNameInput).toHaveAttribute('aria-describedby');
        await expect(errorMessage).toHaveAttribute('role', 'alert');
      }
    }
  });

  test('Mobile accessibility and touch targets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that touch targets are large enough (44px minimum)
    const navigationButtons = page.locator('[data-testid^="nav-"]');
    const buttonCount = await navigationButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = navigationButtons.nth(i);
      const boundingBox = await button.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
      }
    }
    
    // Test touch interactions
    await page.locator('[data-testid="nav-workout"]').tap();
    await page.waitForURL('**/workout');
    
    // Verify touch interaction worked
    await expect(page.locator('[data-testid="workout-section"]')).toBeVisible();
  });

  test('Reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate between sections and verify animations are reduced
    await page.locator('[data-testid="nav-workout"]').click();
    await page.waitForSelector('[data-testid="workout-section"]');
    
    // Check that transition durations are reduced or removed
    const workoutSection = page.locator('[data-testid="workout-section"]');
    const transitionDuration = await workoutSection.evaluate(el => 
      getComputedStyle(el).transitionDuration
    );
    
    // Should be either '0s' or very short duration
    expect(['0s', '0.01s', '0.1s']).toContain(transitionDuration);
  });

  test('Language and internationalization accessibility', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that HTML has lang attribute
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('lang');
    
    // Check that content is properly marked for screen readers
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveAttribute('role', 'main');
    
    // Test language switching if available
    const languageSelector = page.locator('[data-testid="language-selector"]');
    if (await languageSelector.isVisible()) {
      await expect(languageSelector).toHaveAttribute('aria-label', /language/i);
    }
  });
});