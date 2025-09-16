
// Polyfills for mobile compatibility

// IndexedDB polyfill check
if (typeof window !== 'undefined' && !window.indexedDB) {
  console.warn('IndexedDB not available, using localStorage fallback');
  // Simple localStorage fallback would go here
}

// Console polyfill for older WebViews
if (typeof console === 'undefined') {
  window.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    group: () => {},
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {}
  };
}

// Fetch polyfill check
if (typeof fetch === 'undefined') {
  console.error('Fetch API not available');
}

// Performance API polyfill
if (typeof performance === 'undefined') {
  window.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => []
  };
}

export {};
