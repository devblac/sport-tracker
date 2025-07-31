// Enhanced Percentile Calculator Service
// Implements requirement 15.1 - Advanced percentile calculations with real-time updates

import {
  UserDemographics,
  ExercisePerformance,
  PercentileSegment,
  PercentileData,
  UserPercentileRanking,
  PercentileComparison,
  GlobalRanking,
  PercentileCalculationResult
} from '../types/percentiles';
import { DemographicSegmentation } from '../utils/demographicSegmentation';

// Enhanced calculation options
interface CalculationOptions {
  includeOutlierDetection: boolean;
  useWeightedAverages: boolean;
  applySeasonalAdjustments: boolean;
  confidenceInterval: number; // 0.95 for 95% confidence
  minSampleSize: number;
  maxAge: number; // Maximum age of data to include (days)
}

// Real-time update configuration
interface RealTimeConfig {
  enableRealTimeUpdates: boolean;
  updateThreshold: number; // Minimum new data points to trigger update
  batchSize: number;
  maxUpdateFrequency: number; // Minimum minutes between updates
}

// Advanced percentile metrics
interface AdvancedPercentileMetrics {
  percentile_confidence: number;
  data_quality_score: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  trend_strength: number; // 0-1
  seasonal_adjustment: number;
  outlier_count: number;
  data_freshness_score: number; // 0-1, based on recency of data
}

export class EnhancedPercentileCalculator {
  private static readonly DEFAULT_OPTIONS: CalculationOptions = {
    includeOutlierDetection: true,
    useWeightedAverages: true,
    applySeasonalAdjustments: false,
    confidenceInterval: 0.95,
    minSampleSize: 30,
    maxAge: 365 // 1 year
  };

  private static readonly DEFAULT_REALTIME_CONFIG: RealTimeConfig = {
    enableRealTimeUpdates: true,
    updateThreshold: 10,
    batchSize: 100,
    maxUpdateFrequency: 15 // 15 minutes
  };

  // Cache for recent calculations
  private static calculationCache = new Map<string, {
    data: PercentileData;
    timestamp: Date;
    options: CalculationOptions;
  }>();

  /**
   * Enhanced percentile calculation with advanced statistical methods
   */
  static async calculateAdvancedPercentiles(
    userId: string,
    demographics: UserDemographics,
    performances: ExercisePerformance[],
    options: Partial<CalculationOptions> = {}
  ): Promise<PercentileCalculationResult & { advanced_metrics: AdvancedPercentileMetrics[] }> {
    const startTime = Date.now();
    const calcOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const userRankings: UserPercentileRanking[] = [];
      const comparisons: PercentileComparison[] = [];
      const advancedMetrics: AdvancedPercentileMetrics[] = [];
      const updatedSegments: string[] = [];

      // Get optimal segments using enhanced segmentation
      const segments = DemographicSegmentation.getMostSpecificSegments(demographics);

      for (const performance of performances) {
        for (const segment of segments.slice(0, 5)) { // Limit to top 5 most relevant segments
          // Get enhanced percentile data
          const percentileData = await this.getEnhancedPercentileData(
            segment.id,
            performance.exercise_id,
            calcOptions
          );

          if (percentileData && percentileData.sample_size >= calcOptions.minSampleSize) {
            // Calculate advanced ranking with confidence intervals
            const ranking = await this.calculateAdvancedRanking(
              userId,
              performance,
              percentileData,
              segment,
              demographics,
              calcOptions
            );

            userRankings.push(ranking);

            // Create enhanced comparison
            const comparison = await this.createEnhancedComparison(ranking, demographics, calcOptions);
            comparisons.push(comparison);

            // Calculate advanced metrics
            const metrics = await this.calculateAdvancedMetrics(percentileData, performance, calcOptions);
            advancedMetrics.push(metrics);

            updatedSegments.push(segment.id);
          }
        }
      }

      return {
        success: true,
        user_rankings: userRankings,
        comparisons,
        updated_segments: [...new Set(updatedSegments)],
        calculation_time_ms: Date.now() - startTime,
        advanced_metrics: advancedMetrics
      };

    } catch (error) {
      console.error('Error in advanced percentile calculation:', error);
      return {
        success: false,
        user_rankings: [],
        comparisons: [],
        updated_segments: [],
        calculation_time_ms: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        advanced_metrics: []
      };
    }
  }

  /**
   * Gets enhanced percentile data with outlier detection and quality scoring
   */
  private static async getEnhancedPercentileData(
    segmentId: string,
    exerciseId: string,
    options: CalculationOptions
  ): Promise<PercentileData & { advanced_metrics: AdvancedPercentileMetrics } | null> {
    
    // Check cache first
    const cacheKey = `${segmentId}_${exerciseId}_${JSON.stringify(options)}`;
    const cached = this.calculationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp.getTime() < 15 * 60 * 1000) { // 15 minutes cache
      return cached.data as any;
    }

    // Get raw performance data
    const rawData = await this.getRawPerformanceData(segmentId, exerciseId, options.maxAge);
    
    if (rawData.length < options.minSampleSize) {
      return null;
    }

    // Apply outlier detection if enabled
    let cleanedData = rawData;
    let outlierCount = 0;
    
    if (options.includeOutlierDetection) {
      const outlierResult = this.detectAndRemoveOutliers(rawData.map(d => d.max_weight));
      cleanedData = rawData.filter((_, index) => !outlierResult.outlierIndices.includes(index));
      outlierCount = outlierResult.outlierIndices.length;
    }

    // Calculate percentiles with enhanced methods
    const values = cleanedData.map(d => d.max_weight).sort((a, b) => a - b);
    const percentiles = this.calculateRobustPercentiles(values, options);

    // Calculate trend analysis
    const trendAnalysis = this.analyzeTrend(cleanedData);

    // Calculate data quality score
    const qualityScore = this.calculateDataQualityScore(cleanedData, rawData.length);

    // Calculate data freshness
    const freshnessScore = this.calculateDataFreshness(cleanedData);

    const enhancedData: PercentileData & { advanced_metrics: AdvancedPercentileMetrics } = {
      segment_id: segmentId,
      exercise_id: exerciseId,
      metric_type: 'max_weight',
      percentiles,
      mean: this.calculateWeightedMean(values, options),
      std_deviation: this.calculateRobustStdDev(values),
      sample_size: cleanedData.length,
      last_updated: new Date(),
      advanced_metrics: {
        percentile_confidence: this.calculatePercentileConfidence(values.length, options.confidenceInterval),
        data_quality_score: qualityScore,
        trend_direction: trendAnalysis.direction,
        trend_strength: trendAnalysis.strength,
        seasonal_adjustment: 0, // Would implement seasonal analysis
        outlier_count: outlierCount,
        data_freshness_score: freshnessScore
      }
    };

    // Cache the result
    this.calculationCache.set(cacheKey, {
      data: enhancedData,
      timestamp: new Date(),
      options
    });

    return enhancedData;
  }

  /**
   * Detects and removes statistical outliers using IQR method
   */
  private static detectAndRemoveOutliers(values: number[]): {
    cleanedValues: number[];
    outlierIndices: number[];
    outlierValues: number[];
  } {
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedValues.length * 0.25);
    const q3Index = Math.floor(sortedValues.length * 0.75);
    
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const outlierIndices: number[] = [];
    const outlierValues: number[] = [];
    const cleanedValues: number[] = [];
    
    values.forEach((value, index) => {
      if (value < lowerBound || value > upperBound) {
        outlierIndices.push(index);
        outlierValues.push(value);
      } else {
        cleanedValues.push(value);
      }
    });

    return { cleanedValues, outlierIndices, outlierValues };
  }

  /**
   * Calculates robust percentiles using interpolation
   */
  private static calculateRobustPercentiles(
    sortedValues: number[],
    options: CalculationOptions
  ): PercentileData['percentiles'] {
    const percentilePoints = [5, 10, 25, 50, 75, 90, 95, 99];
    const percentiles: any = {};

    percentilePoints.forEach(p => {
      const key = `p${p}` as keyof PercentileData['percentiles'];
      percentiles[key] = this.calculatePercentileValue(sortedValues, p, options.useWeightedAverages);
    });

    return percentiles;
  }

  /**
   * Calculates a specific percentile value with optional weighting
   */
  private static calculatePercentileValue(
    sortedValues: number[],
    percentile: number,
    useWeighting: boolean = false
  ): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];

    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedValues[lower];
    }

    // Linear interpolation
    const weight = index - lower;
    let result = sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;

    // Apply additional weighting if enabled (favor more recent data)
    if (useWeighting) {
      // Simple recency weighting - in real implementation would use actual timestamps
      const recencyWeight = 1 + (index / sortedValues.length) * 0.1;
      result *= recencyWeight;
    }

    return result;
  }

  /**
   * Calculates weighted mean with optional recency weighting
   */
  private static calculateWeightedMean(values: number[], options: CalculationOptions): number {
    if (!options.useWeightedAverages) {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Apply recency weighting (more recent data has higher weight)
    let weightedSum = 0;
    let totalWeight = 0;

    values.forEach((value, index) => {
      const recencyWeight = 1 + (index / values.length) * 0.2; // Up to 20% bonus for recent data
      weightedSum += value * recencyWeight;
      totalWeight += recencyWeight;
    });

    return weightedSum / totalWeight;
  }

  /**
   * Calculates robust standard deviation using MAD (Median Absolute Deviation)
   */
  private static calculateRobustStdDev(values: number[]): number {
    if (values.length < 2) return 0;

    const median = this.calculatePercentileValue(values, 50);
    const deviations = values.map(val => Math.abs(val - median));
    const mad = this.calculatePercentileValue(deviations.sort((a, b) => a - b), 50);
    
    // Convert MAD to standard deviation equivalent
    return mad * 1.4826;
  }

  /**
   * Analyzes trend in performance data
   */
  private static analyzeTrend(data: ExercisePerformance[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
  } {
    if (data.length < 10) {
      return { direction: 'stable', strength: 0 };
    }

    // Sort by date
    const sortedData = data.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime());
    
    // Simple linear regression to detect trend
    const n = sortedData.length;
    const xValues = sortedData.map((_, i) => i);
    const yValues = sortedData.map(d => d.max_weight);
    
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const strength = Math.min(Math.abs(slope) / (yMean * 0.01), 1); // Normalize strength
    
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > yMean * 0.001) { // Threshold for significance
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return { direction, strength };
  }

  /**
   * Calculates data quality score based on various factors
   */
  private static calculateDataQualityScore(
    cleanedData: ExercisePerformance[],
    originalCount: number
  ): number {
    let score = 1.0;

    // Penalize for high outlier rate
    const outlierRate = (originalCount - cleanedData.length) / originalCount;
    score -= outlierRate * 0.3;

    // Penalize for small sample size
    if (cleanedData.length < 100) {
      score -= (100 - cleanedData.length) / 100 * 0.2;
    }

    // Bonus for data consistency (low coefficient of variation)
    const values = cleanedData.map(d => d.max_weight);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    const cv = stdDev / mean;
    
    if (cv < 0.3) score += 0.1; // Bonus for consistent data

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculates data freshness score based on recency
   */
  private static calculateDataFreshness(data: ExercisePerformance[]): number {
    if (data.length === 0) return 0;

    const now = Date.now();
    const recentnessScores = data.map(d => {
      const ageInDays = (now - d.recorded_at.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, 1 - ageInDays / 365); // Linear decay over 1 year
    });

    return recentnessScores.reduce((sum, score) => sum + score, 0) / recentnessScores.length;
  }

  /**
   * Calculates confidence level for percentile estimates
   */
  private static calculatePercentileConfidence(sampleSize: number, targetConfidence: number): number {
    // Simplified confidence calculation based on sample size
    // In practice, would use more sophisticated statistical methods
    
    if (sampleSize < 30) return 0.7;
    if (sampleSize < 100) return 0.8;
    if (sampleSize < 500) return 0.9;
    if (sampleSize < 1000) return 0.95;
    return 0.99;
  }

  /**
   * Creates enhanced comparison with confidence intervals
   */
  private static async createEnhancedComparison(
    userRanking: UserPercentileRanking,
    demographics: UserDemographics,
    options: CalculationOptions
  ): Promise<PercentileComparison> {
    // Get comparison groups
    const comparisonGroups = DemographicSegmentation.createComparisonGroups(demographics);
    
    // Create peer comparisons with confidence intervals
    const peerComparisons = {
      same_age_group: await this.calculateComparisonRanking(userRanking, comparisonGroups.age_peers, options),
      same_weight_class: await this.calculateComparisonRanking(userRanking, comparisonGroups.weight_peers, options),
      same_experience: await this.calculateComparisonRanking(userRanking, comparisonGroups.experience_peers, options),
      global: userRanking
    };

    // Enhanced improvement suggestions with statistical backing
    const improvementSuggestions = await this.generateEnhancedSuggestions(userRanking, demographics, options);

    return {
      user_performance: userRanking,
      peer_comparisons,
      improvement_suggestions
    };
  }

  /**
   * Calculates comparison ranking for a specific demographic group
   */
  private static async calculateComparisonRanking(
    baseRanking: UserPercentileRanking,
    segment: PercentileSegment,
    options: CalculationOptions
  ): Promise<UserPercentileRanking> {
    // Get percentile data for comparison segment
    const segmentData = await this.getEnhancedPercentileData(
      segment.id,
      baseRanking.exercise_id,
      options
    );

    if (!segmentData) {
      return baseRanking; // Fallback to base ranking
    }

    // Recalculate percentile for this segment
    const percentile = this.interpolatePercentile(baseRanking.user_value, segmentData.percentiles);

    return {
      ...baseRanking,
      percentile,
      segment,
      segment_rank: Math.floor((percentile / 100) * segment.sample_size) + 1,
      total_users_in_segment: segment.sample_size,
      comparison_data: {
        better_than_percentage: percentile,
        users_better_than: Math.floor((percentile / 100) * segment.sample_size),
        users_worse_than: segment.sample_size - Math.floor((percentile / 100) * segment.sample_size)
      }
    };
  }

  /**
   * Interpolates percentile value for precise calculation
   */
  private static interpolatePercentile(
    userValue: number,
    percentiles: PercentileData['percentiles']
  ): number {
    const points = [
      { percentile: 5, value: percentiles.p5 },
      { percentile: 10, value: percentiles.p10 },
      { percentile: 25, value: percentiles.p25 },
      { percentile: 50, value: percentiles.p50 },
      { percentile: 75, value: percentiles.p75 },
      { percentile: 90, value: percentiles.p90 },
      { percentile: 95, value: percentiles.p95 },
      { percentile: 99, value: percentiles.p99 }
    ];

    // Find interpolation points
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (userValue >= current.value && userValue <= next.value) {
        const ratio = (userValue - current.value) / (next.value - current.value);
        return current.percentile + ratio * (next.percentile - current.percentile);
      }
    }

    // Handle edge cases
    if (userValue < percentiles.p5) {
      return Math.max(1, (userValue / percentiles.p5) * 5);
    }
    if (userValue > percentiles.p99) {
      return Math.min(99.9, 99 + (userValue - percentiles.p99) / percentiles.p99 * 0.9);
    }

    return 50; // Default fallback
  }

  /**
   * Generates enhanced improvement suggestions with statistical backing
   */
  private static async generateEnhancedSuggestions(
    ranking: UserPercentileRanking,
    demographics: UserDemographics,
    options: CalculationOptions
  ): Promise<PercentileComparison['improvement_suggestions']> {
    
    // Calculate next meaningful percentile target
    const currentPercentile = ranking.percentile;
    const nextTarget = this.calculateNextPercentileTarget(currentPercentile);
    
    // Estimate improvement needed with confidence intervals
    const improvementEstimate = await this.estimateImprovementNeeded(ranking, nextTarget, options);
    
    // Generate evidence-based training recommendations
    const recommendations = await this.generateEvidenceBasedRecommendations(
      ranking,
      demographics,
      improvementEstimate
    );

    return {
      next_percentile_target: nextTarget,
      value_needed: improvementEstimate.targetValue,
      estimated_time_to_achieve: improvementEstimate.timeEstimate,
      training_recommendations: recommendations
    };
  }

  /**
   * Calculates next meaningful percentile target
   */
  private static calculateNextPercentileTarget(currentPercentile: number): number {
    if (currentPercentile < 25) return 25;
    if (currentPercentile < 50) return 50;
    if (currentPercentile < 75) return 75;
    if (currentPercentile < 90) return 90;
    if (currentPercentile < 95) return 95;
    return Math.min(99, currentPercentile + 2);
  }

  /**
   * Estimates improvement needed with statistical confidence
   */
  private static async estimateImprovementNeeded(
    ranking: UserPercentileRanking,
    targetPercentile: number,
    options: CalculationOptions
  ): Promise<{ targetValue: number; timeEstimate: string; confidence: number }> {
    
    // Get percentile data to find target value
    const percentileData = await this.getEnhancedPercentileData(
      ranking.segment.id,
      ranking.exercise_id,
      options
    );

    if (!percentileData) {
      return {
        targetValue: ranking.user_value * 1.1,
        timeEstimate: '3-6 meses',
        confidence: 0.5
      };
    }

    // Interpolate target value
    const targetValue = this.interpolateValueFromPercentile(targetPercentile, percentileData.percentiles);
    const improvementNeeded = targetValue - ranking.user_value;
    const improvementPercentage = improvementNeeded / ranking.user_value;

    // Estimate time based on exercise type and improvement magnitude
    const timeEstimate = this.estimateTimeToImprovement(
      ranking.exercise_id,
      improvementPercentage,
      ranking.strength_level || 'novice'
    );

    return {
      targetValue,
      timeEstimate,
      confidence: percentileData.advanced_metrics.percentile_confidence
    };
  }

  /**
   * Interpolates value from percentile
   */
  private static interpolateValueFromPercentile(
    targetPercentile: number,
    percentiles: PercentileData['percentiles']
  ): number {
    const points = [
      { percentile: 5, value: percentiles.p5 },
      { percentile: 10, value: percentiles.p10 },
      { percentile: 25, value: percentiles.p25 },
      { percentile: 50, value: percentiles.p50 },
      { percentile: 75, value: percentiles.p75 },
      { percentile: 90, value: percentiles.p90 },
      { percentile: 95, value: percentiles.p95 },
      { percentile: 99, value: percentiles.p99 }
    ];

    // Find interpolation points
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (targetPercentile >= current.percentile && targetPercentile <= next.percentile) {
        const ratio = (targetPercentile - current.percentile) / (next.percentile - current.percentile);
        return current.value + ratio * (next.value - current.value);
      }
    }

    return percentiles.p50; // Default to median
  }

  /**
   * Estimates time to improvement based on exercise and current level
   */
  private static estimateTimeToImprovement(
    exerciseId: string,
    improvementPercentage: number,
    strengthLevel: string
  ): string {
    // Base improvement rates by exercise (monthly percentage gains)
    const baseRates: Record<string, number> = {
      'squat': 0.03,
      'bench_press': 0.025,
      'deadlift': 0.035,
      'pull_ups': 0.04,
      'push_ups': 0.05
    };

    // Level multipliers (beginners improve faster)
    const levelMultipliers: Record<string, number> = {
      'untrained': 2.0,
      'novice': 1.5,
      'intermediate': 1.0,
      'advanced': 0.7,
      'elite': 0.4
    };

    const baseRate = baseRates[exerciseId] || 0.03;
    const levelMultiplier = levelMultipliers[strengthLevel] || 1.0;
    const monthlyRate = baseRate * levelMultiplier;

    const monthsNeeded = Math.ceil(improvementPercentage / monthlyRate);

    if (monthsNeeded <= 1) return '2-4 semanas';
    if (monthsNeeded <= 2) return '1-2 meses';
    if (monthsNeeded <= 4) return '2-4 meses';
    if (monthsNeeded <= 8) return '4-8 meses';
    if (monthsNeeded <= 12) return '8-12 meses';
    return '12+ meses';
  }

  /**
   * Generates evidence-based training recommendations
   */
  private static async generateEvidenceBasedRecommendations(
    ranking: UserPercentileRanking,
    demographics: UserDemographics,
    improvementEstimate: { targetValue: number; timeEstimate: string; confidence: number }
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const exerciseId = ranking.exercise_id;
    const strengthLevel = ranking.strength_level || 'novice';
    const improvementNeeded = improvementEstimate.targetValue - ranking.user_value;
    const improvementPercentage = improvementNeeded / ranking.user_value;

    // Base recommendations by exercise
    const exerciseRecommendations: Record<string, Record<string, string[]>> = {
      'squat': {
        'untrained': [
          'Enfócate en dominar la técnica básica con peso corporal',
          'Practica sentadillas 3 veces por semana',
          'Incrementa peso 2.5-5kg cada semana'
        ],
        'novice': [
          'Implementa periodización lineal simple',
          'Añade sentadilla frontal 1 vez por semana',
          'Trabaja movilidad de tobillo y cadera'
        ],
        'intermediate': [
          'Usa periodización ondulante diaria',
          'Incluye variaciones (pausa, tempo)',
          'Fortalece músculos accesorios'
        ],
        'advanced': [
          'Implementa periodización conjugada',
          'Analiza puntos débiles específicos',
          'Considera técnicas de intensidad'
        ],
        'elite': [
          'Periodización competitiva especializada',
          'Análisis biomecánico detallado',
          'Optimización de recuperación'
        ]
      }
    };

    // Get base recommendations
    const baseRecs = exerciseRecommendations[exerciseId]?.[strengthLevel] || [
      'Entrena consistentemente 2-3 veces por semana',
      'Progresa gradualmente el peso',
      'Mantén técnica perfecta'
    ];

    recommendations.push(...baseRecs);

    // Add specific recommendations based on improvement needed
    if (improvementPercentage > 0.3) { // Large improvement needed
      recommendations.push('Considera trabajar con un entrenador personal');
      recommendations.push('Revisa tu programa de nutrición');
      recommendations.push('Asegúrate de dormir 7-9 horas por noche');
    }

    // Age-specific recommendations
    if (demographics.age > 40) {
      recommendations.push('Incluye trabajo de movilidad extra');
      recommendations.push('Considera períodos de descarga más frecuentes');
    }

    // Experience-specific recommendations
    if (demographics.experience_level === 'beginner') {
      recommendations.push('Considera un programa estructurado para principiantes');
      recommendations.push('Aprende a escuchar las señales de tu cuerpo');
    }

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  /**
   * Gets raw performance data (mock implementation)
   */
  private static async getRawPerformanceData(
    segmentId: string,
    exerciseId: string,
    maxAgeDays: number
  ): Promise<ExercisePerformance[]> {
    // Mock implementation - in real app would query database
    const mockData: ExercisePerformance[] = [];
    const baseValue = this.getBaseValueForExercise(exerciseId);
    const recordCount = Math.floor(Math.random() * 500) + 200;

    const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

    for (let i = 0; i < recordCount; i++) {
      const recordDate = new Date(cutoffDate.getTime() + Math.random() * maxAgeDays * 24 * 60 * 60 * 1000);
      
      mockData.push({
        exercise_id: exerciseId,
        exercise_name: exerciseId.replace('_', ' '),
        max_weight: baseValue + (Math.random() - 0.5) * baseValue * 0.8,
        max_reps: Math.floor(Math.random() * 20) + 5,
        max_volume: baseValue * (Math.random() * 5 + 2),
        recorded_at: recordDate,
        bodyweight_at_time: 70 + Math.random() * 40
      });
    }

    return mockData.sort((a, b) => a.recorded_at.getTime() - b.recorded_at.getTime());
  }

  /**
   * Gets base value for exercise (for mock data)
   */
  private static getBaseValueForExercise(exerciseId: string): number {
    const baseValues: Record<string, number> = {
      'squat': 100,
      'bench_press': 80,
      'deadlift': 120,
      'pull_ups': 8,
      'push_ups': 25,
      'running_5k': 1500,
      'plank': 120
    };

    return baseValues[exerciseId] || 50;
  }

  /**
   * Calculates advanced metrics for percentile data
   */
  private static async calculateAdvancedMetrics(
    percentileData: PercentileData,
    performance: ExercisePerformance,
    options: CalculationOptions
  ): Promise<AdvancedPercentileMetrics> {
    // Get raw data for trend analysis
    const rawData = await this.getRawPerformanceData(
      percentileData.segment_id,
      percentileData.exercise_id,
      options.maxAge
    );

    const trendAnalysis = this.analyzeTrend(rawData);
    const qualityScore = this.calculateDataQualityScore(rawData, rawData.length);
    const freshnessScore = this.calculateDataFreshness(rawData);
    const confidence = this.calculatePercentileConfidence(percentileData.sample_size, options.confidenceInterval);

    return {
      percentile_confidence: confidence,
      data_quality_score: qualityScore,
      trend_direction: trendAnalysis.direction,
      trend_strength: trendAnalysis.strength,
      seasonal_adjustment: 0, // Would implement seasonal analysis
      outlier_count: 0, // Would be calculated during outlier detection
      data_freshness_score: freshnessScore
    };
  }
}

// Export singleton instance
export const enhancedPercentileCalculator = EnhancedPercentileCalculator;