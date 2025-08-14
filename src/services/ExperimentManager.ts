/**
 * Advanced A/B Testing & Experimentation Framework
 * Statistical analysis with confidence intervals and significance testing
 * Built for data-driven product optimization
 */

import { analyticsManager } from './AnalyticsManager';
import { featureFlagManager } from './FeatureFlagManager';
import { logger } from '@/utils';

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type ExperimentType = 'ab' | 'multivariate' | 'feature_flag';

export interface ExperimentVariant {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly allocation: number; // Percentage allocation (0-100)
  readonly config: Record<string, any>; // Variant-specific configuration
  readonly isControl: boolean;
}

export interface ExperimentMetric {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'conversion' | 'numeric' | 'duration';
  readonly isPrimary: boolean;
  readonly targetDirection: 'increase' | 'decrease' | 'any';
}

export interface Experiment {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly hypothesis: string;
  readonly type: ExperimentType;
  readonly status: ExperimentStatus;
  readonly variants: ExperimentVariant[];
  readonly metrics: ExperimentMetric[];
  readonly targetAudience: {
    readonly percentage: number; // Overall traffic allocation
    readonly filters?: {
      readonly userTraits?: Record<string, any>;
      readonly segments?: string[];
      readonly geoTargeting?: string[];
    };
  };
  readonly schedule: {
    readonly startDate: Date;
    readonly endDate?: Date;
    readonly minDuration?: number; // Minimum duration in days
    readonly minSampleSize?: number;
  };
  readonly metadata: {
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly createdBy: string;
    readonly version: number;
  };
}

export interface ExperimentAssignment {
  readonly experimentId: string;
  readonly variantId: string;
  readonly userId: string;
  readonly assignedAt: Date;
  readonly context: Record<string, any>;
}

export interface ExperimentResult {
  readonly experimentId: string;
  readonly variantId: string;
  readonly metricKey: string;
  readonly value: number;
  readonly userId: string;
  readonly timestamp: Date;
  readonly context: Record<string, any>;
}

export interface StatisticalAnalysis {
  readonly variant: string;
  readonly sampleSize: number;
  readonly mean: number;
  readonly standardDeviation: number;
  readonly confidenceInterval: {
    readonly lower: number;
    readonly upper: number;
    readonly level: number; // e.g., 95
  };
  readonly pValue?: number;
  readonly statisticalSignificance: boolean;
  readonly practicalSignificance: boolean;
  readonly liftFromControl: {
    readonly absolute: number;
    readonly relative: number; // Percentage
  };
}

export interface ExperimentAnalysis {
  readonly experimentId: string;
  readonly metricKey: string;
  readonly analysisDate: Date;
  readonly variants: StatisticalAnalysis[];
  readonly winner?: string;
  readonly recommendation: 'continue' | 'stop_winner' | 'stop_no_effect' | 'need_more_data';
  readonly confidence: number; // 0-100
}

/**
 * Enterprise-grade A/B Testing Manager with statistical rigor
 */
export class ExperimentManager {
  private static instance: ExperimentManager;
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map(); // userId -> assignment
  private results: ExperimentResult[] = [];
  
  // Statistical configuration
  private readonly CONFIDENCE_LEVEL = 0.95;
  private readonly MIN_SAMPLE_SIZE = 100;
  private readonly SIGNIFICANCE_THRESHOLD = 0.05;

  private constructor() {
    this.initializeDefaultExperiments();
    logger.info('ExperimentManager initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ExperimentManager {
    if (!ExperimentManager.instance) {
      ExperimentManager.instance = new ExperimentManager();
    }
    return ExperimentManager.instance;
  }

  /**
   * Create a new experiment
   */
  public createExperiment(experiment: Omit<Experiment, 'id' | 'metadata'>): string {
    const id = this.generateExperimentId();
    const fullExperiment: Experiment = {
      id,
      ...experiment,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system', // In real app, get from auth context
        version: 1
      }
    };

    this.experiments.set(id, fullExperiment);
    
    // Create corresponding feature flags for each variant
    this.createFeatureFlagsForExperiment(fullExperiment);
    
    logger.info('Experiment created', { experimentId: id, name: experiment.name });
    return id;
  }

  /**
   * Start an experiment
   */
  public startExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    // Validate experiment configuration
    this.validateExperiment(experiment);

    // Update status
    const updatedExperiment: Experiment = {
      ...experiment,
      status: 'running',
      metadata: {
        ...experiment.metadata,
        updatedAt: new Date()
      }
    };

    this.experiments.set(experimentId, updatedExperiment);

    // Track experiment start
    analyticsManager.track('experiment_started', {
      experiment_id: experimentId,
      experiment_name: experiment.name,
      variant_count: experiment.variants.length,
      target_percentage: experiment.targetAudience.percentage
    });

    logger.info('Experiment started', { experimentId, name: experiment.name });
  }

  /**
   * Get user's variant assignment for an experiment
   */
  public getVariant(experimentId: string, userId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user already has an assignment
    const assignmentKey = `${userId}:${experimentId}`;
    const existingAssignment = this.assignments.get(assignmentKey);
    if (existingAssignment) {
      return existingAssignment.variantId;
    }

    // Check if user should be included in experiment
    if (!this.shouldIncludeUser(experiment, userId)) {
      return null;
    }

    // Assign user to variant
    const variantId = this.assignUserToVariant(experiment, userId);
    
    // Store assignment
    const assignment: ExperimentAssignment = {
      experimentId,
      variantId,
      userId,
      assignedAt: new Date(),
      context: {
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    this.assignments.set(assignmentKey, assignment);

    // Track assignment
    analyticsManager.track('experiment_assigned', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId
    });

    logger.debug('User assigned to variant', { experimentId, userId, variantId });
    return variantId;
  }

  /**
   * Track experiment result/conversion
   */
  public trackResult(
    experimentId: string,
    userId: string,
    metricKey: string,
    value: number,
    context: Record<string, any> = {}
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      logger.warn('Experiment not found for result tracking', { experimentId });
      return;
    }

    // Get user's variant assignment
    const assignmentKey = `${userId}:${experimentId}`;
    const assignment = this.assignments.get(assignmentKey);
    if (!assignment) {
      logger.warn('No assignment found for result tracking', { experimentId, userId });
      return;
    }

    // Create result record
    const result: ExperimentResult = {
      experimentId,
      variantId: assignment.variantId,
      metricKey,
      value,
      userId,
      timestamp: new Date(),
      context
    };

    this.results.push(result);

    // Track in analytics
    analyticsManager.track('experiment_result', {
      experiment_id: experimentId,
      variant_id: assignment.variantId,
      metric_key: metricKey,
      metric_value: value,
      user_id: userId
    });

    logger.debug('Experiment result tracked', { experimentId, userId, metricKey, value });
  }

  /**
   * Analyze experiment results with statistical significance
   */
  public analyzeExperiment(experimentId: string): ExperimentAnalysis[] {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const analyses: ExperimentAnalysis[] = [];

    // Analyze each metric
    for (const metric of experiment.metrics) {
      const analysis = this.analyzeMetric(experiment, metric);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Get experiment statistics
   */
  public getExperimentStats(experimentId: string): {
    totalAssignments: number;
    variantDistribution: Record<string, number>;
    totalResults: number;
    metricsTracked: string[];
  } {
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.experimentId === experimentId);
    
    const results = this.results.filter(r => r.experimentId === experimentId);
    
    const variantDistribution: Record<string, number> = {};
    assignments.forEach(assignment => {
      variantDistribution[assignment.variantId] = 
        (variantDistribution[assignment.variantId] || 0) + 1;
    });

    const metricsTracked = [...new Set(results.map(r => r.metricKey))];

    return {
      totalAssignments: assignments.length,
      variantDistribution,
      totalResults: results.length,
      metricsTracked
    };
  }

  /**
   * Get all experiments
   */
  public getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get running experiments
   */
  public getRunningExperiments(): Experiment[] {
    return Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
  }

  // Private helper methods

  private validateExperiment(experiment: Experiment): void {
    // Check variant allocations sum to 100%
    const totalAllocation = experiment.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%');
    }

    // Check at least one control variant
    const hasControl = experiment.variants.some(v => v.isControl);
    if (!hasControl) {
      throw new Error('Experiment must have at least one control variant');
    }

    // Check at least one primary metric
    const hasPrimaryMetric = experiment.metrics.some(m => m.isPrimary);
    if (!hasPrimaryMetric) {
      throw new Error('Experiment must have at least one primary metric');
    }
  }

  private shouldIncludeUser(experiment: Experiment, userId: string): boolean {
    // Check overall traffic allocation
    const userHash = this.getUserHash(userId, experiment.id);
    if (userHash > experiment.targetAudience.percentage) {
      return false;
    }

    // Check audience filters
    if (experiment.targetAudience.filters) {
      // In a real implementation, this would check user traits, segments, etc.
      // For now, we'll include all users that pass the percentage check
    }

    return true;
  }

  private assignUserToVariant(experiment: Experiment, userId: string): string {
    const userHash = this.getUserHash(userId, `${experiment.id}:variant`);
    let cumulativeAllocation = 0;

    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (userHash <= cumulativeAllocation) {
        return variant.id;
      }
    }

    // Fallback to control variant
    const controlVariant = experiment.variants.find(v => v.isControl);
    return controlVariant?.id || experiment.variants[0].id;
  }

  private analyzeMetric(experiment: Experiment, metric: ExperimentMetric): ExperimentAnalysis {
    const results = this.results.filter(r => 
      r.experimentId === experiment.id && r.metricKey === metric.key
    );

    const variantAnalyses: StatisticalAnalysis[] = [];
    let controlAnalysis: StatisticalAnalysis | null = null;

    // Analyze each variant
    for (const variant of experiment.variants) {
      const variantResults = results.filter(r => r.variantId === variant.id);
      const analysis = this.calculateStatistics(variant.id, variantResults, metric);
      
      variantAnalyses.push(analysis);
      
      if (variant.isControl) {
        controlAnalysis = analysis;
      }
    }

    // Calculate lift from control for non-control variants
    if (controlAnalysis) {
      variantAnalyses.forEach(analysis => {
        if (analysis.variant !== controlAnalysis!.variant) {
          const absoluteLift = analysis.mean - controlAnalysis!.mean;
          const relativeLift = controlAnalysis!.mean !== 0 
            ? (absoluteLift / controlAnalysis!.mean) * 100 
            : 0;
          
          (analysis as any).liftFromControl = {
            absolute: absoluteLift,
            relative: relativeLift
          };
        }
      });
    }

    // Determine winner and recommendation
    const { winner, recommendation, confidence } = this.determineWinner(
      variantAnalyses, 
      metric
    );

    return {
      experimentId: experiment.id,
      metricKey: metric.key,
      analysisDate: new Date(),
      variants: variantAnalyses,
      winner,
      recommendation,
      confidence
    };
  }

  private calculateStatistics(
    variantId: string, 
    results: ExperimentResult[], 
    metric: ExperimentMetric
  ): StatisticalAnalysis {
    const values = results.map(r => r.value);
    const sampleSize = values.length;
    
    if (sampleSize === 0) {
      return {
        variant: variantId,
        sampleSize: 0,
        mean: 0,
        standardDeviation: 0,
        confidenceInterval: { lower: 0, upper: 0, level: 95 },
        statisticalSignificance: false,
        practicalSignificance: false,
        liftFromControl: { absolute: 0, relative: 0 }
      };
    }

    // Calculate basic statistics
    const mean = values.reduce((sum, v) => sum + v, 0) / sampleSize;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (sampleSize - 1);
    const standardDeviation = Math.sqrt(variance);

    // Calculate confidence interval (assuming normal distribution)
    const standardError = standardDeviation / Math.sqrt(sampleSize);
    const tValue = this.getTValue(this.CONFIDENCE_LEVEL, sampleSize - 1);
    const marginOfError = tValue * standardError;

    const confidenceInterval = {
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      level: this.CONFIDENCE_LEVEL * 100
    };

    return {
      variant: variantId,
      sampleSize,
      mean,
      standardDeviation,
      confidenceInterval,
      statisticalSignificance: sampleSize >= this.MIN_SAMPLE_SIZE,
      practicalSignificance: false, // Will be determined when comparing to control
      liftFromControl: { absolute: 0, relative: 0 } // Will be calculated later
    };
  }

  private determineWinner(
    analyses: StatisticalAnalysis[], 
    metric: ExperimentMetric
  ): { winner?: string; recommendation: ExperimentAnalysis['recommendation']; confidence: number } {
    // Find control and treatment variants
    const controlAnalysis = analyses.find(a => a.variant.includes('control'));
    const treatmentAnalyses = analyses.filter(a => !a.variant.includes('control'));

    if (!controlAnalysis || treatmentAnalyses.length === 0) {
      return { recommendation: 'need_more_data', confidence: 0 };
    }

    // Check if we have enough data
    const totalSampleSize = analyses.reduce((sum, a) => sum + a.sampleSize, 0);
    if (totalSampleSize < this.MIN_SAMPLE_SIZE * analyses.length) {
      return { recommendation: 'need_more_data', confidence: 0 };
    }

    // Find best performing treatment
    let bestTreatment = treatmentAnalyses[0];
    for (const treatment of treatmentAnalyses) {
      if (metric.targetDirection === 'increase' && treatment.mean > bestTreatment.mean) {
        bestTreatment = treatment;
      } else if (metric.targetDirection === 'decrease' && treatment.mean < bestTreatment.mean) {
        bestTreatment = treatment;
      }
    }

    // Calculate statistical significance (simplified t-test)
    const pooledStandardError = Math.sqrt(
      (Math.pow(controlAnalysis.standardDeviation, 2) / controlAnalysis.sampleSize) +
      (Math.pow(bestTreatment.standardDeviation, 2) / bestTreatment.sampleSize)
    );

    const tStatistic = Math.abs(bestTreatment.mean - controlAnalysis.mean) / pooledStandardError;
    const degreesOfFreedom = controlAnalysis.sampleSize + bestTreatment.sampleSize - 2;
    const pValue = this.calculatePValue(tStatistic, degreesOfFreedom);

    const isStatisticallySignificant = pValue < this.SIGNIFICANCE_THRESHOLD;
    const confidence = (1 - pValue) * 100;

    // Determine recommendation
    if (isStatisticallySignificant) {
      const improvementDirection = metric.targetDirection === 'increase' 
        ? bestTreatment.mean > controlAnalysis.mean
        : bestTreatment.mean < controlAnalysis.mean;

      if (improvementDirection) {
        return {
          winner: bestTreatment.variant,
          recommendation: 'stop_winner',
          confidence
        };
      }
    }

    return {
      recommendation: confidence > 80 ? 'stop_no_effect' : 'continue',
      confidence
    };
  }

  private createFeatureFlagsForExperiment(experiment: Experiment): void {
    // Create a feature flag for the experiment
    featureFlagManager.setFlag(`experiment_${experiment.id}`, {
      name: `Experiment: ${experiment.name}`,
      description: `Feature flag for experiment: ${experiment.description}`,
      enabled: experiment.status === 'running',
      value: true,
      rolloutPercentage: experiment.targetAudience.percentage,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'experiment_manager',
        version: 1
      }
    });
  }

  private getUserHash(userId: string, salt: string): number {
    const input = `${userId}:${salt}`;
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash) % 100;
  }

  private getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-value lookup (in production, use a proper statistical library)
    const alpha = 1 - confidenceLevel;
    
    if (degreesOfFreedom >= 30) {
      return alpha <= 0.05 ? 1.96 : 2.58; // Normal approximation
    }
    
    // Simplified t-table for common cases
    const tTable: Record<number, number> = {
      1: 12.71, 2: 4.30, 3: 3.18, 4: 2.78, 5: 2.57,
      10: 2.23, 15: 2.13, 20: 2.09, 25: 2.06, 30: 2.04
    };
    
    return tTable[degreesOfFreedom] || 2.0;
  }

  private calculatePValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation (in production, use a proper statistical library)
    // This is a rough approximation
    if (tStatistic < 1.0) return 0.3;
    if (tStatistic < 1.5) return 0.15;
    if (tStatistic < 2.0) return 0.05;
    if (tStatistic < 2.5) return 0.02;
    if (tStatistic < 3.0) return 0.01;
    return 0.001;
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultExperiments(): void {
    // Create a sample A/B test for the new workout UI
    const workoutUIExperiment = this.createExperiment({
      name: 'New Workout UI Test',
      description: 'Testing the new workout interface design',
      hypothesis: 'The new workout UI will increase workout completion rates',
      type: 'ab',
      status: 'draft',
      variants: [
        {
          id: 'control',
          name: 'Current UI',
          description: 'Existing workout interface',
          allocation: 50,
          config: { useNewUI: false },
          isControl: true
        },
        {
          id: 'treatment',
          name: 'New UI',
          description: 'New workout interface design',
          allocation: 50,
          config: { useNewUI: true },
          isControl: false
        }
      ],
      metrics: [
        {
          key: 'workout_completion',
          name: 'Workout Completion Rate',
          description: 'Percentage of workouts completed',
          type: 'conversion',
          isPrimary: true,
          targetDirection: 'increase'
        },
        {
          key: 'session_duration',
          name: 'Session Duration',
          description: 'Average workout session duration',
          type: 'duration',
          isPrimary: false,
          targetDirection: 'increase'
        }
      ],
      targetAudience: {
        percentage: 20 // Start with 20% of users
      },
      schedule: {
        startDate: new Date(),
        minDuration: 14, // Run for at least 2 weeks
        minSampleSize: 200
      }
    });

    logger.info('Default experiments initialized', { workoutUIExperiment });
  }
}

// Export singleton instance
export const experimentManager = ExperimentManager.getInstance();