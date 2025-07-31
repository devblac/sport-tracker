/**
 * Weakness Analysis Service
 * Analyzes user performance to identify weaknesses and recommend corrective exercises
 */

import {
  WeaknessAnalysis,
  ExerciseRecommendation,
  RecommendationContext,
  WorkoutHistory,
  ExerciseHistory,
  MUSCLE_GROUPS,
  EXERCISE_CATEGORIES
} from '../types/recommendations';

interface MuscleGroupAnalysis {
  muscle_group: string;
  total_volume: number;
  frequency: number;
  exercise_variety: number;
  performance_percentile: number;
  imbalance_ratio: number;
  weakness_indicators: string[];
}

interface MovementPatternAnalysis {
  pattern: string;
  exercises: string[];
  total_volume: number;
  frequency: number;
  strength_level: 'weak' | 'average' | 'strong';
  limiting_factors: string[];
}

export class WeaknessAnalysisService {
  
  private static readonly ANALYSIS_CONFIG = {
    MINIMUM_WORKOUTS: 6,
    WEAKNESS_THRESHOLD: 0.6, // 0-1 scale
    IMBALANCE_THRESHOLD: 0.3, // 30% difference
    LOW_FREQUENCY_THRESHOLD: 0.5, // times per week
    LOW_VARIETY_THRESHOLD: 2, // number of exercises
    PERCENTILE_WEAKNESS_THRESHOLD: 25 // below 25th percentile
  };

  // Exercise database with muscle group mappings
  private static readonly EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
    'bench_press': [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
    'incline_bench': [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
    'dumbbell_press': [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
    'push_ups': [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.CORE],
    
    'squat': [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES, MUSCLE_GROUPS.CORE],
    'front_squat': [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.CORE],
    'leg_press': [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
    'lunges': [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
    
    'deadlift': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES],
    'romanian_deadlift': [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES],
    'sumo_deadlift': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES],
    
    'pull_ups': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    'chin_ups': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    'lat_pulldown': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    'rows': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    'barbell_rows': [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    
    'overhead_press': [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.CORE],
    'shoulder_press': [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS],
    'lateral_raises': [MUSCLE_GROUPS.SHOULDERS],
    
    'bicep_curls': [MUSCLE_GROUPS.BICEPS],
    'hammer_curls': [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.FOREARMS],
    'tricep_dips': [MUSCLE_GROUPS.TRICEPS],
    'tricep_extensions': [MUSCLE_GROUPS.TRICEPS],
    
    'calf_raises': [MUSCLE_GROUPS.CALVES],
    'leg_curls': [MUSCLE_GROUPS.HAMSTRINGS],
    'leg_extensions': [MUSCLE_GROUPS.QUADRICEPS],
    
    'planks': [MUSCLE_GROUPS.CORE],
    'crunches': [MUSCLE_GROUPS.CORE],
    'russian_twists': [MUSCLE_GROUPS.CORE]
  };

  // Movement pattern mappings
  private static readonly MOVEMENT_PATTERNS = {
    'horizontal_push': ['bench_press', 'incline_bench', 'dumbbell_press', 'push_ups'],
    'vertical_push': ['overhead_press', 'shoulder_press', 'handstand_push_ups'],
    'horizontal_pull': ['rows', 'barbell_rows', 'cable_rows'],
    'vertical_pull': ['pull_ups', 'chin_ups', 'lat_pulldown'],
    'squat_pattern': ['squat', 'front_squat', 'goblet_squat', 'leg_press'],
    'hinge_pattern': ['deadlift', 'romanian_deadlift', 'good_mornings'],
    'unilateral_lower': ['lunges', 'step_ups', 'single_leg_squats'],
    'core_stability': ['planks', 'dead_bugs', 'bird_dogs'],
    'core_rotation': ['russian_twists', 'wood_chops', 'pallof_press']
  };

  /**
   * Performs comprehensive weakness analysis
   */
  static async analyzeWeaknesses(context: RecommendationContext): Promise<WeaknessAnalysis[]> {
    if (context.recent_workouts.length < this.ANALYSIS_CONFIG.MINIMUM_WORKOUTS) {
      return [];
    }

    const weaknesses: WeaknessAnalysis[] = [];

    // Analyze muscle group weaknesses
    const muscleGroupAnalyses = await this.analyzeMuscleGroups(context);
    const muscleGroupWeaknesses = this.identifyMuscleGroupWeaknesses(muscleGroupAnalyses);
    weaknesses.push(...muscleGroupWeaknesses);

    // Analyze movement pattern weaknesses
    const movementPatternAnalyses = await this.analyzeMovementPatterns(context);
    const movementPatternWeaknesses = this.identifyMovementPatternWeaknesses(movementPatternAnalyses);
    weaknesses.push(...movementPatternWeaknesses);

    // Analyze muscle imbalances
    const imbalanceWeaknesses = await this.analyzeImbalances(muscleGroupAnalyses);
    weaknesses.push(...imbalanceWeaknesses);

    return weaknesses
      .sort((a, b) => b.weakness_score - a.weakness_score)
      .slice(0, 10); // Return top 10 weaknesses
  }

  /**
   * Analyzes performance by muscle group
   */
  private static async analyzeMuscleGroups(context: RecommendationContext): Promise<MuscleGroupAnalysis[]> {
    const analyses: MuscleGroupAnalysis[] = [];

    // Initialize analysis for each muscle group
    const muscleGroupData = this.initializeMuscleGroupData();

    // Process workout data
    context.recent_workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const muscleGroups = this.EXERCISE_MUSCLE_MAP[exercise.exercise_id] || [MUSCLE_GROUPS.CORE];
        
        muscleGroups.forEach(muscleGroup => {
          if (muscleGroupData[muscleGroup]) {
            muscleGroupData[muscleGroup].total_volume += exercise.total_volume;
            muscleGroupData[muscleGroup].frequency += 1;
            muscleGroupData[muscleGroup].exercises.add(exercise.exercise_id);
            muscleGroupData[muscleGroup].performance_data.push(exercise.max_weight);
          }
        });
      });
    });

    // Calculate analysis metrics for each muscle group
    Object.entries(muscleGroupData).forEach(([muscleGroup, data]) => {
      const analysis: MuscleGroupAnalysis = {
        muscle_group: muscleGroup,
        total_volume: data.total_volume,
        frequency: data.frequency / context.recent_workouts.length, // Average per workout
        exercise_variety: data.exercises.size,
        performance_percentile: this.calculatePerformancePercentile(data.performance_data),
        imbalance_ratio: 0, // Will be calculated in imbalance analysis
        weakness_indicators: []
      };

      // Identify weakness indicators
      if (analysis.frequency < this.ANALYSIS_CONFIG.LOW_FREQUENCY_THRESHOLD) {
        analysis.weakness_indicators.push('Baja frecuencia de entrenamiento');
      }
      
      if (analysis.exercise_variety < this.ANALYSIS_CONFIG.LOW_VARIETY_THRESHOLD) {
        analysis.weakness_indicators.push('Variedad limitada de ejercicios');
      }
      
      if (analysis.performance_percentile < this.ANALYSIS_CONFIG.PERCENTILE_WEAKNESS_THRESHOLD) {
        analysis.weakness_indicators.push('Rendimiento por debajo del promedio');
      }
      
      if (analysis.total_volume === 0) {
        analysis.weakness_indicators.push('Grupo muscular no entrenado');
      }

      analyses.push(analysis);
    });

    return analyses;
  }

  /**
   * Initializes muscle group data structure
   */
  private static initializeMuscleGroupData(): Record<string, {
    total_volume: number;
    frequency: number;
    exercises: Set<string>;
    performance_data: number[];
  }> {
    const data: Record<string, any> = {};
    
    Object.values(MUSCLE_GROUPS).forEach(group => {
      data[group] = {
        total_volume: 0,
        frequency: 0,
        exercises: new Set<string>(),
        performance_data: []
      };
    });

    return data;
  }

  /**
   * Analyzes movement patterns
   */
  private static async analyzeMovementPatterns(context: RecommendationContext): Promise<MovementPatternAnalysis[]> {
    const analyses: MovementPatternAnalysis[] = [];

    Object.entries(this.MOVEMENT_PATTERNS).forEach(([pattern, exercises]) => {
      let totalVolume = 0;
      let frequency = 0;
      const performedExercises: string[] = [];

      context.recent_workouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          if (exercises.includes(exercise.exercise_id)) {
            totalVolume += exercise.total_volume;
            frequency += 1;
            if (!performedExercises.includes(exercise.exercise_id)) {
              performedExercises.push(exercise.exercise_id);
            }
          }
        });
      });

      const avgFrequency = frequency / context.recent_workouts.length;
      let strengthLevel: MovementPatternAnalysis['strength_level'] = 'average';
      const limitingFactors: string[] = [];

      // Determine strength level
      if (avgFrequency < 0.3) {
        strengthLevel = 'weak';
        limitingFactors.push('Baja frecuencia de entrenamiento del patrón');
      } else if (avgFrequency > 1.0) {
        strengthLevel = 'strong';
      }

      if (performedExercises.length < 2) {
        limitingFactors.push('Variedad limitada de ejercicios en el patrón');
      }

      if (totalVolume === 0) {
        strengthLevel = 'weak';
        limitingFactors.push('Patrón de movimiento no entrenado');
      }

      analyses.push({
        pattern,
        exercises: performedExercises,
        total_volume: totalVolume,
        frequency: avgFrequency,
        strength_level: strengthLevel,
        limiting_factors: limitingFactors
      });
    });

    return analyses;
  }

  /**
   * Identifies muscle group weaknesses
   */
  private static identifyMuscleGroupWeaknesses(analyses: MuscleGroupAnalysis[]): WeaknessAnalysis[] {
    const weaknesses: WeaknessAnalysis[] = [];

    // Calculate relative performance metrics
    const totalVolumes = analyses.map(a => a.total_volume);
    const avgVolume = totalVolumes.reduce((sum, vol) => sum + vol, 0) / totalVolumes.length;
    
    const frequencies = analyses.map(a => a.frequency);
    const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;

    analyses.forEach(analysis => {
      // Calculate weakness score
      let weaknessScore = 0;

      // Volume component (30%)
      const volumeRatio = avgVolume > 0 ? analysis.total_volume / avgVolume : 0;
      weaknessScore += (1 - Math.min(1, volumeRatio)) * 0.3;

      // Frequency component (25%)
      const frequencyRatio = avgFrequency > 0 ? analysis.frequency / avgFrequency : 0;
      weaknessScore += (1 - Math.min(1, frequencyRatio)) * 0.25;

      // Variety component (20%)
      const varietyScore = Math.min(1, analysis.exercise_variety / 3); // 3 exercises = good variety
      weaknessScore += (1 - varietyScore) * 0.2;

      // Performance percentile component (25%)
      const percentileScore = analysis.performance_percentile / 100;
      weaknessScore += (1 - percentileScore) * 0.25;

      // Only consider as weakness if above threshold
      if (weaknessScore >= this.ANALYSIS_CONFIG.WEAKNESS_THRESHOLD) {
        const weakness: WeaknessAnalysis = {
          muscle_group: analysis.muscle_group,
          weakness_score: weaknessScore,
          contributing_factors: analysis.weakness_indicators,
          affected_exercises: this.getExercisesForMuscleGroup(analysis.muscle_group),
          recommended_exercises: this.getRecommendedExercisesForMuscleGroup(analysis.muscle_group),
          priority: this.calculateWeaknessPriority(weaknessScore, analysis.muscle_group)
        };

        weaknesses.push(weakness);
      }
    });

    return weaknesses;
  }

  /**
   * Identifies movement pattern weaknesses
   */
  private static identifyMovementPatternWeaknesses(analyses: MovementPatternAnalysis[]): WeaknessAnalysis[] {
    const weaknesses: WeaknessAnalysis[] = [];

    analyses.forEach(analysis => {
      if (analysis.strength_level === 'weak' && analysis.limiting_factors.length > 0) {
        // Calculate weakness score based on frequency and volume
        let weaknessScore = 0.7; // Base score for weak patterns

        if (analysis.frequency === 0) {
          weaknessScore = 0.9; // Very high if pattern not trained at all
        } else if (analysis.frequency < 0.2) {
          weaknessScore = 0.8;
        }

        const weakness: WeaknessAnalysis = {
          muscle_group: `Patrón: ${analysis.pattern.replace('_', ' ')}`,
          weakness_score: weaknessScore,
          contributing_factors: analysis.limiting_factors,
          affected_exercises: analysis.exercises,
          recommended_exercises: this.getRecommendedExercisesForPattern(analysis.pattern),
          priority: this.calculateWeaknessPriority(weaknessScore, analysis.pattern)
        };

        weaknesses.push(weakness);
      }
    });

    return weaknesses;
  }

  /**
   * Analyzes muscle imbalances
   */
  private static async analyzeImbalances(analyses: MuscleGroupAnalysis[]): Promise<WeaknessAnalysis[]> {
    const imbalances: WeaknessAnalysis[] = [];

    // Define muscle group pairs to check for imbalances
    const imbalancePairs = [
      { primary: MUSCLE_GROUPS.CHEST, secondary: MUSCLE_GROUPS.BACK, name: 'Pecho vs Espalda' },
      { primary: MUSCLE_GROUPS.QUADRICEPS, secondary: MUSCLE_GROUPS.HAMSTRINGS, name: 'Cuádriceps vs Isquiotibiales' },
      { primary: MUSCLE_GROUPS.BICEPS, secondary: MUSCLE_GROUPS.TRICEPS, name: 'Bíceps vs Tríceps' }
    ];

    imbalancePairs.forEach(pair => {
      const primaryAnalysis = analyses.find(a => a.muscle_group === pair.primary);
      const secondaryAnalysis = analyses.find(a => a.muscle_group === pair.secondary);

      if (primaryAnalysis && secondaryAnalysis) {
        const primaryVolume = primaryAnalysis.total_volume;
        const secondaryVolume = secondaryAnalysis.total_volume;

        if (primaryVolume > 0 && secondaryVolume > 0) {
          const ratio = primaryVolume / secondaryVolume;
          const imbalanceThreshold = 1 + this.ANALYSIS_CONFIG.IMBALANCE_THRESHOLD;

          if (ratio > imbalanceThreshold || ratio < (1 / imbalanceThreshold)) {
            const weakerGroup = ratio > imbalanceThreshold ? pair.secondary : pair.primary;
            const strongerGroup = ratio > imbalanceThreshold ? pair.primary : pair.secondary;
            const imbalanceRatio = Math.max(ratio, 1 / ratio);

            const weakness: WeaknessAnalysis = {
              muscle_group: `Desequilibrio: ${pair.name}`,
              weakness_score: Math.min(0.9, 0.5 + (imbalanceRatio - 1) * 0.5),
              contributing_factors: [
                `${strongerGroup} sobreentrenado relativo a ${weakerGroup}`,
                `Ratio de volumen: ${imbalanceRatio.toFixed(2)}:1`
              ],
              affected_exercises: this.getExercisesForMuscleGroup(weakerGroup),
              recommended_exercises: this.getRecommendedExercisesForMuscleGroup(weakerGroup),
              priority: 'high'
            };

            imbalances.push(weakness);
          }
        }
      }
    });

    return imbalances;
  }

  /**
   * Calculates performance percentile (simplified)
   */
  private static calculatePerformancePercentile(performanceData: number[]): number {
    if (performanceData.length === 0) return 0;

    // Simplified percentile calculation
    // In a real implementation, this would compare against population data
    const avgPerformance = performanceData.reduce((sum, val) => sum + val, 0) / performanceData.length;
    const maxPerformance = Math.max(...performanceData);
    
    // Mock percentile based on performance trend
    const trend = performanceData.length > 1 ? 
      (performanceData[performanceData.length - 1] - performanceData[0]) / performanceData[0] : 0;
    
    let percentile = 50; // Base percentile
    
    if (trend > 0.1) percentile += 20; // Improving
    if (trend < -0.1) percentile -= 20; // Declining
    if (maxPerformance > avgPerformance * 1.2) percentile += 10; // Good peak performance
    
    return Math.max(0, Math.min(100, percentile));
  }

  /**
   * Gets exercises for a muscle group
   */
  private static getExercisesForMuscleGroup(muscleGroup: string): string[] {
    const exercises: string[] = [];
    
    Object.entries(this.EXERCISE_MUSCLE_MAP).forEach(([exercise, groups]) => {
      if (groups.includes(muscleGroup)) {
        exercises.push(exercise);
      }
    });

    return exercises;
  }

  /**
   * Gets recommended exercises for a muscle group
   */
  private static getRecommendedExercisesForMuscleGroup(muscleGroup: string): ExerciseRecommendation[] {
    const exerciseRecommendations: Record<string, ExerciseRecommendation[]> = {
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
          reasoning: 'Ejercicio fundamental para desarrollar fuerza en pecho sin equipo',
          instructions: [
            'Mantén el cuerpo recto desde cabeza hasta talones',
            'Baja hasta que el pecho casi toque el suelo',
            'Empuja hacia arriba de forma controlada'
          ]
        },
        {
          exercise_id: 'dumbbell_press',
          exercise_name: 'Press con Mancuernas',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
          difficulty_level: 3,
          equipment_needed: ['dumbbells', 'bench'],
          recommended_sets: 3,
          recommended_reps: '8-12',
          frequency_per_week: 2,
          reasoning: 'Permite mayor rango de movimiento y trabajo unilateral',
          instructions: [
            'Acuéstate en banco con mancuernas a los lados del pecho',
            'Empuja las mancuernas hacia arriba hasta extensión completa',
            'Baja de forma controlada hasta sentir estiramiento en pecho'
          ]
        }
      ],
      
      [MUSCLE_GROUPS.BACK]: [
        {
          exercise_id: 'pull_ups',
          exercise_name: 'Dominadas',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
          difficulty_level: 4,
          equipment_needed: ['pull_up_bar'],
          recommended_sets: 3,
          recommended_reps: '5-10',
          frequency_per_week: 2,
          reasoning: 'Ejercicio compuesto excelente para desarrollar fuerza en espalda',
          instructions: [
            'Agarre pronado, manos separadas al ancho de hombros',
            'Tira hacia arriba hasta que la barbilla pase la barra',
            'Baja de forma controlada hasta extensión completa'
          ]
        },
        {
          exercise_id: 'inverted_rows',
          exercise_name: 'Remo Invertido',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
          difficulty_level: 2,
          equipment_needed: ['bar', 'rack'],
          recommended_sets: 3,
          recommended_reps: '8-15',
          frequency_per_week: 2,
          reasoning: 'Alternativa más accesible a las dominadas para principiantes',
          instructions: [
            'Acuéstate bajo una barra a altura media',
            'Agarra la barra con las manos al ancho de hombros',
            'Tira del cuerpo hacia la barra manteniendo el cuerpo recto'
          ]
        }
      ],

      [MUSCLE_GROUPS.SHOULDERS]: [
        {
          exercise_id: 'pike_push_ups',
          exercise_name: 'Flexiones Pike',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS],
          difficulty_level: 3,
          equipment_needed: [],
          recommended_sets: 3,
          recommended_reps: '5-12',
          frequency_per_week: 2,
          reasoning: 'Ejercicio de peso corporal para desarrollar fuerza en hombros',
          instructions: [
            'Posición de flexión con caderas elevadas formando V invertida',
            'Baja la cabeza hacia el suelo flexionando los brazos',
            'Empuja hacia arriba hasta extensión completa'
          ]
        }
      ],

      [MUSCLE_GROUPS.QUADRICEPS]: [
        {
          exercise_id: 'bodyweight_squats',
          exercise_name: 'Sentadillas con Peso Corporal',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.QUADRICEPS, MUSCLE_GROUPS.GLUTES],
          difficulty_level: 1,
          equipment_needed: [],
          recommended_sets: 3,
          recommended_reps: '15-25',
          frequency_per_week: 3,
          reasoning: 'Ejercicio fundamental para desarrollar fuerza en piernas',
          instructions: [
            'Pies separados al ancho de hombros',
            'Baja como si te fueras a sentar en una silla',
            'Mantén el pecho erguido y las rodillas alineadas con los pies'
          ]
        }
      ],

      [MUSCLE_GROUPS.HAMSTRINGS]: [
        {
          exercise_id: 'single_leg_rdl',
          exercise_name: 'Peso Muerto Rumano a Una Pierna',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.GLUTES],
          difficulty_level: 3,
          equipment_needed: [],
          recommended_sets: 3,
          recommended_reps: '8-12 por pierna',
          frequency_per_week: 2,
          reasoning: 'Excelente para desarrollar fuerza en isquiotibiales y equilibrio',
          instructions: [
            'Párate en una pierna con ligera flexión de rodilla',
            'Inclínate hacia adelante extendiendo la pierna libre hacia atrás',
            'Mantén la espalda recta y regresa a la posición inicial'
          ]
        }
      ],

      [MUSCLE_GROUPS.CORE]: [
        {
          exercise_id: 'planks',
          exercise_name: 'Plancha',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.CORE],
          difficulty_level: 2,
          equipment_needed: [],
          recommended_sets: 3,
          recommended_reps: '30-60 segundos',
          frequency_per_week: 3,
          reasoning: 'Ejercicio isométrico fundamental para estabilidad del core',
          instructions: [
            'Posición de flexión apoyado en antebrazos',
            'Mantén el cuerpo recto desde cabeza hasta talones',
            'Contrae el abdomen y mantén la posición'
          ]
        }
      ]
    };

    return exerciseRecommendations[muscleGroup] || [];
  }

  /**
   * Gets recommended exercises for movement pattern
   */
  private static getRecommendedExercisesForPattern(pattern: string): ExerciseRecommendation[] {
    const patternRecommendations: Record<string, ExerciseRecommendation[]> = {
      'horizontal_push': [
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
          reasoning: 'Patrón de empuje horizontal fundamental',
          instructions: ['Mantén cuerpo recto', 'Baja controladamente', 'Empuja hacia arriba']
        }
      ],
      'vertical_pull': [
        {
          exercise_id: 'pull_ups',
          exercise_name: 'Dominadas',
          exercise_type: 'strength',
          target_muscle_groups: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
          difficulty_level: 4,
          equipment_needed: ['pull_up_bar'],
          recommended_sets: 3,
          recommended_reps: '5-10',
          frequency_per_week: 2,
          reasoning: 'Patrón de tracción vertical esencial',
          instructions: ['Agarre pronado', 'Tira hasta pasar barbilla', 'Baja controladamente']
        }
      ]
    };

    return patternRecommendations[pattern] || [];
  }

  /**
   * Calculates weakness priority
   */
  private static calculateWeaknessPriority(
    weaknessScore: number, 
    muscleGroupOrPattern: string
  ): WeaknessAnalysis['priority'] {
    
    // Critical muscle groups that affect overall performance
    const criticalGroups = [MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.GLUTES];
    const isCritical = criticalGroups.includes(muscleGroupOrPattern as any);

    if (weaknessScore > 0.8 || isCritical) return 'critical';
    if (weaknessScore > 0.7) return 'high';
    if (weaknessScore > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generates corrective exercise program for identified weaknesses
   */
  static generateCorrectiveProgram(weaknesses: WeaknessAnalysis[]): {
    program_name: string;
    duration_weeks: number;
    exercises_per_session: ExerciseRecommendation[];
    frequency_per_week: number;
    progression_notes: string[];
    expected_outcomes: string[];
  } {
    
    // Prioritize critical and high priority weaknesses
    const priorityWeaknesses = weaknesses
      .filter(w => w.priority === 'critical' || w.priority === 'high')
      .slice(0, 3); // Focus on top 3 weaknesses

    const allRecommendedExercises = priorityWeaknesses
      .flatMap(w => w.recommended_exercises)
      .slice(0, 6); // Limit to 6 exercises per session

    return {
      program_name: 'Programa Correctivo de Debilidades',
      duration_weeks: 6,
      exercises_per_session: allRecommendedExercises,
      frequency_per_week: 2,
      progression_notes: [
        'Semanas 1-2: Enfócate en técnica perfecta con peso ligero',
        'Semanas 3-4: Incrementa gradualmente la intensidad',
        'Semanas 5-6: Evalúa progreso y ajusta según necesidad'
      ],
      expected_outcomes: [
        'Mejora en equilibrio muscular',
        'Reducción de riesgo de lesiones',
        'Mejor rendimiento en ejercicios principales',
        'Mayor estabilidad y control motor'
      ]
    };
  }
}