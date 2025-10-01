/**
 * Data Synchronization Service Tests
 * 
 * Basic test suite for data synchronization service functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSynchronizationService } from '../DataSynchronizationService';

// Mock global navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
});

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
  writable: true,
});

// Mock window events
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  },
  writable: true,
});

describe('DataSynchronizationService', () => {
  let syncService: DataSynchronizationService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create service instance
    syncService = DataSynchronizationService.getInstance();
  });

  afterEach(() => {
    if (syncService && typeof syncService.destroy === 'function') {
      syncService.destroy();
    }
  });

  describe('Basic Functionality', () => {
    it('should create service instance', () => {
      expect(syncService).toBeDefined();
      expect(typeof syncService.getSyncStatus).toBe('function');
    });

    it('should return sync status', () => {
      const status = syncService.getSyncStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('lastSyncTime');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('failedOperations');
      expect(status).toHaveProperty('syncInProgress');
      expect(status).toHaveProperty('errors');
    });

    it('should initialize with default status', () => {
      const status = syncService.getSyncStatus();
      
      expect(status.pendingOperations).toBe(0);
      expect(status.failedOperations).toBe(0);
      expect(status.syncInProgress).toBe(false);
      expect(status.errors).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should clear sync errors', () => {
      // Add some mock errors to the status
      const status = syncService.getSyncStatus();
      status.errors.push({
        id: 'error-1',
        operation: {} as any,
        error: 'Test error',
        timestamp: new Date(),
        retryable: true
      });
      
      syncService.clearSyncErrors();
      
      const clearedStatus = syncService.getSyncStatus();
      expect(clearedStatus.errors).toHaveLength(0);
    });

    it('should handle force sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      await expect(syncService.forcSync()).rejects.toThrow('Cannot sync while offline');
    });
  });

  describe('Service Management', () => {
    it('should initialize service', async () => {
      await expect(syncService.initialize()).resolves.not.toThrow();
    });

    it('should destroy service cleanly', () => {
      expect(() => syncService.destroy()).not.toThrow();
    });
  });
});