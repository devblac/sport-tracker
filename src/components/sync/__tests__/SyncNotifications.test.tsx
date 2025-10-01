import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncNotifications } from '../SyncNotifications';

// Mock the useSync hook
vi.mock('@/hooks/useSync', () => ({
  useSync: vi.fn(() => ({
    status: {
      isOnline: true,
      isSyncing: false,
      pendingOperations: 0,
      lastSyncTime: Date.now(),
      hasConflicts: false,
    },
    pendingConflicts: [],
    lastSyncResult: null,
  })),
}));

describe('SyncNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<SyncNotifications />);
    }).not.toThrow();
  });

  it('should handle empty conflicts array without errors', () => {
    const { useSync } = require('@/hooks/useSync');
    
    useSync.mockReturnValue({
      status: {
        isOnline: true,
        isSyncing: false,
        pendingOperations: 0,
        lastSyncTime: Date.now(),
        hasConflicts: false,
      },
      pendingConflicts: [], // Empty array should not cause errors
      lastSyncResult: null,
    });

    expect(() => {
      render(<SyncNotifications />);
    }).not.toThrow();
  });

  it('should handle undefined conflicts without errors', () => {
    const { useSync } = require('@/hooks/useSync');
    
    useSync.mockReturnValue({
      status: {
        isOnline: true,
        isSyncing: false,
        pendingOperations: 0,
        lastSyncTime: Date.now(),
        hasConflicts: false,
      },
      pendingConflicts: undefined, // undefined should not cause errors
      lastSyncResult: null,
    });

    expect(() => {
      render(<SyncNotifications />);
    }).not.toThrow();
  });

  it('should handle sync results without errors', () => {
    const { useSync } = require('@/hooks/useSync');
    
    useSync.mockReturnValue({
      status: {
        isOnline: true,
        isSyncing: false,
        pendingOperations: 0,
        lastSyncTime: Date.now(),
        hasConflicts: false,
      },
      pendingConflicts: [],
      lastSyncResult: {
        success: true,
        operationsProcessed: 5,
        error: null,
      },
    });

    expect(() => {
      render(<SyncNotifications />);
    }).not.toThrow();
  });
});