/**
 * Advanced Sync Integration Test Scenarios
 * Comprehensive end-to-end testing for complex sync scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncService } from '@/services/SyncService';
import { syncQueue } from '@/utils/syncQueue';
import { syncManager } from '@/utils/syncManager';

// Enhanced mock setup
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

// Network simulation utilities
const NetworkSimulator = {
  simulateLatency: (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  simulateUnstableConnection: () => {
    const responses = [
      () => Promise.reject(new Error('Connection timeout')),
      () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
      () => Promise.reject(new Error('Network unreachable')),
      () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }),
    ];
    
    responses.forEach(response => {
      (global.fetch as any).mockImplementationOnce(response);
    });
  },
  
  simulateServerOverload: () => {
    // Simulate 503 Service Unavailable
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.resolve({ error: 'Server overloaded' }),
    });
  },
  
  simulateAuthFailure: () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Authentication failed' }),
    });
  }
};

global.fetch = vi.fn();

describe('Advanced Sync Integration Scenarios', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset fetch mock to default success
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
    
    // Clear any existing data
    const { dbManager } = await import('@/db/IndexedDBManager');
    await dbManager.clear?.();
  });

  afterEach(() => {
    syncService.destroy();
  });

  describe('Complex Conflict Resolution Scenarios', () => {
    it('should handle three-way merge conflicts', async () => {
      await syncService.initialize();
      
      const conflictId = 'three-way-merge';
      const { dbManager } = await import('@/db/IndexedDBManager');
      
      // Mock a complex three-way merge scenario
      (dbManager.get as any).mockResolvedValueOnce({
        id: conflictId,
        entity: 'workout',
        entityId: 'workout-complex',
        localData: {
          id: 'workout-complex',
          name: 'Local Workout',
          exercises: [
            { id: 'ex1', name: 'Push-ups', sets: 3, reps: 10 },
            { id: 'ex2', name: 'Squats', sets: 3, reps: 15 }
          ],
          tags: ['strength', 'local-tag'],
          updated_at: Date.now() - 2000
        },
        remoteData: {
          id: 'workout-complex',
          name: 'Remote Workout',
          exercises: [
            { id: 'ex1', name: 'Push-ups', sets: 4, reps: 12 }, // Modified
            { id: 'ex3', name: 'Pull-ups', sets: 3, reps: 8 }   // New exercise
          ],
          tags: ['strength', 'remote-tag'],
          updated_at: Date.now() - 1000
        },
        localTimestamp: Date.now() - 2000,
        remoteTimestamp: Date.now() - 1000,
        conflictType: 'update_conflict',
        createdAt: Date.now(),
      });

      // Mock successful merge resolution
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      const mergedData = {
        id: 'workout-complex',
        name: 'Merged Workout',
        exercises: [
          { id: 'ex1', name: 'Push-ups', sets: 4, reps: 12 }, // Use remote version
          { id: 'ex2', name: 'Squats', sets: 3, reps: 15 },   // Keep local
          { id: 'ex3', name: 'Pull-ups', sets: 3, reps: 8 }   // Add remote
        ],
        tags: ['strength', 'local-tag', 'remote-tag'], // Merge tags
        updated_at: Date.now()
      };

      await expect(
        syncManager.resolveConflictManually(conflictId, {
          strategy: 'merge',
          resolvedData: mergedData
        })
      ).resolves.not.toThrow();
    });

    it('should handle cascading conflict resolution', async () => {
      await syncService.initialize();
      
      // Create multiple related conflicts
      const conflicts = [
        'workout-conflict-1',
        'workout-conflict-2',
        'profile-conflict-1'
      ];

      const { dbManager } = await import('@/db/IndexedDBManager');
      
      // Mock multiple conflicts
      conflicts.forEach((conflictId, index) => {
        (dbManager.get as any).mockResolvedValueOnce({
          id: conflictId,
          entity: index < 2 ? 'workout' : 'profile',
          entityId: `entity-${index}`,
          localData: { id: `entity-${index}`, name: `Local ${index}` },
          remoteData: { id: `entity-${index}`, name: `Remote ${index}` },
          localTimestamp: Date.now() - 1000,
          remoteTimestamp: Date.now(),
          conflictType: 'update_conflict',
          createdAt: Date.now(),
        });
      });

      // Mock successful resolutions
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      // Resolve all conflicts
      for (const conflictId of conflicts) {
        await expect(
          syncManager.resolveConflictManually(conflictId, { strategy: 'local_wins' })
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Network Resilience and Recovery', () => {
    it('should handle unstable network conditions', async () => {
      await syncService.initialize();
      
      // Queue multiple operations
      const operations = [
        { type: 'CREATE' as const, entity: 'workout' as const, data: { id: 'w1' } },
        { type: 'UPDATE' as const, entity: 'profile' as const, data: { id: 'p1' } },
        { type: 'CREATE' as const, entity: 'exercise' as const, data: { id: 'e1' } },
        { type: 'DELETE' as const, entity: 'workout' as const, data: { id: 'w2' } },
      ];

      for (const op of operations) {
        await syncService.queueOperation(op.type, op.entity, op.data);
      }

      // Simulate unstable network
      NetworkSimulator.simulateUnstableConnection();

      const result = await syncService.triggerSync();
      
      // Should handle partial success/failure gracefully
      expect(result.synced + result.failed).toBe(operations.length);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should recover from server overload scenarios', async () => {
      await syncService.initialize();
      
      await syncService.queueOperation('CREATE', 'workout', { id: 'overload-test' });
      
      // Simulate server overload followed by recovery
      NetworkSimulator.simulateServerOverload();
      
      const overloadResult = await syncService.triggerSync();
      expect(overloadResult.success).toBe(false);
      expect(overloadResult.failed).toBe(1);
      
      // Simulate recovery
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
      
      // Should be able to retry successfully
      const recoveryResult = await syncService.triggerSync();
      expect(recoveryResult.success).toBe(true);
    });

    it('should handle authentication failures during sync', async () => {
      await syncService.initialize();
      
      await syncService.queueOperation('UPDATE', 'profile', { id: 'auth-test' });
      
      // Simulate auth failure (non-retryable)
      NetworkSimulator.simulateAuthFailure();
      
      const result = await syncService.triggerSync();
      expect(result.success).toBe(false);
      expect(result.failed).toBe(1);
      
      // Verify operation is marked as failed (not pending retry)
      const stats = await syncQueue.getQueueStats();
      expect(stats.failed).toBeGreaterThan(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large batch operations efficiently', async () => {
      await syncService.initialize();
      
      const startTime = Date.now();
      
      // Queue many operations
      const batchSize = 50;
      const operations = Array.from({ length: batchSize }, (_, i) => ({
        type: 'CREATE' as const,
        entity: 'workout' as const,
        data: { id: `batch-${i}`, name: `Workout ${i}` }
      }));

      // Mock all as successful
      for (let i = 0; i < batchSize; i++) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({}),
        });
      }

      // Queue all operations
      for (const op of operations) {
        await syncService.queueOperation(op.type, op.entity, op.data);
      }

      const result = await syncService.triggerSync();
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(batchSize);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle memory pressure during sync', async () => {
      await syncService.initialize();
      
      // Simulate memory pressure by creating many operations
      const largeDataOperations = Array.from({ length: 20 }, (_, i) => ({
        type: 'CREATE' as const,
        entity: 'workout' as const,
        data: {
          id: `large-${i}`,
          name: `Large Workout ${i}`,
          exercises: Array.from({ length: 100 }, (_, j) => ({
            id: `ex-${i}-${j}`,
            name: `Exercise ${j}`,
            sets: Array.from({ length: 5 }, (_, k) => ({
              reps: 10,
              weight: 50,
              timestamp: Date.now() + k
            }))
          }))
        }
      }));

      // Mock successful responses
      largeDataOperations.forEach(() => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({}),
        });
      });

      // Queue operations
      for (const op of largeDataOperations) {
        await syncService.queueOperation(op.type, op.entity, op.data);
      }

      // Should handle large data without memory issues
      await expect(syncService.triggerSync()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle corrupted operation data', async () => {
      await syncService.initialize();
      
      // Manually insert corrupted operation
      const { dbManager } = await import('@/db/IndexedDBManager');
      await dbManager.put('syncQueue', {
        id: 'corrupted-op',
        type: 'INVALID_TYPE',
        entity: 'unknown_entity',
        data: null,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        priority: 'medium',
        status: 'pending'
      });

      const result = await syncService.triggerSync();
      
      // Should handle corrupted data gracefully
      expect(result.failed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle database connection failures', async () => {
      await syncService.initialize();
      
      // Mock database failure
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.getAll as any).mockRejectedValueOnce(new Error('Database connection failed'));
      
      // Should handle database errors gracefully
      const result = await syncService.triggerSync();
      expect(result.success).toBe(true); // Empty result due to DB failure
      expect(result.synced).toBe(0);
    });

    it('should handle concurrent sync operations', async () => {
      await syncService.initialize();
      
      // Queue operations
      await syncService.queueOperation('CREATE', 'workout', { id: 'concurrent-1' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'concurrent-2' });
      
      // Mock responses
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve({}) });
      
      // Trigger multiple concurrent syncs
      const syncPromises = [
        syncService.triggerSync(),
        syncService.triggerSync(),
        syncService.triggerSync()
      ];
      
      const results = await Promise.all(syncPromises);
      
      // Should handle concurrent operations without conflicts
      const totalSynced = results.reduce((sum, result) => sum + result.synced, 0);
      expect(totalSynced).toBeGreaterThan(0);
    });
  });

  describe('Sync Queue Advanced Features', () => {
    it('should prioritize high-priority operations', async () => {
      await syncService.initialize();
      
      // Queue operations with different priorities
      await syncService.queueOperation('CREATE', 'workout', { id: 'low-1' }, { priority: 'low' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'high-1' }, { priority: 'high' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'medium-1' }, { priority: 'medium' });
      await syncService.queueOperation('CREATE', 'workout', { id: 'high-2' }, { priority: 'high' });
      
      const pendingOps = await syncQueue.getPendingOperations();
      
      // High priority operations should come first
      expect(pendingOps[0].priority).toBe('high');
      expect(pendingOps[1].priority).toBe('high');
      expect(pendingOps[2].priority).toBe('medium');
      expect(pendingOps[3].priority).toBe('low');
    });

    it('should handle queue cleanup and maintenance', async () => {
      await syncService.initialize();
      
      // Create some completed operations
      const { dbManager } = await import('@/db/IndexedDBManager');
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      
      await dbManager.put('syncQueue', {
        id: 'old-completed',
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'old' },
        timestamp: oldTimestamp,
        retryCount: 0,
        maxRetries: 3,
        priority: 'medium',
        status: 'completed'
      });
      
      // Cleanup old operations
      const cleanedCount = await syncQueue.cleanupCompletedOperations(24);
      expect(cleanedCount).toBe(1);
    });
  });
});