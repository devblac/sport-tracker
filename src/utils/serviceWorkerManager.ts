/**
 * Service Worker Manager
 * Handles registration, updates, and communication with the service worker
 */

export interface ServiceWorkerManager {
  register(): Promise<ServiceWorkerRegistration | null>;
  unregister(): Promise<boolean>;
  update(): Promise<void>;
  skipWaiting(): Promise<void>;
  clearCache(): Promise<void>;
  getVersion(): Promise<string>;
  registerSync(tag: string): Promise<void>;
  isSupported(): boolean;
  isOnline(): boolean;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private onlineStatus = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      this.notifyOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
      this.notifyOnlineStatusChange(false);
    });
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    try {
      console.log('Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

      // Check for existing updates
      if (this.registration.waiting) {
        this.updateAvailable = true;
        this.notifyUpdateAvailable();
      }

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Check for and install updates
   */
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      await this.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    try {
      // Send skip waiting message
      await this.sendMessage({ type: 'SKIP_WAITING' });
      console.log('Service Worker skip waiting requested');
    } catch (error) {
      console.error('Skip waiting failed:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    try {
      const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
      if (response.success) {
        console.log('All caches cleared successfully');
      }
    } catch (error) {
      console.error('Clear cache failed:', error);
      throw error;
    }
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string> {
    try {
      const response = await this.sendMessage({ type: 'GET_VERSION' });
      return response.version || 'unknown';
    } catch (error) {
      console.error('Get version failed:', error);
      return 'unknown';
    }
  }

  /**
   * Register background sync
   */
  async registerSync(tag: string): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      if ('sync' in this.registration) {
        await this.registration.sync.register(tag);
        console.log('Background sync registered:', tag);
      } else {
        console.warn('Background sync not supported');
        // Fallback: send message to service worker
        await this.sendMessage({ 
          type: 'FORCE_SYNC', 
          payload: { tag } 
        });
      }
    } catch (error) {
      console.error('Background sync registration failed:', error);
      throw error;
    }
  }

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Check if browser is online
   */
  isOnline(): boolean {
    return this.onlineStatus;
  }

  /**
   * Send message to service worker
   */
  private async sendMessage(message: any): Promise<any> {
    if (!navigator.serviceWorker.controller) {
      throw new Error('No service worker controller available');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      messageChannel.port1.onerror = (error) => {
        reject(error);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Notify about update availability
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }

  /**
   * Notify about online status change
   */
  private notifyOnlineStatusChange(isOnline: boolean): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('sw-online-status-change', {
      detail: { isOnline }
    }));
  }
}

// Singleton instance
export const serviceWorkerManager: ServiceWorkerManager = new ServiceWorkerManagerImpl();

// Background sync tags (should match service worker)
export const SYNC_TAGS = {
  WORKOUT_SYNC: 'workout-sync',
  EXERCISE_SYNC: 'exercise-sync',
  PROFILE_SYNC: 'profile-sync',
  OFFLINE_ACTIONS: 'offline-actions'
} as const;

// Helper functions for common operations
export const swHelpers = {
  /**
   * Initialize service worker on app start
   */
  async initialize(): Promise<void> {
    if (import.meta.env.PROD) {
      await serviceWorkerManager.register();
    } else {
      console.log('Service Worker disabled in development mode');
    }
  },

  /**
   * Handle app update
   */
  async handleUpdate(): Promise<void> {
    await serviceWorkerManager.skipWaiting();
  },

  /**
   * Sync workout data
   */
  async syncWorkouts(): Promise<void> {
    await serviceWorkerManager.registerSync(SYNC_TAGS.WORKOUT_SYNC);
  },

  /**
   * Sync exercise data
   */
  async syncExercises(): Promise<void> {
    await serviceWorkerManager.registerSync(SYNC_TAGS.EXERCISE_SYNC);
  },

  /**
   * Sync profile data
   */
  async syncProfile(): Promise<void> {
    await serviceWorkerManager.registerSync(SYNC_TAGS.PROFILE_SYNC);
  },

  /**
   * Sync all offline actions
   */
  async syncOfflineActions(): Promise<void> {
    await serviceWorkerManager.registerSync(SYNC_TAGS.OFFLINE_ACTIONS);
  },

  /**
   * Check if app is running offline
   */
  isOffline(): boolean {
    return !serviceWorkerManager.isOnline();
  },

  /**
   * Get app version
   */
  async getAppVersion(): Promise<string> {
    return await serviceWorkerManager.getVersion();
  }
};

// Types for event listeners
export interface ServiceWorkerEvents {
  'sw-update-available': CustomEvent<{ registration: ServiceWorkerRegistration }>;
  'sw-online-status-change': CustomEvent<{ isOnline: boolean }>;
}

// Extend Window interface for TypeScript
declare global {
  interface WindowEventMap extends ServiceWorkerEvents {}
}