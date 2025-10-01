/**
 * Test Parallelization Manager
 * Implements intelligent test parallelization for improved performance
 * Requirements: 6.1, 9.1, 9.2
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { performance } from 'perf_hooks';
import { cpus } from 'os';
import { EventEmitter } from 'events';

interface TestJob {
  id: string;
  testFile: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

interface WorkerResult {
  workerId: number;
  jobId: string;
  success: boolean;
  executionTime: number;
  testResults: any;
  error?: string;
}

interface ParallelizationMetrics {
  totalTests: number;
  totalTime: number;
  averageTestTime: number;
  workerUtilization: number[];
  efficiency: number;
  bottlenecks: string[];
}

export class TestParallelizationManager extends EventEmitter {
  private workers: Worker[] = [];
  private jobQueue: TestJob[] = [];
  private activeJobs: Map<number, TestJob> = new Map();
  private completedJobs: WorkerResult[] = [];
  private workerMetrics: Map<number, { startTime: number; jobCount: number; totalTime: number }> = new Map();
  
  private readonly maxWorkers: number;
  private readonly minJobsPerWorker: number;
  private readonly performanceTargets = {
    maxTestTime: 100, // 100ms per test
    maxSuiteTime: 120000, // 2 minutes
    minEfficiency: 0.8 // 80% worker utilization
  };

  constructor(options: {
    maxWorkers?: number;
    minJobsPerWorker?: number;
    performanceMode?: 'fast' | 'balanced' | 'thorough';
  } = {}) {
    super();
    
    const cpuCount = cpus().length;
    const isCI = process.env.CI === 'true';
    
    // Optimize worker count based on environment
    this.maxWorkers = options.maxWorkers || (isCI 
      ? Math.min(2, cpuCount) // Conservative in CI
      : Math.min(4, Math.max(2, Math.floor(cpuCount * 0.75))));
    
    this.minJobsPerWorker = options.minJobsPerWorker || 5;
  }

  /**
   * Add test jobs to the parallelization queue
   */
  addTestJobs(testFiles: string[]): void {
    const jobs: TestJob[] = testFiles.map((file, index) => ({
      id: `test-${index}-${Date.now()}`,
      testFile: file,
      estimatedTime: this.estimateTestTime(file),
      priority: this.calculatePriority(file),
      dependencies: this.extractDependencies(file)
    }));

    // Sort jobs by priority and estimated time (longest first for better load balancing)
    jobs.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.estimatedTime - a.estimatedTime;
    });

    this.jobQueue.push(...jobs);
    this.emit('jobsAdded', jobs.length);
  }

  /**
   * Execute tests in parallel with intelligent load balancing
   */
  async executeParallel(): Promise<ParallelizationMetrics> {
    const startTime = performance.now();
    
    // Determine optimal worker count
    const optimalWorkers = this.calculateOptimalWorkerCount();
    
    // Initialize workers
    await this.initializeWorkers(optimalWorkers);
    
    // Start job distribution
    this.distributeJobs();
    
    // Wait for all jobs to complete
    await this.waitForCompletion();
    
    // Calculate metrics
    const metrics = this.calculateMetrics(performance.now() - startTime);
    
    // Cleanup workers
    await this.cleanup();
    
    return metrics;
  }

  /**
   * Monitor performance and adjust parallelization strategy
   */
  monitorPerformance(): {
    currentUtilization: number;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const utilization = this.calculateCurrentUtilization();
    const bottlenecks = this.identifyBottlenecks();
    const recommendations = this.generateRecommendations(utilization, bottlenecks);

    return {
      currentUtilization: utilization,
      bottlenecks,
      recommendations
    };
  }

  /**
   * Optimize test execution order for better parallelization
   */
  optimizeTestOrder(jobs: TestJob[]): TestJob[] {
    // Group tests by dependencies to minimize conflicts
    const dependencyGroups = this.groupByDependencies(jobs);
    
    // Within each group, sort by execution time (longest first)
    const optimizedJobs: TestJob[] = [];
    
    for (const group of dependencyGroups) {
      group.sort((a, b) => b.estimatedTime - a.estimatedTime);
      optimizedJobs.push(...group);
    }
    
    return optimizedJobs;
  }

  // Private methods

  private calculateOptimalWorkerCount(): number {
    const jobCount = this.jobQueue.length;
    const estimatedTotalTime = this.jobQueue.reduce((sum, job) => sum + job.estimatedTime, 0);
    
    // Don't create more workers than we have jobs
    if (jobCount < this.minJobsPerWorker) {
      return Math.min(this.maxWorkers, Math.max(1, Math.floor(jobCount / 2)));
    }
    
    // Calculate based on estimated execution time and targets
    const targetTime = this.performanceTargets.maxSuiteTime;
    const optimalWorkers = Math.ceil(estimatedTotalTime / targetTime);
    
    return Math.min(this.maxWorkers, Math.max(1, optimalWorkers));
  }

  private async initializeWorkers(workerCount: number): Promise<void> {
    const workerPromises: Promise<void>[] = [];
    
    for (let i = 0; i < workerCount; i++) {
      const workerPromise = new Promise<void>((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { workerId: i, isTestWorker: true }
        });
        
        worker.on('message', (result: WorkerResult) => {
          this.handleWorkerResult(result);
        });
        
        worker.on('error', (error) => {
          console.error(`Worker ${i} error:`, error);
          reject(error);
        });
        
        worker.on('online', () => {
          this.workers.push(worker);
          this.workerMetrics.set(i, { startTime: performance.now(), jobCount: 0, totalTime: 0 });
          resolve();
        });
      });
      
      workerPromises.push(workerPromise);
    }
    
    await Promise.all(workerPromises);
    this.emit('workersInitialized', workerCount);
  }

  private distributeJobs(): void {
    // Optimize job order before distribution
    this.jobQueue = this.optimizeTestOrder(this.jobQueue);
    
    // Distribute initial jobs to all workers
    for (let i = 0; i < this.workers.length && this.jobQueue.length > 0; i++) {
      this.assignJobToWorker(i);
    }
  }

  private assignJobToWorker(workerIndex: number): void {
    if (this.jobQueue.length === 0) return;
    
    const job = this.jobQueue.shift()!;
    const worker = this.workers[workerIndex];
    
    this.activeJobs.set(workerIndex, job);
    
    // Update worker metrics
    const metrics = this.workerMetrics.get(workerIndex)!;
    metrics.jobCount++;
    
    // Send job to worker
    worker.postMessage({
      type: 'executeTest',
      job
    });
    
    this.emit('jobAssigned', { workerId: workerIndex, jobId: job.id });
  }

  private handleWorkerResult(result: WorkerResult): void {
    this.completedJobs.push(result);
    this.activeJobs.delete(result.workerId);
    
    // Update worker metrics
    const metrics = this.workerMetrics.get(result.workerId)!;
    metrics.totalTime += result.executionTime;
    
    // Assign next job if available
    if (this.jobQueue.length > 0) {
      this.assignJobToWorker(result.workerId);
    }
    
    this.emit('jobCompleted', result);
    
    // Check if all jobs are complete
    if (this.completedJobs.length === this.getTotalJobCount()) {
      this.emit('allJobsCompleted');
    }
  }

  private async waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      this.on('allJobsCompleted', resolve);
    });
  }

  private calculateMetrics(totalTime: number): ParallelizationMetrics {
    const totalTests = this.completedJobs.length;
    const averageTestTime = totalTests > 0 
      ? this.completedJobs.reduce((sum, job) => sum + job.executionTime, 0) / totalTests 
      : 0;
    
    const workerUtilization = Array.from(this.workerMetrics.values()).map(metrics => {
      const utilization = metrics.totalTime / totalTime;
      return Math.min(1, utilization); // Cap at 100%
    });
    
    const efficiency = workerUtilization.reduce((sum, util) => sum + util, 0) / workerUtilization.length;
    const bottlenecks = this.identifyBottlenecks();
    
    return {
      totalTests,
      totalTime,
      averageTestTime,
      workerUtilization,
      efficiency,
      bottlenecks
    };
  }

  private calculateCurrentUtilization(): number {
    const activeWorkers = this.activeJobs.size;
    return activeWorkers / this.workers.length;
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    
    // Check for slow tests
    const slowTests = this.completedJobs.filter(job => 
      job.executionTime > this.performanceTargets.maxTestTime * 2
    );
    
    if (slowTests.length > 0) {
      bottlenecks.push(`${slowTests.length} slow tests detected (>${this.performanceTargets.maxTestTime * 2}ms)`);
    }
    
    // Check for worker imbalance
    const workerTimes = Array.from(this.workerMetrics.values()).map(m => m.totalTime);
    const maxTime = Math.max(...workerTimes);
    const minTime = Math.min(...workerTimes);
    
    if (maxTime > minTime * 1.5) {
      bottlenecks.push('Uneven worker load distribution detected');
    }
    
    // Check for dependency conflicts
    const dependencyConflicts = this.detectDependencyConflicts();
    if (dependencyConflicts > 0) {
      bottlenecks.push(`${dependencyConflicts} dependency conflicts causing serialization`);
    }
    
    return bottlenecks;
  }

  private generateRecommendations(utilization: number, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];
    
    if (utilization < this.performanceTargets.minEfficiency) {
      recommendations.push('Consider reducing worker count or optimizing test distribution');
    }
    
    if (bottlenecks.includes('slow tests')) {
      recommendations.push('Optimize slow tests by improving mocking and reducing I/O operations');
    }
    
    if (bottlenecks.includes('load distribution')) {
      recommendations.push('Improve test estimation accuracy for better load balancing');
    }
    
    if (bottlenecks.includes('dependency conflicts')) {
      recommendations.push('Reduce shared dependencies or implement better test isolation');
    }
    
    return recommendations;
  }

  private estimateTestTime(testFile: string): number {
    // Simple heuristic based on file size and complexity
    // In a real implementation, this would use historical data
    const baseTime = 50; // 50ms base time
    const complexityMultiplier = testFile.includes('integration') ? 3 : 1;
    return baseTime * complexityMultiplier;
  }

  private calculatePriority(testFile: string): 'high' | 'medium' | 'low' {
    if (testFile.includes('security') || testFile.includes('critical')) {
      return 'high';
    }
    if (testFile.includes('integration') || testFile.includes('e2e')) {
      return 'medium';
    }
    return 'low';
  }

  private extractDependencies(testFile: string): string[] {
    // Simple dependency extraction - in practice, this would analyze imports
    return [testFile];
  }

  private groupByDependencies(jobs: TestJob[]): TestJob[][] {
    const groups: Map<string, TestJob[]> = new Map();
    
    for (const job of jobs) {
      const key = job.dependencies.sort().join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(job);
    }
    
    return Array.from(groups.values());
  }

  private detectDependencyConflicts(): number {
    // Simplified conflict detection
    const dependencyMap = new Map<string, number>();
    
    for (const job of this.jobQueue) {
      for (const dep of job.dependencies) {
        dependencyMap.set(dep, (dependencyMap.get(dep) || 0) + 1);
      }
    }
    
    return Array.from(dependencyMap.values()).filter(count => count > 1).length;
  }

  private getTotalJobCount(): number {
    return this.completedJobs.length + this.activeJobs.size + this.jobQueue.length;
  }

  private async cleanup(): Promise<void> {
    const terminationPromises = this.workers.map(worker => {
      return new Promise<void>((resolve) => {
        worker.terminate().then(() => resolve());
      });
    });
    
    await Promise.all(terminationPromises);
    this.workers = [];
    this.workerMetrics.clear();
  }
}

// Worker thread implementation
if (!isMainThread && workerData?.isTestWorker) {
  parentPort?.on('message', async (message) => {
    if (message.type === 'executeTest') {
      const startTime = performance.now();
      
      try {
        // Execute the test (this would integrate with Vitest)
        const testResults = await executeTestFile(message.job.testFile);
        
        const result: WorkerResult = {
          workerId: workerData.workerId,
          jobId: message.job.id,
          success: true,
          executionTime: performance.now() - startTime,
          testResults
        };
        
        parentPort?.postMessage(result);
      } catch (error) {
        const result: WorkerResult = {
          workerId: workerData.workerId,
          jobId: message.job.id,
          success: false,
          executionTime: performance.now() - startTime,
          testResults: null,
          error: error instanceof Error ? error.message : String(error)
        };
        
        parentPort?.postMessage(result);
      }
    }
  });
}

// Mock test execution function (would be replaced with actual Vitest integration)
async function executeTestFile(testFile: string): Promise<any> {
  // This would integrate with Vitest's programmatic API
  return { testFile, passed: true, duration: Math.random() * 100 };
}

export default TestParallelizationManager;