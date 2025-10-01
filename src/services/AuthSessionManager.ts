/**
 * Authentication Session Manager
 * Handles session recovery, offline authentication, and graceful degradation
 */

import { supabaseAuthService } from '@/services/supabaseAuthService';
import { authErrorHandler } from '@/utils/authErrorHandler';
import { offlineManager } from '@/utils/offlineUtils';
import { errorTracker } from '@/utils/monitoring/errorTracking';
import { storage, logger } from '@/utils';
import type { User } from '@/schemas/user';
import type { AuthErrorContext, SessionRecoveryState } from '@/types/authErrors';

export interface SessionManagerConfig {
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryInterval: number; // milliseconds
  offlineGracePeriod: number; // milliseconds
  tokenRefreshThreshold: number; // milliseconds before expiry
}

export interface SessionState {
  isValid: boolean;
  isRecovering: boolean;
  lastValidation: Date | null;
  expiresAt: Date | null;
  recoveryState: SessionRecoveryState;
  offlineMode: boolean;
  degradationLevel: 'none' | 'limited' | 'guest' | 'offline';
}

export class AuthSessionManager {
  private static instance: AuthSessionManager;
  private config: SessionManagerConfig;
  private sessionState: SessionState;
  private recoveryTimer?: NodeJS.Timeout;
  private validationTimer?: NodeJS.Timeout;
  private listeners: Set<(state: SessionState) => void> = new Set();

  private constructor(config?: Partial<SessionManagerConfig>) {
    this.config = {
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      recoveryInterval: 30000, // 30 seconds
      offlineGracePeriod: 300000, // 5 minutes
      tokenRefreshThreshold: 300000, // 5 minutes
      ...config
    };

    this.sessionState = {
      isValid: false,
      isRecovering: false,
      lastValidation: null,
      expiresAt: null,
      recoveryState: {
        isRecovering: false,
        lastAttempt: null,
        attemptCount: 0,
        recoveryMethod: null,
        canRecover: true
      },
      offlineMode: false,
      degradationLevel: 'none'
    };

    this.initializeSessionManager();
  }

  public static getInstance(config?: Partial<SessionManagerConfig>): AuthSessionManager {
    if (!AuthSessionManager.instance) {
      AuthSessionManager.instance = new AuthSessionManager(config);
    }
    return AuthSessionManager.instance;
  }

  /**
   * Initialize session manager
   */
  private initializeSessionManager(): void {
    // Listen for network status changes
    offlineManager.addOfflineListener(this.handleOfflineStatusChange.bind(this));
    
    // Start periodic session validation
    this.startSessionValidation();
    
    // Initialize session state
    this.validateCurrentSession();

    logger.info('Auth session manager initialized', { config: this.config });
  }

  /**
   * Validate current session
   */
  async validateCurrentSession(): Promise<boolean> {
    try {
      const user = supabaseAuthService.getCurrentUser();
      const isAuthenticated = await supabaseAuthService.isAuthenticated();
      
      if (!user) {
        this.updateSessionState({
          isValid: false,
          degradationLevel: 'offline',
          lastValidation: new Date()
        });
        return false;
      }

      if (user.role === 'guest') {
        // Guest users are always valid in offline mode
        this.updateSessionState({
          isValid: true,
          degradationLevel: 'guest',
          offlineMode: true,
          lastValidation: new Date()
        });
        return true;
      }

      if (!isAuthenticated) {
        // Try to recover session
        const recovered = await this.attemptSessionRecovery();
        if (!recovered) {
          this.handleSessionFailure('session_invalid');
        }
        return recovered;
      }

      // Check token expiry
      const tokenExpiry = this.getTokenExpiry();
      if (tokenExpiry && this.shouldRefreshToken(tokenExpiry)) {
        const refreshed = await this.refreshTokenIfNeeded();
        if (!refreshed) {
          this.handleSessionFailure('token_refresh_failed');
          return false;
        }
      }

      this.updateSessionState({
        isValid: true,
        degradationLevel: 'none',
        offlineMode: false,
        expiresAt: tokenExpiry,
        lastValidation: new Date()
      });

      return true;

    } catch (error) {
      logger.error('Session validation failed', error);
      this.handleSessionFailure('validation_error');
      return false;
    }
  }

  /**
   * Attempt session recovery
   */
  private async attemptSessionRecovery(): Promise<boolean> {
    if (!this.sessionState.recoveryState.canRecover) {
      return false;
    }

    const recoveryState = this.sessionState.recoveryState;
    
    // Check if we've exceeded max attempts
    if (recoveryState.attemptCount >= this.config.maxRecoveryAttempts) {
      logger.warn('Max session recovery attempts reached');
      this.updateRecoveryState({
        canRecover: false,
        recoveryMethod: 'guest_fallback'
      });
      this.fallbackToGuestMode();
      return false;
    }

    this.updateRecoveryState({
      isRecovering: true,
      lastAttempt: new Date(),
      attemptCount: recoveryState.attemptCount + 1
    });

    try {
      // Try token refresh first
      if (this.hasRefreshToken()) {
        this.updateRecoveryState({ recoveryMethod: 'token_refresh' });
        
        try {
          await supabaseAuthService.refreshToken();
          logger.info('Session recovered via token refresh');
          
          this.updateRecoveryState({
            isRecovering: false,
            attemptCount: 0,
            recoveryMethod: null
          });
          
          return true;
        } catch (refreshError) {
          logger.warn('Token refresh failed during recovery', refreshError);
        }
      }

      // If token refresh failed, try re-authentication with stored credentials
      const storedCredentials = this.getStoredCredentials();
      if (storedCredentials) {
        this.updateRecoveryState({ recoveryMethod: 'reauth' });
        
        try {
          await supabaseAuthService.login(storedCredentials);
          logger.info('Session recovered via re-authentication');
          
          this.updateRecoveryState({
            isRecovering: false,
            attemptCount: 0,
            recoveryMethod: null
          });
          
          return true;
        } catch (authError) {
          logger.warn('Re-authentication failed during recovery', authError);
        }
      }

      // If all recovery methods failed, fallback to guest mode
      this.updateRecoveryState({ recoveryMethod: 'guest_fallback' });
      this.fallbackToGuestMode();
      
      return false;

    } catch (error) {
      logger.error('Session recovery failed', error);
      
      this.updateRecoveryState({
        isRecovering: false,
        recoveryMethod: null
      });
      
      return false;
    }
  }

  /**
   * Handle session failure
   */
  private handleSessionFailure(reason: string): void {
    const context: AuthErrorContext = {
      operation: 'initialize',
      timestamp: new Date(),
      networkStatus: offlineManager.isOffline() ? 'offline' : 'online'
    };

    const error = new Error(`Session failure: ${reason}`);
    
    const recoveryOptions = authErrorHandler.handleAuthError(
      error,
      context,
      () => this.fallbackToGuestMode(),
      () => this.attemptSessionRecovery()
    );

    // If auto-recovery is enabled and we can retry
    if (this.config.enableAutoRecovery && recoveryOptions.canRetry) {
      this.scheduleRecoveryAttempt();
    } else if (recoveryOptions.fallbackToGuest) {
      this.fallbackToGuestMode();
    }
  }

  /**
   * Fallback to guest mode
   */
  private fallbackToGuestMode(): void {
    try {
      const guestUser = supabaseAuthService.createGuestUser();
      
      this.updateSessionState({
        isValid: true,
        degradationLevel: 'guest',
        offlineMode: true,
        isRecovering: false
      });

      this.updateRecoveryState({
        isRecovering: false,
        recoveryMethod: 'guest_fallback'
      });

      logger.info('Fallback to guest mode successful', { userId: guestUser.id });
      
      // Notify listeners about guest mode
      this.notifyListeners();

    } catch (error) {
      logger.error('Failed to fallback to guest mode', error);
      
      this.updateSessionState({
        isValid: false,
        degradationLevel: 'offline',
        isRecovering: false
      });
    }
  }

  /**
   * Handle offline status change
   */
  private handleOfflineStatusChange(isOffline: boolean): void {
    if (isOffline) {
      // Going offline - enable offline mode
      this.updateSessionState({
        offlineMode: true,
        degradationLevel: this.sessionState.degradationLevel === 'none' ? 'limited' : this.sessionState.degradationLevel
      });
      
      logger.info('Switched to offline mode');
    } else {
      // Coming back online - attempt session validation
      this.updateSessionState({ offlineMode: false });
      
      logger.info('Back online - validating session');
      
      // Validate session after a short delay
      setTimeout(() => {
        this.validateCurrentSession();
      }, 2000);
    }
  }

  /**
   * Refresh token if needed
   */
  private async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      await supabaseAuthService.refreshToken();
      logger.info('Token refreshed successfully');
      return true;
    } catch (error) {
      logger.error('Token refresh failed', error);
      return false;
    }
  }

  /**
   * Check if token should be refreshed
   */
  private shouldRefreshToken(expiresAt: Date): boolean {
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    return timeUntilExpiry <= this.config.tokenRefreshThreshold;
  }

  /**
   * Get token expiry from storage
   */
  private getTokenExpiry(): Date | null {
    try {
      const expiresAt = storage.get<number>('sport-tracker-token-expires');
      return expiresAt ? new Date(expiresAt) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if refresh token exists
   */
  private hasRefreshToken(): boolean {
    return !!storage.get<string>('sport-tracker-refresh-token');
  }

  /**
   * Get stored credentials (if available and user opted in)
   */
  private getStoredCredentials(): { email: string; password: string } | null {
    // Note: In a real app, you should never store passwords in plain text
    // This is just for demonstration - use secure credential storage
    try {
      const credentials = storage.get<{ email: string; password: string }>('sport-tracker-stored-credentials');
      return credentials || null;
    } catch {
      return null;
    }
  }

  /**
   * Schedule recovery attempt
   */
  private scheduleRecoveryAttempt(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }

    this.recoveryTimer = setTimeout(() => {
      this.attemptSessionRecovery();
    }, this.config.recoveryInterval);
  }

  /**
   * Start periodic session validation
   */
  private startSessionValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    // Validate session every 5 minutes
    this.validationTimer = setInterval(() => {
      if (!this.sessionState.isRecovering) {
        this.validateCurrentSession();
      }
    }, 300000);
  }

  /**
   * Update session state
   */
  private updateSessionState(updates: Partial<SessionState>): void {
    this.sessionState = {
      ...this.sessionState,
      ...updates
    };
    
    this.notifyListeners();
  }

  /**
   * Update recovery state
   */
  private updateRecoveryState(updates: Partial<SessionRecoveryState>): void {
    this.sessionState.recoveryState = {
      ...this.sessionState.recoveryState,
      ...updates
    };
    
    this.updateSessionState({ recoveryState: this.sessionState.recoveryState });
  }

  /**
   * Add session state listener
   */
  addListener(listener: (state: SessionState) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove session state listener
   */
  removeListener(listener: (state: SessionState) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.sessionState);
      } catch (error) {
        logger.error('Session state listener error', error);
      }
    });
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    return { ...this.sessionState };
  }

  /**
   * Force session recovery
   */
  async forceRecovery(): Promise<boolean> {
    // Reset recovery state
    this.updateRecoveryState({
      attemptCount: 0,
      canRecover: true,
      isRecovering: false
    });

    return await this.attemptSessionRecovery();
  }

  /**
   * Clear session and reset to offline mode
   */
  clearSession(): void {
    // Clear stored auth data
    supabaseAuthService.logout();
    
    // Reset session state
    this.updateSessionState({
      isValid: false,
      isRecovering: false,
      lastValidation: null,
      expiresAt: null,
      offlineMode: true,
      degradationLevel: 'offline'
    });

    // Reset recovery state
    this.updateRecoveryState({
      isRecovering: false,
      lastAttempt: null,
      attemptCount: 0,
      recoveryMethod: null,
      canRecover: true
    });

    logger.info('Session cleared');
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
    
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    offlineManager.removeOfflineListener(this.handleOfflineStatusChange.bind(this));
    this.listeners.clear();

    logger.info('Auth session manager destroyed');
  }
}

// Export singleton instance
export const authSessionManager = AuthSessionManager.getInstance();