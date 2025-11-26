/**
 * Personal Records Hook Tests
 * 
 * Tests for fetching, filtering, and caching personal records
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { usePersonalRecords, clearPRCache } from '../hooks/usePersonalRecords';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock useAuth
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('usePersonalRecords Hook - Fetching', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockRecords = [
    {
      id: 'pr-1',
      user_id: 'user-123',
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      weight: 100,
      reps: 5,
      estimated_1rm: 116.67,
      workout_id: 'workout-1',
      achieved_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'pr-2',
      user_id: 'user-123',
      exercise_id: 'squat',
      exercise_name: 'Squat',
      weight: 150,
      reps: 3,
      estimated_1rm: 165,
      workout_id: 'workout-2',
      achieved_at: '2024-01-10T10:00:00Z',
      created_at: '2024-01-10T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearPRCache();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  it('successfully fetches personal records on mount', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockRecords,
            error: null,
          }),
        })),
      })),
    });

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual(mockRecords);
    expect(result.current.error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('personal_records');
  });

  it('handles empty records list', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch error gracefully', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual([]);
    expect(result.current.error).toBeTruthy();
    expect(typeof result.current.error).toBe('string');
  });

  it('does not fetch when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.records).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('usePersonalRecords Hook - Filtering', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockRecords = [
    {
      id: 'pr-1',
      user_id: 'user-123',
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      weight: 100,
      reps: 5,
      estimated_1rm: 116.67,
      workout_id: 'workout-1',
      achieved_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'pr-2',
      user_id: 'user-123',
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      weight: 95,
      reps: 5,
      estimated_1rm: 110.83,
      workout_id: 'workout-2',
      achieved_at: '2024-01-10T10:00:00Z',
      created_at: '2024-01-10T10:00:00Z',
    },
    {
      id: 'pr-3',
      user_id: 'user-123',
      exercise_id: 'squat',
      exercise_name: 'Squat',
      weight: 150,
      reps: 3,
      estimated_1rm: 165,
      workout_id: 'workout-3',
      achieved_at: '2024-01-05T10:00:00Z',
      created_at: '2024-01-05T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearPRCache();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({
          data: mockRecords,
          error: null,
        }),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });
  });

  it('filters records by exercise ID', async () => {
    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const benchPressRecords = result.current.getRecordsByExercise('bench-press');
    
    expect(benchPressRecords).toHaveLength(2);
    expect(benchPressRecords[0].exercise_id).toBe('bench-press');
    expect(benchPressRecords[1].exercise_id).toBe('bench-press');
    // Should be sorted by achieved_at (most recent first)
    expect(benchPressRecords[0].achieved_at).toBe('2024-01-15T10:00:00Z');
  });

  it('returns empty array for non-existent exercise', async () => {
    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const records = result.current.getRecordsByExercise('deadlift');
    
    expect(records).toEqual([]);
  });

  it('filters records by time period', async () => {
    // Mock current date to be 2024-01-16 BEFORE rendering hook
    const RealDate = Date;
    const mockDate = new Date('2024-01-16T10:00:00Z');
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          // @ts-ignore - TypeScript doesn't like spreading args
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const recentRecords = result.current.getRecordsByTimePeriod(7); // Last 7 days
    
    expect(recentRecords).toHaveLength(2); // pr-1 and pr-2
    expect(recentRecords[0].achieved_at).toBe('2024-01-15T10:00:00Z');
    expect(recentRecords[1].achieved_at).toBe('2024-01-10T10:00:00Z');

    global.Date = RealDate;
  });

  it('returns all records when time period is large', async () => {
    // Mock current date to be 2024-01-16 BEFORE rendering hook
    const RealDate = Date;
    const mockDate = new Date('2024-01-16T10:00:00Z');
    global.Date = class extends RealDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          // @ts-ignore - TypeScript doesn't like spreading args
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const allRecords = result.current.getRecordsByTimePeriod(365); // Last year
    
    expect(allRecords).toHaveLength(3);

    global.Date = RealDate;
  });
});

describe('usePersonalRecords Hook - Caching', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  const mockRecords = [
    {
      id: 'pr-1',
      user_id: 'user-123',
      exercise_id: 'bench-press',
      exercise_name: 'Bench Press',
      weight: 100,
      reps: 5,
      estimated_1rm: 116.67,
      workout_id: 'workout-1',
      achieved_at: '2024-01-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearPRCache();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  it('uses cached data on subsequent renders', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockRecords,
            error: null,
          }),
        })),
      })),
    });

    (supabase.from as jest.Mock) = mockFrom;

    const { result, rerender } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledTimes(1);

    // Rerender should use cache
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still be called only once (using cache)
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache on refresh', async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({
            data: mockRecords,
            error: null,
          }),
        })),
      })),
    });

    (supabase.from as jest.Mock) = mockFrom;

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFrom).toHaveBeenCalledTimes(1);

    // Refresh should bypass cache
    await act(async () => {
      await result.current.refreshRecords();
    });

    await waitFor(() => {
      expect(result.current.refreshing).toBe(false);
    });

    // Should be called twice (initial + refresh)
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });
});

describe('usePersonalRecords Hook - Error Handling', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearPRCache();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  it('clears error state', async () => {
    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })),
    }));

    (supabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => usePersonalRecords());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
