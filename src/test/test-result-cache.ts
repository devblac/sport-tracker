/**
 * Test Result Cache System
 * Implements intelligent caching of test results for unchanged code paths
 * Requirements: 6.1, 9.1, 9.2
 */

import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
// Removed unused import

interface CachedTestResult {
  testFile: string;
  contentHash: string;
  dependencyHashes: Map<string, string>;
  result: {
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    testCount: number;
    failureCount: number;
    details?: any;
  };
  timestamp: number;
  vitestVersion: string;
  nodeVersion: string;
}

interface CacheStats {
  totalTests: number;
  cachedTests: number;
  hitRate: number;
  timeSaved: number;
  cacheSize: number;
}

interface DependencyGraph {
  [testFile: string]: {
    directDependencies: string[];
    transitiveDependencies: string[];
    lastModified: number;
  };
}

export class TestResultCache {
  private readonly cacheDir: string;
  private readonly cacheFile: string;
  private readonly dependencyGraphFile: string;
  private cache: Map<string, CachedTestResult> = new Map();
  private dependencyGraph: DependencyGraph = {};
  private stats: CacheStats = {
    totalTests: 0,
    cachedTests: 0,
    hitRate: 0,
    timeSaved: 0,
    cacheSize: 0
  };

  private readonly maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly maxCacheSize = 1000; // Maximum number of cached results

  constructor(cacheDir: string = '.test-cache') {
    this.cacheDir = join(process.cwd(), cacheDir);
    this.cacheFile = join(this.cacheDir, 'test-results.json');
    this.dependencyGraphFile = join(this.cacheDir, 'dependency-graph.json');
    
    this.ensureCacheDirectory();
    this.loadCache();
    this.loadDependencyGraph();
  }

  /**
   * Check if a test result is cached and valid
   */
  async getCachedResult(testFile: string): Promise<CachedTestResult | null> {
    const normalizedPath = this.normalizePath(testFile);
    const cached = this.cache.get(normalizedPath);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.maxCacheAge) {
      this.cache.delete(normalizedPath);
      return null;
    }

    // Check if test file has changed
    const currentHash = await this.calculateFileHash(testFile);
    if (currentHash !== cached.contentHash) {
      this.cache.delete(normalizedPath);
      return null;
    }

    // Check if dependencies have changed
    const dependenciesChanged = await this.haveDependenciesChanged(testFile, cached);
    if (dependenciesChanged) {
      this.cache.delete(normalizedPath);
      return null;
    }

    // Check environment compatibility
    if (!this.isEnvironmentCompatible(cached)) {
      this.cache.delete(normalizedPath);
      return null;
    }

    this.stats.cachedTests++;
    this.stats.timeSaved += cached.result.duration;
    
    return cached;
  }

  /**
   * Cache a test result
   */
  async cacheResult(
    testFile: string,
    result: CachedTestResult['result'],
    dependencies?: string[]
  ): Promise<void> {
    const normalizedPath = this.normalizePath(testFile);
    
    // Calculate content hash
    const contentHash = await this.calculateFileHash(testFile);
    
    // Calculate dependency hashes
    const dependencyHashes = new Map<string, string>();
    const resolvedDependencies = dependencies || await this.resolveDependencies(testFile);
    
    for (const dep of resolvedDependencies) {
      if (existsSync(dep)) {
        dependencyHashes.set(dep, await this.calculateFileHash(dep));
      }
    }

    const cachedResult: CachedTestResult = {
      testFile: normalizedPath,
      contentHash,
      dependencyHashes,
      result,
      timestamp: Date.now(),
      vitestVersion: this.getVitestVersion(),
      nodeVersion: process.version
    };

    this.cache.set(normalizedPath, cachedResult);
    this.stats.totalTests++;
    
    // Update dependency graph
    await this.updateDependencyGraph(testFile, resolvedDependencies);
    
    // Cleanup old entries if cache is too large
    await this.cleanupCache();
    
    // Persist cache
    await this.persistCache();
  }

  /**
   * Invalidate cache entries for files that have changed
   */
  async invalidateChangedFiles(changedFiles: string[]): Promise<number> {
    let invalidatedCount = 0;
    
    for (const file of changedFiles) {
      const normalizedPath = this.normalizePath(file);
      
      // Direct invalidation
      if (this.cache.has(normalizedPath)) {
        this.cache.delete(normalizedPath);
        invalidatedCount++;
      }
      
      // Invalidate tests that depend on this file
      for (const [testFile, cached] of this.cache.entries()) {
        if (cached.dependencyHashes.has(normalizedPath)) {
          this.cache.delete(testFile);
          invalidatedCount++;
        }
      }
    }
    
    if (invalidatedCount > 0) {
      await this.persistCache();
    }
    
    return invalidatedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.stats.hitRate = this.stats.totalTests > 0 
      ? this.stats.cachedTests / this.stats.totalTests 
      : 0;
    this.stats.cacheSize = this.cache.size;
    
    return { ...this.stats };
  }

  /**
   * Clear all cached results
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.dependencyGraph = {};
    this.stats = {
      totalTests: 0,
      cachedTests: 0,
      hitRate: 0,
      timeSaved: 0,
      cacheSize: 0
    };
    
    await this.persistCache();
    await this.persistDependencyGraph();
  }

  /**
   * Optimize cache by removing least recently used entries
   */
  async optimizeCache(): Promise<void> {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries()).sort((a, b) => 
      a[1].timestamp - b[1].timestamp
    );

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    for (const [key] of toRemove) {
      this.cache.delete(key);
    }

    await this.persistCache();
  }

  /**
   * Generate cache performance report
   */
  generatePerformanceReport(): {
    stats: CacheStats;
    recommendations: string[];
    projectedSavings: number;
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    if (stats.hitRate < 0.3) {
      recommendations.push('Low cache hit rate - consider improving test stability');
    }
    
    if (stats.hitRate > 0.7) {
      recommendations.push('Good cache performance - consider increasing cache size');
    }
    
    if (stats.cacheSize > this.maxCacheSize * 0.9) {
      recommendations.push('Cache approaching size limit - consider cleanup');
    }
    
    // Calculate projected savings for full test suite
    const averageTestTime = 100; // ms
    const totalPossibleTests = 1000; // estimated
    const projectedSavings = (totalPossibleTests * stats.hitRate * averageTestTime) / 1000; // seconds
    
    return {
      stats,
      recommendations,
      projectedSavings
    };
  }

  // Private methods

  private ensureCacheDirectory(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private loadCache(): void {
    if (existsSync(this.cacheFile)) {
      try {
        const data = JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
        this.cache = new Map(data.entries || []);
        this.stats = { ...this.stats, ...data.stats };
      } catch (error) {
        console.warn('Failed to load test cache:', error);
        this.cache = new Map();
      }
    }
  }

  private loadDependencyGraph(): void {
    if (existsSync(this.dependencyGraphFile)) {
      try {
        this.dependencyGraph = JSON.parse(readFileSync(this.dependencyGraphFile, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load dependency graph:', error);
        this.dependencyGraph = {};
      }
    }
  }

  private async persistCache(): Promise<void> {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        stats: this.stats,
        version: '1.0.0',
        timestamp: Date.now()
      };
      
      writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to persist test cache:', error);
    }
  }

  private async persistDependencyGraph(): Promise<void> {
    try {
      writeFileSync(this.dependencyGraphFile, JSON.stringify(this.dependencyGraph, null, 2));
    } catch (error) {
      console.warn('Failed to persist dependency graph:', error);
    }
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    if (!existsSync(filePath)) {
      return '';
    }
    
    const content = readFileSync(filePath, 'utf-8');
    const stats = statSync(filePath);
    
    // Include both content and modification time for better cache invalidation
    const hashInput = `${content}|${stats.mtime.getTime()}`;
    return createHash('md5').update(hashInput).digest('hex');
  }

  private async haveDependenciesChanged(
    testFile: string, 
    cached: CachedTestResult
  ): Promise<boolean> {
    for (const [depPath, cachedHash] of cached.dependencyHashes.entries()) {
      if (!existsSync(depPath)) {
        return true; // Dependency was deleted
      }
      
      const currentHash = await this.calculateFileHash(depPath);
      if (currentHash !== cachedHash) {
        return true; // Dependency changed
      }
    }
    
    return false;
  }

  private async resolveDependencies(testFile: string): Promise<string[]> {
    const dependencies: string[] = [];
    
    if (!existsSync(testFile)) {
      return dependencies;
    }
    
    const content = readFileSync(testFile, 'utf-8');
    
    // Extract import statements (simplified)
    const importRegex = /(?:import|require)\s*\(?['"`]([^'"`]+)['"`]\)?/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip node_modules
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const resolvedPath = this.resolveImportPath(testFile, importPath);
        if (resolvedPath && existsSync(resolvedPath)) {
          dependencies.push(resolvedPath);
        }
      }
    }
    
    return dependencies;
  }

  private resolveImportPath(fromFile: string, importPath: string): string | null {
    const baseDir = dirname(fromFile);
    
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const resolved = join(baseDir, importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (existsSync(withExt)) {
          return withExt;
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexFile = join(resolved, `index${ext}`);
        if (existsSync(indexFile)) {
          return indexFile;
        }
      }
    }
    
    return null;
  }

  private async updateDependencyGraph(testFile: string, dependencies: string[]): Promise<void> {
    const normalizedPath = this.normalizePath(testFile);
    
    this.dependencyGraph[normalizedPath] = {
      directDependencies: dependencies.map(dep => this.normalizePath(dep)),
      transitiveDependencies: await this.resolveTransitiveDependencies(dependencies),
      lastModified: Date.now()
    };
    
    await this.persistDependencyGraph();
  }

  private async resolveTransitiveDependencies(dependencies: string[]): Promise<string[]> {
    const transitive: Set<string> = new Set();
    
    for (const dep of dependencies) {
      const depDependencies = await this.resolveDependencies(dep);
      for (const transitiveDep of depDependencies) {
        transitive.add(this.normalizePath(transitiveDep));
      }
    }
    
    return Array.from(transitive);
  }

  private isEnvironmentCompatible(cached: CachedTestResult): boolean {
    // Check Node.js version compatibility
    if (cached.nodeVersion !== process.version) {
      return false;
    }
    
    // Check Vitest version compatibility
    const currentVitestVersion = this.getVitestVersion();
    if (cached.vitestVersion !== currentVitestVersion) {
      return false;
    }
    
    return true;
  }

  private getVitestVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
      return packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    
    // Remove expired entries
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.maxCacheAge) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      this.cache.delete(key);
    }
    
    // Optimize cache size
    await this.optimizeCache();
  }

  private normalizePath(filePath: string): string {
    return relative(process.cwd(), filePath).replace(/\\/g, '/');
  }
}

export default TestResultCache;