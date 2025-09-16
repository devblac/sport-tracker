import { WorkoutService } from '@/services/WorkoutService';
import { GamificationService } from '@/services/GamificationService';
import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';
import type { 
  UserLevel, 
  GamificationStats, 
  UserStreak, 
  Achievement, 
  UserAchievement,
  XPTransaction 
} from '@/types/gamification';
import { DEFAULT_ACHIEVEMENTS } from '@/utils/achievementSystem';
import { calculateUserLevel } from '@/utils/levelProgression';

export class TestDataGenerator {
  private workoutService = WorkoutService.getInstance();
  private gamificationService = GamificationService.getInstance();

  // Common exercise IDs for realistic data
  private commonExercises = [
    'bench-press',
    'squat',
    'deadlift',
    'overhead-press',
    'barbell-row',
    'pull-up',
    'dip',
    'bicep-curl',
    'tricep-extension',
    'lateral-raise',
  ];

  private workoutNames = [
    'Push Day',
    'Pull Day', 
    'Leg Day',
    'Upper Body',
    'Lower Body',
    'Full Body',
    'Chest & Triceps',
    'Back & Biceps',
    'Shoulders & Arms',
    'Cardio & Core',
  ];

  /**
   * Generate a random number within a range
   */
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate a random date within the last N days
   */
  private randomDateWithinDays(days: number): Date {
    const now = new Date();
    const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
    return new Date(randomTime);
  }

  /**
   * Generate realistic weight progression for an exercise
   */
  private generateWeightProgression(baseWeight: number, sets: number): number[] {
    const weights = [];
    let currentWeight = baseWeight;
    
    for (let i = 0; i < sets; i++) {
      // Slight variation in weight (±5kg)
      const variation = this.randomBetween(-5, 5);
      weights.push(Math.max(20, currentWeight + variation)); // Minimum 20kg
      
      // Progressive overload tendency (slight increase over sets)
      if (Math.random() > 0.7) {
        currentWeight += 2.5;
      }
    }
    
    return weights;
  }

  /**
   * Generate realistic rep ranges based on weight
   */
  private generateRepProgression(weights: number[], targetReps: number): number[] {
    return weights.map(weight => {
      // Heavier weights = fewer reps
      const baseReps = targetReps;
      const variation = this.randomBetween(-2, 2);
      return Math.max(1, Math.min(20, baseReps + variation));
    });
  }

  /**
   * Generate a realistic set for an exercise
   */
  private generateSet(
    exerciseId: string, 
    setIndex: number, 
    baseWeight: number, 
    targetReps: number,
    isWarmup: boolean = false
  ): SetData {
    const weight = isWarmup 
      ? Math.round(baseWeight * 0.6) // Warmup is 60% of working weight
      : baseWeight + this.randomBetween(-5, 10);
    
    const reps = isWarmup 
      ? this.randomBetween(8, 12) // Warmup reps
      : targetReps + this.randomBetween(-2, 2);

    const restTime = isWarmup ? 60 : this.randomBetween(90, 180); // 1.5-3 min rest

    return {
      id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // exercise_id: exerciseId,
      set_number: setIndex + 1,
      type: isWarmup ? 'warmup' : 'normal',
      weight: Math.max(20, weight),
      reps: Math.max(1, Math.min(20, reps)),
      rest_time: restTime,
      rpe: isWarmup ? undefined : this.randomBetween(6, 9),
      started_at: new Date(),
      ended_at: new Date(),
      completed_at: new Date(),
      completed: true,
      skipped: false,
    };
  }

  /**
   * Generate a realistic workout exercise
   */
  private generateWorkoutExercise(exerciseId: string, exerciseIndex: number): WorkoutExercise {
    const baseWeight = this.randomBetween(40, 120); // 40-120kg base weight
    const targetReps = this.randomBetween(6, 12); // 6-12 rep range
    const workingSets = this.randomBetween(3, 5); // 3-5 working sets
    const hasWarmup = Math.random() > 0.3; // 70% chance of warmup

    const sets: SetData[] = [];

    // Add warmup set if applicable
    if (hasWarmup) {
      sets.push(this.generateSet(exerciseId, 0, baseWeight, targetReps, true));
    }

    // Add working sets
    for (let i = 0; i < workingSets; i++) {
      const setIndex = hasWarmup ? i + 1 : i;
      sets.push(this.generateSet(exerciseId, setIndex, baseWeight, targetReps, false));
    }

    return {
      id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // exercise_id: exerciseId,
      order: exerciseIndex + 1,
      sets,
      notes: Math.random() > 0.8 ? 'Felt strong today!' : undefined,
      target_sets: workingSets,
      target_reps: targetReps,
      target_weight: baseWeight,
      rest_time: this.randomBetween(120, 180),
      started_at: new Date(),
      completed_at: new Date(),
    };
  }

  /**
   * Generate a complete random workout
   */
  public async generateRandomWorkout(userId: string, daysAgo: number = 0): Promise<Workout> {
    // Use common exercises for test data generation
    const availableExerciseIds = this.commonExercises;

    // Select 3-6 random exercises
    const numExercises = this.randomBetween(3, 6);
    const selectedExercises = [];
    const usedExercises = new Set<string>();

    while (selectedExercises.length < numExercises && selectedExercises.length < availableExerciseIds.length) {
      const randomExercise = availableExerciseIds[this.randomBetween(0, availableExerciseIds.length - 1)];
      if (!usedExercises.has(randomExercise)) {
        selectedExercises.push(randomExercise);
        usedExercises.add(randomExercise);
      }
    }

    // Generate workout exercises
    const workoutExercises = selectedExercises.map((exerciseId, index) => 
      this.generateWorkoutExercise(exerciseId, index)
    );

    // Calculate total duration (realistic workout time)
    const baseDuration = this.randomBetween(45, 90); // 45-90 minutes
    const totalDuration = baseDuration * 60; // Convert to seconds

    // Generate workout date
    const workoutDate = daysAgo > 0 
      ? this.randomDateWithinDays(daysAgo)
      : new Date();

    const workout: Workout = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name: this.workoutNames[this.randomBetween(0, this.workoutNames.length - 1)],
      description: `Generated test workout with ${numExercises} exercises`,
      status: 'completed',
      exercises: workoutExercises,
      is_template: false,
      auto_rest_timer: Math.random() > 0.5,
      default_rest_time: this.randomBetween(120, 180),
      total_duration: totalDuration,
      is_public: false,
      created_at: workoutDate,
      started_at: workoutDate,
      completed_at: new Date(workoutDate.getTime() + totalDuration * 1000),
    };

    return workout;
  }

  /**
   * Generate multiple random workouts over a time period
   */
  public async generateWorkoutHistory(
    userId: string, 
    numWorkouts: number = 20, 
    daysPeriod: number = 90
  ): Promise<Workout[]> {
    const workouts: Workout[] = [];
    
    for (let i = 0; i < numWorkouts; i++) {
      const daysAgo = this.randomBetween(1, daysPeriod);
      const workout = await this.generateRandomWorkout(userId, daysAgo);
      workouts.push(workout);
    }

    // Sort by date (oldest first)
    workouts.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return workouts;
  }

  /**
   * Save generated workouts to the database
   */
  public async saveGeneratedWorkouts(workouts: Workout[]): Promise<boolean> {
    try {
      for (const workout of workouts) {
        await this.workoutService.saveWorkout(workout);
      }
      return true;
    } catch (error) {
      console.error('Error saving generated workouts:', error);
      return false;
    }
  }

  /**
   * Generate and save a complete workout history for testing
   */
  public async generateTestData(
    userId: string,
    options: {
      numWorkouts?: number;
      daysPeriod?: number;
      includeRecent?: boolean;
    } = {}
  ): Promise<{ success: boolean; workoutsGenerated: number }> {
    const {
      numWorkouts = 25,
      daysPeriod = 90,
      includeRecent = true
    } = options;

    try {
      console.log(`Generating ${numWorkouts} test workouts over ${daysPeriod} days...`);
      
      const workouts = await this.generateWorkoutHistory(userId, numWorkouts, daysPeriod);
      
      // Add a few recent workouts for immediate testing
      if (includeRecent) {
        const recentWorkouts = await Promise.all([
          this.generateRandomWorkout(userId, 0), // Today
          this.generateRandomWorkout(userId, 1), // Yesterday
          this.generateRandomWorkout(userId, 3), // 3 days ago
        ]);
        workouts.push(...recentWorkouts);
      }

      const success = await this.saveGeneratedWorkouts(workouts);
      
      if (success) {
        console.log(`Successfully generated ${workouts.length} test workouts!`);
      }

      return {
        success,
        workoutsGenerated: workouts.length
      };
    } catch (error) {
      console.error('Error generating test data:', error);
      return {
        success: false,
        workoutsGenerated: 0
      };
    }
  }

  /**
   * Clear all workouts for a user (for testing cleanup)
   */
  public async clearUserWorkouts(userId: string): Promise<boolean> {
    try {
      const workouts = await this.workoutService.getWorkoutsByUser(userId);
      
      for (const workout of workouts) {
        await this.workoutService.deleteWorkout(workout.id);
      }
      
      console.log(`Cleared ${workouts.length} workouts for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing user workouts:', error);
      return false;
    }
  }

  // ============================================================================
  // GAMIFICATION TEST DATA METHODS
  // ============================================================================

  /**
   * Generate realistic gamification stats for a user
   */
  public generateGamificationStats(
    userId: string,
    totalWorkouts: number = 25,
    currentStreak: number = 7
  ): GamificationStats {
    // Calculate realistic XP based on workouts
    const baseXPPerWorkout = 150; // Average XP per workout
    const bonusXP = this.randomBetween(500, 2000); // Bonus XP from achievements, streaks, etc.
    const totalXP = (totalWorkouts * baseXPPerWorkout) + bonusXP;
    
    const userLevel = calculateUserLevel(totalXP);
    
    return {
      userId,
      level: userLevel.level,
      totalXP,
      currentStreak,
      longestStreak: Math.max(currentStreak, this.randomBetween(currentStreak, currentStreak + 20)),
      achievementsUnlocked: this.randomBetween(5, 15),
      totalAchievements: DEFAULT_ACHIEVEMENTS.length,
      challengesCompleted: this.randomBetween(2, 8),
      challengesWon: this.randomBetween(0, 3),
      socialScore: this.randomBetween(20, 80),
      consistencyScore: Math.min(95, (currentStreak / 30) * 100 + this.randomBetween(10, 30)),
      strengthScore: this.randomBetween(40, 90),
      varietyScore: this.randomBetween(30, 85),
      lastActive: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate user streak data
   */
  public generateUserStreak(
    userId: string,
    currentStreak: number = 7,
    totalWorkouts: number = 25
  ): UserStreak {
    const scheduledDays = ['monday', 'wednesday', 'friday']; // Default 3-day schedule
    
    return {
      userId,
      currentStreak,
      longestStreak: Math.max(currentStreak, this.randomBetween(currentStreak, currentStreak + 20)),
      totalWorkouts,
      lastWorkoutDate: new Date(Date.now() - (24 * 60 * 60 * 1000)), // Yesterday
      streakStartDate: new Date(Date.now() - (currentStreak * 24 * 60 * 60 * 1000)),
      scheduledDays,
      compensationsUsed: this.randomBetween(0, 3),
      sickDaysUsed: this.randomBetween(0, 5),
      vacationDaysUsed: this.randomBetween(0, 10),
      maxSickDays: 14,
      maxVacationDays: 30,
      lastSickDayReset: new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)), // 6 months ago
      lastVacationDayReset: new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)),
      streakFreezes: [],
      updatedAt: new Date()
    };
  }

  /**
   * Generate user achievements with realistic unlock dates
   */
  public generateUserAchievements(
    userId: string,
    unlockedCount: number = 8
  ): UserAchievement[] {
    const achievements: UserAchievement[] = [];
    const shuffledAchievements = [...DEFAULT_ACHIEVEMENTS].sort(() => Math.random() - 0.5);
    
    // Generate unlocked achievements
    for (let i = 0; i < Math.min(unlockedCount, shuffledAchievements.length); i++) {
      const achievement = shuffledAchievements[i];
      const daysAgo = this.randomBetween(1, 60);
      const unlockedAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      achievements.push({
        userId,
        achievementId: achievement.id,
        progress: 1,
        isUnlocked: true,
        unlockedAt,
        currentValues: {
          workout_count: this.randomBetween(10, 100),
          streak_days: this.randomBetween(7, 30),
          total_volume: this.randomBetween(1000, 10000)
        },
        notificationSent: true,
        timesCompleted: achievement.isRepeatable ? this.randomBetween(1, 3) : 1
      });
    }
    
    // Generate locked achievements with progress
    for (let i = unlockedCount; i < shuffledAchievements.length; i++) {
      const achievement = shuffledAchievements[i];
      const progress = Math.random() * 0.8; // 0-80% progress
      
      achievements.push({
        userId,
        achievementId: achievement.id,
        progress,
        isUnlocked: false,
        currentValues: {
          workout_count: Math.floor(progress * 100),
          streak_days: Math.floor(progress * 30),
          total_volume: Math.floor(progress * 10000)
        },
        notificationSent: false,
        timesCompleted: 0
      });
    }
    
    return achievements;
  }

  /**
   * Generate XP transaction history
   */
  public generateXPTransactions(
    userId: string,
    totalXP: number,
    numTransactions: number = 50
  ): XPTransaction[] {
    const transactions: XPTransaction[] = [];
    const sources = [
      'workout_completion',
      'personal_record',
      'streak_milestone',
      'achievement_unlock',
      'social_interaction',
      'consistency_bonus'
    ];
    
    let remainingXP = totalXP;
    
    for (let i = 0; i < numTransactions && remainingXP > 0; i++) {
      const source = sources[this.randomBetween(0, sources.length - 1)] as any;
      const amount = Math.min(
        remainingXP,
        this.randomBetween(20, 200) // Realistic XP amounts
      );
      
      const daysAgo = this.randomBetween(1, 90);
      const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));
      
      transactions.push({
        id: `xp-${Date.now()}-${i}`,
        userId,
        amount,
        source,
        sourceId: `source-${i}`,
        description: this.getXPDescription(source, amount),
        createdAt
      });
      
      remainingXP -= amount;
    }
    
    return transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get XP description for transaction
   */
  private getXPDescription(source: string, amount: number): string {
    const descriptions = {
      workout_completion: `Completed workout (+${amount} XP)`,
      personal_record: `New personal record (+${amount} XP)`,
      streak_milestone: `Streak milestone reached (+${amount} XP)`,
      achievement_unlock: `Achievement unlocked (+${amount} XP)`,
      social_interaction: `Social interaction (+${amount} XP)`,
      consistency_bonus: `Consistency bonus (+${amount} XP)`
    };
    
    return (descriptions as any)[source] || `XP awarded (+${amount} XP)`;
  }

  /**
   * Generate complete gamification test data for a user
   */
  public async generateGamificationTestData(
    userId: string,
    options: {
      totalWorkouts?: number;
      currentStreak?: number;
      unlockedAchievements?: number;
      includeTransactions?: boolean;
    } = {}
  ): Promise<{
    userLevel: UserLevel;
    userStats: GamificationStats;
    userStreak: UserStreak;
    userAchievements: UserAchievement[];
    xpTransactions?: XPTransaction[];
  }> {
    const {
      totalWorkouts = 25,
      currentStreak = 7,
      unlockedAchievements = 8,
      includeTransactions = true
    } = options;

    console.log(`Generating gamification test data for user ${userId}...`);

    // Generate core data
    const userStats = this.generateGamificationStats(userId, totalWorkouts, currentStreak);
    const userLevel = calculateUserLevel(userStats.totalXP);
    const userStreak = this.generateUserStreak(userId, currentStreak, totalWorkouts);
    const userAchievements = this.generateUserAchievements(userId, unlockedAchievements);
    
    const result: any = {
      userLevel: { ...userLevel, userId },
      userStats,
      userStreak,
      userAchievements
    };

    // Generate XP transactions if requested
    if (includeTransactions) {
      result.xpTransactions = this.generateXPTransactions(userId, userStats.totalXP);
    }

    console.log(`Generated gamification data:
      - Level: ${userLevel.level} (${userLevel.title})
      - Total XP: ${userStats.totalXP.toLocaleString()}
      - Current Streak: ${currentStreak} days
      - Achievements: ${unlockedAchievements}/${DEFAULT_ACHIEVEMENTS.length}
      - Transactions: ${result.xpTransactions?.length || 0}
    `);

    return result;
  }

  /**
   * Generate test data for different user scenarios
   */
  public async generateUserScenarios(): Promise<{
    beginner: any;
    intermediate: any;
    advanced: any;
    expert: any;
  }> {
    console.log('Generating test data for different user scenarios...');

    const scenarios = {
      beginner: await this.generateGamificationTestData('user-beginner', {
        totalWorkouts: 5,
        currentStreak: 3,
        unlockedAchievements: 2
      }),
      intermediate: await this.generateGamificationTestData('user-intermediate', {
        totalWorkouts: 25,
        currentStreak: 7,
        unlockedAchievements: 8
      }),
      advanced: await this.generateGamificationTestData('user-advanced', {
        totalWorkouts: 75,
        currentStreak: 21,
        unlockedAchievements: 15
      }),
      expert: await this.generateGamificationTestData('user-expert', {
        totalWorkouts: 200,
        currentStreak: 45,
        unlockedAchievements: 20
      })
    };

    console.log('Generated scenarios for beginner, intermediate, advanced, and expert users');
    return scenarios;
  }

  /**
   * Generate complete test dataset (workouts + gamification)
   */
  public async generateCompleteTestData(
    userId: string,
    options: {
      numWorkouts?: number;
      daysPeriod?: number;
      currentStreak?: number;
      unlockedAchievements?: number;
    } = {}
  ): Promise<{ success: boolean; data: any }> {
    const {
      numWorkouts = 25,
      daysPeriod = 90,
      currentStreak = 7,
      unlockedAchievements = 8
    } = options;

    try {
      console.log(`Generating complete test data for user ${userId}...`);

      // Generate workout history
      const workoutResult = await this.generateTestData(userId, {
        numWorkouts,
        daysPeriod,
        includeRecent: true
      });

      if (!workoutResult.success) {
        throw new Error('Failed to generate workout data');
      }

      // Generate gamification data
      const gamificationData = await this.generateGamificationTestData(userId, {
        totalWorkouts: workoutResult.workoutsGenerated,
        currentStreak,
        unlockedAchievements,
        includeTransactions: true
      });

      console.log(`Successfully generated complete test data:
        - Workouts: ${workoutResult.workoutsGenerated}
        - Level: ${gamificationData.userLevel.level}
        - XP: ${gamificationData.userStats.totalXP.toLocaleString()}
        - Streak: ${currentStreak} days
        - Achievements: ${unlockedAchievements}
      `);

      return {
        success: true,
        data: {
          workouts: workoutResult,
          gamification: gamificationData
        }
      };
    } catch (error) {
      console.error('Error generating complete test data:', error);
      return {
        success: false,
        data: null
      };
    }
  }
}