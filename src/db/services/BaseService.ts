/**
 * Base Database Service
 * 
 * Abstract base class for all database services providing common functionality.
 */

import type { IndexedDBManager } from '../IndexedDBManager';
import type { BaseEntity, CreateEntityInput, UpdateEntityInput } from '@/types/database';

export abstract class BaseService<T extends BaseEntity> {
  protected db: IndexedDBManager;
  protected storeName: string;

  constructor(db: IndexedDBManager, storeName: string) {
    this.db = db;
    this.storeName = storeName;
  }

  /**
   * Create a new entity
   */
  async create(data: CreateEntityInput<T>): Promise<string> {
    const entity: T = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;

    return (await this.db.put(this.storeName, entity)) as string;
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | undefined> {
    return await this.db.get(this.storeName, id);
  }

  /**
   * Get all entities
   */
  async getAll(limit?: number): Promise<T[]> {
    const results = await this.db.getAll<T>(this.storeName);
    return limit ? results.slice(0, limit) : results;
  }

  /**
   * Update entity
   */
  async update(id: string, updates: UpdateEntityInput<T>): Promise<void> {
    const entity = await this.getById(id);
    if (!entity) {
      throw new Error(`${this.storeName} with id ${id} not found`);
    }

    const updatedEntity: T = {
      ...entity,
      ...updates,
      updatedAt: new Date(),
    };

    await this.db.put(this.storeName, updatedEntity);
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(this.storeName, id);
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    return await this.db.count(this.storeName);
  }

  /**
   * Get entities by index
   */
  async getByIndex(
    indexName: string,
    value: IDBValidKey | IDBKeyRange,
    limit?: number
  ): Promise<T[]> {
    return await this.db.getAllByIndex<T>(this.storeName, indexName, value, limit);
  }

  /**
   * Clear all entities
   */
  async clear(): Promise<void> {
    await this.db.clear(this.storeName);
  }

  /**
   * Batch operations
   */
  async batchCreate(entities: CreateEntityInput<T>[]): Promise<string[]> {
    const operations = entities.map(data => ({
      type: 'put' as const,
      storeName: this.storeName,
      data: {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T,
    }));

    await this.db.batch(operations);
    return operations.map(op => op.data.id);
  }

  /**
   * Search entities with a filter function
   */
  async search(predicate: (entity: T) => boolean, limit?: number): Promise<T[]> {
    const allEntities = await this.getAll();
    const filtered = allEntities.filter(predicate);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const entity = await this.getById(id);
    return entity !== undefined;
  }
}