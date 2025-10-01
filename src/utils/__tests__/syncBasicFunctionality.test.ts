/**
 * Basic Sync Functionality Tests
 * Simple tests to verify core sync operations work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncService } from '@/services/SyncService';
import { syncQueue } from '@/utils/syncQueue';
import { syncManager } from '@/utils/syncManager';

// Simple mock setup
vi.mock('@/db/IndexedDBManager', () => {
  const mockData = new Map();
  
  return {
    dbManager: {
      init: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockImplementation((store, data) => {
        const key = `${store}-${data.id}`;
        mockData.set(key, data);
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

global.fetch = vi.fn();

describe('Basic Sync Functionality Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Clear mock data
    const { dbManager } = await import('@/db/IndexedDBManager');
    await dbManager.clear();
    
    // Reset fetch mock to success
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    syncService.destroy();
    syncQueue.stopProcessing();
  });

  describe('SyncQueue Basic Operations', () => {
    it('should add operations to queue', async () => {
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test-workout' },
        priority: 'medium',
        maxRetries: 3,
      });

      expect(operationId).toBeDefined();
      expect(typeof operationId).toBe('string');

      const pendingOps = await syncQueue.getPendingOperations();
      expect(pendingOps.length).toBe(1);
      expect(pendingOps[0].id).toBe(operationId);
    });

    it('should process operations with network success', async () => {
      // Mock successful network response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'test-workout' }),
      });

      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test-workout' },
        priority: 'medium',
        maxRetries: 3,
      });

      // Process the operation
      await syncQueue.startProcessing();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check operation status
      const completedOps = await syncQueue.getOperationsByStatus('completed');
      expect(completedOps.length).toBe(1);
      expect(completedOps[0].id).toBe(operationId);
    });

    it('should handle network failures with retry', async () => {
      // Mock network failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test-workout' },
        priority: 'medium',
        maxRetries: 3,
      });

      // Process the operation
      await syncQueue.startProcessing();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check that operation is pending retry
      const pendingOps = await syncQueue.getPendingOperations();
      const retryOp = pendingOps.find(op => op.id === operationId);
      
      expect(retryOp).toBeDefined();
      expect(retryOp?.retryCount).toBe(1);
      expect(retryOp?.status).toBe('pending');
      expect(retryOp?.nextRetryAt).toBeDefined();
    });
  });

  describe('SyncManager Basic Operations', () => {
    it('should sync single operation successfully', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({}),
      });

      // Add operation to queue
      await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test-workout' },
        priority: 'medium',
        maxRetries: 3,
      });

      // Perform sync
      const result = await syncManager.performSync();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it('should handle sync failures', async () => {
      // Mock network failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Add operation to queue
      const operationId = await syncQueue.addOperation({
        type: 'CREATE',
        entity: 'workout',
        data: { id: 'test-workout' },
        priority: 'medium',
        maxRetries: 3,
      });

      // Verify operation was added
      const pendingOps = await syncQueue.getPendingOperations();
      expect(pendingOps.length).toBe(1);
      expect(pendingOps[0].id).toBe(operationId);

      // Perform sync
      const result = await syncManager.performSync();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty queue', async () => {
      // Perform sync with empty queue
      const result = await syncManager.performSync();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('SyncService Integration', () => {
    it('should initialize and queue operations', async () => {
      await syncService.initialize();

      const operationId = await syncService.queueOperation(
        'CREATE',
        'workout',
        { id: 'test-workout', name: 'Test Workout' }
      );

      expect(operationId).toBeDefined();

      const status = await syncService.getSyncStatus();
      expect(status.pendingOperations).toBe(1);
    });

    it('should trigger sync successfully', async () => {
      await syncService.initialize();

      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({}),
      });

      // Queue operation
      const operationId = await syncService.queueOperation('CREATE', 'workout', { id: 'test-workout' });
      
      // Verify operation was queued
      const queueStats = await syncQueue.getQueueStats();
      expect(queueStats.pending).toBe(1);

      // Trigger sync
      const result = await syncService.triggerSync();

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle sync failures in service', async () => {
      await syncService.initialize();

      // Mock network failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Queue operation
      const operationId = await syncService.queueOperation('CREATE', 'workout', { id: 'test-workout' });
      
      // Verify operation was queued
      const queueStats = await syncQueue.getQueueStats();
      expect(queueStats.pending).toBe(1);

      // Trigger sync
      const result = await syncService.triggerSync();

      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and store conflicts', async () => {
      const conflictId = 'test-conflict';
      
      // Mock conflict data
      const { dbManager } = await import('@/db/IndexedDBManager');
      (dbManager.get as any).mockResolvedValueOnce({
        id: conflictId,
        entity: 'workout',
        entityId: 'workout-1',
        localData: { id: 'workout-1', name: 'Local Workout' },
        remoteData: { id: 'workout-1', name: 'Remote Workout' },
        localTimestamp: Date.now() - 1000,
        remoteTimestamp: Date.now(),
        conflictType: 'update_conflict',
        createdAt: Date.now(),
      });

      // Mock successful resolution
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await expect(
        syncManager.resolveConflictManually(conflictId, { strategy: 'local_wins' })
      ).resolves.not.toThrow();
    });
  });
});