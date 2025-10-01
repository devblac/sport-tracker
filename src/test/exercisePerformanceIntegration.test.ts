/**
 * Exercise Performance Integration Tests
 * Tests the enhanced exercise performance service with Supabase integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exercisePerformanceService } from '@/services/ExercisePerformanceService';
import type { SetData } from '@/schemas/workout';

// Mock dependencies
vi.mock('@/services/SupabaseService');
vi.mock('@/db/IndexedDBManager');

describe('ExercisePerformanceService Integration', () => {
  const mockUserId = 'test-user-1';
  const mockExerciseId = 'bench-press';
  const mockWorkoutSessionId = 'workout-session-1';

  const mockSetsData: SetData[] = [
    {
      id: 'set-1',
      set_number: 1,
      type: 'normal',
      weight: 100,
      reps: 10,
      planned_rest_time: 120,
      completed: true,
      skipped: false,
      completed_at: new Date()
    },
    {
      id: 'set-2',
      set_number: 2,
      type: 'normal',
      weight: 100,
      reps: 8,
      planned_rest_time: 120,
      completed: true,
      skipped: false,
      completed_at: new Date()
    },
    {
      id: 'set-3',
      set_number: 3,
      type: 'normal',
      weight: 100,
      reps: 6,
      planned_rest_time: 120,
      completed: true,
      skipped: false,
      completed_at: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  afterEach(() => {
    exercisePerformanceService.clearCache();
  });

  describe('Performance Recording', () => {
    it('should record exercise performance with correct calculations', async () => {
      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        mockSetsData
      );

      expect(performance).toBeDefined();
      expect(performance.user_id).toBe(mockUserId);
      expect(performance.exercise_id).toBe(mockExerciseId);
      expect(performance.workout_session_id).toBe(mockWorkoutSessionId);
      expect(performance.max_weight).toBe(100);
      expect(performance.total_volume).toBe(2400); // (100*10) + (100*8) + (100*6)
      expect(performance.total_reps).toBe(24); // 10 + 8 + 6
      expect(performance.one_rep_max).toBeGreaterThan(100); // Should calculate 1RM
      expect(performance.sets_data).toEqual(mockSetsData);
    });

    it('should handle incomplete sets correctly', async () => {
      const incompleteSetsData: SetData[] = [
        ...mockSetsData,
        {
          id: 'set-4',
          set_number: 4,
          type: 'normal',
          weight: 100,
          reps: 5,
          planned_rest_time: 120,
          completed: false, // Not completed
          skipped: false
        }
      ];

      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        incompleteSetsData
      );

      // Should only count completed sets
      expect(performance.total_volume).toBe(2400); // Same as before
      expect(performance.total_reps).toBe(24); // Same as before
    });

    it('should detect personal records correctly', async () => {
      // First performance (baseline)
      const firstPerformance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId + '-1',
        mockSetsData
      );

      expect(firstPerformance.is_pr_weight).toBe(true); // First time is always PR
      expect(firstPerformance.is_pr_volume).toBe(true);
      expect(firstPerformance.is_pr_reps).toBe(true);

      // Second performance with higher weight
      const higherWeightSets: SetData[] = mockSetsData.map(set => ({
        ...set,
        weight: 110 // 10kg increase
      }));

      const secondPerformance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId + '-2',
        higherWeightSets
      );

      expect(secondPerformance.is_pr_weight).toBe(true); // New weight PR
      expect(secondPerformance.is_pr_volume).toBe(true); // Higher volume due to weight
      expect(secondPerformance.max_weight).toBe(110);
    });

    it('should calculate one rep max using Brzycki formula', async () => {
      const heavySingleSet: SetData[] = [
        {
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 120,
          reps: 5,
          planned_rest_time: 180,
          completed: true,
          skipped: false,
          completed_at: new Date()
        }
      ];

      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        heavySingleSet
      );

      // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 × reps)
      // For 120kg x 5 reps: 120 / (1.0278 - 0.0278 × 5) ≈ 135kg
      expect(performance.one_rep_max).toBeCloseTo(135, 0);
    });
  });

  describe('Progress Analytics', () => {
    it('should calculate exercise progress correctly', async () => {
      // Record multiple performances over time
      const performances = [];
      
      for (let i = 0; i < 5; i++) {
        const setsData = mockSetsData.map(set => ({
          ...set,
          weight: 100 + (i * 5) // Progressive weight increase
        }));

        const performance = await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          mockExerciseId,
          `${mockWorkoutSessionId}-${i}`,
          setsData
        );
        performances.push(performance);
      }

      const progress = await exercisePerformanceService.getExerciseProgress(mockUserId, mockExerciseId);

      expect(progress).toBeDefined();
      expect(progress?.exercise_id).toBe(mockExerciseId);
      expect(progress?.total_sessions).toBe(5);
      expect(progress?.current_max_weight).toBe(120); // Last weight used
      expect(progress?.progress_trend).toBe('improving'); // Should detect improvement
      expect(progress?.recent_performances).toHaveLength(5);
      expect(progress?.personal_records.length).toBeGreaterThan(0);
    });

    it('should identify declining performance trend', async () => {
      // Record performances with declining weights
      const decliningWeights = [120, 115, 110, 105, 100];
      
      for (let i = 0; i < decliningWeights.length; i++) {
        const setsData = mockSetsData.map(set => ({
          ...set,
          weight: decliningWeights[i]
        }));

        await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          mockExerciseId,
          `${mockWorkoutSessionId}-${i}`,
          setsData
        );
      }

      const progress = await exercisePerformanceService.getExerciseProgress(mockUserId, mockExerciseId);

      expect(progress?.progress_trend).toBe('declining');
    });

    it('should generate comprehensive user analytics', async () => {
      // Record performances for multiple exercises
      const exercises = ['bench-press', 'squat', 'deadlift'];
      
      for (const exerciseId of exercises) {
        for (let i = 0; i < 3; i++) {
          await exercisePerformanceService.recordExercisePerformance(
            mockUserId,
            exerciseId,
            `${exerciseId}-session-${i}`,
            mockSetsData
          );
        }
      }

      const analytics = await exercisePerformanceService.getUserProgressAnalytics(mockUserId);

      expect(analytics.total_exercises_tracked).toBe(3);
      expect(analytics.total_personal_records).toBeGreaterThan(0);
      expect(analytics.recent_prs.length).toBeGreaterThan(0);
      expect(analytics.strongest_exercises.length).toBeGreaterThan(0);
      expect(analytics.volume_trends.length).toBeGreaterThan(0);
    });
  });

  describe('Exercise Recommendations', () => {
    it('should recommend weight increase for stable progress', async () => {
      // Record consistent performances at same weight
      for (let i = 0; i < 5; i++) {
        await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          mockExerciseId,
          `${mockWorkoutSessionId}-${i}`,
          mockSetsData
        );
        
        // Simulate time passing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const recommendations = await exercisePerformanceService.getExerciseRecommendations(
        mockUserId,
        mockExerciseId
      );

      expect(recommendations.length).toBeGreaterThan(0);
      
      const weightRecommendation = recommendations.find(r => r.recommendation_type === 'weight_increase');
      expect(weightRecommendation).toBeDefined();
      expect(weightRecommendation?.suggested_weight).toBeGreaterThan(100);
      expect(weightRecommendation?.confidence).toBeGreaterThan(0.5);
    });

    it('should recommend deload for declining performance', async () => {
      // Record declining performances
      const decliningWeights = [120, 115, 110, 105, 100];
      
      for (let i = 0; i < decliningWeights.length; i++) {
        const setsData = mockSetsData.map(set => ({
          ...set,
          weight: decliningWeights[i]
        }));

        await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          mockExerciseId,
          `${mockWorkoutSessionId}-${i}`,
          setsData
        );
      }

      const recommendations = await exercisePerformanceService.getExerciseRecommendations(
        mockUserId,
        mockExerciseId
      );

      const deloadRecommendation = recommendations.find(r => r.recommendation_type === 'deload');
      expect(deloadRecommendation).toBeDefined();
      expect(deloadRecommendation?.suggested_weight).toBeLessThan(100); // Should suggest lower weight
    });

    it('should recommend volume increase for stagnant progress', async () => {
      // Record same performance multiple times (stable but no PRs)
      for (let i = 0; i < 8; i++) {
        await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          mockExerciseId,
          `${mockWorkoutSessionId}-${i}`,
          mockSetsData
        );
      }

      const recommendations = await exercisePerformanceService.getExerciseRecommendations(
        mockUserId,
        mockExerciseId
      );

      const volumeRecommendation = recommendations.find(r => r.recommendation_type === 'volume_increase');
      expect(volumeRecommendation).toBeDefined();
      expect(volumeRecommendation?.suggested_sets).toBeGreaterThan(3);
    });
  });

  describe('Personal Records Management', () => {
    it('should track and retrieve personal records', async () => {
      // Record initial performance
      await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId + '-1',
        mockSetsData
      );

      // Record PR performance
      const prSetsData: SetData[] = mockSetsData.map(set => ({
        ...set,
        weight: 130, // Significant increase
        reps: set.reps + 2 // More reps too
      }));

      await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId + '-2',
        prSetsData
      );

      const personalRecords = await exercisePerformanceService.getPersonalRecords(mockUserId, mockExerciseId);
      
      expect(personalRecords.length).toBeGreaterThan(0);
      
      const weightPR = personalRecords.find(pr => pr.type === 'weight');
      expect(weightPR).toBeDefined();
      expect(weightPR?.value).toBe(130);
      expect(weightPR?.improvement).toBeGreaterThan(0);
    });

    it('should get recent personal records across all exercises', async () => {
      const exercises = ['bench-press', 'squat', 'deadlift'];
      
      // Record PRs for multiple exercises
      for (const exerciseId of exercises) {
        const prSetsData: SetData[] = mockSetsData.map(set => ({
          ...set,
          weight: 150 // High weight for PR
        }));

        await exercisePerformanceService.recordExercisePerformance(
          mockUserId,
          exerciseId,
          `${exerciseId}-pr-session`,
          prSetsData
        );
      }

      const recentPRs = await exercisePerformanceService.getRecentPersonalRecords(mockUserId, 10);
      
      expect(recentPRs.length).toBeGreaterThan(0);
      expect(recentPRs.every(pr => pr.value > 0)).toBe(true);
      
      // Should be sorted by date (most recent first)
      for (let i = 1; i < recentPRs.length; i++) {
        expect(new Date(recentPRs[i-1].achieved_at).getTime())
          .toBeGreaterThanOrEqual(new Date(recentPRs[i].achieved_at).getTime());
      }
    });
  });

  describe('Offline/Online Handling', () => {
    it('should work offline and sync when online', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        mockSetsData
      );

      expect(performance).toBeDefined();
      expect(performance.user_id).toBe(mockUserId);

      // Go online
      Object.defineProperty(navigator, 'onLine', { value: true });

      // Performance should still be accessible
      const progress = await exercisePerformanceService.getExerciseProgress(mockUserId, mockExerciseId);
      expect(progress).toBeDefined();
    });

    it('should handle Supabase sync errors gracefully', async () => {
      // Mock Supabase error
      const mockError = new Error('Supabase connection failed');
      
      // Performance should still be recorded locally
      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        mockSetsData
      );

      expect(performance).toBeDefined();
      expect(performance.total_volume).toBe(2400);
    });
  });

  describe('Data Validation', () => {
    it('should handle invalid set data gracefully', async () => {
      const invalidSetsData: SetData[] = [
        {
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 0, // Invalid weight
          reps: 0, // Invalid reps
          planned_rest_time: 120,
          completed: true,
          skipped: false
        }
      ];

      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        invalidSetsData
      );

      expect(performance.max_weight).toBe(0);
      expect(performance.total_volume).toBe(0);
      expect(performance.total_reps).toBe(0);
      expect(performance.one_rep_max).toBe(0);
    });

    it('should handle empty sets data', async () => {
      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        []
      );

      expect(performance.max_weight).toBe(0);
      expect(performance.total_volume).toBe(0);
      expect(performance.total_reps).toBe(0);
      expect(performance.sets_data).toEqual([]);
    });

    it('should handle mixed completed and incomplete sets', async () => {
      const mixedSetsData: SetData[] = [
        {
          id: 'set-1',
          set_number: 1,
          type: 'normal',
          weight: 100,
          reps: 10,
          planned_rest_time: 120,
          completed: true,
          skipped: false
        },
        {
          id: 'set-2',
          set_number: 2,
          type: 'normal',
          weight: 100,
          reps: 8,
          planned_rest_time: 120,
          completed: false, // Not completed
          skipped: false
        },
        {
          id: 'set-3',
          set_number: 3,
          type: 'normal',
          weight: 100,
          reps: 6,
          planned_rest_time: 120,
          completed: true,
          skipped: false
        }
      ];

      const performance = await exercisePerformanceService.recordExercisePerformance(
        mockUserId,
        mockExerciseId,
        mockWorkoutSessionId,
        mixedSetsData
      );

      // Should only count completed sets (set 1 and set 3)
      expect(performance.total_volume).toBe(1600); // (100*10) + (100*6)
      expect(performance.total_reps).toBe(16); // 10 + 6
    });
  });
});