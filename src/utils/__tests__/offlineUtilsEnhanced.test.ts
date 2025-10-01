/**
 * Enhanced Offline Utils Tests
 * Tests for improved offline experience functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { offlineManager, networkErrorHandler } from '../offlineUtils';

// Mock navigator.connection
const mockConnection = {
  type: 'wifi',
  effectiveType: '4g',
  downlink: 10,
  rtt: 50,
  saveData: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(navigator, 'connection', {
  value: mockConnection,
  writable: true,
  configurable: true,
});

describe('Enhanced Offline Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset connection mock to default values
    mockConnection.type = 'wifi';
    mockConnection.effectiveType = '4g';
    mockConnection.downlink = 10;
    mockConnection.rtt = 50;
    mockConnection.saveData = false;
    
    // Mock fetch for connectivity checks
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Network Quality Detection', () => {
    it('should detect excellent network quality', () => {
      // Mock excellent connection
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 15;
      mockConnection.rtt = 30;
      mockConnection.saveData = false;

      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('excellent');
    });

    it('should detect poor network quality', () => {
      // Mock poor connection
      mockConnection.type = 'cellular';
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.3;
      mockConnection.rtt = 800;
      mockConnection.saveData = true;

      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('poor');
    });

    it('should detect offline status', () => {
      // Mock offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('offline');
      
      // Restore online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    });
  });

  describe('Data Saving Mode', () => {
    it('should enable data saving for poor connections', () => {
      // Mock poor connection
      mockConnection.type = 'cellular';
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.1;
      mockConnection.rtt = 1200;
      mockConnection.saveData = false;

      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should respect user saveData preference', () => {
      // Mock user preference
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 10;
      mockConnection.rtt = 50;
      mockConnection.saveData = true; // User explicitly enabled

      // Force refresh of status
      offlineManager.getNetworkStatus();
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should not enable data saving for good connections', () => {
      // Mock good connection
      mockConnection.type = 'wifi';
      mockConnection.effectiveType = '4g';
      mockConnection.downlink = 12;
      mockConnection.rtt = 40;
      mockConnection.saveData = false;

      // Force refresh of status
      offlineManager.getNetworkStatus();
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(false);
    });
  });

  describe('Network Status Information', () => {
    it('should provide comprehensive network status', () => {
      const status = offlineManager.getNetworkStatus();
      
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('connectionType');
      expect(status).toHaveProperty('effectiveType');
      expect(status).toHaveProperty('downlink');
      expect(status).toHaveProperty('rtt');
      expect(status).toHaveProperty('saveData');
      
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.connectionType).toBe('string');
      expect(typeof status.effectiveType).toBe('string');
      expect(typeof status.downlink).toBe('number');
      expect(typeof status.rtt).toBe('number');
      expect(typeof status.saveData).toBe('boolean');
    });

    it('should track offline duration', () => {
      const duration = offlineManager.getOfflineDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      const result = networkErrorHandler.handleError(networkError, 'test');
      
      expect(result.errorType).toBe('network');
      expect(result.shouldRetry).toBe(true);
      expect(result.retryDelay).toBeGreaterThan(0);
    });

    it('should classify server errors correctly', () => {
      const serverError = new Error('Internal server error 500');
      const result = networkErrorHandler.handleError(serverError, 'test');
      
      expect(result.errorType).toBe('server');
      expect(result.shouldRetry).toBe(true);
      expect(result.retryDelay).toBeGreaterThan(0);
    });

    it('should classify client errors correctly', () => {
      const clientError = new Error('Bad request 400');
      const result = networkErrorHandler.handleError(clientError, 'test');
      
      expect(result.errorType).toBe('client');
      expect(result.shouldRetry).toBe(false);
      expect(result.retryDelay).toBe(0);
    });

    it('should implement exponential backoff', () => {
      const error = new Error('Network timeout');
      
      const firstAttempt = networkErrorHandler.handleError(error, 'backoff-test');
      const secondAttempt = networkErrorHandler.handleError(error, 'backoff-test');
      const thirdAttempt = networkErrorHandler.handleError(error, 'backoff-test');
      
      expect(firstAttempt.retryDelay).toBeLessThan(secondAttempt.retryDelay);
      expect(secondAttempt.retryDelay).toBeLessThan(thirdAttempt.retryDelay);
    });

    it('should open circuit breaker after multiple failures', () => {
      const error = new Error('Persistent failure');
      
      // Simulate multiple failures
      for (let i = 0; i < 6; i++) {
        networkErrorHandler.handleError(error, 'circuit-breaker-test');
      }
      
      const result = networkErrorHandler.handleError(error, 'circuit-breaker-test');
      expect(result.isCircuitOpen).toBe(true);
      expect(result.shouldRetry).toBe(false);
    });

    it('should provide error statistics', () => {
      const error = new Error('Test error for stats');
      networkErrorHandler.handleError(error, 'stats-test');
      
      const stats = networkErrorHandler.getErrorStats();
      expect(typeof stats).toBe('object');
      expect(Object.keys(stats).length).toBeGreaterThan(0);
      
      // Check that stats contain expected properties
      const statKeys = Object.keys(stats);
      const firstStat = stats[statKeys[0]];
      expect(firstStat).toHaveProperty('count');
      expect(firstStat).toHaveProperty('lastError');
      expect(firstStat).toHaveProperty('circuitOpen');
    });

    it('should reset error tracking', () => {
      const error = new Error('Test error for reset');
      networkErrorHandler.handleError(error, 'reset-test');
      
      let stats = networkErrorHandler.getErrorStats();
      const initialCount = Object.keys(stats).length;
      expect(initialCount).toBeGreaterThan(0);
      
      networkErrorHandler.resetErrorTracking('reset-test');
      
      stats = networkErrorHandler.getErrorStats();
      const resetKeys = Object.keys(stats).filter(key => key.startsWith('reset-test'));
      expect(resetKeys.length).toBe(0);
    });
  });

  describe('Network Listeners', () => {
    it('should support adding and removing network listeners', () => {
      const mockListener = vi.fn();
      
      offlineManager.addNetworkListener(mockListener);
      offlineManager.removeNetworkListener(mockListener);
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should support adding and removing offline listeners', () => {
      const mockListener = vi.fn();
      
      offlineManager.addOfflineListener(mockListener);
      offlineManager.removeOfflineListener(mockListener);
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing connection API gracefully', () => {
      const originalConnection = (navigator as any).connection;
      
      // Set connection to undefined to simulate missing API
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      const status = offlineManager.getNetworkStatus();
      expect(status.connectionType).toBe('unknown');
      expect(status.effectiveType).toBe('unknown');
      expect(status.downlink).toBe(0);
      expect(status.rtt).toBe(0);
      
      // Restore connection
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        writable: true,
        configurable: true,
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = new Error('Some unknown error');
      const result = networkErrorHandler.handleError(unknownError, 'unknown-test');
      
      expect(result.errorType).toBe('unknown');
      expect(typeof result.shouldRetry).toBe('boolean');
      expect(typeof result.retryDelay).toBe('number');
    });

    it('should handle very high RTT values', () => {
      mockConnection.type = 'cellular';
      mockConnection.effectiveType = '3g';
      mockConnection.downlink = 1;
      mockConnection.rtt = 2000; // Very high RTT
      mockConnection.saveData = false;

      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('poor');
      
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should handle very low bandwidth', () => {
      mockConnection.type = 'cellular';
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.downlink = 0.1; // Very low bandwidth
      mockConnection.rtt = 300;
      mockConnection.saveData = false;

      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('poor');
      
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid network status changes', () => {
      // Simulate rapid changes
      for (let i = 0; i < 10; i++) {
        mockConnection.effectiveType = i % 2 === 0 ? '4g' : '2g';
        if (i % 2 === 0) {
          mockConnection.downlink = 10;
          mockConnection.rtt = 50;
        } else {
          mockConnection.downlink = 0.5;
          mockConnection.rtt = 500;
        }
        const quality = offlineManager.getNetworkQuality();
        expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
      }
    });

    it('should maintain consistent behavior across multiple calls', () => {
      const qualities = [];
      for (let i = 0; i < 5; i++) {
        qualities.push(offlineManager.getNetworkQuality());
      }
      
      // All calls should return the same result for stable connection
      const uniqueQualities = [...new Set(qualities)];
      expect(uniqueQualities.length).toBe(1);
    });

    it('should handle concurrent error handling', () => {
      const error = new Error('Concurrent test error');
      const results = [];
      
      // Simulate concurrent error handling
      for (let i = 0; i < 5; i++) {
        results.push(networkErrorHandler.handleError(error, `concurrent-${i}`));
      }
      
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result).toHaveProperty('errorType');
        expect(result).toHaveProperty('shouldRetry');
        expect(result).toHaveProperty('retryDelay');
      });
    });
  });
});