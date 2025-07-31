/**
 * Recommendation Engine
 * Core AI system for generating workout, weight, and exercise recommendations
 */

import {
  RecommendationContext,
  RecommendationResult,
  WeightSuggestion,
  RepsSuggestion,
  PlateauDetection,
  WeaknessAnalysis,
  WorkoutRecommendation,
  ProgressionRecommendation,
  WorkoutHistory,
  ExerciseHistory,
  PlateauIntervention,
  ExerciseRecommendation,
  AlgorithmConfig,
  MUSCLE_GROUPS,
  EXERCISE_CATEGORIES
} from '../types/recommendations';

export class RecommendationEngine {
  private static config: AlgorithmConfig = {
    weight_progression: {
      linear_increase_percentage: 2.5,
      plateau_threshold_weeks: 3,
      deload_percentage: 10,
      max_weekly_increase: 10
    },
    plateau_detection: {
      minimum_data_points: 6,
      stagnation_threshold_weeks: 3,
      improvement_threshold_percentage: 2.5,
      confidence_threshold: 0.7
    },
    weakness_analysis: {
      comparison_percentile_threshold: 25,
      muscle_imbalance_threshold: 20,
      exercise_frequency_weight: 0.3,
      performance_weight: 0.7
    },
    recommendation_weights: {
      recent_performance: 0.4,
      historical_trends: 0.3,
      user_preferences: 0.15,
      recovery_status: 0.1,
      goal_alignment: 0.05
    }
  };

  /**
   * Generates comprehensive recommendations for a user
   */
  static async generateRecommendations(context: RecommendationContext): Promise<RecommendationResult> {
    try {
      const startTime = Date.now();

      // Generate different types of recommendations
      const weightSuggestions = await this.generateWeightSuggestions(context);
      const repsSuggestions = await this.generateRepsSuggestions(context);
      const plateauDetections = await this.detectPlateaus(context);
      const weaknessAnalyses = await this.analyzeWeaknesses(context);
      const workoutRecommendations = await this.generateWorkoutRecommendations(context);
      const progressionRecommendations = await this.generateProgressionRecommendations(context);
      const generalAdvice = await this.generateGeneralAdvice(context);

      // Calculate overall confidence score
      const confidenceScore = this.calculateOverallConfidence([
        ...weightSuggestions.map(w => w.confidence),
        ...repsSuggestions.map(r => r.confidence),
        ...plateauDetections.map(p => p.confidence)
      ]);

      const processingTime = Date.now() - startTime;
      console.log(`Recommendations generated in ${processingTime}ms`);

      return {
        weight_suggestions: weightSuggestions,
        reps_suggestions: repsSuggestions,
        plateau_detections: plateauDetections,
        weakness_analyses: weaknessAnalyses,
        workout_recommendations: workoutRecommendations,
        progression_recommendations: progressionRecommendations,
        general_advice: generalAdvice,
        confidence_score: confidenceScore,
        last_updated: new Date()
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Generates weight suggestions for exercises
   */
  private static async generateWeightSuggestions(context: RecommendationContext): Promise<WeightSuggestion[]> {
    const suggestions: WeightSuggestion[] = [];
    
    // Get unique exercises from recent workouts
    const exerciseMap = new Map<string, ExerciseHistory[]>();
    
    context.recent_workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exerciseMap.has(exercise.exercise_id)) {
          exerciseMap.set(exercise.exercise_id, []);
        }
        exerciseMap.get(exercise.exercise_id)!.push(exercise);
      });
    });

    for (const [exerciseId, exerciseHistory] of exerciseMap) {
      if (exerciseHistory.length < 2) continue; // Need at least 2 data points

      const suggestion = this.calculateWeightSuggestion(exerciseId, exerciseHistory, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculates weight suggestion for a specific exercise
   */
  private static calculateWeightSuggestion(
    exerciseId: string,
    history: ExerciseHistory[],
    context: RecommendationContext
  ): WeightSuggestion | null {
    
    const sortedHistory = history.sort((a, b) => 
      new Date(context.recent_workouts.find(w => w.exercises.includes(a))?.date || 0).getTime() - 
      new Date(context.recent_workouts.find(w => w.exercises.includes(b))?.date || 0).getTime()
    );

    const latestExercise = sortedHistory[sortedHistory.length - 1];
    const currentMaxWeight = latestExercise.max_weight;
    
    // Analyze recent performance trend
    const recentWeights = sortedHistory.slice(-4).map(e => e.max_weight);
    const trend = this.calculateTrend(recentWeights);
    
    // Check for plateau
    const plateauDetected = this.isPlateauDetected(recentWeights);
    
    // Calculate base suggestion
    let suggestedWeight = currentMaxWeight;
    let progressionType: WeightSuggestion['progression_type'] = 'linear';
    let reasoning = '';
    let confidence = 0.8;

    if (plateauDetected) {
      // Suggest deload
      suggestedWeight = currentMaxWeight * (1 - this.config.weight_progression.deload_percentage / 100);
      progressionType = 'deload';
      reasoning = 'Plateau detectado. Se recomienda deload para romper el estancamiento.';
      confidence = 0.9;
    } else if (trend > 0) {
      // Positive trend - suggest increase
      const increasePercentage = Math.min(
        this.config.weight_progression.linear_increase_percentage,
        this.config.weight_progression.max_weekly_increase
      );
      suggestedWeight = currentMaxWeight * (1 + increasePercentage / 100);
      progressionType = 'linear';
      reasoning = `Progreso positivo detectado. Incremento del ${increasePercentage}% recomendado.`;
      confidence = 0.85;
    } else if (trend < -0.1) {
      // Declining trend - maintain or slight deload
      suggestedWeight = currentMaxWeight * 0.95;
      progressionType = 'deload';
      reasoning = 'Tendencia descendente. Se recomienda reducir peso para enfocarse en técnica.';
      confidence = 0.75;
    } else {
      // Stable trend - small increase or maintain
      suggestedWeight = currentMaxWeight * 1.01;
      progressionType = 'maintain';
      reasoning = 'Rendimiento estable. Incremento conservador recomendado.';
      confidence = 0.7;
    }

    // Adjust based on recovery status
    if (context.recovery_status.overall_fatigue > 7) {
      suggestedWeight *= 0.95;
      confidence *= 0.9;
      reasoning += ' Ajustado por alta fatiga.';
    }

    // Round to nearest 2.5kg for practical use
    suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;

    return {
      exercise_id: exerciseId,
      exercise_name: latestExercise.exercise_name,
      suggested_weight: suggestedWeight,
      confidence,
      reasoning,
      progression_type: progressionType,
      alternative_weights: {
        conservative: suggestedWeight * 0.95,
        aggressive: suggestedWeight * 1.05
      },
      expected_reps: this.estimateRepsForWeight(exerciseId, suggestedWeight, history),
      target_rpe: this.getTargetRPE(context.user_demographics.goals)
    };
  }

  /**
   * Generates reps suggestions for given weights
   */
  private static async generateRepsSuggestions(context: RecommendationContext): Promise<RepsSuggestion[]> {
    const suggestions: RepsSuggestion[] = [];
    
    // This would typically be called when user selects a specific weight
    // For now, generate suggestions for recent exercises
    const recentExercises = context.recent_workouts
      .flatMap(w => w.exercises)
      .slice(-10); // Last 10 exercises

    for (const exercise of recentExercises) {
      const suggestion = this.calculateRepsSuggestion(exercise, context);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Calculates reps suggestion for a specific weight
   */
  private static calculateRepsSuggestion(
    exercise: ExerciseHistory,
    context: RecommendationContext
  ): RepsSuggestion | null {
    
    const targetWeight = exercise.max_weight;
    const recentSets = exercise.sets.filter(s => s.weight === targetWeight);
    
    if (recentSets.length === 0) return null;

    const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;
    const maxReps = Math.max(...recentSets.map(s => s.reps));
    
    // Determine target based on user goals
    const primaryGoal = context.user_demographics.goals[0];
    let suggestedReps = avgReps;
    let repRange = { min: 1, max: 20 };
    let targetRPE = 7;

    switch (primaryGoal) {
      case 'strength':
        suggestedReps = Math.min(avgReps + 1, 5);
        repRange = { min: 1, max: 5 };
        targetRPE = 8;
        break;
      case 'hypertrophy':
        suggestedReps = Math.min(avgReps + 2, 12);
        repRange = { min: 6, max: 12 };
        targetRPE = 7;
        break;
      case 'endurance':
        suggestedReps = Math.min(avgReps + 3, 20);
        repRange = { min: 12, max: 20 };
        targetRPE = 6;
        break;
      default:
        suggestedReps = Math.min(avgReps + 1, 10);
        repRange = { min: 6, max: 10 };
        targetRPE = 7;
    }

    return {
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name,
      weight: targetWeight,
      suggested_reps: Math.round(suggestedReps),
      rep_range: repRange,
      confidence: 0.8,
      reasoning: `Basado en rendimiento reciente y objetivo de ${primaryGoal}`,
      target_rpe: targetRPE
    };
  }

  /**
   * Detects plateaus in user performance
   */
  private static async detectPlateaus(context: RecommendationContext): Promise<PlateauDetection[]> {
    const plateaus: PlateauDetection[] = [];
    
    // Group exercises by ID
    const exerciseGroups = new Map<string, ExerciseHistory[]>();
    
    context.recent_workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exerciseGroups.has(exercise.exercise_id)) {
          exerciseGroups.set(exercise.exercise_id, []);
        }
        exerciseGroups.get(exercise.exercise_id)!.push(exercise);
      });
    });

    for (const [exerciseId, exercises] of exerciseGroups) {
      if (exercises.length < this.config.plateau_detection.minimum_data_points) continue;

      const plateau = this.analyzePlateauForExercise(exerciseId, exercises, context);
      if (plateau) {
        plateaus.push(plateau);
      }
    }

    return plateaus.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyzes plateau for a specific exercise
   */
  private static analyzePlateauForExercise(
    exerciseId: string,
    exercises: ExerciseHistory[],
    context: RecommendationContext
  ): PlateauDetection | null {
    
    const sortedExercises = exercises.sort((a, b) => {
      const dateA = context.recent_workouts.find(w => w.exercises.includes(a))?.date || new Date(0);
      const dateB = context.recent_workouts.find(w => w.exercises.includes(b))?.date || new Date(0);
      return dateA.getTime() - dateB.getTime();
    });

    const latestExercise = sortedExercises[sortedExercises.length - 1];
    
    // Analyze different metrics
    const maxWeights = sortedExercises.map(e => e.max_weight);
    const totalVolumes = sortedExercises.map(e => e.total_volume);
    
    // Check for stagnation in max weight
    const weightPlateau = this.checkMetricPlateau(maxWeights, 'max_weight');
    const volumePlateau = this.checkMetricPlateau(totalVolumes, 'total_volume');
    
    let plateauDetected = false;
    let plateauType: PlateauDetection['plateau_type'] = 'strength';
    let stagnantMetric: PlateauDetection['stagnant_metric'] = 'max_weight';
    let currentValue = 0;
    let previousBest = 0;
    let confidence = 0;

    if (weightPlateau.detected) {
      plateauDetected = true;
      plateauType = 'strength';
      stagnantMetric = 'max_weight';
      currentValue = maxWeights[maxWeights.length - 1];
      previousBest = Math.max(...maxWeights.slice(0, -3));
      confidence = weightPlateau.confidence;
    } else if (volumePlateau.detected) {
      plateauDetected = true;
      plateauType = 'volume';
      stagnantMetric = 'total_volume';
      currentValue = totalVolumes[totalVolumes.length - 1];
      previousBest = Math.max(...totalVolumes.slice(0, -3));
      confidence = volumePlateau.confidence;
    }

    if (!plateauDetected) return null;

    // Calculate plateau duration
    const plateauDurationWeeks = this.calculatePlateauDuration(sortedExercises, context);
    
    // Generate interventions
    const interventions = this.generatePlateauInterventions(plateauType, exerciseId, context);

    return {
      exercise_id: exerciseId,
      exercise_name: latestExercise.exercise_name,
      plateau_detected: plateauDetected,
      plateau_duration_weeks: plateauDurationWeeks,
      plateau_type: plateauType,
      last_improvement_date: this.findLastImprovementDate(sortedExercises, context),
      stagnant_metric: stagnantMetric,
      current_value: currentValue,
      previous_best: previousBest,
      confidence: confidence,
      suggested_interventions: interventions
    };
  }

  /**
   * Checks if a metric shows plateau pattern
   */
  private static checkMetricPlateau(values: number[], metricType: string): { detected: boolean; confidence: number } {
    if (values.length < this.config.plateau_detection.minimum_data_points) {
      return { detected: false, confidence: 0 };
    }

    const recentValues = values.slice(-4); // Last 4 data points
    const previousBest = Math.max(...values.slice(0, -4));
    const recentBest = Math.max(...recentValues);
    
    const improvementPercentage = ((recentBest - previousBest) / previousBest) * 100;
    const isStagnant = improvementPercentage < this.config.plateau_detection.improvement_threshold_percentage;
    
    // Calculate confidence based on consistency of stagnation
    const variance = this.calculateVariance(recentValues);
    const confidence = isStagnant ? Math.min(0.9, 0.5 + (1 / (variance + 1))) : 0;
    
    return {
      detected: isStagnant && confidence >= this.config.plateau_detection.confidence_threshold,
      confidence: confidence
    };
  }

  /**
   * Analyzes user weaknesses based on performance data
   */
  private static async analyzeWeaknesses(context: RecommendationContext): Promise<WeaknessAnalysis[]> {
    const weaknesses: WeaknessAnalysis[] = [];
    
    // Analyze muscle group performance
    const muscleGroupPerformance = this.analyzeMuscleGroupPerformance(context);
    
    // Identify weak muscle groups
    for (const [muscleGroup, performance] of Object.entries(muscleGroupPerformance)) {
      if (performance.weaknessScore > 0.6) { // Threshold for weakness
        const weakness: WeaknessAnalysis = {
          muscle_group: muscleGroup,
          weakness_score: performance.weaknessScore,
          contributing_factors: performance.contributingFactors,
          affected_exercises: performance.affectedExercises,
          recommended_exercises: this.getRecommendedExercisesForMuscleGroup(muscleGroup),
          priority: this.calculateWeaknessPriority(performance.weaknessScore)
        };
        
        weaknesses.push(weakness);
      }
    }

    return weaknesses.sort((a, b) => b.weakness_score - a.weakness_score);
  }

  /**
   * Analyzes performance by muscle group
   */
  private static analyzeMuscleGroupPerformance(context: RecommendationContext): Record<string, any> {
    const muscleGroupData: Record<string, any> = {};
    
    // Initialize muscle groups
    Object.values(MUSCLE_GROUPS).forEach(group => {
      muscleGroupData[group] = {
        exercises: [],
        totalVolume: 0,
        frequency: 0,
        averagePerformance: 0,
        weaknessScore: 0,
        contributingFactors: [],
        affectedExercises: []
      };
    });

    // Map exercises to muscle groups (simplified mapping)
    const exerciseMuscleMap: Record<string, string[]> = {
      'bench_press': [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
      'squat': [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
      'deadlift': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES],
      'pull_ups': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
      'overhead_press': [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS],
      'rows': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS]
    };

    // Analyze recent workouts
    context.recent_workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const muscleGroups = exerciseMuscleMap[exercise.exercise_id] || [MUSCLE_GROUPS.CORE];
        
        muscleGroups.forEach(group => {
          if (muscleGroupData[group]) {
            muscleGroupData[group].exercises.push(exercise.exercise_name);
            muscleGroupData[group].totalVolume += exercise.total_volume;
            muscleGroupData[group].frequency += 1;
          }
        });
      });
    });

    // Calculate weakness scores
    const avgVolume = Object.values(muscleGroupData).reduce((sum: number, data: any) => sum + data.totalVolume, 0) / Object.keys(muscleGroupData).length;
    const avgFrequency = Object.values(muscleGroupData).reduce((sum: number, data: any) => sum + data.frequency, 0) / Object.keys(muscleGroupData).length;

    Object.keys(muscleGroupData).forEach(group => {
      const data = muscleGroupData[group];
      
      // Calculate weakness score based on volume and frequency relative to average
      const volumeRatio = avgVolume > 0 ? data.totalVolume / avgVolume : 0;
      const frequencyRatio = avgFrequency > 0 ? data.frequency / avgFrequency : 0;
      
      // Weakness score: higher = more weak (inverted ratios)
      data.weaknessScore = Math.max(0, 1 - (volumeRatio * 0.6 + frequencyRatio * 0.4));
      
      // Identify contributing factors
      if (volumeRatio < 0.7) data.contributingFactors.push('Bajo volumen de entrenamiento');
      if (frequencyRatio < 0.7) data.contributingFactors.push('Baja frecuencia de entrenamiento');
      if (data.exercises.length < 2) data.contributingFactors.push('Variedad limitada de ejercicios');
      
      data.affectedExercises = [...new Set(data.exercises)];
    });

    return muscleGroupData;
  }

  /**
   * Generates workout recommendations
   */
  private static async generateWorkoutRecommendations(context: RecommendationContext): Promise<WorkoutRecommendation[]> {
    const recommendations: WorkoutRecommendation[] = [];
    
    // Analyze user's primary goals and generate appropriate workouts
    const primaryGoal = context.user_demographics.goals[0];
    
    switch (primaryGoal) {
      case 'strength':
        recommendations.push(this.generateStrengthWorkout(context));
        break;
      case 'hypertrophy':
        recommendations.push(this.generateHypertrophyWorkout(context));
        break;
      case 'endurance':
        recommendations.push(this.generateEnduranceWorkout(context));
        break;
      default:
        recommendations.push(this.generateGeneralFitnessWorkout(context));
    }

    // Add recovery workout if high fatigue
    if (context.recovery_status.overall_fatigue > 7) {
      recommendations.unshift(this.generateRecoveryWorkout(context));
    }

    return recommendations;
  }

  /**
   * Generates progression recommendations
   */
  private static async generateProgressionRecommendations(context: RecommendationContext): Promise<ProgressionRecommendation[]> {
    const recommendations: ProgressionRecommendation[] = [];
    
    // Analyze each exercise for progression opportunities
    const exerciseMap = new Map<string, ExerciseHistory[]>();
    
    context.recent_workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!exerciseMap.has(exercise.exercise_id)) {
          exerciseMap.set(exercise.exercise_id, []);
        }
        exerciseMap.get(exercise.exercise_id)!.push(exercise);
      });
    });

    for (const [exerciseId, history] of exerciseMap) {
      if (history.length >= 3) {
        const progression = this.generateProgressionForExercise(exerciseId, history, context);
        if (progression) {
          recommendations.push(progression);
        }
      }
    }

    return recommendations;
  }

  /**
   * Generates general advice based on analysis
   */
  private static async generateGeneralAdvice(context: RecommendationContext): Promise<RecommendationResult['general_advice']> {
    const advice: RecommendationResult['general_advice'] = [];
    
    // Recovery advice
    if (context.recovery_status.overall_fatigue > 7) {
      advice.push({
        priority: 'high',
        category: 'recovery',
        message: 'Tu nivel de fatiga es alto. Considera tomar un día de descanso o hacer entrenamiento ligero.',
        action_items: [
          'Programa un día de descanso completo',
          'Enfócate en ejercicios de movilidad',
          'Asegúrate de dormir 7-9 horas',
          'Considera un masaje o terapia de recuperación'
        ]
      });
    }

    // Training frequency advice
    if (context.user_demographics.training_frequency < 3) {
      advice.push({
        priority: 'medium',
        category: 'training',
        message: 'Aumentar la frecuencia de entrenamiento podría acelerar tu progreso.',
        action_items: [
          'Intenta entrenar al menos 3 veces por semana',
          'Considera sesiones más cortas pero más frecuentes',
          'Incluye actividad ligera en días de descanso'
        ]
      });
    }

    // Technique advice for beginners
    if (context.user_demographics.experience_level === 'beginner') {
      advice.push({
        priority: 'high',
        category: 'technique',
        message: 'Como principiante, enfócate en dominar la técnica antes que en aumentar peso.',
        action_items: [
          'Practica movimientos con peso corporal',
          'Considera trabajar con un entrenador',
          'Graba tus entrenamientos para revisar técnica',
          'Prioriza la forma sobre el peso'
        ]
      });
    }

    return advice;
  }

  // Helper methods
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private static isPlateauDetected(values: number[]): boolean {
    if (values.length < 4) return false;
    
    const recent = values.slice(-3);
    const variance = this.calculateVariance(recent);
    const trend = this.calculateTrend(recent);
    
    return variance < 5 && Math.abs(trend) < 0.5; // Low variance and minimal trend
  }

  private static calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private static estimateRepsForWeight(exerciseId: string, weight: number, history: ExerciseHistory[]): number {
    // Simple estimation based on recent performance
    const recentSets = history.flatMap(e => e.sets).filter(s => s.weight <= weight);
    if (recentSets.length === 0) return 8; // Default
    
    const avgReps = recentSets.reduce((sum, set) => sum + set.reps, 0) / recentSets.length;
    return Math.round(avgReps);
  }

  private static getTargetRPE(goals: string[]): number {
    const primaryGoal = goals[0];
    switch (primaryGoal) {
      case 'strength': return 8;
      case 'hypertrophy': return 7;
      case 'endurance': return 6;
      default: return 7;
    }
  }

  private static calculateOverallConfidence(confidenceScores: number[]): number {
    if (confidenceScores.length === 0) return 0;
    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }

  private static calculatePlateauDuration(exercises: ExerciseHistory[], context: RecommendationContext): number {
    // Simplified calculation - would be more sophisticated in real implementation
    return 3; // Default 3 weeks
  }

  private static findLastImprovementDate(exercises: ExerciseHistory[], context: RecommendationContext): Date | undefined {
    // Find the last time there was a significant improvement
    // Simplified implementation
    return new Date(Date.now() - 21 * 24 * 60 * 60 * 1000); // 3 weeks ago
  }

  private static generatePlateauInterventions(plateauType: string, exerciseId: string, context: RecommendationContext): PlateauIntervention[] {
    const interventions: PlateauIntervention[] = [];
    
    // Common interventions based on plateau type
    if (plateauType === 'strength') {
      interventions.push({
        type: 'deload',
        description: 'Reducir peso en 10-15% durante 1-2 semanas',
        duration_weeks: 2,
        expected_outcome: 'Recuperación del sistema nervioso y preparación para nuevo progreso',
        priority: 'high',
        implementation_details: [
          'Reduce el peso en 10-15%',
          'Mantén el mismo volumen de entrenamiento',
          'Enfócate en técnica perfecta',
          'Aumenta gradualmente después del deload'
        ]
      });
      
      interventions.push({
        type: 'technique_focus',
        description: 'Enfocarse en perfeccionar la técnica del ejercicio',
        duration_weeks: 2,
        expected_outcome: 'Mejor eficiencia del movimiento y activación muscular',
        priority: 'medium',
        implementation_details: [
          'Reduce el peso si es necesario',
          'Practica el movimiento lentamente',
          'Considera grabarte para análisis',
          'Trabaja con un entrenador si es posible'
        ]
      });
    }

    return interventions;
  }

  private static getRecommendedExercisesForMuscleGroup(muscleGroup: string): ExerciseRecommendation[] {
    const exerciseDatabase: Record<string, ExerciseRecommendation[]> = {
      [MUSCLE_GROUPS.CHEST]: [
        {
          exercise_id: 'push_ups',
          exercise_name: 'Flexiones',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS],
          difficulty_level: 2,
          equipment_needed: [],
          recommended_sets: 3,
          recommended_reps: '8-15',
          frequency_per_week: 2,
          reasoning: 'Ejercicio fundamental para desarrollar fuerza en pecho',
          instructions: [
            'Mantén el cuerpo recto',
            'Baja hasta que el pecho casi toque el suelo',
            'Empuja hacia arriba de forma controlada'
          ]
        }
      ],
      [MUSCLE_GROUPS.BACK]: [
        {
          exercise_id: 'pull_ups',
          exercise_name: 'Dominadas',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
          difficulty_level: 3,
          equipment_needed: ['pull_up_bar'],
          recommended_sets: 3,
          recommended_reps: '5-10',
          frequency_per_week: 2,
          reasoning: 'Excelente para desarrollar fuerza en espalda',
          instructions: [
            'Agarre pronado, manos separadas al ancho de hombros',
            'Tira hacia arriba hasta que la barbilla pase la barra',
            'Baja de forma controlada'
          ]
        }
      ]
    };

    return exerciseDatabase[muscleGroup] || [];
  }

  private static calculateWeaknessPriority(weaknessScore: number): WeaknessAnalysis['priority'] {
    if (weaknessScore > 0.8) return 'critical';
    if (weaknessScore > 0.7) return 'high';
    if (weaknessScore > 0.6) return 'medium';
    return 'low';
  }

  private static generateStrengthWorkout(context: RecommendationContext): WorkoutRecommendation {
    return {
      workout_type: 'strength',
      recommended_exercises: [
        {
          exercise_id: 'squat',
          exercise_name: 'Sentadilla',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
          difficulty_level: 3,
          equipment_needed: ['barbell', 'squat_rack'],
          recommended_sets: 5,
          recommended_reps: '3-5',
          frequency_per_week: 2,
          reasoning: 'Ejercicio fundamental para fuerza de piernas',
          instructions: ['Mantén la espalda recta', 'Baja hasta que los muslos estén paralelos', 'Empuja a través de los talones']
        }
      ],
      estimated_duration: 60,
      difficulty_level: 4,
      focus_areas: ['Fuerza máxima', 'Técnica'],
      reasoning: 'Entrenamiento enfocado en desarrollo de fuerza máxima',
      optimal_timing: 'morning'
    };
  }

  private static generateHypertrophyWorkout(context: RecommendationContext): WorkoutRecommendation {
    return {
      workout_type: 'hypertrophy',
      recommended_exercises: [],
      estimated_duration: 75,
      difficulty_level: 3,
      focus_areas: ['Volumen', 'Hipertrofia'],
      reasoning: 'Entrenamiento enfocado en crecimiento muscular',
      optimal_timing: 'afternoon'
    };
  }

  private static generateEnduranceWorkout(context: RecommendationContext): WorkoutRecommendation {
    return {
      workout_type: 'endurance',
      recommended_exercises: [],
      estimated_duration: 45,
      difficulty_level: 2,
      focus_areas: ['Resistencia', 'Capacidad cardiovascular'],
      reasoning: 'Entrenamiento enfocado en resistencia muscular',
      optimal_timing: 'flexible'
    };
  }

  private static generateGeneralFitnessWorkout(context: RecommendationContext): WorkoutRecommendation {
    return {
      workout_type: 'strength',
      recommended_exercises: [],
      estimated_duration: 50,
      difficulty_level: 2,
      focus_areas: ['Fitness general', 'Salud'],
      reasoning: 'Entrenamiento balanceado para fitness general',
      optimal_timing: 'flexible'
    };
  }

  private static generateRecoveryWorkout(context: RecommendationContext): WorkoutRecommendation {
    return {
      workout_type: 'recovery',
      recommended_exercises: [],
      estimated_duration: 30,
      difficulty_level: 1,
      focus_areas: ['Recuperación', 'Movilidad'],
      reasoning: 'Sesión de recuperación activa debido a alta fatiga',
      optimal_timing: 'evening'
    };
  }

  private static generateProgressionForExercise(exerciseId: string, history: ExerciseHistory[], context: RecommendationContext): ProgressionRecommendation | null {
    const latestExercise = history[history.length - 1];
    
    return {
      exercise_id: exerciseId,
      exercise_name: latestExercise.exercise_name,
      current_level: context.user_demographics.experience_level,
      next_milestone: {
        target_weight: latestExercise.max_weight * 1.1,
        estimated_weeks: 4
      },
      progression_strategy: {
        type: 'linear',
        description: 'Incremento lineal semanal',
        weekly_increases: {
          weight: 2.5
        }
      },
      deload_recommendations: {
        frequency_weeks: 4,
        intensity_reduction: 10,
        volume_reduction: 20
      }
    };
  }
}