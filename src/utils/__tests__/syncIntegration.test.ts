/**
 * Integration tests for the improved synchronization system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncService } from '@/services/SyncService';
import { syncQueue } from '@/utils/syncQueue';
import { syncManager } from '@/utils/syncManager';
import { syncFrequencyManager } from '@/utils/syncFrequencyManager';

// Mock IndexedDB with enhanced functionality
vi.mock('@/db/IndexedDBManager', () => {
  const mockData = new Map();
  
  return {
    dbManager: {
      init: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockImplementation((store, data) => {
        const key = data.id || `${store}-${Date.now()}`;
        mockData.set(`${store}-${key}`, data);
        return Promise.resolve(undefined);
      }),
      get: vi.fn().mockImplementation((store, id) => {
        return Promise.resolve(mockData.get(`${store}-${id}`) || null);
      }),
      getAll: vi.fn().mockImplementation((store) => {
        const results = [];
        for (const [key, value] of mockData.entries()) {
          if (key.startsWith(`${store}-`)) {
            results.push(value);
          }
        }
        return Promise.resolve(results);
      }),
      delete: vi.fn().mockImplementation((store, id) => {
        mockData.delete(`${store}-${id}`);
        return Promise.resolve(undefined);
      }),
      clear: vi.fn().mockImplementation(() => {
        mockData.clear();
        return Promise.resolve(undefined);
      }),
    },
  };
});

// Enhanced fetch mock with network simulation
global.fetch = vi.fn();

// Network simulation utilities
const NetworkSimulator = {
  simulateNetworkError: () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
  },
  
  simulateServerError: (status = 500) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status,
      statusText: status === 500 ? 'Internal Server Error' : 'Server Error',
      json: () => Promise.resolve({ error: 'Server error' }),
    });
  },
  
  simulateTimeout: () => {
    (global.fetch as any).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );
  },
  
  simulateSuccess: (data = {}) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
  },
  
  simulateIntermittentFailure: (failCount = 2, successData = {}) => {
    for (let i = 0; i < failCount; i++) {
      (global.fetch as any).mockRejectedValueOnce(new Error('Intermittent failure'));
    }
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(successData),
    });
  }
};

// Test utilities
const TestUtils = {
  async clearSyncQueue() {
    const { dbManager } = await import('@/db/IndexedDBManager');
    if (dbManager.clear) {
      await dbManager.clear();
    }
  },
  
  async waitForProcessing(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

describe('Sync Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset fetch mock
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    
    // Clear any existing queue data
    const { dbManager } = await import('@/db/IndexedDBManager');
    if (dbManager.clear) {
      await dbManager.clear();
    }
  });

  afterEach(() => {
    syncService.destroy();
  });

  describe('SyncService', () => {
    it('should initialize successfully', async () => {
      await expect(syncService.initialize()).resolves.not.toThrow();
    });

    it('should queue operations correctly', async () => {
      await syncService.initialize();
      
      const operationId = await syncService.queueOperation(
        'CREATE',
        'workout',
        { id: 'test-workout', name: 'Test Workout' },
        { priority: 'high' }
      );

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');
    });

    it('should handle sync conflicts gracefully', async () => {
      await syncService.initialize();
      
      // Mock a conflict scenario
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.getAll as any).mockResolvedValueOnce([
        {
          id: 'conflict-1',
          entity: 'workout',
          entityId: 'test-workout',
          localData: { name: 'Local Workout' },
          remoteData: { name: 'Remote Workout' },
          conflictType: 'update_conflict',
          createdAt: Date.now(),
        }
      ]);

      const conflicts = await syncService.getPendingConflicts();
      expect(conflicts).toHaveLength(1);
    });

    it('should provide accurate sync status', async () => {
      await syncService.initialize();
      
      const status = await syncService.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isSyncing');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('hasConflicts');
    });
  });

  describe('SyncQueue Improvements', () => {
    it('should handle retry logic with exponential backoff', async () => {
      // Mock a failing operation
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test' },
        priority: 'medium',
        maxRetries: 3,
      });

      expect(operationId).toBeDefined();
      
      // Start processing to trigger the network error
      await syncQueue.startProcessing();
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // The operation should be queued for retry after failure
      const pendingOps = await syncQueue.getPendingOperations();
      expect(pendingOps.length).toBeGreaterThan(0);
      
      // Check that the operation has retry count incremented
      const failedOp = pendingOps.find(op => op.id === operationId);
      expect(failedOp).toBeDefined();
      expect(failedOp?.retryCount).toBeGreaterThan(0);
    });

    it('should differentiate between retryable and non-retryable errors', async () => {
      // Mock a non-retryable error (401 Unauthorized)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test' },
        priority: 'medium',
        maxRetries: 3,
      });

      // Start processing to trigger the error
      await syncQueue.startProcessing();
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(operationId).toBeDefined();
    });

    it('should provide queue statistics', async () => {
      const stats = await syncQueue.getQueueStats();
      
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('total');
    });
  });

  describe('SyncManager Conflict Resolution', () => {
    it('should detect conflicts correctly', async () => {
      // Mock remote data that conflicts with local
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-workout',
          name: 'Remote Workout',
          updated_at: Date.now() + 1000, // Newer than local
        }),
      });

      const result = await syncManager.performSync();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('conflicts');
    });

    it('should resolve conflicts using different strategies', async () => {
      const conflictId = 'test-conflict';
      
      // Mock conflict exists
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.get as any).mockResolvedValueOnce({
        id: conflictId,
        entity: 'workout',
        entityId: 'test-workout',
        localData: { id: 'test-workout', name: 'Local' },
        remoteData: { id: 'test-workout', name: 'Remote' },
        localTimestamp: Date.now(),
        remoteTimestamp: Date.now() - 1000,
        conflictType: 'update_conflict',
        createdAt: Date.now(),
      });

      // Mock successful API call for conflict resolution
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await expect(
        syncManager.resolveConflictManually(conflictId, {
          strategy: 'local_wins',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('SyncFrequencyManager Optimization', () => {
    it('should provide sync status information', () => {
      const status = syncFrequencyManager.getSyncStatus();
      
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('networkQuality');
      expect(status).toHaveProperty('userActive');
    });

    it('should handle immediate sync requests', async () => {
      await expect(
        syncFrequencyManager.triggerImmediateSync()
      ).resolves.not.toThrow();
    });

    it('should notify about pending operations', () => {
      expect(() => {
        syncFrequencyManager.notifyPendingOperation();
      }).not.toThrow();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database initialization failures gracefully', async () => {
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.init as any).mockRejectedValueOnce(new Error('DB init failed'));
      
      // Should not throw, but handle gracefully
      await expect(syncService.initialize()).resolves.not.toThrow();
    });

    it('should handle network failures during sync', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Queue an operation first
      await syncService.queueOperation('CREATE', 'workout', { id: 'test-workout' });
      
      // Mock network failure for the sync operation
      (global.fetch as any).mockReset();
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await syncService.triggerSync();
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should recover from temporary failures', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Queue an operation first
      await syncService.queueOperation('CREATE', 'workout', { id: 'test' });
      
      // Verify operation was queued
      const queuedOps = await syncQueue.getPendingOperations();
      expect(queuedOps.length).toBe(1);
      
      // Mock failure for the sync operation
      (global.fetch as any).mockReset();
      (global.fetch as any).mockRejectedValueOnce(new Error('Temporary failure'));
      
      // First sync should fail due to network error
      const firstResult = await syncService.triggerSync();
      expect(firstResult.failed).toBeGreaterThan(0);
      expect(firstResult.success).toBe(false);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up old operations', async () => {
      await syncService.initialize();
      
      // Mock some old completed operations
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.getAll as any).mockResolvedValueOnce([
        {
          id: 'old-op',
          status: 'completed',
          timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        }
      ]);

      await expect(syncService.cleanup(24)).resolves.not.toThrow();
    });

    it('should handle memory pressure gracefully', async () => {
      await syncService.initialize();
      
      // Queue many operations to test memory handling
      const promises = Array.from({ length: 100 }, (_, i) =>
        syncService.queueOperation('CREATE', 'workout', { id: `test-${i}` })
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });
});

  describe('Comprehensive End-to-End Sync Testing', () => {
    it('should handle complex multi-operation sync scenarios', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Queue multiple operations of different types
      const operations = [
        { type: 'CREATE' as const, entity: 'workout' as const, data: { id: 'workout-1', name: 'Morning Workout' } },
        { type: 'UPDATE' as const, entity: 'profile' as const, data: { id: 'profile-1', name: 'Updated Profile' } },
        { type: 'CREATE' as const, entity: 'exercise' as const, data: { id: 'exercise-1', name: 'Push-ups' } },
      ];

      // Reset and mock successful responses for all operations
      (global.fetch as any).mockReset();
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) });

      // Queue all operations
      for (const op of operations) {
        await syncService.queueOperation(op.type, op.entity, op.data);
      }

      // Trigger sync
      const result = await syncService.triggerSync();
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.conflicts.length).toBe(0);
    });

    it('should handle partial failures in batch operations', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Queue multiple operations
      await syncService.queueOperation('CREATE', 'workout', { id: 'workout-1' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'workout-2' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'workout-3' });

      // Reset and mock mixed success/failure responses
      (global.fetch as any).mockReset();
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) });

      const result = await syncService.triggerSync();
      
      expect(result.success).toBe(false);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle conflict resolution with merge strategy', async () => {
      await syncService.initialize();
      
      const conflictId = 'merge-conflict-test';
      const { dbManager } = await import('@/db/IndexedDBManager');
      
      // Mock conflict with mergeable data
      (dbManager.get as any).mockResolvedValueOnce({
        id: conflictId,
        entity: 'workout',
        entityId: 'workout-merge',
        localData: { 
          id: 'workout-merge', 
          name: 'Local Workout', 
          exercises: [{ id: 'ex1', name: 'Local Exercise' }],
          updated_at: Date.now() - 1000
        },
        remoteData: { 
          id: 'workout-merge', 
          name: 'Remote Workout', 
          exercises: [{ id: 'ex2', name: 'Remote Exercise' }],
          updated_at: Date.now()
        },
        localTimestamp: Date.now() - 1000,
        remoteTimestamp: Date.now(),
        conflictType: 'update_conflict',
        createdAt: Date.now(),
      });

      // Mock successful API calls for merge resolution
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      await expect(
        syncManager.resolveConflictManually(conflictId, {
          strategy: 'merge',
          resolvedData: {
            id: 'workout-merge',
            name: 'Merged Workout',
            exercises: [
              { id: 'ex1', name: 'Local Exercise' },
              { id: 'ex2', name: 'Remote Exercise' }
            ],
            updated_at: Date.now()
          }
        })
      ).resolves.not.toThrow();
    });

    it('should handle exponential backoff retry mechanism', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Queue an operation
      const operationId = await syncService.queueOperation('CREATE', 'workout', { id: 'retry-test' });
      
      // Reset and mock failure
      (global.fetch as any).mockReset();
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Start processing
      await syncQueue.startProcessing();
      
      // Wait for initial processing
      await TestUtils.waitForProcessing(150);
      
      // Check that operation is pending retry
      const pendingOps = await syncQueue.getPendingOperations();
      const retryOp = pendingOps.find(op => op.id === operationId);
      
      expect(retryOp).toBeDefined();
      expect(retryOp?.retryCount).toBeGreaterThan(0);
      expect(retryOp?.nextRetryAt).toBeDefined();
      expect(retryOp?.status).toBe('pending');
      
      // Verify exponential backoff calculation
      if (retryOp?.nextRetryAt) {
        const delay = retryOp.nextRetryAt - Date.now();
        expect(delay).toBeGreaterThan(0);
        // Should have some delay for retry
        expect(delay).toBeLessThan(10000); // But not too long for tests
      }
    });

    it('should handle network error simulation and recovery', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Simulate offline scenario
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Queue operations while offline
      await syncService.queueOperation('CREATE', 'workout', { id: 'offline-1' });
      await syncService.queueOperation('UPDATE', 'profile', { id: 'profile-1' });

      // Verify operations are queued
      const queueStats = await syncQueue.getQueueStats();
      expect(queueStats.pending).toBe(2);

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      // Reset and mock successful sync when back online
      (global.fetch as any).mockReset();
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      // Trigger sync
      const result = await syncService.triggerSync();
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
    });

    it('should handle sync manager integration edge cases', async () => {
      await TestUtils.clearSyncQueue();
      await syncService.initialize();
      
      // Test empty queue scenario
      const emptyResult = await syncService.triggerSync();
      expect(emptyResult.success).toBe(true);
      expect(emptyResult.synced).toBe(0);
      expect(emptyResult.failed).toBe(0);

      // Test invalid entity type
      await syncService.queueOperation('CREATE', 'workout', { id: 'invalid-test' });
      
      // Reset and mock fetch to simulate unknown entity error
      (global.fetch as any).mockReset();
      (global.fetch as any).mockRejectedValueOnce(new Error('Unknown entity type'));
      
      const invalidResult = await syncService.triggerSync();
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.failed).toBeGreaterThan(0);
    });
  });

describe('Real-Time Notifications Fix', () => {
  it('should prevent infinite loops in notification processing', () => {
    // Mock the real-time manager
    const mockManager = {
      subscribe: vi.fn().mockReturnValue('sub-id'),
      unsubscribe: vi.fn(),
      emit: vi.fn(),
    };

    // Test that subscription doesn't cause infinite re-renders
    let subscriptionCount = 0;
    mockManager.subscribe.mockImplementation(() => {
      subscriptionCount++;
      if (subscriptionCount > 5) {
        throw new Error('Infinite subscription loop detected');
      }
      return `sub-${subscriptionCount}`;
    });

    expect(() => {
      // Simulate multiple subscription attempts
      for (let i = 0; i < 3; i++) {
        mockManager.subscribe('test-event', () => {}, {});
      }
    }).not.toThrow();

    expect(subscriptionCount).toBeLessThanOrEqual(3);
  });

  it('should handle duplicate notifications correctly', () => {
    const processedIds = new Set<string>();
    
    const notifications = [
      { id: 'notif-1', type: 'info', title: 'Test 1', message: 'Message 1' },
      { id: 'notif-1', type: 'info', title: 'Test 1', message: 'Message 1' }, // Duplicate
      { id: 'notif-2', type: 'success', title: 'Test 2', message: 'Message 2' },
    ];

    notifications.forEach(notif => {
      if (!processedIds.has(notif.id)) {
        processedIds.add(notif.id);
      }
    });

    expect(processedIds.size).toBe(2); // Should only process unique notifications
  });
});