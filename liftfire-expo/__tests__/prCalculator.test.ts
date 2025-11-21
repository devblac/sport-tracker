import { calculate1RM, calculateImprovement } from '../lib/prCalculator';

describe('prCalculator', () => {
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
});
