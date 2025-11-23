import { 
  calculate1RM, 
  calculateImprovement, 
  detectPR, 
  savePR, 
  detectAndSavePRs,
  compareToPR,
  getPRForExercise
} from '../lib/prCalculator';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('prCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculate1RM', () => {
    it('returns weight when reps is 1', () => {
      expect(calculate1RM(100, 1)).toBe(100);
      expect(calculate1RM(225, 1)).toBe(225);
      expect(calculate1RM(50.5, 1)).toBe(50.5);
    });

    it('calculates 1RM using Epley formula for multiple reps', () => {
      // Formula: weight × (1 + reps / 30)
      // Example: 100kg × (1 + 5/30) = 100 × 1.1667 = 116.67
      expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 2);
      
      // Example: 80kg × (1 + 10/30) = 80 × 1.333 = 106.67
      expect(calculate1RM(80, 10)).toBeCloseTo(106.67, 2);
      
      // Example: 200kg × (1 + 3/30) = 200 × 1.1 = 220
      expect(calculate1RM(200, 3)).toBeCloseTo(220, 2);
    });

    it('handles edge cases correctly', () => {
      // Zero weight
      expect(calculate1RM(0, 5)).toBe(0);
      
      // Zero reps (though this shouldn't happen in practice)
      expect(calculate1RM(100, 0)).toBe(100);
      
      // High rep count
      expect(calculate1RM(50, 30)).toBe(100);
    });

    it('calculates correctly for decimal weights', () => {
      expect(calculate1RM(67.5, 8)).toBeCloseTo(85.5, 2);
      expect(calculate1RM(102.5, 6)).toBeCloseTo(123, 2);
    });
  });

  describe('calculateImprovement', () => {
    it('calculates improvement percentage correctly', () => {
      // 10% improvement: 100 -> 110
      expect(calculateImprovement(100, 110)).toBe(10);
      
      // 5% improvement: 200 -> 210
      expect(calculateImprovement(200, 210)).toBe(5);
      
      // 25% improvement: 80 -> 100
      expect(calculateImprovement(80, 100)).toBe(25);
    });

    it('handles negative improvement (regression)', () => {
      // -10% regression: 100 -> 90
      expect(calculateImprovement(100, 90)).toBe(-10);
      
      // -5% regression: 200 -> 190
      expect(calculateImprovement(200, 190)).toBe(-5);
    });

    it('returns 100% when old value is 0', () => {
      expect(calculateImprovement(0, 100)).toBe(100);
      expect(calculateImprovement(0, 50)).toBe(100);
    });

    it('returns 0% when values are equal', () => {
      expect(calculateImprovement(100, 100)).toBe(0);
      expect(calculateImprovement(250, 250)).toBe(0);
    });

    it('handles decimal improvements correctly', () => {
      // 5.5% improvement
      expect(calculateImprovement(100, 105.5)).toBeCloseTo(5.5, 2);
      
      // 2.25% improvement
      expect(calculateImprovement(200, 204.5)).toBeCloseTo(2.25, 2);
    });
  });

  describe('detectPR', () => {
    it('returns true when no previous PR exists', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // No rows returned
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await detectPR('user-123', 'bench-press', 100, 5);
      expect(result).toBe(true);
    });

    it('returns true when new 1RM is better than previous', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { estimated_1rm: 100 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // New: 110kg × (1 + 5/30) = 128.33 > 100
      const result = await detectPR('user-123', 'bench-press', 110, 5);
      expect(result).toBe(true);
    });

    it('returns false when new 1RM is not better than previous', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { estimated_1rm: 150 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // New: 100kg × (1 + 5/30) = 116.67 < 150
      const result = await detectPR('user-123', 'bench-press', 100, 5);
      expect(result).toBe(false);
    });
  });

  describe('savePR', () => {
    it('saves PR successfully and returns the record', async () => {
      const mockPR = {
        id: 'pr-123',
        user_id: 'user-123',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        weight: 100,
        reps: 5,
        estimated_1rm: 116.67,
        workout_id: 'workout-123',
        achieved_at: expect.any(String),
        created_at: expect.any(String),
      };

      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPR,
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await savePR('user-123', 'bench-press', 'Bench Press', 100, 5, 'workout-123');
      
      expect(result).toEqual(mockPR);
      expect(supabase.from).toHaveBeenCalledWith('personal_records');
    });

    it('returns null when save fails', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await savePR('user-123', 'bench-press', 'Bench Press', 100, 5, 'workout-123');
      
      expect(result).toBeNull();
    });
  });

  describe('compareToPR', () => {
    it('returns isNewPR true and null values when no previous PR exists', async () => {
      const mockFrom = jest.fn().mockReturnValue({
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
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await compareToPR('user-123', 'bench-press', 100, 5);

      expect(result.isNewPR).toBe(true);
      expect(result.currentEstimated1RM).toBeCloseTo(116.67, 2);
      expect(result.previousBest1RM).toBeNull();
      expect(result.improvement).toBeNull();
      expect(result.percentageOfPR).toBeNull();
    });

    it('returns comparison data when new PR is achieved', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { estimated_1rm: 100 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // New: 110kg × (1 + 5/30) = 128.33
      // Previous: 100kg
      // Improvement: 28.33%
      const result = await compareToPR('user-123', 'bench-press', 110, 5);

      expect(result.isNewPR).toBe(true);
      expect(result.currentEstimated1RM).toBeCloseTo(128.33, 2);
      expect(result.previousBest1RM).toBe(100);
      expect(result.improvement).toBeCloseTo(28.33, 2);
      expect(result.percentageOfPR).toBeCloseTo(128.33, 2);
    });

    it('returns comparison data when performance does not beat PR', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { estimated_1rm: 150 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // New: 100kg × (1 + 5/30) = 116.67
      // Previous: 150kg
      // Not a PR
      const result = await compareToPR('user-123', 'bench-press', 100, 5);

      expect(result.isNewPR).toBe(false);
      expect(result.currentEstimated1RM).toBeCloseTo(116.67, 2);
      expect(result.previousBest1RM).toBe(150);
      expect(result.improvement).toBeNull(); // No improvement since not a PR
      expect(result.percentageOfPR).toBeCloseTo(77.78, 2); // 116.67/150 * 100
    });

    it('calculates percentage of PR correctly', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { estimated_1rm: 200 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      // New: 180kg × (1 + 2/30) = 192
      // Previous: 200kg
      // Percentage: 96%
      const result = await compareToPR('user-123', 'squat', 180, 2);

      expect(result.percentageOfPR).toBeCloseTo(96, 1);
    });
  });

  describe('getPRForExercise', () => {
    it('returns PR record when it exists', async () => {
      const mockPR = {
        id: 'pr-123',
        user_id: 'user-123',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        weight: 100,
        reps: 5,
        estimated_1rm: 116.67,
        workout_id: 'workout-123',
        achieved_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockPR,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getPRForExercise('user-123', 'bench-press');

      expect(result).toEqual(mockPR);
      expect(supabase.from).toHaveBeenCalledWith('personal_records');
    });

    it('returns null when no PR exists', async () => {
      const mockFrom = jest.fn().mockReturnValue({
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
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getPRForExercise('user-123', 'bench-press');

      expect(result).toBeNull();
    });

    it('returns null when database error occurs', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                  }),
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await getPRForExercise('user-123', 'bench-press');

      expect(result).toBeNull();
    });
  });

  describe('detectAndSavePRs', () => {
    it('detects and saves multiple PRs from a workout', async () => {
      // Mock detectPR to return true for all exercises
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          // First call: detectPR for bench press (no previous PR)
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
          // Second call: get previous PR for improvement calculation
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
          // Third call: savePR for bench press
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'pr-1' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Fourth call: detectPR for squat
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
          // Fifth call: get previous PR for squat
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
          // Sixth call: savePR for squat
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
        { name: 'Cardio', sets: 1, reps: 20, weight: 0 }, // Should be skipped
      ];

      const result = await detectAndSavePRs('user-123', 'workout-123', exercises);

      expect(result).toHaveLength(2);
      expect(result[0].exerciseName).toBe('Bench Press');
      expect(result[1].exerciseName).toBe('Squat');
    });

    it('skips exercises without weight', async () => {
      const exercises = [
        { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
        { name: 'Running', sets: 1, reps: 1 }, // No weight property
      ];

      const result = await detectAndSavePRs('user-123', 'workout-123', exercises);

      expect(result).toHaveLength(0);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('continues processing other exercises if one fails', async () => {
      const mockFrom = jest.fn()
        .mockReturnValueOnce({
          // First exercise: detectPR throws error
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
        .mockReturnValueOnce({
          // Second exercise: detectPR succeeds
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
          // Get previous PR
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
          // savePR succeeds
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'pr-1' },
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

      // Should still process the second exercise despite first one failing
      expect(result).toHaveLength(1);
      expect(result[0].exerciseName).toBe('Squat');
    });
  });
});
