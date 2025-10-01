/**
 * Eviction Strategies using Strategy Pattern
 * Replaces complex conditional logic with clean strategy implementations
 */

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  ttl: number;
  accessCount: number;
  lastAccessed: Date;
  size: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface EvictionStrategy {
  selectForEviction(entries: CacheEntry[], targetSize: number): CacheEntry[];
}

export class LRUEvictionStrategy implements EvictionStrategy {
  selectForEviction(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    const sorted = [...entries].sort((a, b) => 
      a.lastAccessed.getTime() - b.lastAccessed.getTime()
    );
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

export class LFUEvictionStrategy implements EvictionStrategy {
  selectForEviction(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    const sorted = [...entries].sort((a, b) => 
      a.accessCount - b.accessCount
    );
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

export class TTLEvictionStrategy implements EvictionStrategy {
  selectForEviction(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    const sorted = [...entries].sort((a, b) => {
      const aExpiry = a.timestamp.getTime() + a.ttl;
      const bExpiry = b.timestamp.getTime() + b.ttl;
      return aExpiry - bExpiry;
    });
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

export class PriorityEvictionStrategy implements EvictionStrategy {
  private priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'critical': 3 };

  selectForEviction(entries: CacheEntry[], targetSize: number): CacheEntry[] {
    const sorted = [...entries].sort((a, b) => 
      this.priorityOrder[a.priority] - this.priorityOrder[b.priority]
    );
    
    const toEvict: CacheEntry[] = [];
    let evictedSize = 0;
    
    for (const entry of sorted) {
      if (evictedSize >= targetSize) break;
      toEvict.push(entry);
      evictedSize += entry.size;
    }
    
    return toEvict;
  }
}

export class EvictionStrategyFactory {
  static create(type: 'lru' | 'lfu' | 'ttl' | 'priority'): EvictionStrategy {
    switch (type) {
      case 'lru': return new LRUEvictionStrategy();
      case 'lfu': return new LFUEvictionStrategy();
      case 'ttl': return new TTLEvictionStrategy();
      case 'priority': return new PriorityEvictionStrategy();
      default: throw new Error(`Unknown eviction strategy: ${type}`);
    }
  }
}