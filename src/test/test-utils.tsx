import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { GamificationProvider } from '@/contexts/GamificationContext';

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  withRouter?: boolean;
  withTheme?: boolean;
  withWorkout?: boolean;
  withGamification?: boolean;
}

const AllTheProviders: React.FC<{ 
  children: React.ReactNode;
  options?: CustomRenderOptions;
}> = ({ children, options = {} }) => {
  const {
    withRouter = true,
    withTheme = true,
    withWorkout = false,
    withGamification = false
  } = options;

  let component = <>{children}</>;

  if (withGamification) {
    component = <GamificationProvider>{component}</GamificationProvider>;
  }

  if (withWorkout) {
    component = <WorkoutProvider>{component}</WorkoutProvider>;
  }

  if (withTheme) {
    component = <ThemeProvider>{component}</ThemeProvider>;
  }

  if (withRouter) {
    component = <BrowserRouter>{component}</BrowserRouter>;
  }

  return component;
};

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} options={options} />,
    ...options,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Custom matchers for testing
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidWorkout: (received: any) => {
    const requiredFields = ['id', 'user_id', 'name', 'status', 'exercises'];
    const hasAllFields = requiredFields.every(field => field in received);
    
    if (hasAllFields) {
      return {
        message: () => `expected workout not to have all required fields`,
        pass: true,
      };
    } else {
      const missingFields = requiredFields.filter(field => !(field in received));
      return {
        message: () => `expected workout to have fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },

  toHaveValidXPGain: (received: any) => {
    const isValid = 
      typeof received === 'object' &&
      typeof received.xp === 'number' &&
      received.xp > 0 &&
      typeof received.reason === 'string' &&
      received.reason.length > 0;

    if (isValid) {
      return {
        message: () => `expected XP gain not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected XP gain to have positive xp number and non-empty reason string`,
        pass: false,
      };
    }
  }
};

// Mock data generators
export const mockDataGenerators = {
  user: (overrides = {}) => ({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    role: 'basic' as const,
    profile: {
      fitness_level: 'intermediate' as const,
      goals: ['strength', 'muscle_gain'],
      scheduled_days: ['monday', 'wednesday', 'friday']
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  workout: (overrides = {}) => ({
    id: `workout-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-id',
    name: 'Test Workout',
    status: 'planned' as const,
    exercises: [],
    started_at: null,
    completed_at: null,
    is_template: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  exercise: (overrides = {}) => ({
    id: `exercise-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Exercise',
    category: 'strength' as const,
    body_parts: ['chest'],
    muscle_groups: ['pectorals'],
    equipment: 'barbell',
    difficulty_level: 'intermediate' as const,
    instructions: 'Test exercise instructions',
    tips: ['Keep your form strict', 'Control the weight'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  workoutExercise: (overrides = {}) => ({
    id: `workout-exercise-${Math.random().toString(36).substr(2, 9)}`,
    exercise_id: 'test-exercise-id',
    name: 'Test Exercise',
    sets: [],
    ...overrides
  }),

  set: (overrides = {}) => ({
    id: `set-${Math.random().toString(36).substr(2, 9)}`,
    weight: 80,
    reps: 10,
    type: 'normal' as const,
    completed: false,
    ...overrides
  }),

  socialPost: (overrides = {}) => ({
    id: `post-${Math.random().toString(36).substr(2, 9)}`,
    user_id: 'test-user-id',
    type: 'workout_completed' as const,
    content: 'Just completed an amazing workout!',
    workout_data: {
      name: 'Test Workout',
      duration: 45,
      exercises_count: 5
    },
    visibility: 'public' as const,
    likes_count: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }),

  achievement: (overrides = {}) => ({
    id: `achievement-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Achievement',
    description: 'Complete your first workout',
    category: 'workout' as const,
    rarity: 'common' as const,
    xp_reward: 50,
    icon: '🏆',
    requirements: {
      type: 'workout_count',
      target: 1
    },
    ...overrides
  })
};

// Test helpers for common operations
export const testHelpers = {
  // Wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Simulate user typing with realistic delays
  simulateTyping: async (element: HTMLElement, text: string, delay = 50) => {
    for (const char of text) {
      element.focus();
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      element.dispatchEvent(new KeyboardEvent('keypress', { key: char }));
      (element as HTMLInputElement).value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      await testHelpers.waitForAsync(delay);
    }
  },

  // Mock API responses
  mockApiResponse: (data: any, status = 200, delay = 0) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data))
        });
      }, delay);
    });
  },

  // Create mock store state
  createMockStoreState: (overrides = {}) => ({
    auth: {
      user: mockDataGenerators.user(),
      isAuthenticated: true,
      isLoading: false,
      error: null
    },
    workout: {
      workouts: [],
      currentWorkout: null,
      isWorkoutActive: false,
      isLoading: false,
      error: null
    },
    gamification: {
      userStats: {
        level: 1,
        totalXP: 0,
        currentStreak: 0,
        bestStreak: 0
      },
      achievements: [],
      recentXPGains: [],
      isLoading: false,
      error: null
    },
    ...overrides
  }),

  // Performance measurement
  measurePerformance: async (fn: () => Promise<void> | void) => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  },

  // Memory usage simulation
  simulateMemoryPressure: () => {
    // Create large objects to simulate memory pressure
    const largeArray = new Array(1000000).fill('memory-pressure-test');
    return () => {
      // Cleanup function
      largeArray.length = 0;
    };
  }
};

// Accessibility testing helpers
export const a11yHelpers = {
  // Check if element has proper ARIA attributes
  hasProperAria: (element: HTMLElement) => {
    const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
    const hasRole = element.hasAttribute('role') || element.tagName.toLowerCase() in ['button', 'input', 'select', 'textarea', 'a'];
    return hasAriaLabel && hasRole;
  },

  // Check color contrast (simplified)
  hasGoodContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    // This is a simplified check - in real tests you'd use a proper contrast checker
    return color !== backgroundColor;
  },

  // Check keyboard navigation
  isKeyboardAccessible: (element: HTMLElement) => {
    const tabIndex = element.tabIndex;
    const isInteractive = ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
    return tabIndex >= 0 || isInteractive;
  }
};

// Performance testing utilities
export const performanceHelpers = {
  // Measure render time
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now();
    renderFn();
    // Wait for next tick to ensure render is complete
    await new Promise(resolve => setTimeout(resolve, 0));
    const end = performance.now();
    return end - start;
  },

  // Check bundle size impact
  checkBundleSize: (componentName: string) => {
    // This would integrate with bundle analyzer in real implementation
    console.log(`Checking bundle size for ${componentName}`);
    return { size: 0, gzipped: 0 }; // Placeholder
  },

  // Memory leak detection
  detectMemoryLeaks: (testFn: () => void, iterations = 10) => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < iterations; i++) {
      testFn();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    return {
      initialMemory,
      finalMemory,
      memoryIncrease,
      hasLeak: memoryIncrease > 1024 * 1024 // 1MB threshold
    };
  }
};