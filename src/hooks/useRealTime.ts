/**
 * World-Class Real-Time React Hook
 * Ultra-lightweight integration for React components
 * Built for maximum performance and developer experience
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { realTimeManager } from '@/services/RealTimeManager';
import type { RealTimeEventType, RealTimeEvent, SubscriptionOptions } from '@/services/RealTimeManager';
import { logger } from '@/utils';

export interface UseRealTimeOptions extends SubscriptionOptions {
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export interface UseRealTimeResult<T> {
  data: T | null;
  isConnected: boolean;
  lastUpdate: number;
  emit: (data: T, options?: { priority?: RealTimeEvent['priority']; broadcast?: boolean }) => void;
  stats: {
    eventsReceived: number;
    averageLatency: number;
  };
}

/**
 * High-performance real-time hook with intelligent optimization
 */
export function useRealTime<T = any>(
  eventType: RealTimeEventType,
  options: UseRealTimeOptions = {}
): UseRealTimeResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const subscriptionRef = useRef<string | null>(null);
  const statsRef = useRef({
    eventsReceived: 0,
    totalLatency: 0,
    startTime: Date.now()
  });

  const {
    enabled = true,
    onError,
    throttle = 16, // 60fps default
    priority = 'medium',
    onlyWhenVisible = true,
    batchUpdates = false,
    ...restOptions
  } = options;

  // Memoized callback to prevent unnecessary re-subscriptions
  const handleEvent = useCallback((event: RealTimeEvent<T>) => {
    try {
      const latency = Date.now() - event.timestamp;
      
      // Update stats
      statsRef.current.eventsReceived++;
      statsRef.current.totalLatency += latency;
      
      // Update state
      setData(event.data);
      setLastUpdate(event.timestamp);
      
      logger.debug('Real-time event received', {
        eventType,
        latency,
        timestamp: event.timestamp
      });
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Real-time event processing failed');
      logger.error('Real-time event processing error', err);
      
      if (onError) {
        onError(err);
      }
    }
  }, [eventType, onError]);

  // Memoized emit function
  const emit = useCallback((
    eventData: T, 
    emitOptions: { priority?: RealTimeEvent['priority']; broadcast?: boolean } = {}
  ) => {
    realTimeManager.emit(eventType, eventData, {
      priority: emitOptions.priority || priority,
      broadcast: emitOptions.broadcast ?? true
    });
  }, [eventType, priority]);

  // Memoize subscription options to prevent infinite re-renders
  const subscriptionOptionsRef = useRef<SubscriptionOptions>();
  
  // Only update subscription options when primitive values change
  const stableOptions = React.useMemo(() => ({
    throttle,
    priority,
    onlyWhenVisible,
    batchUpdates
  }), [throttle, priority, onlyWhenVisible, batchUpdates]);

  // Update subscription options ref only when options actually change
  const optionsChanged = React.useMemo(() => {
    const newOptions = { ...stableOptions, ...restOptions };
    const currentOptions = subscriptionOptionsRef.current;
    
    if (!currentOptions) return true;
    
    // Deep comparison of options to prevent unnecessary updates
    return JSON.stringify(newOptions) !== JSON.stringify(currentOptions);
  }, [stableOptions, restOptions]);

  useEffect(() => {
    if (optionsChanged) {
      subscriptionOptionsRef.current = {
        ...stableOptions,
        ...restOptions
      };
    }
  }, [optionsChanged, stableOptions, restOptions]);

  // Setup subscription with dependency array that prevents infinite loops
  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    // Subscribe to real-time events
    const subscriptionId = realTimeManager.subscribe<T>(
      eventType,
      handleEvent,
      subscriptionOptionsRef.current || stableOptions
    );

    subscriptionRef.current = subscriptionId;
    setIsConnected(true);

    logger.debug('Real-time subscription established', {
      eventType,
      subscriptionId,
      options: subscriptionOptionsRef.current || stableOptions
    });

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        realTimeManager.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        setIsConnected(false);
        
        logger.debug('Real-time subscription cleaned up', { eventType });
      }
    };
  }, [enabled, eventType, handleEvent, optionsChanged]);

  // Calculate stats
  const stats = {
    eventsReceived: statsRef.current.eventsReceived,
    averageLatency: statsRef.current.eventsReceived > 0 
      ? statsRef.current.totalLatency / statsRef.current.eventsReceived 
      : 0
  };

  return {
    data,
    isConnected,
    lastUpdate,
    emit,
    stats
  };
}

/**
 * Hook for multiple real-time event types
 */
export function useMultipleRealTime<T = any>(
  eventTypes: RealTimeEventType[],
  options: UseRealTimeOptions = {}
): Record<RealTimeEventType, UseRealTimeResult<T>> {
  const results: Record<string, UseRealTimeResult<T>> = {};

  for (const eventType of eventTypes) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[eventType] = useRealTime<T>(eventType, options);
  }

  return results;
}

/**
 * Hook for real-time leaderboard updates with world-class performance
 * Optimized for minimal backend load and smooth UX
 */
export function useRealTimeLeaderboard(options: UseRealTimeOptions = {}) {
  return useRealTime<{
    rankings: Array<{
      userId: string;
      username: string;
      score: number;
      position: number;
      change: number; // Position change since last update
    }>;
    lastUpdated: number;
  }>('leaderboard_update', {
    throttle: 60000, // World-class: Update max once per minute for leaderboards
    batchUpdates: true,
    onlyWhenVisible: true, // Only update when user can see it
    priority: 'low', // Leaderboards are not critical for UX
    ...options
  });
}

/**
 * Hook for real-time workout progress
 */
export function useRealTimeWorkoutProgress(workoutId: string, options: UseRealTimeOptions = {}) {
  return useRealTime<{
    workoutId: string;
    currentExercise: number;
    currentSet: number;
    totalSets: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
    caloriesBurned: number;
    heartRate?: number;
  }>('workout_progress', {
    throttle: 500, // Update twice per second
    ...options
  });
}

/**
 * Hook for real-time achievements
 */
export function useRealTimeAchievements(options: UseRealTimeOptions = {}) {
  return useRealTime<{
    achievementId: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlockedAt: number;
  }>('achievement_unlocked', {
    priority: 'high', // Achievements should be immediate
    throttle: 0, // No throttling for achievements
    ...options
  });
}

/**
 * Hook for real-time social activity
 */
export function useRealTimeSocial(options: UseRealTimeOptions = {}) {
  return useRealTime<{
    activityType: 'like' | 'comment' | 'follow' | 'workout_completed' | 'achievement';
    userId: string;
    username: string;
    avatar?: string;
    content?: string;
    timestamp: number;
  }>('social_activity', {
    throttle: 2000, // Update every 2 seconds max
    batchUpdates: true,
    ...options
  });
}

/**
 * Hook for real-time notifications
 */
export function useRealTimeNotifications(options: UseRealTimeOptions = {}) {
  return useRealTime<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    action?: {
      label: string;
      url: string;
    };
    autoClose?: number; // ms
    persistent?: boolean;
  }>('notification', {
    priority: 'high',
    throttle: 0, // No throttling for notifications
    ...options
  });
}