import { test, expect } from '@playwright/test';

test('basic app functionality', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Check if the page loaded successfully
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if React root exists
  const root = page.locator('#root');
  await expect(root).toBeVisible();
  
  console.log('Basic test completed successfully');
});