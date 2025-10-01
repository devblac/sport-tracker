/**
 * Offline Utilities
 * Comprehensive offline experience management
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface OfflineQueueStats {
  pendingOperations: number;
  failedOperations: number;
  totalSize: number;
  oldestOperation: number;
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private networkListeners: Set<(status: NetworkStatus) => void> = new Set();
  private offlineListeners: Set<(isOffline: boolean) => void> = new Set();
  private currentStatus: NetworkStatus;
  private offlineStartTime: number | null = null;
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private reconnectionTimer?: NodeJS.Timeout;

  private constructor() {
    this.currentStatus = this.getCurrentNetworkStatus();
    this.initializeNetworkMonitoring();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Periodic connectivity check
    this.startPeriodicConnectivityCheck();
  }

  /**
   * Get current network status
   */
  private getCurrentNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[OfflineManager] Connection restored');
    
    const wasOffline = !this.currentStatus.isOnline;
    this.currentStatus = this.getCurrentNetworkStatus();
    
    if (wasOffline) {
      this.offlineStartTime = null;
      this.reconnectionAttempts = 0;
      this.clearReconnectionTimer();
      
      // Notify listeners
      this.notifyOfflineListeners(false);
      this.notifyNetworkListeners(this.currentStatus);
      
      // Trigger sync after reconnection
      this.handleReconnection();
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[OfflineManager] Connection lost');
    
    const wasOnline = this.currentStatus.isOnline;
    this.currentStatus = { ...this.currentStatus, isOnline: false };
    
    if (wasOnline) {
      this.offlineStartTime = Date.now();
      
      // Notify listeners
      this.notifyOfflineListeners(true);
      this.notifyNetworkListeners(this.currentStatus);
      
      // Start reconnection attempts
      this.startReconnectionAttempts();
    }
  }

  /**
   * Handle connection change
   */
  private handleConnectionChange(): void {
    const newStatus = this.getCurrentNetworkStatus();
    const statusChanged = JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus);
    
    if (statusChanged) {
      console.log('[OfflineManager] Connection changed:', newStatus);
      this.currentStatus = newStatus;
      this.notifyNetworkListeners(newStatus);
    }
  }

  /**
   * Start periodic connectivity check
   */
  private startPeriodicConnectivityCheck(): void {
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check actual connectivity (not just navigator.onLine)
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource with cache-busting
      const response = await fetch('/health?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      const isConnected = response.ok;
      
      // Update status if it changed
      if (isConnected !== this.currentStatus.isOnline) {
        if (isConnected) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
      
      return isConnected;
      
    } catch (error) {
      // Connection failed
      if (this.currentStatus.isOnline) {
        this.handleOffline();
      }
      return false;
    }
  }

  /**
   * Start reconnection attempts
   */
  private startReconnectionAttempts(): void {
    if (this.reconnectionTimer) {
      return; // Already attempting
    }

    const attemptReconnection = async () => {
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.log('[OfflineManager] Max reconnection attempts reached');
        return;
      }

      this.reconnectionAttempts++;
      console.log(`[OfflineManager] Reconnection attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts}`);

      const isConnected = await this.checkConnectivity();
      
      if (!isConnected) {
        // Schedule next attempt with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectionAttempts - 1), 30000);
        this.reconnectionTimer = setTimeout(attemptReconnection, delay);
      }
    };

    // Start first attempt after 2 seconds
    this.reconnectionTimer = setTimeout(attemptReconnection, 2000);
  }

  /**
   * Clear reconnection timer
   */
  private clearReconnectionTimer(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }
  }

  /**
   * Handle successful reconnection
   */
  private async handleReconnection(): Promise<void> {
    try {
      // Import sync service dynamically to avoid circular dependencies
      const { syncService } = await import('@/services/SyncService');
      
      // Trigger sync after a short delay to allow UI to update
      setTimeout(() => {
        syncService.getInstance().triggerSync().catch(error => {
          console.error('[OfflineManager] Post-reconnection sync failed:', error);
        });
      }, 1000);
      
    } catch (error) {
      console.error('[OfflineManager] Failed to trigger post-reconnection sync:', error);
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    // Always get fresh status to handle test scenarios
    this.currentStatus = this.getCurrentNetworkStatus();
    return { ...this.currentStatus };
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return !this.currentStatus.isOnline;
  }

  /**
   * Get offline duration in milliseconds
   */
  getOfflineDuration(): number {
    return this.offlineStartTime ? Date.now() - this.offlineStartTime : 0;
  }

  /**
   * Get network quality assessment with enhanced detection
   */
  getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    // Always get fresh status to handle test scenarios
    this.currentStatus = this.getCurrentNetworkStatus();
    
    if (!this.currentStatus.isOnline) {
      return 'offline';
    }

    const { effectiveType, rtt, downlink } = this.currentStatus;

    // Simplified scoring system that's more predictable
    let qualityScore = 0;

    // Effective type scoring - primary factor
    switch (effectiveType) {
      case '4g':
        qualityScore += 50;
        break;
      case '3g':
        qualityScore += 30;
        break;
      case '2g':
        qualityScore += 15;
        break;
      case 'slow-2g':
        qualityScore += 5;
        break;
      default:
        qualityScore += 25; // Unknown, assume moderate
    }

    // RTT penalty (higher RTT reduces score)
    if (rtt > 0) {
      if (rtt < 50) qualityScore += 20;
      else if (rtt < 100) qualityScore += 15;
      else if (rtt < 200) qualityScore += 10;
      else if (rtt < 500) qualityScore += 5;
      else qualityScore -= 10; // Penalty for very high RTT
    } else {
      qualityScore += 15; // Default for no RTT data
    }

    // Downlink bonus (higher downlink increases score)
    if (downlink > 0) {
      if (downlink >= 15) qualityScore += 20;
      else if (downlink >= 10) qualityScore += 15;
      else if (downlink >= 5) qualityScore += 10;
      else if (downlink >= 2) qualityScore += 5;
      else if (downlink >= 1) qualityScore += 2;
      else qualityScore -= 5; // Penalty for very low bandwidth
    } else {
      qualityScore += 10; // Default for no downlink data
    }

    // Convert score to quality rating with clear thresholds
    if (qualityScore >= 85) return 'excellent';  // 4g + good metrics
    if (qualityScore >= 65) return 'good';       // 4g + average metrics or 3g + good metrics
    if (qualityScore >= 40) return 'fair';       // 3g + average metrics or 2g + good metrics
    return 'poor';                               // Everything else
  }

  /**
   * Check if should use data-saving mode with enhanced logic
   */
  shouldSaveData(): boolean {
    // Explicit user preference always takes precedence
    if (this.currentStatus.saveData) {
      return true;
    }

    // Network quality based - only enable for poor connections
    const quality = this.getNetworkQuality();
    if (quality === 'poor' || quality === 'offline') {
      return true;
    }

    // Connection type based - only for very slow connections
    if (this.currentStatus.effectiveType === '2g' || 
        this.currentStatus.effectiveType === 'slow-2g') {
      return true;
    }

    // High RTT or very low bandwidth - more conservative thresholds
    if (this.currentStatus.rtt > 1000 || this.currentStatus.downlink < 0.2) {
      return true;
    }

    // For good connections, don't enable data saving unless explicitly requested
    return false;
  }

  /**
   * Add network status listener
   */
  addNetworkListener(listener: (status: NetworkStatus) => void): void {
    this.networkListeners.add(listener);
  }

  /**
   * Remove network status listener
   */
  removeNetworkListener(listener: (status: NetworkStatus) => void): void {
    this.networkListeners.delete(listener);
  }

  /**
   * Add offline status listener
   */
  addOfflineListener(listener: (isOffline: boolean) => void): void {
    this.offlineListeners.add(listener);
  }

  /**
   * Remove offline status listener
   */
  removeOfflineListener(listener: (isOffline: boolean) => void): void {
    this.offlineListeners.delete(listener);
  }

  /**
   * Notify network listeners
   */
  private notifyNetworkListeners(status: NetworkStatus): void {
    this.networkListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('[OfflineManager] Network listener error:', error);
      }
    });
  }

  /**
   * Notify offline listeners
   */
  private notifyOfflineListeners(isOffline: boolean): void {
    this.offlineListeners.forEach(listener => {
      try {
        listener(isOffline);
      } catch (error) {
        console.error('[OfflineManager] Offline listener error:', error);
      }
    });
  }

  /**
   * Destroy the offline manager
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }

    this.clearReconnectionTimer();
    this.networkListeners.clear();
    this.offlineListeners.clear();
  }
}

/**
 * Network Error Handler
 * Provides intelligent error handling for network-related errors
 */
export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorTime: Map<string, number> = new Map();
  private circuitBreakers: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  /**
   * Handle network error with intelligent retry logic
   */
  handleError(error: Error, context: string): {
    shouldRetry: boolean;
    retryDelay: number;
    isCircuitOpen: boolean;
    errorType: 'network' | 'server' | 'client' | 'unknown';
  } {
    const errorType = this.classifyError(error);
    const errorKey = `${context}-${errorType}`;
    
    // Update error tracking
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);
    this.lastErrorTime.set(errorKey, Date.now());

    // Check circuit breaker
    const isCircuitOpen = this.isCircuitBreakerOpen(errorKey);
    
    // Determine retry strategy
    const shouldRetry = this.shouldRetryError(errorType, currentCount + 1, isCircuitOpen);
    const retryDelay = this.calculateRetryDelay(errorType, currentCount + 1);

    // Open circuit breaker if too many failures
    if (currentCount + 1 >= 5) {
      this.openCircuitBreaker(errorKey);
    }

    console.log(`[NetworkErrorHandler] Error handled:`, {
      error: error.message,
      context,
      errorType,
      shouldRetry,
      retryDelay,
      isCircuitOpen,
      errorCount: currentCount + 1
    });

    return {
      shouldRetry,
      retryDelay,
      isCircuitOpen,
      errorType
    };
  }

  /**
   * Classify error type
   */
  private classifyError(error: Error): 'network' | 'server' | 'client' | 'unknown' {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || 
        message.includes('fetch') || 
        message.includes('connection') ||
        message.includes('timeout') ||
        error.name === 'NetworkError') {
      return 'network';
    }

    // Server errors (5xx)
    if (message.includes('server error') || 
        message.includes('internal server error') ||
        message.includes('service unavailable') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')) {
      return 'server';
    }

    // Client errors (4xx)
    if (message.includes('bad request') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('not found') ||
        message.includes('400') ||
        message.includes('401') ||
        message.includes('403') ||
        message.includes('404')) {
      return 'client';
    }

    return 'unknown';
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetryError(errorType: string, errorCount: number, isCircuitOpen: boolean): boolean {
    if (isCircuitOpen) {
      return false;
    }

    switch (errorType) {
      case 'network':
        return errorCount <= 5; // Retry network errors up to 5 times
      case 'server':
        return errorCount <= 3; // Retry server errors up to 3 times
      case 'client':
        return false; // Don't retry client errors (4xx)
      case 'unknown':
        return errorCount <= 2; // Conservative retry for unknown errors
      default:
        return false;
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(errorType: string, errorCount: number): number {
    const baseDelays = {
      network: 2000,  // 2 seconds for network errors
      server: 5000,   // 5 seconds for server errors
      client: 0,      // No retry for client errors
      unknown: 3000   // 3 seconds for unknown errors
    };

    const baseDelay = baseDelays[errorType as keyof typeof baseDelays] || 3000;
    
    // Return 0 immediately for client errors (no retry)
    if (errorType === 'client' || baseDelay === 0) {
      return 0;
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, errorCount - 1);
    const maxDelay = 60000; // 1 minute max
    const delay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    
    return Math.max(delay + jitter, 1000); // Minimum 1 second
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(errorKey: string): boolean {
    const isOpen = this.circuitBreakers.get(errorKey) || false;
    
    if (isOpen) {
      const lastError = this.lastErrorTime.get(errorKey) || 0;
      const timeSinceLastError = Date.now() - lastError;
      
      // Reset circuit breaker after 5 minutes
      if (timeSinceLastError > 300000) {
        this.circuitBreakers.set(errorKey, false);
        this.errorCounts.set(errorKey, 0);
        return false;
      }
    }
    
    return isOpen;
  }

  /**
   * Open circuit breaker
   */
  private openCircuitBreaker(errorKey: string): void {
    this.circuitBreakers.set(errorKey, true);
    console.warn(`[NetworkErrorHandler] Circuit breaker opened for: ${errorKey}`);
  }

  /**
   * Reset error tracking for a context
   */
  resetErrorTracking(context: string): void {
    const keysToReset = Array.from(this.errorCounts.keys()).filter(key => key.startsWith(context));
    
    keysToReset.forEach(key => {
      this.errorCounts.delete(key);
      this.lastErrorTime.delete(key);
      this.circuitBreakers.delete(key);
    });
    
    console.log(`[NetworkErrorHandler] Error tracking reset for context: ${context}`);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, { count: number; lastError: number; circuitOpen: boolean }> {
    const stats: Record<string, { count: number; lastError: number; circuitOpen: boolean }> = {};
    
    this.errorCounts.forEach((count, key) => {
      stats[key] = {
        count,
        lastError: this.lastErrorTime.get(key) || 0,
        circuitOpen: this.circuitBreakers.get(key) || false
      };
    });
    
    return stats;
  }
}

// Export singleton instances
export const offlineManager = OfflineManager.getInstance();
export const networkErrorHandler = NetworkErrorHandler.getInstance();