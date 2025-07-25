import type { Exercise, ExerciseFilter } from '@/schemas/exercise';
import { logger } from '@/utils';

/**
 * IndexedDB configuration
 */
const DB_NAME = 'SportTrackerDB';
const DB_VERSION = 2;

/**
 * Object store names
 */
export const STORES = {
  EXERCISES: 'exercises',
  WORKOUTS: 'workouts',
  WORKOUT_TEMPLATES: 'workout_templates',
  USER_DATA: 'userData',
  SYNC_QUEUE: 'syncQueue',
} as const;

/**
 * IndexedDB Manager for offline-first data storage
 */
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    logger.info('Starting IndexedDB initialization...');

    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        logger.error('IndexedDB not supported in this browser');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      logger.info(`Opening database: ${DB_NAME} version ${DB_VERSION}`);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        logger.error('IndexedDB initialization failed', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createObjectStores(db);
      };
    });

    return this.initPromise;
  }

  /**
   * Create object stores and indexes
   */
  private createObjectStores(db: IDBDatabase): void {
    // Exercises store
    if (!db.objectStoreNames.contains(STORES.EXERCISES)) {
      const exerciseStore = db.createObjectStore(STORES.EXERCISES, { keyPath: 'id' });
      
      // Create indexes for efficient querying
      exerciseStore.createIndex('name', 'name', { unique: false });
      exerciseStore.createIndex('type', 'type', { unique: false });
      exerciseStore.createIndex('category', 'category', { unique: false });
      exerciseStore.createIndex('body_parts', 'body_parts', { unique: false, multiEntry: true });
      exerciseStore.createIndex('muscle_groups', 'muscle_groups', { unique: false, multiEntry: true });
      exerciseStore.createIndex('equipment', 'equipment', { unique: false });
      exerciseStore.createIndex('difficulty_level', 'difficulty_level', { unique: false });
      exerciseStore.createIndex('is_custom', 'is_custom', { unique: false });
      exerciseStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      exerciseStore.createIndex('created_at', 'created_at', { unique: false });
      
      logger.info('Created exercises object store with indexes');
    }

    // Workouts store
    if (!db.objectStoreNames.contains(STORES.WORKOUTS)) {
      const workoutStore = db.createObjectStore(STORES.WORKOUTS, { keyPath: 'id' });
      workoutStore.createIndex('user_id', 'user_id', { unique: false });
      workoutStore.createIndex('created_at', 'created_at', { unique: false });
      workoutStore.createIndex('status', 'status', { unique: false });
      workoutStore.createIndex('is_template', 'is_template', { unique: false });
      workoutStore.createIndex('template_id', 'template_id', { unique: false });
      
      logger.info('Created workouts object store');
    }

    // Workout Templates store
    if (!db.objectStoreNames.contains(STORES.WORKOUT_TEMPLATES)) {
      const templateStore = db.createObjectStore(STORES.WORKOUT_TEMPLATES, { keyPath: 'id' });
      templateStore.createIndex('user_id', 'user_id', { unique: false });
      templateStore.createIndex('category', 'category', { unique: false });
      templateStore.createIndex('difficulty_level', 'difficulty_level', { unique: false });
      templateStore.createIndex('is_public_template', 'is_public_template', { unique: false });
      templateStore.createIndex('times_used', 'times_used', { unique: false });
      templateStore.createIndex('created_at', 'created_at', { unique: false });
      
      logger.info('Created workout_templates object store');
    }

    // User data store (for future use)
    if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
      const userStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
      userStore.createIndex('user_id', 'user_id', { unique: false });
      userStore.createIndex('type', 'type', { unique: false });
      
      logger.info('Created user data object store');
    }

    // Sync queue store (for future use)
    if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
      const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
      syncStore.createIndex('operation', 'operation', { unique: false });
      syncStore.createIndex('created_at', 'created_at', { unique: false });
      syncStore.createIndex('status', 'status', { unique: false });
      
      logger.info('Created sync queue object store');
    }
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Generic method to add/update data
   */
  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        logger.debug(`Data added to ${storeName}`, { data });
        resolve();
      };

      request.onerror = () => {
        logger.error(`Failed to add data to ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to get data by key
   */
  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        logger.error(`Failed to get data from ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to get all data from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        logger.error(`Failed to get all data from ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to delete data by key
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        logger.debug(`Data deleted from ${storeName}`, { key });
        resolve();
      };

      request.onerror = () => {
        logger.error(`Failed to delete data from ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generic method to clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info(`Cleared all data from ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        logger.error(`Failed to clear ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Query data using an index
   */
  async queryByIndex<T>(
    storeName: string,
    indexName: string,
    value: any,
    limit?: number
  ): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value, limit);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        logger.error(`Failed to query ${storeName} by index ${indexName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        logger.error(`Failed to count records in ${storeName}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Bulk insert/update data
   */
  async bulkPut<T>(storeName: string, data: T[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let completed = 0;
      const total = data.length;
      
      if (total === 0) {
        resolve();
        return;
      }

      const onComplete = () => {
        completed++;
        if (completed === total) {
          logger.info(`Bulk inserted ${total} records into ${storeName}`);
          resolve();
        }
      };

      data.forEach(item => {
        const request = store.put(item);
        request.onsuccess = onComplete;
        request.onerror = () => {
          logger.error(`Failed to bulk insert item into ${storeName}`, request.error);
          reject(request.error);
        };
      });
    });
  }

  /**
   * Search with cursor for complex queries
   */
  async searchWithCursor<T>(
    storeName: string,
    indexName: string | null,
    query: IDBKeyRange | null,
    filter?: (item: T) => boolean,
    limit?: number
  ): Promise<T[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = source.openCursor(query);
      
      const results: T[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor && (!limit || count < limit)) {
          const item = cursor.value as T;
          
          if (!filter || filter(item)) {
            results.push(item);
            count++;
          }
          
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        logger.error(`Failed to search ${storeName} with cursor`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      logger.info('IndexedDB connection closed');
    }
  }

  /**
   * Delete the entire database
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      
      request.onsuccess = () => {
        logger.info('Database deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        logger.error('Failed to delete database', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();