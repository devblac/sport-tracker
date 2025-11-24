import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import PersonalRecordsScreen from '../app/records/index';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock dependencies
jest.mock('../hooks/useAuth');
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      backgroundSecondary: '#F5F5F5',
      card: '#FFFFFF',
      border: '#E0E0E0',
      text: '#000000',
      textSecondary: '#666666',
      textTertiary: '#999999',
      primary: '#007AFF',
      error: '#FF3B30',
    },
  }),
}));
jest.mock('../components/LoadingSpinner', () => ({
  LoadingSpinner: () => null,
}));
jest.mock('../components/ErrorMessage', () => ({
  ErrorMessage: () => null,
}));
jest.mock('../components/PRBadge', () => ({
  PRBadge: () => null,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('PersonalRecordsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays PRs when loaded successfully', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      isAuthenticated: true,
    } as any);

    const mockPRs = [
      {
        id: 'pr-1',
        user_id: 'user-1',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        weight: 225,
        reps: 5,
        estimated_1rm: 262.5,
        workout_id: 'workout-1',
        achieved_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
      },
    ];

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockPRs,
            error: null,
          }),
        }),
      }),
    } as any);

    const { getByText } = render(<PersonalRecordsScreen />);

    await waitFor(() => {
      expect(getByText('Bench Press')).toBeTruthy();
      expect(getByText('225 lbs')).toBeTruthy();
      expect(getByText('262.5 lbs')).toBeTruthy();
    });
  });

  it('shows empty state when no PRs exist', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      isAuthenticated: true,
    } as any);

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    } as any);

    const { getByText } = render(<PersonalRecordsScreen />);

    await waitFor(() => {
      expect(getByText('No Personal Records Yet')).toBeTruthy();
      expect(getByText('Complete workouts with weights to set your first PR!')).toBeTruthy();
    });
  });
});
