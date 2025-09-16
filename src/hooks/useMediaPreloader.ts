import { useEffect, useCallback, useRef } from 'react';
import { mediaPreloader } from '@/services/MediaPreloader';
import type { Exercise } from '@/schemas/exercise';
import { logger } from '@/utils/logger';

interface UseMediaPreloaderOptions {
  strategy?: 'aggressive' | 'conservative' | 'smart';
  enabled?: boolean;
  preloadOnMount?: boolean;
  preloadOnVisible?: boolean;
}

interface MediaPreloaderStats {
  queueSize: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  successRate: number;
}

export const useMediaPreloader = (
  exercises: Exercise[],
  options: UseMediaPreloaderOptions = {}
) => {
  const {
    strategy = 'smart',
    enabled = true,
    preloadOnMount = true,
    preloadOnVisible = false
  } = options;

  const preloadedRef = useRef(new Set<string>());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Preload exercises media
  const preloadExercises = useCallback(async (
    exercisesToPreload: Exercise[],
    preloadStrategy: 'aggressive' | 'conservative' | 'smart' = strategy
  ) => {
    if (!enabled || exercisesToPreload.length === 0) return;

    try {
      await mediaPreloader.preloadExerciseMedia(exercisesToPreload, preloadStrategy);
      
      // Mark as preloaded
      exercisesToPreload.forEach(exercise => {
        preloadedRef.current.add(exercise.id);
      });

      logger.debug('Exercise media preloaded', { 
        count: exercisesToPreload.length, 
        strategy: preloadStrategy 
      });
    } catch (error) {
      logger.error('Failed to preload exercise media', error);
    }
  }, [enabled, strategy]);

  // Preload visible exercises
  const preloadVisible = useCallback(async (visibleExercises: Exercise[]) => {
    if (!enabled) return;

    try {
      await mediaPreloader.preloadVisibleExercises(visibleExercises);
      logger.debug('Visible exercise media preloaded', { count: visibleExercises.length });
    } catch (error) {
      logger.error('Failed to preload visible exercise media', error);
    }
  }, [enabled]);

  // Preload workout exercises (high priority)
  const preloadWorkout = useCallback(async (workoutExercises: Exercise[]) => {
    if (!enabled) return;

    try {
      await mediaPreloader.preloadWorkoutMedia(workoutExercises);
      logger.debug('Workout exercise media preloaded', { count: workoutExercises.length });
    } catch (error) {
      logger.error('Failed to preload workout exercise media', error);
    }
  }, [enabled]);

  // Preload based on user behavior
  const preloadByBehavior = useCallback(async (
    recentExercises: Exercise[],
    favoriteExercises: Exercise[],
    upcomingWorkout?: Exercise[]
  ) => {
    if (!enabled) return;

    try {
      await mediaPreloader.preloadByUserBehavior(
        recentExercises,
        favoriteExercises,
        upcomingWorkout
      );
      logger.debug('Behavior-based media preloaded');
    } catch (error) {
      logger.error('Failed to preload behavior-based media', error);
    }
  }, [enabled]);

  // Setup intersection observer for visible preloading
  useEffect(() => {
    if (!preloadOnVisible || !enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleExercises: Exercise[] = [];
        
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const exerciseId = entry.target.getAttribute('data-exercise-id');
            const exercise = exercises.find(ex => ex.id === exerciseId);
            if (exercise && !preloadedRef.current.has(exercise.id)) {
              visibleExercises.push(exercise);
            }
          }
        });

        if (visibleExercises.length > 0) {
          preloadVisible(visibleExercises);
        }
      },
      {
        rootMargin: '100px', // Start preloading 100px before element is visible
        threshold: 0.1
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [exercises, preloadOnVisible, enabled, preloadVisible]);

  // Observe exercise elements
  const observeElement = useCallback((element: HTMLElement, exerciseId: string) => {
    if (!observerRef.current || !preloadOnVisible) return;

    element.setAttribute('data-exercise-id', exerciseId);
    observerRef.current.observe(element);
  }, [preloadOnVisible]);

  // Unobserve exercise elements
  const unobserveElement = useCallback((element: HTMLElement) => {
    if (!observerRef.current) return;
    observerRef.current.unobserve(element);
  }, []);

  // Preload on mount
  useEffect(() => {
    if (preloadOnMount && enabled && exercises.length > 0) {
      // Delay to avoid blocking initial render
      const timer = setTimeout(() => {
        preloadExercises(exercises);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [exercises, preloadOnMount, enabled, preloadExercises]);

  // Get preloader statistics
  const getStats = useCallback((): MediaPreloaderStats => {
    return mediaPreloader.getStats();
  }, []);

  // Clear preloader cache
  const clearCache = useCallback(() => {
    mediaPreloader.clear();
    preloadedRef.current.clear();
    logger.info('Media preloader cache cleared');
  }, []);

  // Check if exercise is preloaded
  const isPreloaded = useCallback((exerciseId: string): boolean => {
    return preloadedRef.current.has(exerciseId);
  }, []);

  return {
    preloadExercises,
    preloadVisible,
    preloadWorkout,
    preloadByBehavior,
    observeElement,
    unobserveElement,
    getStats,
    clearCache,
    isPreloaded,
    enabled
  };
};

// Hook for workout-specific media preloading
export const useWorkoutMediaPreloader = (workoutExercises: Exercise[]) => {
  const { preloadWorkout, getStats } = useMediaPreloader(workoutExercises, {
    strategy: 'aggressive',
    enabled: true,
    preloadOnMount: false
  });

  useEffect(() => {
    if (workoutExercises.length > 0) {
      // Preload immediately for workout
      preloadWorkout(workoutExercises);
    }
  }, [workoutExercises, preloadWorkout]);

  return { getStats };
};

// Hook for exercise list preloading with intersection observer
export const useExerciseListPreloader = (
  exercises: Exercise[],
  options: UseMediaPreloaderOptions = {}
) => {
  return useMediaPreloader(exercises, {
    strategy: 'smart',
    preloadOnMount: true,
    preloadOnVisible: true,
    ...options
  });
};