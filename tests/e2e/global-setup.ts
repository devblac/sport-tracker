import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the dev server to be ready
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Initialize test data if needed
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear();
      
      // Set up test user data
      const testUser = {
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
        }
      };
      
      localStorage.setItem('auth_user', JSON.stringify(testUser));
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('is_authenticated', 'true');
    });
    
    console.log('✅ E2E test setup completed');
  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;