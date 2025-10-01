/**
 * Database Error Classes
 * 
 * Custom error classes for database operations with proper error handling.
 */

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly operation: string;
  public readonly storeName?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    operation: string,
    storeName?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.operation = operation;
    this.storeName = storeName;
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

export class EntityNotFoundError extends DatabaseError {
  constructor(entityType: string, id: string) {
    super(
      `${entityType} with id '${id}' not found`,
      'ENTITY_NOT_FOUND',
      'get',
      entityType.toLowerCase()
    );
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends DatabaseError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 'validate');
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class DuplicateKeyError extends DatabaseError {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, value: any, storeName: string) {
    super(
      `Duplicate value '${value}' for field '${field}' in ${storeName}`,
      'DUPLICATE_KEY',
      'create',
      storeName
    );
    this.name = 'DuplicateKeyError';
    this.field = field;
    this.value = value;
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(dbName: string, originalError?: Error) {
    super(
      `Failed to connect to database '${dbName}'`,
      'CONNECTION_ERROR',
      'connect',
      undefined,
      originalError
    );
    this.name = 'DatabaseConnectionError';
  }
}

export class TransactionError extends DatabaseError {
  public readonly transactionStores: string[];

  constructor(message: string, stores: string[], originalError?: Error) {
    super(message, 'TRANSACTION_ERROR', 'transaction', undefined, originalError);
    this.name = 'TransactionError';
    this.transactionStores = stores;
  }
}

export class QuotaExceededError extends DatabaseError {
  constructor(storeName?: string) {
    super(
      'Storage quota exceeded',
      'QUOTA_EXCEEDED',
      'write',
      storeName
    );
    this.name = 'QuotaExceededError';
  }
}

export class CorruptedDataError extends DatabaseError {
  public readonly entityId?: string;

  constructor(message: string, storeName: string, entityId?: string) {
    super(message, 'CORRUPTED_DATA', 'read', storeName);
    this.name = 'CorruptedDataError';
    this.entityId = entityId;
  }
}

/**
 * Error handler utility functions
 */
export class DatabaseErrorHandler {
  /**
   * Convert IndexedDB errors to custom database errors
   */
  static handleIndexedDBError(
    error: Error | DOMException,
    operation: string,
    storeName?: string
  ): DatabaseError {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'QuotaExceededError':
          return new QuotaExceededError(storeName);
        case 'NotFoundError':
          return new DatabaseError(
            'Database or store not found',
            'NOT_FOUND',
            operation,
            storeName,
            error
          );
        case 'ConstraintError':
          return new DatabaseError(
            'Database constraint violation',
            'CONSTRAINT_ERROR',
            operation,
            storeName,
            error
          );
        case 'DataError':
          return new CorruptedDataError(
            'Invalid data provided',
            storeName || 'unknown'
          );
        case 'TransactionInactiveError':
          return new TransactionError(
            'Transaction is no longer active',
            storeName ? [storeName] : [],
            error
          );
        case 'ReadOnlyError':
          return new DatabaseError(
            'Attempted to write to read-only transaction',
            'READ_ONLY',
            operation,
            storeName,
            error
          );
        case 'VersionError':
          return new DatabaseError(
            'Database version mismatch',
            'VERSION_ERROR',
            operation,
            storeName,
            error
          );
        default:
          return new DatabaseError(
            error.message || 'Unknown IndexedDB error',
            'UNKNOWN_IDB_ERROR',
            operation,
            storeName,
            error
          );
      }
    }

    return new DatabaseError(
      error.message || 'Unknown database error',
      'UNKNOWN_ERROR',
      operation,
      storeName,
      error
    );
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: DatabaseError): boolean {
    const recoverableCodes = [
      'CONNECTION_ERROR',
      'TRANSACTION_ERROR',
      'READ_ONLY',
      'TransactionInactiveError'
    ];
    return recoverableCodes.includes(error.code);
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: DatabaseError): string {
    switch (error.code) {
      case 'ENTITY_NOT_FOUND':
        return 'The requested item could not be found.';
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'DUPLICATE_KEY':
        return 'This item already exists.';
      case 'CONNECTION_ERROR':
        return 'Unable to connect to the database. Please try again.';
      case 'QUOTA_EXCEEDED':
        return 'Storage is full. Please free up some space.';
      case 'CORRUPTED_DATA':
        return 'Data appears to be corrupted. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: DatabaseError): void {
    const logData = {
      name: error.name,
      code: error.code,
      operation: error.operation,
      storeName: error.storeName,
      message: error.message,
      stack: error.stack,
      originalError: error.originalError?.message,
      timestamp: new Date().toISOString(),
    };

    // Log based on severity
    switch (error.code) {
      case 'CORRUPTED_DATA':
      case 'CONNECTION_ERROR':
        console.error('Critical database error:', logData);
        break;
      case 'QUOTA_EXCEEDED':
      case 'DUPLICATE_KEY':
        console.warn('Database warning:', logData);
        break;
      default:
        console.error('Database error:', logData);
    }
  }
}

/**
 * Retry utility for database operations
 */
export class DatabaseRetry {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-recoverable errors
        if (error instanceof DatabaseError && !DatabaseErrorHandler.isRecoverable(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }

    throw lastError!;
  }
}