/**
 * Performance monitoring dashboard for development
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { performanceMonitor } from '@/utils/performance';
import { bundleAnalyzer } from '@/utils/bundleAnalyzer';
import { Activity, Zap, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  threshold: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [bundleReport, setBundleReport] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        // Get performance summary
        const summary = performanceMonitor.getSummary();
        
        // Get bundle analysis
        const bundle = await bundleAnalyzer.analyzeBundlePerformance();
        setBundleReport(bundle);

        // Convert to metrics format
        const performanceMetrics: PerformanceMetric[] = [
          {
            name: 'First Contentful Paint',
            value: summary.coreWebVitals.FCP || 0,
            unit: 'ms',
            status: getStatus(summary.coreWebVitals.FCP, 1800, 3000),
            threshold: 1800
          },
          {
            name: 'Largest Contentful Paint',
            value: summary.coreWebVitals.LCP || 0,
            unit: 'ms',
            status: getStatus(summary.coreWebVitals.LCP, 2500, 4000),
            threshold: 2500
          },
          {
            name: 'First Input Delay',
            value: summary.coreWebVitals.FID || 0,
            unit: 'ms',
            status: getStatus(summary.coreWebVitals.FID, 100, 300),
            threshold: 100
          },
          {
            name: 'Cumulative Layout Shift',
            value: summary.coreWebVitals.CLS || 0,
            unit: '',
            status: getStatus(summary.coreWebVitals.CLS, 0.1, 0.25),
            threshold: 0.1
          },
          {
            name: 'Bundle Size',
            value: Math.round(summary.bundleSize / 1024),
            unit: 'KB',
            status: getStatus(summary.bundleSize, 500000, 1000000),
            threshold: 500
          }
        ];

        setMetrics(performanceMetrics);
      } catch (error) {
        console.error('Failed to load performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPerformanceData();

    // Refresh every 10 seconds
    const interval = setInterval(loadPerformanceData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (value: number, goodThreshold: number, poorThreshold: number): 'good' | 'warning' | 'poor' => {
    if (!value) return 'good';
    if (value <= goodThreshold) return 'good';
    if (value <= poorThreshold) return 'warning';
    return 'poor';
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">
              {bundleReport?.score || 0}
            </div>
            <div className="flex-1">
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${bundleReport?.score || 0}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Overall performance score
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Core Web Vitals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  {getStatusIcon(metric.status)}
                </div>
                <div className="text-2xl font-bold">
                  {metric.value.toFixed(metric.name.includes('Layout') ? 3 : 0)}
                  <span className="text-sm font-normal ml-1">{metric.unit}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  Threshold: {metric.threshold}{metric.unit}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bundle Analysis */}
      {bundleReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Bundle Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Bundle Size</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Size:</span>
                    <span className="font-medium">
                      {Math.round(bundleReport.totalSize / 1024)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Gzipped:</span>
                    <span className="font-medium">
                      {Math.round(bundleReport.totalGzipSize / 1024)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Chunks:</span>
                    <span className="font-medium">{bundleReport.chunks.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Top Chunks</h4>
                <div className="space-y-2">
                  {bundleReport.chunks
                    .sort((a: any, b: any) => b.size - a.size)
                    .slice(0, 5)
                    .map((chunk: any) => (
                      <div key={chunk.name} className="flex justify-between text-sm">
                        <span className="truncate flex-1 mr-2">{chunk.name}</span>
                        <span className="font-medium">
                          {Math.round(chunk.size / 1024)} KB
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {bundleReport?.recommendations && bundleReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bundleReport.recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Performance Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Refresh Metrics
            </button>
            <button
              onClick={() => {
                if (window.performance && window.performance.clearResourceTimings) {
                  window.performance.clearResourceTimings();
                }
                performanceMonitor.clearMetrics();
              }}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
            >
              Clear Cache
            </button>
            <button
              onClick={() => {
                const data = performanceMonitor.exportMetrics();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'performance-metrics.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
            >
              Export Data
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for performance monitoring in components
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = React.useState<any>(null);

  React.useEffect(() => {
    const updateMetrics = () => {
      const summary = performanceMonitor.getSummary();
      setMetrics(summary);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
};