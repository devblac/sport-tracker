/**
 * Database reset utility for troubleshooting IndexedDB issues
 */

import { logger } from './logger';

const DB_NAME = 'SportTrackerDB';

/**
 * Delete the entire database and clear all related localStorage
 */
export async function resetDatabase(): Promise<void> {
  try {
    logger.info('Starting database reset...');

    // Clear localStorage flags
    const keysToRemove = [
      'sport-tracker-db-initialized',
      'sport-tracker-db-version',
      'sport-tracker-fallback-mode',
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Delete IndexedDB database
    if ('indexedDB' in window) {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        
        const timeoutId = setTimeout(() => {
          logger.warn('Database deletion timed out');
          resolve(); // Don't reject, just continue
        }, 5000);

        deleteRequest.onsuccess = () => {
          clearTimeout(timeoutId);
          logger.info('Database deleted successfully');
          resolve();
        };

        deleteRequest.onerror = () => {
          clearTimeout(timeoutId);
          logger.error('Failed to delete database', deleteRequest.error);
          resolve(); // Don't reject, just continue
        };

        deleteRequest.onblocked = () => {
          logger.warn('Database deletion blocked - other tabs may be open');
          // Don't reject, just continue after timeout
        };
      });
    }

    logger.info('Database reset completed');
  } catch (error) {
    logger.error('Database reset failed', error);
    throw error;
  }
}

/**
 * Check if database reset is needed (based on error patterns)
 */
export function shouldResetDatabase(error: Error): boolean {
  const resetTriggers = [
    'IndexedDB initialization timed out',
    'object stores was not found',
    'database is corrupted',
    'upgrade blocked',
    'version change transaction',
  ];

  return resetTriggers.some(trigger => 
    error.message.toLowerCase().includes(trigger.toLowerCase())
  );
}

/**
 * Get database info for debugging
 */
export async function getDatabaseInfo(): Promise<{
  exists: boolean;
  version?: number;
  stores?: string[];
  error?: string;
}> {
  try {
    if (!('indexedDB' in window)) {
      return { exists: false, error: 'IndexedDB not supported' };
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME);
      
      const timeoutId = setTimeout(() => {
        resolve({ exists: false, error: 'Timeout checking database' });
      }, 3000);

      request.onsuccess = () => {
        clearTimeout(timeoutId);
        const db = request.result;
        const info = {
          exists: true,
          version: db.version,
          stores: Array.from(db.objectStoreNames),
        };
        db.close();
        resolve(info);
      };

      request.onerror = () => {
        clearTimeout(timeoutId);
        resolve({ 
          exists: false, 
          error: request.error?.message || 'Unknown error' 
        });
      };

      request.onblocked = () => {
        clearTimeout(timeoutId);
        resolve({ 
          exists: true, 
          error: 'Database blocked by other tabs' 
        });
      };
    });
  } catch (error) {
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Force close all database connections (for debugging)
 */
export function forceCloseConnections(): void {
  try {
    // This is a hack to force close connections
    // by creating and immediately closing a connection
    const request = indexedDB.open(DB_NAME);
    request.onsuccess = () => {
      request.result.close();
    };
  } catch (error) {
    logger.warn('Failed to force close connections', error);
  }
}