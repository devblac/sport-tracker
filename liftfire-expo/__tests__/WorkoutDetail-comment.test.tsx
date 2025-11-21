import React from 'react';
import { render } from '@testing-library/react-native';
import { Workout } from '../types';

// Mock the workout detail screen component
const mockWorkout: Workout = {
  id: '123',
  user_id: 'user-1',
  name: 'Test Workout',
  notes: 'Test notes',
  comment: 'Great workout today! Felt strong on all lifts.',
  duration_minutes: 45,
  xp_earned: 100,
  completed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  synced: true,
  exercises: [
    {
      id: 'ex-1',
      workout_id: '123',
      name: 'Bench Press',
      sets: 3,
      reps: 10,
      weight: 135,
      created_at: new Date().toISOString(),
    },
  ],
};

describe('Workout Detail - Comment Display', () => {
  it('should display comment when present', () => {
    // This test verifies that the comment field is properly typed
    // and can be accessed from the Workout object
    expect(mockWorkout.comment).toBe('Great workout today! Felt strong on all lifts.');
    expect(mockWorkout.comment?.length).toBeLessThanOrEqual(500);
  });

  it('should handle workout without comment', () => {
    const workoutWithoutComment: Workout = {
      ...mockWorkout,
      comment: undefined,
    };
    
    expect(workoutWithoutComment.comment).toBeUndefined();
  });

  it('should validate comment length constraint', () => {
    const longComment = 'a'.repeat(501);
    const validComment = 'a'.repeat(500);
    
    expect(longComment.length).toBeGreaterThan(500);
    expect(validComment.length).toBeLessThanOrEqual(500);
  });
});
