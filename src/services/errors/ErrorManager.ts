/**
 * Centralized Error Management
 * Provides consistent error handling across all services
 */

export enum ErrorCode {
  // Cache errors
  CACHE_QUOTA_EXCEEDED = 'CACHE_QUOTA_EXCEEDED',
  CACHE_CORRUPTION = 'CACHE_CORRUPTION',
  CACHE_UNAVAILABLE = 'CACHE_UNAVAILABLE',
  
  // Query errors
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  QUERY_VALIDATION_FAILED = 'QUERY_VALIDATION_FAILED',
  QUERY_BATCH_FAILED = 'QUERY_BATCH_FAILED',
  
  // Service errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CIRCUIT_BREAKER_OPEN = 'CIRCUIT_BREAKER_OPEN',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_DEPENDENCY = 'MISSING_DEPENDENCY'
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, any>,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause: this.cause?.message
    };
  }
}

export class ErrorManager {
  private static errorHandlers = new Map<ErrorCode, (error: AppError) => void>();
  private static errorCounts = new Map<ErrorCode, number>();

  /**
   * Register error handler for specific error codes
   */
  static registerHandler(code: ErrorCode, handler: (error: AppError) => void): void {
    this.errorHandlers.set(code, handler);
  }

  /**
   * Handle error with appropriate strategy
   */
  static handleError(error: Error | AppError): void {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      // Convert generic errors to AppError
      appError = this.convertToAppError(error);
    }

    // Track error frequency
    const count = this.errorCounts.get(appError.code) || 0;
    this.errorCounts.set(appError.code, count + 1);

    // Execute registered handler
    const handler = this.errorHandlers.get(appError.code);
    if (handler) {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // Default logging
    this.logError(appError);
  }

  /**
   * Create error with context
   */
  static createError(
    code: ErrorCode,
    message: string,
    context?: Record<string, any>,
    cause?: Error
  ): AppError {
    return new AppError(code, message, context, cause);
  }

  /**
   * Wrap async operations with error handling
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = new AppError(
        errorCode,
        `Operation failed: ${(error as Error).message}`,
        context,
        error as Error
      );
      this.handleError(appError);
      throw appError;
    }
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Clear error statistics
   */
  static clearStats(): void {
    this.errorCounts.clear();
  }

  private static convertToAppError(error: Error): AppError {
    // Map common errors to appropriate codes
    if (error.message.includes('quota') || error.message.includes('storage')) {
      return new AppError(ErrorCode.CACHE_QUOTA_EXCEEDED, error.message, {}, error);
    }
    
    if (error.message.includes('timeout')) {
      return new AppError(ErrorCode.QUERY_TIMEOUT, error.message, {}, error);
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new AppError(ErrorCode.SERVICE_UNAVAILABLE, error.message, {}, error);
    }

    // Default to service unavailable
    return new AppError(ErrorCode.SERVICE_UNAVAILABLE, error.message, {}, error);
  }

  private static logError(error: AppError): void {
    const logData = {
      code: error.code,
      message: error.message,
      context: error.context,
      count: this.errorCounts.get(error.code),
      timestamp: new Date().toISOString()
    };

    // Use appropriate log level based on error frequency
    const count = this.errorCounts.get(error.code) || 0;
    if (count > 10) {
      console.error('Frequent error detected:', logData);
    } else if (count > 5) {
      console.warn('Recurring error:', logData);
    } else {
      console.info('Error occurred:', logData);
    }
  }
}

// Register default error handlers
ErrorManager.registerHandler(ErrorCode.CACHE_QUOTA_EXCEEDED, () => {
  console.warn('Cache quota exceeded, clearing old entries');
  // Could trigger cache cleanup
});

ErrorManager.registerHandler(ErrorCode.CIRCUIT_BREAKER_OPEN, () => {
  console.warn('Circuit breaker open, using fallback');
  // Could trigger fallback mechanisms
});

ErrorManager.registerHandler(ErrorCode.SERVICE_UNAVAILABLE, () => {
  console.error('Service unavailable, check network connection');
  // Could trigger offline mode
});