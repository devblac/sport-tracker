import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Import quality infrastructure
import { reliabilityTracker } from './reliability-tracker';
import { testDataPersistence } from './test-data-persistence';

// Extend Vitest's expect with jest-dom matchers and accessibility matchers
expect.extend(matchers);
expect.extend(toHaveNoViolations);

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    NODE_ENV: 'test',
    MODE: 'test'
  },
  writable: true
});

// Mock localStorage with proper implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((_callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
  writable: true,
});

// Mock URL constructor for tests
global.URL = class MockURL {
  public href: string;
  public protocol: string;
  public pathname: string;
  public search: string;
  public searchParams: URLSearchParams;

  constructor(href: string, _base?: string) {
    this.href = href;
    this.protocol = href.split(':')[0] + ':';
    this.pathname = href.split('/').slice(3).join('/') || '/';
    this.search = href.includes('?') ? '?' + href.split('?')[1] : '';
    this.searchParams = new URLSearchParams(this.search);
  }

  toString() {
    return this.href;
  }

  static canParse(_url: string | URL, _base?: string | URL): boolean {
    return true;
  }

  static createObjectURL(_obj: Blob | MediaSource): string {
    return 'mock-object-url';
  }

  static parse(url: string | URL, _base?: string | URL): URL | null {
    try {
      return new MockURL(url.toString()) as any;
    } catch {
      return null;
    }
  }

  static revokeObjectURL(_url: string): void {
    // Mock implementation
  }
} as any;

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substring(2, 11)),
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    language: 'en-US',
    onLine: true,
    serviceWorker: {
      register: vi.fn(() => Promise.resolve()),
      ready: Promise.resolve({
        active: { postMessage: vi.fn() }
      })
    }
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
    React.createElement('a', { href: to }, children),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    role: 'basic',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),
  
  createMockWorkout: (overrides = {}) => ({
    id: 'test-workout-id',
    user_id: 'test-user-id',
    name: 'Test Workout',
    status: 'planned',
    exercises: [],
    started_at: null,
    completed_at: null,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),
  
  createMockExercise: (overrides = {}) => ({
    id: 'test-exercise-id',
    name: 'Test Exercise',
    category: 'strength',
    body_parts: ['chest'],
    muscle_groups: ['pectorals'],
    equipment: 'barbell',
    difficulty_level: 'intermediate',
    instructions: 'Test instructions',
    tips: ['Test tip'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  })
};

// Initialize quality infrastructure for test environment
beforeEach(async () => {
  // Load persisted test data if available (for reliability tracking)
  try {
    const persistedData = await testDataPersistence.loadTestData();
    if (persistedData) {
      reliabilityTracker.importData(persistedData);
    }
  } catch (error) {
    // Ignore errors in test environment - data may not exist yet
  }
});

// Quality infrastructure utilities for tests
global.qualityUtils = {
  // Get current reliability metrics
  getReliabilityMetrics: () => reliabilityTracker.calculateReliability(),
  
  // Add a test run result for reliability tracking
  addTestRun: (testName: string, status: 'pass' | 'fail' | 'skip', duration = 100) => {
    reliabilityTracker.addTestRun({
      testName,
      status,
      duration,
      buildNumber: parseInt(process.env.BUILD_NUMBER || Date.now().toString()),
      timestamp: new Date()
    });
  },
  
  // Clear all quality tracking data
  clearQualityData: () => {
    reliabilityTracker.clearData();
  },
  
  // Simulate flaky test behavior for testing
  simulateFlakyTest: (testName: string, failureRate = 0.1, builds = 20) => {
    for (let i = 0; i < builds; i++) {
      const shouldFail = Math.random() < failureRate;
      reliabilityTracker.addTestRun({
        testName,
        status: shouldFail ? 'fail' : 'pass',
        duration: 100 + Math.random() * 200,
        buildNumber: i + 1,
        timestamp: new Date(Date.now() - (builds - i) * 24 * 60 * 60 * 1000) // Spread over days
      });
    }
  }
};

// Type declarations for global test utilities
declare global {
  var testUtils: {
    createMockUser: (overrides?: any) => any;
    createMockWorkout: (overrides?: any) => any;
    createMockExercise: (overrides?: any) => any;
  };
  
  var qualityUtils: {
    getReliabilityMetrics: () => any;
    addTestRun: (testName: string, status: 'pass' | 'fail' | 'skip', duration?: number) => void;
    clearQualityData: () => void;
    simulateFlakyTest: (testName: string, failureRate?: number, builds?: number) => void;
  };
}