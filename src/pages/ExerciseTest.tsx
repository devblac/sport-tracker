import React from 'react';
import { ExerciseCard } from '@/components/exercises';
import type { Exercise } from '@/schemas/exercise';

// Sample exercise for testing
const sampleExercise: Exercise = {
  id: 'test-exercise',
  name: 'Push-ups',
  type: 'bodyweight',
  category: 'strength',
  body_parts: ['chest', 'arms'],
  muscle_groups: ['pectorals', 'triceps_brachii'],
  equipment: 'none',
  difficulty_level: 2,
  instructions: [
    { step_number: 1, instruction: 'Start in plank position' },
    { step_number: 2, instruction: 'Lower body to floor' },
    { step_number: 3, instruction: 'Push back up' },
  ],
  tips: [],
  variations: [],
  default_sets: 3,
  default_reps: 12,
  default_rest_time: 60,
  tags: ['bodyweight', 'upper_body'],
  aliases: ['press-ups'],
  prerequisites: [],
  contraindications: [],
  safety_notes: [],
  created_at: new Date(),
  is_custom: false,
  is_verified: true,
};

export const ExerciseTest: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Exercise Component Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exercise Card</h2>
        <ExerciseCard 
          exercise={sampleExercise}
          onClick={(exercise) => console.log('Clicked:', exercise.name)}
        />
      </div>
    </div>
  );
};