import { describe, it, expect } from 'vitest';
import {
  validateExercise,
  validateExerciseCreate,
  validateExerciseUpdate,
  validateExerciseFilter,
  transformExerciseData,
  generateExerciseId,
  matchesSearchCriteria,
  getDifficultyDisplay,
  getEquipmentDisplay,
  getBodyPartDisplay,
  getMuscleGroupDisplay,
} from '../exerciseValidation';
import type { Exercise, ExerciseCreate } from '@/types';

describe('exerciseValidation', () => {
  const validExercise: Exercise = {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'strength',
    type: 'compound',
    body_parts: ['chest'],
    muscle_groups: ['pectorals'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: ['Lie on bench', 'Lower bar to chest', 'Press up'],
    tips: ['Keep feet flat', 'Maintain arch'],
    tags: ['push', 'upper-body'],
    aliases: ['barbell bench press'],
    is_public: true,
    created_at: new Date('2025-01-01T10:00:00Z'),
    updated_at: new Date('2025-01-01T10:00:00Z'),
  };

  const validExerciseCreate: ExerciseCreate = {
    name: 'New Exercise',
    category: 'strength',
    type: 'compound',
    body_parts: ['chest'],
    muscle_groups: ['pectorals'],
    equipment: 'barbell',
    difficulty_level: 3,
    instructions: ['Step 1', 'Step 2'],
    tips: ['Tip 1'],
    tags: ['push'],
    aliases: [],
    is_public: true,
  };

  describe('validateExercise', () => {
    it('should validate correct exercise data', () => {
      const result = validateExercise(validExercise);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should reject exercise with missing required fields', () => {
      const invalidData = {
        name: 'Test Exercise',
        // Missing required fields
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject exercise with invalid category', () => {
      const invalidData = {
        ...validExercise,
        category: 'invalid_category',
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('category'))).toBe(true);
    });

    it('should reject exercise with invalid difficulty level', () => {
      const invalidData = {
        ...validExercise,
        difficulty_level: 6, // Should be 1-5
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('difficulty_level'))).toBe(true);
    });

    it('should reject exercise with empty instructions', () => {
      const invalidData = {
        ...validExercise,
        instructions: [],
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('instructions'))).toBe(true);
    });

    it('should reject exercise with empty body_parts', () => {
      const invalidData = {
        ...validExercise,
        body_parts: [],
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('body_parts'))).toBe(true);
    });

    it('should reject exercise with empty muscle_groups', () => {
      const invalidData = {
        ...validExercise,
        muscle_groups: [],
      };

      const result = validateExercise(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('muscle_groups'))).toBe(true);
    });
  });

  describe('validateExerciseCreate', () => {
    it('should validate correct exercise creation data', () => {
      const result = validateExerciseCreate(validExerciseCreate);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject creation data with invalid fields', () => {
      const invalidData = {
        name: '', // Empty name should fail
        category: 'strength',
        type: 'compound',
        body_parts: ['chest'],
        muscle_groups: ['pectorals'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: ['Step 1'],
        is_public: true,
      };

      const result = validateExerciseCreate(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.errors?.some(error => error.includes('name'))).toBe(true);
    });

    it('should accept optional fields as undefined', () => {
      const minimalData = {
        name: 'Minimal Exercise',
        category: 'strength',
        type: 'compound',
        body_parts: ['chest'],
        muscle_groups: ['pectorals'],
        equipment: 'barbell',
        difficulty_level: 3,
        instructions: ['Step 1'],
        is_public: true,
      };

      const result = validateExerciseCreate(minimalData);
      
      expect(result.success).toBe(true);
    });
  });

  describe('validateExerciseUpdate', () => {
    it('should validate partial update data', () => {
      const updateData = {
        name: 'Updated Exercise Name',
        difficulty_level: 4,
      };

      const result = validateExerciseUpdate(updateData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid update data', () => {
      const invalidData = {
        difficulty_level: 10, // Invalid level
      };

      const result = validateExerciseUpdate(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should accept empty update object', () => {
      const result = validateExerciseUpdate({});
      
      expect(result.success).toBe(true);
    });
  });

  describe('validateExerciseFilter', () => {
    it('should validate empty filter', () => {
      const result = validateExerciseFilter({});
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it('should validate filter with all fields', () => {
      const filter = {
        category: 'strength',
        type: 'compound',
        body_parts: ['chest', 'shoulders'],
        muscle_groups: ['pectorals'],
        equipment: 'barbell',
        difficulty_level: [2, 3, 4],
        tags: ['push'],
        is_public: true,
      };

      const result = validateExerciseFilter(filter);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle string difficulty levels and convert to numbers', () => {
      const filter = {
        difficulty_level: ['2', '3', '4'],
      };

      const result = validateExerciseFilter(filter);
      
      expect(result.success).toBe(true);
      expect(result.data?.difficulty_level).toEqual([2, 3, 4]);
    });

    it('should reject filter with invalid category', () => {
      const filter = {
        category: 'invalid_category',
      };

      const result = validateExerciseFilter(filter);
      
      expect(result.success).toBe(false);
    });
  });

  describe('transformExerciseData', () => {
    it('should transform date strings to Date objects', () => {
      const rawData = {
        ...validExercise,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      };

      const result = transformExerciseData(rawData);
      
      expect(result).toBeDefined();
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should convert single values to arrays for array fields', () => {
      const rawData = {
        ...validExercise,
        body_parts: 'chest', // Single value instead of array
        muscle_groups: 'pectorals',
        tags: 'push',
        aliases: 'barbell bench press',
      };

      const result = transformExerciseData(rawData);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result?.body_parts)).toBe(true);
      expect(Array.isArray(result?.muscle_groups)).toBe(true);
      expect(Array.isArray(result?.tags)).toBe(true);
      expect(Array.isArray(result?.aliases)).toBe(true);
    });

    it('should handle null/undefined array fields', () => {
      const rawData = {
        ...validExercise,
        tags: null,
        aliases: undefined,
      };

      const result = transformExerciseData(rawData);
      
      expect(result).toBeDefined();
      expect(result?.tags).toEqual([]);
      expect(result?.aliases).toEqual([]);
    });

    it('should return null for invalid data', () => {
      const invalidData = {
        name: 'Test',
        // Missing required fields
      };

      const result = transformExerciseData(invalidData);
      
      expect(result).toBeNull();
    });
  });

  describe('generateExerciseId', () => {
    it('should generate ID from exercise name', () => {
      const id = generateExerciseId('Bench Press');
      expect(id).toBe('bench-press');
    });

    it('should handle special characters', () => {
      const id = generateExerciseId('Dumbbell Fly (Incline)');
      expect(id).toBe('dumbbell-fly-incline');
    });

    it('should handle multiple spaces', () => {
      const id = generateExerciseId('Barbell   Squat');
      expect(id).toBe('barbell-squat');
    });

    it('should handle leading/trailing spaces and hyphens', () => {
      const id = generateExerciseId('  -Deadlift-  ');
      expect(id).toBe('deadlift');
    });

    it('should handle numbers', () => {
      const id = generateExerciseId('21s Bicep Curl');
      expect(id).toBe('21s-bicep-curl');
    });
  });

  describe('matchesSearchCriteria', () => {
    it('should return true for empty search term', () => {
      const matches = matchesSearchCriteria(validExercise, '');
      expect(matches).toBe(true);
    });

    it('should match exercise name', () => {
      const matches = matchesSearchCriteria(validExercise, 'bench');
      expect(matches).toBe(true);
    });

    it('should match aliases', () => {
      const matches = matchesSearchCriteria(validExercise, 'barbell');
      expect(matches).toBe(true);
    });

    it('should match tags', () => {
      const matches = matchesSearchCriteria(validExercise, 'push');
      expect(matches).toBe(true);
    });

    it('should match body parts', () => {
      const matches = matchesSearchCriteria(validExercise, 'chest');
      expect(matches).toBe(true);
    });

    it('should match muscle groups', () => {
      const matches = matchesSearchCriteria(validExercise, 'pectorals');
      expect(matches).toBe(true);
    });

    it('should match category', () => {
      const matches = matchesSearchCriteria(validExercise, 'strength');
      expect(matches).toBe(true);
    });

    it('should match type', () => {
      const matches = matchesSearchCriteria(validExercise, 'compound');
      expect(matches).toBe(true);
    });

    it('should be case insensitive', () => {
      const matches = matchesSearchCriteria(validExercise, 'BENCH');
      expect(matches).toBe(true);
    });

    it('should return false for non-matching terms', () => {
      const matches = matchesSearchCriteria(validExercise, 'squat');
      expect(matches).toBe(false);
    });
  });

  describe('display functions', () => {
    describe('getDifficultyDisplay', () => {
      it('should return Beginner for levels 1-2', () => {
        expect(getDifficultyDisplay(1)).toBe('Beginner');
        expect(getDifficultyDisplay(2)).toBe('Beginner');
      });

      it('should return Intermediate for level 3', () => {
        expect(getDifficultyDisplay(3)).toBe('Intermediate');
      });

      it('should return Advanced for levels 4-5', () => {
        expect(getDifficultyDisplay(4)).toBe('Advanced');
        expect(getDifficultyDisplay(5)).toBe('Advanced');
      });
    });

    describe('getEquipmentDisplay', () => {
      it('should format single word equipment', () => {
        expect(getEquipmentDisplay('barbell')).toBe('Barbell');
      });

      it('should format multi-word equipment', () => {
        expect(getEquipmentDisplay('resistance_band')).toBe('Resistance Band');
      });

      it('should handle complex equipment names', () => {
        expect(getEquipmentDisplay('cable_machine_high_pulley')).toBe('Cable Machine High Pulley');
      });
    });

    describe('getBodyPartDisplay', () => {
      it('should format single word body part', () => {
        expect(getBodyPartDisplay('chest')).toBe('Chest');
      });

      it('should format multi-word body part', () => {
        expect(getBodyPartDisplay('upper_back')).toBe('Upper Back');
      });
    });

    describe('getMuscleGroupDisplay', () => {
      it('should format single word muscle group', () => {
        expect(getMuscleGroupDisplay('pectorals')).toBe('Pectorals');
      });

      it('should format multi-word muscle group', () => {
        expect(getMuscleGroupDisplay('latissimus_dorsi')).toBe('Latissimus Dorsi');
      });
    });
  });

  describe('error handling', () => {
    it('should handle validation errors gracefully', () => {
      const result = validateExercise(null);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle transformation errors gracefully', () => {
      const result = transformExerciseData(null);
      
      expect(result).toBeNull();
    });

    it('should handle search criteria with null exercise', () => {
      expect(() => matchesSearchCriteria(null as any, 'test')).not.toThrow();
    });
  });
});