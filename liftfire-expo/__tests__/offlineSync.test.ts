// Basic test to verify offline sync functions are properly exported
import { 
  initializeNetworkMonitoring,
  cleanupNetworkMonitoring,
  queueOperation,
  getPendingSyncCount,
  getSyncQueueStatus
} from '../lib/offlineSync';

// Mock NetInfo since it's not available in test environment
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true }))
}));

// Mock database functions
jest.mock('../lib/database', () => ({
  getDatabase: jest.fn(() => Promise.resolve({
    runAsync: jest.fn(),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    getFirstAsync: jest.fn(() => Promise.resolve({ count: 0 })),
    execAsync: jest.fn()
  })),
  whitelistWorkoutData: jest.fn(data => data),
  whitelistExerciseData: jest.fn(data => data)
}));

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('Offline Sync Module', () => {
  it('should export required functions', () => {
    expect(typeof initializeNetworkMonitoring).toBe('function');
    expect(typeof cleanupNetworkMonitoring).toBe('function');
    expect(typeof queueOperation).toBe('function');
    expect(typeof getPendingSyncCount).toBe('function');
    expect(typeof getSyncQueueStatus).toBe('function');
  });

  it('should initialize network monitoring without errors', () => {
    expect(() => {
      initializeNetworkMonitoring();
    }).not.toThrow();
  });

  it('should cleanup network monitoring without errors', () => {
    expect(() => {
      cleanupNetworkMonitoring();
    }).not.toThrow();
  });

  it('should queue operations for supported tables only', async () => {
    // Should work for workouts
    await expect(queueOperation('CREATE_WORKOUT', 'workouts', 'test-id', {})).resolves.not.toThrow();
    
    // Should work for exercises
    await expect(queueOperation('CREATE_EXERCISE', 'exercises', 'test-id', {})).resolves.not.toThrow();
  });

  it('should get pending sync count', async () => {
    const count = await getPendingSyncCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should get sync queue status', async () => {
    const status = await getSyncQueueStatus();
    expect(status).toHaveProperty('pending');
    expect(status).toHaveProperty('failed');
    expect(status).toHaveProperty('syncing');
    expect(status).toHaveProperty('isOnline');
    expect(typeof status.pending).toBe('number');
    expect(typeof status.failed).toBe('number');
    expect(typeof status.syncing).toBe('number');
    expect(typeof status.isOnline).toBe('boolean');
  });
});