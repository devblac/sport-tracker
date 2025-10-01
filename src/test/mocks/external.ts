/**
 * External Library Mocks
 * Mocks for third-party libraries and APIs
 */

import { vi } from 'vitest';

// Supabase mock
export const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  then: vi.fn().mockResolvedValue({ data: [], error: null }),
};

// DOMPurify mock
export const mockDOMPurify = {
  sanitize: vi.fn((input: string) => input.replace(/<script.*?>.*?<\/script>/gi, '')),
  addHook: vi.fn(),
  removeHook: vi.fn(),
  isValidAttribute: vi.fn().mockReturnValue(true),
};

// Framer Motion mock
export const mockFramerMotion = {
  motion: {
    div: vi.fn(({ children, ...props }) => children),
    span: vi.fn(({ children, ...props }) => children),
    button: vi.fn(({ children, ...props }) => children),
  },
  AnimatePresence: vi.fn(({ children }) => children),
  useAnimation: vi.fn().mockReturnValue({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
};

// Chart.js mock
export const mockChartJS = {
  Chart: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
  })),
  registerables: [],
};

// React Router mock
export const mockReactRouter = {
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useLocation: vi.fn().mockReturnValue({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
    React.createElement('a', { href: to }, children),
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => 
    React.createElement('a', { href: to, className: 'active' }, children),
};

// Capacitor mock
export const mockCapacitor = {
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web'),
  },
  StatusBar: {
    setBackgroundColor: vi.fn(),
    setStyle: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
  },
  SplashScreen: {
    hide: vi.fn(),
    show: vi.fn(),
  },
  Storage: {
    get: vi.fn().mockResolvedValue({ value: null }),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue({ keys: [] }),
  },
};

// PostHog mock
export const mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  isFeatureEnabled: vi.fn().mockReturnValue(false),
  getFeatureFlag: vi.fn().mockReturnValue(false),
  onFeatureFlags: vi.fn(),
};

// IndexedDB mock
export const mockIndexedDB = {
  open: vi.fn().mockImplementation(() => {
    const request = {
      result: {
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            add: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            clear: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
          }),
        }),
        close: vi.fn(),
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    };
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess({ target: request });
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(),
};

// Service Worker mock
export const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: { postMessage: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    update: vi.fn(),
    unregister: vi.fn(),
  }),
  ready: Promise.resolve({
    active: { postMessage: vi.fn() },
    installing: null,
    waiting: null,
  }),
};

// Web APIs mock
export const mockWebAPIs = {
  // Notification API
  Notification: vi.fn().mockImplementation((title, options) => ({
    title,
    ...options,
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  
  // Geolocation API
  geolocation: {
    getCurrentPosition: vi.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }),
    watchPosition: vi.fn().mockReturnValue(1),
    clearWatch: vi.fn(),
  },
  
  // Battery API
  getBattery: vi.fn().mockResolvedValue({
    charging: true,
    chargingTime: Infinity,
    dischargingTime: Infinity,
    level: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
  
  // Network Information API
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

// Setup global mocks
export const setupGlobalMocks = () => {
  // Mock IndexedDB
  global.indexedDB = mockIndexedDB as any;
  
  // Mock Service Worker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    writable: true,
  });
  
  // Mock Notification
  global.Notification = mockWebAPIs.Notification as any;
  Object.defineProperty(Notification, 'permission', {
    value: 'granted',
    writable: true,
  });
  Object.defineProperty(Notification, 'requestPermission', {
    value: vi.fn().mockResolvedValue('granted'),
    writable: true,
  });
  
  // Mock Geolocation
  Object.defineProperty(navigator, 'geolocation', {
    value: mockWebAPIs.geolocation,
    writable: true,
  });
  
  // Mock Battery API
  Object.defineProperty(navigator, 'getBattery', {
    value: mockWebAPIs.getBattery,
    writable: true,
  });
  
  // Mock Network Information
  Object.defineProperty(navigator, 'connection', {
    value: mockWebAPIs.connection,
    writable: true,
  });
  
  // Mock Web Share API
  Object.defineProperty(navigator, 'share', {
    value: vi.fn().mockResolvedValue(undefined),
    writable: true,
  });
  
  // Mock Clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
    writable: true,
  });
};