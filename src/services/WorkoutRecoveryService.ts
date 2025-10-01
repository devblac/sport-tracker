/**
 * WorkoutRecoveryService - Handles workout session recovery and restoration
 * 
 * Provides functionality to recover interrupted workout sessions from various
 * storage mechanisms and restore them to a consistent state.
 */

import { workoutPlayerService } from './WorkoutPlayerService';
import { enhancedWorkoutService } from './EnhancedWorkoutService';
import { dbManager } from '@/db/IndexedDBManager';
import type { Workout } from '@/schemas/workout';
import type { WorkoutSession } from './WorkoutPlayerService';
import { logger } from '@/utils/logger';

export interface RecoveryCandidate {
  id: string;
  workout: Workout;
  lastSaved: Date;
  source: 'localStorage' | 'indexedDB' | 'supabase';
  isCorrupted: boolean;
  canRecover: boolean;
  estimatedProgress: number;
}

export interface RecoveryResult {
  success: boolean;
  recoveredSessions: WorkoutSession[];
  failedRecoveries: Array<{
    id: string;
    error: string;
    source: string;
  }>;
  totalCandidates: number;
  corruptedSessions: number;
}

export class WorkoutRecoveryService {
  private static instance: WorkoutRecoveryService;

  private constructor() {}

  public static getInstance(): WorkoutRecoveryService {
    if (!WorkoutRecoveryService.instance) {
      WorkoutRecoveryService.instance = new WorkoutRecoveryService();
    }
    return WorkoutRecoveryService.instance;
  }

  // ============================================================================
  // Main Recovery Methods
  // ============================================================================

  async recoverAllWorkoutSessions(): Promise<RecoveryResult> {
    logger.info('Starting comprehensive workout session recovery');

    const result: RecoveryResult = {
      success: true,
      recoveredSessions: [],
      failedRecoveries: [],
      totalCandidates: 0,
      corruptedSessions: 0
    };

    try {
      // Find all recovery candidates from different sources
      const candidates = await this.findRecoveryCandidates();
      result.totalCandidates = candidates.length;

      logger.info(`Found ${candidates.length} recovery candidates`);

      // Process each candidate
      for (const candidate of candidates) {
        try {
          if (candidate.canRecover && !candidate.isCorrupted) {
            const session = await this.recoverWorkoutSession(candidate);
            if (session) {
              result.recoveredSessions.push(session);
              logger.info(`Successfully recovered session: ${candidate.id}`);
            }
          } else {
            if (candidate.isCorrupted) {
              result.corruptedSessions++;
              logger.warn(`Skipping corrupted session: ${candidate.id}`);
            } else {
              logger.info(`Skipping non-recoverable session: ${candidate.id}`);
            }
          }
        } catch (error) {
          result.failedRecoveries.push({
            id: candidate.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            source: candidate.source
          });
          logger.error(`Failed to recover session ${candidate.id}:`, error);
        }
      }

      // Clean up old/corrupted data
      await this.cleanupCorruptedSessions(candidates.filter(c => c.isCorrupted));

      result.success = result.failedRecoveries.length === 0;

      logger.info('Workout session recovery completed', {
        recovered: result.recoveredSessions.length,
        failed: result.failedRecoveries.length,
        corrupted: result.corruptedSessions,
        total: result.totalCandidates
      });

      return result;

    } catch (error) {
      logger.error('Error during workout session recovery:', error);
      result.success = false;
      return result;
    }
  }

  async recoverSpecificSession(sessionId: string): Promise<WorkoutSession | null> {
    logger.info(`Attempting to recover specific session: ${sessionId}`);

    try {
      const candidates = await this.findRecoveryCandidates();
      const candidate = candidates.find(c => c.id === sessionId);

      if (!candidate) {
        logger.warn(`No recovery candidate found for session: ${sessionId}`);
        return null;
      }

      if (!candidate.canRecover || candidate.isCorrupted) {
        logger.warn(`Session ${sessionId} cannot be recovered (corrupted: ${candidate.isCorrupted})`);
        return null;
      }

      return await this.recoverWorkoutSession(candidate);

    } catch (error) {
      logger.error(`Error recovering specific session ${sessionId}:`, error);
      return null;
    }
  }

  // ============================================================================
  // Recovery Candidate Discovery
  // ============================================================================

  private async findRecoveryCandidates(): Promise<RecoveryCandidate[]> {
    const candidates: RecoveryCandidate[] = [];

    // Check localStorage
    const localStorageCandidates = await this.findLocalStorageCandidates();
    candidates.push(...localStorageCandidates);

    // Check IndexedDB
    const indexedDBCandidates = await this.findIndexedDBCandidates();
    candidates.push(...indexedDBCandidates);

    // TODO: Check Supabase for cloud-stored sessions
    // const supabaseCandidates = await this.findSupabaseCandidates();
    // candidates.push(...supabaseCandidates);

    // Deduplicate candidates (prefer most recent)
    const deduplicatedCandidates = this.deduplicateCandidates(candidates);

    return deduplicatedCandidates;
  }

  private async findLocalStorageCandidates(): Promise<RecoveryCandidate[]> {
    const candidates: RecoveryCandidate[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('workout_session_')) {
          try {
            const sessionData = localStorage.getItem(key);
            if (sessionData) {
              const parsed = JSON.parse(sessionData);
              const candidate = await this.validateAndCreateCandidate(parsed, 'localStorage');
              if (candidate) {
                candidates.push(candidate);
              }
            }
          } catch (error) {
            logger.warn(`Failed to parse localStorage session data for key: ${key}`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning localStorage for recovery candidates:', error);
    }

    return candidates;
  }

  private async findIndexedDBCandidates(): Promise<RecoveryCandidate[]> {
    const candidates: RecoveryCandidate[] = [];

    try {
      await dbManager.init();
      const sessions = await dbManager.getAll<WorkoutSession>('workoutSessions');

      for (const session of sessions) {
        if (session.isActive && session.workout.status === 'in_progress') {
          const candidate = await this.validateAndCreateCandidate(session, 'indexedDB');
          if (candidate) {
            candidates.push(candidate);
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning IndexedDB for recovery candidates:', error);
    }

    return candidates;
  }

  private async validateAndCreateCandidate(
    sessionData: any, 
    source: 'localStorage' | 'indexedDB' | 'supabase'
  ): Promise<RecoveryCandidate | null> {
    try {
      // Basic validation
      if (!sessionData || !sessionData.id || !sessionData.workout) {
        return null;
      }

      const workout = sessionData.workout;
      
      // Check if workout is in a recoverable state
      const isRecoverable = workout.status === 'in_progress' || workout.status === 'paused';
      if (!isRecoverable) {
        return null;
      }

      // Validate workout structure
      const isCorrupted = this.isWorkoutDataCorrupted(workout);
      
      // Calculate estimated progress
      const estimatedProgress = this.calculateWorkoutProgress(workout);

      // Parse dates
      const lastSaved = sessionData.lastSaveTime 
        ? new Date(sessionData.lastSaveTime)
        : new Date(sessionData.startTime || Date.now());

      return {
        id: sessionData.id,
        workout,
        lastSaved,
        source,
        isCorrupted,
        canRecover: !isCorrupted && isRecoverable,
        estimatedProgress
      };

    } catch (error) {
      logger.warn(`Failed to validate recovery candidate from ${source}:`, error);
      return null;
    }
  }

  private isWorkoutDataCorrupted(workout: any): boolean {
    try {
      // Check required fields
      if (!workout.id || !workout.user_id || !workout.exercises) {
        return true;
      }

      // Check exercises structure
      if (!Array.isArray(workout.exercises)) {
        return true;
      }

      // Check each exercise
      for (const exercise of workout.exercises) {
        if (!exercise.id || !exercise.exercise_id || !exercise.sets) {
          return true;
        }

        if (!Array.isArray(exercise.sets)) {
          return true;
        }

        // Check each set
        for (const set of exercise.sets) {
          if (!set.id || typeof set.set_number !== 'number') {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      return true;
    }
  }

  private calculateWorkoutProgress(workout: any): number {
    try {
      const totalSets = workout.exercises.reduce((sum: number, ex: any) => 
        sum + (ex.sets?.length || 0), 0);
      
      const completedSets = workout.exercises.reduce((sum: number, ex: any) => 
        sum + (ex.sets?.filter((set: any) => set.completed).length || 0), 0);

      return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    } catch (error) {
      return 0;
    }
  }

  private deduplicateCandidates(candidates: RecoveryCandidate[]): RecoveryCandidate[] {
    const candidateMap = new Map<string, RecoveryCandidate>();

    for (const candidate of candidates) {
      const existing = candidateMap.get(candidate.id);
      
      if (!existing || candidate.lastSaved > existing.lastSaved) {
        candidateMap.set(candidate.id, candidate);
      }
    }

    return Array.from(candidateMap.values());
  }

  // ============================================================================
  // Session Recovery
  // ============================================================================

  private async recoverWorkoutSession(candidate: RecoveryCandidate): Promise<WorkoutSession | null> {
    try {
      logger.info(`Recovering workout session from ${candidate.source}:`, candidate.id);

      // Restore the workout session through the player service
      const session = await workoutPlayerService.startWorkoutSession(candidate.workout);

      // Restore session state
      if (candidate.workout.status === 'paused') {
        await workoutPlayerService.pauseWorkoutSession(session.id);
      }

      logger.info(`Successfully recovered session: ${candidate.id} (${candidate.estimatedProgress}% complete)`);
      
      return session;

    } catch (error) {
      logger.error(`Failed to recover session ${candidate.id}:`, error);
      return null;
    }
  }

  // ============================================================================
  // Cleanup Methods
  // ============================================================================

  private async cleanupCorruptedSessions(corruptedCandidates: RecoveryCandidate[]): Promise<void> {
    logger.info(`Cleaning up ${corruptedCandidates.length} corrupted sessions`);

    for (const candidate of corruptedCandidates) {
      try {
        if (candidate.source === 'localStorage') {
          const key = `workout_session_${candidate.id}`;
          localStorage.removeItem(key);
        } else if (candidate.source === 'indexedDB') {
          await dbManager.init();
          await dbManager.delete('workoutSessions', candidate.id);
        }
        
        logger.info(`Cleaned up corrupted session: ${candidate.id}`);
      } catch (error) {
        logger.error(`Failed to cleanup corrupted session ${candidate.id}:`, error);
      }
    }
  }

  async cleanupOldSessions(olderThanDays: number = 7): Promise<number> {
    logger.info(`Cleaning up workout sessions older than ${olderThanDays} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleanedCount = 0;

    try {
      // Clean localStorage
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('workout_session_')) {
          try {
            const sessionData = localStorage.getItem(key);
            if (sessionData) {
              const parsed = JSON.parse(sessionData);
              const lastSaved = new Date(parsed.lastSaveTime || parsed.startTime);
              
              if (lastSaved < cutoffDate) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse it, it's probably corrupted, so remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleanedCount++;
      });

      // Clean IndexedDB
      await dbManager.init();
      const sessions = await dbManager.getAll<WorkoutSession>('workoutSessions');
      
      for (const session of sessions) {
        const lastSaved = new Date(session.lastSaveTime);
        if (lastSaved < cutoffDate) {
          await dbManager.delete('workoutSessions', session.id);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old workout sessions`);
      return cleanedCount;

    } catch (error) {
      logger.error('Error cleaning up old sessions:', error);
      return cleanedCount;
    }
  }

  // ============================================================================
  // Recovery Statistics
  // ============================================================================

  async getRecoveryStatistics(): Promise<{
    totalCandidates: number;
    recoverableSessions: number;
    corruptedSessions: number;
    sourceBreakdown: Record<string, number>;
    progressDistribution: Record<string, number>;
  }> {
    const candidates = await this.findRecoveryCandidates();
    
    const stats = {
      totalCandidates: candidates.length,
      recoverableSessions: candidates.filter(c => c.canRecover).length,
      corruptedSessions: candidates.filter(c => c.isCorrupted).length,
      sourceBreakdown: {} as Record<string, number>,
      progressDistribution: {} as Record<string, number>
    };

    // Source breakdown
    candidates.forEach(candidate => {
      stats.sourceBreakdown[candidate.source] = (stats.sourceBreakdown[candidate.source] || 0) + 1;
    });

    // Progress distribution
    candidates.forEach(candidate => {
      const progressRange = this.getProgressRange(candidate.estimatedProgress);
      stats.progressDistribution[progressRange] = (stats.progressDistribution[progressRange] || 0) + 1;
    });

    return stats;
  }

  private getProgressRange(progress: number): string {
    if (progress === 0) return '0%';
    if (progress <= 25) return '1-25%';
    if (progress <= 50) return '26-50%';
    if (progress <= 75) return '51-75%';
    if (progress <= 99) return '76-99%';
    return '100%';
  }
}

export const workoutRecoveryService = WorkoutRecoveryService.getInstance();