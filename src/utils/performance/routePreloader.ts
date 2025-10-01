/**
 * Advanced Route Preloader
 * Implements predictive preloading based on user behavior and navigation patterns
 */

interface RoutePreloadConfig {
  route: string;
  priority: 'high' | 'medium' | 'low';
  preloadTrigger: 'hover' | 'idle' | 'immediate' | 'viewport';
  dependencies?: string[];
  maxAge?: number; // Cache duration in ms
}

interface PreloadStats {
  route: string;
  preloadTime: number;
  hitRate: number;
  lastAccessed: number;
}

class RoutePreloader {
  private preloadedRoutes = new Map<string, Promise<any>>();
  private preloadStats = new Map<string, PreloadStats>();
  private preloadQueue: RoutePreloadConfig[] = [];
  private isProcessingQueue = false;
  private idleCallback: number | null = null;

  private routeConfigs: RoutePreloadConfig[] = [
    // Core routes - high priority
    { route: '/workout', priority: 'high', preloadTrigger: 'immediate' },
    { route: '/progress', priority: 'high', preloadTrigger: 'idle' },
    { route: '/social', priority: 'medium', preloadTrigger: 'idle' },
    { route: '/profile', priority: 'medium', preloadTrigger: 'hover' },
    
    // Exercise routes - medium priority
    { route: '/exercises', priority: 'medium', preloadTrigger: 'hover' },
    { route: '/exercise-detail', priority: 'low', preloadTrigger: 'viewport' },
    
    // Workout routes - high priority for active users
    { route: '/workout-player', priority: 'high', preloadTrigger: 'immediate', dependencies: ['/workout'] },
    { route: '/workout-summary', priority: 'medium', preloadTrigger: 'idle' },
    
    // Analytics routes - low priority
    { route: '/analytics', priority: 'low', preloadTrigger: 'idle' },
    { route: '/percentile-analytics', priority: 'low', preloadTrigger: 'hover' },
    
    // Social routes - medium priority
    { route: '/social-feed', priority: 'medium', preloadTrigger: 'idle' },
    { route: '/challenges', priority: 'low', preloadTrigger: 'hover' },
  ];

  private routeImporters = new Map<string, () => Promise<any>>([
    ['/workout', () => import('@/pages/Workout')],
    ['/progress', () => import('@/pages/Progress')],
    ['/social', () => import('@/pages/Social')],
    ['/profile', () => import('@/pages/Profile')],
    ['/exercises', () => import('@/pages/ExerciseBrowser')],
    ['/exercise-detail', () => import('@/pages/ExerciseDetailPage')],
    ['/workout-player', () => import('@/pages/WorkoutPlayerPage')],
    ['/workout-summary', () => import('@/pages/WorkoutSummary')],
    ['/analytics', () => import('@/pages/Progress')], // Fallback to Progress
    ['/percentile-analytics', () => import('@/pages/PercentilesPage')],
    ['/social-feed', () => import('@/pages/SocialFeedTestPage')],
    ['/challenges', () => import('@/pages/ChallengeTestPage')],
  ]);

  constructor() {
    this.initializePreloader();
  }

  private initializePreloader() {
    // Start immediate preloads
    this.preloadImmediate();
    
    // Schedule idle preloads
    this.scheduleIdlePreloads();
    
    // Set up navigation listeners
    this.setupNavigationListeners();
    
    // Clean up old preloads periodically
    setInterval(() => this.cleanupOldPreloads(), 5 * 60 * 1000); // Every 5 minutes
  }

  private preloadImmediate() {
    const immediateRoutes = this.routeConfigs.filter(
      config => config.preloadTrigger === 'immediate'
    );
    
    immediateRoutes.forEach(config => {
      this.preloadRoute(config.route);
    });
  }

  private scheduleIdlePreloads() {
    if ('requestIdleCallback' in window) {
      this.idleCallback = requestIdleCallback(() => {
        this.processIdlePreloads();
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.processIdlePreloads(), 1000);
    }
  }

  private processIdlePreloads() {
    const idleRoutes = this.routeConfigs.filter(
      config => config.preloadTrigger === 'idle' && !this.preloadedRoutes.has(config.route)
    );
    
    // Sort by priority
    idleRoutes.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    // Preload one route at a time to avoid overwhelming the browser
    if (idleRoutes.length > 0) {
      this.preloadRoute(idleRoutes[0].route);
      
      // Schedule next idle preload
      if (idleRoutes.length > 1) {
        setTimeout(() => this.scheduleIdlePreloads(), 500);
      }
    }
  }

  private setupNavigationListeners() {
    // Listen for route changes to update stats
    window.addEventListener('popstate', () => {
      this.updateRouteStats(window.location.pathname);
    });
    
    // Listen for link hovers to preload on hover
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href.startsWith(window.location.origin)) {
        const path = new URL(link.href).pathname;
        this.handleHoverPreload(path);
      }
    });
  }

  private handleHoverPreload(path: string) {
    const config = this.routeConfigs.find(
      c => c.route === path || path.startsWith(c.route)
    );
    
    if (config && config.preloadTrigger === 'hover') {
      this.preloadRoute(config.route);
    }
  }

  public async preloadRoute(route: string): Promise<void> {
    if (this.preloadedRoutes.has(route)) {
      return this.preloadedRoutes.get(route);
    }

    const importer = this.routeImporters.get(route);
    if (!importer) {
      console.warn(`No importer found for route: ${route}`);
      return;
    }

    const startTime = performance.now();
    const preloadPromise = importer()
      .then(module => {
        const endTime = performance.now();
        this.updatePreloadStats(route, endTime - startTime);
        return module;
      })
      .catch(error => {
        console.error(`Failed to preload route ${route}:`, error);
        this.preloadedRoutes.delete(route);
        throw error;
      });

    this.preloadedRoutes.set(route, preloadPromise);
    return preloadPromise;
  }

  private updatePreloadStats(route: string, preloadTime: number) {
    const existing = this.preloadStats.get(route);
    
    if (existing) {
      existing.preloadTime = preloadTime;
      existing.lastAccessed = Date.now();
      existing.hitRate = existing.hitRate * 0.9 + 0.1; // Exponential moving average
    } else {
      this.preloadStats.set(route, {
        route,
        preloadTime,
        hitRate: 1,
        lastAccessed: Date.now()
      });
    }
  }

  private updateRouteStats(route: string) {
    const stats = this.preloadStats.get(route);
    if (stats) {
      stats.lastAccessed = Date.now();
      stats.hitRate = stats.hitRate * 0.9 + 0.1;
    }
  }

  private cleanupOldPreloads() {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    
    for (const [route, stats] of this.preloadStats.entries()) {
      if (now - stats.lastAccessed > maxAge && stats.hitRate < 0.1) {
        this.preloadedRoutes.delete(route);
        this.preloadStats.delete(route);
      }
    }
  }

  public getPreloadStats(): PreloadStats[] {
    return Array.from(this.preloadStats.values());
  }

  public preloadOnViewport(element: HTMLElement, route: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preloadRoute(route);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(element);
    return () => observer.unobserve(element);
  }

  public destroy() {
    if (this.idleCallback) {
      cancelIdleCallback(this.idleCallback);
    }
  }
}

// Singleton instance
export const routePreloader = new RoutePreloader();

// React hook for using the preloader
export function useRoutePreloader() {
  return {
    preloadRoute: (route: string) => routePreloader.preloadRoute(route),
    getStats: () => routePreloader.getPreloadStats(),
    preloadOnViewport: (element: HTMLElement, route: string) => 
      routePreloader.preloadOnViewport(element, route)
  };
}