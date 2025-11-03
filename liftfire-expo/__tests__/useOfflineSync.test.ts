// Basic test to verify useOfflineSync hook exports
import { useOfflineSync, useSyncStatusIndicator } from '../hooks/useOfflineSync';

// Mock React Native modules
jest.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() }))
  }
}));

// Mock the offline sync library
jest.mock('../lib/offlineSync', () => ({
  initializeNetworkMonitoring: jest.fn(),
  cleanupNetworkMonitoring: jest.fn(),
  queueOperation: jest.fn(() => Promise.resolve()),
  processQueue: jest.fn(() => Promise.resolve()),
  getPendingSyncCount: jest.fn(() => Promise.resolve(0)),
  getSyncQueueStatus: jest.fn(() => Promise.resolve({
    pending: 0,
    failed: 0,
    syncing: 0,
    isOnline: true
  })),
  forceSyncNow: jest.fn(() => Promise.resolve()),
  retryFailedOperations: jest.fn(() => Promise.resolve())
}));

describe('useOfflineSync Hook', () => {
  it('should export useOfflineSync hook', () => {
    expect(typeof useOfflineSync).toBe('function');
  });

  it('should export useSyncStatusIndicator hook', () => {
    expect(typeof useSyncStatusIndicator).toBe('function');
  });

  // Note: Full hook testing would require @testing-library/react-hooks
  // which is not set up yet. These basic tests ensure the hooks are exportable.
});