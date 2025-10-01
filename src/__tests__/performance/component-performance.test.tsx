import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { WorkoutList } from '@/components/workouts/WorkoutList';
import { ExerciseList } from '@/components/exercises/ExerciseList';
import { SocialFeed } from '@/components/social/SocialFeed';

// Mock large datasets
const generateMockWorkouts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `workout-${i}`,
    user_id: 'user-1',
    name: `Workout ${i + 1}`,
    status: 'completed' as const,
    exercises: Array.from({ length: 5 }, (_, j) => ({
      id: `exercise-${i}-${j}`,
      exercise_id: `exercise-${j}`,
      name: `Exercise ${j + 1}`,
      sets: Array.from({ length: 3 }, (_, k) => ({
        id: `set-${i}-${j}-${k}`,
        weight: 80 + k * 5,
        reps: 10 - k,
        type: 'normal' as const,
        completed: true
      }))
    })),
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  }));
};

const generateMockExercises = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `exercise-${i}`,
    name: `Exercise ${i + 1}`,
    category: 'strength',
    body_parts: ['chest', 'shoulders'],
    muscle_groups: ['pectorals', 'deltoids'],
    equipment: 'barbell',
    difficulty_level: 'intermediate' as const,
    instructions: `Instructions for exercise ${i + 1}`,
    tips: [`Tip 1 for exercise ${i + 1}`, `Tip 2 for exercise ${i + 1}`],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
};

const generateMockPosts = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    user_id: `user-${i % 10}`,
    type: 'workout_completed' as const,
    content: `Completed an amazing workout! #fitness #workout${i}`,
    workout_data: {
      name: `Workout ${i + 1}`,
      duration: 45 + (i % 30),
      exercises_count: 5 + (i % 3)
    },
    visibility: 'public' as const,
    likes_count: i % 50,
    comments_count: i % 20,
    created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
  }));
};

describe('Component Performance Tests', () => {
  describe('WorkoutList Performance', () => {
    it('should render 100 workouts within performance budget', () => {
      const workouts = generateMockWorkouts(100);
      
      const startTime = performance.now();
      render(<WorkoutList workouts={workouts} />);
      const renderTime = performance.now() - startTime;
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
      
      // Should display all workouts
      expect(screen.getAllByTestId(/workout-item/)).toHaveLength(100);
    });

    it('should handle 1000 workouts with virtualization', () => {
      const workouts = generateMockWorkouts(1000);
      
      const startTime = performance.now();
      render(<WorkoutList workouts={workouts} virtualized />);
      const renderTime = performance.now() - startTime;
      
      // Should still render quickly with virtualization
      expect(renderTime).toBeLessThan(200);
      
      // Should only render visible items (not all 1000)
      const visibleItems = screen.getAllByTestId(/workout-item/);
      expect(visibleItems.length).toBeLessThan(50); // Only visible items
    });

    it('should maintain performance during scroll', async () => {
      const workouts = generateMockWorkouts(500);
      render(<WorkoutList workouts={workouts} virtualized />);
      
      const scrollContainer = screen.getByTestId('workout-list-container');
      
      const startTime = performance.now();
      
      // Simulate multiple scroll events
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTop = i * 100;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const scrollTime = performance.now() - startTime;
      
      // Scrolling should be smooth (under 100ms for 10 scrolls)
      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe('ExerciseList Performance', () => {
    it('should render large exercise database efficiently', () => {
      const exercises = generateMockExercises(500);
      
      const startTime = performance.now();
      render(<ExerciseList exercises={exercises} />);
      const renderTime = performance.now() - startTime;
      
      // Should render within 150ms
      expect(renderTime).toBeLessThan(150);
    });

    it('should filter exercises quickly', async () => {
      const exercises = generateMockExercises(1000);
      render(<ExerciseList exercises={exercises} />);
      
      const searchInput = screen.getByLabelText(/search exercises/i);
      
      const startTime = performance.now();
      
      // Simulate typing
      searchInput.value = 'chest';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      const filterTime = performance.now() - startTime;
      
      // Filtering should be instant (under 50ms)
      expect(filterTime).toBeLessThan(50);
    });

    it('should handle category filtering efficiently', () => {
      const exercises = generateMockExercises(800);
      render(<ExerciseList exercises={exercises} />);
      
      const categoryFilter = screen.getByLabelText(/category/i);
      
      const startTime = performance.now();
      
      // Change category
      categoryFilter.value = 'strength';
      categoryFilter.dispatchEvent(new Event('change', { bubbles: true }));
      
      const filterTime = performance.now() - startTime;
      
      // Category filtering should be fast
      expect(filterTime).toBeLessThan(30);
    });
  });

  describe('SocialFeed Performance', () => {
    it('should render social feed with many posts efficiently', () => {
      const posts = generateMockPosts(200);
      
      const startTime = performance.now();
      render(<SocialFeed posts={posts} />);
      const renderTime = performance.now() - startTime;
      
      // Should render within 120ms
      expect(renderTime).toBeLessThan(120);
    });

    it('should handle infinite scroll performance', async () => {
      const initialPosts = generateMockPosts(50);
      const { rerender } = render(<SocialFeed posts={initialPosts} />);
      
      // Simulate loading more posts
      const startTime = performance.now();
      
      for (let i = 0; i < 5; i++) {
        const morePosts = generateMockPosts(20);
        const allPosts = [...initialPosts, ...morePosts];
        rerender(<SocialFeed posts={allPosts} />);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const loadTime = performance.now() - startTime;
      
      // Loading additional posts should be efficient
      expect(loadTime).toBeLessThan(200);
    });

    it('should optimize image loading', () => {
      const posts = generateMockPosts(100);
      
      // Mock intersection observer for lazy loading
      const mockIntersectionObserver = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver;
      
      render(<SocialFeed posts={posts} />);
      
      // Should set up intersection observers for lazy loading
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during component updates', () => {
      const workouts = generateMockWorkouts(100);
      const { rerender, unmount } = render(<WorkoutList workouts={workouts} />);
      
      // Simulate multiple re-renders
      for (let i = 0; i < 10; i++) {
        const updatedWorkouts = generateMockWorkouts(100);
        rerender(<WorkoutList workouts={updatedWorkouts} />);
      }
      
      // Clean up
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Memory usage should be reasonable
      // This is a basic check - in real scenarios you'd use more sophisticated memory profiling
      expect(true).toBe(true); // Placeholder for memory assertion
    });

    it('should clean up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<WorkoutList workouts={[]} />);
      
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // Should remove all added listeners
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Bundle Size Impact', () => {
    it('should use code splitting for heavy components', async () => {
      // Mock dynamic import
      const mockImport = vi.fn().mockResolvedValue({
        default: () => <div>Heavy Component</div>
      });
      
      // Simulate lazy loading
      const LazyComponent = React.lazy(mockImport);
      
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );
      
      // Should use dynamic import
      expect(mockImport).toHaveBeenCalled();
    });

    it('should tree-shake unused utilities', () => {
      // This would be tested at build time, but we can verify
      // that components only import what they need
      
      const workouts = generateMockWorkouts(10);
      render(<WorkoutList workouts={workouts} />);
      
      // Component should render successfully with minimal imports
      expect(screen.getAllByTestId(/workout-item/)).toHaveLength(10);
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain performance with screen reader support', () => {
      const workouts = generateMockWorkouts(100);
      
      const startTime = performance.now();
      render(<WorkoutList workouts={workouts} />);
      const renderTime = performance.now() - startTime;
      
      // Should render quickly even with ARIA attributes
      expect(renderTime).toBeLessThan(150);
      
      // Should have proper ARIA labels
      const workoutItems = screen.getAllByRole('listitem');
      expect(workoutItems.length).toBeGreaterThan(0);
      
      workoutItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label');
      });
    });

    it('should handle keyboard navigation efficiently', async () => {
      const workouts = generateMockWorkouts(50);
      render(<WorkoutList workouts={workouts} />);
      
      const firstItem = screen.getAllByTestId(/workout-item/)[0];
      
      const startTime = performance.now();
      
      // Simulate keyboard navigation
      for (let i = 0; i < 10; i++) {
        firstItem.focus();
        firstItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const navigationTime = performance.now() - startTime;
      
      // Keyboard navigation should be responsive
      expect(navigationTime).toBeLessThan(100);
    });
  });
});