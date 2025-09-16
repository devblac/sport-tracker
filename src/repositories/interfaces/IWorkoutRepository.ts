import type { Workout, WorkoutFilter, WorkoutCreate, WorkoutUpdate } from '@/schemas/workout';

export interface IWorkoutRepository {
  // Query methods
  findById(id: string): Promise<Workout | null>;
  findByUserId(userId: string, filter?: WorkoutFilter): Promise<Workout[]>;
  findTemplates(userId: string): Promise<Workout[]>;
  
  // Mutation methods
  create(workout: WorkoutCreate): Promise<Workout>;
  update(id: string, updates: WorkoutUpdate): Promise<Workout>;
  delete(id: string): Promise<void>;
  
  // Batch operations
  createMany(workouts: WorkoutCreate[]): Promise<Workout[]>;
  updateMany(updates: Array<{ id: string; data: WorkoutUpdate }>): Promise<Workout[]>;
  
  // Cache management
  invalidateCache(pattern?: string): Promise<void>;
  prefetch(ids: string[]): Promise<void>;
}