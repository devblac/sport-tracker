/**
 * Percentile Calculator Service
 * Handles calculation of percentiles for user performance comparisons
 */

import {
  UserDemographics,
  ExercisePerformance,
  PercentileSegment,
  PercentileData,
  UserPercentileRanking,
  PercentileComparison,
  StrengthStandards,
  GlobalRanking,
  PercentileCalculationResult,
  DEMOGRAPHIC_SEGMENTS,
  STRENGTH_LEVEL_THRESHOLDS
} from '../types/percentiles';

export class PercentileCalculator {
  
  /**
   * Calculates percentiles for a user's performance across different demographic segments
   */
  static async calculateUserPercentiles(
    userId: string,
    demographics: UserDemographics,
    performances: ExercisePerformance[]
  ): Promise<PercentileCalculationResult> {
    const startTime = Date.now();
    
    try {
      const userRankings: UserPercentileRanking[] = [];
      const comparisons: PercentileComparison[] = [];
      const updatedSegments: string[] = [];
      
      for (const performance of performances) {
        // Find relevant segments for this user
        const segments = this.findRelevantSegments(demographics);
        
        for (const segment of segments) {
          // Get percentile data for this segment and exercise
          const percentileData = await this.getPercentileData(segment.id, performance.exercise_id);
          
          if (percentileData) {
            // Calculate user's percentile ranking
            const ranking = this.calculatePercentileRanking(
              userId,
              performance,
              percentileData,
              segment,
              demographics
            );
            
            userRankings.push(ranking);
            
            // Create comparison data
            const comparison = await this.createPercentileComparison(ranking, demographics);
            comparisons.push(comparison);
            
            updatedSegments.push(segment.id);
          }
        }
      }
      
      const calculationTime = Date.now() - startTime;
      
      return {
        success: true,
        user_rankings: userRankings,
        comparisons,
        updated_segments: [...new Set(updatedSegments)],
        calculation_time_ms: calculationTime
      };
      
    } catch (error) {
      console.error('Error calculating percentiles:', error);
      return {
        success: false,
        user_rankings: [],
        comparisons: [],
        updated_segments: [],
        calculation_time_ms: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  /**
   * Finds demographic segments relevant to a user
   */
  private static findRelevantSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    
    // Age-based segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, ageGroup]) => {
      if ('age_min' in ageGroup && 'age_max' in ageGroup) {
        if (demographics.age >= ageGroup.age_min && demographics.age <= ageGroup.age_max) {
          segments.push({
            id: `age_${key.toLowerCase()}`,
            name: ageGroup.name,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: 'all',
            sample_size: 1000, // Mock data
            last_updated: new Date()
          });
          
          // Gender-specific segment
          segments.push({
            id: `age_${key.toLowerCase()}_${demographics.gender}`,
            name: `${ageGroup.name} - ${demographics.gender}`,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: demographics.gender,
            sample_size: 500, // Mock data
            last_updated: new Date()
          });
        }
      }
    });
    
    // Weight-based segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, weightClass]) => {
      if ('weight_min' in weightClass && 'weight_max' in weightClass) {
        if (demographics.weight >= weightClass.weight_min && demographics.weight <= weightClass.weight_max) {
          segments.push({
            id: `weight_${key.toLowerCase()}`,
            name: weightClass.name,
            age_min: 0,
            age_max: 99,
            gender: 'all',
            weight_min: weightClass.weight_min,
            weight_max: weightClass.weight_max,
            sample_size: 800, // Mock data
            last_updated: new Date()
          });
          
          // Gender-specific weight segment
          segments.push({
            id: `weight_${key.toLowerCase()}_${demographics.gender}`,
            name: `${weightClass.name} - ${demographics.gender}`,
            age_min: 0,
            age_max: 99,
            gender: demographics.gender,
            weight_min: weightClass.weight_min,
            weight_max: weightClass.weight_max,
            sample_size: 400, // Mock data
            last_updated: new Date()
          });
        }
      }
    });
    
    // Experience-based segment
    segments.push({
      id: `experience_${demographics.experience_level}`,
      name: `${demographics.experience_level} level`,
      age_min: 0,
      age_max: 99,
      gender: 'all',
      experience_level: demographics.experience_level,
      sample_size: 600, // Mock data
      last_updated: new Date()
    });
    
    // Global segment
    segments.push({
      id: 'global_all',
      name: 'Global (All Users)',
      age_min: 0,
      age_max: 99,
      gender: 'all',
      sample_size: 10000, // Mock data
      last_updated: new Date()
    });
    
    return segments;
  }
  
  /**
   * Gets percentile data for a specific segment and exercise
   */
  private static async getPercentileData(
    segmentId: string,
    exerciseId: string
  ): Promise<PercentileData | null> {
    // In a real implementation, this would fetch from database
    // For now, return mock percentile data
    
    const mockPercentiles = this.generateMockPercentileData(segmentId, exerciseId);
    return mockPercentiles;
  }
  
  /**
   * Generates mock percentile data for testing
   */
  private static generateMockPercentileData(segmentId: string, exerciseId: string): PercentileData {
    // Generate realistic percentile data based on exercise type
    const baseValues = this.getBaseValuesForExercise(exerciseId);
    
    return {
      segment_id: segmentId,
      exercise_id: exerciseId,
      metric_type: 'max_weight',
      percentiles: {
        p5: baseValues.base * 0.4,
        p10: baseValues.base * 0.5,
        p25: baseValues.base * 0.7,
        p50: baseValues.base * 1.0,
        p75: baseValues.base * 1.3,
        p90: baseValues.base * 1.6,
        p95: baseValues.base * 1.8,
        p99: baseValues.base * 2.2
      },
      mean: baseValues.base * 1.05,
      std_deviation: baseValues.base * 0.3,
      sample_size: Math.floor(Math.random() * 1000) + 500,
      last_updated: new Date()
    };
  }
  
  /**
   * Gets base values for different exercises (for mock data generation)
   */
  private static getBaseValuesForExercise(exerciseId: string): { base: number; unit: string } {
    const exerciseBaseValues: Record<string, { base: number; unit: string }> = {
      'squat': { base: 100, unit: 'kg' },
      'bench_press': { base: 80, unit: 'kg' },
      'deadlift': { base: 120, unit: 'kg' },
      'pull_ups': { base: 8, unit: 'reps' },
      'push_ups': { base: 25, unit: 'reps' },
      'running_5k': { base: 1500, unit: 'seconds' }, // 25 minutes
      'plank': { base: 120, unit: 'seconds' }
    };
    
    return exerciseBaseValues[exerciseId] || { base: 50, unit: 'kg' };
  }
  
  /**
   * Calculates a user's percentile ranking for a specific performance
   */
  private static calculatePercentileRanking(
    userId: string,
    performance: ExercisePerformance,
    percentileData: PercentileData,
    segment: PercentileSegment,
    demographics: UserDemographics
  ): UserPercentileRanking {
    
    const userValue = performance.max_weight; // Using max_weight as primary metric
    const percentiles = percentileData.percentiles;
    
    // Calculate percentile by finding where user value falls
    let percentile = 0;
    if (userValue <= percentiles.p5) percentile = 5;
    else if (userValue <= percentiles.p10) percentile = 10;
    else if (userValue <= percentiles.p25) percentile = 25;
    else if (userValue <= percentiles.p50) percentile = 50;
    else if (userValue <= percentiles.p75) percentile = 75;
    else if (userValue <= percentiles.p90) percentile = 90;
    else if (userValue <= percentiles.p95) percentile = 95;
    else percentile = 99;
    
    // More precise calculation using interpolation
    percentile = this.interpolatePercentile(userValue, percentiles);
    
    // Calculate comparison data
    const betterThanPercentage = percentile;
    const usersBetterThan = Math.floor((percentile / 100) * segment.sample_size);
    const usersWorseThan = segment.sample_size - usersBetterThan;
    
    // Determine strength level
    const strengthLevel = this.determineStrengthLevel(percentile);
    
    return {
      user_id: userId,
      exercise_id: performance.exercise_id,
      exercise_name: performance.exercise_name,
      metric_type: 'max_weight',
      user_value: userValue,
      percentile,
      segment,
      segment_rank: usersBetterThan + 1,
      total_users_in_segment: segment.sample_size,
      comparison_data: {
        better_than_percentage: betterThanPercentage,
        users_better_than: usersBetterThan,
        users_worse_than: usersWorseThan
      },
      strength_level: strengthLevel,
      calculated_at: new Date()
    };
  }
  
  /**
   * Interpolates percentile value for more precise calculation
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
    
    // Find the two points to interpolate between
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      if (userValue >= current.value && userValue <= next.value) {
        // Linear interpolation
        const ratio = (userValue - current.value) / (next.value - current.value);
        return current.percentile + ratio * (next.percentile - current.percentile);
      }
    }
    
    // Handle edge cases
    if (userValue < percentiles.p5) return Math.max(1, (userValue / percentiles.p5) * 5);
    if (userValue > percentiles.p99) return Math.min(99.9, 99 + (userValue - percentiles.p99) / percentiles.p99);
    
    return 50; // Default fallback
  }
  
  /**
   * Determines strength level based on percentile
   */
  private static determineStrengthLevel(percentile: number): UserPercentileRanking['strength_level'] {
    if (percentile >= STRENGTH_LEVEL_THRESHOLDS.ELITE) return 'elite';
    if (percentile >= STRENGTH_LEVEL_THRESHOLDS.ADVANCED) return 'advanced';
    if (percentile >= STRENGTH_LEVEL_THRESHOLDS.INTERMEDIATE) return 'intermediate';
    if (percentile >= STRENGTH_LEVEL_THRESHOLDS.NOVICE) return 'novice';
    return 'untrained';
  }
  
  /**
   * Creates comprehensive percentile comparison data
   */
  private static async createPercentileComparison(
    userRanking: UserPercentileRanking,
    demographics: UserDemographics
  ): Promise<PercentileComparison> {
    
    // Create peer comparisons (mock implementation)
    const peerComparisons = {
      same_age_group: { ...userRanking, percentile: userRanking.percentile + Math.random() * 10 - 5 },
      same_weight_class: { ...userRanking, percentile: userRanking.percentile + Math.random() * 8 - 4 },
      same_experience: { ...userRanking, percentile: userRanking.percentile + Math.random() * 12 - 6 },
      global: userRanking
    };
    
    // Calculate improvement suggestions
    const nextPercentileTarget = Math.min(99, Math.ceil(userRanking.percentile / 10) * 10 + 10);
    const currentValue = userRanking.user_value;
    const targetPercentile = nextPercentileTarget;
    
    // Estimate value needed for next percentile (mock calculation)
    const valueNeeded = currentValue * (1 + (targetPercentile - userRanking.percentile) * 0.02);
    const improvementNeeded = valueNeeded - currentValue;
    
    const improvementSuggestions = {
      next_percentile_target: targetPercentile,
      value_needed: valueNeeded,
      estimated_time_to_achieve: this.estimateTimeToImprovement(improvementNeeded, userRanking.exercise_id),
      training_recommendations: this.getTrainingRecommendations(userRanking.exercise_id, userRanking.strength_level)
    };
    
    return {
      user_performance: userRanking,
      peer_comparisons,
      improvement_suggestions
    };
  }
  
  /**
   * Estimates time needed to achieve improvement
   */
  private static estimateTimeToImprovement(improvementNeeded: number, exerciseId: string): string {
    // Simple estimation based on exercise type and improvement needed
    const improvementRates: Record<string, number> = {
      'squat': 2.5, // kg per month
      'bench_press': 1.5,
      'deadlift': 3.0,
      'pull_ups': 0.5, // reps per month
      'push_ups': 2.0
    };
    
    const monthlyRate = improvementRates[exerciseId] || 2.0;
    const monthsNeeded = Math.ceil(improvementNeeded / monthlyRate);
    
    if (monthsNeeded <= 1) return '2-4 semanas';
    if (monthsNeeded <= 3) return `${monthsNeeded} meses`;
    if (monthsNeeded <= 6) return `${monthsNeeded} meses`;
    return '6+ meses';
  }
  
  /**
   * Gets training recommendations based on exercise and current level
   */
  private static getTrainingRecommendations(
    exerciseId: string,
    strengthLevel: UserPercentileRanking['strength_level']
  ): string[] {
    const recommendations: Record<string, Record<string, string[]>> = {
      'squat': {
        'untrained': ['Enfócate en la técnica', 'Entrena 2-3 veces por semana', 'Incrementa peso gradualmente'],
        'novice': ['Añade variaciones de sentadilla', 'Incluye trabajo de movilidad', 'Considera periodización'],
        'intermediate': ['Implementa ciclos de fuerza', 'Añade sentadilla frontal', 'Trabaja debilidades específicas'],
        'advanced': ['Periodización avanzada', 'Técnicas de intensidad', 'Análisis biomecánico'],
        'elite': ['Periodización competitiva', 'Recuperación optimizada', 'Técnicas especializadas']
      },
      'bench_press': {
        'untrained': ['Domina la técnica básica', 'Fortalece músculos estabilizadores', 'Progresión lineal'],
        'novice': ['Varía el agarre', 'Incluye press inclinado', 'Trabajo de tríceps'],
        'intermediate': ['Periodización ondulante', 'Press con pausa', 'Trabajo de debilidades'],
        'advanced': ['Técnicas de intensidad', 'Análisis de sticking points', 'Periodización conjugada'],
        'elite': ['Técnicas competitivas', 'Periodización específica', 'Optimización biomecánica']
      }
    };
    
    const exerciseRecs = recommendations[exerciseId];
    if (!exerciseRecs) {
      return ['Entrena consistentemente', 'Progresa gradualmente', 'Mantén buena técnica'];
    }
    
    return exerciseRecs[strengthLevel || 'novice'] || exerciseRecs['novice'];
  }
  
  /**
   * Updates percentile data for a segment (batch processing)
   */
  static async updateSegmentPercentiles(
    segmentId: string,
    exerciseId: string,
    performanceData: ExercisePerformance[]
  ): Promise<PercentileData> {
    
    // Sort performance data by value
    const sortedData = performanceData
      .map(p => p.max_weight)
      .sort((a, b) => a - b);
    
    if (sortedData.length === 0) {
      throw new Error('No performance data provided');
    }
    
    // Calculate percentiles
    const percentiles = {
      p5: this.calculatePercentileValue(sortedData, 5),
      p10: this.calculatePercentileValue(sortedData, 10),
      p25: this.calculatePercentileValue(sortedData, 25),
      p50: this.calculatePercentileValue(sortedData, 50),
      p75: this.calculatePercentileValue(sortedData, 75),
      p90: this.calculatePercentileValue(sortedData, 90),
      p95: this.calculatePercentileValue(sortedData, 95),
      p99: this.calculatePercentileValue(sortedData, 99)
    };
    
    // Calculate mean and standard deviation
    const mean = sortedData.reduce((sum, val) => sum + val, 0) / sortedData.length;
    const variance = sortedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sortedData.length;
    const stdDeviation = Math.sqrt(variance);
    
    const percentileData: PercentileData = {
      segment_id: segmentId,
      exercise_id: exerciseId,
      metric_type: 'max_weight',
      percentiles,
      mean,
      std_deviation: stdDeviation,
      sample_size: sortedData.length,
      last_updated: new Date()
    };
    
    // In a real implementation, this would save to database
    console.log('Updated percentile data:', percentileData);
    
    return percentileData;
  }
  
  /**
   * Calculates a specific percentile value from sorted data
   */
  private static calculatePercentileValue(sortedData: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedData[lower];
    }
    
    // Linear interpolation
    const weight = index - lower;
    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }
  
  /**
   * Gets global rankings for an exercise
   */
  static async getGlobalRankings(
    exerciseId: string,
    metricType: 'max_weight' | 'max_reps' | 'max_volume' | 'best_time' | 'best_distance',
    limit: number = 100
  ): Promise<GlobalRanking> {
    
    // Mock global rankings data
    const mockRankings = Array.from({ length: limit }, (_, i) => ({
      rank: i + 1,
      user_id: `user_${i + 1}`,
      username: `athlete${i + 1}`,
      display_name: `Athlete ${i + 1}`,
      value: this.generateMockRankingValue(exerciseId, i + 1),
      bodyweight: 70 + Math.random() * 40,
      relative_strength: 0,
      demographics: {
        age: 20 + Math.floor(Math.random() * 40),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        weight: 70 + Math.random() * 40
      },
      verified: Math.random() > 0.7,
      recorded_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    }));
    
    // Calculate relative strength for strength exercises
    mockRankings.forEach(ranking => {
      if (['squat', 'bench_press', 'deadlift'].includes(exerciseId)) {
        ranking.relative_strength = ranking.value / ranking.bodyweight!;
      }
    });
    
    return {
      exercise_id: exerciseId,
      exercise_name: exerciseId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      metric_type: metricType,
      rankings: mockRankings,
      total_participants: limit * 10, // Simulate larger population
      last_updated: new Date()
    };
  }
  
  /**
   * Generates mock ranking values for testing
   */
  private static generateMockRankingValue(exerciseId: string, rank: number): number {
    const baseValues = this.getBaseValuesForExercise(exerciseId);
    const maxValue = baseValues.base * 3; // Elite level
    
    // Higher ranks get higher values (exponential decay)
    const normalizedRank = (101 - rank) / 100; // Invert rank (1st place = 1.0, 100th = 0.01)
    const value = maxValue * Math.pow(normalizedRank, 0.5) + Math.random() * 10;
    
    return Math.round(value * 10) / 10; // Round to 1 decimal place
  }
}