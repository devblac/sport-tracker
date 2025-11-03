// Basic test to verify database functions are properly exported
import { 
  initializeDatabase, 
  whitelistWorkoutData, 
  whitelistExerciseData,
  getDatabaseStats 
} from '../lib/database';

describe('Database Module', () => {
  it('should export required functions', () => {
    expect(typeof initializeDatabase).toBe('function');
    expect(typeof whitelistWorkoutData).toBe('function');
    expect(typeof whitelistExerciseData).toBe('function');
    expect(typeof getDatabaseStats).toBe('function');
  });

  it('should whitelist workout data correctly', () => {
    const mockWorkout = {
      id: 'test-id',
      user_id: 'user-123',
      name: 'Test Workout',
      notes: 'Some notes',
      duration_minutes: 60,
      xp_earned: 100,
      completed_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      synced: false,
      // This should be filtered out
      maliciousField: '<script>alert("xss")</script>'
    };

    const whitelisted = whitelistWorkoutData(mockWorkout);
    
    expect(whitelisted.id).toBe('test-id');
    expect(whitelisted.name).toBe('Test Workout');
    expect(whitelisted.synced).toBe(false);
    expect((whitelisted as any).maliciousField).toBeUndefined();
  });

  it('should whitelist exercise data correctly', () => {
    const mockExercise = {
      id: 'exercise-id',
      workout_id: 'workout-123',
      name: 'Push-ups',
      sets: 3,
      reps: 10,
      weight: 0,
      notes: 'Bodyweight',
      created_at: '2024-01-01T00:00:00Z',
      // This should be filtered out
      maliciousField: 'bad data'
    };

    const whitelisted = whitelistExerciseData(mockExercise);
    
    expect(whitelisted.id).toBe('exercise-id');
    expect(whitelisted.name).toBe('Push-ups');
    expect(whitelisted.sets).toBe(3);
    expect(whitelisted.reps).toBe(10);
    expect((whitelisted as any).maliciousField).toBeUndefined();
  });

  it('should sanitize text inputs', () => {
    const mockWorkout = {
      name: '<script>alert("xss")</script>Test Workout',
      notes: 'Some notes with <div>html</div> tags'
    };

    const whitelisted = whitelistWorkoutData(mockWorkout);
    
    expect(whitelisted.name).toBe('scriptalert("xss")/scriptTest Workout');
    expect(whitelisted.notes).toBe('Some notes with divhtml/div tags');
  });
});