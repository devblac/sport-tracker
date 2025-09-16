import { dbManager } from '@/db/IndexedDBManager';
import type { Workout, SetData, WorkoutExercise } from '@/schemas/workout';
import { WorkoutService } from './WorkoutService';

export interface WeightRecommendation {
  suggestedWeight: number;
  confidence: number; // 0-1 scale
  reasoning: string;
  previousBest: number;
  progressionType: 'linear' | 'percentage' | 'deload' | 'maintain';
}

export interface PlateauDetection {
  isPlateaued: boolean;
  plateauDuration: number; // weeks
  lastImprovement: Date | null;
  suggestions: string[];
}

export interface ExerciseRecommendation {
  exerciseId: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  targetMuscleGroup: string;
}

export class RecommendationEngine {
  private static instance: RecommendationEngine;
  private workoutService: WorkoutService;

  private constructor() {
    this.workoutService = WorkoutService.getInstance();
  }

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * Get smart weight recommendation for next set
   */
  async getWeightRecommendation(
    userId: string,
    exerciseId: string,
    targetReps: number,
    currentSetNumber: number = 1
  ): Promise<WeightRecommendation> {
    try {
      const recentWorkouts = await this.getRecentWorkoutsWithExercise(userId, exerciseId, 10);
      
      if (recentWorkouts.length === 0) {
        return this.getBeginnerRecommendation(exerciseId, targetReps);
      }

      const performanceHistory = this.analyzePerformanceHistory(recentWorkouts, exerciseId);
      const lastBestSet = this.findLastBestSet(performanceHistory, targetReps);
      
      if (!lastBestSet) {
        return this.getBeginnerRecommendation(exerciseId, targetReps);
      }

      return this.calculateProgressiveRecommendation(
        lastBestSet,
        performanceHistory,
        targetReps,
        currentSetNumber
      );
    } catch (error) {
      console.error('Error getting weight recommendation:', error);
      return this.getBeginnerRecommendation(exerciseId, targetReps);
    }
  }

  /**
   * Detect if user has plateaued on an exercise
   */
  async detectPlateau(
    userId: string,
    exerciseId: string,
    weeksToAnalyze: number = 8
  ): Promise<PlateauDetection> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (weeksToAnalyze * 7));

      const recentWorkouts = await this.getRecentWorkoutsWithExercise(
        userId, 
        exerciseId, 
        20,
        cutoffDate
      );

      if (recentWorkouts.length < 3) {
        return {
          isPlateaued: false,
          plateauDuration: 0,
          lastImprovement: null,
          suggestions: []
        };
      }

      const performanceHistory = this.analyzePerformanceHistory(recentWorkouts, exerciseId);
      const lastImprovement = this.findLastImprovement(performanceHistory);
      const plateauDuration = this.calculatePlateauDuration(performanceHistory);

      const isPlateaued = plateauDuration >= 3; // 3+ weeks without improvement

      return {
        isPlateaued,
        plateauDuration,
        lastImprovement,
        suggestions: isPlateaued ? this.generatePlateauSuggestions(exerciseId) : []
      };
    } catch (error) {
      console.error('Error detecting plateau:', error);
      return {
        isPlateaued: false,
        plateauDuration: 0,
        lastImprovement: null,
        suggestions: []
      };
    }
  }

  /**
   * Get exercise recommendations based on performance analysis
   */
  async getExerciseRecommendations(
    userId: string,
    targetMuscleGroup?: string
  ): Promise<ExerciseRecommendation[]> {
    try {
      const recentWorkouts = await this.getRecentWorkouts(userId, 20);
      const weaknesses = await this.identifyWeaknesses(recentWorkouts);
      
      return this.generateExerciseRecommendations(weaknesses, targetMuscleGroup);
    } catch (error) {
      console.error('Error getting exercise recommendations:', error);
      return [];
    }
  }

  // Private helper methods

  private async getRecentWorkoutsWithExercise(
    userId: string,
    exerciseId: string,
    limit: number,
    afterDate?: Date
  ): Promise<Workout[]> {
    const allWorkouts = await this.workoutService.getWorkoutsByUser(userId);
    
    return allWorkouts
      .filter(workout => {
        const hasExercise = workout.exercises.some(ex => ex.exercise_id === exerciseId);
        const isAfterDate = !afterDate || new Date(workout.completed_at!) >= afterDate;
        return hasExercise && isAfterDate && workout.status === 'completed';
      })
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
      .slice(0, limit);
  }

  private async getRecentWorkouts(userId: string, limit: number): Promise<Workout[]> {
    // Use the correct method from WorkoutService
    return await this.workoutService.getRecentWorkouts(userId, limit);
  }

  private analyzePerformanceHistory(workouts: Workout[], exerciseId: string) {
    const performances: Array<{
      date: Date;
      bestSet: SetData;
      volume: number;
      oneRepMax: number;
    }> = [];

    for (const workout of workouts) {
      const exercise = workout.exercises.find(ex => ex.exercise_id === exerciseId);
      if (!exercise) continue;

      const completedSets = exercise.sets.filter(set => set.completed && !set.skipped);
      if (completedSets.length === 0) continue;

      // Find best set (highest weight * reps)
      const bestSet = completedSets.reduce((best, current) => {
        const bestScore = best.weight * best.reps;
        const currentScore = current.weight * current.reps;
        return currentScore > bestScore ? current : best;
      });

      // Calculate total volume
      const volume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

      // Estimate 1RM using Epley formula
      const oneRepMax = bestSet.weight * (1 + bestSet.reps / 30);

      performances.push({
        date: new Date(workout.completed_at!),
        bestSet,
        volume,
        oneRepMax
      });
    }

    return performances.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private findLastBestSet(performances: any[], targetReps: number): SetData | null {
    if (performances.length === 0) return null;

    // Find the most recent performance with similar rep range
    const repRange = 2; // Allow ±2 reps
    const recentPerformance = performances
      .reverse()
      .find(p => Math.abs(p.bestSet.reps - targetReps) <= repRange);

    return recentPerformance?.bestSet || performances[performances.length - 1]?.bestSet || null;
  }

  private calculateProgressiveRecommendation(
    lastBestSet: SetData,
    performanceHistory: any[],
    targetReps: number,
    currentSetNumber: number
  ): WeightRecommendation {
    const recentTrend = this.calculateTrend(performanceHistory.slice(-5));
    const baseWeight = lastBestSet.weight;
    
    let suggestedWeight = baseWeight;
    let progressionType: WeightRecommendation['progressionType'] = 'maintain';
    let reasoning = '';
    let confidence = 0.7;

    // Base confidence on data quality
    const dataQuality = Math.min(performanceHistory.length / 5, 1); // More data = higher confidence
    confidence = 0.5 + (dataQuality * 0.3); // 0.5 to 0.8 base confidence

    // Adjust based on rep difference
    const repDifference = targetReps - lastBestSet.reps;
    if (repDifference > 0) {
      // More reps = less weight
      suggestedWeight = baseWeight * (1 - (repDifference * 0.025));
      reasoning = `Adjusted for ${repDifference} more reps than last time`;
      confidence += 0.1; // More confident when reducing weight for more reps
    } else if (repDifference < 0) {
      // Fewer reps = more weight
      suggestedWeight = baseWeight * (1 + (Math.abs(repDifference) * 0.025));
      reasoning = `Adjusted for ${Math.abs(repDifference)} fewer reps than last time`;
      confidence += 0.05; // Slightly less confident when increasing weight
    } else {
      reasoning = 'Same rep range as last time';
      confidence += 0.15; // Most confident when rep range matches
    }

    // Apply progression based on recent trend
    if (recentTrend > 0.05) {
      // Good progress - increase weight
      suggestedWeight *= 1.025; // 2.5% increase
      progressionType = 'linear';
      reasoning += '. Recent progress suggests you can handle more weight';
      confidence = Math.min(confidence + 0.1, 0.95); // Cap at 95%
    } else if (recentTrend < -0.05) {
      // Declining performance - maintain or deload
      suggestedWeight *= 0.95; // 5% decrease
      progressionType = 'deload';
      reasoning += '. Recent performance suggests taking a step back';
      confidence = Math.min(confidence + 0.15, 0.95); // Very confident in deload recommendations
    } else {
      // Stable performance
      progressionType = 'maintain';
      reasoning += '. Performance has been stable';
      confidence += 0.05;
    }

    // Adjust for set number (fatigue)
    if (currentSetNumber > 1) {
      const fatigueReduction = (currentSetNumber - 1) * 0.02; // 2% per additional set
      suggestedWeight *= (1 - fatigueReduction);
      reasoning += `. Adjusted for set ${currentSetNumber} fatigue`;
      confidence -= 0.05; // Less confident for later sets due to fatigue
    }

    // Ensure confidence stays within bounds
    confidence = Math.max(0.3, Math.min(0.95, confidence));

    // Round to nearest 2.5kg/5lb
    suggestedWeight = Math.round(suggestedWeight * 2) / 2;

    return {
      suggestedWeight,
      confidence,
      reasoning: reasoning || 'Based on your recent performance',
      previousBest: baseWeight,
      progressionType
    };
  }

  private calculateTrend(performances: any[]): number {
    if (performances.length < 2) return 0;

    const first = performances[0];
    const last = performances[performances.length - 1];
    
    return (last.oneRepMax - first.oneRepMax) / first.oneRepMax;
  }

  private findLastImprovement(performances: any[]): Date | null {
    if (performances.length < 2) return null;

    for (let i = performances.length - 1; i > 0; i--) {
      if (performances[i].oneRepMax > performances[i - 1].oneRepMax) {
        return performances[i].date;
      }
    }

    return null;
  }

  private calculatePlateauDuration(performances: any[]): number {
    if (performances.length < 2) return 0;

    const lastImprovement = this.findLastImprovement(performances);
    if (!lastImprovement) return performances.length;

    const now = new Date();
    const weeksSinceImprovement = Math.floor(
      (now.getTime() - lastImprovement.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    return weeksSinceImprovement;
  }

  private generatePlateauSuggestions(exerciseId: string): string[] {
    // This would be more sophisticated with exercise database
    const suggestions = [
      'Try reducing weight by 10% and focus on perfect form',
      'Increase rest time between sets to 3-4 minutes',
      'Add pause reps or tempo variations',
      'Consider switching to a similar exercise variation',
      'Ensure you\'re eating enough protein and getting adequate sleep'
    ];

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private async identifyWeaknesses(workouts: Workout[]): Promise<string[]> {
    // Analyze muscle group frequency and performance
    const muscleGroupPerformance: Record<string, number[]> = {};
    
    // This would be more sophisticated with exercise database
    // For now, return common weak points
    return ['posterior_chain', 'core_stability', 'unilateral_strength'];
  }

  private generateExerciseRecommendations(
    weaknesses: string[],
    targetMuscleGroup?: string
  ): ExerciseRecommendation[] {
    // This would query the exercise database for specific recommendations
    // For now, return some example recommendations
    const recommendations: ExerciseRecommendation[] = [];

    if (weaknesses.includes('posterior_chain')) {
      recommendations.push({
        exerciseId: 'deadlift',
        reason: 'Strengthen posterior chain weakness',
        priority: 'high',
        targetMuscleGroup: 'posterior_chain'
      });
    }

    return recommendations;
  }

  private getBeginnerRecommendation(exerciseId: string, targetReps: number): WeightRecommendation {
    // Conservative starting weights for beginners
    const beginnerWeights: Record<string, number> = {
      'squat': 20,
      'bench_press': 20,
      'deadlift': 30,
      'overhead_press': 15,
      'row': 15,
      'barbell_curl': 10,
      'tricep_extension': 10,
      'lat_pulldown': 25,
      'leg_press': 40
    };

    const baseWeight = beginnerWeights[exerciseId] || 10;
    
    // Adjust weight based on rep range
    let adjustedWeight = baseWeight;
    let confidence = 0.4; // Lower confidence for beginners
    let reasoning = 'Conservative starting weight for new exercise';

    if (targetReps <= 5) {
      // Heavy weight, low reps
      adjustedWeight = baseWeight * 1.2;
      confidence = 0.3; // Less confident for heavy weights without history
      reasoning = 'Starting weight for strength training (low reps)';
    } else if (targetReps >= 12) {
      // Light weight, high reps
      adjustedWeight = baseWeight * 0.8;
      confidence = 0.6; // More confident for lighter weights
      reasoning = 'Starting weight for endurance training (high reps)';
    } else {
      // Moderate weight, moderate reps
      confidence = 0.5;
      reasoning = 'Starting weight for hypertrophy training (moderate reps)';
    }

    // Round to nearest 2.5kg
    adjustedWeight = Math.round(adjustedWeight * 2) / 2;

    return {
      suggestedWeight: adjustedWeight,
      confidence,
      reasoning,
      previousBest: 0,
      progressionType: 'linear'
    };
  }
}