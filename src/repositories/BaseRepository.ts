// ============================================================================
// BASE REPOSITORY
// ============================================================================
// Abstract base repository with common CRUD operations
// ============================================================================

import { z } from 'zod';
import { storage, logger } from '@/utils';

export interface RepositoryConfig {
  storageKey: string;
  schema?: z.ZodSchema;
  enableCache?: boolean;
  cacheTTL?: number; // milliseconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected config: RepositoryConfig;
  private cache: Map<string, CacheEntry<T>> = new Map();

  constructor(config: RepositoryConfig) {
    this.config = {
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes default
      ...config
    };
  }

  // Abstract methods to be implemented by subclasses
  protected abstract validateItem(item: unknown): T;
  protected abstract getDefaultItems(): T[];

  // Cache management
  private getCacheKey(id: string): string {
    return `${this.config.storageKey}:${id}`;
  }

  private isValidCacheEntry(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private setCache(id: string, item: T): void {
    if (!this.config.enableCache) return;

    this.cache.set(this.getCacheKey(id), {
      data: item,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL!
    });
  }

  private getCache(id: string): T | null {
    if (!this.config.enableCache) return null;

    const entry = this.cache.get(this.getCacheKey(id));
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(this.getCacheKey(id));
    }

    return null;
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // CRUD operations
  public async getAll(): Promise<T[]> {
    try {
      const stored = storage.get<T[]>(this.config.storageKey);
      
      if (!stored || !Array.isArray(stored)) {
        const defaults = this.getDefaultItems();
        await this.saveAll(defaults);
        return defaults;
      }

      // Validate each item if schema is provided
      if (this.config.schema) {
        const validated = stored
          .map(item => {
            try {
              return this.validateItem(item);
            } catch (error) {
              logger.warn(`Invalid item in ${this.config.storageKey}:`, error);
              return null;
            }
          })
          .filter((item): item is T => item !== null);

        return validated;
      }

      return stored;
    } catch (error) {
      logger.error(`Error loading ${this.config.storageKey}:`, error);
      return this.getDefaultItems();
    }
  }

  public async getById(id: string): Promise<T | null> {
    // Check cache first
    const cached = this.getCache(id);
    if (cached) return cached;

    const items = await this.getAll();
    const item = items.find(item => item.id === id) || null;

    // Cache the result
    if (item) {
      this.setCache(id, item);
    }

    return item;
  }

  public async create(item: Omit<T, 'id'>): Promise<T> {
    const newItem = {
      ...item,
      id: this.generateId()
    } as T;

    const validated = this.validateItem(newItem);
    const items = await this.getAll();
    
    items.push(validated);
    await this.saveAll(items);
    
    this.setCache(validated.id, validated);
    return validated;
  }

  public async update(id: string, updates: Partial<T>): Promise<T | null> {
    const items = await this.getAll();
    const index = items.findIndex(item => item.id === id);

    if (index === -1) return null;

    const updatedItem = { ...items[index], ...updates } as T;
    const validated = this.validateItem(updatedItem);
    
    items[index] = validated;
    await this.saveAll(items);
    
    this.setCache(id, validated);
    return validated;
  }

  public async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const filteredItems = items.filter(item => item.id !== id);

    if (filteredItems.length === items.length) {
      return false; // Item not found
    }

    await this.saveAll(filteredItems);
    this.cache.delete(this.getCacheKey(id));
    return true;
  }

  public async deleteAll(): Promise<void> {
    storage.remove(this.config.storageKey);
    this.clearCache();
  }

  // Batch operations
  public async createMany(items: Omit<T, 'id'>[]): Promise<T[]> {
    const newItems = items.map(item => ({
      ...item,
      id: this.generateId()
    } as T));

    const validated = newItems.map(item => this.validateItem(item));
    const existingItems = await this.getAll();
    
    const allItems = [...existingItems, ...validated];
    await this.saveAll(allItems);
    
    // Cache new items
    validated.forEach(item => this.setCache(item.id, item));
    
    return validated;
  }

  public async updateMany(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    const items = await this.getAll();
    const updatedItems: T[] = [];

    for (const update of updates) {
      const index = items.findIndex(item => item.id === update.id);
      if (index !== -1) {
        const updatedItem = { ...items[index], ...update.data } as T;
        const validated = this.validateItem(updatedItem);
        items[index] = validated;
        updatedItems.push(validated);
        this.setCache(update.id, validated);
      }
    }

    await this.saveAll(items);
    return updatedItems;
  }

  // Query operations
  public async findBy(predicate: (item: T) => boolean): Promise<T[]> {
    const items = await this.getAll();
    return items.filter(predicate);
  }

  public async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    const items = await this.getAll();
    return items.find(predicate) || null;
  }

  public async count(): Promise<number> {
    const items = await this.getAll();
    return items.length;
  }

  public async exists(id: string): Promise<boolean> {
    const item = await this.getById(id);
    return item !== null;
  }

  // Utility methods
  private async saveAll(items: T[]): Promise<void> {
    try {
      storage.set(this.config.storageKey, items);
    } catch (error) {
      logger.error(`Error saving ${this.config.storageKey}:`, error);
      throw new Error(`Failed to save ${this.config.storageKey}`);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Cache utilities
  public clearItemCache(id?: string): void {
    if (id) {
      this.cache.delete(this.getCacheKey(id));
    } else {
      this.clearCache();
    }
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}