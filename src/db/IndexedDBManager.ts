/**
 * IndexedDB Manager
 * 
 * Core database management for offline-first functionality.
 * Handles database initialization, migrations, and CRUD operations.
 */

export interface DBSchema {
  name: string;
  version: number;
  stores: StoreSchema[];
}

export interface StoreSchema {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexSchema[];
}

export interface IndexSchema {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private version: number;
  private schema: DBSchema;

  constructor(schema: DBSchema) {
    this.dbName = schema.name;
    this.version = schema.version;
    this.schema = schema;
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Opening database: ${this.dbName} version ${this.version}`);
      
      const request = indexedDB.open(this.dbName, this.version);

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error(`Database initialization timed out after 15 seconds`));
      }, 15000);

      request.onerror = () => {
        clearTimeout(timeoutId);
        const errorMessage = request.error?.message || 'Unknown database error';
        console.error(`Database open failed: ${errorMessage}`);
        reject(new Error(`Failed to open database: ${errorMessage}`));
      };

      request.onsuccess = () => {
        clearTimeout(timeoutId);
        this.db = request.result;
        console.log(`Database opened successfully: ${this.dbName} version ${this.db.version}`);
        
        // Add error handler for the database connection
        this.db.onerror = (event) => {
          console.error('Database error:', event);
        };
        
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log(`Database upgrade needed from version ${event.oldVersion} to ${event.newVersion}`);
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          this.handleUpgrade(db, event.oldVersion, event.newVersion || this.version);
        } catch (upgradeError) {
          clearTimeout(timeoutId);
          console.error('Database upgrade failed:', upgradeError);
          reject(upgradeError);
        }
      };

      request.onblocked = () => {
        console.warn('Database upgrade blocked - another tab may have the database open');
        // Don't reject immediately, give it some time
        setTimeout(() => {
          reject(new Error('Database upgrade blocked by another tab'));
        }, 5000);
      };
    });
  }

  /**
   * Handle database schema upgrades
   */
  private handleUpgrade(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

    try {
      // Create or update object stores
      for (const storeSchema of this.schema.stores) {
        try {
          if (!db.objectStoreNames.contains(storeSchema.name)) {
            // Create new store
            console.log(`Creating new store: ${storeSchema.name}`);
            const store = db.createObjectStore(storeSchema.name, {
              keyPath: storeSchema.keyPath,
              autoIncrement: storeSchema.autoIncrement
            });

            // Create indexes
            if (storeSchema.indexes) {
              for (const indexSchema of storeSchema.indexes) {
                try {
                  store.createIndex(indexSchema.name, indexSchema.keyPath, {
                    unique: indexSchema.unique,
                    multiEntry: indexSchema.multiEntry
                  });
                } catch (indexError) {
                  console.warn(`Failed to create index ${indexSchema.name} on store ${storeSchema.name}:`, indexError);
                }
              }
            }
          } else {
            // Store exists, check if we need to add new indexes
            console.log(`Store ${storeSchema.name} already exists, checking indexes...`);
            
            // Note: We can't access the store during upgrade in this way
            // Index updates need to be handled differently
            if (storeSchema.indexes) {
              console.log(`Store ${storeSchema.name} has ${storeSchema.indexes.length} indexes defined`);
            }
          }
        } catch (storeError) {
          console.error(`Failed to create/update store ${storeSchema.name}:`, storeError);
          throw storeError;
        }
      }

      // Remove obsolete stores (if needed)
      const currentStoreNames = Array.from(db.objectStoreNames);
      const schemaStoreNames = this.schema.stores.map(s => s.name);
      
      for (const storeName of currentStoreNames) {
        if (!schemaStoreNames.includes(storeName)) {
          console.warn(`Removing obsolete store: ${storeName}`);
          try {
            db.deleteObjectStore(storeName);
          } catch (deleteError) {
            console.error(`Failed to delete obsolete store ${storeName}:`, deleteError);
          }
        }
      }

      console.log(`Database upgrade completed successfully from version ${oldVersion} to ${newVersion}`);
    } catch (upgradeError) {
      console.error(`Database upgrade failed from version ${oldVersion} to ${newVersion}:`, upgradeError);
      throw upgradeError;
    }
  }

  /**
   * Get a transaction for the specified stores
   */
  private getTransaction(storeNames: string[], mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.transaction(storeNames, mode);
  }

  /**
   * Get an object store
   */
  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    const transaction = this.getTransaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * Add a record to a store
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to add record: ${request.error?.message}`));
    });
  }

  /**
   * Put (add or update) a record in a store
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to put record: ${request.error?.message}`));
    });
  }

  /**
   * Get a record by key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get record: ${request.error?.message}`));
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string, query?: IDBValidKey | IDBKeyRange, count?: number): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll(query, count);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get all records: ${request.error?.message}`));
    });
  }

  /**
   * Get records using an index
   */
  async getAllByIndex<T>(
    storeName: string, 
    indexName: string, 
    query?: IDBValidKey | IDBKeyRange, 
    count?: number
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const index = store.index(indexName);
      const request = index.getAll(query, count);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to get records by index: ${request.error?.message}`));
    });
  }

  /**
   * Delete a record by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete record: ${request.error?.message}`));
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message}`));
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.count(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Failed to count records: ${request.error?.message}`));
    });
  }

  // ============================================================================
  // Advanced Operations
  // ============================================================================

  /**
   * Execute a transaction with multiple operations
   */
  async transaction<T>(
    storeNames: string[],
    mode: IDBTransactionMode,
    callback: (stores: { [key: string]: IDBObjectStore }) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.getTransaction(storeNames, mode);
      const stores: { [key: string]: IDBObjectStore } = {};

      // Create stores object
      for (const storeName of storeNames) {
        stores[storeName] = transaction.objectStore(storeName);
      }

      transaction.oncomplete = () => {
        // Transaction completed successfully
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error('Transaction aborted'));
      };

      // Execute callback
      callback(stores)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * Cursor-based iteration over records
   */
  async iterate<T>(
    storeName: string,
    callback: (cursor: IDBCursorWithValue, record: T) => boolean | Promise<boolean>,
    query?: IDBValidKey | IDBKeyRange,
    direction?: IDBCursorDirection
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.openCursor(query, direction);

      request.onsuccess = async () => {
        const cursor = request.result;
        if (cursor) {
          try {
            const shouldContinue = await callback(cursor, cursor.value);
            if (shouldContinue) {
              cursor.continue();
            } else {
              resolve();
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(new Error(`Cursor iteration failed: ${request.error?.message}`));
    });
  }

  /**
   * Bulk put multiple records
   */
  async bulkPut<T>(storeName: string, records: T[]): Promise<IDBValidKey[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.getTransaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const results: IDBValidKey[] = [];
      let completed = 0;

      if (records.length === 0) {
        resolve([]);
        return;
      }

      transaction.oncomplete = () => {
        resolve(results);
      };

      transaction.onerror = () => {
        reject(new Error(`Bulk put transaction failed: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error('Bulk put transaction aborted'));
      };

      // Process each record
      records.forEach((record, index) => {
        const request = store.put(record);
        
        request.onsuccess = () => {
          results[index] = request.result;
          completed++;
          
          // All requests completed, transaction will auto-complete
          if (completed === records.length) {
            // Transaction will complete automatically
          }
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to put record at index ${index}: ${request.error?.message}`));
        };
      });
    });
  }

  /**
   * Batch operations
   */
  async batch(operations: Array<{
    type: 'add' | 'put' | 'delete';
    storeName: string;
    data?: any;
    key?: IDBValidKey;
  }>): Promise<void> {
    const storeNames = [...new Set(operations.map(op => op.storeName))];
    
    return this.transaction(storeNames, 'readwrite', async (stores) => {
      const promises = operations.map(op => {
        const store = stores[op.storeName];
        
        return new Promise<void>((resolve, reject) => {
          let request: IDBRequest;
          
          switch (op.type) {
            case 'add':
              request = store.add(op.data);
              break;
            case 'put':
              request = store.put(op.data);
              break;
            case 'delete':
              request = store.delete(op.key!);
              break;
            default:
              reject(new Error(`Unknown operation type: ${op.type}`));
              return;
          }
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error(`Batch operation failed: ${request.error?.message}`));
        });
      });
      
      await Promise.all(promises);
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the entire database
   */
  static async deleteDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message}`));
      request.onblocked = () => reject(new Error('Database deletion blocked'));
    });
  }

  /**
   * Get database info
   */
  getInfo(): { name: string; version: number; stores: string[] } | null {
    if (!this.db) return null;
    
    return {
      name: this.db.name,
      version: this.db.version,
      stores: Array.from(this.db.objectStoreNames)
    };
  }
}

// Legacy exports for backward compatibility
export { dbManager, STORES } from './legacyCompat';