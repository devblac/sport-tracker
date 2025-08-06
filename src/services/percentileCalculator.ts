/**
 * Percentile Calculator Service
 * 
 * Calculates user performance percentiles for global comparisons.
 * Supports segmentation by demographics and exercise-specific rankings.
 */

export interface UserDemographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface PerformanceData {
  exerciseId: string;
  exerciseName: string;
  weight: number; // in kg
  reps: number;
  estimatedOneRM: number;
  bodyWeight: number;
  date: Date;
  userId: string;
  demographics: UserDemographics;
}

export interface PercentileResult {
  percentile: number; // 0-100
  rank: number; // actual rank position
  totalUsers: number;
  segment: string; // demographic segment description
  exerciseId: string;
  metric: 'weight' | 'oneRM' | 'volume' | 'relative_strength';
  value: number;
  isPersonalBest: boolean;
}

export interface PercentileSegment {
  ageRange: [number, number];
  gender: string;
  weightRange: [number, number];
  experienceLevel?: string;
  description: string;
}

export class PercentileCalculator {
  private performanceData: Map<string, PerformanceData[]> = new Map();
  private segments: PercentileSegment[] = [];

  constructor() {
    this.initializeSegments();
  }

  /**
   * Initialize demographic segments for percentile calculations
   */
  private initializeSegments(): void {
    this.segments = [
      // Male segments by age and weight
      { ageRange: [18, 25], gender: 'male', weightRange: [60, 75], description: 'Men 18-25, 60-75kg' },
      { ageRange: [18, 25], gender: 'male', weightRange: [75, 90], description: 'Men 18-25, 75-90kg' },
      { ageRange: [18, 25], gender: 'male', weightRange: [90, 120], description: 'Men 18-25, 90-120kg' },
      
      { ageRange: [26, 35], gender: 'male', weightRange: [60, 75], description: 'Men 26-35, 60-75kg' },
      { ageRange: [26, 35], gender: 'male', weightRange: [75, 90], description: 'Men 26-35, 75-90kg' },
      { ageRange: [26, 35], gender: 'male', weightRange: [90, 120], description: 'Men 26-35, 90-120kg' },
      
      { ageRange: [36, 50], gender: 'male', weightRange: [60, 75], description: 'Men 36-50, 60-75kg' },
      { ageRange: [36, 50], gender: 'male', weightRange: [75, 90], description: 'Men 36-50, 75-90kg' },
      { ageRange: [36, 50], gender: 'male', weightRange: [90, 120], description: 'Men 36-50, 90-120kg' },

      // Female segments by age and weight
      { ageRange: [18, 25], gender: 'female', weightRange: [45, 60], description: 'Women 18-25, 45-60kg' },
      { ageRange: [18, 25], gender: 'female', weightRange: [60, 75], description: 'Women 18-25, 60-75kg' },
      { ageRange: [18, 25], gender: 'female', weightRange: [75, 90], description: 'Women 18-25, 75-90kg' },
      
      { ageRange: [26, 35], gender: 'female', weightRange: [45, 60], description: 'Women 26-35, 45-60kg' },
      { ageRange: [26, 35], gender: 'female', weightRange: [60, 75], description: 'Women 26-35, 60-75kg' },
      { ageRange: [26, 35], gender: 'female', weightRange: [75, 90], description: 'Women 26-35, 75-90kg' },
      
      { ageRange: [36, 50], gender: 'female', weightRange: [45, 60], description: 'Women 36-50, 45-60kg' },
      { ageRange: [36, 50], gender: 'female', weightRange: [60, 75], description: 'Women 36-50, 60-75kg' },
      { ageRange: [36, 50], gender: 'female', weightRange: [75, 90], description: 'Women 36-50, 75-90kg' },

      // General segments (fallback)
      { ageRange: [18, 100], gender: 'male', weightRange: [40, 200], description: 'All Men' },
      { ageRange: [18, 100], gender: 'female', weightRange: [30, 150], description: 'All Women' },
      { ageRange: [18, 100], gender: 'other', weightRange: [30, 200], description: 'All Users' }
    ];
  }

  /**
   * Add performance data for percentile calculations
   */
  addPerformanceData(data: PerformanceData): void {
    const exerciseData = this.performanceData.get(data.exerciseId) || [];
    exerciseData.push(data);
    this.performanceData.set(data.exerciseId, exerciseData);
  }

  /**
   * Bulk add performance data
   */
  addBulkPerformanceData(dataArray: PerformanceData[]): void {
    dataArray.forEach(data => this.addPerformanceData(data));
  }

  /**
   * Find the best matching demographic segment for a user
   */
  private findBestSegment(demographics: UserDemographics): PercentileSegment {
    // Try to find exact match first
    for (const segment of this.segments) {
      if (
        demographics.age >= segment.ageRange[0] &&
        demographics.age <= segment.ageRange[1] &&
        demographics.gender === segment.gender &&
        demographics.weight >= segment.weightRange[0] &&
        demographics.weight <= segment.weightRange[1]
      ) {
        return segment;
      }
    }

    // Fallback to gender-only segment
    return this.segments.find(s => 
      s.gender === demographics.gender && 
      s.ageRange[0] === 18 && 
      s.ageRange[1] === 100
    ) || this.segments[this.segments.length - 1];
  }

  /**
   * Filter performance data by demographic segment
   */
  private filterBySegment(
    exerciseData: PerformanceData[], 
    segment: PercentileSegment
  ): PerformanceData[] {
    return exerciseData.filter(data => {
      const demo = data.demographics;
      return (
        demo.age >= segment.ageRange[0] &&
        demo.age <= segment.ageRange[1] &&
        demo.gender === segment.gender &&
        demo.weight >= segment.weightRange[0] &&
        demo.weight <= segment.weightRange[1]
      );
    });
  }

  /**
   * Calculate percentile for a specific metric
   */
  private calculatePercentile(value: number, values: number[]): number {
    if (values.length === 0) return 50; // Default to 50th percentile if no data

    const sortedValues = [...values].sort((a, b) => a - b);
    const rank = sortedValues.filter(v => v < value).length;
    
    return Math.round((rank / sortedValues.length) * 100);
  }

  /**
   * Get metric value from performance data
   */
  private getMetricValue(data: PerformanceData, metric: string): number {
    switch (metric) {
      case 'weight':
        return data.weight;
      case 'oneRM':
        return data.estimatedOneRM;
      case 'volume':
        return data.weight * data.reps;
      case 'relative_strength':
        return data.estimatedOneRM / data.bodyWeight;
      default:
        return data.weight;
    }
  }

  /**
   * Calculate percentile for user performance
   */
  calculatePercentile(
    exerciseId: string,
    userValue: number,
    metric: 'weight' | 'oneRM' | 'volume' | 'relative_strength',
    userDemographics: UserDemographics,
    isPersonalBest: boolean = false
  ): PercentileResult {
    const exerciseData = this.performanceData.get(exerciseId) || [];
    const segment = this.findBestSegment(userDemographics);
    const segmentData = this.filterBySegment(exerciseData, segment);

    // Extract metric values for comparison
    const metricValues = segmentData.map(data => this.getMetricValue(data, metric));
    
    // Calculate percentile
    const percentile = this.calculatePercentile(userValue, metricValues);
    
    // Calculate rank (1-based)
    const sortedValues = [...metricValues].sort((a, b) => b - a); // Descending for rank
    const rank = sortedValues.findIndex(v => v <= userValue) + 1;

    return {
      percentile,
      rank: rank || segmentData.length + 1,
      totalUsers: segmentData.length,
      segment: segment.description,
      exerciseId,
      metric,
      value: userValue,
      isPersonalBest
    };
  }

  /**
   * Get percentiles for all metrics of an exercise
   */
  getExercisePercentiles(
    exerciseId: string,
    userPerformance: PerformanceData
  ): PercentileResult[] {
    const metrics: Array<'weight' | 'oneRM' | 'volume' | 'relative_strength'> = [
      'weight', 'oneRM', 'volume', 'relative_strength'
    ];

    return metrics.map(metric => {
      const value = this.getMetricValue(userPerformance, metric);
      return this.calculatePercentile(
        exerciseId,
        value,
        metric,
        userPerformance.demographics,
        false
      );
    });
  }

  /**
   * Get top performers in a segment
   */
  getTopPerformers(
    exerciseId: string,
    metric: 'weight' | 'oneRM' | 'volume' | 'relative_strength',
    segment: PercentileSegment,
    limit: number = 10
  ): PerformanceData[] {
    const exerciseData = this.performanceData.get(exerciseId) || [];
    const segmentData = this.filterBySegment(exerciseData, segment);

    return segmentData
      .sort((a, b) => this.getMetricValue(b, metric) - this.getMetricValue(a, metric))
      .slice(0, limit);
  }

  /**
   * Get user's ranking in all segments they qualify for
   */
  getUserRankingsAcrossSegments(
    exerciseId: string,
    userPerformance: PerformanceData,
    metric: 'weight' | 'oneRM' | 'volume' | 'relative_strength'
  ): PercentileResult[] {
    const userValue = this.getMetricValue(userPerformance, metric);
    const qualifyingSegments = this.segments.filter(segment => {
      const demo = userPerformance.demographics;
      return (
        demo.age >= segment.ageRange[0] &&
        demo.age <= segment.ageRange[1] &&
        demo.gender === segment.gender &&
        demo.weight >= segment.weightRange[0] &&
        demo.weight <= segment.weightRange[1]
      );
    });

    return qualifyingSegments.map(segment => {
      const exerciseData = this.performanceData.get(exerciseId) || [];
      const segmentData = this.filterBySegment(exerciseData, segment);
      const metricValues = segmentData.map(data => this.getMetricValue(data, metric));
      
      const percentile = this.calculatePercentile(userValue, metricValues);
      const sortedValues = [...metricValues].sort((a, b) => b - a);
      const rank = sortedValues.findIndex(v => v <= userValue) + 1;

      return {
        percentile,
        rank: rank || segmentData.length + 1,
        totalUsers: segmentData.length,
        segment: segment.description,
        exerciseId,
        metric,
        value: userValue,
        isPersonalBest: false
      };
    });
  }

  /**
   * Update percentiles with new performance data
   */
  updatePercentiles(newData: PerformanceData[]): void {
    this.addBulkPerformanceData(newData);
  }

  /**
   * Get statistics for an exercise across all segments
   */
  getExerciseStatistics(exerciseId: string): {
    totalUsers: number;
    segments: Array<{
      segment: string;
      userCount: number;
      averageWeight: number;
      averageOneRM: number;
      topPerformance: number;
    }>;
  } {
    const exerciseData = this.performanceData.get(exerciseId) || [];
    
    const segmentStats = this.segments.map(segment => {
      const segmentData = this.filterBySegment(exerciseData, segment);
      
      if (segmentData.length === 0) {
        return {
          segment: segment.description,
          userCount: 0,
          averageWeight: 0,
          averageOneRM: 0,
          topPerformance: 0
        };
      }

      const avgWeight = segmentData.reduce((sum, d) => sum + d.weight, 0) / segmentData.length;
      const avgOneRM = segmentData.reduce((sum, d) => sum + d.estimatedOneRM, 0) / segmentData.length;
      const topPerformance = Math.max(...segmentData.map(d => d.estimatedOneRM));

      return {
        segment: segment.description,
        userCount: segmentData.length,
        averageWeight: Math.round(avgWeight * 10) / 10,
        averageOneRM: Math.round(avgOneRM * 10) / 10,
        topPerformance: Math.round(topPerformance * 10) / 10
      };
    }).filter(stat => stat.userCount > 0);

    return {
      totalUsers: exerciseData.length,
      segments: segmentStats
    };
  }

  /**
   * Clear all performance data (for testing or reset)
   */
  clearData(): void {
    this.performanceData.clear();
  }

  /**
   * Get all available segments
   */
  getSegments(): PercentileSegment[] {
    return [...this.segments];
  }
}

// Singleton instance
export const percentileCalculator = new PercentileCalculator();