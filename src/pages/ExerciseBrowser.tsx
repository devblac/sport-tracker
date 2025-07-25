import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseSearch, ExerciseList } from '@/components/exercises';
import { exerciseService } from '@/services/ExerciseService';
import type { Exercise, ExerciseFilter } from '@/types';
import { logger } from '@/utils';

export const ExerciseBrowser: React.FC = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ExerciseFilter>({});

  // Load all exercises on component mount
  useEffect(() => {
    const loadExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await exerciseService.init();
        const allExercises = await exerciseService.getAllExercises();
        
        setExercises(allExercises);
        setFilteredExercises(allExercises);
        
        logger.info('Exercises loaded successfully', { count: allExercises.length });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(errorMessage);
        logger.error('Failed to load exercises', err);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback(async (filters: ExerciseFilter) => {
    try {
      setCurrentFilters(filters);
      setLoading(true);
      
      // If no filters are applied, show all exercises
      if (Object.keys(filters).length === 0) {
        setFilteredExercises(exercises);
      } else {
        // Apply filters using the exercise service
        const filtered = await exerciseService.searchExercises(filters);
        setFilteredExercises(filtered);
      }
      
      logger.debug('Filters applied', { filters, resultCount: filteredExercises.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter exercises';
      setError(errorMessage);
      logger.error('Failed to filter exercises', err);
    } finally {
      setLoading(false);
    }
  }, [exercises, filteredExercises.length]);

  // Handle exercise selection
  const handleExerciseClick = useCallback((exercise: Exercise) => {
    logger.info('Exercise selected', { exerciseId: exercise.id, name: exercise.name });
    navigate(`/exercises/${exercise.id}`);
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Exercise Library
        </h1>
        <p className="text-muted-foreground">
          Discover and explore our comprehensive collection of exercises
        </p>
      </div>

      {/* Search and Filters */}
      <ExerciseSearch
        onFiltersChange={handleFiltersChange}
        initialFilters={currentFilters}
      />

      {/* Exercise List */}
      <ExerciseList
        exercises={filteredExercises}
        onExerciseClick={handleExerciseClick}
        loading={loading}
        error={error}
        showViewToggle={true}
      />
    </div>
  );
};