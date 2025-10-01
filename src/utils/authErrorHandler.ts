/**
 * Authentication Error Handler
 * Provides comprehensive error handling for authentication operations
 */

import type { AuthError, AuthErrorContext, AuthRecoveryOptions, AuthRecoveryAction } from '@/types/authErrors';
import { AuthErrorCode } from '@/types/authErrors';
import { offlineManager, networkErrorHandler } from '@/utils/offlineUtils';
import { errorTracker } from '@/utils/monitoring/errorTracking';
import { logger } from '@/utils';

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private retryAttempts: Map<string, number> = new Map();
  private lastAttemptTime: Map<string, number> = new Map();
  private rateLimitResetTime: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication error with intelligent recovery
   */
  handleAuthError(
    error: Error, 
    context: AuthErrorContext,
    onGuestFallback?: () => void,
    onRetry?: () => Promise<void>
  ): AuthRecoveryOptions {
    const authError = this.classifyError(error, context);
    
    // Track error for monitoring
    errorTracker.captureError(authError, {
      additionalData: {
        authContext: context,
        errorCode: authError.code,
        canRetry: authError.canRetry
      }
    });

    // Log error details
    logger.error('Authentication error occurred', {
      code: authError.code,
      message: authError.message,
      context,
      canRetry: authError.canRetry
    });

    // Update retry tracking
    this.updateRetryTracking(context);

    // Generate recovery options
    const recoveryOptions = this.generateRecoveryOptions(authError, context, onGuestFallback, onRetry);

    return recoveryOptions;
  }

  /**
   * Classify error and convert to AuthError
   */
  private classifyError(error: Error, context: AuthErrorContext): AuthError {
    const message = error.message.toLowerCase();
    let code: AuthErrorCode;
    let userMessage: string;
    let canRetry = false;
    let retryAfter: number | undefined;
    let fallbackToGuest = false;

    // Network-related errors
    if (this.isNetworkError(error)) {
      code = AuthErrorCode.NETWORK_ERROR;
      userMessage = 'Connection problem. Please check your internet connection and try again.';
      canRetry = true;
      fallbackToGuest = true;
    }
    // Timeout errors
    else if (message.includes('timeout') || message.includes('aborted')) {
      code = AuthErrorCode.CONNECTION_TIMEOUT;
      userMessage = 'Request timed out. Please try again.';
      canRetry = true;
      fallbackToGuest = true;
    }
    // Service unavailable
    else if (message.includes('service unavailable') || message.includes('502') || message.includes('503')) {
      code = AuthErrorCode.SERVICE_UNAVAILABLE;
      userMessage = 'Service is temporarily unavailable. Please try again in a few minutes.';
      canRetry = true;
      retryAfter = 300; // 5 minutes
      fallbackToGuest = true;
    }
    // Invalid credentials
    else if (message.includes('invalid') && (message.includes('credentials') || message.includes('password') || message.includes('email'))) {
      code = AuthErrorCode.INVALID_CREDENTIALS;
      userMessage = 'Invalid email or password. Please check your credentials and try again.';
      canRetry = false;
    }
    // User not found
    else if (message.includes('user not found') || message.includes('no user')) {
      code = AuthErrorCode.USER_NOT_FOUND;
      userMessage = 'Account not found. Please check your email or create a new account.';
      canRetry = false;
    }
    // Email not verified
    else if (message.includes('email') && (message.includes('verify') || message.includes('confirm'))) {
      code = AuthErrorCode.EMAIL_NOT_VERIFIED;
      userMessage = 'Please verify your email address before signing in.';
      canRetry = false;
    }
    // Session expired
    else if (message.includes('session') && (message.includes('expired') || message.includes('invalid'))) {
      code = AuthErrorCode.SESSION_EXPIRED;
      userMessage = 'Your session has expired. Please sign in again.';
      canRetry = true;
      fallbackToGuest = true;
    }
    // Token errors
    else if (message.includes('token') && (message.includes('invalid') || message.includes('expired'))) {
      code = AuthErrorCode.TOKEN_INVALID;
      userMessage = 'Authentication token is invalid. Please sign in again.';
      canRetry = true;
      fallbackToGuest = true;
    }
    // Token refresh failed
    else if (message.includes('refresh') && message.includes('failed')) {
      code = AuthErrorCode.TOKEN_REFRESH_FAILED;
      userMessage = 'Unable to refresh your session. Please sign in again.';
      canRetry = true;
      fallbackToGuest = true;
    }
    // Email already exists
    else if (message.includes('email') && (message.includes('exists') || message.includes('taken'))) {
      code = AuthErrorCode.EMAIL_ALREADY_EXISTS;
      userMessage = 'An account with this email already exists. Please sign in instead.';
      canRetry = false;
    }
    // Username taken
    else if (message.includes('username') && (message.includes('taken') || message.includes('exists'))) {
      code = AuthErrorCode.USERNAME_TAKEN;
      userMessage = 'This username is already taken. Please choose a different one.';
      canRetry = false;
    }
    // Weak password
    else if (message.includes('password') && (message.includes('weak') || message.includes('strength'))) {
      code = AuthErrorCode.WEAK_PASSWORD;
      userMessage = 'Password is too weak. Please choose a stronger password.';
      canRetry = false;
    }
    // Rate limiting
    else if (message.includes('rate') || message.includes('too many') || message.includes('limit')) {
      code = AuthErrorCode.TOO_MANY_ATTEMPTS;
      userMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      canRetry = true;
      retryAfter = 300; // 5 minutes
      fallbackToGuest = true;
    }
    // Account disabled
    else if (message.includes('disabled') || message.includes('suspended') || message.includes('banned')) {
      code = AuthErrorCode.ACCOUNT_DISABLED;
      userMessage = 'Your account has been disabled. Please contact support for assistance.';
      canRetry = false;
    }
    // Maintenance mode
    else if (message.includes('maintenance')) {
      code = AuthErrorCode.MAINTENANCE_MODE;
      userMessage = 'Service is under maintenance. Please try again later.';
      canRetry = true;
      retryAfter = 1800; // 30 minutes
      fallbackToGuest = true;
    }
    // Generic server error
    else if (message.includes('server error') || message.includes('500')) {
      code = AuthErrorCode.INTERNAL_ERROR;
      userMessage = 'Server error occurred. Please try again in a few minutes.';
      canRetry = true;
      retryAfter = 180; // 3 minutes
      fallbackToGuest = true;
    }
    // Unknown error
    else {
      code = AuthErrorCode.UNKNOWN_ERROR;
      userMessage = 'An unexpected error occurred. Please try again.';
      canRetry = true;
      fallbackToGuest = true;
    }

    // Create AuthError
    const authError = new Error(error.message) as AuthError;
    authError.name = 'AuthError';
    authError.code = code;
    authError.userMessage = userMessage;
    authError.canRetry = canRetry;
    authError.retryAfter = retryAfter;
    authError.fallbackToGuest = fallbackToGuest;
    authError.context = context;

    return authError;
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const networkKeywords = [
      'network', 'fetch', 'connection', 'offline', 'unreachable',
      'dns', 'resolve', 'connect', 'socket', 'cors'
    ];
    
    return networkKeywords.some(keyword => message.includes(keyword)) ||
           error.name === 'NetworkError' ||
           error.name === 'TypeError' && message.includes('fetch');
  }

  /**
   * Update retry tracking
   */
  private updateRetryTracking(context: AuthErrorContext): void {
    const key = `${context.operation}-${context.email || context.userId || 'anonymous'}`;
    const currentAttempts = this.retryAttempts.get(key) || 0;
    
    this.retryAttempts.set(key, currentAttempts + 1);
    this.lastAttemptTime.set(key, Date.now());
  }

  /**
   * Generate recovery options
   */
  private generateRecoveryOptions(
    authError: AuthError,
    context: AuthErrorContext,
    onGuestFallback?: () => void,
    onRetry?: () => Promise<void>
  ): AuthRecoveryOptions {
    const key = `${context.operation}-${context.email || context.userId || 'anonymous'}`;
    const attemptCount = this.retryAttempts.get(key) || 0;
    const networkStatus = offlineManager.getNetworkStatus();
    
    // Base recovery options
    const recoveryOptions: AuthRecoveryOptions = {
      canRetry: authError.canRetry && attemptCount < 3,
      retryDelay: this.calculateRetryDelay(authError, attemptCount),
      maxRetries: 3,
      fallbackToGuest: authError.fallbackToGuest || false,
      showUserMessage: true,
      requiresUserAction: !authError.canRetry,
      recoveryActions: []
    };

    // Generate recovery actions
    const actions: AuthRecoveryAction[] = [];

    // Retry action
    if (recoveryOptions.canRetry && onRetry) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        description: `Retry ${context.operation} operation`,
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, recoveryOptions.retryDelay));
          await onRetry();
        }
      });
    }

    // Guest mode fallback
    if (recoveryOptions.fallbackToGuest && onGuestFallback) {
      actions.push({
        type: 'guest_mode',
        label: 'Continue as Guest',
        description: 'Use the app without an account (limited features)',
        action: onGuestFallback
      });
    }

    // Offline mode for network errors
    if (authError.code === AuthErrorCode.NETWORK_ERROR && !networkStatus.isOnline) {
      actions.push({
        type: 'offline_mode',
        label: 'Use Offline',
        description: 'Continue with offline features only',
        action: () => {
          if (onGuestFallback) {
            onGuestFallback();
          }
        }
      });
    }

    // Email verification action
    if (authError.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
      actions.push({
        type: 'check_email',
        label: 'Check Email',
        description: 'Open your email to verify your account',
        action: () => {
          // This would typically open the email client or show instructions
          logger.info('User prompted to check email for verification');
        }
      });
    }

    // Contact support for serious issues
    if ([
      AuthErrorCode.ACCOUNT_DISABLED,
      AuthErrorCode.INTERNAL_ERROR,
      AuthErrorCode.UNKNOWN_ERROR
    ].includes(authError.code) && attemptCount > 1) {
      actions.push({
        type: 'contact_support',
        label: 'Contact Support',
        description: 'Get help with your account issue',
        action: () => {
          // This would typically open a support form or email
          logger.info('User prompted to contact support');
        }
      });
    }

    recoveryOptions.recoveryActions = actions;

    return recoveryOptions;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(authError: AuthError, attemptCount: number): number {
    // Use explicit retry delay if provided
    if (authError.retryAfter) {
      return authError.retryAfter * 1000; // Convert to milliseconds
    }

    // Base delays by error type
    const baseDelays: Record<AuthErrorCode, number> = {
      [AuthErrorCode.NETWORK_ERROR]: 2000,
      [AuthErrorCode.CONNECTION_TIMEOUT]: 3000,
      [AuthErrorCode.SERVICE_UNAVAILABLE]: 10000,
      [AuthErrorCode.SESSION_EXPIRED]: 1000,
      [AuthErrorCode.TOKEN_INVALID]: 1000,
      [AuthErrorCode.TOKEN_REFRESH_FAILED]: 2000,
      [AuthErrorCode.TOO_MANY_ATTEMPTS]: 60000, // 1 minute
      [AuthErrorCode.RATE_LIMITED]: 60000,
      [AuthErrorCode.INTERNAL_ERROR]: 5000,
      [AuthErrorCode.MAINTENANCE_MODE]: 300000, // 5 minutes
      [AuthErrorCode.UNKNOWN_ERROR]: 3000,
      // Non-retryable errors get 0 delay
      [AuthErrorCode.INVALID_CREDENTIALS]: 0,
      [AuthErrorCode.USER_NOT_FOUND]: 0,
      [AuthErrorCode.ACCOUNT_DISABLED]: 0,
      [AuthErrorCode.EMAIL_NOT_VERIFIED]: 0,
      [AuthErrorCode.PASSWORD_EXPIRED]: 0,
      [AuthErrorCode.EMAIL_ALREADY_EXISTS]: 0,
      [AuthErrorCode.USERNAME_TAKEN]: 0,
      [AuthErrorCode.WEAK_PASSWORD]: 0,
      [AuthErrorCode.INVALID_EMAIL]: 0,
      [AuthErrorCode.SESSION_CONFLICT]: 0
    };

    const baseDelay = baseDelays[authError.code] || 3000;
    
    if (baseDelay === 0) {
      return 0; // No retry for non-retryable errors
    }

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount);
    const maxDelay = 60000; // 1 minute max
    const delay = Math.min(exponentialDelay, maxDelay);
    
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    
    return Math.max(delay + jitter, 1000); // Minimum 1 second
  }

  /**
   * Check if operation is rate limited
   */
  isRateLimited(operation: string, email?: string): boolean {
    const key = `${operation}-${email || 'anonymous'}`;
    const resetTime = this.rateLimitResetTime.get(key);
    
    if (resetTime && Date.now() < resetTime) {
      return true;
    }
    
    return false;
  }

  /**
   * Set rate limit for operation
   */
  setRateLimit(operation: string, email: string | undefined, durationMs: number): void {
    const key = `${operation}-${email || 'anonymous'}`;
    this.rateLimitResetTime.set(key, Date.now() + durationMs);
  }

  /**
   * Reset retry tracking for operation
   */
  resetRetryTracking(operation: string, email?: string): void {
    const key = `${operation}-${email || 'anonymous'}`;
    this.retryAttempts.delete(key);
    this.lastAttemptTime.delete(key);
    this.rateLimitResetTime.delete(key);
  }

  /**
   * Get retry statistics
   */
  getRetryStats(): Record<string, { attempts: number; lastAttempt: number; rateLimited: boolean }> {
    const stats: Record<string, { attempts: number; lastAttempt: number; rateLimited: boolean }> = {};
    
    this.retryAttempts.forEach((attempts, key) => {
      const lastAttempt = this.lastAttemptTime.get(key) || 0;
      const rateLimitReset = this.rateLimitResetTime.get(key) || 0;
      const rateLimited = Date.now() < rateLimitReset;
      
      stats[key] = {
        attempts,
        lastAttempt,
        rateLimited
      };
    });
    
    return stats;
  }

  /**
   * Clear all tracking data
   */
  clearAllTracking(): void {
    this.retryAttempts.clear();
    this.lastAttemptTime.clear();
    this.rateLimitResetTime.clear();
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();