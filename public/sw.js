// Advanced Service Worker for Sport Tracker PWA
// Version 1.0.0

const CACHE_NAME = 'sport-tracker-v1';
const STATIC_CACHE = 'sport-tracker-static-v1';
const DYNAMIC_CACHE = 'sport-tracker-dynamic-v1';
const API_CACHE = 'sport-tracker-api-v1';
const IMAGE_CACHE = 'sport-tracker-images-v1';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  static: [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/assets/',
    '/src/',
  ],
  
  // API calls - Network First with fallback
  api: [
    '/api/',
  ],
  
  // Images and media - Cache First with network fallback
  images: [
    '/images/',
    '/assets/images/',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
  ],
  
  // Dynamic content - Stale While Revalidate
  dynamic: [
    '/exercises/',
    '/workouts/',
    '/progress/',
    '/profile/',
    '/social/',
  ]
};

// Background sync tags
const SYNC_TAGS = {
  WORKOUT_SYNC: 'workout-sync',
  EXERCISE_SYNC: 'exercise-sync',
  PROFILE_SYNC: 'profile-sync',
  OFFLINE_ACTIONS: 'offline-actions'
};

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/favicon.ico',
        ]);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request, url));
});

// Handle fetch with appropriate strategy
async function handleFetch(request, url) {
  try {
    // Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // API calls - Network First
    if (isApiCall(url.pathname)) {
      return await networkFirst(request, API_CACHE);
    }
    
    // Images - Cache First
    if (isImage(url.pathname)) {
      return await cacheFirst(request, IMAGE_CACHE);
    }
    
    // Dynamic content - Stale While Revalidate
    if (isDynamicContent(url.pathname)) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE);
    }
    
    // Default - Network First
    return await networkFirst(request, DYNAMIC_CACHE);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await getOfflineFallback(request);
  }
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, no cache available');
    throw error;
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to update cache in background
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cache
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  return await networkPromise;
}

// Helper functions to determine content type
function isStaticAsset(pathname) {
  return CACHE_STRATEGIES.static.some(pattern => 
    pathname.startsWith(pattern) || pathname.includes(pattern)
  );
}

function isApiCall(pathname) {
  return CACHE_STRATEGIES.api.some(pattern => 
    pathname.startsWith(pattern)
  );
}

function isImage(pathname) {
  return CACHE_STRATEGIES.images.some(pattern => 
    pathname.includes(pattern) || pathname.endsWith(pattern)
  );
}

function isDynamicContent(pathname) {
  return CACHE_STRATEGIES.dynamic.some(pattern => 
    pathname.startsWith(pattern)
  );
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return cached index.html
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const cachedIndex = await cache.match('/index.html');
    if (cachedIndex) {
      return cachedIndex;
    }
  }
  
  // For API requests, return offline indicator
  if (isApiCall(url.pathname)) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'This request failed because you are offline',
        timestamp: Date.now()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // For images, return placeholder
  if (isImage(url.pathname)) {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Offline</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  throw new Error('No offline fallback available');
}

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.WORKOUT_SYNC:
      event.waitUntil(syncWorkouts());
      break;
    case SYNC_TAGS.EXERCISE_SYNC:
      event.waitUntil(syncExercises());
      break;
    case SYNC_TAGS.PROFILE_SYNC:
      event.waitUntil(syncProfile());
      break;
    case SYNC_TAGS.OFFLINE_ACTIONS:
      event.waitUntil(syncOfflineActions());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Sync functions
async function syncWorkouts() {
  try {
    console.log('[SW] Syncing workouts...');
    
    // Get pending workout data from IndexedDB
    const pendingWorkouts = await getPendingData('workouts');
    
    for (const workout of pendingWorkouts) {
      try {
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workout)
        });
        
        if (response.ok) {
          await removePendingData('workouts', workout.id);
          console.log('[SW] Workout synced:', workout.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync workout:', workout.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Workout sync failed:', error);
  }
}

async function syncExercises() {
  try {
    console.log('[SW] Syncing exercises...');
    // Similar implementation for exercises
  } catch (error) {
    console.error('[SW] Exercise sync failed:', error);
  }
}

async function syncProfile() {
  try {
    console.log('[SW] Syncing profile...');
    // Similar implementation for profile
  } catch (error) {
    console.error('[SW] Profile sync failed:', error);
  }
}

async function syncOfflineActions() {
  try {
    console.log('[SW] Syncing offline actions...');
    // Sync any queued offline actions
  } catch (error) {
    console.error('[SW] Offline actions sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingData(storeName) {
  // This would integrate with your IndexedDB implementation
  // For now, return empty array
  return [];
}

async function removePendingData(storeName, id) {
  // This would remove synced data from IndexedDB
  console.log(`[SW] Removing synced data: ${storeName}/${id}`);
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'FORCE_SYNC':
      if (payload.tag) {
        self.registration.sync.register(payload.tag);
      }
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('[SW] All caches cleared');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  console.log('[SW] Performing periodic background sync');
  // Sync all pending data
  await Promise.all([
    syncWorkouts(),
    syncExercises(),
    syncProfile(),
    syncOfflineActions()
  ]);
}

console.log('[SW] Service Worker loaded successfully');