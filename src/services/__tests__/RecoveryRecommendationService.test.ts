import { describe, it, expect } from 'vitest';
import { RecoveryRecommendationService } from '../RecoveryRecommendationService';
import type { RecommendationContext, RecoveryStatus, WorkoutHistory } from '@/types/recommendations';

describe('RecoveryRecommendationService', () => {
  const createMockContext = (overrides: Partial<RecommendationContext> = {}): RecommendationContext => ({
    user_id: 'user-1',
    recent_workouts: [],
    recovery_status: {
      overall_fatigue: 5,
      muscle_soreness: 4,
      sleep_quality: 7,
      stress_level: 5,
      last_rest_day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      consecutive_training_days: 2
    },
    user_goals: ['strength', 'muscle_gain'],
    fitness_level: 'intermediate',
    available_equipment: ['barbell', 'dumbbells'],
    time_constraints: {
      max_workout_duration: 90,
      sessions_per_week: 4
    },
    ...overrides
  });

  describe('analyzeRecoveryNeeds', () => {
    it('should generate minimal recommendations for good recovery status', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 3,
          muscle_soreness: 2,
          sleep_quality: 8,
          stress_level: 3,
          last_rest_day: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 1
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      // Should have minimal recommendations (maybe nutrition) but not critical ones
      expect(recommendations.length).toBeLessThanOrEqual(2);
      const criticalRecommendations = recommendations.filter(r => r.priority === 'high');
      expect(criticalRecommendations).toHaveLength(0);
    });

    it('should recommend rest day for high fatigue', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 9,
          muscle_soreness: 8,
          sleep_quality: 5,
          stress_level: 6,
          last_rest_day: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          consecutive_training_days: 5
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      const restRecommendation = recommendations.find(r => r.type === 'rest_day');
      expect(restRecommendation).toBeDefined();
      expect(restRecommendation?.priority).toBe('high');
      expect(restRecommendation?.title).toContain('Descanso');
    });

    it('should recommend sleep optimization for poor sleep', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 6,
          muscle_soreness: 5,
          sleep_quality: 3, // Poor sleep
          stress_level: 5,
          last_rest_day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 2
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      const sleepRecommendation = recommendations.find(r => r.type === 'sleep_optimization');
      expect(sleepRecommendation).toBeDefined();
      expect(sleepRecommendation?.title).toContain('Sueño');
      expect(sleepRecommendation?.implementation_steps).toContain('Establece horario fijo de sueño (misma hora cada día)');
    });

    it('should recommend stress management for high stress', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 6,
          muscle_soreness: 5,
          sleep_quality: 7,
          stress_level: 8, // High stress
          last_rest_day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 2
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      const stressRecommendation = recommendations.find(r => r.type === 'stress_management');
      expect(stressRecommendation).toBeDefined();
      expect(stressRecommendation?.title).toContain('Estrés');
      expect(stressRecommendation?.priority).toBe('high');
    });

    it('should recommend active recovery for moderate fatigue', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 6, // Moderate fatigue
          muscle_soreness: 6,
          sleep_quality: 7,
          stress_level: 5,
          last_rest_day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 3
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      const activeRecoveryRecommendation = recommendations.find(r => 
        r.type === 'active_recovery' && r.title.includes('Recuperación Activa')
      );
      expect(activeRecoveryRecommendation).toBeDefined();
      expect(activeRecoveryRecommendation?.implementation_steps).toContain('Caminar ligero (ritmo conversacional)');
    });

    it('should recommend nutrition for low recovery score', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 7,
          muscle_soreness: 7,
          sleep_quality: 6,
          stress_level: 6,
          last_rest_day: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 4
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      const nutritionRecommendation = recommendations.find(r => r.type === 'nutrition');
      expect(nutritionRecommendation).toBeDefined();
      expect(nutritionRecommendation?.title).toContain('Nutrición');
      expect(nutritionRecommendation?.implementation_steps).toContain('Consume proteína de calidad (1.6-2.2g/kg peso corporal)');
    });

    it('should recommend recovery techniques for high muscle fatigue', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 8,
          muscle_soreness: 8, // High muscle soreness
          sleep_quality: 7,
          stress_level: 5,
          last_rest_day: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 3
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      const techniqueRecommendation = recommendations.find(r => 
        r.type === 'active_recovery' && r.title.includes('Técnicas')
      );
      expect(techniqueRecommendation).toBeDefined();
      expect(techniqueRecommendation?.implementation_steps).toContain('Foam rolling y auto-masaje (10-15 min)');
    });

    it('should sort recommendations by priority', async () => {
      const context = createMockContext({
        recovery_status: {
          overall_fatigue: 9, // Critical fatigue
          muscle_soreness: 8,
          sleep_quality: 3, // Poor sleep
          stress_level: 8, // High stress
          last_rest_day: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          consecutive_training_days: 6
        }
      });

      const recommendations = await RecoveryRecommendationService.analyzeRecoveryNeeds(context);
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check that high priority recommendations come first
      const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
      const firstHighPriorityIndex = recommendations.findIndex(r => r.priority === 'high');
      const lastHighPriorityIndex = recommendations.map(r => r.priority).lastIndexOf('high');
      
      if (highPriorityCount > 0) {
        expect(firstHighPriorityIndex).toBe(0); // First recommendation should be high priority
        expect(lastHighPriorityIndex).toBeLessThan(recommendations.length - 1); // Not all should be high priority
      }
    });
  });

  describe('generateRecoveryPlan', () => {
    it('should generate a recovery plan with appropriate duration', () => {
      const mockAnalysis = {
        recovery_score: 40, // Low recovery score
        fatigue_level: 'high' as const,
        recommended_rest_days: 3,
        recovery_factors: {
          training_load: 8,
          sleep_debt: 6,
          stress_impact: 7,
          muscle_fatigue: 8
        },
        intervention_urgency: 'high' as const
      };

      const context = createMockContext();
      const plan = RecoveryRecommendationService.generateRecoveryPlan(mockAnalysis, context);

      expect(plan.duration_days).toBe(3);
      expect(plan.plan_name).toContain('Recuperación');
      expect(plan.daily_activities).toHaveLength(3);
      expect(plan.success_metrics.length).toBeGreaterThan(0);
      expect(plan.adjustment_triggers.length).toBeGreaterThan(0);

      // Check that each day has activities and focus
      plan.daily_activities.forEach((day, index) => {
        expect(day.day).toBe(index + 1);
        expect(day.activities.length).toBeGreaterThan(0);
        expect(day.focus).toBeDefined();
      });
    });

    it('should adjust plan name for critical fatigue', () => {
      const mockAnalysis = {
        recovery_score: 20, // Very low recovery score
        fatigue_level: 'critical' as const,
        recommended_rest_days: 4,
        recovery_factors: {
          training_load: 9,
          sleep_debt: 8,
          stress_impact: 8,
          muscle_fatigue: 9
        },
        intervention_urgency: 'critical' as const
      };

      const context = createMockContext();
      const plan = RecoveryRecommendationService.generateRecoveryPlan(mockAnalysis, context);

      expect(plan.plan_name).toContain('Intensiva');
      expect(plan.duration_days).toBe(4);
    });

    it('should provide different daily focuses', () => {
      const mockAnalysis = {
        recovery_score: 50,
        fatigue_level: 'moderate' as const,
        recommended_rest_days: 3,
        recovery_factors: {
          training_load: 6,
          sleep_debt: 7, // High sleep debt
          stress_impact: 5,
          muscle_fatigue: 6
        },
        intervention_urgency: 'medium' as const
      };

      const context = createMockContext();
      const plan = RecoveryRecommendationService.generateRecoveryPlan(mockAnalysis, context);

      const focuses = plan.daily_activities.map(day => day.focus);
      
      expect(focuses[0]).toBe('Descanso y evaluación'); // First day
      expect(focuses[focuses.length - 1]).toBe('Preparación para retorno'); // Last day
      
      // Should include sleep optimization focus due to high sleep debt
      expect(focuses.some(focus => focus.includes('sueño'))).toBe(true);
    });
  });
});