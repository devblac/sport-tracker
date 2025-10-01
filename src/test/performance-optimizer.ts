/**
 * Test Performance Optimizer
 * Implements test execution performance improvements and CI efficiency optimizations
 * Requirements: 6.1, 9.1, 9.2
 */

import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestPerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  testCount: number;
  averageTestTime: number;
  parallelizationEfficiency: number;
  cacheHitRate: number;
}

interface TestCacheEntry {
  hash: string;
  result: 'pass' | 'fail' | 'skip';
  executionTime: number;
  timestamp: number;
  dependencies: string[];
}

interface ParallelizationConfig {
  maxWorkers: number;
  minTestsPerWorker: number;
  memoryThreshold: number;
  cpuThreshold: number;
}

export class TestPerformanceOptimizer {
  private readonly CACHE_DIR = join(process.cwd(), '.test-cache');
  private readonly PERFORMANCE_TARGET = {
    FULL_SUITE_TIME: 120000, // 2 minutes in ms
    AVERAGE_TEST_TIME: 100, // 100ms per test
    CI_TOTAL_TIME: 300000, // 5 minutes in ms
    PARALLELIZATION_EFFICIENCY: 0.8 // 80% efficiency target
  };

  private cache: Map<string, TestCacheEntry> = new Map();
  private performanceHistory: TestPerformanceMetrics[] = [];

  constructor() {
    this.ensureCacheDirectory();
    this.loadCache();
  }

  /**
   * Optimize test execution configuration based on environment and test count
   */
  async optimizeTestConfiguration(testFiles: string[], isCI: boolean = false): Promise<{
    parallelConfig: ParallelizationConfig;
    testTimeout: number;
    setupTimeout: number;
    teardownTimeout: number;
    poolOptions: any;
  }> {
    const testCount = this.estimateTestCount(testFiles);
    const os = await import('os');
    const availableCPUs = os.cpus().length;
    const availableMemory = os.totalmem();

    // Calculate optimal parallelization
    const maxWorkers = isCI 
      ? Math.min(2, availableCPUs) // Conservative in CI
      : Math.min(4, Math.max(2, Math.floor(availableCPUs * 0.75)));

    const minTestsPerWorker = Math.ceil(testCount / maxWorkers);

    // Adjust timeouts based on environment
    const baseTimeout = isCI ? 15000 : 10000;
    const testTimeout = Math.min(baseTimeout, Math.max(5000, testCount * 10));

    return {
      parallelConfig: {
        maxWorkers,
        minTestsPerWorker,
        memoryThreshold: availableMemory * 0.8,
        cpuThreshold: 0.9
      },
      testTimeout,
      setupTimeout: Math.min(30000, testTimeout * 2),
      teardownTimeout: 5000,
      poolOptions: {
        threads: {
          singleThread: false,
          isolate: true,
          minThreads: 1,
          maxThreads: maxWorkers,
          useAtomics: true,
          // Optimize memory usage
          execArgv: [
            '--max-old-space-size=2048',
            '--optimize-for-size'
          ]
        }
      }
    };
  }

  /**
   * Implement intelligent test result caching
   */
  async getCachedResult(testFile: string, dependencies: string[]): Promise<TestCacheEntry | null> {
    const hash = this.calculateTestHash(testFile, dependencies);
    const cached = this.cache.get(hash);

    if (!cached) {
      return null;
    }

    // Check if dependencies have changed
    const dependenciesChanged = await this.haveDependenciesChanged(dependencies, cached.timestamp);
    if (dependenciesChanged) {
      this.cache.delete(hash);
      return null;
    }

    return cached;
  }

  /**
   * Cache test result for future runs
   */
  async cacheTestResult(
    testFile: string, 
    dependencies: string[], 
    result: 'pass' | 'fail' | 'skip', 
    executionTime: number
  ): Promise<void> {
    const hash = this.calculateTestHash(testFile, dependencies);
    const entry: TestCacheEntry = {
      hash,
      result,
      executionTime,
      timestamp: Date.now(),
      dependencies
    };

    this.cache.set(hash, entry);
    await this.persistCache();
  }

  /**
   * Analyze test performance and identify optimization opportunities
   */
  analyzePerformance(metrics: TestPerformanceMetrics): {
    recommendations: string[];
    optimizations: any;
    projectedImprovement: number;
  } {
    const recommendations: string[] = [];
    const optimizations: any = {};
    let projectedImprovement = 0;

    // Check execution time
    if (metrics.executionTime > this.PERFORMANCE_TARGET.FULL_SUITE_TIME) {
      const excess = metrics.executionTime - this.PERFORMANCE_TARGET.FULL_SUITE_TIME;
      recommendations.push(`Test suite exceeds 2-minute target by ${Math.round(excess / 1000)}s`);
      
      if (metrics.averageTestTime > this.PERFORMANCE_TARGET.AVERAGE_TEST_TIME) {
        recommendations.push('Individual tests are too slow - consider mocking heavy operations');
        optimizations.mockHeavyOperations = true;
        projectedImprovement += 0.3; // 30% improvement
      }

      if (metrics.parallelizationEfficiency < this.PERFORMANCE_TARGET.PARALLELIZATION_EFFICIENCY) {
        recommendations.push('Poor parallelization efficiency - optimize test isolation');
        optimizations.improveParallelization = true;
        projectedImprovement += 0.2; // 20% improvement
      }
    }

    // Check cache efficiency
    if (metrics.cacheHitRate < 0.3) {
      recommendations.push('Low cache hit rate - improve test result caching');
      optimizations.improveCaching = true;
      projectedImprovement += 0.15; // 15% improvement
    }

    // Memory usage optimization
    if (metrics.memoryUsage > 1024 * 1024 * 1024) { // 1GB
      recommendations.push('High memory usage - optimize test data and mocks');
      optimizations.optimizeMemory = true;
      projectedImprovement += 0.1; // 10% improvement
    }

    return {
      recommendations,
      optimizations,
      projectedImprovement: Math.min(projectedImprovement, 0.6) // Cap at 60%
    };
  }

  /**
   * Implement test parallelization with intelligent work distribution
   */
  async parallelizeTests(testFiles: string[], config: ParallelizationConfig): Promise<{
    workerGroups: string[][];
    estimatedTime: number;
    efficiency: number;
  }> {
    // Sort tests by estimated execution time (longest first for better load balancing)
    const testEstimates = await Promise.all(
      testFiles.map(async (file) => ({
        file,
        estimatedTime: await this.estimateTestTime(file)
      }))
    );

    testEstimates.sort((a, b) => b.estimatedTime - a.estimatedTime);

    // Distribute tests across workers using longest processing time first algorithm
    const workerGroups: string[][] = Array(config.maxWorkers).fill(null).map(() => []);
    const workerTimes: number[] = Array(config.maxWorkers).fill(0);

    for (const { file, estimatedTime } of testEstimates) {
      // Find worker with least total time
      const workerIndex = workerTimes.indexOf(Math.min(...workerTimes));
      workerGroups[workerIndex].push(file);
      workerTimes[workerIndex] += estimatedTime;
    }

    const maxWorkerTime = Math.max(...workerTimes);
    const totalTime = workerTimes.reduce((sum, time) => sum + time, 0);
    const efficiency = totalTime / (maxWorkerTime * config.maxWorkers);

    return {
      workerGroups: workerGroups.filter(group => group.length > 0),
      estimatedTime: maxWorkerTime,
      efficiency
    };
  }

  /**
   * Monitor test execution performance in real-time
   */
  createPerformanceMonitor(): {
    start: () => void;
    recordTest: (testName: string, duration: number) => void;
    finish: () => TestPerformanceMetrics;
  } {
    let startTime: number;
    let testTimes: number[] = [];
    let testCount = 0;
    const initialMemory = process.memoryUsage().heapUsed;

    return {
      start: () => {
        startTime = performance.now();
      },

      recordTest: (testName: string, duration: number) => {
        testTimes.push(duration);
        testCount++;

        // Warn about slow tests
        if (duration > this.PERFORMANCE_TARGET.AVERAGE_TEST_TIME * 2) {
          console.warn(`⚠️  Slow test detected: ${testName} (${Math.round(duration)}ms)`);
        }
      },

      finish: (): TestPerformanceMetrics => {
        const executionTime = performance.now() - startTime;
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryUsage = finalMemory - initialMemory;
        const averageTestTime = testTimes.length > 0 ? testTimes.reduce((a, b) => a + b, 0) / testTimes.length : 0;

        const metrics: TestPerformanceMetrics = {
          executionTime,
          memoryUsage,
          testCount,
          averageTestTime,
          parallelizationEfficiency: this.calculateParallelizationEfficiency(testTimes),
          cacheHitRate: this.calculateCacheHitRate()
        };

        this.performanceHistory.push(metrics);
        return metrics;
      }
    };
  }

  /**
   * Generate performance optimization report
   */
  generateOptimizationReport(): {
    currentPerformance: TestPerformanceMetrics;
    targetPerformance: typeof this.PERFORMANCE_TARGET;
    recommendations: string[];
    estimatedImprovements: any;
  } {
    const latest = this.performanceHistory[this.performanceHistory.length - 1];
    if (!latest) {
      throw new Error('No performance data available');
    }

    const analysis = this.analyzePerformance(latest);

    return {
      currentPerformance: latest,
      targetPerformance: this.PERFORMANCE_TARGET,
      recommendations: analysis.recommendations,
      estimatedImprovements: {
        timeReduction: `${Math.round(analysis.projectedImprovement * 100)}%`,
        newEstimatedTime: `${Math.round(latest.executionTime * (1 - analysis.projectedImprovement) / 1000)}s`,
        optimizations: analysis.optimizations
      }
    };
  }

  // Private helper methods

  private ensureCacheDirectory(): void {
    if (!existsSync(this.CACHE_DIR)) {
      mkdirSync(this.CACHE_DIR, { recursive: true });
    }
  }

  private loadCache(): void {
    const cacheFile = join(this.CACHE_DIR, 'test-results.json');
    if (existsSync(cacheFile)) {
      try {
        const data = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        this.cache = new Map(data);
      } catch (error) {
        console.warn('Failed to load test cache:', error);
      }
    }
  }

  private async persistCache(): Promise<void> {
    const cacheFile = join(this.CACHE_DIR, 'test-results.json');
    try {
      const data = Array.from(this.cache.entries());
      writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to persist test cache:', error);
    }
  }

  private calculateTestHash(testFile: string, dependencies: string[]): string {
    const content = [testFile, ...dependencies.sort()].join('|');
    return createHash('md5').update(content).digest('hex');
  }

  private async haveDependenciesChanged(dependencies: string[], timestamp: number): Promise<boolean> {
    for (const dep of dependencies) {
      if (existsSync(dep)) {
        const stats = require('fs').statSync(dep);
        if (stats.mtime.getTime() > timestamp) {
          return true;
        }
      }
    }
    return false;
  }

  private estimateTestCount(testFiles: string[]): number {
    // Rough estimation: 10 tests per file on average
    return testFiles.length * 10;
  }

  private async estimateTestTime(testFile: string): Promise<number> {
    // Check cache for historical data
    const cached = Array.from(this.cache.values()).find(entry => 
      entry.dependencies.includes(testFile)
    );
    
    if (cached) {
      return cached.executionTime;
    }

    // Estimate based on file size and complexity
    if (existsSync(testFile)) {
      const content = readFileSync(testFile, 'utf-8');
      const testCount = (content.match(/test\(|it\(/g) || []).length;
      return testCount * this.PERFORMANCE_TARGET.AVERAGE_TEST_TIME;
    }

    return this.PERFORMANCE_TARGET.AVERAGE_TEST_TIME;
  }

  private calculateParallelizationEfficiency(testTimes: number[]): number {
    if (testTimes.length === 0) return 0;
    
    const totalTime = testTimes.reduce((a, b) => a + b, 0);
    const maxTime = Math.max(...testTimes);
    const os = require('os');
    const idealParallelTime = totalTime / os.cpus().length;
    
    return Math.min(1, idealParallelTime / maxTime);
  }

  private calculateCacheHitRate(): number {
    const totalRequests = this.cache.size;
    if (totalRequests === 0) return 0;
    
    // This would be tracked during actual test runs
    // For now, return a placeholder based on cache size
    return Math.min(1, this.cache.size / 100);
  }
}

export default TestPerformanceOptimizer;