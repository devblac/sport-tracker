import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic App Functionality', () => {
  test('App loads and displays main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Check that the app loads
    await expect(page).toHaveTitle(/Sport Tracker|Fitness/);
    
    // Check main navigation exists
    const navigation = page.locator('[data-testid="bottom-navigation"]');
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible();
    } else {
      // Fallback: check for any navigation elements
      const navElements = page.locator('nav, [role="navigation"]');
      await expect(navElements.first()).toBeVisible();
    }
    
    // Check that React app is mounted
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeVisible();
    
    // Basic interaction test - try to navigate
    const homeLink = page.locator('a[href="/"], button:has-text("Home"), [data-testid*="home"]');
    if (await homeLink.first().isVisible()) {
      await homeLink.first().click();
    }
  });

  test('App works offline', async ({ page }) => {
    // Load app online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Reload page
    await page.reload();
    
    // App should still work
    await expect(page.locator('#root')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
  });

  test('App is responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // App should still be visible and functional
    await expect(page.locator('#root')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    // App should still be visible and functional
    await expect(page.locator('#root')).toBeVisible();
  });
});