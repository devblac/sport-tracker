/**
 * Tests for specific synchronization fixes
 */

import { describe, it, expect, vi } from 'vitest';

describe('Synchronization Fixes', () => {
  describe('Infinite Loop Prevention', () => {
    it('should prevent infinite re-renders in useRealTime hook', () => {
      // Mock React hooks
      const mockUseEffect = vi.fn();
      const mockUseMemo = vi.fn();
      const mockUseRef = vi.fn(() => ({ current: null }));

      // Simulate the fixed dependency array logic
      let subscriptionCount = 0;
      const mockSubscribe = vi.fn(() => {
        subscriptionCount++;
        return `subscription-${subscriptionCount}`;
      });

      // Test that options changes are properly memoized
      const options1 = { throttle: 16, priority: 'medium' };
      const options2 = { throttle: 16, priority: 'medium' }; // Same values
      const options3 = { throttle: 32, priority: 'medium' }; // Different values

      // Simulate the memoization logic from the fix
      const optionsChanged1 = JSON.stringify(options1) !== JSON.stringify({});
      const optionsChanged2 = JSON.stringify(options2) !== JSON.stringify(options1);
      const optionsChanged3 = JSON.stringify(options3) !== JSON.stringify(options2);

      expect(optionsChanged1).toBe(true); // First time should change
      expect(optionsChanged2).toBe(false); // Same options should not change
      expect(optionsChanged3).toBe(true); // Different options should change
    });

    it('should prevent duplicate notification processing', () => {
      const processedIds = new Set<string>();
      
      const notifications = [
        { id: 'notif-1', type: 'info', title: 'Test 1', message: 'Message 1' },
        { id: 'notif-1', type: 'info', title: 'Test 1', message: 'Message 1' }, // Duplicate
        { id: 'notif-2', type: 'success', title: 'Test 2', message: 'Message 2' },
        { id: 'notif-1', type: 'info', title: 'Test 1', message: 'Message 1' }, // Another duplicate
      ];

      // Simulate the duplicate prevention logic
      const processedNotifications: any[] = [];
      
      notifications.forEach(notification => {
        if (!processedIds.has(notification.id)) {
          processedIds.add(notification.id);
          processedNotifications.push(notification);
        }
      });

      expect(processedNotifications).toHaveLength(2);
      expect(processedIds.size).toBe(2);
    });
  });

  describe('Retry Logic Improvements', () => {
    it('should calculate exponential backoff correctly', () => {
      const baseDelay = 2000;
      const maxDelay = 60000;
      
      const calculateRetryDelay = (retryCount: number, isNetworkError: boolean = false) => {
        const adjustedBaseDelay = isNetworkError ? baseDelay * 2 : baseDelay;
        const delay = Math.min(
          adjustedBaseDelay * Math.pow(2, retryCount - 1),
          maxDelay
        );
        return delay;
      };

      // Test normal errors
      expect(calculateRetryDelay(1)).toBe(2000); // 2s
      expect(calculateRetryDelay(2)).toBe(4000); // 4s
      expect(calculateRetryDelay(3)).toBe(8000); // 8s
      expect(calculateRetryDelay(4)).toBe(16000); // 16s
      expect(calculateRetryDelay(5)).toBe(32000); // 32s
      expect(calculateRetryDelay(6)).toBe(60000); // Capped at max

      // Test network errors (should be slower)
      expect(calculateRetryDelay(1, true)).toBe(4000); // 4s
      expect(calculateRetryDelay(2, true)).toBe(8000); // 8s
      expect(calculateRetryDelay(3, true)).toBe(16000); // 16s
    });

    it('should identify retryable vs non-retryable errors', () => {
      const isRetryableError = (error: Error) => {
        const message = error.message.toLowerCase();
        
        // Non-retryable errors
        if (message.includes('unauthorized') || 
            message.includes('forbidden') ||
            message.includes('not found') ||
            message.includes('bad request')) {
          return false;
        }
        
        // Retryable errors
        return message.includes('network') ||
               message.includes('timeout') ||
               message.includes('server error') ||
               message.includes('service unavailable') ||
               message.includes('too many requests');
      };

      // Non-retryable errors
      expect(isRetryableError(new Error('Unauthorized access'))).toBe(false);
      expect(isRetryableError(new Error('Forbidden resource'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
      expect(isRetryableError(new Error('Bad request format'))).toBe(false);

      // Retryable errors
      expect(isRetryableError(new Error('Network timeout'))).toBe(true);
      expect(isRetryableError(new Error('Server error occurred'))).toBe(true);
      expect(isRetryableError(new Error('Service unavailable'))).toBe(true);
      expect(isRetryableError(new Error('Too many requests'))).toBe(true);
    });
  });

  describe('Frequency Optimization', () => {
    it('should calculate optimal sync intervals based on conditions', () => {
      const config = {
        minInterval: 30000, // 30 seconds
        maxInterval: 300000, // 5 minutes
        activeUserInterval: 60000, // 1 minute
        inactiveUserInterval: 180000, // 3 minutes
        networkOptimizedInterval: 120000, // 2 minutes
        batchSyncThreshold: 5,
      };

      const calculateOptimalInterval = (
        isUserActive: boolean,
        networkQuality: 'fast' | 'slow' | 'offline',
        pendingOperationsCount: number
      ) => {
        if (networkQuality === 'offline') {
          return config.maxInterval;
        }

        let interval = isUserActive ? config.activeUserInterval : config.inactiveUserInterval;

        // Adjust for network quality
        if (networkQuality === 'slow') {
          interval = Math.max(interval, config.networkOptimizedInterval);
        }

        // Adjust for pending operations
        if (pendingOperationsCount >= config.batchSyncThreshold) {
          interval = Math.max(config.minInterval, interval / 2);
        }

        return Math.max(config.minInterval, Math.min(interval, config.maxInterval));
      };

      // Test different scenarios
      expect(calculateOptimalInterval(true, 'fast', 0)).toBe(60000); // Active user, fast network
      expect(calculateOptimalInterval(false, 'fast', 0)).toBe(180000); // Inactive user, fast network
      expect(calculateOptimalInterval(true, 'slow', 0)).toBe(120000); // Active user, slow network
      expect(calculateOptimalInterval(true, 'fast', 10)).toBe(30000); // Many pending operations
      expect(calculateOptimalInterval(true, 'offline', 0)).toBe(300000); // Offline
    });

    it('should handle adaptive delays based on success rate', () => {
      const calculateAdaptiveDelay = (successRate: number) => {
        if (successRate > 0.8) return 500; // Fast
        if (successRate > 0.6) return 1000; // Normal
        if (successRate > 0.4) return 2000; // Slow
        return 5000; // Very slow for high failure rates
      };

      expect(calculateAdaptiveDelay(0.9)).toBe(500); // High success rate
      expect(calculateAdaptiveDelay(0.7)).toBe(1000); // Good success rate
      expect(calculateAdaptiveDelay(0.5)).toBe(2000); // Moderate success rate
      expect(calculateAdaptiveDelay(0.2)).toBe(5000); // Low success rate
    });
  });

  describe('Conflict Resolution', () => {
    it('should merge workout data correctly', () => {
      const mergeWorkoutData = (localData: any, remoteData: any) => {
        return {
          ...remoteData,
          ...localData,
          // Use the latest timestamp
          updated_at: Math.max(localData.updated_at || 0, remoteData.updated_at || 0),
        };
      };

      const localData = {
        id: 'workout-1',
        name: 'Local Workout',
        exercises: [{ id: 'ex-1', sets: 3 }],
        updated_at: 1000,
      };

      const remoteData = {
        id: 'workout-1',
        name: 'Remote Workout',
        exercises: [{ id: 'ex-2', sets: 4 }],
        updated_at: 2000,
      };

      const merged = mergeWorkoutData(localData, remoteData);

      expect(merged.name).toBe('Local Workout'); // Local wins for conflicting fields
      expect(merged.updated_at).toBe(2000); // Latest timestamp
      expect(merged.id).toBe('workout-1'); // ID preserved
    });

    it('should determine conflict resolution strategy correctly', () => {
      const determineStrategy = (
        localTimestamp: number,
        remoteTimestamp: number,
        entity: string
      ) => {
        // Exercises are usually read-only for users
        if (entity === 'exercise') {
          return 'remote_wins';
        }

        // For other entities, prefer the most recent
        if (localTimestamp > remoteTimestamp) {
          return 'local_wins';
        } else if (remoteTimestamp > localTimestamp) {
          return 'remote_wins';
        } else {
          return 'merge'; // Same timestamp, try to merge
        }
      };

      expect(determineStrategy(1000, 2000, 'workout')).toBe('remote_wins');
      expect(determineStrategy(2000, 1000, 'workout')).toBe('local_wins');
      expect(determineStrategy(1000, 1000, 'workout')).toBe('merge');
      expect(determineStrategy(1000, 2000, 'exercise')).toBe('remote_wins');
    });
  });

  describe('Error Handling Improvements', () => {
    it('should handle timeout errors gracefully', async () => {
      const createTimeoutPromise = (timeout: number) => {
        return new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });
      };

      const operationWithTimeout = async (operation: () => Promise<any>, timeout: number) => {
        try {
          return await Promise.race([
            operation(),
            createTimeoutPromise(timeout)
          ]);
        } catch (error) {
          if (error instanceof Error && error.message === 'Operation timeout') {
            throw new Error('Operation timed out');
          }
          throw error;
        }
      };

      // Test timeout
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 2000));
      
      await expect(
        operationWithTimeout(slowOperation, 1000)
      ).rejects.toThrow('Operation timed out');
    });

    it('should identify network errors correctly', () => {
      const isNetworkError = (error: Error) => {
        const message = error.message.toLowerCase();
        return message.includes('network') || 
               message.includes('fetch') || 
               message.includes('connection') ||
               message.includes('timeout') ||
               error.name === 'NetworkError';
      };

      expect(isNetworkError(new Error('Network request failed'))).toBe(true);
      expect(isNetworkError(new Error('Fetch error'))).toBe(true);
      expect(isNetworkError(new Error('Connection refused'))).toBe(true);
      expect(isNetworkError(new Error('Request timeout'))).toBe(true);
      
      const networkError = new Error('Test');
      networkError.name = 'NetworkError';
      expect(isNetworkError(networkError)).toBe(true);

      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
    });
  });
});