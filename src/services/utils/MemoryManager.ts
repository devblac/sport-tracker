/**
 * Memory Management Utilities
 * Optimized memory usage tracking and cleanup
 */

export class MemoryManager {
  private static readonly WEAK_MAP = new WeakMap<object, number>();
  private static totalAllocated = 0;

  /**
   * More accurate size estimation using structured cloning
   */
  static estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    // Use cached size if available
    if (typeof obj === 'object' && this.WEAK_MAP.has(obj)) {
      return this.WEAK_MAP.get(obj)!;
    }

    let size = 0;
    
    try {
      // Use structured clone algorithm for accurate size
      const cloned = structuredClone(obj);
      const serialized = JSON.stringify(cloned);
      size = new Blob([serialized]).size;
    } catch {
      // Fallback to JSON stringify
      try {
        size = JSON.stringify(obj).length * 2; // UTF-16
      } catch {
        size = 1024; // Default estimate
      }
    }

    // Cache the size for objects
    if (typeof obj === 'object') {
      this.WEAK_MAP.set(obj, size);
    }

    return size;
  }

  /**
   * Track memory allocation
   */
  static trackAllocation(size: number): void {
    this.totalAllocated += size;
  }

  /**
   * Track memory deallocation
   */
  static trackDeallocation(size: number): void {
    this.totalAllocated = Math.max(0, this.totalAllocated - size);
  }

  /**
   * Get current memory usage
   */
  static getCurrentUsage(): number {
    return this.totalAllocated;
  }

  /**
   * Force garbage collection hint (if available)
   */
  static forceGC(): void {
    if ('gc' in globalThis && typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
  }

  /**
   * Check if memory pressure is high
   */
  static isMemoryPressureHigh(): boolean {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      return usageRatio > 0.8; // 80% threshold
    }

    // Fallback to our tracking
    const maxHeap = 50 * 1024 * 1024; // 50MB estimate
    return this.totalAllocated > maxHeap * 0.8;
  }
}