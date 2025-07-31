/**
 * Bundle analysis and optimization utilities
 */

import { logger } from './logger';

interface BundleChunk {
  name: string;
  size: number;
  gzipSize?: number;
  loadTime: number;
  isAsync: boolean;
  dependencies: string[];
}

interface BundleReport {
  totalSize: number;
  totalGzipSize: number;
  chunks: BundleChunk[];
  duplicates: string[];
  recommendations: string[];
  score: number; // 0-100
}

class BundleAnalyzer {
  private chunks: Map<string, BundleChunk> = new Map();
  private loadTimes: Map<string, number> = new Map();

  /**
   * Analyze current bundle performance
   */
  async analyzeBundlePerformance(): Promise<BundleReport> {
    const resources = this.getResourceEntries();
    const chunks = this.processResources(resources);
    const duplicates = this.findDuplicates(chunks);
    const recommendations = this.generateRecommendations(chunks);
    const score = this.calculateScore(chunks, duplicates);

    const report: BundleReport = {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      totalGzipSize: chunks.reduce((sum, chunk) => sum + (chunk.gzipSize || chunk.size * 0.7), 0),
      chunks,
      duplicates,
      recommendations,
      score
    };

    logger.info('Bundle analysis completed', report);
    return report;
  }

  /**
   * Get resource entries from Performance API
   */
  private getResourceEntries(): PerformanceResourceTiming[] {
    if (typeof window === 'undefined' || !window.performance) {
      return [];
    }

    return window.performance
      .getEntriesByType('resource')
      .filter((entry): entry is PerformanceResourceTiming => 
        entry.name.includes('.js') || entry.name.includes('.css')
      );
  }

  /**
   * Process resource entries into bundle chunks
   */
  private processResources(resources: PerformanceResourceTiming[]): BundleChunk[] {
    return resources.map(resource => {
      const name = this.extractChunkName(resource.name);
      const isAsync = this.isAsyncChunk(resource.name);
      
      return {
        name,
        size: resource.transferSize || resource.decodedBodySize || 0,
        gzipSize: resource.transferSize || undefined,
        loadTime: resource.duration,
        isAsync,
        dependencies: this.extractDependencies(resource.name)
      };
    }).filter(chunk => chunk.size > 0);
  }

  /**
   * Extract chunk name from resource URL
   */
  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  /**
   * Check if chunk is loaded asynchronously
   */
  private isAsyncChunk(url: string): boolean {
    // Heuristics to determine if chunk is async
    return url.includes('chunk') || url.includes('lazy') || url.includes('async');
  }

  /**
   * Extract dependencies from chunk name (simplified)
   */
  private extractDependencies(url: string): string[] {
    const filename = this.extractChunkName(url);
    const dependencies: string[] = [];

    // Common dependency patterns
    if (filename.includes('vendor')) dependencies.push('vendor');
    if (filename.includes('react')) dependencies.push('react');
    if (filename.includes('router')) dependencies.push('router');
    if (filename.includes('ui')) dependencies.push('ui');
    if (filename.includes('chart')) dependencies.push('charts');

    return dependencies;
  }

  /**
   * Find duplicate code across chunks
   */
  private findDuplicates(chunks: BundleChunk[]): string[] {
    const duplicates: string[] = [];
    const seen = new Set<string>();

    for (const chunk of chunks) {
      for (const dep of chunk.dependencies) {
        if (seen.has(dep)) {
          duplicates.push(dep);
        } else {
          seen.add(dep);
        }
      }
    }

    return [...new Set(duplicates)];
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(chunks: BundleChunk[]): string[] {
    const recommendations: string[] = [];
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const syncChunks = chunks.filter(chunk => !chunk.isAsync);
    const syncSize = syncChunks.reduce((sum, chunk) => sum + chunk.size, 0);

    // Bundle size recommendations
    if (totalSize > 1000000) { // 1MB
      recommendations.push('Total bundle size is large (>1MB). Consider code splitting and lazy loading.');
    }

    if (syncSize > 500000) { // 500KB
      recommendations.push('Initial bundle size is large (>500KB). Move non-critical code to async chunks.');
    }

    // Chunk-specific recommendations
    const largeChunks = chunks.filter(chunk => chunk.size > 200000); // 200KB
    if (largeChunks.length > 0) {
      recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}. Consider splitting these further.`);
    }

    // Load time recommendations
    const slowChunks = chunks.filter(chunk => chunk.loadTime > 1000); // 1s
    if (slowChunks.length > 0) {
      recommendations.push(`Slow loading chunks: ${slowChunks.map(c => c.name).join(', ')}. Consider CDN or compression.`);
    }

    // Async loading recommendations
    const asyncRatio = chunks.filter(c => c.isAsync).length / chunks.length;
    if (asyncRatio < 0.3) {
      recommendations.push('Low async chunk ratio. Consider lazy loading more components.');
    }

    // Vendor chunk recommendations
    const vendorChunks = chunks.filter(chunk => chunk.name.includes('vendor'));
    const vendorSize = vendorChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    if (vendorSize > 300000) { // 300KB
      recommendations.push('Vendor bundle is large. Consider splitting vendor dependencies.');
    }

    return recommendations;
  }

  /**
   * Calculate bundle performance score (0-100)
   */
  private calculateScore(chunks: BundleChunk[], duplicates: string[]): number {
    let score = 100;
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const syncSize = chunks.filter(c => !c.isAsync).reduce((sum, chunk) => sum + chunk.size, 0);
    const avgLoadTime = chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length;

    // Size penalties
    if (totalSize > 1000000) score -= 20; // 1MB
    else if (totalSize > 500000) score -= 10; // 500KB

    if (syncSize > 500000) score -= 15; // 500KB initial
    else if (syncSize > 300000) score -= 8; // 300KB initial

    // Load time penalties
    if (avgLoadTime > 2000) score -= 15; // 2s average
    else if (avgLoadTime > 1000) score -= 8; // 1s average

    // Duplicate penalties
    score -= duplicates.length * 5;

    // Async loading bonus
    const asyncRatio = chunks.filter(c => c.isAsync).length / chunks.length;
    if (asyncRatio > 0.5) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get chunk loading waterfall
   */
  getChunkWaterfall(): Array<{ name: string; start: number; end: number; duration: number }> {
    const resources = this.getResourceEntries();
    return resources.map(resource => ({
      name: this.extractChunkName(resource.name),
      start: resource.startTime,
      end: resource.responseEnd,
      duration: resource.duration
    })).sort((a, b) => a.start - b.start);
  }

  /**
   * Monitor chunk loading in real-time
   */
  startMonitoring(): () => void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return () => {};
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          if (resource.name.includes('.js') || resource.name.includes('.css')) {
            const chunkName = this.extractChunkName(resource.name);
            this.loadTimes.set(chunkName, resource.duration);
            
            // Log slow chunks
            if (resource.duration > 2000) {
              logger.warn(`Slow chunk loading detected: ${chunkName} (${resource.duration}ms)`);
            }
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }

  /**
   * Get recommendations for specific chunk
   */
  getChunkRecommendations(chunkName: string): string[] {
    const recommendations: string[] = [];
    const loadTime = this.loadTimes.get(chunkName);

    if (loadTime && loadTime > 1000) {
      recommendations.push('Consider compressing or optimizing this chunk');
    }

    if (chunkName.includes('vendor')) {
      recommendations.push('Consider splitting vendor dependencies');
    }

    if (!chunkName.includes('chunk') && !chunkName.includes('lazy')) {
      recommendations.push('Consider making this chunk load asynchronously');
    }

    return recommendations;
  }

  /**
   * Export analysis data
   */
  exportAnalysis(): any {
    return {
      chunks: Array.from(this.chunks.values()),
      loadTimes: Object.fromEntries(this.loadTimes),
      timestamp: Date.now()
    };
  }
}

// Export singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Utility functions
export async function analyzeBundlePerformance(): Promise<BundleReport> {
  return bundleAnalyzer.analyzeBundlePerformance();
}

export function startBundleMonitoring(): () => void {
  return bundleAnalyzer.startMonitoring();
}

export function getBundleWaterfall() {
  return bundleAnalyzer.getChunkWaterfall();
}

// React hook for bundle analysis
export function useBundleAnalysis() {
  const [report, setReport] = React.useState<BundleReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const analyze = React.useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = await bundleAnalyzer.analyzeBundlePerformance();
      setReport(result);
    } catch (error) {
      logger.error('Bundle analysis failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  React.useEffect(() => {
    // Auto-analyze after initial load
    const timer = setTimeout(analyze, 3000);
    return () => clearTimeout(timer);
  }, [analyze]);

  return {
    report,
    isAnalyzing,
    analyze
  };
}

// Add to window for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).bundleAnalyzer = bundleAnalyzer;
}