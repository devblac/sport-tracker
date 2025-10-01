/**
 * Recovery Recommendation Service
 * Specialized service for analyzing recovery needs and providing rest/recovery recommendations
 */

import type {
  RecoveryRecommendation,
  RecoveryStatus,
  RecommendationContext,
  WorkoutHistory
} from '@/types/recommendations';

interface RecoveryAnalysis {
  recovery_score: number; // 0-100 scale (100 = fully recovered)
  fatigue_level: 'low' | 'moderate' | 'high' | 'critical';
  recommended_rest_days: number;
  recovery_factors: {
    training_load: number; // 0-10
    sleep_debt: number; // 0-10
    stress_impact: number; // 0-10
    muscle_fatigue: number; // 0-10
  };
  intervention_urgency: 'low' | 'medium' | 'high' | 'critical';
}

export class RecoveryRecommendationService {
  
  private static readonly RECOVERY_THRESHOLDS = {
    CRITICAL_FATIGUE: 8.5,
    HIGH_FATIGUE: 7.0,
    MODERATE_FATIGUE: 5.0,
    MAX_CONSECUTIVE_DAYS: 6,
    OPTIMAL_SLEEP_HOURS: 7.5,
    HIGH_STRESS_THRESHOLD: 7.0,
    RECOVERY_SCORE_CRITICAL: 30,
    RECOVERY_SCORE_LOW: 60
  };

  /**
   * Analyze recovery status and generate recommendations
   */
  static async analyzeRecoveryNeeds(context: RecommendationContext): Promise<RecoveryRecommendation[]> {
    const analysis = await this.performRecoveryAnalysis(context);
    return this.generateRecoveryRecommendations(analysis, context);
  }

  /**
   * Perform comprehensive recovery analysis
   */
  private static async performRecoveryAnalysis(context: RecommendationContext): Promise<RecoveryAnalysis> {
    const recovery = context.recovery_status;
    
    // Calculate training load factor
    const trainingLoad = this.calculateTrainingLoadFactor(context.recent_workouts);
    
    // Calculate sleep debt factor
    const sleepDebt = Math.max(0, 10 - recovery.sleep_quality);
    
    // Calculate stress impact
    const stressImpact = recovery.stress_level;
    
    // Calculate muscle fatigue
    const muscleFatigue = (recovery.muscle_soreness + recovery.overall_fatigue) / 2;
    
    // Calculate overall recovery score
    const recoveryScore = this.calculateRecoveryScore({
      training_load: trainingLoad,
      sleep_debt: sleepDebt,
      stress_impact: stressImpact,
      muscle_fatigue: muscleFatigue
    });

    // Determine fatigue level
    let fatigueLevel: RecoveryAnalysis['fatigue_level'] = 'low';
    if (recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.CRITICAL_FATIGUE) {
      fatigueLevel = 'critical';
    } else if (recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.HIGH_FATIGUE) {
      fatigueLevel = 'high';
    } else if (recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.MODERATE_FATIGUE) {
      fatigueLevel = 'moderate';
    }

    // Calculate recommended rest days
    const recommendedRestDays = this.calculateRecommendedRestDays(recovery, recoveryScore);

    // Determine intervention urgency
    const interventionUrgency = this.determineInterventionUrgency(recoveryScore, recovery);

    return {
      recovery_score: recoveryScore,
      fatigue_level: fatigueLevel,
      recommended_rest_days: recommendedRestDays,
      recovery_factors: {
        training_load: trainingLoad,
        sleep_debt: sleepDebt,
        stress_impact: stressImpact,
        muscle_fatigue: muscleFatigue
      },
      intervention_urgency: interventionUrgency
    };
  }

  /**
   * Calculate training load factor based on recent workouts
   */
  private static calculateTrainingLoadFactor(workouts: WorkoutHistory[]): number {
    if (workouts.length === 0) return 0;

    const recentWorkouts = workouts.slice(0, 7); // Last 7 workouts
    const totalVolume = recentWorkouts.reduce((sum, workout) => sum + workout.total_volume, 0);
    const totalDuration = recentWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    const avgIntensity = recentWorkouts.reduce((sum, workout) => {
      const intensity = workout.difficulty_rating || 5;
      return sum + intensity;
    }, 0) / recentWorkouts.length;

    // Normalize factors
    const volumeFactor = Math.min(10, totalVolume / 10000); // Assuming 10k as high volume
    const durationFactor = Math.min(10, totalDuration / 600); // 600 minutes = 10 hours
    const intensityFactor = (avgIntensity / 5) * 5; // Scale to 0-10

    // Weighted average
    return (volumeFactor * 0.4 + durationFactor * 0.3 + intensityFactor * 0.3);
  }

  /**
   * Calculate overall recovery score
   */
  private static calculateRecoveryScore(factors: RecoveryAnalysis['recovery_factors']): number {
    // Start with base score of 100 (fully recovered)
    let score = 100;

    // Subtract based on negative factors
    score -= factors.training_load * 8; // Training load has high impact
    score -= factors.sleep_debt * 6; // Sleep debt is very important
    score -= factors.stress_impact * 4; // Stress has moderate impact
    score -= factors.muscle_fatigue * 5; // Muscle fatigue is important

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate recommended rest days
   */
  private static calculateRecommendedRestDays(
    recovery: RecoveryStatus,
    recoveryScore: number
  ): number {
    let restDays = 0;

    // Base rest days on recovery score
    if (recoveryScore <= this.RECOVERY_THRESHOLDS.RECOVERY_SCORE_CRITICAL) {
      restDays = 3; // Critical recovery needed
    } else if (recoveryScore <= this.RECOVERY_THRESHOLDS.RECOVERY_SCORE_LOW) {
      restDays = 2; // Significant recovery needed
    } else if (recoveryScore <= 80) {
      restDays = 1; // Light recovery needed
    }

    // Adjust based on consecutive training days
    if (recovery.consecutive_training_days >= this.RECOVERY_THRESHOLDS.MAX_CONSECUTIVE_DAYS) {
      restDays = Math.max(restDays, 2);
    } else if (recovery.consecutive_training_days >= 4) {
      restDays = Math.max(restDays, 1);
    }

    // Adjust based on overall fatigue
    if (recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.CRITICAL_FATIGUE) {
      restDays = Math.max(restDays, 2);
    }

    return restDays;
  }

  /**
   * Determine intervention urgency
   */
  private static determineInterventionUrgency(
    recoveryScore: number,
    recovery: RecoveryStatus
  ): RecoveryAnalysis['intervention_urgency'] {
    if (recoveryScore <= this.RECOVERY_THRESHOLDS.RECOVERY_SCORE_CRITICAL ||
        recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.CRITICAL_FATIGUE ||
        recovery.consecutive_training_days >= this.RECOVERY_THRESHOLDS.MAX_CONSECUTIVE_DAYS) {
      return 'critical';
    }

    if (recoveryScore <= this.RECOVERY_THRESHOLDS.RECOVERY_SCORE_LOW ||
        recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.HIGH_FATIGUE) {
      return 'high';
    }

    if (recoveryScore <= 80 || recovery.overall_fatigue >= this.RECOVERY_THRESHOLDS.MODERATE_FATIGUE) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate specific recovery recommendations
   */
  private static generateRecoveryRecommendations(
    analysis: RecoveryAnalysis,
    context: RecommendationContext
  ): RecoveryRecommendation[] {
    const recommendations: RecoveryRecommendation[] = [];
    const recovery = context.recovery_status;

    // Critical interventions
    if (analysis.intervention_urgency === 'critical') {
      recommendations.push({
        type: 'rest_day',
        title: 'Descanso Inmediato Requerido',
        description: `Tu puntuación de recuperación es ${analysis.recovery_score}/100. Necesitas descanso inmediato.`,
        duration: `${analysis.recommended_rest_days} días`,
        priority: 'high',
        implementation_steps: [
          'Cancela entrenamientos programados',
          'Enfócate en sueño de calidad (8+ horas)',
          'Mantén hidratación óptima',
          'Considera técnicas de relajación profunda',
          'Evalúa factores de estrés externos'
        ],
        expected_benefits: [
          'Prevención del sobreentrenamiento',
          'Reducción del riesgo de lesiones',
          'Restauración del sistema nervioso',
          'Mejora del estado de ánimo',
          'Preparación para entrenamientos futuros'
        ]
      });
    }

    // Sleep optimization
    if (analysis.recovery_factors.sleep_debt >= 6) {
      recommendations.push({
        type: 'sleep_optimization',
        title: 'Optimización Urgente del Sueño',
        description: `Tu calidad de sueño (${recovery.sleep_quality}/10) está afectando significativamente tu recuperación.`,
        duration: 'Rutina diaria',
        priority: analysis.recovery_factors.sleep_debt >= 8 ? 'high' : 'medium',
        implementation_steps: [
          'Establece horario fijo de sueño (misma hora cada día)',
          'Crea rutina pre-sueño relajante (1 hora antes)',
          'Elimina pantallas 2 horas antes de dormir',
          'Mantén habitación fresca (18-20°C) y oscura',
          'Evita cafeína después de las 2 PM',
          'Considera suplementos: magnesio, melatonina'
        ],
        expected_benefits: [
          'Mejor recuperación muscular y neural',
          'Aumento de hormona de crecimiento',
          'Mejora del sistema inmunológico',
          'Mayor energía y concentración',
          'Reducción de cortisol (hormona del estrés)'
        ]
      });
    }

    // Stress management
    if (analysis.recovery_factors.stress_impact >= 7) {
      recommendations.push({
        type: 'stress_management',
        title: 'Manejo Integral del Estrés',
        description: `Tu nivel de estrés (${recovery.stress_level}/10) está impactando negativamente tu recuperación.`,
        duration: '20-30 minutos diarios',
        priority: 'high',
        implementation_steps: [
          'Practica meditación mindfulness (10-15 min/día)',
          'Implementa técnicas de respiración profunda',
          'Realiza actividades que disfrutes (hobbies)',
          'Considera terapia o counseling si es necesario',
          'Evalúa y modifica factores estresantes controlables',
          'Incluye tiempo en la naturaleza'
        ],
        expected_benefits: [
          'Reducción de cortisol y adrenalina',
          'Mejor calidad del sueño',
          'Mayor capacidad de recuperación',
          'Mejora del bienestar mental',
          'Mejor rendimiento en entrenamientos'
        ]
      });
    }

    // Active recovery
    if (analysis.fatigue_level === 'moderate' || analysis.fatigue_level === 'high') {
      recommendations.push({
        type: 'active_recovery',
        title: 'Sesión de Recuperación Activa',
        description: 'Actividades de baja intensidad para promover la recuperación sin agregar estrés.',
        duration: '30-45 minutos',
        priority: 'medium',
        implementation_steps: [
          'Caminar ligero (ritmo conversacional)',
          'Yoga suave o estiramientos dinámicos',
          'Natación ligera o aqua jogging',
          'Movilidad articular y foam rolling',
          'Ejercicios de respiración y relajación',
          'Evita actividades que eleven mucho la frecuencia cardíaca'
        ],
        expected_benefits: [
          'Mejora de la circulación sanguínea',
          'Reducción de la rigidez muscular',
          'Eliminación de productos de desecho metabólico',
          'Mantenimiento de la movilidad',
          'Beneficios psicológicos del movimiento'
        ]
      });
    }

    // Nutrition for recovery
    if (analysis.recovery_score <= 70) {
      recommendations.push({
        type: 'nutrition',
        title: 'Nutrición para la Recuperación',
        description: 'Optimiza tu nutrición para acelerar la recuperación muscular y neural.',
        duration: 'Plan alimentario',
        priority: 'medium',
        implementation_steps: [
          'Consume proteína de calidad (1.6-2.2g/kg peso corporal)',
          'Incluye carbohidratos complejos post-entrenamiento',
          'Aumenta ingesta de antioxidantes (frutas, verduras)',
          'Mantén hidratación óptima (35ml/kg peso corporal)',
          'Considera suplementos: omega-3, vitamina D, magnesio',
          'Evita alcohol y alimentos procesados'
        ],
        expected_benefits: [
          'Aceleración de la síntesis proteica',
          'Reducción de la inflamación',
          'Mejor recuperación del glucógeno muscular',
          'Fortalecimiento del sistema inmune',
          'Optimización de procesos metabólicos'
        ]
      });
    }

    // Recovery techniques
    if (analysis.recovery_factors.muscle_fatigue >= 7) {
      recommendations.push({
        type: 'active_recovery',
        title: 'Técnicas de Recuperación Avanzadas',
        description: 'Implementa técnicas específicas para acelerar la recuperación muscular.',
        duration: '15-30 minutos',
        priority: 'medium',
        implementation_steps: [
          'Foam rolling y auto-masaje (10-15 min)',
          'Baños de contraste (caliente-frío)',
          'Sauna o baño caliente (15-20 min)',
          'Compresión y elevación de piernas',
          'Masaje profesional (semanal)',
          'Técnicas de liberación miofascial'
        ],
        expected_benefits: [
          'Reducción de la tensión muscular',
          'Mejora del flujo sanguíneo',
          'Aceleración de la eliminación de toxinas',
          'Reducción del dolor muscular tardío',
          'Mejora de la flexibilidad y movilidad'
        ]
      });
    }

    // Sort by priority and return
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate personalized recovery plan
   */
  static generateRecoveryPlan(
    analysis: RecoveryAnalysis,
    context: RecommendationContext
  ): {
    plan_name: string;
    duration_days: number;
    daily_activities: Array<{
      day: number;
      activities: string[];
      focus: string;
    }>;
    success_metrics: string[];
    adjustment_triggers: string[];
  } {
    const planDuration = Math.max(3, analysis.recommended_rest_days);
    
    return {
      plan_name: `Plan de Recuperación ${analysis.fatigue_level === 'critical' ? 'Intensiva' : 'Personalizada'}`,
      duration_days: planDuration,
      daily_activities: Array.from({ length: planDuration }, (_, index) => ({
        day: index + 1,
        activities: this.generateDailyRecoveryActivities(index + 1, analysis),
        focus: this.getDailyFocus(index + 1, planDuration, analysis)
      })),
      success_metrics: [
        'Reducción de fatiga percibida',
        'Mejora en calidad del sueño',
        'Disminución de dolor muscular',
        'Aumento de energía y motivación',
        'Mejora en estado de ánimo'
      ],
      adjustment_triggers: [
        'Si la fatiga no mejora después de 2 días',
        'Si aparecen síntomas de enfermedad',
        'Si el estrés aumenta significativamente',
        'Si el sueño no mejora con las intervenciones'
      ]
    };
  }

  /**
   * Generate daily recovery activities
   */
  private static generateDailyRecoveryActivities(
    day: number,
    analysis: RecoveryAnalysis
  ): string[] {
    const baseActivities = [
      'Dormir 8+ horas de calidad',
      'Mantener hidratación óptima',
      'Nutrición enfocada en recuperación'
    ];

    if (day === 1) {
      // First day - focus on rest
      return [
        ...baseActivities,
        'Descanso completo de ejercicio intenso',
        'Técnicas de relajación (20 min)',
        'Evaluación de factores estresantes'
      ];
    } else if (day === 2) {
      // Second day - gentle movement
      return [
        ...baseActivities,
        'Caminar ligero (20-30 min)',
        'Estiramientos suaves',
        'Foam rolling (10 min)'
      ];
    } else {
      // Later days - active recovery
      return [
        ...baseActivities,
        'Recuperación activa (30-45 min)',
        'Movilidad y flexibilidad',
        'Preparación mental para retorno al entrenamiento'
      ];
    }
  }

  /**
   * Get daily focus for recovery plan
   */
  private static getDailyFocus(
    day: number,
    totalDays: number,
    analysis: RecoveryAnalysis
  ): string {
    if (day === 1) {
      return 'Descanso y evaluación';
    } else if (day === totalDays) {
      return 'Preparación para retorno';
    } else if (analysis.recovery_factors.sleep_debt >= 6) {
      return 'Optimización del sueño';
    } else if (analysis.recovery_factors.stress_impact >= 7) {
      return 'Manejo del estrés';
    } else {
      return 'Recuperación activa';
    }
  }
}