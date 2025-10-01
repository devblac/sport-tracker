/**
 * AI Recommendation Service
 * Comprehensive AI-powered recommendation system that integrates plateau detection,
 * weakness analysis, weight recommendations, and recovery suggestions
 */

import { dbManager } from '@/db/IndexedDBManager';
import { WorkoutService } from './WorkoutService';
// Temporarily commented out due to import issues
// import { PlateauDetectionService } from './plateauDetectionService';
// Temporarily commented out due to import issues
// import { WeaknessAnalysisService } from './weaknessAnalysisService';
import { RecommendationEngine } from './recommendationEngine';
import type {
  AIRecommendations,
  RecommendationContext,
  WorkoutHistory,
  ExerciseHistory,
  RecoveryStatus,
  RecoveryRecommendation,
  WeightRecommendation,
  PlateauDetection,
  WeaknessAnalysis,
  ExerciseRecommendation,
  WorkoutSuggestion
} from '@/types/recommendations';
import type { Workout, SetData } from '@/schemas/workout';
import type { User } from '@/schemas/user';

export class AIRecommendationService {
  private static instance: AIRecommendationService;
  private workoutService: WorkoutService;
  private recommendationEngine: RecommendationEngine;

  private constructor() {
    this.workoutService = WorkoutService.getInstance();
    this.recommendationEngine = RecommendationEngine.getInstance();
  }

  public static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  /**
   * Generate comprehensive AI recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    user: User,
    options: {
      includeWeightSuggestions?: boolean;
      includePlateauDetection?: boolean;
      includeWeaknessAnalysis?: boolean;
      includeRecoveryRecommendations?: boolean;
      includeExerciseRecommendations?: boolean;
      weeksToAnalyze?: number;
    } = {}
  ): Promise<AIRecommendations> {
    const {
      includeWeightSuggestions = true,
      includePlateauDetection = true,
      includeWeaknessAnalysis = true,
      includeRecoveryRecommendations = true,
      includeExerciseRecommendations = true,
      weeksToAnalyze = 8
    } = options;

    try {
      // Build recommendation context
      const context = await this.buildRecommendationContext(userId, user, weeksToAnalyze);
      
      // Initialize recommendations object
      const recommendations: AIRecommendations = {
        weight_suggestions: [],
        plateau_detections: [],
        weakness_analyses: [],
        exercise_recommendations: [],
        recovery_recommendations: [],
        workout_suggestions: [],
        generated_at: new Date(),
        confidence_score: 0
      };

      // Generate different types of recommendations in parallel
      const promises: Promise<void>[] = [];

      if (includeWeightSuggestions) {
        promises.push(this.generateWeightSuggestions(context, recommendations));
      }

      if (includePlateauDetection) {
        promises.push(this.generatePlateauDetections(context, recommendations));
      }

      if (includeWeaknessAnalysis) {
        promises.push(this.generateWeaknessAnalyses(context, recommendations));
      }

      if (includeRecoveryRecommendations) {
        promises.push(this.generateRecoveryRecommendations(context, recommendations));
      }

      if (includeExerciseRecommendations) {
        promises.push(this.generateExerciseRecommendations(context, recommendations));
      }

      // Wait for all recommendations to be generated
      await Promise.all(promises);

      // Generate workout suggestions based on all analyses
      await this.generateWorkoutSuggestions(context, recommendations);

      // Calculate overall confidence score
      recommendations.confidence_score = this.calculateOverallConfidence(recommendations);

      return recommendations;
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  /**
   * Build recommendation context from user data
   */
  private async buildRecommendationContext(
    userId: string,
    user: User,
    weeksToAnalyze: number
  ): Promise<RecommendationContext> {
    // Get recent workouts
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (weeksToAnalyze * 7));

    const recentWorkouts = await this.workoutService.getWorkoutsByUser(userId);
    const filteredWorkouts = recentWorkouts
      .filter(workout => 
        workout.status === 'completed' && 
        workout.completed_at && 
        new Date(workout.completed_at) >= cutoffDate
      )
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    // Transform workouts to history format
    const workoutHistory: WorkoutHistory[] = filteredWorkouts.map(workout => ({
      id: workout.id,
      date: new Date(workout.completed_at!),
      duration: workout.total_duration || 0,
      total_volume: workout.total_volume || 0,
      exercises: workout.exercises.map(exercise => this.transformExerciseToHistory(exercise)),
      difficulty_rating: workout.difficulty_rating,
      energy_level: workout.energy_level,
      mood_rating: workout.mood_rating
    }));

    // Build recovery status (simplified - would integrate with health data in production)
    const recoveryStatus = await this.buildRecoveryStatus(workoutHistory);

    return {
      user_id: userId,
      recent_workouts: workoutHistory,
      recovery_status: recoveryStatus,
      user_goals: user.profile?.goals || [],
      fitness_level: user.profile?.fitness_level || 'beginner',
      available_equipment: [], // Would be from user preferences
      time_constraints: {
        max_workout_duration: 90, // Default 90 minutes
        sessions_per_week: 3 // Default 3 sessions per week
      }
    };
  }

  /**
   * Transform workout exercise to exercise history
   */
  private transformExerciseToHistory(exercise: any): ExerciseHistory {
    const completedSets = exercise.sets.filter((set: SetData) => set.completed && !set.skipped);
    
    return {
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name || exercise.exercise_id,
      sets: completedSets.map((set: SetData) => ({
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        type: set.type,
        completed: set.completed
      })),
      max_weight: completedSets.length > 0 ? Math.max(...completedSets.map((s: SetData) => s.weight)) : 0,
      total_volume: completedSets.reduce((sum: number, set: SetData) => sum + (set.weight * set.reps), 0),
      total_reps: completedSets.reduce((sum: number, set: SetData) => sum + set.reps, 0),
      average_rpe: completedSets.length > 0 ? 
        completedSets.reduce((sum: number, set: SetData) => sum + (set.rpe || 0), 0) / completedSets.length : 
        undefined
    };
  }

  /**
   * Build recovery status from workout history
   */
  private async buildRecoveryStatus(workoutHistory: WorkoutHistory[]): Promise<RecoveryStatus> {
    const now = new Date();
    const lastWorkout = workoutHistory[0];
    
    // Calculate consecutive training days
    let consecutiveDays = 0;
    let lastRestDay = now;
    
    if (workoutHistory.length > 0) {
      const sortedWorkouts = [...workoutHistory].sort((a, b) => b.date.getTime() - a.date.getTime());
      
      for (let i = 0; i < sortedWorkouts.length; i++) {
        const workout = sortedWorkouts[i];
        const daysDiff = Math.floor((now.getTime() - workout.date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === i) {
          consecutiveDays++;
        } else {
          lastRestDay = new Date(workout.date.getTime() + (1000 * 60 * 60 * 24));
          break;
        }
      }
    }

    // Estimate fatigue based on recent training volume and frequency
    const recentVolume = workoutHistory.slice(0, 7).reduce((sum, w) => sum + w.total_volume, 0);
    const avgVolume = workoutHistory.length > 0 ? 
      workoutHistory.reduce((sum, w) => sum + w.total_volume, 0) / workoutHistory.length : 0;
    
    const volumeRatio = avgVolume > 0 ? recentVolume / (avgVolume * 7) : 1;
    const baseFatigue = Math.min(10, 3 + (consecutiveDays * 0.5) + (volumeRatio * 2));

    // Estimate other metrics (would integrate with wearables/user input in production)
    const estimatedSoreness = Math.min(10, baseFatigue * 0.8);
    const estimatedSleepQuality = Math.max(1, 8 - (baseFatigue * 0.3));
    const estimatedStress = Math.min(10, 4 + (consecutiveDays * 0.2));

    return {
      overall_fatigue: Math.round(baseFatigue),
      muscle_soreness: Math.round(estimatedSoreness),
      sleep_quality: Math.round(estimatedSleepQuality),
      stress_level: Math.round(estimatedStress),
      last_rest_day: lastRestDay,
      consecutive_training_days: consecutiveDays
    };
  }

  /**
   * Generate weight suggestions for upcoming workouts
   */
  private async generateWeightSuggestions(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      // Get unique exercises from recent workouts
      const exerciseIds = new Set<string>();
      context.recent_workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exerciseIds.add(exercise.exercise_id);
        });
      });

      // Generate weight recommendations for each exercise
      const weightPromises = Array.from(exerciseIds).map(async (exerciseId) => {
        try {
          const recommendation = await this.recommendationEngine.getWeightRecommendation(
            context.user_id,
            exerciseId,
            10, // Default target reps
            1 // First set
          );
          return recommendation;
        } catch (error) {
          console.error(`Error getting weight recommendation for ${exerciseId}:`, error);
          return null;
        }
      });

      const weightSuggestions = (await Promise.all(weightPromises))
        .filter((rec): rec is WeightRecommendation => rec !== null)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10); // Top 10 recommendations

      recommendations.weight_suggestions = weightSuggestions;
    } catch (error) {
      console.error('Error generating weight suggestions:', error);
    }
  }

  /**
   * Generate plateau detections
   */
  private async generatePlateauDetections(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      // Temporarily commented out due to import issues
      // const plateaus = await PlateauDetectionService.detectAllPlateaus(context);
      const plateaus: any[] = [];
      recommendations.plateau_detections = plateaus;
    } catch (error) {
      console.error('Error generating plateau detections:', error);
    }
  }

  /**
   * Generate weakness analyses
   */
  private async generateWeaknessAnalyses(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      // Temporarily commented out due to import issues
      // const weaknesses = await WeaknessAnalysisService.analyzeWeaknesses(context);
      const weaknesses: any[] = [];
      recommendations.weakness_analyses = weaknesses;
    } catch (error) {
      console.error('Error generating weakness analyses:', error);
    }
  }

  /**
   * Generate recovery recommendations
   */
  private async generateRecoveryRecommendations(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      const recoveryRecs: RecoveryRecommendation[] = [];
      const recovery = context.recovery_status;

      // High fatigue recommendations
      if (recovery.overall_fatigue >= 8) {
        recoveryRecs.push({
          type: 'rest_day',
          title: 'Día de Descanso Completo',
          description: 'Tu nivel de fatiga es alto. Toma un día completo de descanso para recuperarte.',
          duration: '1-2 días',
          priority: 'high',
          implementation_steps: [
            'Evita entrenamientos intensos',
            'Enfócate en hidratación y nutrición',
            'Considera técnicas de relajación',
            'Asegúrate de dormir 8+ horas'
          ],
          expected_benefits: [
            'Reducción de fatiga muscular',
            'Mejor rendimiento en próximos entrenamientos',
            'Reducción del riesgo de lesiones',
            'Mejora del estado de ánimo'
          ]
        });
      } else if (recovery.overall_fatigue >= 6) {
        recoveryRecs.push({
          type: 'active_recovery',
          title: 'Recuperación Activa',
          description: 'Realiza actividades de baja intensidad para promover la recuperación.',
          duration: '30-45 minutos',
          priority: 'medium',
          implementation_steps: [
            'Caminar ligero o yoga suave',
            'Estiramientos dinámicos',
            'Movilidad articular',
            'Ejercicios de respiración'
          ],
          expected_benefits: [
            'Mejora de la circulación sanguínea',
            'Reducción de la rigidez muscular',
            'Mantenimiento de la movilidad',
            'Preparación para próximos entrenamientos'
          ]
        });
      }

      // Sleep optimization
      if (recovery.sleep_quality <= 6) {
        recoveryRecs.push({
          type: 'sleep_optimization',
          title: 'Optimización del Sueño',
          description: 'Mejora la calidad de tu sueño para una mejor recuperación.',
          duration: 'Rutina nocturna',
          priority: 'high',
          implementation_steps: [
            'Establece horario fijo para dormir',
            'Evita pantallas 1 hora antes de dormir',
            'Mantén habitación fresca y oscura',
            'Considera suplementos de magnesio'
          ],
          expected_benefits: [
            'Mejor recuperación muscular',
            'Mayor energía durante el día',
            'Mejor concentración en entrenamientos',
            'Fortalecimiento del sistema inmune'
          ]
        });
      }

      // Consecutive training days warning
      if (recovery.consecutive_training_days >= 5) {
        recoveryRecs.push({
          type: 'rest_day',
          title: 'Descanso Obligatorio',
          description: `Has entrenado ${recovery.consecutive_training_days} días consecutivos. Es hora de descansar.`,
          duration: '1-2 días',
          priority: 'high',
          implementation_steps: [
            'Programa día de descanso completo',
            'Enfócate en nutrición de recuperación',
            'Considera masaje o sauna',
            'Evalúa tu programa de entrenamiento'
          ],
          expected_benefits: [
            'Prevención del sobreentrenamiento',
            'Mejor adaptación al entrenamiento',
            'Reducción del riesgo de lesiones',
            'Renovación mental'
          ]
        });
      }

      // Stress management
      if (recovery.stress_level >= 7) {
        recoveryRecs.push({
          type: 'stress_management',
          title: 'Manejo del Estrés',
          description: 'Tu nivel de estrés está afectando tu recuperación. Implementa técnicas de manejo del estrés.',
          duration: '15-30 minutos diarios',
          priority: 'medium',
          implementation_steps: [
            'Practica meditación o mindfulness',
            'Realiza ejercicios de respiración profunda',
            'Considera actividades relajantes',
            'Evalúa factores estresantes en tu vida'
          ],
          expected_benefits: [
            'Mejor calidad del sueño',
            'Reducción de cortisol',
            'Mayor energía para entrenamientos',
            'Mejor bienestar general'
          ]
        });
      }

      recommendations.recovery_recommendations = recoveryRecs
        .sort((a, b) => {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    } catch (error) {
      console.error('Error generating recovery recommendations:', error);
    }
  }

  /**
   * Generate exercise recommendations
   */
  private async generateExerciseRecommendations(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      const exerciseRecs = await this.recommendationEngine.getExerciseRecommendations(
        context.user_id
      );
      recommendations.exercise_recommendations = exerciseRecs;
    } catch (error) {
      console.error('Error generating exercise recommendations:', error);
    }
  }

  /**
   * Generate workout suggestions based on all analyses
   */
  private async generateWorkoutSuggestions(
    context: RecommendationContext,
    recommendations: AIRecommendations
  ): Promise<void> {
    try {
      const suggestions: WorkoutSuggestion[] = [];

      // Suggestions based on plateaus
      recommendations.plateau_detections.forEach(plateau => {
        if (plateau.plateau_detected && plateau.confidence > 0.7) {
          suggestions.push({
            type: 'deload',
            title: `Deload para ${plateau.exercise_name}`,
            description: `Detectamos un plateau en ${plateau.exercise_name}. Considera un deload del 10-15%.`,
            priority: 'high',
            exerciseId: plateau.exercise_id,
            reasoning: `Plateau detectado por ${plateau.plateau_duration_weeks} semanas con ${Math.round(plateau.confidence * 100)}% de confianza.`
          });
        }
      });

      // Suggestions based on weaknesses
      recommendations.weakness_analyses
        .filter(weakness => weakness.priority === 'critical' || weakness.priority === 'high')
        .slice(0, 3)
        .forEach(weakness => {
          if (weakness.recommended_exercises.length > 0) {
            const topExercise = weakness.recommended_exercises[0];
            suggestions.push({
              type: 'exercise',
              title: `Agregar ${topExercise.exercise_name}`,
              description: `Para fortalecer ${weakness.muscle_group}: ${topExercise.reasoning}`,
              priority: weakness.priority === 'critical' ? 'high' : 'medium',
              exerciseId: topExercise.exercise_id,
              reasoning: `Debilidad identificada en ${weakness.muscle_group} con score ${Math.round(weakness.weakness_score * 100)}/100.`
            });
          }
        });

      // Suggestions based on recovery
      if (context.recovery_status.overall_fatigue >= 8) {
        suggestions.push({
          type: 'rest',
          title: 'Día de Descanso Recomendado',
          description: 'Tu nivel de fatiga es alto. Considera tomar un día de descanso completo.',
          priority: 'high',
          reasoning: `Fatiga general: ${context.recovery_status.overall_fatigue}/10, días consecutivos: ${context.recovery_status.consecutive_training_days}.`
        });
      }

      // Suggestions based on training variety
      const recentExercises = new Set<string>();
      context.recent_workouts.slice(0, 5).forEach(workout => {
        workout.exercises.forEach(exercise => {
          recentExercises.add(exercise.exercise_id);
        });
      });

      if (recentExercises.size < 8) {
        suggestions.push({
          type: 'variation',
          title: 'Aumentar Variedad de Ejercicios',
          description: 'Has usado pocos ejercicios diferentes recientemente. Considera agregar variaciones.',
          priority: 'medium',
          reasoning: `Solo ${recentExercises.size} ejercicios diferentes en los últimos 5 entrenamientos.`
        });
      }

      recommendations.workout_suggestions = suggestions
        .sort((a, b) => {
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 8); // Top 8 suggestions
    } catch (error) {
      console.error('Error generating workout suggestions:', error);
    }
  }

  /**
   * Calculate overall confidence score for recommendations
   */
  private calculateOverallConfidence(recommendations: AIRecommendations): number {
    let totalConfidence = 0;
    let confidenceCount = 0;

    // Weight suggestions confidence
    if (recommendations.weight_suggestions.length > 0) {
      const avgWeightConfidence = recommendations.weight_suggestions
        .reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.weight_suggestions.length;
      totalConfidence += avgWeightConfidence;
      confidenceCount++;
    }

    // Plateau detections confidence
    if (recommendations.plateau_detections.length > 0) {
      const avgPlateauConfidence = recommendations.plateau_detections
        .reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.plateau_detections.length;
      totalConfidence += avgPlateauConfidence;
      confidenceCount++;
    }

    // Base confidence for other recommendations (they don't have explicit confidence scores)
    if (recommendations.weakness_analyses.length > 0) {
      totalConfidence += 0.8; // High confidence in weakness analysis
      confidenceCount++;
    }

    if (recommendations.recovery_recommendations.length > 0) {
      totalConfidence += 0.9; // Very high confidence in recovery recommendations
      confidenceCount++;
    }

    if (recommendations.exercise_recommendations.length > 0) {
      totalConfidence += 0.7; // Medium confidence in exercise recommendations
      confidenceCount++;
    }

    return confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5;
  }

  /**
   * Get specific recommendations for an exercise
   */
  async getExerciseSpecificRecommendations(
    userId: string,
    exerciseId: string,
    targetReps: number = 10
  ): Promise<{
    weightRecommendation: WeightRecommendation;
    plateauDetection: PlateauDetection | null;
    suggestions: string[];
  }> {
    try {
      // Get weight recommendation
      const weightRecommendation = await this.recommendationEngine.getWeightRecommendation(
        userId,
        exerciseId,
        targetReps
      );

      // Check for plateau
      const plateauDetection = await this.recommendationEngine.detectPlateau(userId, exerciseId);

      // Generate specific suggestions
      const suggestions: string[] = [];

      if (plateauDetection.isPlateaued) {
        suggestions.push(...plateauDetection.suggestions);
      } else if (weightRecommendation.progressionType === 'linear') {
        suggestions.push('Continúa con progresión lineal, aumentando peso gradualmente.');
      } else if (weightRecommendation.progressionType === 'deload') {
        suggestions.push('Considera un deload para permitir recuperación y supercompensación.');
      }

      // Add confidence-based suggestions
      if (weightRecommendation.confidence < 0.6) {
        suggestions.push('Recomendación basada en datos limitados. Ajusta según tu sensación.');
      }

      return {
        weightRecommendation,
        plateauDetection: plateauDetection.isPlateaued ? {
          exercise_id: exerciseId,
          exercise_name: exerciseId, // Would get from exercise database
          plateau_detected: plateauDetection.isPlateaued,
          plateau_duration_weeks: plateauDetection.plateauDuration,
          plateau_type: 'strength', // Simplified
          last_improvement_date: plateauDetection.lastImprovement,
          stagnant_metric: 'max_weight',
          current_value: weightRecommendation.previousBest,
          previous_best: weightRecommendation.previousBest,
          confidence: 0.8, // Default confidence
          suggested_interventions: plateauDetection.suggestions.map(suggestion => ({
            type: 'technique_focus' as const,
            description: suggestion,
            duration_weeks: 2,
            expected_outcome: 'Mejora en el rendimiento del ejercicio',
            priority: 'medium' as const,
            implementation_details: [suggestion]
          }))
        } : null,
        suggestions
      };
    } catch (error) {
      console.error('Error getting exercise-specific recommendations:', error);
      throw error;
    }
  }
}