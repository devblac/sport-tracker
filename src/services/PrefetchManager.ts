import { CacheManager } from './CacheManager';
import { QueryOptimizer } from './QueryService';
import { logger } from '@/utils';

export interface PrefetchPattern {
  id: string;
  name: string;
  trigger: string; // Key pattern that triggers this prefetch
  targets: string[]; // Keys to prefetch
  confidence: number; // 0-1 confidence score
  frequency: number; // How often this pattern occurs
  lastUsed: number;
  enabled: boolean;
}

export interface UserBehaviorData {
  userId: string;
  sessionId: string;
  timestamp: number;
  action: string;
  resource: string;
  context: Record<string, any>;
}

export interface PrefetchStats {
  totalPrefetches: number;
  successfulPrefetches: number;
  failedPrefetches: number;
  hitRate: number; // How often prefetched data is actually used
  patterns: number;
  activePatterns: number;
}

export class PrefetchManager {
  private static instance: PrefetchManager;
  private cacheManager: CacheManager;
  private queryOptimizer: QueryOptimizer;
  private patterns: Map<string, PrefetchPattern> = new Map();
  private behaviorHistory: UserBehaviorData[] = [];
  private stats: PrefetchStats = {
    totalPrefetches: 0,
    successfulPrefetches: 0,
    failedPrefetches: 0,
    hitRate: 0,
    patterns: 0,
    activePatterns: 0
  };

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.queryOptimizer = QueryOptimizer.getInstance();
    this.initializeDefaultPatterns();
    this.startPatternLearning();
  }

  public static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  /**
   * Record user behavior for pattern learning
   */
  recordBehavior(behavior: Omit<UserBehaviorData, 'timestamp' | 'sessionId'>): void {
    const sessionId = this.getCurrentSessionId();
    const behaviorData: UserBehaviorData = {
      ...behavior,
      timestamp: Date.now(),
      sessionId
    };

    this.behaviorHistory.push(behaviorData);

    // Keep only recent behavior (last 1000 actions)
    if (this.behaviorHistory.length > 1000) {
      this.behaviorHistory = this.behaviorHistory.slice(-1000);
    }

    // Trigger pattern analysis
    this.analyzeAndUpdatePatterns();

    logger.debug('Behavior recorded', { action: behavior.action, resource: behavior.resource });
  }

  /**
   * Trigger prefetch based on current context
   */
  async triggerPrefetch(triggerKey: string, context?: Record<string, any>): Promise<void> {
    const matchingPatterns = this.findMatchingPatterns(triggerKey);
    
    if (matchingPatterns.length === 0) {
      return;
    }

    // Sort by confidence and execute top patterns
    const topPatterns = matchingPatterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Limit to top 3 patterns to avoid overwhelming

    const prefetchPromises = topPatterns.map(async (pattern) => {
      try {
        await this.executePrefetchPattern(pattern, context);
        this.stats.successfulPrefetches++;
        pattern.lastUsed = Date.now();
        pattern.frequency++;
      } catch (error) {
        this.stats.failedPrefetches++;
        logger.error('Prefetch pattern failed', { pattern: pattern.id, error });
      }
    });

    this.stats.totalPrefetches += topPatterns.length;
    await Promise.allSettled(prefetchPromises);

    logger.debug('Prefetch triggered', { 
      triggerKey, 
      patterns: topPatterns.length,
      context 
    });
  }

  /**
   * Add or update a prefetch pattern
   */
  addPattern(pattern: Omit<PrefetchPattern, 'lastUsed' | 'frequency'>): void {
    const fullPattern: PrefetchPattern = {
      ...pattern,
      lastUsed: Date.now(),
      frequency: 0
    };

    this.patterns.set(pattern.id, fullPattern);
    this.updateStats();

    logger.debug('Prefetch pattern added', { id: pattern.id, name: pattern.name });
  }

  /**
   * Remove a prefetch pattern
   */
  removePattern(patternId: string): void {
    this.patterns.delete(patternId);
    this.updateStats();

    logger.debug('Prefetch pattern removed', { id: patternId });
  }

  /**
   * Get all patterns with their performance metrics
   */
  getPatterns(): PrefetchPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get prefetch statistics
   */
  getStats(): PrefetchStats {
    return { ...this.stats };
  }

  /**
   * Optimize patterns based on performance
   */
  optimizePatterns(): void {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (const [id, pattern] of this.patterns.entries()) {
      // Disable patterns that haven't been used in a week
      if (pattern.lastUsed < oneWeekAgo && pattern.frequency < 5) {
        pattern.enabled = false;
        logger.debug('Pattern disabled due to low usage', { id, frequency: pattern.frequency });
      }

      // Adjust confidence based on success rate
      if (pattern.frequency > 10) {
        const successRate = this.calculatePatternSuccessRate(pattern);
        pattern.confidence = Math.min(1, pattern.confidence * (0.5 + successRate * 0.5));
      }
    }

    this.updateStats();
    logger.info('Patterns optimized', { 
      total: this.patterns.size, 
      active: this.stats.activePatterns 
    });
  }

  // Private methods

  private initializeDefaultPatterns(): void {
    // Exercise detail -> Related exercises
    this.addPattern({
      id: 'exercise-detail-related',
      name: 'Exercise Detail Related',
      trigger: 'exercise:*',
      targets: ['exercise_history:*', 'exercise_charts:*'],
      confidence: 0.8,
      enabled: true
    });

    // Workout start -> Exercise data
    this.addPattern({
      id: 'workout-start-exercises',
      name: 'Workout Start Exercises',
      trigger: 'workout:start:*',
      targets: ['exercise:*', 'exercise_history:*'],
      confidence: 0.9,
      enabled: true
    });

    // User profile -> Workout history
    this.addPattern({
      id: 'profile-workout-history',
      name: 'Profile Workout History',
      trigger: 'user:profile:*',
      targets: ['workout_history:*', 'user_stats:*'],
      confidence: 0.7,
      enabled: true
    });

    // Template selection -> Template details
    this.addPattern({
      id: 'template-selection-details',
      name: 'Template Selection Details',
      trigger: 'template:list',
      targets: ['template:*', 'template_exercises:*'],
      confidence: 0.6,
      enabled: true
    });

    // AI recommendation -> Related data
    this.addPattern({
      id: 'ai-recommendation-context',
      name: 'AI Recommendation Context',
      trigger: 'weight_rec:*',
      targets: ['plateau_detection:*', 'exercise_history:*'],
      confidence: 0.8,
      enabled: true
    });

    logger.info('Default prefetch patterns initialized', { count: this.patterns.size });
  }

  private findMatchingPatterns(triggerKey: string): PrefetchPattern[] {
    const matching: PrefetchPattern[] = [];

    for (const pattern of this.patterns.values()) {
      if (!pattern.enabled) continue;

      if (this.matchesPattern(triggerKey, pattern.trigger)) {
        matching.push(pattern);
      }
    }

    return matching;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple wildcard matching
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }

    return key === pattern;
  }

  private async executePrefetchPattern(
    pattern: PrefetchPattern, 
    context?: Record<string, any>
  ): Promise<void> {
    const resolvedTargets = this.resolveTargetKeys(pattern.targets, context);

    const prefetchPromises = resolvedTargets.map(async (target) => {
      const [table, key] = target.split(':');
      if (table && key && key !== '*') {
        try {
          await this.queryOptimizer.get(table, key, {
            useCache: true,
            cacheStrategy: this.inferCacheStrategy(table)
          });
        } catch (error) {
          logger.error('Individual prefetch failed', { target, error });
        }
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  private resolveTargetKeys(targets: string[], context?: Record<string, any>): string[] {
    const resolved: string[] = [];

    for (const target of targets) {
      if (target.includes('*') && context) {
        // Try to resolve wildcards from context
        const resolved_target = this.resolveWildcard(target, context);
        if (resolved_target) {
          resolved.push(resolved_target);
        }
      } else if (!target.includes('*')) {
        resolved.push(target);
      }
    }

    return resolved;
  }

  private resolveWildcard(pattern: string, context: Record<string, any>): string | null {
    // Simple wildcard resolution based on context
    if (pattern.includes('exercise:*') && context.exerciseId) {
      return pattern.replace('*', context.exerciseId);
    }
    
    if (pattern.includes('user:*') && context.userId) {
      return pattern.replace('*', context.userId);
    }

    if (pattern.includes('workout:*') && context.workoutId) {
      return pattern.replace('*', context.workoutId);
    }

    return null;
  }

  private analyzeAndUpdatePatterns(): void {
    // Simple pattern learning based on recent behavior
    const recentBehavior = this.behaviorHistory.slice(-50); // Last 50 actions
    const sequences = this.findBehaviorSequences(recentBehavior);

    for (const sequence of sequences) {
      this.updateOrCreatePattern(sequence);
    }
  }

  private findBehaviorSequences(behaviors: UserBehaviorData[]): Array<{
    trigger: string;
    targets: string[];
    frequency: number;
  }> {
    const sequences: Map<string, { targets: Set<string>; frequency: number }> = new Map();

    for (let i = 0; i < behaviors.length - 1; i++) {
      const current = behaviors[i];
      const next = behaviors[i + 1];

      // Only consider sequences within the same session and close in time
      if (current.sessionId === next.sessionId && 
          (next.timestamp - current.timestamp) < 30000) { // 30 seconds

        const trigger = current.resource;
        const target = next.resource;

        if (!sequences.has(trigger)) {
          sequences.set(trigger, { targets: new Set(), frequency: 0 });
        }

        const sequence = sequences.get(trigger)!;
        sequence.targets.add(target);
        sequence.frequency++;
      }
    }

    return Array.from(sequences.entries()).map(([trigger, data]) => ({
      trigger,
      targets: Array.from(data.targets),
      frequency: data.frequency
    }));
  }

  private updateOrCreatePattern(sequence: {
    trigger: string;
    targets: string[];
    frequency: number;
  }): void {
    const patternId = `learned-${this.hashString(sequence.trigger)}`;
    const existing = this.patterns.get(patternId);

    if (existing) {
      // Update existing pattern
      existing.frequency += sequence.frequency;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.targets = [...new Set([...existing.targets, ...sequence.targets])];
    } else if (sequence.frequency >= 3) {
      // Create new pattern if it occurs frequently enough
      this.addPattern({
        id: patternId,
        name: `Learned: ${sequence.trigger}`,
        trigger: sequence.trigger,
        targets: sequence.targets,
        confidence: Math.min(0.8, sequence.frequency * 0.1),
        enabled: true
      });
    }
  }

  private calculatePatternSuccessRate(pattern: PrefetchPattern): number {
    // This would ideally track how often prefetched data is actually used
    // For now, return a simplified calculation based on frequency
    return Math.min(1, pattern.frequency / 20);
  }

  private inferCacheStrategy(table: string): string {
    const strategyMap: Record<string, string> = {
      'exercises': 'exercises',
      'workouts': 'workouts',
      'users': 'users',
      'templates': 'templates'
    };

    return strategyMap[table] || 'default';
  }

  private getCurrentSessionId(): string {
    // Simple session ID based on current time and random component
    const sessionKey = 'prefetch_session_id';
    let sessionId = sessionStorage.getItem(sessionKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }
    
    return sessionId;
  }

  private updateStats(): void {
    this.stats.patterns = this.patterns.size;
    this.stats.activePatterns = Array.from(this.patterns.values())
      .filter(p => p.enabled).length;
    
    if (this.stats.totalPrefetches > 0) {
      this.stats.hitRate = this.stats.successfulPrefetches / this.stats.totalPrefetches;
    }
  }

  private startPatternLearning(): void {
    // Optimize patterns every hour
    setInterval(() => {
      this.optimizePatterns();
    }, 60 * 60 * 1000);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}