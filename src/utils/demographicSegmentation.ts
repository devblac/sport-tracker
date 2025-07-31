/**
 * Enhanced Demographic Segmentation Utilities
 * Provides advanced utilities for creating and managing demographic segments for percentile calculations
 * Implements requirement 15.1 - Advanced demographic segmentation
 */

import {
  UserDemographics,
  PercentileSegment,
  DEMOGRAPHIC_SEGMENTS
} from '../types/percentiles';

// Enhanced segmentation options
interface SegmentationOptions {
  includeBodyFatSegments: boolean;
  includeExperienceSegments: boolean;
  includeCombinedSegments: boolean;
  maxSegments: number;
  minSampleSize: number;
  prioritizeSpecificity: boolean;
}

// Segment quality metrics
interface SegmentQuality {
  specificity_score: number;
  sample_size_score: number;
  relevance_score: number;
  overall_quality: number;
  confidence_level: number;
}

export class DemographicSegmentation {
  
  private static readonly DEFAULT_OPTIONS: SegmentationOptions = {
    includeBodyFatSegments: true,
    includeExperienceSegments: true,
    includeCombinedSegments: true,
    maxSegments: 10,
    minSampleSize: 30,
    prioritizeSpecificity: true
  };

  /**
   * Creates enhanced demographic segments for a user with quality scoring
   */
  static createEnhancedUserSegments(
    demographics: UserDemographics,
    options: Partial<SegmentationOptions> = {}
  ): Array<PercentileSegment & { quality: SegmentQuality }> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const segments = this.createUserSegments(demographics);
    
    // Add quality scoring to each segment
    const enhancedSegments = segments.map(segment => ({
      ...segment,
      quality: this.calculateSegmentQuality(segment, demographics)
    }));

    // Sort by quality and limit results
    return enhancedSegments
      .sort((a, b) => b.quality.overall_quality - a.quality.overall_quality)
      .slice(0, opts.maxSegments);
  }

  /**
   * Creates all possible demographic segments for a user
   */
  static createUserSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    
    // Age-based segments
    segments.push(...this.createAgeSegments(demographics));
    
    // Weight-based segments
    segments.push(...this.createWeightSegments(demographics));
    
    // Experience-based segments
    segments.push(...this.createExperienceSegments(demographics));
    
    // Combined segments (age + gender, weight + gender, etc.)
    segments.push(...this.createCombinedSegments(demographics));
    
    // Global segment
    segments.push(this.createGlobalSegment());
    
    return segments;
  }
  
  /**
   * Creates age-based segments
   */
  private static createAgeSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, ageGroup]) => {
      if ('age_min' in ageGroup && 'age_max' in ageGroup) {
        if (demographics.age >= ageGroup.age_min && demographics.age <= ageGroup.age_max) {
          segments.push({
            id: `age_${key.toLowerCase()}`,
            name: ageGroup.name,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: 'all',
            sample_size: this.estimateSampleSize('age', key),
            last_updated: new Date()
          });
        }
      }
    });
    
    return segments;
  }
  
  /**
   * Creates weight-based segments
   */
  private static createWeightSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    
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
            sample_size: this.estimateSampleSize('weight', key),
            last_updated: new Date()
          });
        }
      }
    });
    
    return segments;
  }
  
  /**
   * Creates experience-based segments
   */
  private static createExperienceSegments(demographics: UserDemographics): PercentileSegment[] {
    return [{
      id: `experience_${demographics.experience_level}`,
      name: `${demographics.experience_level.charAt(0).toUpperCase() + demographics.experience_level.slice(1)} Level`,
      age_min: 0,
      age_max: 99,
      gender: 'all',
      experience_level: demographics.experience_level,
      sample_size: this.estimateSampleSize('experience', demographics.experience_level),
      last_updated: new Date()
    }];
  }
  
  /**
   * Creates combined demographic segments
   */
  private static createCombinedSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    
    // Age + Gender segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, ageGroup]) => {
      if ('age_min' in ageGroup && 'age_max' in ageGroup) {
        if (demographics.age >= ageGroup.age_min && demographics.age <= ageGroup.age_max) {
          segments.push({
            id: `age_${key.toLowerCase()}_${demographics.gender}`,
            name: `${ageGroup.name} - ${demographics.gender.charAt(0).toUpperCase() + demographics.gender.slice(1)}`,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: demographics.gender,
            sample_size: this.estimateSampleSize('age_gender', `${key}_${demographics.gender}`),
            last_updated: new Date()
          });
        }
      }
    });
    
    // Weight + Gender segments
    Object.entries(DEMOGRAPHIC_SEGMENTS).forEach(([key, weightClass]) => {
      if ('weight_min' in weightClass && 'weight_max' in weightClass) {
        if (demographics.weight >= weightClass.weight_min && demographics.weight <= weightClass.weight_max) {
          segments.push({
            id: `weight_${key.toLowerCase()}_${demographics.gender}`,
            name: `${weightClass.name} - ${demographics.gender.charAt(0).toUpperCase() + demographics.gender.slice(1)}`,
            age_min: 0,
            age_max: 99,
            gender: demographics.gender,
            weight_min: weightClass.weight_min,
            weight_max: weightClass.weight_max,
            sample_size: this.estimateSampleSize('weight_gender', `${key}_${demographics.gender}`),
            last_updated: new Date()
          });
        }
      }
    });
    
    // Experience + Gender segments
    segments.push({
      id: `experience_${demographics.experience_level}_${demographics.gender}`,
      name: `${demographics.experience_level.charAt(0).toUpperCase() + demographics.experience_level.slice(1)} ${demographics.gender.charAt(0).toUpperCase() + demographics.gender.slice(1)}`,
      age_min: 0,
      age_max: 99,
      gender: demographics.gender,
      experience_level: demographics.experience_level,
      sample_size: this.estimateSampleSize('experience_gender', `${demographics.experience_level}_${demographics.gender}`),
      last_updated: new Date()
    });
    
    return segments;
  }
  
  /**
   * Creates global segment
   */
  private static createGlobalSegment(): PercentileSegment {
    return {
      id: 'global_all',
      name: 'Global (All Users)',
      age_min: 0,
      age_max: 99,
      gender: 'all',
      sample_size: 50000, // Large global sample
      last_updated: new Date()
    };
  }
  
  /**
   * Estimates sample size for different segment types
   */
  private static estimateSampleSize(segmentType: string, segmentKey: string): number {
    const baseSizes: Record<string, number> = {
      'age': 2000,
      'weight': 1500,
      'experience': 1000,
      'age_gender': 1000,
      'weight_gender': 750,
      'experience_gender': 500
    };
    
    const baseSize = baseSizes[segmentType] || 500;
    
    // Add some variation based on segment popularity
    const popularityMultipliers: Record<string, number> = {
      'ADULT': 1.5,
      'MIDDLEWEIGHT': 1.3,
      'intermediate': 1.4,
      'male': 1.2,
      'female': 0.9
    };
    
    let multiplier = 1.0;
    Object.entries(popularityMultipliers).forEach(([key, mult]) => {
      if (segmentKey.toUpperCase().includes(key.toUpperCase())) {
        multiplier *= mult;
      }
    });
    
    return Math.floor(baseSize * multiplier);
  }
  
  /**
   * Validates if a user fits within a segment's criteria
   */
  static validateUserInSegment(demographics: UserDemographics, segment: PercentileSegment): boolean {
    // Age validation
    if (demographics.age < segment.age_min || demographics.age > segment.age_max) {
      return false;
    }
    
    // Gender validation
    if (segment.gender !== 'all' && demographics.gender !== segment.gender) {
      return false;
    }
    
    // Weight validation
    if (segment.weight_min !== undefined && demographics.weight < segment.weight_min) {
      return false;
    }
    if (segment.weight_max !== undefined && demographics.weight > segment.weight_max) {
      return false;
    }
    
    // Experience validation
    if (segment.experience_level !== undefined && 
        segment.experience_level !== 'all' && 
        demographics.experience_level !== segment.experience_level) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Gets the most specific segments for a user (prioritizes more specific over general)
   */
  static getMostSpecificSegments(demographics: UserDemographics): PercentileSegment[] {
    const allSegments = this.createUserSegments(demographics);
    
    // Sort by specificity (more criteria = more specific)
    return allSegments.sort((a, b) => {
      const specificityA = this.calculateSegmentSpecificity(a);
      const specificityB = this.calculateSegmentSpecificity(b);
      return specificityB - specificityA; // Descending order
    });
  }
  
  /**
   * Calculates segment specificity score
   */
  private static calculateSegmentSpecificity(segment: PercentileSegment): number {
    let score = 0;
    
    // Age range specificity
    const ageRange = segment.age_max - segment.age_min;
    if (ageRange < 99) score += 1; // Not global age range
    if (ageRange <= 20) score += 1; // Narrow age range
    
    // Gender specificity
    if (segment.gender !== 'all') score += 1;
    
    // Weight specificity
    if (segment.weight_min !== undefined || segment.weight_max !== undefined) {
      score += 1;
      const weightRange = (segment.weight_max || 999) - (segment.weight_min || 0);
      if (weightRange <= 30) score += 1; // Narrow weight range
    }
    
    // Experience specificity
    if (segment.experience_level !== undefined && segment.experience_level !== 'all') {
      score += 1;
    }
    
    return score;
  }
  
  /**
   * Creates segment comparison groups for a user
   */
  static createComparisonGroups(demographics: UserDemographics): {
    peer_group: PercentileSegment;
    age_peers: PercentileSegment;
    weight_peers: PercentileSegment;
    experience_peers: PercentileSegment;
    gender_peers: PercentileSegment;
    global: PercentileSegment;
  } {
    const segments = this.createUserSegments(demographics);
    
    return {
      peer_group: segments.find(s => s.id.includes('age') && s.id.includes(demographics.gender)) || segments[0],
      age_peers: segments.find(s => s.id.startsWith('age_') && !s.id.includes(demographics.gender)) || segments[0],
      weight_peers: segments.find(s => s.id.startsWith('weight_') && !s.id.includes(demographics.gender)) || segments[0],
      experience_peers: segments.find(s => s.id.startsWith('experience_') && !s.id.includes(demographics.gender)) || segments[0],
      gender_peers: segments.find(s => s.gender === demographics.gender && s.id === 'global_all') || segments[0],
      global: segments.find(s => s.id === 'global_all') || segments[0]
    };
  }
  
  /**
   * Gets segment display information for UI
   */
  static getSegmentDisplayInfo(segment: PercentileSegment): {
    icon: string;
    color: string;
    description: string;
    shortName: string;
  } {
    const info = {
      icon: '👥',
      color: '#6b7280',
      description: segment.name,
      shortName: segment.name
    };
    
    if (segment.id.includes('global')) {
      info.icon = '🌍';
      info.color = '#3b82f6';
      info.shortName = 'Global';
    } else if (segment.id.includes('age')) {
      info.icon = '📅';
      info.color = '#10b981';
      info.shortName = 'Age Group';
    } else if (segment.id.includes('weight')) {
      info.icon = '⚖️';
      info.color = '#f59e0b';
      info.shortName = 'Weight Class';
    } else if (segment.id.includes('experience')) {
      info.icon = '🎯';
      info.color = '#8b5cf6';
      info.shortName = 'Experience';
    }
    
    if (segment.gender !== 'all') {
      info.icon = segment.gender === 'male' ? '♂️' : segment.gender === 'female' ? '♀️' : '⚧️';
    }
    
    return info;
  }
  
  /**
   * Suggests optimal segments for percentile calculations with enhanced scoring
   */
  static suggestOptimalSegments(
    demographics: UserDemographics,
    exerciseId: string,
    availableData: { segment_id: string; sample_size: number }[]
  ): PercentileSegment[] {
    const allPossibleSegments = this.createUserSegments(demographics);
    
    // Filter segments that have sufficient data
    const viableSegments = allPossibleSegments.filter(segment => {
      const dataInfo = availableData.find(d => d.segment_id === segment.id);
      return dataInfo && dataInfo.sample_size >= 50; // Minimum sample size
    });
    
    // Sort by combination of specificity and sample size
    return viableSegments.sort((a, b) => {
      const dataA = availableData.find(d => d.segment_id === a.id);
      const dataB = availableData.find(d => d.segment_id === b.id);
      
      const specificityA = this.calculateSegmentSpecificity(a);
      const specificityB = this.calculateSegmentSpecificity(b);
      
      const sampleSizeA = dataA?.sample_size || 0;
      const sampleSizeB = dataB?.sample_size || 0;
      
      // Weighted score: specificity * 0.6 + normalized sample size * 0.4
      const scoreA = specificityA * 0.6 + (sampleSizeA / 10000) * 0.4;
      const scoreB = specificityB * 0.6 + (sampleSizeB / 10000) * 0.4;
      
      return scoreB - scoreA;
    }).slice(0, 5); // Return top 5 optimal segments
  }

  /**
   * Calculates quality metrics for a demographic segment
   */
  private static calculateSegmentQuality(
    segment: PercentileSegment,
    demographics: UserDemographics
  ): SegmentQuality {
    // Calculate specificity score (0-1)
    const specificityScore = this.calculateSegmentSpecificity(segment) / 6; // Max specificity is 6
    
    // Calculate sample size score (0-1)
    const sampleSizeScore = Math.min(segment.sample_size / 1000, 1); // Normalize to 1000
    
    // Calculate relevance score based on how well segment matches user
    const relevanceScore = this.calculateRelevanceScore(segment, demographics);
    
    // Calculate overall quality (weighted average)
    const overallQuality = (
      specificityScore * 0.4 +
      sampleSizeScore * 0.3 +
      relevanceScore * 0.3
    );
    
    // Calculate confidence level based on sample size and specificity
    const confidenceLevel = Math.min(
      (specificityScore + sampleSizeScore) / 2,
      0.95
    );

    return {
      specificity_score: specificityScore,
      sample_size_score: sampleSizeScore,
      relevance_score: relevanceScore,
      overall_quality: overallQuality,
      confidence_level: confidenceLevel
    };
  }

  /**
   * Calculates how relevant a segment is to a specific user
   */
  private static calculateRelevanceScore(
    segment: PercentileSegment,
    demographics: UserDemographics
  ): number {
    let score = 1.0;

    // Age relevance
    const ageRange = segment.age_max - segment.age_min;
    const userAge = demographics.age;
    const ageMidpoint = (segment.age_min + segment.age_max) / 2;
    const ageDistance = Math.abs(userAge - ageMidpoint) / (ageRange / 2);
    score *= Math.max(0.5, 1 - ageDistance * 0.3);

    // Gender relevance
    if (segment.gender !== 'all' && segment.gender === demographics.gender) {
      score *= 1.2; // Bonus for gender match
    } else if (segment.gender !== 'all' && segment.gender !== demographics.gender) {
      score *= 0.3; // Penalty for gender mismatch
    }

    // Weight relevance
    if (segment.weight_min !== undefined && segment.weight_max !== undefined) {
      const weightRange = segment.weight_max - segment.weight_min;
      const weightMidpoint = (segment.weight_min + segment.weight_max) / 2;
      const weightDistance = Math.abs(demographics.weight - weightMidpoint) / (weightRange / 2);
      score *= Math.max(0.6, 1 - weightDistance * 0.2);
    }

    // Experience relevance
    if (segment.experience_level !== undefined && 
        segment.experience_level !== 'all' &&
        segment.experience_level === demographics.experience_level) {
      score *= 1.15; // Bonus for experience match
    }

    return Math.min(score, 1.0);
  }

  /**
   * Creates body fat percentage segments if data is available
   */
  static createBodyFatSegments(demographics: UserDemographics): PercentileSegment[] {
    if (!demographics.body_fat_percentage) return [];

    const segments: PercentileSegment[] = [];
    const bodyFat = demographics.body_fat_percentage;

    // Define body fat categories
    const categories = demographics.gender === 'male' ? {
      'essential': { min: 2, max: 5 },
      'athletes': { min: 6, max: 13 },
      'fitness': { min: 14, max: 17 },
      'average': { min: 18, max: 24 },
      'obese': { min: 25, max: 50 }
    } : {
      'essential': { min: 10, max: 13 },
      'athletes': { min: 14, max: 20 },
      'fitness': { min: 21, max: 24 },
      'average': { min: 25, max: 31 },
      'obese': { min: 32, max: 50 }
    };

    Object.entries(categories).forEach(([category, range]) => {
      if (bodyFat >= range.min && bodyFat <= range.max) {
        segments.push({
          id: `bodyfat_${category}_${demographics.gender}`,
          name: `${category.charAt(0).toUpperCase() + category.slice(1)} Body Fat (${demographics.gender})`,
          age_min: 0,
          age_max: 99,
          gender: demographics.gender,
          sample_size: this.estimateSampleSize('bodyfat', category),
          last_updated: new Date()
        });
      }
    });

    return segments;
  }

  /**
   * Creates exercise-specific segments based on movement patterns
   */
  static createExerciseSpecificSegments(
    demographics: UserDemographics,
    exerciseId: string
  ): PercentileSegment[] {
    const segments: PercentileSegment[] = [];

    // Define exercise categories and their specific considerations
    const exerciseCategories: Record<string, {
      category: string;
      considerations: string[];
      weight_factor: number;
    }> = {
      'squat': {
        category: 'lower_body_strength',
        considerations: ['leg_length', 'mobility'],
        weight_factor: 1.2
      },
      'bench_press': {
        category: 'upper_body_strength',
        considerations: ['arm_length', 'chest_size'],
        weight_factor: 0.8
      },
      'deadlift': {
        category: 'full_body_strength',
        considerations: ['torso_length', 'grip_strength'],
        weight_factor: 1.5
      },
      'pull_ups': {
        category: 'bodyweight_strength',
        considerations: ['body_weight', 'arm_strength'],
        weight_factor: -0.5 // Lighter is better
      }
    };

    const exerciseInfo = exerciseCategories[exerciseId];
    if (exerciseInfo) {
      // Create weight-adjusted segments for strength exercises
      const adjustedWeight = demographics.weight * exerciseInfo.weight_factor;
      
      segments.push({
        id: `exercise_${exerciseId}_${demographics.gender}`,
        name: `${exerciseId.replace('_', ' ')} Specialists (${demographics.gender})`,
        age_min: Math.max(18, demographics.age - 10),
        age_max: Math.min(65, demographics.age + 10),
        gender: demographics.gender,
        weight_min: Math.max(40, adjustedWeight - 15),
        weight_max: Math.min(150, adjustedWeight + 15),
        experience_level: demographics.experience_level,
        sample_size: this.estimateSampleSize('exercise_specific', exerciseId),
        last_updated: new Date()
      });
    }

    return segments;
  }

  /**
   * Creates time-based segments (seasonal, training cycle)
   */
  static createTemporalSegments(demographics: UserDemographics): PercentileSegment[] {
    const segments: PercentileSegment[] = [];
    const now = new Date();
    const month = now.getMonth();

    // Seasonal segments
    let season = '';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else if (month >= 8 && month <= 10) season = 'fall';
    else season = 'winter';

    segments.push({
      id: `seasonal_${season}_${demographics.gender}`,
      name: `${season.charAt(0).toUpperCase() + season.slice(1)} Training (${demographics.gender})`,
      age_min: demographics.age - 5,
      age_max: demographics.age + 5,
      gender: demographics.gender,
      sample_size: this.estimateSampleSize('seasonal', season),
      last_updated: new Date()
    });

    return segments;
  }

  /**
   * Gets segment recommendations based on user goals
   */
  static getSegmentRecommendations(
    demographics: UserDemographics,
    exerciseId: string,
    userGoals: string[] = []
  ): {
    primary_segments: PercentileSegment[];
    comparison_segments: PercentileSegment[];
    aspirational_segments: PercentileSegment[];
  } {
    const allSegments = this.createUserSegments(demographics);
    
    // Primary segments - most relevant for current comparison
    const primarySegments = this.getMostSpecificSegments(demographics).slice(0, 3);
    
    // Comparison segments - broader groups for context
    const comparisonSegments = allSegments.filter(s => 
      s.id.includes('global') || 
      (s.id.includes('age') && !s.id.includes(demographics.gender))
    ).slice(0, 2);
    
    // Aspirational segments - next level up
    const aspirationalSegments = this.createAspirationalSegments(demographics, userGoals);

    return {
      primary_segments: primarySegments,
      comparison_segments: comparisonSegments,
      aspirational_segments: aspirationalSegments
    };
  }

  /**
   * Creates aspirational segments (next level targets)
   */
  private static createAspirationalSegments(
    demographics: UserDemographics,
    userGoals: string[]
  ): PercentileSegment[] {
    const segments: PercentileSegment[] = [];

    // Experience level progression
    const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = experienceLevels.indexOf(demographics.experience_level);
    
    if (currentIndex < experienceLevels.length - 1) {
      const nextLevel = experienceLevels[currentIndex + 1];
      segments.push({
        id: `aspirational_${nextLevel}_${demographics.gender}`,
        name: `${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} Level Target`,
        age_min: demographics.age - 5,
        age_max: demographics.age + 5,
        gender: demographics.gender,
        experience_level: nextLevel as any,
        sample_size: this.estimateSampleSize('aspirational', nextLevel),
        last_updated: new Date()
      });
    }

    // Age group progression (if user wants to compete with younger athletes)
    if (userGoals.includes('compete_younger') && demographics.age > 25) {
      const youngerAgeGroup = Object.entries(DEMOGRAPHIC_SEGMENTS).find(([key, group]) => {
        if ('age_min' in group && 'age_max' in group) {
          return group.age_max < demographics.age && group.age_max >= demographics.age - 10;
        }
        return false;
      });

      if (youngerAgeGroup) {
        const [key, ageGroup] = youngerAgeGroup;
        if ('age_min' in ageGroup && 'age_max' in ageGroup) {
          segments.push({
            id: `aspirational_younger_${key.toLowerCase()}`,
            name: `Younger Athletes (${ageGroup.name})`,
            age_min: ageGroup.age_min,
            age_max: ageGroup.age_max,
            gender: demographics.gender,
            sample_size: this.estimateSampleSize('aspirational_age', key),
            last_updated: new Date()
          });
        }
      }
    }

    return segments;
  }
}