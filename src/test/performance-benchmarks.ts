/**
 * Performance Benchmarks Configuration
 * 
 * Defines performance benchmarks for critical components
 * and establishes baseline performance expectations
 */

import { PerformanceBenchmark } from './performance-tester';

/**
 * Critical component performance benchmarks
 * These represent the maximum acceptable performance thresholds
 */
export const PERFORMANCE_BENCHMARKS: PerformanceBenchmark[] = [
  // Core UI Components
  {
    name: 'Button Component Render',
    component: 'Button',
    maxRenderTime: 5, // 5ms
    maxMemoryIncrease: 1024 * 10, // 10KB
  },
  {
    name: 'Input Component Render',
    component: 'Input',
    maxRenderTime: 8, // 8ms
    maxMemoryIncrease: 1024 * 15, // 15KB
  },
  {
    name: 'Modal Component Render',
    component: 'Modal',
    maxRenderTime: 15, // 15ms
    maxMemoryIncrease: 1024 * 25, // 25KB
  },

  // Workout Components
  {
    name: 'WorkoutPlayer Render',
    component: 'WorkoutPlayer',
    maxRenderTime: 50, // 50ms
    maxMemoryIncrease: 1024 * 100, // 100KB
  },
  {
    name: 'ExerciseCard Render',
    component: 'ExerciseCard',
    maxRenderTime: 10, // 10ms
    maxMemoryIncrease: 1024 * 20, // 20KB
  },
  {
    name: 'WorkoutList Render',
    component: 'WorkoutList',
    maxRenderTime: 100, // 100ms for list of 50 items
    maxMemoryIncrease: 1024 * 200, // 200KB
  },

  // Social Components
  {
    name: 'SocialFeed Render',
    component: 'SocialFeed',
    maxRenderTime: 80, // 80ms
    maxMemoryIncrease: 1024 * 150, // 150KB
    minCacheHitRate: 70, // 70% cache hit rate for feed data
  },
  {
    name: 'PostCard Render',
    component: 'PostCard',
    maxRenderTime: 12, // 12ms
    maxMemoryIncrease: 1024 * 25, // 25KB
  },
  {
    name: 'Leaderboard Render',
    component: 'Leaderboard',
    maxRenderTime: 60, // 60ms
    maxMemoryIncrease: 1024 * 80, // 80KB
  },

  // Gamification Components
  {
    name: 'XPDisplay Render',
    component: 'XPDisplay',
    maxRenderTime: 8, // 8ms
    maxMemoryIncrease: 1024 * 15, // 15KB
  },
  {
    name: 'AchievementCard Render',
    component: 'AchievementCard',
    maxRenderTime: 15, // 15ms
    maxMemoryIncrease: 1024 * 30, // 30KB
  },
  {
    name: 'StreakCounter Render',
    component: 'StreakCounter',
    maxRenderTime: 10, // 10ms
    maxMemoryIncrease: 1024 * 20, // 20KB
  },

  // Page Components
  {
    name: 'Dashboard Page Render',
    component: 'Dashboard',
    maxRenderTime: 200, // 200ms
    maxMemoryIncrease: 1024 * 500, // 500KB
    minCacheHitRate: 80, // 80% cache hit rate for dashboard data
  },
  {
    name: 'Profile Page Render',
    component: 'Profile',
    maxRenderTime: 150, // 150ms
    maxMemoryIncrease: 1024 * 300, // 300KB
  },
  {
    name: 'Workout Page Render',
    component: 'WorkoutPage',
    maxRenderTime: 180, // 180ms
    maxMemoryIncrease: 1024 * 400, // 400KB
  },

  // Data-Heavy Components
  {
    name: 'Analytics Chart Render',
    component: 'AnalyticsChart',
    maxRenderTime: 120, // 120ms
    maxMemoryIncrease: 1024 * 250, // 250KB
  },
  {
    name: 'Exercise Database Render',
    component: 'ExerciseDatabase',
    maxRenderTime: 100, // 100ms
    maxMemoryIncrease: 1024 * 200, // 200KB
    minCacheHitRate: 85, // 85% cache hit rate for exercise data
  }
];

/**
 * Performance thresholds for different component categories
 */
export const PERFORMANCE_CATEGORIES = {
  UI_COMPONENTS: {
    maxRenderTime: 10, // 10ms for basic UI components
    maxMemoryIncrease: 1024 * 20, // 20KB
  },
  WORKOUT_COMPONENTS: {
    maxRenderTime: 50, // 50ms for workout-related components
    maxMemoryIncrease: 1024 * 100, // 100KB
  },
  PAGE_COMPONENTS: {
    maxRenderTime: 200, // 200ms for full page renders
    maxMemoryIncrease: 1024 * 500, // 500KB
  },
  DATA_COMPONENTS: {
    maxRenderTime: 120, // 120ms for data-heavy components
    maxMemoryIncrease: 1024 * 250, // 250KB
    minCacheHitRate: 75, // 75% minimum cache hit rate
  }
};

/**
 * Memory leak detection thresholds
 */
export const MEMORY_LEAK_THRESHOLDS = {
  ITERATIONS: 20, // Number of render iterations for leak detection
  MAX_GROWTH: 1024 * 1024, // 1MB maximum memory growth
  GROWTH_RATE: 0.1, // 10% maximum growth rate per iteration
};

/**
 * Cache performance expectations
 */
export const CACHE_PERFORMANCE_TARGETS = {
  MIN_HIT_RATE: 70, // 70% minimum cache hit rate
  MAX_EVICTION_RATE: 5, // 5% maximum eviction rate
  MAX_MISS_RATE: 30, // 30% maximum miss rate
};

/**
 * Performance regression detection settings
 */
export const REGRESSION_DETECTION = {
  BASELINE_SAMPLES: 10, // Number of samples for baseline
  REGRESSION_THRESHOLD: 1.2, // 20% performance degradation threshold
  MEMORY_REGRESSION_THRESHOLD: 1.5, // 50% memory usage increase threshold
};

/**
 * Get benchmark by component name
 */
export function getBenchmarkByComponent(componentName: string): PerformanceBenchmark | undefined {
  return PERFORMANCE_BENCHMARKS.find(benchmark => 
    benchmark.component === componentName
  );
}

/**
 * Get benchmarks by category
 */
export function getBenchmarksByCategory(category: keyof typeof PERFORMANCE_CATEGORIES): PerformanceBenchmark[] {
  const categoryThresholds = PERFORMANCE_CATEGORIES[category];
  
  return PERFORMANCE_BENCHMARKS.filter(benchmark => {
    switch (category) {
      case 'UI_COMPONENTS':
        return benchmark.maxRenderTime <= categoryThresholds.maxRenderTime;
      case 'WORKOUT_COMPONENTS':
        return benchmark.component.toLowerCase().includes('workout') || 
               benchmark.component.toLowerCase().includes('exercise');
      case 'PAGE_COMPONENTS':
        return benchmark.component.toLowerCase().includes('page') ||
               benchmark.component === 'Dashboard' ||
               benchmark.component === 'Profile';
      case 'DATA_COMPONENTS':
        return benchmark.minCacheHitRate !== undefined;
      default:
        return false;
    }
  });
}

/**
 * Create a custom benchmark for a component
 */
export function createCustomBenchmark(
  componentName: string,
  category: keyof typeof PERFORMANCE_CATEGORIES,
  overrides?: Partial<PerformanceBenchmark>
): PerformanceBenchmark {
  const categoryThresholds = PERFORMANCE_CATEGORIES[category];
  
  return {
    name: `${componentName} Component Render`,
    component: componentName,
    maxRenderTime: categoryThresholds.maxRenderTime,
    maxMemoryIncrease: categoryThresholds.maxMemoryIncrease,
    minCacheHitRate: 'minCacheHitRate' in categoryThresholds 
      ? categoryThresholds.minCacheHitRate 
      : undefined,
    ...overrides
  };
}