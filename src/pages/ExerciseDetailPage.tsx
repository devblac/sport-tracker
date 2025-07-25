import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExerciseDetail } from '@/components/exercises';
import { exerciseService } from '@/services/ExerciseService';
import type { Exercise } from '@/types';
import { logger } from '@/utils';

export const ExerciseDetailPage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercise = async () => {
      if (!exerciseId) {
        setError('Exercise ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        await exerciseService.init();
        const exerciseData = await exerciseService.getExerciseById(exerciseId);
        
        if (!exerciseData) {
          setError('Exercise not found');
        } else {
          setExercise(exerciseData);
        }
        
        logger.info('Exercise detail loaded', { exerciseId, found: !!exerciseData });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercise';
        setError(errorMessage);
        logger.error('Failed to load exercise detail', err);
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [exerciseId]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleAddToWorkout = (exercise: Exercise) => {
    // TODO: Implement add to workout functionality
    logger.info('Add to workout clicked', { exerciseId: exercise.id, name: exercise.name });
    console.log('Add to workout:', exercise);
  };

  const handleToggleFavorite = (exercise: Exercise) => {
    // TODO: Implement favorite functionality
    logger.info('Toggle favorite clicked', { exerciseId: exercise.id, name: exercise.name });
    console.log('Toggle favorite:', exercise);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading exercise...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Exercise</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button 
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Exercise Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The exercise you're looking for doesn't exist or has been removed.
        </p>
        <button 
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <ExerciseDetail
      exercise={exercise}
      onBack={handleBack}
      onAddToWorkout={handleAddToWorkout}
      onToggleFavorite={handleToggleFavorite}
      isFavorite={false} // TODO: Get from favorites store
    />
  );
};