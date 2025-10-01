import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { databaseOptimizer } from '@/utils/performance/databaseOptimizer';
import { intelligentCache } from '@/utils/performance/intelligentCache';
import { predictivePrefetcher, usePredictivePrefetch } from '@/utils/performance/predictivePrefetch';
import { lazyLoadMonitor } from '@/utils/performance/advancedLazyLoad';
import { routePreloader } from '@/utils/performance/routePreloader';

interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  routeLoadTime?: number;
  cacheHitRate?: number;
  prefetchAccuracy?: number;
  databaseQueryTime?: number;
}

export const PerformanceMonitor: React.FC<{ className?: string }> = ({ className }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { getAnalytics: getPrefetchAnalytics } = usePredictivePrefetch();

  useEffect(() => {
    const updateMetrics = () => {
      // Get Core Web Vitals
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        const navigationEntries = performance.getEntriesByType('navigation');
        
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime;
        const ttfb = navigationEntries[0]?.responseStart;
        
        setMetrics(prev => ({
          ...prev,
          fcp,
          ttfb
        }));
      }

      // Get cache analytics
      const cacheAnalytics = intelligentCache.getCacheAnalytics();
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheAnalytics.cacheHitRate * 100
      }));

      // Get database performance
      const dbAnalytics = databaseOptimizer.getPerformanceAnalytics();
      const avgDbTime = dbAnalytics.reduce((sum, a) => sum + a.avgExecutionTime, 0) / dbAnalytics.length;
      setMetrics(prev => ({
        ...prev,
        databaseQueryTime: avgDbTime
      }));
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPerformanceScore = (): number => {
    let score = 100;
    
    // FCP scoring (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
    if (metrics.fcp) {
      if (metrics.fcp > 3000) score -= 20;
      else if (metrics.fcp > 1800) score -= 10;
    }
    
    // Cache hit rate scoring
    if (metrics.cacheHitRate !== undefined) {
      if (metrics.cacheHitRate < 50) score -= 15;
      else if (metrics.cacheHitRate < 70) score -= 8;
    }
    
    // Database performance scoring
    if (metrics.databaseQueryTime) {
      if (metrics.databaseQueryTime > 100) score -= 15;
      else if (metrics.databaseQueryTime > 50) score -= 8;
    }
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (time?: number): string => {
    if (!time) return 'N/A';
    return `${Math.round(time)}ms`;
  };

  const formatPercentage = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value)}%`;
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          📊 Performance
        </Button>
      </div>
    );
  }

  const performanceScore = getPerformanceScore();
  const cacheAnalytics = intelligentCache.getCacheAnalytics();
  const prefetchAnalytics = getPrefetchAnalytics();
  const dbAnalytics = databaseOptimizer.getPerformanceAnalytics();
  const routeStats = routePreloader.getPreloadStats();
  const lazyLoadStats = lazyLoadMonitor.getMetrics();

  return (
    <div className={`fixed inset-4 z-50 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Performance Monitor</h2>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
        >
          ✕
        </Button>
      </div>

      <div className="p-4 max-h-[calc(100vh-8rem)] overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="prefetch">Prefetch</TabsTrigger>
            <TabsTrigger value="lazy-load">Lazy Load</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Performance Score
                  <Badge className={getScoreColor(performanceScore)}>
                    {performanceScore}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={performanceScore} className="mb-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">First Contentful Paint:</span>
                    <span className="ml-2 font-mono">{formatTime(metrics.fcp)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time to First Byte:</span>
                    <span className="ml-2 font-mono">{formatTime(metrics.ttfb)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cache Hit Rate:</span>
                    <span className="ml-2 font-mono">{formatPercentage(metrics.cacheHitRate)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg DB Query:</span>
                    <span className="ml-2 font-mono">{formatTime(metrics.databaseQueryTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Route Preloading</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{routeStats.length}</div>
                  <div className="text-xs text-muted-foreground">Routes preloaded</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Lazy Loading</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lazyLoadStats.length}</div>
                  <div className="text-xs text-muted-foreground">Components loaded</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Requests:</span>
                    <span className="font-mono">{cacheAnalytics.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="font-mono">{formatPercentage(cacheAnalytics.cacheHitRate * 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Load Time:</span>
                    <span className="font-mono">{formatTime(cacheAnalytics.averageLoadTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(cacheAnalytics.strategiesPerformance).map(([strategy, stats]) => (
                    <div key={strategy} className="flex justify-between items-center">
                      <span className="text-sm">{strategy}:</span>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatPercentage((stats as any).hitRate * 100)}</div>
                        <div className="text-xs text-muted-foreground">{(stats as any).requests} requests</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dbAnalytics.map((analytic) => (
                    <div key={analytic.storeName} className="flex justify-between items-center">
                      <span className="text-sm">{analytic.storeName}:</span>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatTime(analytic.avgExecutionTime)}</div>
                        <div className="text-xs text-muted-foreground">
                          {analytic.totalQueries} queries, {formatPercentage(analytic.indexUsageRate)} indexed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {databaseOptimizer.getOptimizationRecommendations().slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                        {rec.impact}
                      </Badge>
                      <span className="ml-2">{rec.recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prefetch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Prefetching</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>User Actions Recorded:</span>
                    <span className="font-mono">{prefetchAnalytics.totalActions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prediction Models:</span>
                    <span className="font-mono">{prefetchAnalytics.modelsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prefetch Queue:</span>
                    <span className="font-mono">{prefetchAnalytics.queueSize}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <Badge variant="outline">{prefetchAnalytics.networkConditions.bandwidth}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>WiFi:</span>
                    <Badge variant={prefetchAnalytics.networkConditions.isOnWifi ? 'default' : 'secondary'}>
                      {prefetchAnalytics.networkConditions.isOnWifi ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Battery:</span>
                    <span className="font-mono">{formatPercentage(prefetchAnalytics.networkConditions.batteryLevel * 100)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prefetchAnalytics.topPredictions.map((prediction, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{prediction.url}</span>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {prediction.priority}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatPercentage(prediction.confidence * 100)} confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lazy-load" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lazy Loading Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lazyLoadStats.map((stat) => (
                    <div key={stat.componentName} className="flex justify-between items-center">
                      <span className="text-sm">{stat.componentName}:</span>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatTime(stat.loadTime)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercentage(stat.successRate * 100)} success rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Route Preload Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {routeStats.slice(0, 5).map((stat) => (
                    <div key={stat.route} className="flex justify-between items-center">
                      <span className="text-sm">{stat.route}:</span>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatTime(stat.preloadTime)}</div>
                        <div className="text-xs text-muted-foreground">
                          Hit rate: {formatPercentage(stat.hitRate * 100)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => {
              intelligentCache.clearAllCaches();
              databaseOptimizer.clearMetrics();
              predictivePrefetcher.clearPredictionData();
              lazyLoadMonitor.clearMetrics();
            }}
            variant="outline"
            size="sm"
          >
            Clear All Data
          </Button>
          <Button
            onClick={() => {
              const data = {
                cache: intelligentCache.getCacheAnalytics(),
                database: databaseOptimizer.exportPerformanceData(),
                prefetch: predictivePrefetcher.exportPredictionData(),
                lazyLoad: lazyLoadMonitor.getMetrics(),
                routes: routePreloader.getPreloadStats()
              };
              
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            variant="outline"
            size="sm"
          >
            Export Data
          </Button>
        </div>
      </div>
    </div>
  );
};