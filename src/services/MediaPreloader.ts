import { mediaService } from './MediaService';
import { logger } from '@/utils/logger';
import type { Exercise } from '@/schemas/exercise';

interface PreloadStrategy {
  priority: 'high' | 'medium' | 'low';
  maxConcurrent: number;
  timeout: number;
}

interface PreloadJob {
  id: string;
  url: string;
  type: 'gif' | 'image' | 'video';
  category: 'exercise_gif' | 'muscle_diagram' | 'thumbnail' | 'instruction_image';
  priority: 'high' | 'medium' | 'low';
  exercise?: Exercise;
}

class MediaPreloader {
  private queue: PreloadJob[] = [];
  private activeJobs = new Set<string>();
  private completedJobs = new Set<string>();
  private failedJobs = new Set<string>();
  
  private readonly strategies: Record<string, PreloadStrategy> = {
    high: { priority: 'high', maxConcurrent: 3, timeout: 10000 },
    medium: { priority: 'medium', maxConcurrent: 2, timeout: 15000 },
    low: { priority: 'low', maxConcurrent: 1, timeout: 20000 }
  };

  /**
   * Preload exercise media based on user behavior patterns
   */
  async preloadExerciseMedia(exercises: Exercise[], strategy: 'aggressive' | 'conservative' | 'smart' = 'smart'): Promise<void> {
    const jobs: PreloadJob[] = [];

    exercises.forEach((exercise, index) => {
      // Determine priority based on position and strategy
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (strategy === 'aggressive') {
        priority = index < 5 ? 'high' : index < 15 ? 'medium' : 'low';
      } else if (strategy === 'conservative') {
        priority = index < 3 ? 'high' : 'low';
      } else { // smart
        priority = index < 8 ? 'high' : index < 20 ? 'medium' : 'low';
      }

      // Add GIF preload job
      if (exercise.gif_url) {
        jobs.push({
          id: `${exercise.id}-gif`,
          url: exercise.gif_url,
          type: 'gif',
          category: 'exercise_gif',
          priority,
          exercise
        });
      }

      // Add muscle diagram preload job (lower priority)
      if (exercise.muscle_diagram_url) {
        jobs.push({
          id: `${exercise.id}-diagram`,
          url: exercise.muscle_diagram_url,
          type: 'image',
          category: 'muscle_diagram',
          priority: priority === 'high' ? 'medium' : 'low',
          exercise
        });
      }

      // Add thumbnail if available
      if (exercise.thumbnail_url) {
        jobs.push({
          id: `${exercise.id}-thumb`,
          url: exercise.thumbnail_url,
          type: 'image',
          category: 'thumbnail',
          priority: 'high', // Thumbnails are always high priority
          exercise
        });
      }
    });

    // Sort by priority and add to queue
    const sortedJobs = jobs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    this.addToQueue(sortedJobs);
    await this.processQueue();
  }

  /**
   * Preload media for currently visible exercises
   */
  async preloadVisibleExercises(exercises: Exercise[]): Promise<void> {
    const jobs: PreloadJob[] = [];

    exercises.forEach(exercise => {
      if (exercise.gif_url) {
        jobs.push({
          id: `${exercise.id}-gif-visible`,
          url: exercise.gif_url,
          type: 'gif',
          category: 'exercise_gif',
          priority: 'high',
          exercise
        });
      }
    });

    this.addToQueue(jobs);
    await this.processQueue();
  }

  /**
   * Preload media for workout exercises
   */
  async preloadWorkoutMedia(exercises: Exercise[]): Promise<void> {
    const jobs: PreloadJob[] = [];

    exercises.forEach(exercise => {
      // High priority for workout exercises
      if (exercise.gif_url) {
        jobs.push({
          id: `${exercise.id}-workout-gif`,
          url: exercise.gif_url,
          type: 'gif',
          category: 'exercise_gif',
          priority: 'high',
          exercise
        });
      }

      if (exercise.muscle_diagram_url) {
        jobs.push({
          id: `${exercise.id}-workout-diagram`,
          url: exercise.muscle_diagram_url,
          type: 'image',
          category: 'muscle_diagram',
          priority: 'high',
          exercise
        });
      }
    });

    this.addToQueue(jobs);
    await this.processQueue();
  }

  /**
   * Add jobs to the preload queue
   */
  private addToQueue(jobs: PreloadJob[]): void {
    // Filter out already completed or active jobs
    const newJobs = jobs.filter(job => 
      !this.completedJobs.has(job.id) && 
      !this.activeJobs.has(job.id) &&
      !this.failedJobs.has(job.id)
    );

    this.queue.push(...newJobs);
    
    logger.debug('Added preload jobs to queue', { 
      newJobs: newJobs.length, 
      totalQueue: this.queue.length 
    });
  }

  /**
   * Process the preload queue
   */
  private async processQueue(): Promise<void> {
    const priorityGroups = {
      high: this.queue.filter(job => job.priority === 'high'),
      medium: this.queue.filter(job => job.priority === 'medium'),
      low: this.queue.filter(job => job.priority === 'low')
    };

    // Process high priority first, then medium, then low
    for (const [priority, jobs] of Object.entries(priorityGroups)) {
      if (jobs.length === 0) continue;

      const strategy = this.strategies[priority];
      await this.processBatch(jobs, strategy);
    }
  }

  /**
   * Process a batch of jobs with concurrency control
   */
  private async processBatch(jobs: PreloadJob[], strategy: PreloadStrategy): Promise<void> {
    const batches: PreloadJob[][] = [];
    
    // Split jobs into batches based on max concurrent
    for (let i = 0; i < jobs.length; i += strategy.maxConcurrent) {
      batches.push(jobs.slice(i, i + strategy.maxConcurrent));
    }

    for (const batch of batches) {
      const promises = batch.map(job => this.processJob(job, strategy.timeout));
      await Promise.allSettled(promises);
    }
  }

  /**
   * Process a single preload job
   */
  private async processJob(job: PreloadJob, timeout: number): Promise<void> {
    if (this.activeJobs.has(job.id) || this.completedJobs.has(job.id)) {
      return;
    }

    this.activeJobs.add(job.id);
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Preload timeout')), timeout);
      });

      // Race between media loading and timeout
      await Promise.race([
        mediaService.getMedia(job.url, job.type, job.category),
        timeoutPromise
      ]);

      this.completedJobs.add(job.id);
      
      logger.debug('Preload job completed', { 
        jobId: job.id, 
        url: job.url, 
        priority: job.priority 
      });

    } catch (error) {
      this.failedJobs.add(job.id);
      
      logger.warn('Preload job failed', { 
        jobId: job.id, 
        url: job.url, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      this.activeJobs.delete(job.id);
      // Remove from queue
      this.queue = this.queue.filter(queuedJob => queuedJob.id !== job.id);
    }
  }

  /**
   * Preload based on user interaction patterns
   */
  async preloadByUserBehavior(
    recentExercises: Exercise[],
    favoriteExercises: Exercise[],
    upcomingWorkout?: Exercise[]
  ): Promise<void> {
    const jobs: PreloadJob[] = [];

    // Highest priority: upcoming workout
    if (upcomingWorkout) {
      upcomingWorkout.forEach(exercise => {
        if (exercise.gif_url) {
          jobs.push({
            id: `${exercise.id}-upcoming-gif`,
            url: exercise.gif_url,
            type: 'gif',
            category: 'exercise_gif',
            priority: 'high',
            exercise
          });
        }
      });
    }

    // High priority: recent exercises
    recentExercises.slice(0, 5).forEach(exercise => {
      if (exercise.gif_url) {
        jobs.push({
          id: `${exercise.id}-recent-gif`,
          url: exercise.gif_url,
          type: 'gif',
          category: 'exercise_gif',
          priority: 'high',
          exercise
        });
      }
    });

    // Medium priority: favorite exercises
    favoriteExercises.slice(0, 10).forEach(exercise => {
      if (exercise.gif_url) {
        jobs.push({
          id: `${exercise.id}-favorite-gif`,
          url: exercise.gif_url,
          type: 'gif',
          category: 'exercise_gif',
          priority: 'medium',
          exercise
        });
      }
    });

    this.addToQueue(jobs);
    await this.processQueue();
  }

  /**
   * Get preloader statistics
   */
  getStats() {
    return {
      queueSize: this.queue.length,
      activeJobs: this.activeJobs.size,
      completedJobs: this.completedJobs.size,
      failedJobs: this.failedJobs.size,
      successRate: this.completedJobs.size / (this.completedJobs.size + this.failedJobs.size) || 0
    };
  }

  /**
   * Clear all preload data
   */
  clear(): void {
    this.queue = [];
    this.activeJobs.clear();
    this.completedJobs.clear();
    this.failedJobs.clear();
  }
}

export const mediaPreloader = new MediaPreloader();