/**
 * Test Data Persistence
 * 
 * Handles persistence of test run data for historical analysis and reliability tracking.
 * Supports both file-based and in-memory storage for different environments.
 */

import fs from 'fs/promises';
import path from 'path';
import type { TestRun, TestSuite, ReliabilityMetrics } from './reliability-tracker';

export interface PersistedTestData {
  testRuns: TestRun[];
  testSuites: TestSuite[];
  metadata: {
    version: string;
    lastUpdated: Date;
    totalBuilds: number;
    environment: string;
  };
}

export interface PersistenceConfig {
  dataDir: string;
  maxHistoryDays: number;
  compressionEnabled: boolean;
  backupEnabled: boolean;
}

export class TestDataPersistence {
  private readonly config: PersistenceConfig;
  private readonly DATA_VERSION = '1.0.0';

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      dataDir: config.dataDir || './test-results/history',
      maxHistoryDays: config.maxHistoryDays || 30,
      compressionEnabled: config.compressionEnabled || false,
      backupEnabled: config.backupEnabled || true,
      ...config
    };
  }

  /**
   * Save test data to persistent storage
   */
  async saveTestData(data: PersistedTestData): Promise<void> {
    try {
      await this.ensureDataDirectory();
      
      const filename = this.generateFilename();
      const filepath = path.join(this.config.dataDir, filename);
      
      // Add metadata
      const dataWithMetadata: PersistedTestData = {
        ...data,
        metadata: {
          version: this.DATA_VERSION,
          lastUpdated: new Date(),
          totalBuilds: data.testSuites.length,
          environment: process.env.NODE_ENV || 'development'
        }
      };

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createBackup(filepath);
      }

      // Save data
      const jsonData = JSON.stringify(dataWithMetadata, null, 2);
      await fs.writeFile(filepath, jsonData, 'utf8');

      // Cleanup old files
      await this.cleanupOldFiles();
      
    } catch (error) {
      console.error('Failed to save test data:', error);
      throw new Error(`Test data persistence failed: ${error}`);
    }
  }

  /**
   * Load test data from persistent storage
   */
  async loadTestData(): Promise<PersistedTestData | null> {
    try {
      const latestFile = await this.getLatestDataFile();
      if (!latestFile) {
        return null;
      }

      const filepath = path.join(this.config.dataDir, latestFile);
      const jsonData = await fs.readFile(filepath, 'utf8');
      const data: PersistedTestData = JSON.parse(jsonData);

      // Validate data version
      if (data.metadata?.version !== this.DATA_VERSION) {
        console.warn(`Data version mismatch: expected ${this.DATA_VERSION}, got ${data.metadata?.version}`);
      }

      // Convert date strings back to Date objects
      return this.deserializeDates(data);
      
    } catch (error) {
      console.error('Failed to load test data:', error);
      return null;
    }
  }

  /**
   * Load test data for a specific date range
   */
  async loadTestDataRange(startDate: Date, endDate: Date): Promise<PersistedTestData[]> {
    try {
      const files = await this.getDataFilesInRange(startDate, endDate);
      const dataPromises = files.map(async (filename) => {
        const filepath = path.join(this.config.dataDir, filename);
        const jsonData = await fs.readFile(filepath, 'utf8');
        return this.deserializeDates(JSON.parse(jsonData));
      });

      return await Promise.all(dataPromises);
      
    } catch (error) {
      console.error('Failed to load test data range:', error);
      return [];
    }
  }

  /**
   * Get reliability metrics for a specific time period
   */
  async getHistoricalMetrics(days: number = 7): Promise<{
    dailyReliability: Array<{ date: string; reliability: number }>;
    trends: ReliabilityMetrics;
    summary: {
      averageReliability: number;
      bestDay: { date: string; reliability: number };
      worstDay: { date: string; reliability: number };
    };
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historicalData = await this.loadTestDataRange(startDate, endDate);
    
    if (historicalData.length === 0) {
      return {
        dailyReliability: [],
        trends: {
          overallReliability: 0,
          trend: [],
          flakyTests: [],
          buildWindow: 0,
          totalBuilds: 0
        },
        summary: {
          averageReliability: 0,
          bestDay: { date: '', reliability: 0 },
          worstDay: { date: '', reliability: 0 }
        }
      };
    }

    // Calculate daily reliability
    const dailyReliability = historicalData.map(data => {
      const totalTests = data.testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
      const passedTests = data.testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
      const reliability = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      return {
        date: data.metadata.lastUpdated.toISOString().split('T')[0],
        reliability
      };
    });

    // Calculate summary statistics
    const reliabilities = dailyReliability.map(d => d.reliability);
    const averageReliability = reliabilities.reduce((sum, r) => sum + r, 0) / reliabilities.length;
    
    const bestDay = dailyReliability.reduce((best, current) => 
      current.reliability > best.reliability ? current : best
    );
    
    const worstDay = dailyReliability.reduce((worst, current) => 
      current.reliability < worst.reliability ? current : worst
    );

    // Aggregate trends
    const allTestSuites = historicalData.flatMap(data => data.testSuites);
    const trends: ReliabilityMetrics = {
      overallReliability: averageReliability,
      trend: reliabilities,
      flakyTests: [], // Would need to aggregate from reliability tracker
      buildWindow: allTestSuites.length,
      totalBuilds: allTestSuites.length
    };

    return {
      dailyReliability,
      trends,
      summary: {
        averageReliability,
        bestDay,
        worstDay
      }
    };
  }

  /**
   * Export test data for external analysis
   */
  async exportTestData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = await this.loadTestData();
    if (!data) {
      throw new Error('No test data available for export');
    }

    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Clear all persisted test data
   */
  async clearAllData(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.dataDir);
      const deletePromises = files
        .filter(file => file.endsWith('.json'))
        .map(file => fs.unlink(path.join(this.config.dataDir, file)));
      
      await Promise.all(deletePromises);
      
    } catch (error) {
      console.error('Failed to clear test data:', error);
      throw new Error(`Failed to clear test data: ${error}`);
    }
  }

  // Private helper methods

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.config.dataDir);
    } catch {
      await fs.mkdir(this.config.dataDir, { recursive: true });
    }
  }

  private generateFilename(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const buildNumber = process.env.BUILD_NUMBER || Date.now();
    return `test-data-${timestamp}-${buildNumber}.json`;
  }

  private async getLatestDataFile(): Promise<string | null> {
    try {
      const files = await fs.readdir(this.config.dataDir);
      const dataFiles = files
        .filter(file => file.startsWith('test-data-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      return dataFiles[0] || null;
      
    } catch {
      return null;
    }
  }

  private async getDataFilesInRange(startDate: Date, endDate: Date): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.dataDir);
      const dataFiles = files.filter(file => 
        file.startsWith('test-data-') && file.endsWith('.json')
      );

      // Filter files by date range (approximate based on filename)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      return dataFiles.filter(file => {
        const dateMatch = file.match(/test-data-(\d{4}-\d{2}-\d{2})-/);
        if (!dateMatch) return false;
        
        const fileDate = dateMatch[1];
        return fileDate >= startDateStr && fileDate <= endDateStr;
      }).sort();
      
    } catch {
      return [];
    }
  }

  private async createBackup(filepath: string): Promise<void> {
    try {
      const backupPath = `${filepath}.backup`;
      await fs.access(filepath);
      await fs.copyFile(filepath, backupPath);
    } catch {
      // File doesn't exist yet, no backup needed
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxHistoryDays);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const files = await fs.readdir(this.config.dataDir);
      const oldFiles = files.filter(file => {
        const dateMatch = file.match(/test-data-(\d{4}-\d{2}-\d{2})-/);
        return dateMatch && dateMatch[1] < cutoffDateStr;
      });

      const deletePromises = oldFiles.map(file => 
        fs.unlink(path.join(this.config.dataDir, file))
      );
      
      await Promise.all(deletePromises);
      
    } catch (error) {
      console.warn('Failed to cleanup old test data files:', error);
    }
  }

  private deserializeDates(data: PersistedTestData): PersistedTestData {
    return {
      ...data,
      metadata: {
        ...data.metadata,
        lastUpdated: new Date(data.metadata.lastUpdated)
      },
      testRuns: data.testRuns.map(run => ({
        ...run,
        timestamp: new Date(run.timestamp)
      })),
      testSuites: data.testSuites.map(suite => ({
        ...suite,
        timestamp: new Date(suite.timestamp)
      }))
    };
  }

  private convertToCSV(data: PersistedTestData): string {
    const headers = [
      'Date',
      'Build Number',
      'Total Tests',
      'Passed Tests',
      'Failed Tests',
      'Skipped Tests',
      'Duration (ms)',
      'Reliability %'
    ];

    const rows = data.testSuites.map(suite => {
      const reliability = suite.totalTests > 0 ? 
        (suite.passedTests / suite.totalTests) * 100 : 0;
      
      return [
        suite.timestamp.toISOString(),
        suite.buildNumber.toString(),
        suite.totalTests.toString(),
        suite.passedTests.toString(),
        suite.failedTests.toString(),
        suite.skippedTests.toString(),
        suite.duration.toString(),
        reliability.toFixed(2)
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Singleton instance for global use
export const testDataPersistence = new TestDataPersistence();