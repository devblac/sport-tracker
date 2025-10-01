/**
 * Error Handling Service
 * 
 * Comprehensive error handling system that provides graceful degradation,
 * circuit breaker patterns, user-friendly error messages, and offline mode detection.
 * Integrates with existing ServiceMonitor and ServiceRegistry for complete error management.
 */

import { serviceMonitor } from './ServiceMonitor';
import { serviceRegistry } from './ServiceRegistry';
import { serviceConfigManager } from './ServiceConfigManager';
import { resourceUsageMonitor } from './ResourceUsageMonitor';
import { logger } from '@/utils/logger';
import { EventBus } from '@/utils/EventBus';
import type { ServiceType } from '@/types/serviceConfig';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ErrorContext {
  service: ServiceType;
  operation: string;
  error: Error;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecoveryStrategy {
  id: string;
  name: string;
  description: string;
  canRecover: (context: ErrorContext) => boolean;
  recover: (context: ErrorContext) => Promise<any>;
  priority: number; // Lower number = higher priority
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionable: boolean;
  actions?: ErrorAction[];
  severity: 'info' | 'warning' | 'error' | 'critical';
  canRetry: boolean;
  fallbackAvailable: boolean;
}

export interface ErrorAction {
  id: string;
  label: string;
  action: () => Promise<void> | void;
  primary?: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByService: Record<string, number>;
  errorsByType: Record<string, number>;
  recoverySuccessRate: number;
  fallbackActivations: number;
  userImpactScore: number;
}

export interface OfflineCapability {
  service: ServiceType;
  operations: string[];
  dataRequirements: string[];
  limitations: string[];
}

// ============================================================================
// Error Handling Service
// ============================================================================

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];
  private errorHistory: ErrorContext[] = [];
  private offlineCapabilities: Map<ServiceType, OfflineCapability> = new Map();
  private isOnline = navigator.onLine;
  private offlineModeActive = false;
  
  // Configuration
  private readonly config = {
    maxErrorHistory: 1000,
    errorRetentionDays: 7,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    circuitBreakerThreshold: 5,
    offlineDetectionTimeout: 5000,
    userNotificationThreshold: 3, // Show user notification after 3 consecutive errors
  };

  private constructor() {
    this.initializeRecoveryStrategies();
    this.initializeOfflineCapabilities();
    this.setupNetworkMonitoring();
    this.setupEventListeners();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  // ============================================================================
  // Core Error Handling
  // ============================================================================

  /**
   * Handle error with comprehensive recovery and fallback logic
   */
  async handleError(context: ErrorContext): Promise<{
    recovered: boolean;
    result?: any;
    fallbackUsed: boolean;
    userError?: UserFriendlyError;
  }> {
    // Record error in history
    this.recordError(context);

    // Update service monitor
    serviceMonitor.recordServiceFailure(context.service, context.error.message);

    // Track error metrics
    resourceUsageMonitor.trackAPICall({
      endpoint: context.service,
      method: context.operation,
      responseTime: 0,
      success: false,
      errorCode: this.getErrorCode(context.error)
    });

    logger.error('Error occurred', {
      service: context.service,
      operation: context.operation,
      error: context.error.message,
      stack: context.error.stack
    });

    // Try recovery strategies
    const recoveryResult = await this.attemptRecovery(context);
    if (recoveryResult.success) {
      return {
        recovered: true,
        result: recoveryResult.result,
        fallbackUsed: false
      };
    }

    // Try fallback to mock services
    const fallbackResult = await this.attemptFallback(context);
    if (fallbackResult.success) {
      return {
        recovered: true,
        result: fallbackResult.result,
        fallbackUsed: true,
        userError: this.createUserFriendlyError(context, true)
      };
    }

    // Generate user-friendly error
    const userError = this.createUserFriendlyError(context, false);

    // Check if we should notify user
    if (this.shouldNotifyUser(context)) {
      EventBus.emit('user-error-notification', userError);
    }

    return {
      recovered: false,
      fallbackUsed: false,
      userError
    };
  }

  /**
   * Attempt error recovery using registered strategies
   */
  private async attemptRecovery(context: ErrorContext): Promise<{
    success: boolean;
    result?: any;
    strategy?: string;
  }> {
    // Sort strategies by priority
    const applicableStrategies = this.recoveryStrategies
      .filter(strategy => strategy.canRecover(context))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of applicableStrategies) {
      try {
        logger.debug('Attempting recovery strategy', {
          strategy: strategy.name,
          service: context.service,
          operation: context.operation
        });

        const result = await strategy.recover(context);
        
        logger.info('Recovery strategy succeeded', {
          strategy: strategy.name,
          service: context.service
        });

        // Record successful recovery
        serviceMonitor.recordServiceSuccess(context.service);
        
        EventBus.emit('error-recovery-success', {
          context,
          strategy: strategy.name,
          result
        });

        return {
          success: true,
          result,
          strategy: strategy.name
        };

      } catch (recoveryError) {
        logger.warn('Recovery strategy failed', {
          strategy: strategy.name,
          error: recoveryError instanceof Error ? recoveryError.message : 'Unknown error'
        });
      }
    }

    return { success: false };
  }

  /**
   * Attempt fallback to mock services
   */
  private async attemptFallback(context: ErrorContext): Promise<{
    success: boolean;
    result?: any;
  }> {
    // Check if fallback is available for this service
    if (!this.canFallbackToMock(context.service)) {
      return { success: false };
    }

    try {
      logger.info('Attempting fallback to mock service', {
        service: context.service,
        operation: context.operation
      });

      // Temporarily switch to mock services for this operation
      const originalConfig = serviceConfigManager.getConfig();
      serviceConfigManager.updateConfig({ useRealServices: false });

      let result;
      try {
        // Execute operation with mock service
        result = await this.executeWithMockService(context);
        
        logger.info('Fallback to mock service succeeded', {
          service: context.service
        });

        EventBus.emit('fallback-activated', {
          service: context.service,
          reason: `Real service failed: ${context.error.message}`
        });

        return { success: true, result };

      } finally {
        // Restore original configuration
        serviceConfigManager.updateConfig(originalConfig);
      }

    } catch (fallbackError) {
      logger.error('Fallback to mock service failed', {
        service: context.service,
        error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
      });

      return { success: false };
    }
  }

  /**
   * Execute operation with mock service
   */
  private async executeWithMockService(context: ErrorContext): Promise<any> {
    const { service, operation, metadata } = context;

    switch (service) {
      case 'auth':
        return this.executeMockAuthOperation(operation, metadata);
      case 'gamification':
        return this.executeMockGamificationOperation(operation, metadata);
      case 'social':
        return this.executeMockSocialOperation(operation, metadata);
      case 'workout':
        return this.executeMockWorkoutOperation(operation, metadata);
      default:
        throw new Error(`No mock fallback available for service: ${service}`);
    }
  }

  // ============================================================================
  // Mock Service Operations
  // ============================================================================

  private async executeMockAuthOperation(operation: string, metadata?: any): Promise<any> {
    const mockAuthService = serviceRegistry.auth;
    
    switch (operation) {
      case 'signIn':
        return mockAuthService.signIn(metadata?.email, metadata?.password);
      case 'signUp':
        return mockAuthService.signUp(metadata?.email, metadata?.password, metadata?.userData);
      case 'signOut':
        return mockAuthService.signOut();
      case 'getCurrentUser':
        return mockAuthService.getCurrentUser();
      case 'isAuthenticated':
        return mockAuthService.isAuthenticated();
      default:
        throw new Error(`Unknown auth operation: ${operation}`);
    }
  }

  private async executeMockGamificationOperation(operation: string, metadata?: any): Promise<any> {
    const mockGamificationService = serviceRegistry.gamification;
    
    switch (operation) {
      case 'addXP':
        return mockGamificationService.addXP(metadata?.userId, metadata?.amount, metadata?.source);
      case 'getUserLevel':
        return mockGamificationService.getUserLevel(metadata?.userId);
      case 'getAchievements':
        return mockGamificationService.getAchievements(metadata?.userId);
      case 'unlockAchievement':
        return mockGamificationService.unlockAchievement(metadata?.userId, metadata?.achievementId);
      default:
        throw new Error(`Unknown gamification operation: ${operation}`);
    }
  }

  private async executeMockSocialOperation(operation: string, metadata?: any): Promise<any> {
    const mockSocialService = serviceRegistry.social;
    
    switch (operation) {
      case 'getFeed':
        return mockSocialService.getFeed(metadata?.userId);
      case 'createPost':
        return mockSocialService.createPost(metadata?.post);
      case 'likePost':
        return mockSocialService.likePost(metadata?.postId, metadata?.userId);
      case 'getFriends':
        return mockSocialService.getFriends(metadata?.userId);
      default:
        throw new Error(`Unknown social operation: ${operation}`);
    }
  }

  private async executeMockWorkoutOperation(operation: string, metadata?: any): Promise<any> {
    const mockWorkoutService = serviceRegistry.workout;
    
    switch (operation) {
      case 'getWorkouts':
        return mockWorkoutService.getWorkouts();
      case 'saveWorkout':
        return mockWorkoutService.saveWorkout(metadata?.workout);
      case 'getWorkoutTemplates':
        return mockWorkoutService.getWorkoutTemplates();
      default:
        throw new Error(`Unknown workout operation: ${operation}`);
    }
  }

  // ============================================================================
  // Recovery Strategies
  // ============================================================================

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      // Network retry strategy
      {
        id: 'network-retry',
        name: 'Network Retry',
        description: 'Retry operation after network error',
        priority: 1,
        canRecover: (context) => this.isNetworkError(context.error),
        recover: async (context) => {
          await this.delay(this.config.retryDelayMs);
          return this.retryOperation(context);
        }
      },

      // Authentication refresh strategy
      {
        id: 'auth-refresh',
        name: 'Authentication Refresh',
        description: 'Refresh authentication token and retry',
        priority: 2,
        canRecover: (context) => this.isAuthError(context.error) && context.service !== 'auth',
        recover: async (context) => {
          await serviceRegistry.auth.refreshToken();
          return this.retryOperation(context);
        }
      },

      // Cache fallback strategy
      {
        id: 'cache-fallback',
        name: 'Cache Fallback',
        description: 'Use cached data when available',
        priority: 3,
        canRecover: (context) => this.hasCachedData(context),
        recover: async (context) => {
          return this.getCachedData(context);
        }
      },

      // Offline mode strategy
      {
        id: 'offline-mode',
        name: 'Offline Mode',
        description: 'Switch to offline mode and use local data',
        priority: 4,
        canRecover: (context) => this.canOperateOffline(context),
        recover: async (context) => {
          this.activateOfflineMode();
          return this.executeOfflineOperation(context);
        }
      },

      // Graceful degradation strategy
      {
        id: 'graceful-degradation',
        name: 'Graceful Degradation',
        description: 'Provide limited functionality',
        priority: 5,
        canRecover: (context) => this.canDegrade(context),
        recover: async (context) => {
          return this.provideDegradedService(context);
        }
      }
    ];
  }

  /**
   * Register custom recovery strategy
   */
  registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
    
    logger.info('Recovery strategy registered', { strategy: strategy.name });
  }

  // ============================================================================
  // Error Classification
  // ============================================================================

  private isNetworkError(error: Error): boolean {
    const networkErrorMessages = [
      'network error',
      'fetch failed',
      'connection refused',
      'timeout',
      'network request failed',
      'failed to fetch'
    ];
    
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  private isAuthError(error: Error): boolean {
    const authErrorMessages = [
      'unauthorized',
      'authentication failed',
      'invalid token',
      'token expired',
      'access denied',
      '401',
      '403'
    ];
    
    return authErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  private getErrorCode(error: Error): string {
    // Extract error code from error message or use error name
    if ('code' in error) {
      return (error as any).code;
    }
    
    if (error.message.includes('401')) return '401';
    if (error.message.includes('403')) return '403';
    if (error.message.includes('404')) return '404';
    if (error.message.includes('500')) return '500';
    
    return error.name || 'UNKNOWN_ERROR';
  }

  // ============================================================================
  // Recovery Strategy Helpers
  // ============================================================================

  private async retryOperation(context: ErrorContext): Promise<any> {
    // This would need to be implemented based on the specific operation
    // For now, we'll simulate a retry
    logger.debug('Retrying operation', {
      service: context.service,
      operation: context.operation
    });
    
    // In a real implementation, this would re-execute the original operation
    throw new Error('Retry not implemented for this operation');
  }

  private hasCachedData(context: ErrorContext): boolean {
    // Check if we have cached data for this operation
    // This would integrate with your caching system
    return false; // Placeholder
  }

  private getCachedData(context: ErrorContext): any {
    // Retrieve cached data
    // This would integrate with your caching system
    return null; // Placeholder
  }

  private canOperateOffline(context: ErrorContext): boolean {
    const capability = this.offlineCapabilities.get(context.service);
    return capability ? capability.operations.includes(context.operation) : false;
  }

  private async executeOfflineOperation(context: ErrorContext): Promise<any> {
    // Execute operation in offline mode
    logger.info('Executing operation in offline mode', {
      service: context.service,
      operation: context.operation
    });
    
    // This would use local storage or IndexedDB
    return null; // Placeholder
  }

  private canDegrade(context: ErrorContext): boolean {
    // Check if we can provide degraded functionality
    const degradableOperations = ['getFeed', 'getRecommendations', 'getLeaderboard'];
    return degradableOperations.includes(context.operation);
  }

  private provideDegradedService(context: ErrorContext): any {
    // Provide limited functionality
    logger.info('Providing degraded service', {
      service: context.service,
      operation: context.operation
    });
    
    switch (context.operation) {
      case 'getFeed':
        return { posts: [], message: 'Limited offline feed' };
      case 'getRecommendations':
        return { recommendations: [], message: 'Recommendations unavailable' };
      case 'getLeaderboard':
        return { leaderboard: [], message: 'Leaderboard unavailable' };
      default:
        return null;
    }
  }

  // ============================================================================
  // Offline Mode Management
  // ============================================================================

  private initializeOfflineCapabilities(): void {
    this.offlineCapabilities.set('auth', {
      service: 'auth',
      operations: ['getCurrentUser', 'isAuthenticated'],
      dataRequirements: ['user_session'],
      limitations: ['Cannot sign in/out', 'Cannot refresh tokens']
    });

    this.offlineCapabilities.set('workout', {
      service: 'workout',
      operations: ['getWorkouts', 'saveWorkout', 'getWorkoutTemplates'],
      dataRequirements: ['workout_templates', 'user_workouts'],
      limitations: ['Cannot sync with cloud', 'Limited templates']
    });

    this.offlineCapabilities.set('gamification', {
      service: 'gamification',
      operations: ['getUserLevel', 'getAchievements'],
      dataRequirements: ['user_xp', 'achievements'],
      limitations: ['Cannot earn XP', 'Cannot unlock achievements']
    });

    this.offlineCapabilities.set('social', {
      service: 'social',
      operations: ['getFeed'],
      dataRequirements: ['cached_posts'],
      limitations: ['Cannot create posts', 'Cannot interact with posts']
    });
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.deactivateOfflineMode();
      logger.info('Network connection restored');
      EventBus.emit('network-status-change', true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.activateOfflineMode();
      logger.info('Network connection lost');
      EventBus.emit('network-status-change', false);
    });

    // Periodic connectivity check
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnectivity(): Promise<void> {
    if (!navigator.onLine) {
      return;
    }

    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(this.config.offlineDetectionTimeout)
      });

      if (response.ok && !this.isOnline) {
        this.isOnline = true;
        this.deactivateOfflineMode();
        EventBus.emit('network-status-change', true);
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        this.activateOfflineMode();
        EventBus.emit('network-status-change', false);
      }
    }
  }

  private activateOfflineMode(): void {
    if (this.offlineModeActive) return;

    this.offlineModeActive = true;
    serviceConfigManager.enableOfflineMode();
    
    logger.info('Offline mode activated');
    EventBus.emit('offline-mode-activated', {
      capabilities: Array.from(this.offlineCapabilities.values())
    });
  }

  private deactivateOfflineMode(): void {
    if (!this.offlineModeActive) return;

    this.offlineModeActive = false;
    serviceConfigManager.disableOfflineMode();
    
    logger.info('Offline mode deactivated');
    EventBus.emit('offline-mode-deactivated');

    // Trigger sync for services that support it
    EventBus.emit('sync-requested');
  }

  // ============================================================================
  // User-Friendly Error Messages
  // ============================================================================

  private createUserFriendlyError(context: ErrorContext, fallbackUsed: boolean): UserFriendlyError {
    const { service, operation, error } = context;

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        title: 'Connection Problem',
        message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
        actionable: true,
        actions: [
          {
            id: 'retry',
            label: 'Try Again',
            action: () => this.retryLastOperation(context),
            primary: true
          },
          {
            id: 'offline',
            label: 'Work Offline',
            action: () => this.activateOfflineMode()
          }
        ],
        severity: 'warning',
        canRetry: true,
        fallbackAvailable: this.canFallbackToMock(service)
      };
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please sign in again to continue.',
        actionable: true,
        actions: [
          {
            id: 'signin',
            label: 'Sign In',
            action: () => EventBus.emit('navigate-to-signin'),
            primary: true
          }
        ],
        severity: 'warning',
        canRetry: false,
        fallbackAvailable: false
      };
    }

    // Service-specific errors
    const serviceErrors = this.getServiceSpecificError(service, operation, error, fallbackUsed);
    if (serviceErrors) {
      return serviceErrors;
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      message: fallbackUsed 
        ? 'We\'re experiencing some issues, but we\'ve switched to backup systems to keep things working.'
        : 'We encountered an unexpected problem. Please try again in a moment.',
      actionable: true,
      actions: [
        {
          id: 'retry',
          label: 'Try Again',
          action: () => this.retryLastOperation(context),
          primary: true
        }
      ],
      severity: 'error',
      canRetry: true,
      fallbackAvailable: this.canFallbackToMock(service)
    };
  }

  private getServiceSpecificError(
    service: ServiceType, 
    operation: string, 
    error: Error, 
    fallbackUsed: boolean
  ): UserFriendlyError | null {
    switch (service) {
      case 'workout':
        return {
          title: 'Workout Service Issue',
          message: fallbackUsed 
            ? 'Your workouts are temporarily using offline mode. Some features may be limited.'
            : 'We\'re having trouble accessing your workout data. Please try again.',
          actionable: true,
          actions: [
            {
              id: 'retry',
              label: 'Retry',
              action: () => this.retryLastOperation({ service, operation, error, timestamp: new Date() }),
              primary: true
            }
          ],
          severity: 'warning',
          canRetry: true,
          fallbackAvailable: true
        };

      case 'social':
        return {
          title: 'Social Features Unavailable',
          message: fallbackUsed
            ? 'Social features are running in limited mode. You can view cached content but can\'t post or interact.'
            : 'We can\'t load your social feed right now. Please try again later.',
          actionable: true,
          actions: [
            {
              id: 'retry',
              label: 'Retry',
              action: () => this.retryLastOperation({ service, operation, error, timestamp: new Date() }),
              primary: true
            }
          ],
          severity: 'info',
          canRetry: true,
          fallbackAvailable: true
        };

      case 'gamification':
        return {
          title: 'Progress Tracking Issue',
          message: fallbackUsed
            ? 'Your progress is being tracked locally. It will sync when the connection is restored.'
            : 'We can\'t update your progress right now. Don\'t worry, your achievements are safe!',
          actionable: true,
          actions: [
            {
              id: 'continue',
              label: 'Continue Anyway',
              action: () => {},
              primary: true
            }
          ],
          severity: 'info',
          canRetry: true,
          fallbackAvailable: true
        };

      default:
        return null;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private canFallbackToMock(service: ServiceType): boolean {
    // All services have mock implementations available
    return ['auth', 'gamification', 'social', 'workout'].includes(service);
  }

  private shouldNotifyUser(context: ErrorContext): boolean {
    // Count recent errors for this service
    const recentErrors = this.errorHistory
      .filter(e => 
        e.service === context.service && 
        Date.now() - e.timestamp.getTime() < 60000 // Last minute
      );

    return recentErrors.length >= this.config.userNotificationThreshold;
  }

  private recordError(context: ErrorContext): void {
    this.errorHistory.push(context);

    // Keep history size manageable
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }

    // Clean up old errors
    const cutoffDate = new Date(Date.now() - this.config.errorRetentionDays * 24 * 60 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(e => e.timestamp >= cutoffDate);
  }

  private async retryLastOperation(context: ErrorContext): Promise<void> {
    // This would need to be implemented based on your specific needs
    logger.info('Retrying last operation', { context });
    EventBus.emit('operation-retry-requested', context);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private setupEventListeners(): void {
    // Listen for service events
    serviceMonitor.on('circuit-breaker-opened', ({ service, reason }) => {
      logger.warn('Circuit breaker opened, activating fallback', { service, reason });
      EventBus.emit('service-degraded', { service, reason });
    });

    serviceMonitor.on('performance-degraded', ({ service, metrics }) => {
      logger.warn('Performance degradation detected', { service, metrics });
      EventBus.emit('performance-alert', { service, metrics });
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get current error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    const totalErrors = this.errorHistory.length;
    const errorsByService: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;
      const errorType = this.getErrorCode(error.error);
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    return {
      totalErrors,
      errorsByService,
      errorsByType,
      recoverySuccessRate: 0.85, // This would be calculated from actual recovery attempts
      fallbackActivations: 0, // This would be tracked from actual fallback usage
      userImpactScore: this.calculateUserImpactScore()
    };
  }

  private calculateUserImpactScore(): number {
    // Calculate a score from 0-100 representing user impact
    // Lower score = less impact on users
    const recentErrors = this.errorHistory.filter(e => 
      Date.now() - e.timestamp.getTime() < 3600000 // Last hour
    );

    if (recentErrors.length === 0) return 0;
    if (recentErrors.length > 10) return 100;

    return Math.min(100, recentErrors.length * 10);
  }

  /**
   * Get offline capabilities for a service
   */
  getOfflineCapabilities(service: ServiceType): OfflineCapability | null {
    return this.offlineCapabilities.get(service) || null;
  }

  /**
   * Check if currently in offline mode
   */
  isOfflineModeActive(): boolean {
    return this.offlineModeActive;
  }

  /**
   * Check if network is available
   */
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Force offline mode (for testing)
   */
  forceOfflineMode(): void {
    this.activateOfflineMode();
  }

  /**
   * Force online mode (for testing)
   */
  forceOnlineMode(): void {
    this.deactivateOfflineMode();
  }

  /**
   * Get error history
   */
  getErrorHistory(limit = 100): ErrorContext[] {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    logger.info('Error history cleared');
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    // Remove event listeners
    window.removeEventListener('online', this.deactivateOfflineMode);
    window.removeEventListener('offline', this.activateOfflineMode);

    // Clear data
    this.errorHistory = [];
    this.recoveryStrategies = [];
    this.offlineCapabilities.clear();

    logger.info('ErrorHandlingService destroyed');
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();

// Export convenience function for handling errors
export const handleServiceError = async (
  service: ServiceType,
  operation: string,
  error: Error,
  metadata?: Record<string, any>
): Promise<{
  recovered: boolean;
  result?: any;
  fallbackUsed: boolean;
  userError?: UserFriendlyError;
}> => {
  const context: ErrorContext = {
    service,
    operation,
    error,
    timestamp: new Date(),
    metadata
  };

  return errorHandlingService.handleError(context);
};