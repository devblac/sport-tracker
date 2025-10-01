import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRecommendationService } from '../AIRecommendationService';
import type { User } from '@/schemas/user';
import type { Workout } from '@/schemas/workout';

// Mock dependencies
vi.mock('@/db/IndexedDBManager', () => ({
  dbManager: {
    init: vi.fn(),
    getAll: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../WorkoutService', () => ({
  WorkoutService: {
    getInstance: vi.fn(() => ({
      getWorkoutsByUser: vi.fn(),
      getRecentWorkouts: vi.fn()
    }))
  }
}));

vi.mock('../recommendationEngine', () => ({
  RecommendationEngine: {
    getInstance: vi.fn(() => ({
      getWeightRecommendation: vi.fn(),
      detectPlateau: vi.fn(),
      getExerciseRecommendations: vi.fn()
    }))
  }
}));

vi.mock('../plateauDetectionService', () => ({
  PlateauDetectionService: {
    detectAllPlateaus: vi.fn()
  }
}));

vi.mock('../weaknessAnalysisService', () => ({
  WeaknessAnalysisService: {
    analyzeWeaknesses: vi.fn()
  }
}));

describe('AIRecommendationService', () => {
  let service: AIRecommendationService;
  let mockUser: User;
  let mockWorkouts: Workout[];

  beforeEach(() => {
    service = AIRecommendationService.getInstance();
    
    mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      role: 'basic',
      profile: {
        display_name: 'Test User',
        fitness_level: 'intermediate',
        goals: ['strength', 'muscle_gain']
      },
      settings: {
        theme: 'light',
        units: 'metric',
        notifications: {
          workout_reminders: true,
          achievement_unlocks: true,
          social_activity: true,
          streak_warnings: true,
          quiet_hours: {
            enabled: false,
            start_time: '22:00',
            end_time: '08:00'
          }
        },
        privacy: {
          profile_visibility: 'public',
          workout_sharing: 'friends'
        }
      },
      gamification: {
        level: 5,
        total_xp: 1250,
        current_streak: 7,
        best_streak: 14,
        achievements_unlocked: ['first_workout', 'week_warrior']
      },
      created_at: new Date('2024-01-01')
    };

    mockWorkouts = [
      {
        id: 'workout-1',
        user_id: 'user-1',
        name: 'Push Day',
        status: 'completed',
        exercises: [
          {
            id: 'exercise-1',
            exercise_id: 'bench_press',
            order: 0,
            sets: [
              {
                id: 'set-1',
                set_number: 1,
                type: 'normal',
                weight: 80,
                reps: 10,
                completed: true,
                completed_at: new Date()
              }
            ],
            rest_time: 90
          }
        ],
        is_template: false,
        is_completed: true,
        completed_at: new Date(),
        total_volume: 800,
        created_at: new Date()
      }
    ];
  });

  describe('generateRecommendations', () => {
    it('should generate comprehensive AI recommendations', async () => {
      // Mock the service methods
      const mockWorkoutService = {
        getWorkoutsByUser: vi.fn().mockResolvedValue(mockWorkouts)
      };
      
      const mockRecommendationEngine = {
        getWeightRecommendation: vi.fn().mockResolvedValue({
          suggestedWeight: 82.5,
          confidence: 0.8,
          reasoning: 'Based on recent progress',
          previousBest: 80,
          progressionType: 'linear'
        }),
        getExerciseRecommendations: vi.fn().mockResolvedValue([])
      };

      // Replace the getInstance methods
      vi.mocked(require('../WorkoutService').WorkoutService.getInstance).mockReturnValue(mockWorkoutService);
      vi.mocked(require('../recommendationEngine').RecommendationEngine.getInstance).mockReturnValue(mockRecommendationEngine);
      vi.mocked(require('../plateauDetectionService').PlateauDetectionService.detectAllPlateaus).mockResolvedValue([]);
      vi.mocked(require('../weaknessAnalysisService').WeaknessAnalysisService.analyzeWeaknesses).mockResolvedValue([]);

      const recommendations = await service.generateRecommendations('user-1', mockUser);

      expect(recommendations).toBeDefined();
      expect(recommendations.generated_at).toBeInstanceOf(Date);
      expect(recommendations.confidence_score).toBeGreaterThan(0);
      expect(Array.isArray(recommendations.weight_suggestions)).toBe(true);
      expect(Array.isArray(recommendations.plateau_detections)).toBe(true);
      expect(Array.isArray(recommendations.weakness_analyses)).toBe(true);
      expect(Array.isArray(recommendations.recovery_recommendations)).toBe(true);
      expect(Array.isArray(recommendations.exercise_recommendations)).toBe(true);
      expect(Array.isArray(recommendations.workout_suggestions)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const mockWorkoutService = {
        getWorkoutsByUser: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      
      vi.mocked(require('../WorkoutService').WorkoutService.getInstance).mockReturnValue(mockWorkoutService);

      await expect(service.generateRecommendations('user-1', mockUser)).rejects.toThrow('Failed to generate AI recommendations');
    });

    it('should respect options for selective recommendation generation', async () => {
      const mockWorkoutService = {
        getWorkoutsByUser: vi.fn().mockResolvedValue([])
      };
      
      const mockRecommendationEngine = {
        getWeightRecommendation: vi.fn(),
        getExerciseRecommendations: vi.fn().mockResolvedValue([])
      };

      vi.mocked(require('../WorkoutService').WorkoutService.getInstance).mockReturnValue(mockWorkoutService);
      vi.mocked(require('../recommendationEngine').RecommendationEngine.getInstance).mockReturnValue(mockRecommendationEngine);
      vi.mocked(require('../plateauDetectionService').PlateauDetectionService.detectAllPlateaus).mockResolvedValue([]);
      vi.mocked(require('../weaknessAnalysisService').WeaknessAnalysisService.analyzeWeaknesses).mockResolvedValue([]);

      const recommendations = await service.generateRecommendations('user-1', mockUser, {
        includeWeightSuggestions: false,
        includePlateauDetection: false,
        includeWeaknessAnalysis: false,
        includeRecoveryRecommendations: true,
        includeExerciseRecommendations: true
      });

      expect(recommendations.weight_suggestions).toHaveLength(0);
      expect(recommendations.plateau_detections).toHaveLength(0);
      expect(recommendations.weakness_analyses).toHaveLength(0);
      // Recovery and exercise recommendations should still be generated
      expect(mockRecommendationEngine.getWeightRecommendation).not.toHaveBeenCalled();
    });
  });

  describe('getExerciseSpecificRecommendations', () => {
    it('should get specific recommendations for an exercise', async () => {
      const mockRecommendationEngine = {
        getWeightRecommendation: vi.fn().mockResolvedValue({
          suggestedWeight: 82.5,
          confidence: 0.8,
          reasoning: 'Based on recent progress',
          previousBest: 80,
          progressionType: 'linear'
        }),
        detectPlateau: vi.fn().mockResolvedValue({
          isPlateaued: false,
          plateauDuration: 0,
          lastImprovement: new Date(),
          suggestions: []
        })
      };

      vi.mocked(require('../recommendationEngine').RecommendationEngine.getInstance).mockReturnValue(mockRecommendationEngine);

      const result = await service.getExerciseSpecificRecommendations('user-1', 'bench_press', 10);

      expect(result).toBeDefined();
      expect(result.weightRecommendation).toBeDefined();
      expect(result.plateauDetection).toBeNull(); // Not plateaued
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(mockRecommendationEngine.getWeightRecommendation).toHaveBeenCalledWith('user-1', 'bench_press', 10);
      expect(mockRecommendationEngine.detectPlateau).toHaveBeenCalledWith('user-1', 'bench_press');
    });

    it('should handle plateau detection', async () => {
      const mockRecommendationEngine = {
        getWeightRecommendation: vi.fn().mockResolvedValue({
          suggestedWeight: 80,
          confidence: 0.7,
          reasoning: 'Maintaining current weight',
          previousBest: 80,
          progressionType: 'maintain'
        }),
        detectPlateau: vi.fn().mockResolvedValue({
          isPlateaued: true,
          plateauDuration: 3,
          lastImprovement: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          suggestions: ['Try reducing weight by 10%', 'Focus on perfect form']
        })
      };

      vi.mocked(require('../recommendationEngine').RecommendationEngine.getInstance).mockReturnValue(mockRecommendationEngine);

      const result = await service.getExerciseSpecificRecommendations('user-1', 'bench_press', 10);

      expect(result.plateauDetection).toBeDefined();
      expect(result.plateauDetection?.plateau_detected).toBe(true);
      expect(result.plateauDetection?.plateau_duration_weeks).toBe(3);
      expect(result.suggestions).toContain('Try reducing weight by 10%');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AIRecommendationService.getInstance();
      const instance2 = AIRecommendationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});