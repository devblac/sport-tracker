/**
 * Monitoring and analytics initialization
 * Centralizes all monitoring systems
 */

import { errorTracker } from './errorTracking.tsx';
import { performanceMonitor } from './performanceMonitoring';
import { performanceAnalytics } from '../analytics/performanceAnalytics';
import { featureFlags } from '../featureFlags/featureFlags.tsx';

export interface MonitoringConfig {
  errorTracking?: {
    dsn?: string;
    environment?: string;
    release?: string;
  };
  analytics?: {
    enabled?: boolean;
    reportInterval?: number;
  };
  featureFlags?: {
    userId?: string;
    userRole?: string;
    customAttributes?: Record<string, any>;
  };
}

class MonitoringManager {
  private isInitialized = false;

  async initialize(config: MonitoringConfig = {}) {
    if (this.isInitialized) return;

    try {
      // Initialize error tracking
      if (config.errorTracking) {
        errorTracker.initialize({
          environment: import.meta.env.VITE_ENVIRONMENT || 'development',
          release: import.meta.env.VITE_APP_VERSION || 'unknown',
          ...config.errorTracking
        });
      }

      // Initialize performance monitoring
      performanceMonitor.initialize();

      // Initialize performance analytics
      if (config.analytics?.enabled !== false) {
        performanceAnalytics.initialize();
      }

      // Initialize feature flags
      await featureFlags.initialize({
        environment: import.meta.env.VITE_ENVIRONMENT || 'development',
        ...config.featureFlags
      });

      this.isInitialized = true;
      
      console.log('Monitoring systems initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring systems:', error);
    }
  }

  updateUserContext(userId: string, userRole: string, customAttributes?: Record<string, any>) {
    // Update feature flags context
    featureFlags.updateContext({
      userId,
      userRole,
      customAttributes
    });

    console.log('User context updated for monitoring systems', { userId, userRole });
  }

  destroy() {
    errorTracker.destroy();
    performanceMonitor.destroy();
    performanceAnalytics.destroy();
    featureFlags.destroy();
  }
}

// Singleton instance
export const monitoring = new MonitoringManager();

// Export all monitoring utilities
export { errorTracker } from './errorTracking.tsx';
export { performanceMonitor } from './performanceMonitoring';
export { performanceAnalytics } from '../analytics/performanceAnalytics';
export { featureFlags } from '../featureFlags/featureFlags.tsx';

// React hooks
export { usePerformanceMonitor } from './performanceMonitoring';
export { usePerformanceAnalytics } from '../analytics/performanceAnalytics';
export { useFeatureFlag, withFeatureFlag, FeatureFlag } from '../featureFlags/featureFlags.tsx';