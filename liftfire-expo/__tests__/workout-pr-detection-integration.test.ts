/**
 * Integration test for PR detection on workout save
 * Verifies that PRs are automatically detected and saved when creating workouts
 */

import { detectAndSavePRs } from '../lib/prCalculator';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Workout PR Detection Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect and save PRs when creating a workout with new personal bests', async () => {
    // Mock sequence of calls for 2 exercises (each makes 3 calls: detectPR, getPrevious, savePR)
    const mockFrom = jest.fn()
      // Exercise 1: Bench Press
      .mockReturnValueOnce({
        // detectPR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // get previous PR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // savePR call
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'pr-1' },
              error: null,
            }),
          }),
        }),
      })
      // Exercise 2: Squat
      .mockReturnValueOnce({
        // detectPR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // get previous PR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // savePR call
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'pr-2' },
              error: null,
            }),
          }),
        }),
      });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const exercises = [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 100 },
      { name: 'Squat', sets: 3, reps: 8, weight: 150 },
    ];

    const result = await detectAndSavePRs('user-123', 'workout-123', exercises);

    // Should detect 2 PRs (first time doing these exercises)
    expect(result).toHaveLength(2);
    expect(result[0].exerciseName).toBe('Bench Press');
    expect(result[0].improvement).toBe(100); // First PR = 100% improvement
    expect(result[1].exerciseName).toBe('Squat');
    expect(result[1].improvement).toBe(100);
  });

  it('should detect PR when new performance beats previous best', async () => {
    // Mock sequence: detectPR (with previous), getPrevious, savePR
    const mockFrom = jest.fn()
      .mockReturnValueOnce({
        // detectPR call - returns previous best
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      estimated_1rm: 110, // Previous best
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // get previous PR for improvement calculation
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      estimated_1rm: 110,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // savePR call
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'pr-2' },
              error: null,
            }),
          }),
        }),
      });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const exercises = [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 105 }, // Better than previous 110 1RM
    ];

    const result = await detectAndSavePRs('user-123', 'workout-456', exercises);

    // Should detect 1 PR with improvement percentage
    expect(result).toHaveLength(1);
    expect(result[0].exerciseName).toBe('Bench Press');
    expect(result[0].improvement).toBeCloseTo(11.36, 1); // (122.5 - 110) / 110 * 100
  });

  it('should not detect PR when performance does not beat previous best', async () => {
    // Mock previous PR exists with better performance
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      if (table === 'personal_records') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      estimated_1rm: 130, // Previous best is higher
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const exercises = [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 100 }, // 116.67 1RM < 130
    ];

    const result = await detectAndSavePRs('user-123', 'workout-789', exercises);

    // Should not detect any PRs
    expect(result).toHaveLength(0);
  });

  it('should skip exercises without weight', async () => {
    const exercises = [
      { name: 'Push-ups', sets: 3, reps: 15, weight: 0 }, // Bodyweight exercise
      { name: 'Plank', sets: 3, reps: 1 }, // No weight property
    ];

    const result = await detectAndSavePRs('user-123', 'workout-999', exercises);

    // Should not detect any PRs for exercises without weight
    expect(result).toHaveLength(0);
  });

  it('should continue processing other exercises if one fails', async () => {
    // Mock sequence: first exercise fails, second succeeds
    const mockFrom = jest.fn()
      // Exercise 1: Bench Press - fail on detectPR
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockRejectedValue(new Error('Database error')),
                }),
              }),
            }),
          }),
        }),
      })
      // Exercise 2: Squat - succeed
      .mockReturnValueOnce({
        // detectPR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // get previous PR call
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        // savePR call
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'pr-3' },
              error: null,
            }),
          }),
        }),
      });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const exercises = [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 100 }, // Will fail
      { name: 'Squat', sets: 3, reps: 8, weight: 150 }, // Will succeed
    ];

    const result = await detectAndSavePRs('user-123', 'workout-111', exercises);

    // Should still process the second exercise despite first one failing
    expect(result).toHaveLength(1);
    expect(result[0].exerciseName).toBe('Squat');
  });

  it('should handle multiple PRs in a single workout', async () => {
    // Mock sequence for 4 exercises (each makes 3 calls)
    const mockFrom = jest.fn();
    
    // Create mocks for 4 exercises
    for (let i = 0; i < 4; i++) {
      // detectPR call
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      
      // get previous PR call
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' },
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      
      // savePR call
      mockFrom.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: `pr-${i + 1}` },
              error: null,
            }),
          }),
        }),
      });
    }

    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const exercises = [
      { name: 'Bench Press', sets: 3, reps: 5, weight: 100 },
      { name: 'Squat', sets: 3, reps: 8, weight: 150 },
      { name: 'Deadlift', sets: 3, reps: 5, weight: 200 },
      { name: 'Overhead Press', sets: 3, reps: 8, weight: 60 },
    ];

    const result = await detectAndSavePRs('user-123', 'workout-multi', exercises);

    // Should detect all 4 PRs
    expect(result).toHaveLength(4);
    expect(result.map(pr => pr.exerciseName)).toEqual([
      'Bench Press',
      'Squat',
      'Deadlift',
      'Overhead Press',
    ]);
    // All should be first PRs with 100% improvement
    result.forEach(pr => {
      expect(pr.improvement).toBe(100);
    });
  });
});
