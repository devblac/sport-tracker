import { whitelistWorkoutData } from '../lib/database';

// Simple unit tests for comment field handling

describe('useWorkouts - Comment Handling', () => {
  it('should whitelist comment field in workout data', () => {
    const mockWorkout = {
      id: 'test-id',
      user_id: 'user-123',
      name: 'Test Workout',
      notes: 'Some notes',
      comment: 'Great workout today!',
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
    expect(whitelisted.comment).toBe('Great workout today!');
    expect(whitelisted.synced).toBe(false);
    expect((whitelisted as any).maliciousField).toBeUndefined();
  });

  it('should handle workouts without comments', () => {
    const mockWorkout = {
      id: 'test-id',
      user_id: 'user-123',
      name: 'Test Workout',
      notes: 'Some notes',
      duration_minutes: 60,
      xp_earned: 100,
      completed_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      synced: false
    };

    const whitelisted = whitelistWorkoutData(mockWorkout);
    
    expect(whitelisted.id).toBe('test-id');
    expect(whitelisted.name).toBe('Test Workout');
    expect(whitelisted.comment).toBeUndefined();
  });

  it('should sanitize comment text', () => {
    const mockWorkout = {
      id: 'test-id',
      user_id: 'user-123',
      name: 'Test Workout',
      comment: '<script>alert("xss")</script>Great workout!',
      duration_minutes: 60,
      xp_earned: 100,
      completed_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      synced: false
    };

    const whitelisted = whitelistWorkoutData(mockWorkout);
    
    // Comment should be sanitized (HTML tags removed)
    expect(whitelisted.comment).not.toContain('<script>');
    expect(whitelisted.comment).not.toContain('</script>');
  });
});
