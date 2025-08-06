/**
 * Test utility for Supabase Percentile System
 * 
 * Use this to test the percentile calculation system during development.
 */

import { supabasePercentileService } from '../services/SupabasePercentileService';

export interface TestResults {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SupabasePercentileTestRunner {
  
  /**
   * Test basic connection to Supabase
   */
  async testConnection(): Promise<TestResults> {
    try {
      const segments = await supabasePercentileService.getSegments();
      
      if (segments.length > 0) {
        return {
          success: true,
          message: `Successfully connected to Supabase. Found ${segments.length} demographic segments.`,
          data: segments.slice(0, 3) // Show first 3 segments
        };
      } else {
        return {
          success: false,
          message: 'Connected to Supabase but no demographic segments found. Run migrations first.',
          error: 'No segments found'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to Supabase',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test percentile data retrieval for a sample user
   */
  async testPercentileRetrieval(): Promise<TestResults> {
    try {
      // Use one of the seeded test users
      const testUserId = '11111111-1111-1111-1111-111111111111';
      const testExerciseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      
      const percentiles = await supabasePercentileService.getUserExercisePercentiles(
        testUserId, 
        testExerciseId
      );
      
      if (percentiles.length > 0) {
        return {
          success: true,
          message: `Successfully retrieved ${percentiles.length} percentile records for test user.`,
          data: percentiles
        };
      } else {
        return {
          success: false,
          message: 'No percentile data found for test user. Run percentile calculation first.',
          error: 'No percentile data'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve percentile data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test exercise statistics retrieval
   */
  async testExerciseStatistics(): Promise<TestResults> {
    try {
      const testExerciseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const stats = await supabasePercentileService.getExerciseStatistics(testExerciseId);
      
      if (stats.length > 0) {
        return {
          success: true,
          message: `Successfully retrieved statistics for ${stats.length} segments.`,
          data: stats.slice(0, 2) // Show first 2 stats
        };
      } else {
        return {
          success: false,
          message: 'No exercise statistics found. Run percentile calculation first.',
          error: 'No statistics data'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve exercise statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test overall user percentile calculation
   */
  async testOverallPercentile(): Promise<TestResults> {
    try {
      const testUserId = '11111111-1111-1111-1111-111111111111';
      const overall = await supabasePercentileService.getUserOverallPercentile(testUserId);
      
      return {
        success: true,
        message: `Successfully calculated overall percentile: ${overall.overallPercentile}th percentile across ${overall.totalExercises} exercises.`,
        data: overall
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to calculate overall percentile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test percentile calculation trigger
   */
  async testCalculationTrigger(): Promise<TestResults> {
    try {
      const success = await supabasePercentileService.triggerPercentileCalculation();
      
      if (success) {
        return {
          success: true,
          message: 'Successfully triggered percentile calculation. Check the results in a few minutes.',
          data: { triggered: true }
        };
      } else {
        return {
          success: false,
          message: 'Failed to trigger percentile calculation. Check Edge Function deployment.',
          error: 'Trigger failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error triggering percentile calculation',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run all tests in sequence
   */
  async runAllTests(): Promise<TestResults[]> {
    console.log('🧪 Running Supabase Percentile System Tests...\n');
    
    const tests = [
      { name: 'Connection Test', test: () => this.testConnection() },
      { name: 'Percentile Retrieval Test', test: () => this.testPercentileRetrieval() },
      { name: 'Exercise Statistics Test', test: () => this.testExerciseStatistics() },
      { name: 'Overall Percentile Test', test: () => this.testOverallPercentile() },
      { name: 'Calculation Trigger Test', test: () => this.testCalculationTrigger() }
    ];

    const results: TestResults[] = [];

    for (const { name, test } of tests) {
      console.log(`Running ${name}...`);
      const result = await test();
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${name}: ${result.message}`);
      } else {
        console.log(`❌ ${name}: ${result.message}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      console.log('');
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Test Results: ${successCount}/${results.length} tests passed`);
    
    if (successCount === results.length) {
      console.log('🎉 All tests passed! Your Supabase percentile system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the setup guide and try again.');
    }

    return results;
  }
}

// Export a singleton instance for easy use
export const percentileTestRunner = new SupabasePercentileTestRunner();

// Helper function to run tests from console
export const runPercentileTests = () => percentileTestRunner.runAllTests();