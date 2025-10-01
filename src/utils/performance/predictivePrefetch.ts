/**
 * Predictive Prefetching System
 * Uses machine learning-like algorithms to predict and prefetch user's next actions
 */

interface UserAction {
  type: 'navigation' | 'click' | 'hover' | 'scroll' | 'search';
  target: string;
  timestamp: number;
  context: {
    currentRoute: string;
    timeOfDay: number;
    dayOfWeek: number;
    sessionDuration: number;
    previousActions: string[];
  };
}

interface PrefetchRule {
  id: string;
  name: string;
  condition: (context: UserAction['context']) => boolean;
  targets: string[];
  priority: number;
  confidence: number;
  enabled: boolean;
}

interface PredictionModel {
  route: string;
  nextRoutes: Map<string, number>; // route -> probability
  timePatterns: Map<number, string[]>; // hour -> likely routes
  sequencePatterns: Map<string, string[]>; // sequence -> next routes
  userSpecificPatterns: Map<string, number>; // pattern -> weight
}

interface PrefetchTask {
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  reason: string;
  estimatedSize: number;
  dependencies?: string[];
}

class PredictivePrefetcher {
  private static instance: PredictivePrefetcher;
  private userActions: UserAction[] = [];
  private predictionModels = new Map<string, PredictionModel>();
  private prefetchQueue: PrefetchTask[] = [];
  private isProcessing = false;
  private sessionStartTime = Date.now();
  private currentBandwidth = 'unknown';
  private batteryLevel = 1;
  private isOnWifi = true;

  private prefetchRules: PrefetchRule[] = [
    {
      id: 'workout-flow',
      name: 'Workout Flow Prediction',
      condition: (context) => context.currentRoute === '/workout',
      targets: ['/exercises', '/workout-player'],
      priority: 9,
      confidence: 0.85,
      enabled: true
    },
    {
      id: 'exercise-detail',
      name: 'Exercise Detail Prediction',
      condition: (context) => context.currentRoute === '/exercises',
      targets: ['/exercise-detail', '/workout'],
      priority: 8,
      confidence: 0.75,
      enabled: true
    },
    {
      id: 'post-workout',
      name: 'Post-Workout Flow',
      condition: (context) => context.currentRoute === '/workout-player',
      targets: ['/workout-summary', '/progress', '/social'],
      priority: 9,
      confidence: 0.9,
      enabled: true
    },
    {
      id: 'social-engagement',
      name: 'Social Engagement Pattern',
      condition: (context) => context.currentRoute === '/social',
      targets: ['/profile', '/friends', '/challenges'],
      priority: 6,
      confidence: 0.6,
      enabled: true
    },
    {
      id: 'progress-analysis',
      name: 'Progress Analysis Pattern',
      condition: (context) => context.currentRoute === '/progress',
      targets: ['/analytics', '/exercises', '/workout'],
      priority: 7,
      confidence: 0.7,
      enabled: true
    },
    {
      id: 'morning-workout',
      name: 'Morning Workout Pattern',
      condition: (context) => context.timeOfDay >= 6 && context.timeOfDay <= 10,
      targets: ['/workout', '/exercises'],
      priority: 8,
      confidence: 0.8,
      enabled: true
    },
    {
      id: 'evening-review',
      name: 'Evening Review Pattern',
      condition: (context) => context.timeOfDay >= 18 && context.timeOfDay <= 22,
      targets: ['/progress', '/social'],
      priority: 6,
      confidence: 0.65,
      enabled: true
    }
  ];

  static getInstance(): PredictivePrefetcher {
    if (!PredictivePrefetcher.instance) {
      PredictivePrefetcher.instance = new PredictivePrefetcher();
    }
    return PredictivePrefetcher.instance;
  }

  constructor() {
    this.initializeNetworkDetection();
    this.initializeBatteryDetection();
    this.loadUserPatterns();
    this.startPredictionEngine();
  }

  private async initializeNetworkDetection(): Promise<void> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.currentBandwidth = connection.effectiveType || 'unknown';
      this.isOnWifi = connection.type === 'wifi';
      
      connection.addEventListener('change', () => {
        this.currentBandwidth = connection.effectiveType;
        this.isOnWifi = connection.type === 'wifi';
        this.adjustPrefetchingStrategy();
      });
    }
  }

  private async initializeBatteryDetection(): Promise<void> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        this.batteryLevel = battery.level;
        
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.adjustPrefetchingStrategy();
        });
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }
  }

  private loadUserPatterns(): void {
    try {
      const stored = localStorage.getItem('predictive-prefetch-patterns');
      if (stored) {
        const patterns = JSON.parse(stored);
        for (const [route, model] of Object.entries(patterns)) {
          this.predictionModels.set(route, {
            route,
            nextRoutes: new Map(Object.entries((model as any).nextRoutes || {})),
            timePatterns: new Map(Object.entries((model as any).timePatterns || {})),
            sequencePatterns: new Map(Object.entries((model as any).sequencePatterns || {})),
            userSpecificPatterns: new Map(Object.entries((model as any).userSpecificPatterns || {}))
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load user patterns:', error);
    }
  }

  private saveUserPatterns(): void {
    try {
      const patterns: any = {};
      for (const [route, model] of this.predictionModels.entries()) {
        patterns[route] = {
          route: model.route,
          nextRoutes: Object.fromEntries(model.nextRoutes),
          timePatterns: Object.fromEntries(model.timePatterns),
          sequencePatterns: Object.fromEntries(model.sequencePatterns),
          userSpecificPatterns: Object.fromEntries(model.userSpecificPatterns)
        };
      }
      localStorage.setItem('predictive-prefetch-patterns', JSON.stringify(patterns));
    } catch (error) {
      console.warn('Failed to save user patterns:', error);
    }
  }

  private startPredictionEngine(): void {
    // Update predictions every 30 seconds
    setInterval(() => {
      this.updatePredictions();
    }, 30000);

    // Save patterns every 5 minutes
    setInterval(() => {
      this.saveUserPatterns();
    }, 5 * 60 * 1000);

    // Process prefetch queue every 10 seconds
    setInterval(() => {
      this.processPrefetchQueue();
    }, 10000);
  }

  /**
   * Record user action for learning
   */
  recordUserAction(
    type: UserAction['type'],
    target: string,
    currentRoute: string
  ): void {
    const now = Date.now();
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const sessionDuration = now - this.sessionStartTime;
    
    const recentActions = this.userActions
      .filter(action => now - action.timestamp < 60000) // Last minute
      .map(action => action.target)
      .slice(-5); // Last 5 actions

    const action: UserAction = {
      type,
      target,
      timestamp: now,
      context: {
        currentRoute,
        timeOfDay,
        dayOfWeek,
        sessionDuration,
        previousActions: recentActions
      }
    };

    this.userActions.push(action);
    
    // Keep only last 1000 actions
    if (this.userActions.length > 1000) {
      this.userActions = this.userActions.slice(-1000);
    }

    this.updatePredictionModel(action);
    this.triggerImmediatePrediction(action);
  }

  private updatePredictionModel(action: UserAction): void {
    const { currentRoute, timeOfDay } = action.context;
    
    let model = this.predictionModels.get(currentRoute);
    if (!model) {
      model = {
        route: currentRoute,
        nextRoutes: new Map(),
        timePatterns: new Map(),
        sequencePatterns: new Map(),
        userSpecificPatterns: new Map()
      };
      this.predictionModels.set(currentRoute, model);
    }

    // Update next route probabilities
    if (action.type === 'navigation') {
      const currentCount = model.nextRoutes.get(action.target) || 0;
      model.nextRoutes.set(action.target, currentCount + 1);
    }

    // Update time-based patterns
    const hourRoutes = model.timePatterns.get(timeOfDay) || [];
    if (!hourRoutes.includes(action.target)) {
      hourRoutes.push(action.target);
      model.timePatterns.set(timeOfDay, hourRoutes);
    }

    // Update sequence patterns
    if (action.context.previousActions.length > 0) {
      const sequence = action.context.previousActions.join('->');
      const nextRoutes = model.sequencePatterns.get(sequence) || [];
      if (!nextRoutes.includes(action.target)) {
        nextRoutes.push(action.target);
        model.sequencePatterns.set(sequence, nextRoutes);
      }
    }
  }

  private triggerImmediatePrediction(action: UserAction): void {
    // Trigger immediate predictions for high-confidence scenarios
    if (action.type === 'navigation') {
      this.generatePredictions(action.context);
    }
  }

  private updatePredictions(): void {
    if (this.isProcessing) return;

    const currentRoute = window.location.pathname;
    const context: UserAction['context'] = {
      currentRoute,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      sessionDuration: Date.now() - this.sessionStartTime,
      previousActions: this.userActions
        .slice(-5)
        .map(action => action.target)
    };

    this.generatePredictions(context);
  }

  private generatePredictions(context: UserAction['context']): void {
    const predictions: PrefetchTask[] = [];

    // Rule-based predictions
    for (const rule of this.prefetchRules) {
      if (rule.enabled && rule.condition(context)) {
        for (const target of rule.targets) {
          predictions.push({
            url: target,
            priority: this.mapPriorityScore(rule.priority),
            confidence: rule.confidence,
            reason: `Rule: ${rule.name}`,
            estimatedSize: this.estimateResourceSize(target)
          });
        }
      }
    }

    // Model-based predictions
    const model = this.predictionModels.get(context.currentRoute);
    if (model) {
      // Next route predictions
      for (const [route, count] of model.nextRoutes.entries()) {
        const totalTransitions = Array.from(model.nextRoutes.values()).reduce((sum, c) => sum + c, 0);
        const probability = count / totalTransitions;
        
        if (probability > 0.1) { // Only consider routes with >10% probability
          predictions.push({
            url: route,
            priority: probability > 0.5 ? 'high' : 'medium',
            confidence: probability,
            reason: `Historical pattern (${Math.round(probability * 100)}% probability)`,
            estimatedSize: this.estimateResourceSize(route)
          });
        }
      }

      // Time-based predictions
      const timeRoutes = model.timePatterns.get(context.timeOfDay) || [];
      for (const route of timeRoutes) {
        predictions.push({
          url: route,
          priority: 'medium',
          confidence: 0.6,
          reason: `Time-based pattern (${context.timeOfDay}:00)`,
          estimatedSize: this.estimateResourceSize(route)
        });
      }

      // Sequence-based predictions
      if (context.previousActions.length > 0) {
        const sequence = context.previousActions.join('->');
        const nextRoutes = model.sequencePatterns.get(sequence) || [];
        for (const route of nextRoutes) {
          predictions.push({
            url: route,
            priority: 'high',
            confidence: 0.8,
            reason: `Sequence pattern: ${sequence}`,
            estimatedSize: this.estimateResourceSize(route)
          });
        }
      }
    }

    // Filter and prioritize predictions
    const filteredPredictions = this.filterPredictions(predictions);
    this.addToPrefetchQueue(filteredPredictions);
  }

  private filterPredictions(predictions: PrefetchTask[]): PrefetchTask[] {
    // Remove duplicates and merge similar predictions
    const uniquePredictions = new Map<string, PrefetchTask>();
    
    for (const prediction of predictions) {
      const existing = uniquePredictions.get(prediction.url);
      if (existing) {
        // Merge predictions - take highest confidence and priority
        existing.confidence = Math.max(existing.confidence, prediction.confidence);
        if (this.getPriorityScore(prediction.priority) > this.getPriorityScore(existing.priority)) {
          existing.priority = prediction.priority;
        }
        existing.reason += `, ${prediction.reason}`;
      } else {
        uniquePredictions.set(prediction.url, { ...prediction });
      }
    }

    // Filter based on network conditions and battery
    return Array.from(uniquePredictions.values())
      .filter(prediction => this.shouldPrefetch(prediction))
      .sort((a, b) => {
        // Sort by priority score, then confidence
        const priorityDiff = this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });
  }

  private shouldPrefetch(prediction: PrefetchTask): boolean {
    // Don't prefetch if battery is low
    if (this.batteryLevel < 0.2) {
      return prediction.priority === 'critical';
    }

    // Don't prefetch large resources on slow connections
    if (this.currentBandwidth === 'slow-2g' || this.currentBandwidth === '2g') {
      return prediction.priority === 'critical' && prediction.estimatedSize < 100000; // 100KB
    }

    // Limit prefetching on 3G
    if (this.currentBandwidth === '3g') {
      return prediction.confidence > 0.5 && prediction.estimatedSize < 500000; // 500KB
    }

    // More aggressive prefetching on WiFi and 4G
    if (this.isOnWifi || this.currentBandwidth === '4g') {
      return prediction.confidence > 0.3;
    }

    return prediction.confidence > 0.6;
  }

  private addToPrefetchQueue(predictions: PrefetchTask[]): void {
    // Add new predictions to queue, avoiding duplicates
    for (const prediction of predictions) {
      const exists = this.prefetchQueue.some(task => task.url === prediction.url);
      if (!exists) {
        this.prefetchQueue.push(prediction);
      }
    }

    // Sort queue by priority and confidence
    this.prefetchQueue.sort((a, b) => {
      const priorityDiff = this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    // Limit queue size
    if (this.prefetchQueue.length > 20) {
      this.prefetchQueue = this.prefetchQueue.slice(0, 20);
    }
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;

    this.isProcessing = true;

    try {
      // Process up to 3 tasks at once
      const tasksToProcess = this.prefetchQueue.splice(0, 3);
      
      await Promise.all(
        tasksToProcess.map(task => this.executePrefetch(task))
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async executePrefetch(task: PrefetchTask): Promise<void> {
    try {
      console.log(`Prefetching ${task.url} (${task.priority}, ${Math.round(task.confidence * 100)}%): ${task.reason}`);
      
      // Use different strategies based on resource type
      if (task.url.startsWith('/api/')) {
        await this.prefetchApiResource(task.url);
      } else if (task.url.match(/\.(js|css|png|jpg|jpeg|gif|webp)$/)) {
        await this.prefetchStaticResource(task.url);
      } else {
        await this.prefetchPageResource(task.url);
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${task.url}:`, error);
    }
  }

  private async prefetchApiResource(url: string): Promise<void> {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-Prefetch': 'true' }
    });
    
    if (response.ok) {
      // Store in cache if needed
      const cache = await caches.open('api-prefetch');
      await cache.put(url, response);
    }
  }

  private async prefetchStaticResource(url: string): Promise<void> {
    const response = await fetch(url);
    
    if (response.ok) {
      const cache = await caches.open('static-prefetch');
      await cache.put(url, response);
    }
  }

  private async prefetchPageResource(url: string): Promise<void> {
    // For page resources, we might want to prefetch the route component
    if (url.startsWith('/')) {
      // This would integrate with your route preloader
      const { routePreloader } = await import('./routePreloader');
      await routePreloader.preloadRoute(url);
    }
  }

  private estimateResourceSize(url: string): number {
    // Rough estimates based on resource type
    if (url.match(/\.(js)$/)) return 200000; // 200KB for JS
    if (url.match(/\.(css)$/)) return 50000; // 50KB for CSS
    if (url.match(/\.(png|jpg|jpeg)$/)) return 100000; // 100KB for images
    if (url.match(/\.(gif|webp)$/)) return 150000; // 150KB for animated images
    if (url.startsWith('/api/')) return 10000; // 10KB for API responses
    return 300000; // 300KB for pages
  }

  private mapPriorityScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 9) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private adjustPrefetchingStrategy(): void {
    // Adjust prefetch rules based on network and battery conditions
    const isLowPower = this.batteryLevel < 0.3;
    const isSlowNetwork = ['slow-2g', '2g', '3g'].includes(this.currentBandwidth);
    
    for (const rule of this.prefetchRules) {
      if (isLowPower || isSlowNetwork) {
        // Disable low-priority rules on constrained devices
        if (rule.priority < 7) {
          rule.enabled = false;
        }
      } else {
        // Re-enable rules when conditions improve
        rule.enabled = true;
      }
    }
  }

  /**
   * Get prediction analytics
   */
  getPredictionAnalytics(): {
    totalActions: number;
    modelsCount: number;
    queueSize: number;
    topPredictions: PrefetchTask[];
    networkConditions: {
      bandwidth: string;
      isOnWifi: boolean;
      batteryLevel: number;
    };
  } {
    return {
      totalActions: this.userActions.length,
      modelsCount: this.predictionModels.size,
      queueSize: this.prefetchQueue.length,
      topPredictions: this.prefetchQueue.slice(0, 5),
      networkConditions: {
        bandwidth: this.currentBandwidth,
        isOnWifi: this.isOnWifi,
        batteryLevel: this.batteryLevel
      }
    };
  }

  /**
   * Clear prediction data
   */
  clearPredictionData(): void {
    this.userActions = [];
    this.predictionModels.clear();
    this.prefetchQueue = [];
    localStorage.removeItem('predictive-prefetch-patterns');
  }

  /**
   * Export prediction data for analysis
   */
  exportPredictionData(): string {
    const data = {
      userActions: this.userActions,
      predictionModels: Object.fromEntries(
        Array.from(this.predictionModels.entries()).map(([key, model]) => [
          key,
          {
            ...model,
            nextRoutes: Object.fromEntries(model.nextRoutes),
            timePatterns: Object.fromEntries(model.timePatterns),
            sequencePatterns: Object.fromEntries(model.sequencePatterns),
            userSpecificPatterns: Object.fromEntries(model.userSpecificPatterns)
          }
        ])
      ),
      prefetchQueue: this.prefetchQueue,
      analytics: this.getPredictionAnalytics(),
      timestamp: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }
}

// Export singleton instance
export const predictivePrefetcher = PredictivePrefetcher.getInstance();

// React hook for using the prefetcher
export function usePredictivePrefetch() {
  const recordAction = (type: UserAction['type'], target: string) => {
    const currentRoute = window.location.pathname;
    predictivePrefetcher.recordUserAction(type, target, currentRoute);
  };

  return {
    recordAction,
    getAnalytics: () => predictivePrefetcher.getPredictionAnalytics(),
    clearData: () => predictivePrefetcher.clearPredictionData(),
    exportData: () => predictivePrefetcher.exportPredictionData()
  };
}