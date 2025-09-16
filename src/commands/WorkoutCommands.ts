import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';
import { logger } from '@/utils';

// Base command interface
interface ICommand {
  execute(): Promise<void>;
  undo(): Promise<void>;
  canUndo(): boolean;
}

// Command for starting a workout
export class StartWorkoutCommand implements ICommand {
  private previousState: Workout | null = null;
  
  constructor(
    private workoutId: string,
    private workoutRepository: any, // Replace with proper interface
    private onStateChange: (workout: Workout) => void
  ) {}

  async execute(): Promise<void> {
    const workout = await this.workoutRepository.findById(this.workoutId);
    if (!workout) throw new Error('Workout not found');
    
    this.previousState = { ...workout };
    
    const updatedWorkout = {
      ...workout,
      status: 'in_progress' as const,
      started_at: new Date(),
    };
    
    await this.workoutRepository.update(this.workoutId, updatedWorkout);
    this.onStateChange(updatedWorkout);
    
    logger.info('Workout started', { workoutId: this.workoutId });
  }

  async undo(): Promise<void> {
    if (!this.previousState) return;
    
    await this.workoutRepository.update(this.workoutId, this.previousState);
    this.onStateChange(this.previousState);
    
    logger.info('Workout start undone', { workoutId: this.workoutId });
  }

  canUndo(): boolean {
    return this.previousState !== null;
  }
}

// Command for logging a set
export class LogSetCommand implements ICommand {
  private previousExercise: WorkoutExercise | null = null;
  
  constructor(
    private workoutId: string,
    private exerciseId: string,
    private setData: SetData,
    private workoutRepository: any,
    private onStateChange: (workout: Workout) => void
  ) {}

  async execute(): Promise<void> {
    const workout = await this.workoutRepository.findById(this.workoutId);
    if (!workout) throw new Error('Workout not found');
    
    const exerciseIndex = workout.exercises.findIndex(e => e.exercise_id === this.exerciseId);
    if (exerciseIndex === -1) throw new Error('Exercise not found');
    
    this.previousExercise = { ...workout.exercises[exerciseIndex] };
    
    const updatedExercise = {
      ...workout.exercises[exerciseIndex],
      sets: [...workout.exercises[exerciseIndex].sets, {
        ...this.setData,
        completed: true,
        completed_at: new Date(),
      }],
    };
    
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((ex, idx) => 
        idx === exerciseIndex ? updatedExercise : ex
      ),
    };
    
    await this.workoutRepository.update(this.workoutId, updatedWorkout);
    this.onStateChange(updatedWorkout);
    
    logger.info('Set logged', { workoutId: this.workoutId, exerciseId: this.exerciseId });
  }

  async undo(): Promise<void> {
    if (!this.previousExercise) return;
    
    const workout = await this.workoutRepository.findById(this.workoutId);
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map(ex => 
        ex.exercise_id === this.exerciseId ? this.previousExercise! : ex
      ),
    };
    
    await this.workoutRepository.update(this.workoutId, updatedWorkout);
    this.onStateChange(updatedWorkout);
    
    logger.info('Set log undone', { workoutId: this.workoutId, exerciseId: this.exerciseId });
  }

  canUndo(): boolean {
    return this.previousExercise !== null;
  }
}

// Command manager for undo/redo functionality
export class CommandManager {
  private history: ICommand[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  async execute(command: ICommand): Promise<void> {
    await command.execute();
    
    // Remove any commands after current index (for redo scenarios)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new command
    this.history.push(command);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  async undo(): Promise<boolean> {
    if (!this.canUndo()) return false;
    
    const command = this.history[this.currentIndex];
    await command.undo();
    this.currentIndex--;
    
    return true;
  }

  async redo(): Promise<boolean> {
    if (!this.canRedo()) return false;
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    await command.execute();
    
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0 && 
           this.history[this.currentIndex]?.canUndo();
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}