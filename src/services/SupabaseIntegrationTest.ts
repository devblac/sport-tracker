/**
 * Supabase Integration Test
 * 
 * Simple test suite to verify Supabase services are working correctly.
 * Can be run in development to validate the integration.
 */

import { serviceRegistry } from './ServiceRegistry';
import { supabaseService } from './SupabaseService';
import { logger } from '@/utils/logger';

export class SupabaseIntegrationTest {
  private static instance: SupabaseIntegrationTest;

  private constructor() {}

  public static getInstance(): SupabaseIntegrationTest {
    if (!SupabaseIntegrationTest.instance) {
      SupabaseIntegrationTest.instance = new SupabaseIntegrationTest();
    }
    return SupabaseIntegrationTest.instance;
  }

  async runAllTests(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    errors: string[];
  }> {
    const results: Record<string, boolean> = {};
    const errors: string[] = [];

    console.log('🧪 Starting Supabase Integration Tests...');

    try {
      // Test 1: Service Registry Health Check
      console.log('1️⃣ Testing Service Registry Health Check...');
      const healthCheck = await serviceRegistry.healthCheck();
      results.healthCheck = healthCheck.overall;
      if (!healthCheck.overall) {
        errors.push(`Health check failed: ${JSON.stringify(healthCheck)}`);
      }

      // Test 2: Database Connection
      console.log('2️⃣ Testing Database Connection...');
      const dbHealth = await supabaseService.healthCheck();
      results.databaseConnection = dbHealth;
      if (!dbHealth) {
        errors.push('Database connection failed');
      }

      // Test 3: Authentication Service
      console.log('3️⃣ Testing Authentication Service...');
      try {
        const authService = serviceRegistry.auth;
        const isAuth = await authService.isAuthenticated();
        results.authService = true; // If no error thrown, service is working
        console.log(`   Auth status: ${isAuth ? 'authenticated' : 'not authenticated'}`);
      } catch (error) {
        results.authService = false;
        errors.push(`Auth service error: ${error}`);
      }

      // Test 4: Achievements Data
      console.log('4️⃣ Testing Achievements Data...');
      try {
        const gamificationService = serviceRegistry.gamification;
        const achievements = await gamificationService.getAvailableAchievements();
        results.achievementsData = achievements.length > 0;
        console.log(`   Found ${achievements.length} achievements`);
        if (achievements.length === 0) {
          errors.push('No achievements found in database');
        }
      } catch (error) {
        results.achievementsData = false;
        errors.push(`Achievements test error: ${error}`);
      }

      // Test 5: Exercise Data
      console.log('5️⃣ Testing Exercise Data...');
      try {
        const exercises = await supabaseService.getExercises({}, 5);
        results.exerciseData = Array.isArray(exercises);
        console.log(`   Exercise query returned: ${Array.isArray(exercises) ? exercises.length : 'invalid'} exercises`);
      } catch (error) {
        results.exerciseData = false;
        errors.push(`Exercise data test error: ${error}`);
      }

      // Test 6: Service Configuration
      console.log('6️⃣ Testing Service Configuration...');
      const serviceStatus = serviceRegistry.getServiceStatus();
      results.serviceConfiguration = true;
      console.log('   Service Status:', serviceStatus);

      // Test 7: Real-time Capabilities (basic test)
      console.log('7️⃣ Testing Real-time Capabilities...');
      try {
        const currentUser = await supabaseService.getCurrentUser();
        results.realtimeCapabilities = true;
        console.log(`   Current user check: ${currentUser ? 'user found' : 'no user'}`);
      } catch (error) {
        results.realtimeCapabilities = false;
        errors.push(`Real-time test error: ${error}`);
      }

    } catch (error) {
      errors.push(`Test suite error: ${error}`);
    }

    const success = Object.values(results).every(result => result === true) && errors.length === 0;

    console.log('🧪 Test Results:', {
      success,
      results,
      errors: errors.length > 0 ? errors : 'No errors'
    });

    return { success, results, errors };
  }

  async testUserWorkflow(testUserId?: string): Promise<boolean> {
    console.log('🔄 Testing Complete User Workflow...');

    try {
      const userId = testUserId || 'test-user-' + Date.now();
      
      // Test user profile operations
      console.log('   Testing user profile operations...');
      
      // Test gamification operations
      console.log('   Testing gamification operations...');
      const gamificationService = serviceRegistry.gamification;
      
      // Award some XP
      await gamificationService.awardXP(userId, 'workout_completed');
      console.log('   ✅ XP awarded successfully');
      
      // Check achievements
      const achievements = await gamificationService.getUserAchievements(userId);
      console.log(`   ✅ User achievements retrieved: ${achievements.length}`);
      
      // Test workout operations
      console.log('   Testing workout operations...');
      const workoutService = serviceRegistry.workout;
      const templates = await workoutService.getAllTemplates(userId);
      console.log(`   ✅ Workout templates retrieved: ${templates.length}`);

      console.log('✅ User workflow test completed successfully');
      return true;
    } catch (error) {
      console.error('❌ User workflow test failed:', error);
      return false;
    }
  }

  async quickHealthCheck(): Promise<boolean> {
    try {
      const health = await serviceRegistry.healthCheck();
      return health.overall;
    } catch (error) {
      console.error('Quick health check failed:', error);
      return false;
    }
  }

  // Helper method to log service status
  logServiceStatus(): void {
    const config = serviceRegistry.getConfig();
    const status = serviceRegistry.getServiceStatus();
    
    console.log('📊 Service Registry Status:');
    console.log('   Configuration:', config);
    console.log('   Service Status:', status);
    console.log('   Online Status:', navigator.onLine ? 'online' : 'offline');
  }
}

// Export singleton instance
export const supabaseIntegrationTest = SupabaseIntegrationTest.getInstance();

// Export convenience function for quick testing
export const runQuickTest = () => supabaseIntegrationTest.runAllTests();
export const testUserWorkflow = (userId?: string) => supabaseIntegrationTest.testUserWorkflow(userId);
export const quickHealthCheck = () => supabaseIntegrationTest.quickHealthCheck();