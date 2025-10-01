/**
 * WorkoutPlayerService - Enhanced workout player with real Supabase integration
 * 
 * Provides real-time workout session tracking, auto-save, and recovery functionality
 * with seamless offline/online synchronization.
 */

import { supabaseService } from './SupabaseService';
import { enhancedWorkoutService } from './EnhancedWorkoutService';
import { realGamificationService } from './RealGamificationService';
import { realStreakService } from './RealStreakService';
import { dbManager } from '@/db/IndexedDBManager';
import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';
import { logger } from '@/utils/logger';

export interface WorkoutSession {
  id: string;
  workout: Workout;
  startTime: Date;
  lastSaveTime: Date;
  isActive: boolean;
  isPaused: boolean;
  pausedDuration: number;
  autoSaveEnabled: boolean;
  syncStatus: 'synced' | 'pending' | 'error';
}

export interface WorkoutProgress {
  totalSets: number;
  completedSets: number;
  totalExercises: number;
  completedExercises: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  progressPercentage: number;
}

export interface WorkoutCompletionData {
  workout: Workout;
  totalDuration: number;
  totalVolume: number;
  totalReps: number;
  totalSets: number;
  personalRecords: Array<{
    exerciseId: string;
    type: 'weight' | 'reps' | 'volume';
    previousValue: number;
    newValue: number;
  }>;
  achievements: string[];
  xpEarned: number;
}

export class WorkoutPlayerService {
  private static instance: WorkoutPlayerService;
  private activeSessions: Map<string, WorkoutSession> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_SAVE_INTERVAL = 15000; // 15 seconds
  private readonly SYNC_RETRY_DELAY = 30000; // 30 seconds

  private constructor() {
    // Initialize auto-save interval
    this.startAutoSaveInterval();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  public static getInstance(): WorkoutPlayerService {
    if (!WorkoutPlayerService.instance) {
      WorkoutPlayerService.instance = new WorkoutPlayerService();
    }
    return WorkoutPlayerService.instance;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  async startWorkoutSession(workout: Workout): Promise<WorkoutSession> {
    try {
      logger.info('Starting workout session', { workoutId: workout.id });

      // Update workout status
      const sessionWorkout: Workout = {
        ...workout,
        status: 'in_progress',
        started_at: new Date(),
      };

      // Create session
      const session: WorkoutSession = {
        id: workout.id,
        workout: sessionWorkout,
        startTime: new Date(),
        lastSaveTime: new Date(),
        isActive: true,
        isPaused: false,
        pausedDuration: 0,
        autoSaveEnabled: true,
        syncStatus: 'pending'
      };

      // Store session
      this.activeSessions.set(workout.id, session);

      // Save initial session to local storage
      await this.saveSessionLocally(session);

      // Sync to Supabase if online
      if (navigator.onLine) {
        await this.syncSessionToSupabase(session);
      }

      logger.info('Workout session started successfully', { sessionId: session.id });
      return session;

    } catch (error) {
      logger.error('Error starting workout session', { error, workoutId: workout.id });
      throw error;
    }
  }

  async pauseWorkoutSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.isPaused = true;
    session.workout.status = 'paused';
    session.workout.paused_at = new Date();

    await this.saveSessionLocally(session);
    
    if (navigator.onLine) {
      await this.syncSessionToSupabase(session);
    }

    logger.info('Workout session paused', { sessionId });
  }

  async resumeWorkoutSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.isPaused && session.workout.paused_at) {
      const pauseDuration = Date.now() - new Date(session.workout.paused_at).getTime();
      session.pausedDuration += pauseDuration;
    }

    session.isPaused = false;
    session.workout.status = 'in_progress';
    session.workout.resumed_at = new Date();

    await this.saveSessionLocally(session);
    
    if (navigator.onLine) {
      await this.syncSessionToSupabase(session);
    }

    logger.info('Workout session resumed', { sessionId });
  }

  async updateWorkoutSession(sessionId: string, updatedWorkout: Workout): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.workout = updatedWorkout;
    session.syncStatus = 'pending';

    await this.saveSessionLocally(session);
    logger.info('Workout session updated', { sessionId });
  }

  async completeWorkoutSession(sessionId: string): Promise<WorkoutCompletionData> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      logger.info('Completing workout session', { sessionId });

      // Calculate final workout stats
      const completionData = await this.calculateWorkoutCompletion(session);

      // Update workout with completion data
      session.workout = {
        ...session.workout,
        ...completionData.workout,
        status: 'completed',
        completed_at: new Date(),
        duration: completionData.totalDuration,
        total_volume: completionData.totalVolume,
        total_reps: completionData.totalReps,
        total_sets: completionData.totalSets,
      };

      // Save completed workout
      await enhancedWorkoutService.saveWorkout(session.workout);

      // Process gamification rewards
      await this.processWorkoutRewards(session.workout, completionData);

      // Clean up session
      this.activeSessions.delete(sessionId);
      await this.clearSessionFromLocalStorage(sessionId);

      logger.info('Workout session completed successfully', { 
        sessionId, 
        duration: completionData.totalDuration,
        xpEarned: completionData.xpEarned 
      });

      return completionData;

    } catch (error) {
      logger.error('Error completing workout session', { error, sessionId });
      throw error;
    }
  }

  async cancelWorkoutSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Update workout status
    session.workout.status = 'cancelled';
    session.workout.cancelled_at = new Date();

    // Save final state
    await this.saveSessionLocally(session);
    
    if (navigator.onLine) {
      await this.syncSessionToSupabase(session);
    }

    // Clean up
    this.activeSessions.delete(sessionId);
    await this.clearSessionFromLocalStorage(sessionId);

    logger.info('Workout session cancelled', { sessionId });
  }

  // ============================================================================
  // Progress Tracking
  // ============================================================================

  getWorkoutProgress(sessionId: string): WorkoutProgress | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const { workout } = session;
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(set => set.completed).length, 
      0
    );
    
    const totalExercises = workout.exercises.length;
    const completedExercises = workout.exercises.filter(
      ex => ex.sets.every(set => set.completed)
    ).length;

    const elapsedTime = Math.floor(
      (Date.now() - session.startTime.getTime() - session.pausedDuration) / 1000
    );

    const progressPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    
    // Estimate remaining time based on current pace
    const estimatedTimeRemaining = this.estimateRemainingTime(session, progressPercentage);

    return {
      totalSets,
      completedSets,
      totalExercises,
      completedExercises,
      elapsedTime,
      estimatedTimeRemaining,
      progressPercentage
    };
  }

  // ============================================================================
  // Auto-Save and Recovery
  // ============================================================================

  private startAutoSaveInterval(): void {
    this.autoSaveInterval = setInterval(async () => {
      await this.autoSaveAllSessions();
    }, this.AUTO_SAVE_INTERVAL);
  }

  private async autoSaveAllSessions(): Promise<void> {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.isActive && session.autoSaveEnabled) {
        try {
          await this.saveSessionLocally(session);
          
          if (navigator.onLine && session.syncStatus === 'pending') {
            await this.syncSessionToSupabase(session);
          }
          
          session.lastSaveTime = new Date();
        } catch (error) {
          logger.error('Auto-save failed for session', { error, sessionId });
        }
      }
    }
  }

  async recoverWorkoutSessions(): Promise<WorkoutSession[]> {
    try {
      const recoveredSessions: WorkoutSession[] = [];
      
      // Check localStorage for session backups
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('workout_session_')) {
          try {
            const sessionData = localStorage.getItem(key);
            if (sessionData) {
              const session: WorkoutSession = JSON.parse(sessionData);
              
              // Only recover active sessions
              if (session.isActive && session.workout.status === 'in_progress') {
                this.activeSessions.set(session.id, session);
                recoveredSessions.push(session);
                logger.info('Recovered workout session', { sessionId: session.id });
              }
            }
          } catch (error) {
            logger.error('Error parsing session data', { error, key });
          }
        }
      }

      return recoveredSessions;
    } catch (error) {
      logger.error('Error recovering workout sessions', { error });
      return [];
    }
  }

  // ============================================================================
  // Supabase Integration
  // ============================================================================

  private async syncSessionToSupabase(session: WorkoutSession): Promise<void> {
    try {
      const supabaseWorkout = this.convertToSupabaseWorkout(session.workout);
      
      const { error } = await supabaseService.supabase
        .from('workout_sessions')
        .upsert(supabaseWorkout);

      if (error) {
        throw error;
      }

      session.syncStatus = 'synced';
      logger.info('Session synced to Supabase', { sessionId: session.id });

    } catch (error) {
      session.syncStatus = 'error';
      logger.error('Error syncing session to Supabase', { error, sessionId: session.id });
      
      // Schedule retry
      setTimeout(() => {
        if (navigator.onLine && session.syncStatus === 'error') {
          this.syncSessionToSupabase(session);
        }
      }, this.SYNC_RETRY_DELAY);
    }
  }

  private convertToSupabaseWorkout(workout: Workout): any {
    return {
      id: workout.id,
      user_id: workout.user_id,
      template_id: workout.template_id,
      name: workout.name,
      notes: workout.notes,
      started_at: workout.started_at?.toISOString(),
      completed_at: workout.completed_at?.toISOString(),
      duration_seconds: workout.duration,
      exercises: workout.exercises,
      total_volume_kg: workout.total_volume,
      total_reps: workout.total_reps,
      total_sets: workout.total_sets,
      calories_burned: workout.calories_burned,
      xp_earned: workout.xp_earned,
      achievements_unlocked: workout.achievements_unlocked,
      status: workout.status,
      created_at: workout.created_at?.toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // ============================================================================
  // Local Storage Management
  // ============================================================================

  private async saveSessionLocally(session: WorkoutSession): Promise<void> {
    try {
      const key = `workout_session_${session.id}`;
      const sessionData = {
        ...session,
        startTime: session.startTime.toISOString(),
        lastSaveTime: session.lastSaveTime.toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(sessionData));
      
      // Also save to IndexedDB for more reliable storage
      await dbManager.init();
      await dbManager.put('workoutSessions', session);
      
    } catch (error) {
      logger.error('Error saving session locally', { error, sessionId: session.id });
    }
  }

  private async clearSessionFromLocalStorage(sessionId: string): Promise<void> {
    try {
      const key = `workout_session_${sessionId}`;
      localStorage.removeItem(key);
      
      await dbManager.init();
      await dbManager.delete('workoutSessions', sessionId);
      
    } catch (error) {
      logger.error('Error clearing session from local storage', { error, sessionId });
    }
  }

  // ============================================================================
  // Workout Completion Processing
  // ============================================================================

  private async calculateWorkoutCompletion(session: WorkoutSession): Promise<WorkoutCompletionData> {
    const { workout } = session;
    
    // Calculate basic stats
    let totalVolume = 0;
    let totalReps = 0;
    let totalSets = 0;
    
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
          totalReps += set.reps;
          totalSets += 1;
        }
      });
    });

    const totalDuration = Math.floor(
      (Date.now() - session.startTime.getTime() - session.pausedDuration) / 1000
    );

    // Detect personal records
    const personalRecords = await this.detectPersonalRecords(workout);

    // Calculate XP (will be processed by gamification service)
    const baseXP = this.calculateBaseXP(totalVolume, totalDuration, totalSets);

    return {
      workout,
      totalDuration,
      totalVolume,
      totalReps,
      totalSets,
      personalRecords,
      achievements: [], // Will be populated by gamification service
      xpEarned: baseXP
    };
  }

  private async detectPersonalRecords(workout: Workout): Promise<Array<{
    exerciseId: string;
    type: 'weight' | 'reps' | 'volume';
    previousValue: number;
    newValue: number;
  }>> {
    const personalRecords: Array<{
      exerciseId: string;
      type: 'weight' | 'reps' | 'volume';
      previousValue: number;
      newValue: number;
    }> = [];

    // This would typically query the exercise_performances table
    // For now, we'll implement a basic version
    for (const exercise of workout.exercises) {
      const maxWeight = Math.max(...exercise.sets.filter(s => s.completed).map(s => s.weight || 0));
      const maxReps = Math.max(...exercise.sets.filter(s => s.completed).map(s => s.reps || 0));
      const totalVolume = exercise.sets
        .filter(s => s.completed)
        .reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);

      // TODO: Compare with historical data from Supabase
      // This is a simplified implementation
      if (maxWeight > 0) {
        personalRecords.push({
          exerciseId: exercise.exercise_id,
          type: 'weight',
          previousValue: 0, // Would come from historical data
          newValue: maxWeight
        });
      }
    }

    return personalRecords;
  }

  private calculateBaseXP(volume: number, duration: number, sets: number): number {
    // Base XP calculation formula
    const volumeXP = Math.floor(volume * 0.1);
    const durationXP = Math.floor(duration / 60) * 5; // 5 XP per minute
    const setXP = sets * 10; // 10 XP per completed set
    
    return volumeXP + durationXP + setXP;
  }

  private async processWorkoutRewards(workout: Workout, completionData: WorkoutCompletionData): Promise<void> {
    try {
      // Process through gamification service
      await realGamificationService.handleWorkoutCompleted(
        workout.user_id,
        workout.id,
        {
          total_volume_kg: completionData.totalVolume,
          duration_seconds: completionData.totalDuration,
          total_reps: completionData.totalReps,
          total_sets: completionData.totalSets,
          personal_records: completionData.personalRecords.map(pr => ({
            exercise_id: pr.exerciseId,
            type: pr.type,
            previous_value: pr.previousValue,
            new_value: pr.newValue
          }))
        }
      );

      // Update streak
      await realStreakService.recordWorkout(workout.user_id, workout.id);

    } catch (error) {
      logger.error('Error processing workout rewards', { error, workoutId: workout.id });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private estimateRemainingTime(session: WorkoutSession, progressPercentage: number): number {
    if (progressPercentage === 0) return 0;
    
    const elapsedTime = Date.now() - session.startTime.getTime() - session.pausedDuration;
    const estimatedTotalTime = (elapsedTime / progressPercentage) * 100;
    const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
    
    return Math.floor(remainingTime / 1000);
  }

  private handleOnline(): void {
    logger.info('Device came online, syncing pending sessions');
    
    // Sync all pending sessions
    for (const session of this.activeSessions.values()) {
      if (session.syncStatus === 'pending' || session.syncStatus === 'error') {
        this.syncSessionToSupabase(session);
      }
    }
  }

  private handleOffline(): void {
    logger.info('Device went offline, sessions will be saved locally');
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getActiveSession(sessionId: string): WorkoutSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getAllActiveSessions(): WorkoutSession[] {
    return Array.from(this.activeSessions.values());
  }

  isSessionActive(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    return session?.isActive || false;
  }

  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    this.activeSessions.clear();
    logger.info('WorkoutPlayerService cleaned up');
  }
}

export const workoutPlayerService = WorkoutPlayerService.getInstance();