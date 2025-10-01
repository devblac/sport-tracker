/**
 * Comprehensive Offline Utils Tests
 * Tests for all offline functionality including network handling, graceful fallbacks, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineManager, NetworkErrorHandler } from '../offlineUtils';

// Mock navigator.connection with comprehensive API
const mockConnection = {
  type: 'wifi',
  effectiveType: '4g',
  downlink: 10,
  rtt: 50,
  saveData: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockNavigator = {
  onLine: true,
  connection: mockConnection
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

// Mock fetch for connectivity checks
global.fetch = vi.fn();

// Replace the global navigator
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

Object.defineProperty(global.window, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('Comprehensive Offline Utils Tests', () => {
  let offlineManager: OfflineManager;
  let networkErrorHandler: NetworkErrorHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset navigator state to defaults
    mockNavigator.onLine = true;
    mockConnection.effectiveType = '4g';
    mockConnection.rtt = 50;
    mockConnection.downlink = 10;
    mockConnection.saveData = false;
    mockConnection.type = 'wifi';
    
    // Reset singleton instances to get fresh data
    (OfflineManager as any).instance = null;
    (NetworkErrorHandler as any).instance = null;
    
    offlineManager = OfflineManager.getInstance();
    networkErrorHandler = NetworkErrorHandler.getInstance();
  });

  afterEach(() => {
    offlineManager.destroy();
    (OfflineManager as any).instance = null;
    (NetworkErrorHandler as any).instance = null;
  });

  describe('Network Quality Assessment Algorithm', () => {
    it('should correctly assess excellent network quality', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 30;
      mockConnection.downlink = 20;
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('excellent');
    });

    it('should correctly assess good network quality', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 120;
      mockConnection.downlink = 6;
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('good');
    });

    it('should correctly assess fair network quality', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.rtt = 150;
      mockConnection.downlink = 2;
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('fair');
    });

    it('should correctly assess poor network quality', () => {
      mockConnection.effectiveType = 'slow-2g';
      mockConnection.rtt = 1500;
      mockConnection.downlink = 0.1;
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('poor');
    });

    it('should return offline when not online', () => {
      mockNavigator.onLine = false;
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('offline');
    });
  });

  describe('Data Saving Mode Logic', () => {
    it('should enable data saving for poor connections', () => {
      mockConnection.effectiveType = '2g';
      mockConnection.rtt = 800;
      mockConnection.downlink = 0.3;
      mockConnection.saveData = false;
      
      offlineManager.getNetworkStatus(); // Force refresh
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should enable data saving when user preference is set', () => {
      mockConnection.saveData = true;
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 50;
      mockConnection.downlink = 10;
      
      offlineManager.getNetworkStatus(); // Force refresh
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should not enable data saving for good connections', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.saveData = false;
      mockConnection.rtt = 50;
      mockConnection.downlink = 10;
      
      offlineManager.getNetworkStatus(); // Force refresh
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(false);
    });

    it('should enable data saving for very high RTT', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 1200; // Very high RTT
      mockConnection.downlink = 10;
      mockConnection.saveData = false;
      
      offlineManager.getNetworkStatus(); // Force refresh
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should enable data saving for very low bandwidth', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 50;
      mockConnection.downlink = 0.1; // Very low bandwidth
      mockConnection.saveData = false;
      
      offlineManager.getNetworkStatus(); // Force refresh
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });
  });

  describe('Missing Connection API Handling', () => {
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
      
      // Should still work for quality assessment
      const quality = offlineManager.getNetworkQuality();
      expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
      
      // Restore connection
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        writable: true,
        configurable: true,
      });
    });

    it('should handle partial connection API gracefully', () => {
      const originalConnection = (navigator as any).connection;
      
      // Mock partial connection API
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          // Missing other properties
        },
        writable: true,
        configurable: true,
      });
      
      const status = offlineManager.getNetworkStatus();
      expect(status.effectiveType).toBe('3g');
      expect(status.connectionType).toBe('unknown');
      expect(status.downlink).toBe(0);
      expect(status.rtt).toBe(0);
      
      // Restore connection
      Object.defineProperty(navigator, 'connection', {
        value: originalConnection,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Network Error Handler Enhanced Logic', () => {
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

    it('should not retry client errors', () => {
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

  describe('Edge Cases and Robustness', () => {
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

    it('should handle zero values gracefully', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 0; // No RTT data
      mockConnection.downlink = 0; // No downlink data
      
      const quality = offlineManager.getNetworkQuality();
      expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
      
      const shouldSave = offlineManager.shouldSaveData();
      expect(typeof shouldSave).toBe('boolean');
    });

    it('should handle unknown connection types', () => {
      mockConnection.effectiveType = 'unknown';
      mockConnection.rtt = 100;
      mockConnection.downlink = 5;
      
      const quality = offlineManager.getNetworkQuality();
      expect(['excellent', 'good', 'fair', 'poor', 'offline']).toContain(quality);
    });
  });

  describe('Integration and Performance', () => {
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

    it('should support event listeners', () => {
      const networkListener = vi.fn();
      const offlineListener = vi.fn();
      
      offlineManager.addNetworkListener(networkListener);
      offlineManager.addOfflineListener(offlineListener);
      
      // Should not throw errors
      offlineManager.removeNetworkListener(networkListener);
      offlineManager.removeOfflineListener(offlineListener);
      
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle concurrent error processing', () => {
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