/**
 * Authentication Error Types
 * Defines specific error types for authentication failures
 */

export enum AuthErrorCode {
  // Network/Connection Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',
  
  // Session Errors
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED = 'TOKEN_REFRESH_FAILED',
  SESSION_CONFLICT = 'SESSION_CONFLICT',
  
  // Registration Errors
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  
  // Rate Limiting
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Unknown/Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AuthError extends Error {
  code: AuthErrorCode;
  userMessage: string;
  canRetry: boolean;
  retryAfter?: number; // seconds
  fallbackToGuest?: boolean;
  context?: Record<string, any>;
}

export interface AuthErrorContext {
  operation: 'login' | 'register' | 'logout' | 'refresh' | 'initialize';
  userId?: string;
  email?: string;
  timestamp: Date;
  userAgent?: string;
  networkStatus?: 'online' | 'offline' | 'poor';
  attemptNumber?: number;
}

export interface AuthRecoveryOptions {
  canRetry: boolean;
  retryDelay: number;
  maxRetries: number;
  fallbackToGuest: boolean;
  showUserMessage: boolean;
  requiresUserAction: boolean;
  recoveryActions: AuthRecoveryAction[];
}

export interface AuthRecoveryAction {
  type: 'retry' | 'guest_mode' | 'offline_mode' | 'contact_support' | 'check_email';
  label: string;
  description: string;
  action: () => void | Promise<void>;
}

export interface SessionRecoveryState {
  isRecovering: boolean;
  lastAttempt: Date | null;
  attemptCount: number;
  recoveryMethod: 'token_refresh' | 'reauth' | 'guest_fallback' | null;
  canRecover: boolean;
}