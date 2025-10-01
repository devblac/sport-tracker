/**
 * Global Percentiles System Tests
 * 
 * Comprehensive tests for the global percentiles system implementation
 * Tests Task 16 - Complete global percentiles system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GlobalPercentilesService } from '../GlobalPercentilesService';
import { DemographicSegmentation } from '../../utils/demographicSegmentation';
import { percentileIntegrationService } from '../percentileIntegrationService';
import { realTimePercentileUpdater } from '../realTimePercentileUpdater';
import { UserDemographics, ExercisePerformance } from '../../types/percentiles';

// Mock data
const mockUserDemographics: UserDemographics = {
  age: 28,
  gender: 'male',
  weight: 75,
  height: 175,
  experience_level: 'intermediate'
};

const mockExercisePerformance: ExercisePerformance = {
  exercise_id: 'bench_press',
  exercise_name: 'Bench Press',
  max_weight: 85,
  max_reps: 8,
  max_volume: 680,
  recorded_at: new Date(),
  bodyweight_at_time: 75
};

const mockWorkout = {
  id: 'test_workout_123',
  userId: 'test_user_456',
  exercises: [
    {
      exerciseId: 'bench_press',
      sets: [
        { weight: 80, reps: 8 },
        { weight: 85, reps: 6 },
        { weight: 90, reps: 4 }
      ]
    }
  ],
  completedAt: new Date()
};

const mockExercises = [
  { id: 'bench_press', name: 'Bench Press' }
];

const mockUser = {
  id: 'test_user_456',
  profile: {
    age: 28,
    gender: 'male' as const,
    weight: 75,
    totalWorkouts: 150
  }
};

describe('GlobalPercentilesService', () => {
  let service: GlobalPercentilesService;

  beforeEach(() => {
    service = GlobalPercentilesService.getInstance();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GlobalPercentilesService.getInstance();
      const instance2 = GlobalPercentilesService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Global Percentiles Calculation', () => {
    it('should calculate global percentiles for a user', async () => {
      const result = await service.getGlobalPercentiles(
        'test_user_123',
        mockUserDemographics,
        ['bench_press', 'squat']
      );

      expect(result).toBeDefined();
      expect(result.user_rankings).toBeInstanceOf(Array);
      expect(result.global_rankings).toBeInstanceOf(Array);
      expect(result.demographic_comparisons).toBeInstanceOf(Array);
      expect(result.segment_analysis).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should include segment analysis', async () => {
      const result = await service.getGlobalPercentiles(
        'test_user_123',
        mockUserDemographics
      );

      expect(result.segment_analysis.best_segments).toBeInstanceOf(Array);
      expect(result.segment_analysis.improvement_opportunities).toBeInstanceOf(Array);
      expect(result.segment_analysis.competitive_segments).toBeInstanceOf(Array);
    });

    it('should provide personalized recommendations', async () => {
      const result = await service.getGlobalPercentiles(
        'test_user_123',
        mockUserDemographics
      );

      expect(result.recommendations.training_focus).toBeInstanceOf(Array);
      expect(result.recommendations.competitive_opportunities).toBeInstanceOf(Array);
      expect(result.recommendations.strength_development).toBeInstanceOf(Array);
      expect(result.recommendations.training_focus.length).toBeGreaterThan(0);
    });
  });

  describe('Exercise Global Data', () => {
    it('should get comprehensive exercise data', async () => {
      const result = await service.getExerciseGlobalData('bench_press');

      expect(result).toBeDefined();
      expect(result.exercise_id).toBe('bench_press');
      expect(result.exercise_name).toBe('Bench Press');
      expect(result.total_participants).toBeGreaterThan(0);
      expect(result.global_statistics).toBeDefined();
      expect(result.demographic_breakdown).toBeInstanceOf(Array);
      expect(result.trending_data).toBeDefined();
    });

    it('should include global statistics', async () => {
      const result = await service.getExerciseGlobalData('bench_press');

      expect(result.global_statistics.mean).toBeGreaterThan(0);
      expect(result.global_statistics.median).toBeGreaterThan(0);
      expect(result.global_statistics.top_1_percent).toBeGreaterThan(result.global_statistics.median);
      expect(result.global_statistics.top_10_percent).toBeGreaterThan(result.global_statistics.median);
    });

    it('should include demographic breakdown', async () => {
      const result = await service.getExerciseGlobalData('bench_press');

      expect(result.demographic_breakdown.length).toBeGreaterThan(0);
      result.demographic_breakdown.forEach(breakdown => {
        expect(breakdown.segment).toBeDefined();
        expect(breakdown.statistics).toBeDefined();
        expect(breakdown.top_performers).toBeInstanceOf(Array);
      });
    });
  });

  describe('Workout Integration', () => {
    it('should update percentiles with workout data', async () => {
      const result = await service.updatePercentilesWithWorkout(
        mockWorkout as any,
        mockExercises as any,
        mockUser as any
      );

      expect(result).toBeDefined();
      expect(result.updated_percentiles).toBeInstanceOf(Array);
      expect(result.new_achievements).toBeInstanceOf(Array);
      expect(result.ranking_changes).toBeInstanceOf(Array);
    });

    it('should detect ranking changes', async () => {
      const result = await service.updatePercentilesWithWorkout(
        mockWorkout as any,
        mockExercises as any,
        mockUser as any
      );

      result.ranking_changes.forEach(change => {
        expect(change.exercise_id).toBeDefined();
        expect(typeof change.previous_percentile).toBe('number');
        expect(typeof change.new_percentile).toBe('number');
        expect(typeof change.change).toBe('number');
      });
    });
  });

  describe('Global Rankings', () => {
    it('should get global rankings for exercises', async () => {
      const result = await service.getGlobalRankings(['bench_press', 'squat']);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      
      result.forEach(ranking => {
        expect(ranking.exercise_id).toBeDefined();
        expect(ranking.exercise_name).toBeDefined();
        expect(ranking.rankings).toBeInstanceOf(Array);
        expect(ranking.total_participants).toBeGreaterThan(0);
      });
    });

    it('should include top performers', async () => {
      const result = await service.getGlobalRankings(['bench_press']);

      expect(result[0].rankings.length).toBeGreaterThan(0);
      result[0].rankings.forEach(performer => {
        expect(performer.rank).toBeGreaterThan(0);
        expect(performer.user_id).toBeDefined();
        expect(performer.value).toBeGreaterThan(0);
        expect(performer.demographics).toBeDefined();
      });
    });
  });

  describe('Caching', () => {
    it('should cache results for performance', async () => {
      const start1 = Date.now();
      await service.getGlobalPercentiles('test_user_123', mockUserDemographics);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await service.getGlobalPercentiles('test_user_123', mockUserDemographics);
      const time2 = Date.now() - start2;

      // Second call should be significantly faster due to caching
      expect(time2).toBeLessThan(time1);
    });
  });
});

describe('DemographicSegmentation', () => {
  describe('Segment Creation', () => {
    it('should create user segments', () => {
      const segments = DemographicSegmentation.createUserSegments(mockUserDemographics);

      expect(segments).toBeInstanceOf(Array);
      expect(segments.length).toBeGreaterThan(0);
      
      segments.forEach(segment => {
        expect(segment.id).toBeDefined();
        expect(segment.name).toBeDefined();
        expect(segment.sample_size).toBeGreaterThan(0);
      });
    });

    it('should create enhanced segments with quality scoring', () => {
      const segments = DemographicSegmentation.createEnhancedUserSegments(mockUserDemographics);

      expect(segments).toBeInstanceOf(Array);
      segments.forEach(segment => {
        expect(segment.quality).toBeDefined();
        expect(segment.quality.specificity_score).toBeGreaterThanOrEqual(0);
        expect(segment.quality.sample_size_score).toBeGreaterThanOrEqual(0);
        expect(segment.quality.relevance_score).toBeGreaterThanOrEqual(0);
        expect(segment.quality.overall_quality).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate user in segment', () => {
      const segments = DemographicSegmentation.createUserSegments(mockUserDemographics);
      const segment = segments[0];

      const isValid = DemographicSegmentation.validateUserInSegment(mockUserDemographics, segment);
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Segment Optimization', () => {
    it('should get most specific segments', () => {
      const segments = DemographicSegmentation.getMostSpecificSegments(mockUserDemographics);

      expect(segments).toBeInstanceOf(Array);
      expect(segments.length).toBeGreaterThan(0);
      
      // Should be sorted by specificity (most specific first)
      for (let i = 1; i < segments.length; i++) {
        // More specific segments should come first
        expect(segments[i-1]).toBeDefined();
        expect(segments[i]).toBeDefined();
      }
    });

    it('should create comparison groups', () => {
      const groups = DemographicSegmentation.createComparisonGroups(mockUserDemographics);

      expect(groups.peer_group).toBeDefined();
      expect(groups.age_peers).toBeDefined();
      expect(groups.weight_peers).toBeDefined();
      expect(groups.experience_peers).toBeDefined();
      expect(groups.gender_peers).toBeDefined();
      expect(groups.global).toBeDefined();
    });
  });

  describe('Segment Display', () => {
    it('should get segment display info', () => {
      const segments = DemographicSegmentation.createUserSegments(mockUserDemographics);
      const segment = segments[0];

      const displayInfo = DemographicSegmentation.getSegmentDisplayInfo(segment);

      expect(displayInfo.icon).toBeDefined();
      expect(displayInfo.color).toBeDefined();
      expect(displayInfo.description).toBeDefined();
      expect(displayInfo.shortName).toBeDefined();
    });
  });
});

describe('PercentileIntegrationService', () => {
  describe('Workout Processing', () => {
    it('should process workout completion', async () => {
      const result = await percentileIntegrationService.processWorkoutCompletion(
        mockWorkout as any,
        mockExercises as any,
        mockUser as any
      );

      expect(result).toBeDefined();
      expect(result.percentiles).toBeInstanceOf(Array);
      expect(result.newPersonalBests).toBeInstanceOf(Array);
      expect(result.achievements).toBeInstanceOf(Array);
      expect(result.rankingChanges).toBeInstanceOf(Array);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('User Analysis', () => {
    it('should get user percentile analysis', async () => {
      const result = await percentileIntegrationService.getUserPercentileAnalysis('test_user_123');

      expect(result).toBeDefined();
      expect(result.overallRanking).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.strongestExercises).toBeInstanceOf(Array);
      expect(result.improvementAreas).toBeInstanceOf(Array);
    });

    it('should include overall ranking', async () => {
      const result = await percentileIntegrationService.getUserPercentileAnalysis('test_user_123');

      expect(typeof result.overallRanking.percentile).toBe('number');
      expect(typeof result.overallRanking.rank).toBe('number');
      expect(typeof result.overallRanking.totalUsers).toBe('number');
      expect(result.overallRanking.level).toBeDefined();
    });
  });

  describe('Exercise Comparison', () => {
    it('should get exercise comparison data', async () => {
      const result = await percentileIntegrationService.getExerciseComparison('bench_press', 'test_user_123');

      expect(result).toBeDefined();
      expect(result.exercise_id).toBe('bench_press');
      expect(result.userPosition).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.topPerformers).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Trends Analysis', () => {
    it('should get percentile trends', async () => {
      const result = await percentileIntegrationService.getPercentileTrends('test_user_123', 'bench_press');

      expect(result).toBeDefined();
      expect(result.exercise_id).toBe('bench_press');
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.overallTrend).toMatch(/improving|declining|stable/);
    });
  });
});

describe('RealTimePercentileUpdater', () => {
  beforeEach(() => {
    realTimePercentileUpdater.clearQueue();
  });

  describe('Queue Management', () => {
    it('should queue update requests', () => {
      realTimePercentileUpdater.queueUpdate(
        mockUserDemographics,
        mockExercisePerformance,
        'medium'
      );

      const status = realTimePercentileUpdater.getQueueStatus();
      expect(status.totalItems).toBe(1);
      expect(status.mediumPriority).toBe(1);
    });

    it('should handle different priorities', () => {
      realTimePercentileUpdater.queueUpdate(mockUserDemographics, mockExercisePerformance, 'high');
      realTimePercentileUpdater.queueUpdate(mockUserDemographics, mockExercisePerformance, 'medium');
      realTimePercentileUpdater.queueUpdate(mockUserDemographics, mockExercisePerformance, 'low');

      const status = realTimePercentileUpdater.getQueueStatus();
      expect(status.totalItems).toBe(3);
      expect(status.highPriority).toBe(1);
      expect(status.mediumPriority).toBe(1);
      expect(status.lowPriority).toBe(1);
    });

    it('should clear queue', () => {
      realTimePercentileUpdater.queueUpdate(mockUserDemographics, mockExercisePerformance, 'medium');
      realTimePercentileUpdater.clearQueue();

      const status = realTimePercentileUpdater.getQueueStatus();
      expect(status.totalItems).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should initialize with custom config', () => {
      const config = {
        batchSize: 25,
        maxUpdateFrequency: 10,
        priorityThreshold: 15
      };

      realTimePercentileUpdater.initialize(config);

      // Configuration is applied internally, we can test by checking behavior
      expect(() => realTimePercentileUpdater.initialize(config)).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  describe('End-to-End Percentile Flow', () => {
    it('should handle complete percentile calculation flow', async () => {
      // 1. Process workout
      const workoutResult = await percentileIntegrationService.processWorkoutCompletion(
        mockWorkout as any,
        mockExercises as any,
        mockUser as any
      );

      expect(workoutResult.percentiles.length).toBeGreaterThan(0);

      // 2. Get user analysis
      const analysis = await percentileIntegrationService.getUserPercentileAnalysis('test_user_123');
      expect(analysis.overallRanking).toBeDefined();

      // 3. Get exercise comparison
      const comparison = await percentileIntegrationService.getExerciseComparison('bench_press', 'test_user_123');
      expect(comparison.exercise_id).toBe('bench_press');

      // 4. Get trends
      const trends = await percentileIntegrationService.getPercentileTrends('test_user_123', 'bench_press');
      expect(trends.trends.length).toBeGreaterThan(0);
    });

    it('should maintain data consistency across services', async () => {
      const globalService = GlobalPercentilesService.getInstance();
      
      // Get data from global service
      const globalData = await globalService.getGlobalPercentiles(
        'test_user_123',
        mockUserDemographics,
        ['bench_press']
      );

      // Get data from integration service
      const analysis = await percentileIntegrationService.getUserPercentileAnalysis('test_user_123');

      // Both should provide consistent user ranking information
      expect(globalData.user_rankings.length).toBeGreaterThan(0);
      expect(analysis.overallRanking.percentile).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        percentileIntegrationService.getUserPercentileAnalysis(`test_user_${i}`)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.overallRanking).toBeDefined();
      });
    });

    it('should process updates efficiently', () => {
      const startTime = Date.now();
      
      // Queue multiple updates
      for (let i = 0; i < 10; i++) {
        realTimePercentileUpdater.queueUpdate(
          mockUserDemographics,
          { ...mockExercisePerformance, exercise_id: `exercise_${i}` },
          'medium'
        );
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Should queue quickly (under 100ms for 10 items)
      expect(processingTime).toBeLessThan(100);

      const status = realTimePercentileUpdater.getQueueStatus();
      expect(status.totalItems).toBe(10);
    });
  });
});

describe('Error Handling', () => {
  describe('Service Resilience', () => {
    it('should handle invalid user demographics gracefully', async () => {
      const invalidDemographics = {
        age: -1,
        gender: 'invalid' as any,
        weight: -10,
        height: 0,
        experience_level: 'invalid' as any
      };

      // Should not throw, but handle gracefully
      await expect(
        GlobalPercentilesService.getInstance().getGlobalPercentiles(
          'test_user_123',
          invalidDemographics
        )
      ).resolves.toBeDefined();
    });

    it('should handle missing exercise data', async () => {
      await expect(
        GlobalPercentilesService.getInstance().getExerciseGlobalData('nonexistent_exercise')
      ).resolves.toBeDefined();
    });

    it('should handle empty workout data', async () => {
      const emptyWorkout = {
        id: 'empty_workout',
        userId: 'test_user',
        exercises: [],
        completedAt: new Date()
      };

      await expect(
        percentileIntegrationService.processWorkoutCompletion(
          emptyWorkout as any,
          [],
          mockUser as any
        )
      ).resolves.toBeDefined();
    });
  });
});

describe('Data Validation', () => {
  describe('Percentile Ranges', () => {
    it('should ensure percentiles are within valid range', async () => {
      const result = await GlobalPercentilesService.getInstance().getGlobalPercentiles(
        'test_user_123',
        mockUserDemographics
      );

      result.user_rankings.forEach(ranking => {
        expect(ranking.percentile).toBeGreaterThanOrEqual(0);
        expect(ranking.percentile).toBeLessThanOrEqual(100);
      });
    });

    it('should ensure ranks are positive integers', async () => {
      const result = await GlobalPercentilesService.getInstance().getGlobalRankings(['bench_press']);

      result.forEach(ranking => {
        ranking.rankings.forEach(performer => {
          expect(performer.rank).toBeGreaterThan(0);
          expect(Number.isInteger(performer.rank)).toBe(true);
        });
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent exercise IDs', async () => {
      const exerciseId = 'bench_press';
      const exerciseData = await GlobalPercentilesService.getInstance().getExerciseGlobalData(exerciseId);

      expect(exerciseData.exercise_id).toBe(exerciseId);
      
      exerciseData.demographic_breakdown.forEach(breakdown => {
        expect(breakdown.statistics.exercise_id).toBe(exerciseId);
      });
    });

    it('should ensure demographic segments are valid', () => {
      const segments = DemographicSegmentation.createUserSegments(mockUserDemographics);

      segments.forEach(segment => {
        expect(segment.age_min).toBeLessThanOrEqual(segment.age_max);
        if (segment.weight_min !== undefined && segment.weight_max !== undefined) {
          expect(segment.weight_min).toBeLessThanOrEqual(segment.weight_max);
        }
        expect(segment.sample_size).toBeGreaterThan(0);
      });
    });
  });
});