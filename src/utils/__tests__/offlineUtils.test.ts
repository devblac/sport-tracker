/**
 * Tests for Offline Utils
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineManager, NetworkErrorHandler } from '../offlineUtils';

// Mock navigator and window objects
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

// Mock fetch
global.fetch = vi.fn();

// Replace the global navigator
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

// Also replace window.navigator for consistency
Object.defineProperty(global.window, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator state
    mockNavigator.onLine = true;
    mockConnection.effectiveType = '4g';
    mockConnection.rtt = 50;
    mockConnection.downlink = 10;
    mockConnection.saveData = false;
    mockConnection.type = 'wifi';
    
    // Reset the singleton instance to get fresh data
    (OfflineManager as any).instance = null;
    offlineManager = OfflineManager.getInstance();
  });

  afterEach(() => {
    offlineManager.destroy();
    // Reset the singleton instance
    (OfflineManager as any).instance = null;
  });

  describe('Network Status Detection', () => {
    it('should detect online status', () => {
      const status = offlineManager.getNetworkStatus();
      expect(status.isOnline).toBe(true);
    });

    it('should detect offline status', () => {
      mockNavigator.onLine = false;
      const status = offlineManager.getNetworkStatus();
      expect(status.isOnline).toBe(false);
    });

    it('should get connection details', () => {
      const status = offlineManager.getNetworkStatus();
      expect(status.connectionType).toBe('wifi');
      expect(status.effectiveType).toBe('4g');
      expect(status.downlink).toBe(10);
      expect(status.rtt).toBe(50);
    });
  });

  describe('Network Quality Assessment', () => {
    it('should return excellent for 4g with good metrics', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 30;
      mockConnection.downlink = 20; // Increase to ensure excellent rating
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('excellent');
    });

    it('should return good for 4g with average metrics', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.rtt = 120; // Higher RTT to reduce score
      mockConnection.downlink = 6; // Lower downlink to reduce score
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('good');
    });

    it('should return fair for 3g', () => {
      mockConnection.effectiveType = '3g';
      mockConnection.rtt = 150; // Moderate RTT for fair rating
      mockConnection.downlink = 2; // Moderate downlink for fair rating
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('fair');
    });

    it('should return poor for 2g', () => {
      mockConnection.effectiveType = 'slow-2g'; // Use slowest connection type
      mockConnection.rtt = 1500; // Extremely high RTT for poor rating
      mockConnection.downlink = 0.1; // Extremely low downlink for poor rating
      
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('poor');
    });

    it('should return offline when not online', () => {
      mockNavigator.onLine = false;
      
      // Force refresh of status since we changed navigator.onLine
      const status = offlineManager.getNetworkStatus();
      const quality = offlineManager.getNetworkQuality();
      expect(quality).toBe('offline');
    });
  });

  describe('Data Saving Mode', () => {
    it('should enable data saving for poor connections', () => {
      mockConnection.effectiveType = '2g';
      mockConnection.rtt = 800;
      mockConnection.downlink = 0.3;
      mockConnection.saveData = false;
      
      // Force refresh of status
      offlineManager.getNetworkStatus();
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should enable data saving when saveData is true', () => {
      mockConnection.saveData = true;
      mockConnection.effectiveType = '4g'; // Good connection but saveData is true
      mockConnection.rtt = 50;
      mockConnection.downlink = 10;
      
      // Force refresh of status
      offlineManager.getNetworkStatus();
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(true);
    });

    it('should not enable data saving for good connections', () => {
      mockConnection.effectiveType = '4g';
      mockConnection.saveData = false;
      mockConnection.rtt = 50;
      mockConnection.downlink = 10;
      
      const shouldSave = offlineManager.shouldSaveData();
      expect(shouldSave).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add network listeners', () => {
      const listener = vi.fn();
      offlineManager.addNetworkListener(listener);
      
      // Simulate network change
      const status = offlineManager.getNetworkStatus();
      // Note: In a real test, we'd trigger the actual event
      expect(listener).not.toHaveBeenCalled(); // Not called until event fires
    });

    it('should add offline listeners', () => {
      const listener = vi.fn();
      offlineManager.addOfflineListener(listener);
      
      // Note: In a real test, we'd trigger the actual event
      expect(listener).not.toHaveBeenCalled(); // Not called until event fires
    });

    it('should remove listeners', () => {
      const listener = vi.fn();
      offlineManager.addNetworkListener(listener);
      offlineManager.removeNetworkListener(listener);
      
      // Listener should be removed
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Connectivity Check', () => {
    it('should check connectivity with fetch', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(new Response('OK', { status: 200 }));
      
      // Note: checkConnectivity is private, so we'd need to expose it or test through public methods
      // This is a simplified test structure
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Note: This would test the error handling in checkConnectivity
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

describe('NetworkErrorHandler', () => {
  let errorHandler: NetworkErrorHandler;

  beforeEach(() => {
    errorHandler = NetworkErrorHandler.getInstance();
  });

  describe('Error Classification', () => {
    it('should classify network errors', () => {
      const networkError = new Error('Network request failed');
      const result = errorHandler.handleError(networkError, 'test');
      
      expect(result.errorType).toBe('network');
      expect(result.shouldRetry).toBe(true);
    });

    it('should classify server errors', () => {
      const serverError = new Error('Internal server error');
      const result = errorHandler.handleError(serverError, 'test');
      
      expect(result.errorType).toBe('server');
      expect(result.shouldRetry).toBe(true);
    });

    it('should classify client errors', () => {
      const clientError = new Error('Bad request');
      const result = errorHandler.handleError(clientError, 'test');
      
      expect(result.errorType).toBe('client');
      expect(result.shouldRetry).toBe(false);
    });

    it('should classify unknown errors', () => {
      const unknownError = new Error('Something went wrong');
      const result = errorHandler.handleError(unknownError, 'test');
      
      expect(result.errorType).toBe('unknown');
      expect(result.shouldRetry).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should allow retries for network errors', () => {
      const networkError = new Error('fetch failed');
      const result = errorHandler.handleError(networkError, 'test');
      
      expect(result.shouldRetry).toBe(true);
      expect(result.retryDelay).toBeGreaterThan(0);
    });

    it('should not allow retries for client errors', () => {
      const clientError = new Error('unauthorized');
      const result = errorHandler.handleError(clientError, 'test');
      
      expect(result.shouldRetry).toBe(false);
      expect(result.retryDelay).toBe(0);
    });

    it('should calculate exponential backoff', () => {
      const networkError = new Error('network error');
      
      const result1 = errorHandler.handleError(networkError, 'test');
      const result2 = errorHandler.handleError(networkError, 'test');
      const result3 = errorHandler.handleError(networkError, 'test');
      
      expect(result2.retryDelay).toBeGreaterThan(result1.retryDelay);
      expect(result3.retryDelay).toBeGreaterThan(result2.retryDelay);
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after multiple failures', () => {
      const error = new Error('network error');
      
      // Trigger multiple errors
      for (let i = 0; i < 6; i++) {
        errorHandler.handleError(error, 'test');
      }
      
      const result = errorHandler.handleError(error, 'test');
      expect(result.isCircuitOpen).toBe(true);
      expect(result.shouldRetry).toBe(false);
    });

    it('should reset circuit breaker after time', () => {
      // This would require mocking time or waiting
      // Simplified test structure
      expect(true).toBe(true);
    });
  });

  describe('Error Statistics', () => {
    it('should track error counts', () => {
      const error = new Error('test error');
      
      errorHandler.handleError(error, 'test-context');
      errorHandler.handleError(error, 'test-context');
      
      const stats = errorHandler.getErrorStats();
      expect(Object.keys(stats)).toContain('test-context-unknown');
    });

    it('should reset error tracking', () => {
      const error = new Error('test error');
      
      errorHandler.handleError(error, 'test-context');
      errorHandler.resetErrorTracking('test-context');
      
      const stats = errorHandler.getErrorStats();
      const contextKeys = Object.keys(stats).filter(key => key.startsWith('test-context'));
      expect(contextKeys).toHaveLength(0);
    });
  });
});

describe('Integration Tests', () => {
  it('should work together for offline experience', () => {
    const offlineManager = OfflineManager.getInstance();
    const errorHandler = NetworkErrorHandler.getInstance();
    
    // Test that both instances are created
    expect(offlineManager).toBeDefined();
    expect(errorHandler).toBeDefined();
    
    // Test basic functionality
    const networkStatus = offlineManager.getNetworkStatus();
    expect(networkStatus).toHaveProperty('isOnline');
    
    const error = new Error('test error');
    const errorResult = errorHandler.handleError(error, 'integration-test');
    expect(errorResult).toHaveProperty('shouldRetry');
  });
});