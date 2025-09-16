/**
 * Auto Workout Card Generator Component
 * 
 * Automatically generates workout cards when workouts are completed.
 */

import React, { useEffect, useState } from 'react';
import { shareableContentService } from '@/services/ShareableContentService';
import { WorkoutCard } from './WorkoutCard';
import { ShareModal } from './ShareModal';
import type { ShareableContent, WorkoutCardData } from '@/types/shareableContent';
import type { Workout } from '@/types/workout';

interface AutoWorkoutCardGeneratorProps {
  workout: Workout;
  userId: string;
  onCardGenerated?: (content: ShareableContent) => void;
  autoShow?: boolean;
}

export const AutoWorkoutCardGenerator: React.FC<AutoWorkoutCardGeneratorProps> = ({
  workout,
  userId,
  onCardGenerated,
  autoShow = true
}) => {
  const [generatedCard, setGeneratedCard] = useState<ShareableContent | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (workout.is_completed && !generatedCard) {
      generateWorkoutCard();
    }
  }, [workout.is_completed]);

  const generateWorkoutCard = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Calculate workout stats
      const workoutStats = calculateWorkoutStats(workout);
      
      // Generate the card
      const content = await shareableContentService.generateWorkoutCard(
        workoutStats,
        userId
      );
      
      setGeneratedCard(content);
      onCardGenerated?.(content);
      
      if (autoShow) {
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Failed to generate workout card:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateWorkoutStats = (workout: Workout) => {
    const totalVolume = workout.exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((setTotal, set) => {
        if (set.completed && set.type !== 'warmup') {
          return setTotal + (set.weight * set.reps);
        }
        return setTotal;
      }, 0);
    }, 0);

    const personalRecords = workout.exercises
      .filter(exercise => exercise.sets.some(set => set.isPersonalRecord))
      .map(exercise => exercise.exercise_name || `Exercise ${exercise.exercise_id}`);

    const topExercises = workout.exercises
      .map(exercise => {
        const completedSets = exercise.sets.filter(set => set.completed && set.type !== 'warmup');
        const maxWeight = Math.max(...completedSets.map(set => set.weight));
        const avgReps = completedSets.reduce((sum, set) => sum + set.reps, 0) / completedSets.length;
        
        return {
          name: exercise.exercise_name || `Exercise ${exercise.exercise_id}`,
          sets: completedSets.length,
          reps: Math.round(avgReps),
          weight: maxWeight
        };
      })
      .sort((a, b) => (b.weight * b.reps * b.sets) - (a.weight * a.reps * a.sets))
      .slice(0, 3);

    const duration = workout.completed_at && workout.started_at 
      ? Math.round((workout.completed_at.getTime() - workout.started_at.getTime()) / (1000 * 60))
      : 0;

    return {
      workoutName: workout.name,
      duration,
      exerciseCount: workout.exercises.length,
      totalVolume: Math.round(totalVolume),
      personalRecords,
      date: workout.completed_at || new Date(),
      workoutType: determineWorkoutType(workout),
      topExercises
    };
  };

  const determineWorkoutType = (workout: Workout): string => {
    const exerciseNames = workout.exercises.map(e => 
      (e.exercise_name || '').toLowerCase()
    );
    
    if (exerciseNames.some(name => 
      name.includes('squat') || name.includes('deadlift') || name.includes('bench')
    )) {
      return 'Fuerza';
    }
    
    if (exerciseNames.some(name => 
      name.includes('curl') || name.includes('extension') || name.includes('fly')
    )) {
      return 'Hipertrofia';
    }
    
    if (workout.exercises.length >= 8) {
      return 'Full Body';
    }
    
    return 'Entrenamiento';
  };

  const handleTemplateChange = async (templateName: string) => {
    if (!generatedCard) return;
    
    try {
      const workoutStats = calculateWorkoutStats(workout);
      const updatedContent = await shareableContentService.generateWorkoutCard(
        workoutStats,
        userId,
        templateName
      );
      
      setGeneratedCard(updatedContent);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Generando tarjeta de entrenamiento...
        </span>
      </div>
    );
  }

  if (!generatedCard) {
    return (
      <div className="text-center p-4">
        <button
          onClick={generateWorkoutCard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generar Tarjeta de Entrenamiento
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Preview Card */}
      <div className="max-w-md mx-auto">
        <WorkoutCard
          data={generatedCard.data as WorkoutCardData}
          backgroundColor={generatedCard.backgroundColor}
          textColor={generatedCard.textColor}
          accentColor={generatedCard.accentColor}
          template={generatedCard.template}
          className="transform scale-75"
        />
        
        <div className="flex justify-center space-x-3 mt-4">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>📤</span>
            <span>Compartir</span>
          </button>
          
          <button
            onClick={generateWorkoutCard}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Regenerar
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        content={generatedCard}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onTemplateChange={handleTemplateChange}
      />
    </>
  );
};

export default AutoWorkoutCardGenerator;