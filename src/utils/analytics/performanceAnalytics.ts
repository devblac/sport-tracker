/**
 * Performance analytics and reporting
 * Collects and analyzes performance data for insights
 */

import { performanceMonitor, PerformanceMetric } from '../monitoring/performanceMonitoring';
import { errorTracker } from '../monitoring/errorTracking';

export interface PerformanceReport {
  timestamp: Date;
  url: string;
  userId?: string;
  sessionId: string;
  metrics: {
    webVitals: WebVitalsReport;
    customMetrics: CustomMetricsReport;
    resourceTiming: ResourceTimingReport;
    userTiming: UserTimingReport;
  };
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
}

export interface WebVitalsReport {
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
  ratings: Record<string, 'good' | 'needs-improvement' | 'poor'>;
}

export interface CustomMetricsReport {
  routeChangeTime: number[];
  apiResponseTimes: { endpoint: string; time: number; status: number }[];
  componentRenderTimes: { component: string; time: number }[];
  functionExecutionTimes: { function: string; time: number }[];
}

export interface ResourceTimingReport {
  totalResources: number;
  totalSize: number;
  slowestResources: { name: string; duration: number; size: number }[];
  resourceTypes: Record<string, { count: number; totalTime: number; totalSize: number }>;
}

export interface UserTimingReport {
  marks: { name: string; time: number }[];
  measures: { name: string; duration: number }[];
}

export interface DeviceInfo {
  userAgent: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  hardwareConcurrency: number;
  memory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

export interface NetworkInfo {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class PerformanceAnalytics {
  private sessionId: string;
  private reportInterval = 60000; // 1 minute
  private reportTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;
    this.startPeriodicReporting();
    this.setupBeforeUnloadReporting();
    
    console.log('Performance analytics initialized', { sessionId: this.sessionId });
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicReporting() {
    this.reportTimer = setInterval(() => {
      this.generateAndSendReport();
    }, this.reportInterval);
  }

  private setupBeforeUnloadReporting() {
    window.addEventListener('beforeunload', () => {
      this.generateAndSendReport(true);
    });

    // Also report on visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.generateAndSendReport(true);
      }
    });
  }

  private async generateAndSendReport(isBeforeUnload = false) {
    try {
      const report = await this.generatePerformanceReport();
      await this.sendReport(report, isBeforeUnload);
    } catch (error) {
      errorTracker.captureError(error as Error, {
        additionalData: { context: 'performance-analytics-report' }
      });
    }
  }

  private async generatePerformanceReport(): Promise<PerformanceReport> {
    const metrics = performanceMonitor.getMetrics();
    
    return {
      timestamp: new Date(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      metrics: {
        webVitals: this.analyzeWebVitals(metrics),
        customMetrics: this.analyzeCustomMetrics(metrics),
        resourceTiming: this.analyzeResourceTiming(),
        userTiming: this.analyzeUserTiming()
      },
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo()
    };
  }

  private analyzeWebVitals(metrics: PerformanceMetric[]): WebVitalsReport {
    const webVitalMetrics = metrics.filter(m => m.tags?.type === 'web-vital');
    const report: WebVitalsReport = { ratings: {} };

    for (const metric of webVitalMetrics) {
      const vitalName = metric.tags?.vital?.toLowerCase();
      if (vitalName) {
        (report as any)[vitalName] = metric.value;
        report.ratings[vitalName] = metric.tags?.rating || 'good';
      }
    }

    return report;
  }

  private analyzeCustomMetrics(metrics: PerformanceMetric[]): CustomMetricsReport {
    const routeChanges = metrics.filter(m => m.name === 'route-change-time');
    const apiCalls = metrics.filter(m => m.name === 'api-response-time');
    const componentRenders = metrics.filter(m => m.name === 'component-render-time');
    const functionCalls = metrics.filter(m => m.tags?.type === 'function');

    return {
      routeChangeTime: routeChanges.map(m => m.value),
      apiResponseTimes: apiCalls.map(m => ({
        endpoint: m.tags?.endpoint || 'unknown',
        time: m.value,
        status: parseInt(m.tags?.status || '0')
      })),
      componentRenderTimes: componentRenders.map(m => ({
        component: m.tags?.component || 'unknown',
        time: m.value
      })),
      functionExecutionTimes: functionCalls.map(m => ({
        function: m.name,
        time: m.value
      }))
    };
  }

  private analyzeResourceTiming(): ResourceTimingReport {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return {
        totalResources: 0,
        totalSize: 0,
        slowestResources: [],
        resourceTypes: {}
      };
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const slowestResources = resources
      .map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize || 0
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const resourceTypes: Record<string, { count: number; totalTime: number; totalSize: number }> = {};
    
    for (const resource of resources) {
      const type = resource.initiatorType || 'other';
      if (!resourceTypes[type]) {
        resourceTypes[type] = { count: 0, totalTime: 0, totalSize: 0 };
      }
      resourceTypes[type].count++;
      resourceTypes[type].totalTime += resource.duration;
      resourceTypes[type].totalSize += resource.transferSize || 0;
    }

    return {
      totalResources: resources.length,
      totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      slowestResources,
      resourceTypes
    };
  }

  private analyzeUserTiming(): UserTimingReport {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return { marks: [], measures: [] };
    }

    const marks = performance.getEntriesByType('mark').map(m => ({
      name: m.name,
      time: m.startTime
    }));

    const measures = performance.getEntriesByType('measure').map(m => ({
      name: m.name,
      duration: m.duration
    }));

    return { marks, measures };
  }

  private getDeviceInfo(): DeviceInfo {
    const nav = navigator as any;
    
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      memory: nav.deviceMemory,
      connection: nav.connection ? {
        effectiveType: nav.connection.effectiveType,
        downlink: nav.connection.downlink,
        rtt: nav.connection.rtt
      } : undefined
    };
  }

  private getNetworkInfo(): NetworkInfo {
    const nav = navigator as any;
    const connection = nav.connection;
    
    if (!connection) return {};
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  private async sendReport(report: PerformanceReport, isBeforeUnload = false) {
    try {
      // Store locally first
      await this.storeReportLocally(report);
      
      // Send to analytics service
      if (navigator.onLine) {
        await this.sendToAnalyticsService(report, isBeforeUnload);
      }
    } catch (error) {
      console.warn('Failed to send performance report:', error);
    }
  }

  private async storeReportLocally(report: PerformanceReport) {
    const dbName = 'sport-tracker-analytics';
    const storeName = 'performance-reports';
    
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        store.add({
          ...report,
          id: `${report.sessionId}-${Date.now()}`,
          sent: false
        });
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('sessionId', 'sessionId');
          store.createIndex('sent', 'sent');
        }
      };
    });
  }

  private async sendToAnalyticsService(report: PerformanceReport, isBeforeUnload = false) {
    const endpoint = '/api/analytics/performance';
    
    if (isBeforeUnload && 'sendBeacon' in navigator) {
      // Use sendBeacon for reliable delivery during page unload
      navigator.sendBeacon(endpoint, JSON.stringify(report));
    } else {
      // Use regular fetch
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.statusText}`);
      }
    }
  }

  // Public API for custom performance tracking
  markStart(name: string) {
    if ('performance' in window && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  markEnd(name: string) {
    if ('performance' in window && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }

  // Track specific user interactions
  trackUserInteraction(action: string, element?: string, value?: number) {
    performanceMonitor.recordMetric({
      name: 'user-interaction',
      value: value || Date.now(),
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: {
        type: 'interaction',
        action,
        element: element || 'unknown'
      }
    });
  }

  // Track business metrics
  trackBusinessMetric(name: string, value: number, tags?: Record<string, string>) {
    performanceMonitor.recordMetric({
      name: `business-${name}`,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
      tags: {
        type: 'business',
        ...tags
      }
    });
  }

  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.id;
      }
    } catch (e) {
      // Ignore errors when getting user ID
    }
    return undefined;
  }

  destroy() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    // Send final report
    this.generateAndSendReport(true);
  }
}

// Singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

// React hook for performance analytics
export function usePerformanceAnalytics() {
  return {
    markStart: performanceAnalytics.markStart.bind(performanceAnalytics),
    markEnd: performanceAnalytics.markEnd.bind(performanceAnalytics),
    trackUserInteraction: performanceAnalytics.trackUserInteraction.bind(performanceAnalytics),
    trackBusinessMetric: performanceAnalytics.trackBusinessMetric.bind(performanceAnalytics)
  };
}