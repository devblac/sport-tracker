/**
 * World-Class Analytics React Hook
 * Ultra-lightweight integration for React components
 * Built for maximum insights with minimal performance impact
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsManager } from '@/services/AnalyticsManager';
import type { AnalyticsEventType } from '@/services/AnalyticsManager';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils';

export interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
  userId?: string;
}

export interface UseAnalyticsResult {
  track: (event: AnalyticsEventType, properties?: Record<string, any>) => void;
  trackFeature: (featureName: string, action: string, properties?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, properties?: Record<string, any>) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  isInitialized: boolean;
  hasConsent: boolean;
}

/**
 * High-performance analytics hook with automatic optimizations
 */
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsResult {
  const location = useLocation();
  const { user } = useAuthStore();
  const performanceRef = useRef<{ [key: string]: number }>({});
  
  const {
    trackPageViews = true,
    trackPerformance = true,
    trackErrors = true,
    userId = user?.id
  } = options;

  // Track page views automatically
  useEffect(() => {
    if (trackPageViews) {
      const pageName = getPageName(location.pathname);
      analyticsManager.page(pageName, {
        path: location.pathname,
        search: location.search,
        hash: location.hash
      });
    }
  }, [location, trackPageViews]);

  // Track performance metrics automatically
  useEffect(() => {
    if (!trackPerformance) return;

    const trackPagePerformance = () => {
      // Track page load performance
      if (performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          
          analyticsManager.trackPerformance('page_load_time', nav.loadEventEnd - nav.navigationStart, {
            page: getPageName(location.pathname),
            dns_time: nav.domainLookupEnd - nav.domainLookupStart,
            connect_time: nav.connectEnd - nav.connectStart,
            response_time: nav.responseEnd - nav.responseStart,
            dom_ready_time: nav.domContentLoadedEventEnd - nav.navigationStart
          });
        }
      }

      // Track Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          // Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            analyticsManager.trackPerformance('largest_contentful_paint', lastEntry.startTime, {
              page: getPageName(location.pathname)
            });
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry: any) => {
              const fid = entry.processingStart - entry.startTime;
              analyticsManager.trackPerformance('first_input_delay', fid, {
                page: getPageName(location.pathname)
              });
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            list.getEntries().forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            if (clsValue > 0) {
              analyticsManager.trackPerformance('cumulative_layout_shift', clsValue, {
                page: getPageName(location.pathname)
              });
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

        } catch (error) {
          logger.warn('Performance observers not supported', error);
        }
      }
    };

    // Track performance after page load
    if (document.readyState === 'complete') {
      trackPagePerformance();
    } else {
      window.addEventListener('load', trackPagePerformance);
    }
  }, [location.pathname, trackPerformance]);

  // Track errors automatically
  useEffect(() => {
    if (!trackErrors) return;

    const handleError = (event: ErrorEvent) => {
      analyticsManager.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        page: getPageName(location.pathname)
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      analyticsManager.trackError(error, {
        type: 'unhandled_promise_rejection',
        page: getPageName(location.pathname)
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [location.pathname, trackErrors]);

  // Identify user when available
  useEffect(() => {
    if (userId && user) {
      analyticsManager.identify(userId, {
        email: user.email,
        display_name: user.profile?.display_name,
        created_at: user.created_at,
        level: user.gamification?.level,
        total_xp: user.gamification?.total_xp,
        current_streak: user.gamification?.current_streak,
        subscription_tier: user.subscription?.tier
      });
    }
  }, [userId, user]);

  // Memoized tracking functions
  const track = useCallback((
    event: AnalyticsEventType, 
    properties: Record<string, any> = {}
  ) => {
    analyticsManager.track(event, {
      ...properties,
      page: getPageName(location.pathname),
      user_id: userId
    });
  }, [location.pathname, userId]);

  const trackFeature = useCallback((
    featureName: string, 
    action: string, 
    properties: Record<string, any> = {}
  ) => {
    analyticsManager.trackFeature(featureName, action, {
      ...properties,
      page: getPageName(location.pathname),
      user_id: userId
    });
  }, [location.pathname, userId]);

  const trackPerformanceMetric = useCallback((
    metric: string, 
    value: number, 
    properties: Record<string, any> = {}
  ) => {
    analyticsManager.trackPerformance(metric, value, {
      ...properties,
      page: getPageName(location.pathname),
      user_id: userId
    });
  }, [location.pathname, userId]);

  const trackErrorCallback = useCallback((
    error: Error, 
    context: Record<string, any> = {}
  ) => {
    analyticsManager.trackError(error, {
      ...context,
      page: getPageName(location.pathname),
      user_id: userId
    });
  }, [location.pathname, userId]);

  const identify = useCallback((
    userIdToIdentify: string, 
    traits: Record<string, any> = {}
  ) => {
    analyticsManager.identify(userIdToIdentify, traits);
  }, []);

  // Get analytics status
  const stats = analyticsManager.getStats();

  return {
    track,
    trackFeature,
    trackPerformance: trackPerformanceMetric,
    trackError: trackErrorCallback,
    identify,
    isInitialized: stats.isInitialized,
    hasConsent: stats.hasUserConsent
  };
}

/**
 * Hook for tracking component performance
 */
export function useComponentPerformance(componentName: string) {
  const { trackPerformance } = useAnalytics();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - startTimeRef.current;
      if (renderTime > 16) { // Only track slow renders (>16ms = <60fps)
        trackPerformance('component_render_time', renderTime, {
          component_name: componentName,
          is_slow_render: renderTime > 100
        });
      }
    };
  }, [componentName, trackPerformance]);

  const trackInteraction = useCallback((action: string, properties: Record<string, any> = {}) => {
    trackPerformance('component_interaction', performance.now() - startTimeRef.current, {
      component_name: componentName,
      interaction_type: action,
      ...properties
    });
  }, [componentName, trackPerformance]);

  return { trackInteraction };
}

/**
 * Hook for tracking workout analytics
 */
export function useWorkoutAnalytics() {
  const { track, trackFeature } = useAnalytics();

  const trackWorkoutStart = useCallback((workoutData: {
    workoutId: string;
    templateId?: string;
    exerciseCount: number;
    estimatedDuration: number;
  }) => {
    track('workout_started', {
      workout_id: workoutData.workoutId,
      template_id: workoutData.templateId,
      exercise_count: workoutData.exerciseCount,
      estimated_duration: workoutData.estimatedDuration,
      start_time: Date.now()
    });
  }, [track]);

  const trackWorkoutComplete = useCallback((workoutData: {
    workoutId: string;
    duration: number;
    exercisesCompleted: number;
    totalExercises: number;
    caloriesBurned: number;
    completionRate: number;
  }) => {
    track('workout_completed', {
      workout_id: workoutData.workoutId,
      duration: workoutData.duration,
      exercises_completed: workoutData.exercisesCompleted,
      total_exercises: workoutData.totalExercises,
      calories_burned: workoutData.caloriesBurned,
      completion_rate: workoutData.completionRate,
      end_time: Date.now()
    });
  }, [track]);

  const trackExerciseComplete = useCallback((exerciseData: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    duration: number;
  }) => {
    track('exercise_completed', {
      exercise_id: exerciseData.exerciseId,
      exercise_name: exerciseData.exerciseName,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      weight: exerciseData.weight,
      duration: exerciseData.duration
    });
  }, [track]);

  const trackFeatureUsage = useCallback((feature: string, action: string) => {
    trackFeature('workout', `${feature}_${action}`, {
      feature_category: 'workout',
      feature_name: feature,
      action_type: action
    });
  }, [trackFeature]);

  return {
    trackWorkoutStart,
    trackWorkoutComplete,
    trackExerciseComplete,
    trackFeatureUsage
  };
}

// Helper function to get readable page names
function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/workout': 'Workout',

    '/progress': 'Progress',
    '/social': 'Social',
    '/profile': 'Profile',
    '/exercises': 'Exercise Browser',
    '/auth': 'Authentication'
  };

  // Handle dynamic routes
  if (pathname.startsWith('/exercises/')) {
    return 'Exercise Detail';
  }
  if (pathname.startsWith('/workout/')) {
    return 'Workout Player';
  }
  if (pathname.startsWith('/workout-summary/')) {
    return 'Workout Summary';
  }

  return routes[pathname] || 'Unknown Page';
}