/**
 * Service Worker for Push Notifications
 * 
 * Handles push notifications, background sync, and notification interactions.
 */

const CACHE_NAME = 'fitness-app-v1';
const NOTIFICATION_CACHE = 'notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      image: data.image,
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      tag: data.tag || 'default',
      timestamp: Date.now()
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Fitness App', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Fitness App', {
        body: 'Tienes una nueva notificación',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png'
      })
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // Send message to main app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Send message to all open clients
      clients.forEach((client) => {
        client.postMessage({
          type: 'notification_clicked',
          data: {
            notificationId: data.notificationId,
            userId: data.userId,
            type: data.type,
            action: action,
            data: data.data,
            timestamp: Date.now()
          }
        });
      });
      
      // Handle specific actions
      if (action) {
        return handleNotificationAction(action, data);
      } else {
        // Default action - open app
        return openApp();
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  const data = event.notification.data || {};
  
  // Send message to main app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'notification_dismissed',
          data: {
            notificationId: data.notificationId,
            userId: data.userId,
            type: data.type,
            timestamp: Date.now()
          }
        });
      });
    })
  );
});

// Handle notification actions
async function handleNotificationAction(action, data) {
  console.log('Handling notification action:', action, data);
  
  switch (action) {
    case 'start_workout':
      return openApp('/workout');
    
    case 'view_progress':
      return openApp('/progress');
    
    case 'view_achievements':
      return openApp('/progress?tab=achievements');
    
    case 'snooze_1h':
      // Schedule a new notification for 1 hour later
      return scheduleSnoozeNotification(data);
    
    case 'accept_friend':
      return openApp('/social?action=accept_friend&id=' + data.friendId);
    
    case 'decline_friend':
      return openApp('/social?action=decline_friend&id=' + data.friendId);
    
    case 'congratulate':
      return openApp('/social?action=congratulate&id=' + data.friendId);
    
    default:
      return openApp();
  }
}

// Open the app with optional path
async function openApp(path = '/') {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  // Check if app is already open
  for (const client of clients) {
    if (client.url.includes(self.location.origin)) {
      // Focus existing window and navigate if needed
      if (path !== '/') {
        client.postMessage({
          type: 'navigate',
          path: path
        });
      }
      return client.focus();
    }
  }
  
  // Open new window
  return self.clients.openWindow(self.location.origin + path);
}

// Schedule a snooze notification
async function scheduleSnoozeNotification(originalData) {
  // This would typically involve sending a message to the main app
  // to schedule the notification through the notification service
  const clients = await self.clients.matchAll({ type: 'window' });
  
  clients.forEach((client) => {
    client.postMessage({
      type: 'schedule_snooze',
      data: {
        originalData: originalData,
        snoozeTime: Date.now() + (60 * 60 * 1000) // 1 hour
      }
    });
  });
}

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncPendingNotifications());
  }
});

// Sync pending notifications when back online
async function syncPendingNotifications() {
  try {
    // This would sync with the server to get pending notifications
    console.log('Syncing pending notifications...');
    
    // Send message to main app to handle sync
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => {
      client.postMessage({
        type: 'sync_notifications'
      });
    });
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'show_notification':
      self.registration.showNotification(data.title, data.options);
      break;
    
    case 'clear_notifications':
      clearAllNotifications();
      break;
    
    case 'schedule_notification':
      scheduleNotification(data);
      break;
  }
});

// Clear all notifications
async function clearAllNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(notification => notification.close());
    console.log(`Cleared ${notifications.length} notifications`);
  } catch (error) {
    console.error('Failed to clear notifications:', error);
  }
}

// Schedule a notification (simplified version)
function scheduleNotification(data) {
  const delay = data.scheduledTime - Date.now();
  
  if (delay > 0) {
    setTimeout(() => {
      self.registration.showNotification(data.title, data.options);
    }, delay);
  }
}

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip chrome-extension and other non-web requests
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.startsWith('moz-extension://')) {
    return;
  }

  event.respondWith(handleFetchWithStrategy(event.request));
});

/**
 * Handle fetch with intelligent caching strategy
 */
async function handleFetchWithStrategy(request) {
  const url = new URL(request.url);
  const strategy = getCachingStrategy(url);
  
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request);
      case 'stale-while-revalidate':
        return await staleWhileRevalidate(request);
      case 'network-only':
        return await fetch(request);
      case 'cache-only':
        return await caches.match(request) || new Response('Not found', { status: 404 });
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Fetch strategy failed:', error);
    return await handleFetchError(request, error);
  }
}

/**
 * Determine caching strategy based on URL
 */
function getCachingStrategy(url) {
  const pathname = url.pathname;
  const origin = url.origin;
  
  // Static assets - cache first
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return 'cache-first';
  }
  
  // API calls - network first with fallback
  if (pathname.startsWith('/api/')) {
    return 'network-first';
  }
  
  // Exercise data and static content - stale while revalidate
  if (pathname.includes('/exercises') || pathname.includes('/static')) {
    return 'stale-while-revalidate';
  }
  
  // HTML pages - network first
  if (pathname.endsWith('/') || pathname.endsWith('.html') || !pathname.includes('.')) {
    return 'network-first';
  }
  
  // External resources - network only
  if (origin !== self.location.origin) {
    return 'network-only';
  }
  
  // Default strategy
  return 'network-first';
}

/**
 * Cache-first strategy
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background if resource is old
    const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
    const isOld = Date.now() - cacheDate.getTime() > 24 * 60 * 60 * 1000; // 24 hours
    
    if (isOld) {
      // Background update
      fetch(request).then(response => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
      }).catch(() => {
        // Ignore background update errors
      });
    }
    
    return cachedResponse;
  }
  
  // Not in cache, fetch and cache
  const response = await fetch(request);
  
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add offline indicator header
      const offlineResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...Object.fromEntries(cachedResponse.headers.entries()),
          'X-Served-From': 'cache',
          'X-Cache-Date': cachedResponse.headers.get('date') || new Date().toISOString()
        }
      });
      
      return offlineResponse;
    }
    
    throw error;
  }
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Always try to update in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {
    // Ignore background update errors
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // No cached version, wait for network
  return await fetchPromise;
}

/**
 * Handle fetch errors with intelligent fallbacks
 */
async function handleFetchError(request, error) {
  const url = new URL(request.url);
  
  // Try to serve from cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For HTML requests, serve offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For API requests, return structured error
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'This request will be retried when connection is restored',
      offline: true,
      timestamp: Date.now()
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Error': 'true'
      }
    });
  }
  
  // Default error response
  return new Response('Network error occurred', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

/**
 * Periodic cache cleanup
 */
async function performCacheCleanup() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, NOTIFICATION_CACHE];
    
    // Delete old caches
    const deletePromises = cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => caches.delete(cacheName));
    
    await Promise.all(deletePromises);
    
    // Clean up current cache if too large
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    if (requests.length > 500) { // Max 500 cached items
      // Remove oldest 100 items
      const toDelete = requests.slice(0, 100);
      await Promise.all(toDelete.map(request => cache.delete(request)));
      
      console.log(`[ServiceWorker] Cleaned up ${toDelete.length} old cache entries`);
    }
    
  } catch (error) {
    console.error('[ServiceWorker] Cache cleanup failed:', error);
  }
}

// Perform cache cleanup every hour
setInterval(performCacheCleanup, 60 * 60 * 1000);