/**
 * Plateau Detection Service
 * Specialized service for detecting training plateaus and suggesting interventions
 */

import {
  PlateauDetection,
  PlateauIntervention,
  WorkoutHistory,
  ExerciseHistory,
  RecommendationContext
} from '../types/recommendations';

interface PlateauAnalysisResult {
  plateau_detected: boolean;
  plateau_strength: number; // 0-1 scale
  plateau_duration_days: number;
  stagnation_metrics: {
    weight: boolean;
    volume: boolean;
    reps: boolean;
  };
  trend_analysis: {
    slope: number;
    r_squared: number;
    p_value: number;
  };
  confidence_score: number;
}

export class PlateauDetectionService {
  
  private static readonly PLATEAU_THRESHOLDS = {
    MINIMUM_DATA_POINTS: 8,
    STAGNATION_WEEKS: 3,
    IMPROVEMENT_THRESHOLD: 2.5, // percentage
    CONFIDENCE_THRESHOLD: 0.75,
    TREND_SLOPE_THRESHOLD: 0.1,
    R_SQUARED_THRESHOLD: 0.3
  };

  /**
   * Comprehensive plateau detection for all exercises
   */
  static async detectAllPlateaus(context: RecommendationContext): Promise<PlateauDetection[]> {
    const plateaus: PlateauDetection[] = [];
    
    // Group exercises by ID with chronological data
    const exerciseTimeSeries = this.buildExerciseTimeSeries(context);
    
    for (const [exerciseId, timeSeries] of exerciseTimeSeries) {
      if (timeSeries.length < this.PLATEAU_THRESHOLDS.MINIMUM_DATA_POINTS) {
        continue;
      }

      const plateauAnalysis = await this.analyzeExercisePlateau(exerciseId, timeSeries, context);
      
      if (plateauAnalysis.plateau_detected && 
          plateauAnalysis.confidence_score >= this.PLATEAU_THRESHOLDS.CONFIDENCE_THRESHOLD) {
        
        const plateau = await this.createPlateauDetection(exerciseId, timeSeries, plateauAnalysis, context);
        plateaus.push(plateau);
      }
    }

    return plateaus.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Builds time series data for exercises
   */
  private static buildExerciseTimeSeries(context: RecommendationContext): Map<string, Array<{
    date: Date;
    exercise: ExerciseHistory;
    workout: WorkoutHistory;
  }>> {
    
    const timeSeries = new Map<string, Array<{
      date: Date;
      exercise: ExerciseHistory;
      workout: WorkoutHistory;
    }>>();

    // Sort workouts chronologically
    const sortedWorkouts = context.recent_workouts.sort((a, b) => a.date.getTime() - b.date.getTime());

    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (!timeSeries.has(exercise.exercise_id)) {
          timeSeries.set(exercise.exercise_id, []);
        }
        
        timeSeries.get(exercise.exercise_id)!.push({
          date: workout.date,
          exercise,
          workout
        });
      });
    });

    return timeSeries;
  }

  /**
   * Analyzes plateau for a specific exercise
   */
  private static async analyzeExercisePlateau(
    exerciseId: string,
    timeSeries: Array<{ date: Date; exercise: ExerciseHistory; workout: WorkoutHistory }>,
    context: RecommendationContext
  ): Promise<PlateauAnalysisResult> {
    
    // Extract metrics over time
    const dates = timeSeries.map(ts => ts.date);
    const maxWeights = timeSeries.map(ts => ts.exercise.max_weight);
    const totalVolumes = timeSeries.map(ts => ts.exercise.total_volume);
    const maxReps = timeSeries.map(ts => ts.exercise.sets.reduce((max, set) => Math.max(max, set.reps), 0));

    // Analyze trends for each metric
    const weightTrend = this.calculateTrendAnalysis(dates, maxWeights);
    const volumeTrend = this.calculateTrendAnalysis(dates, totalVolumes);
    const repsTrend = this.calculateTrendAnalysis(dates, maxReps);

    // Detect stagnation in each metric
    const weightStagnation = this.detectMetricStagnation(maxWeights);
    const volumeStagnation = this.detectMetricStagnation(totalVolumes);
    const repsStagnation = this.detectMetricStagnation(maxReps);

    // Calculate overall plateau strength
    const plateauStrength = this.calculatePlateauStrength([
      { stagnant: weightStagnation, trend: weightTrend, weight: 0.5 },
      { stagnant: volumeStagnation, trend: volumeTrend, weight: 0.3 },
      { stagnant: repsStagnation, trend: repsTrend, weight: 0.2 }
    ]);

    // Determine if plateau is detected
    const plateauDetected = plateauStrength > 0.6 && (
      (weightStagnation && Math.abs(weightTrend.slope) < this.PLATEAU_THRESHOLDS.TREND_SLOPE_THRESHOLD) ||
      (volumeStagnation && Math.abs(volumeTrend.slope) < this.PLATEAU_THRESHOLDS.TREND_SLOPE_THRESHOLD)
    );

    // Calculate plateau duration
    const plateauDuration = this.calculatePlateauDuration(timeSeries, maxWeights);

    // Calculate confidence score
    const confidenceScore = this.calculatePlateauConfidence(
      plateauStrength,
      weightTrend,
      volumeTrend,
      timeSeries.length
    );

    return {
      plateau_detected: plateauDetected,
      plateau_strength: plateauStrength,
      plateau_duration_days: plateauDuration,
      stagnation_metrics: {
        weight: weightStagnation,
        volume: volumeStagnation,
        reps: repsStagnation
      },
      trend_analysis: weightTrend, // Primary trend analysis
      confidence_score: confidenceScore
    };
  }

  /**
   * Calculates trend analysis using linear regression
   */
  private static calculateTrendAnalysis(dates: Date[], values: number[]): {
    slope: number;
    r_squared: number;
    p_value: number;
  } {
    
    if (dates.length !== values.length || dates.length < 3) {
      return { slope: 0, r_squared: 0, p_value: 1 };
    }

    // Convert dates to numeric values (days since first date)
    const firstDate = dates[0].getTime();
    const x = dates.map(date => (date.getTime() - firstDate) / (1000 * 60 * 60 * 24));
    const y = values;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = ssTotal > 0 ? 1 - (ssResidual / ssTotal) : 0;

    // Simplified p-value calculation (would use proper statistical test in production)
    const standardError = Math.sqrt(ssResidual / (n - 2)) / Math.sqrt(sumX2 - (sumX * sumX) / n);
    const tStatistic = Math.abs(slope / standardError);
    const pValue = tStatistic > 2 ? 0.05 : 0.1; // Simplified

    return {
      slope: slope,
      r_squared: Math.max(0, Math.min(1, rSquared)),
      p_value: pValue
    };
  }

  /**
   * Detects stagnation in a metric
   */
  private static detectMetricStagnation(values: number[]): boolean {
    if (values.length < this.PLATEAU_THRESHOLDS.MINIMUM_DATA_POINTS) {
      return false;
    }

    // Look at recent values vs historical best
    const recentCount = Math.min(6, Math.floor(values.length / 3));
    const recentValues = values.slice(-recentCount);
    const historicalValues = values.slice(0, -recentCount);
    
    if (historicalValues.length === 0) return false;

    const recentBest = Math.max(...recentValues);
    const historicalBest = Math.max(...historicalValues);
    
    const improvementPercentage = ((recentBest - historicalBest) / historicalBest) * 100;
    
    return improvementPercentage < this.PLATEAU_THRESHOLDS.IMPROVEMENT_THRESHOLD;
  }

  /**
   * Calculates overall plateau strength
   */
  private static calculatePlateauStrength(metrics: Array<{
    stagnant: boolean;
    trend: { slope: number; r_squared: number };
    weight: number;
  }>): number {
    
    let totalWeight = 0;
    let weightedScore = 0;

    metrics.forEach(metric => {
      totalWeight += metric.weight;
      
      let metricScore = 0;
      if (metric.stagnant) {
        metricScore += 0.6;
      }
      
      // Add score based on trend flatness
      const trendFlatness = 1 - Math.min(1, Math.abs(metric.trend.slope) * 10);
      metricScore += trendFlatness * 0.4;
      
      weightedScore += metricScore * metric.weight;
    });

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  /**
   * Calculates plateau duration in days
   */
  private static calculatePlateauDuration(
    timeSeries: Array<{ date: Date; exercise: ExerciseHistory }>,
    values: number[]
  ): number {
    
    if (timeSeries.length < 2) return 0;

    // Find the last significant improvement
    const improvementThreshold = this.PLATEAU_THRESHOLDS.IMPROVEMENT_THRESHOLD / 100;
    let lastImprovementIndex = -1;

    for (let i = values.length - 1; i > 0; i--) {
      const improvement = (values[i] - values[i - 1]) / values[i - 1];
      if (improvement > improvementThreshold) {
        lastImprovementIndex = i;
        break;
      }
    }

    if (lastImprovementIndex === -1) {
      // No improvement found, use full duration
      const firstDate = timeSeries[0].date;
      const lastDate = timeSeries[timeSeries.length - 1].date;
      return (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    // Calculate days since last improvement
    const lastImprovementDate = timeSeries[lastImprovementIndex].date;
    const currentDate = timeSeries[timeSeries.length - 1].date;
    
    return (currentDate.getTime() - lastImprovementDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  /**
   * Calculates confidence score for plateau detection
   */
  private static calculatePlateauConfidence(
    plateauStrength: number,
    weightTrend: { slope: number; r_squared: number; p_value: number },
    volumeTrend: { slope: number; r_squared: number; p_value: number },
    dataPoints: number
  ): number {
    
    let confidence = 0;

    // Base confidence from plateau strength
    confidence += plateauStrength * 0.4;

    // Confidence from trend analysis
    const trendConfidence = (weightTrend.r_squared + volumeTrend.r_squared) / 2;
    confidence += trendConfidence * 0.3;

    // Confidence from statistical significance
    const statConfidence = 1 - Math.min(weightTrend.p_value, volumeTrend.p_value);
    confidence += statConfidence * 0.2;

    // Confidence from data quantity
    const dataConfidence = Math.min(1, dataPoints / 20); // More data = higher confidence
    confidence += dataConfidence * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Creates plateau detection object
   */
  private static async createPlateauDetection(
    exerciseId: string,
    timeSeries: Array<{ date: Date; exercise: ExerciseHistory; workout: WorkoutHistory }>,
    analysis: PlateauAnalysisResult,
    context: RecommendationContext
  ): Promise<PlateauDetection> {
    
    const latestExercise = timeSeries[timeSeries.length - 1].exercise;
    const values = timeSeries.map(ts => ts.exercise.max_weight);
    
    // Determine plateau type
    let plateauType: PlateauDetection['plateau_type'] = 'strength';
    if (analysis.stagnation_metrics.volume && !analysis.stagnation_metrics.weight) {
      plateauType = 'volume';
    } else if (analysis.stagnation_metrics.reps && !analysis.stagnation_metrics.weight && !analysis.stagnation_metrics.volume) {
      plateauType = 'endurance';
    }

    // Determine stagnant metric
    let stagnantMetric: PlateauDetection['stagnant_metric'] = 'max_weight';
    if (plateauType === 'volume') stagnantMetric = 'total_volume';
    if (plateauType === 'endurance') stagnantMetric = 'max_reps';

    // Generate interventions
    const interventions = await this.generatePlateauInterventions(
      exerciseId,
      plateauType,
      analysis,
      context
    );

    return {
      exercise_id: exerciseId,
      exercise_name: latestExercise.exercise_name,
      plateau_detected: true,
      plateau_duration_weeks: Math.ceil(analysis.plateau_duration_days / 7),
      plateau_type: plateauType,
      last_improvement_date: this.findLastImprovementDate(timeSeries, values),
      stagnant_metric: stagnantMetric,
      current_value: values[values.length - 1],
      previous_best: Math.max(...values.slice(0, -3)),
      confidence: analysis.confidence_score,
      suggested_interventions: interventions
    };
  }

  /**
   * Finds the date of last significant improvement
   */
  private static findLastImprovementDate(
    timeSeries: Array<{ date: Date; exercise: ExerciseHistory }>,
    values: number[]
  ): Date | undefined {
    
    const improvementThreshold = this.PLATEAU_THRESHOLDS.IMPROVEMENT_THRESHOLD / 100;
    
    for (let i = values.length - 1; i > 0; i--) {
      const improvement = (values[i] - values[i - 1]) / values[i - 1];
      if (improvement > improvementThreshold) {
        return timeSeries[i].date;
      }
    }
    
    return undefined;
  }

  /**
   * Generates specific interventions for plateau breaking
   */
  private static async generatePlateauInterventions(
    exerciseId: string,
    plateauType: PlateauDetection['plateau_type'],
    analysis: PlateauAnalysisResult,
    context: RecommendationContext
  ): Promise<PlateauIntervention[]> {
    
    const interventions: PlateauIntervention[] = [];

    // Deload intervention (always recommended for plateaus)
    interventions.push({
      type: 'deload',
      description: 'Reducir intensidad para permitir recuperación y supercompensación',
      duration_weeks: 1,
      expected_outcome: 'Recuperación del sistema nervioso y preparación para nuevo progreso',
      priority: 'high',
      implementation_details: [
        'Reducir peso en 10-15%',
        'Mantener volumen de entrenamiento',
        'Enfocarse en técnica perfecta',
        'Aumentar gradualmente después del deload'
      ]
    });

    // Technique focus intervention
    interventions.push({
      type: 'technique_focus',
      description: 'Perfeccionar la técnica del ejercicio para mejorar eficiencia',
      duration_weeks: 2,
      expected_outcome: 'Mejor activación muscular y eficiencia del movimiento',
      priority: 'medium',
      implementation_details: [
        'Reducir peso si es necesario para técnica perfecta',
        'Practicar movimiento con tempo controlado',
        'Grabar entrenamientos para análisis',
        'Considerar trabajo con entrenador'
      ]
    });

    // Type-specific interventions
    if (plateauType === 'strength') {
      interventions.push({
        type: 'frequency_change',
        description: 'Aumentar frecuencia de entrenamiento del ejercicio',
        duration_weeks: 4,
        expected_outcome: 'Mayor práctica del patrón de movimiento y adaptación neural',
        priority: 'medium',
        implementation_details: [
          'Entrenar el ejercicio 2-3 veces por semana',
          'Usar diferentes rangos de repeticiones',
          'Incluir trabajo de accesorios específicos',
          'Monitorear recuperación cuidadosamente'
        ]
      });

      interventions.push({
        type: 'exercise_variation',
        description: 'Incorporar variaciones del ejercicio principal',
        duration_weeks: 3,
        expected_outcome: 'Estimular adaptaciones desde diferentes ángulos',
        priority: 'low',
        implementation_details: [
          'Alternar con variaciones similares',
          'Mantener patrón de movimiento base',
          'Regresar al ejercicio principal gradualmente',
          'Evaluar transferencia de fuerza'
        ]
      });
    }

    if (plateauType === 'volume') {
      interventions.push({
        type: 'volume_increase',
        description: 'Incrementar volumen de entrenamiento gradualmente',
        duration_weeks: 3,
        expected_outcome: 'Mayor estímulo para adaptaciones de resistencia muscular',
        priority: 'medium',
        implementation_details: [
          'Añadir 1-2 series adicionales',
          'Incrementar frecuencia semanal',
          'Monitorear capacidad de recuperación',
          'Ajustar otros ejercicios si es necesario'
        ]
      });
    }

    // Recovery intervention for high fatigue
    if (context.recovery_status.overall_fatigue > 7) {
      interventions.push({
        type: 'rest_increase',
        description: 'Aumentar tiempo de descanso y enfoque en recuperación',
        duration_weeks: 2,
        expected_outcome: 'Mejor recuperación y preparación para entrenamientos intensos',
        priority: 'high',
        implementation_details: [
          'Aumentar descanso entre series',
          'Mejorar calidad del sueño',
          'Incluir técnicas de recuperación activa',
          'Evaluar estrés general y nutrición'
        ]
      });
    }

    return interventions.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Validates plateau detection results
   */
  static validatePlateauDetection(plateau: PlateauDetection): {
    valid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let valid = true;

    // Check confidence threshold
    if (plateau.confidence < this.PLATEAU_THRESHOLDS.CONFIDENCE_THRESHOLD) {
      warnings.push('Confianza en detección de plateau es baja');
      recommendations.push('Recopilar más datos antes de implementar intervenciones');
    }

    // Check plateau duration
    if (plateau.plateau_duration_weeks < this.PLATEAU_THRESHOLDS.STAGNATION_WEEKS) {
      warnings.push('Duración del plateau puede ser insuficiente para confirmar estancamiento');
      recommendations.push('Esperar al menos 3 semanas de estancamiento antes de intervenir');
      valid = false;
    }

    // Check intervention priorities
    const highPriorityInterventions = plateau.suggested_interventions.filter(i => i.priority === 'high');
    if (highPriorityInterventions.length === 0) {
      warnings.push('No hay intervenciones de alta prioridad sugeridas');
      recommendations.push('Considerar deload o enfoque en técnica');
    }

    return {
      valid,
      warnings,
      recommendations
    };
  }
}