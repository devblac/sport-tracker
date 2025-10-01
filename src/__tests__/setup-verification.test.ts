/**
 * Test Setup Verification
 * Ensures our testing infrastructure is working correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { createMockUser, createMockWorkout, createMockExercise } from '@/test/test-factories';

describe('Test Setup Verification', () => {
  it('should have working test factories', () => {
    const user = createMockUser();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('display_name');
    expect(user).toHaveProperty('role');
  });

  it('should create mock workouts', () => {
    const workout = createMockWorkout();
    expect(workout).toHaveProperty('id');
    expect(workout).toHaveProperty('name');
    expect(workout).toHaveProperty('status');
    expect(workout).toHaveProperty('exercises');
    expect(Array.isArray(workout.exercises)).toBe(true);
  });

  it('should create mock exercises', () => {
    const exercise = createMockExercise();
    expect(exercise).toHaveProperty('id');
    expect(exercise).toHaveProperty('name');
    expect(exercise).toHaveProperty('category');
    expect(exercise).toHaveProperty('instructions');
  });

  it('should have working mocks', () => {
    const mockFn = vi.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should have environment variables', () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });

  it('should have localStorage mock', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
    localStorage.removeItem('test');
    expect(localStorage.getItem('test')).toBeNull();
  });
});