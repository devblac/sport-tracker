/**
 * React Hooks for A/B Testing and Feature Flags
 * Seamless integration with React components
 * Built for optimal performance and developer experience
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as React from 'react';
import { experimentManager } from '@/services/ExperimentManager';
import type { ExperimentAnalysis } from '@/services/ExperimentManager';
import { featureFlagManager } from '@/services/FeatureFlagManager';
import type { FeatureFlagValue } from '@/services/FeatureFlagManager';
import { useAuthStore } from '@/stores';

export interface UseExperimentResult {
  variant: string | null;
  isLoading: boolean;
  isInExperiment: boolean;
  trackResult: (metricKey: string, value: number, context?: Record<string, any>) => void;
}

export interface UseFeatureFlagResult<T extends FeatureFlagValue> {
  value: T;
  isEnabled: boolean;
  isLoading: boolean;
}

/**
 * Hook for A/B testing experiments
 */
export const useExperiment = (experimentId: string): UseExperimentResult => {
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const hasTrackedAssignment = useRef(false);

  const userId = user?.id || 'anonymous';

  useEffect(() => {
    const getVariant = async () => {
      try {
        setIsLoading(true);
        const assignedVariant = experimentManager.getVariant(experimentId, userId);
        setVariant(assignedVariant);
        
        // Track assignment analytics (only once per session)
        if (assignedVariant && !hasTrackedAssignment.current) {
          hasTrackedAssignment.current = true;
        }
      } catch (error) {
        console.error('Error getting experiment variant:', error);
        setVariant(null);
      } finally {
        setIsLoading(false);
      }
    };

    getVariant();
  }, [experimentId, userId]);

  const trackResult = useCallback((
    metricKey: string, 
    value: number, 
    context: Record<string, any> = {}
  ) => {
    if (variant) {
      experimentManager.trackResult(experimentId, userId, metricKey, value, {
        ...context,
        variant,
        timestamp: Date.now()
      });
    }
  }, [experimentId, userId, variant]);

  return {
    variant,
    isLoading,
    isInExperiment: variant !== null,
    trackResult
  };
};

/**
 * Hook for feature flags with type safety
 */
export const useFeatureFlag = <T extends FeatureFlagValue>(
  flagKey: string,
  defaultValue: T
): UseFeatureFlagResult<T> => {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const updateValue = () => {
      try {
        setIsLoading(true);
        
        // Set user context if available
        if (user) {
          featureFlagManager.setUser(user.id, {
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            // Add other relevant user traits
          });
        }

        const flagValue = featureFlagManager.getValue(flagKey, defaultValue);
        setValue(flagValue);
      } catch (error) {
        console.error('Error evaluating feature flag:', error);
        setValue(defaultValue);
      } finally {
        setIsLoading(false);
      }
    };

    updateValue();

    // Listen for flag updates (if implemented)
    // In a real implementation, you might have a flag update event system
    
  }, [flagKey, defaultValue, user]);

  return {
    value,
    isEnabled: Boolean(value),
    isLoading
  };
};

/**
 * Hook for boolean feature flags (most common case)
 */
export const useBooleanFlag = (
  flagKey: string,
  defaultValue: boolean = false
): UseFeatureFlagResult<boolean> => {
  return useFeatureFlag(flagKey, defaultValue);
};

/**
 * Hook for string feature flags
 */
export const useStringFlag = (
  flagKey: string,
  defaultValue: string = ''
): UseFeatureFlagResult<string> => {
  return useFeatureFlag(flagKey, defaultValue);
};

/**
 * Hook for number feature flags
 */
export const useNumberFlag = (
  flagKey: string,
  defaultValue: number = 0
): UseFeatureFlagResult<number> => {
  return useFeatureFlag(flagKey, defaultValue);
};

/**
 * Hook for experiment analysis (for admin/analytics views)
 */
export const useExperimentAnalysis = (experimentId: string) => {
  const [analysis, setAnalysis] = useState<ExperimentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = experimentManager.analyzeExperiment(experimentId);
      setAnalysis(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Analysis failed'));
    } finally {
      setIsLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    refreshAnalysis();
  }, [refreshAnalysis]);

  return {
    analysis,
    isLoading,
    error,
    refresh: refreshAnalysis
  };
};

/**
 * Hook for experiment statistics (for monitoring)
 */
export const useExperimentStats = (experimentId: string) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getStats = () => {
      try {
        setIsLoading(true);
        const experimentStats = experimentManager.getExperimentStats(experimentId);
        setStats(experimentStats);
      } catch (error) {
        console.error('Error getting experiment stats:', error);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    getStats();

    // Refresh stats periodically
    const interval = setInterval(getStats, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [experimentId]);

  return {
    stats,
    isLoading
  };
};

/**
 * Hook for multiple feature flags (batch evaluation)
 */
export const useFeatureFlags = <T extends Record<string, FeatureFlagValue>>(
  flags: T
): { [K in keyof T]: UseFeatureFlagResult<T[K]> } => {
  const [values, setValues] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const evaluateFlags = () => {
      try {
        setIsLoading(true);
        
        if (user) {
          featureFlagManager.setUser(user.id, {
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          });
        }

        const results: any = {};
        
        Object.entries(flags).forEach(([key, defaultValue]) => {
          const value = featureFlagManager.getValue(key, defaultValue);
          results[key] = {
            value,
            isEnabled: Boolean(value),
            isLoading: false
          };
        });

        setValues(results);
      } catch (error) {
        console.error('Error evaluating feature flags:', error);
        
        // Set default values on error
        const defaults: any = {};
        Object.entries(flags).forEach(([key, defaultValue]) => {
          defaults[key] = {
            value: defaultValue,
            isEnabled: Boolean(defaultValue),
            isLoading: false
          };
        });
        setValues(defaults);
      } finally {
        setIsLoading(false);
      }
    };

    evaluateFlags();
  }, [flags, user]);

  return values;
};

/**
 * Hook for conditional rendering based on experiments
 */
export const useExperimentComponent = <T extends Record<string, React.ComponentType<any>>>(
  experimentId: string,
  components: T
): {
  Component: React.ComponentType<any> | null;
  variant: string | null;
  isLoading: boolean;
} => {
  const { variant, isLoading } = useExperiment(experimentId);

  const Component = variant && components[variant] ? components[variant] : null;

  return {
    Component,
    variant,
    isLoading
  };
};

/**
 * Higher-order component for A/B testing
 * Note: This returns a component factory function, not JSX directly
 */
export const withExperiment = <P extends object>(
  experimentId: string,
  variants: Record<string, React.ComponentType<P>>
) => {
  return (props: P) => {
    const { Component, isLoading } = useExperimentComponent(experimentId, variants);

    if (isLoading) {
      // Return a loading component factory
      return React.createElement('div', {
        className: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-20'
      });
    }

    if (!Component) {
      // Fallback to control variant or first available
      const FallbackComponent = variants.control || Object.values(variants)[0];
      return FallbackComponent ? React.createElement(FallbackComponent, props) : null;
    }

    return React.createElement(Component, props);
  };
};

/**
 * Hook for tracking experiment events with automatic context
 */
export const useExperimentTracking = (experimentId: string) => {
  const { trackResult, variant, isInExperiment } = useExperiment(experimentId);
  const { user } = useAuthStore();

  const track = useCallback((
    metricKey: string,
    value: number = 1,
    additionalContext: Record<string, any> = {}
  ) => {
    if (isInExperiment) {
      trackResult(metricKey, value, {
        ...additionalContext,
        userId: user?.id,
        timestamp: Date.now(),
        page: window.location.pathname,
        userAgent: navigator.userAgent
      });
    }
  }, [trackResult, isInExperiment, user]);

  return {
    track,
    variant,
    isInExperiment
  };
};