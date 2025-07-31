# 🧪 Testing Guide

## Overview

Sport Tracker PWA follows a comprehensive testing strategy with unit tests, integration tests, and end-to-end tests. This guide covers testing setup, best practices, and how to write effective tests.

## 🏗️ Testing Architecture

### Testing Pyramid

```
    /\
   /  \
  / E2E \     10% - End-to-End Tests
 /______\
/        \
| Integration | 30% - Integration Tests  
|____________|
|            |
|    Unit     | 60% - Unit Tests
|____________|
```

### Testing Stack

- **Test Runner**: Vitest (fast, Vite-native)
- **Testing Library**: React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **E2E Testing**: Playwright (planned)
- **Coverage**: c8 (built into Vitest)

## ⚙️ Setup and Configuration

### Test Configuration

**`vitest.config.ts`**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Test Setup

**`src/test/setup.ts`**:
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(() => Promise.resolve()),
    ready: Promise.resolve({
      unregister: vi.fn(() => Promise.resolve()),
    }),
  },
});
```

### Test Utilities

**`src/test/utils.tsx`**:
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## 📝 Writing Tests

### Unit Tests

#### Testing Utilities

**`src/utils/__tests__/dateTime.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest';
import { formatDuration, isToday, getWeekStart } from '../dateTime';

describe('dateTime utilities', () => {
  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(45)).toBe('45s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(3665)).toBe('1h 1m 5s');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should handle negative duration', () => {
      expect(formatDuration(-30)).toBe('0s');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday as week start', () => {
      const wednesday = new Date('2025-01-29'); // Wednesday
      const weekStart = getWeekStart(wednesday);
      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekStart.getDate()).toBe(27);
    });
  });
});
```

#### Testing Services

**`src/services/__tests__/WorkoutService.test.ts`**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkoutService } from '../WorkoutService';
import { IndexedDBManager } from '@/db/IndexedDBManager';

// Mock IndexedDBManager
vi.mock('@/db/IndexedDBManager');

describe('WorkoutService', () => {
  let workoutService: WorkoutService;
  let mockDB: any;

  beforeEach(() => {
    mockDB = {
      add: vi.fn(),
      get: vi.fn(),
      getAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    
    vi.mocked(IndexedDBManager.getInstance).mockReturnValue(mockDB);
    workoutService = WorkoutService.getInstance();
  });

  describe('createWorkout', () => {
    it('should create workout successfully', async () => {
      const workoutData = {
        name: 'Test Workout',
        exercises: [
          {
            exerciseId: 'bench-press',
            sets: [
              { type: 'working', targetReps: 8, targetWeight: 80 }
            ]
          }
        ]
      };

      const expectedWorkout = {
        id: 'workout-123',
        ...workoutData,
        status: 'planned',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };

      mockDB.add.mockResolvedValue(expectedWorkout);

      const result = await workoutService.createWorkout(workoutData);

      expect(mockDB.add).toHaveBeenCalledWith('workouts', expect.objectContaining({
        name: 'Test Workout',
        status: 'planned'
      }));
      expect(result).toEqual(expectedWorkout);
    });

    it('should throw error for invalid workout data', async () => {
      const invalidData = { name: '' };

      await expect(workoutService.createWorkout(invalidData))
        .rejects.toThrow('Invalid workout data');
    });
  });

  describe('startWorkout', () => {
    it('should start planned workout', async () => {
      const plannedWorkout = {
        id: 'workout-123',
        name: 'Test Workout',
        status: 'planned',
        exercises: []
      };

      mockDB.get.mockResolvedValue(plannedWorkout);
      mockDB.update.mockResolvedValue({
        ...plannedWorkout,
        status: 'in_progress',
        startedAt: expect.any(Date)
      });

      const result = await workoutService.startWorkout('workout-123');

      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeDefined();
    });

    it('should throw error for non-existent workout', async () => {
      mockDB.get.mockResolvedValue(null);

      await expect(workoutService.startWorkout('non-existent'))
        .rejects.toThrow('Workout not found');
    });
  });
});
```

### Component Tests

#### Testing UI Components

**`src/components/ui/__tests__/Button.test.tsx`**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply correct variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Testing Complex Components

**`src/components/workouts/__tests__/WorkoutCard.test.tsx`**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { WorkoutCard } from '../WorkoutCard';
import { Workout } from '@/types/workout';

const mockWorkout: Workout = {
  id: 'workout-1',
  name: 'Push Day',
  description: 'Chest, shoulders, triceps',
  status: 'completed',
  completedAt: new Date('2025-01-27T10:00:00Z'),
  totalDuration: 3600, // 1 hour
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      sets: [
        { type: 'working', actualReps: 8, actualWeight: 80, completedAt: new Date() }
      ]
    }
  ],
  userId: 'user-1',
  createdAt: new Date('2025-01-27T09:00:00Z'),
  updatedAt: new Date('2025-01-27T11:00:00Z')
};

describe('WorkoutCard', () => {
  it('should display workout information', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    
    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Chest, shoulders, triceps')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
    expect(screen.getByText('1 exercise')).toBeInTheDocument();
  });

  it('should show completed status', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const onSelect = vi.fn();
    render(<WorkoutCard workout={mockWorkout} onSelect={onSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(mockWorkout);
  });

  it('should show different status for in-progress workout', () => {
    const inProgressWorkout = {
      ...mockWorkout,
      status: 'in_progress' as const,
      completedAt: undefined
    };
    
    render(<WorkoutCard workout={inProgressWorkout} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
```

### Integration Tests

#### Testing User Workflows

**`src/components/workouts/__tests__/WorkoutPlayer.integration.test.tsx`**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { WorkoutPlayer } from '../WorkoutPlayer';
import { WorkoutService } from '@/services/WorkoutService';

// Mock services
vi.mock('@/services/WorkoutService');

const mockWorkout = {
  id: 'workout-1',
  name: 'Test Workout',
  status: 'in_progress',
  exercises: [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      sets: [
        { type: 'working', targetReps: 8, targetWeight: 80 },
        { type: 'working', targetReps: 8, targetWeight: 80 }
      ]
    }
  ]
};

describe('WorkoutPlayer Integration', () => {
  beforeEach(() => {
    vi.mocked(WorkoutService.getInstance).mockReturnValue({
      getWorkoutById: vi.fn().mockResolvedValue(mockWorkout),
      updateSet: vi.fn(),
      completeWorkout: vi.fn(),
    } as any);
  });

  it('should complete full workout flow', async () => {
    render(<WorkoutPlayer workoutId="workout-1" />);

    // Wait for workout to load
    await waitFor(() => {
      expect(screen.getByText('Test Workout')).toBeInTheDocument();
    });

    // Complete first set
    const firstSetInputs = screen.getAllByLabelText(/reps/i);
    fireEvent.change(firstSetInputs[0], { target: { value: '8' } });
    
    const firstSetWeightInputs = screen.getAllByLabelText(/weight/i);
    fireEvent.change(firstSetWeightInputs[0], { target: { value: '80' } });
    
    fireEvent.click(screen.getAllByText('Complete Set')[0]);

    // Verify set was marked as completed
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    // Complete second set
    fireEvent.change(firstSetInputs[1], { target: { value: '7' } });
    fireEvent.change(firstSetWeightInputs[1], { target: { value: '80' } });
    fireEvent.click(screen.getAllByText('Complete Set')[1]);

    // Complete workout
    fireEvent.click(screen.getByText('Finish Workout'));

    // Verify workout completion
    await waitFor(() => {
      expect(WorkoutService.getInstance().completeWorkout).toHaveBeenCalledWith('workout-1');
    });
  });

  it('should handle rest timer between sets', async () => {
    render(<WorkoutPlayer workoutId="workout-1" />);

    await waitFor(() => {
      expect(screen.getByText('Test Workout')).toBeInTheDocument();
    });

    // Complete first set
    const setButton = screen.getAllByText('Complete Set')[0];
    fireEvent.click(setButton);

    // Rest timer should appear
    await waitFor(() => {
      expect(screen.getByText(/Rest:/)).toBeInTheDocument();
    });

    // Skip rest
    fireEvent.click(screen.getByText('Skip Rest'));

    // Timer should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Rest:/)).not.toBeInTheDocument();
    });
  });
});
```

#### Testing Authentication Flow

**`src/components/auth/__tests__/AuthFlow.integration.test.tsx`**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { AuthFlow } from '../AuthFlow';
import { AuthService } from '@/services/AuthService';

vi.mock('@/services/AuthService');

describe('AuthFlow Integration', () => {
  beforeEach(() => {
    vi.mocked(AuthService.getInstance).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      getCurrentUser: vi.fn().mockResolvedValue(null),
    } as any);
  });

  it('should handle complete login flow', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    vi.mocked(AuthService.getInstance().login).mockResolvedValue({
      user: mockUser,
      tokens: { accessToken: 'token', refreshToken: 'refresh', expiresAt: new Date() },
      isFirstLogin: false
    });

    render(<AuthFlow />);

    // Fill login form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify login was called
    await waitFor(() => {
      expect(AuthService.getInstance().login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      });
    });

    // Verify success message or redirect
    await waitFor(() => {
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });

  it('should handle registration flow', async () => {
    render(<AuthFlow />);

    // Switch to registration
    fireEvent.click(screen.getByText(/create account/i));

    // Fill registration form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'newuser@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'newuser' }
    });
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'New User' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'SecurePass123!' }
    });
    fireEvent.click(screen.getByLabelText(/accept terms/i));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Verify registration was called
    await waitFor(() => {
      expect(AuthService.getInstance().register).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        username: 'newuser',
        displayName: 'New User',
        password: 'SecurePass123!',
        acceptTerms: true
      });
    });
  });

  it('should handle validation errors', async () => {
    render(<AuthFlow />);

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Hooks

**`src/hooks/__tests__/useWorkout.test.ts`**:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkout } from '../useWorkout';
import { WorkoutService } from '@/services/WorkoutService';

vi.mock('@/services/WorkoutService');

describe('useWorkout', () => {
  beforeEach(() => {
    vi.mocked(WorkoutService.getInstance).mockReturnValue({
      getWorkoutById: vi.fn(),
      updateSet: vi.fn(),
      completeWorkout: vi.fn(),
    } as any);
  });

  it('should load workout data', async () => {
    const mockWorkout = {
      id: 'workout-1',
      name: 'Test Workout',
      status: 'in_progress'
    };

    vi.mocked(WorkoutService.getInstance().getWorkoutById)
      .mockResolvedValue(mockWorkout);

    const { result } = renderHook(() => useWorkout('workout-1'));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.workout).toEqual(mockWorkout);
  });

  it('should update set data', async () => {
    const { result } = renderHook(() => useWorkout('workout-1'));

    await act(async () => {
      await result.current.updateSet(0, 0, {
        actualReps: 8,
        actualWeight: 80
      });
    });

    expect(WorkoutService.getInstance().updateSet).toHaveBeenCalledWith(
      'workout-1',
      0,
      0,
      { actualReps: 8, actualWeight: 80 }
    );
  });
});
```

## 🎭 Mocking Strategies

### Service Mocking with MSW

**`src/test/mocks/handlers.ts`**:
```typescript
import { rest } from 'msw';

export const handlers = [
  // Mock API endpoints
  rest.get('/api/exercises', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'bench-press',
          name: 'Bench Press',
          category: 'strength',
          bodyParts: ['chest']
        }
      ])
    );
  }),

  rest.post('/api/workouts', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'workout-123',
        name: 'New Workout',
        status: 'planned'
      })
    );
  }),

  rest.get('/api/workouts/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({
        id,
        name: 'Test Workout',
        status: 'in_progress'
      })
    );
  }),
];
```

**`src/test/mocks/server.ts`**:
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Database Mocking

**`src/test/mocks/indexedDB.ts`**:
```typescript
import { vi } from 'vitest';

export const createMockDB = () => {
  const store = new Map();
  
  return {
    add: vi.fn((storeName: string, data: any) => {
      const id = data.id || `${storeName}-${Date.now()}`;
      const item = { ...data, id };
      store.set(`${storeName}:${id}`, item);
      return Promise.resolve(item);
    }),
    
    get: vi.fn((storeName: string, id: string) => {
      return Promise.resolve(store.get(`${storeName}:${id}`) || null);
    }),
    
    getAll: vi.fn((storeName: string) => {
      const items = Array.from(store.entries())
        .filter(([key]) => key.startsWith(`${storeName}:`))
        .map(([, value]) => value);
      return Promise.resolve(items);
    }),
    
    update: vi.fn((storeName: string, id: string, data: any) => {
      const existing = store.get(`${storeName}:${id}`);
      if (existing) {
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.set(`${storeName}:${id}`, updated);
        return Promise.resolve(updated);
      }
      return Promise.reject(new Error('Item not found'));
    }),
    
    delete: vi.fn((storeName: string, id: string) => {
      store.delete(`${storeName}:${id}`);
      return Promise.resolve();
    }),
    
    clear: vi.fn(() => {
      store.clear();
      return Promise.resolve();
    })
  };
};
```

## 📊 Test Coverage

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/types/',
        'src/data/sampleData.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Running Coverage

```bash
# Run tests with coverage
npm run test:coverage

# Generate coverage report
npm run coverage:report

# View coverage in browser
npm run coverage:open
```

### Coverage Reports

The coverage report includes:
- **Line Coverage**: Percentage of executed lines
- **Branch Coverage**: Percentage of executed branches
- **Function Coverage**: Percentage of called functions
- **Statement Coverage**: Percentage of executed statements

## 🚀 Running Tests

### Development Workflow

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- workout.test.ts

# Run tests matching pattern
npm test -- --grep "WorkoutService"

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
```

## 🎯 Testing Best Practices

### Test Structure

```typescript
describe('Component/Service Name', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, initialize test data
  });

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Test descriptions**: Use "should" statements
- **Test groups**: Group related tests with `describe`
- **Setup/teardown**: Use `beforeEach`/`afterEach`

### Testing Guidelines

1. **Test behavior, not implementation**
2. **Write tests first (TDD) when possible**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Mock external dependencies**
6. **Test edge cases and error conditions**
7. **Maintain good test coverage**

### Common Patterns

#### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction();
  
  await expect(promise).resolves.toBe('expected result');
  // or
  await expect(promise).rejects.toThrow('error message');
});
```

#### Testing User Interactions

```typescript
it('should handle user interactions', async () => {
  render(<Component />);
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText('Updated text')).toBeInTheDocument();
  });
});
```

#### Testing Form Submissions

```typescript
it('should submit form with correct data', async () => {
  const onSubmit = vi.fn();
  render(<Form onSubmit={onSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'John Doe' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe'
    });
  });
});
```

## 🐛 Debugging Tests

### Debug Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Enable debugging
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});
```

### Debugging Techniques

```typescript
// Add debug output
it('should debug test', () => {
  const result = functionUnderTest();
  console.log('Debug result:', result);
  screen.debug(); // Print DOM tree
  expect(result).toBe('expected');
});

// Use debugger
it('should use debugger', () => {
  debugger; // Breakpoint in VS Code
  const result = functionUnderTest();
  expect(result).toBe('expected');
});
```

### Common Issues

#### Tests Timing Out
```typescript
// Increase timeout for slow tests
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

#### Async Issues
```typescript
// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Or use findBy queries (built-in waiting)
expect(await screen.findByText('Loaded')).toBeInTheDocument();
```

## 📋 Testing Checklist

### Before Writing Tests

- [ ] Understand the requirements
- [ ] Identify test scenarios (happy path, edge cases, errors)
- [ ] Set up test environment and mocks
- [ ] Write test cases in order of importance

### Writing Tests

- [ ] Test the public API, not implementation details
- [ ] Use descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Test one thing at a time
- [ ] Include positive and negative test cases

### After Writing Tests

- [ ] Run tests and verify they pass
- [ ] Check test coverage
- [ ] Review test readability
- [ ] Ensure tests are maintainable
- [ ] Document complex test scenarios

---

*This testing guide is maintained alongside the application and updated with new testing patterns and best practices. Last updated: January 2025*