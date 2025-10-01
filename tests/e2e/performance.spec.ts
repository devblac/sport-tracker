import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Performance E2E Tests', () => {
  test('Lighthouse performance audit - Home page', async ({ page, browserName }) => {
    // Skip webkit for Lighthouse (not supported)
    test.skip(browserName === 'webkit', 'Lighthouse not supported on WebKit');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run Lighthouse audit
    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
        pwa: 80,
      },
      port: 9222,
    });
  });

  test('Page load performance metrics', async ({ page }) => {
    // Navigate to home page and measure performance
    const startTime = Date.now();
    await page.goto('/');
    
    // Wait for app to be fully loaded
    await page.waitForSelector('[data-testid="app-loaded"]');
    const loadTime = Date.now() - startTime;
    
    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime;
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    console.log('Performance metrics:', metrics);
  });

  test('Bundle size and resource loading', async ({ page }) => {
    // Track network requests
    const requests: string[] = [];
    const responses: { url: string; size: number; status: number }[] = [];
    
    page.on('request', (request) => {
      requests.push(request.url());
    });
    
    page.on('response', (response) => {
      responses.push({
        url: response.url(),
        size: response.headers()['content-length'] ? parseInt(response.headers()['content-length']) : 0,
        status: response.status(),
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Calculate total bundle size
    const jsFiles = responses.filter(r => r.url.includes('.js') && r.status === 200);
    const cssFiles = responses.filter(r => r.url.includes('.css') && r.status === 200);
    
    const totalJSSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
    const totalCSSSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
    
    console.log(`Total JS size: ${(totalJSSize / 1024).toFixed(2)} KB`);
    console.log(`Total CSS size: ${(totalCSSSize / 1024).toFixed(2)} KB`);
    
    // Assert bundle size is reasonable (under 5MB as per requirements)
    expect(totalJSSize + totalCSSSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('Lazy loading performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Track initial requests
    const initialRequests = new Set<string>();
    page.on('request', (request) => {
      initialRequests.add(request.url());
    });
    
    // Navigate to different sections and verify lazy loading
    await page.locator('[data-testid="nav-progress"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify new chunks were loaded
    const progressRequests = new Set<string>();
    page.on('request', (request) => {
      if (!initialRequests.has(request.url())) {
        progressRequests.add(request.url());
      }
    });
    
    // Navigate to workout section
    await page.locator('[data-testid="nav-workout"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify workout-specific chunks were loaded
    expect(progressRequests.size).toBeGreaterThan(0);
  });

  test('Offline performance and caching', async ({ page }) => {
    // Load page online first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Reload page and measure offline performance
    const startTime = Date.now();
    await page.reload();
    await page.waitForSelector('[data-testid="app-loaded"]');
    const offlineLoadTime = Date.now() - startTime;
    
    // Offline load should be faster due to caching
    expect(offlineLoadTime).toBeLessThan(2000);
    
    // Verify offline indicator is shown
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Test offline functionality
    await page.locator('[data-testid="nav-workout"]').click();
    await expect(page.locator('[data-testid="workout-section"]')).toBeVisible();
  });

  test('Memory usage and performance over time', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    // Simulate heavy usage - navigate between sections multiple times
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="nav-workout"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="nav-progress"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="nav-social"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="nav-home"]').click();
      await page.waitForTimeout(500);
    }
    
    // Get memory usage after heavy usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('Database query performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to exercise browser (data-heavy section)
    await page.locator('[data-testid="nav-workout"]').click();
    await page.locator('[data-testid="exercise-browser"]').click();
    
    // Measure time to load exercise list
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="exercise-list"]');
    const loadTime = Date.now() - startTime;
    
    // Exercise list should load quickly
    expect(loadTime).toBeLessThan(2000);
    
    // Test search performance
    const searchStartTime = Date.now();
    await page.locator('[data-testid="exercise-search"]').fill('bench');
    await page.waitForSelector('[data-testid="search-results"]');
    const searchTime = Date.now() - searchStartTime;
    
    // Search should be fast
    expect(searchTime).toBeLessThan(1000);
  });

  test('Animation and interaction performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test navigation animation performance
    const navigationTimes: number[] = [];
    
    for (const tab of ['workout', 'progress', 'social', 'profile']) {
      const startTime = Date.now();
      await page.locator(`[data-testid="nav-${tab}"]`).click();
      await page.waitForSelector(`[data-testid="${tab}-section"]`);
      const navTime = Date.now() - startTime;
      navigationTimes.push(navTime);
    }
    
    // All navigation should be under 500ms
    navigationTimes.forEach(time => {
      expect(time).toBeLessThan(500);
    });
    
    // Test scroll performance
    await page.locator('[data-testid="nav-progress"]').click();
    
    // Scroll through progress charts
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('[data-testid="progress-charts"]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
    
    // Verify smooth scrolling completed
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="progress-charts"]')).toBeVisible();
  });
});