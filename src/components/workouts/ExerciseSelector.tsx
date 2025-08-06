// Exercise Selector - Component to add exercises to workouts
import React, { useState, useMemo } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useExercises } from '@/hooks/useExercises';
import type { Exercise } from '@/schemas/exercise';
import type { WorkoutExercise, SetData } from '@/schemas/workout';

interface ExerciseSelectorProps {
  onAddExercise: (exercise: WorkoutExercise) => void;
  onClose: () => void;
  className?: string;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  onAddExercise,
  onClose,
  className = ''
}) => {
  const { exercises, loading, error } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'chest',
    'back',
    'shoulders',
    'arms',
    'legs',
    'core',
    'cardio'
  ];

  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle_groups?.some(muscle => 
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise =>
        exercise.muscle_groups?.some(muscle =>
          muscle.toLowerCase().includes(selectedCategory.toLowerCase())
        ) ||
        exercise.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    return filtered.slice(0, 50); // Limit results for performance
  }, [exercises, searchQuery, selectedCategory]);

  const handleAddExercise = (exercise: Exercise) => {
    // Create default sets for the exercise
    const defaultSets: SetData[] = [
      {
        id: `set-${Date.now()}-1`,
        set_number: 1,
        type: 'normal',
        weight: 0,
        reps: 0,
        planned_rest_time: 120,
        completed: false,
      },
      {
        id: `set-${Date.now()}-2`,
        set_number: 2,
        type: 'normal',
        weight: 0,
        reps: 0,
        planned_rest_time: 120,
        completed: false,
      },
      {
        id: `set-${Date.now()}-3`,
        set_number: 3,
        type: 'normal',
        weight: 0,
        reps: 0,
        planned_rest_time: 120,
        completed: false,
      }
    ];

    const workoutExercise: WorkoutExercise = {
      id: `workout-exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exercise_id: exercise.id,
      order: 0, // Will be set by parent component
      sets: defaultSets,
      notes: '',
      rest_time: 120,
    };

    onAddExercise(workoutExercise);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Loading exercises...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-red-600 dark:text-red-400 text-sm">Error loading exercises: {error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Add Exercise
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Search className="mx-auto h-8 w-8" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No exercises found. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => handleAddExercise(exercise)}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {exercise.name}
                  </h3>
                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exercise.muscle_groups.slice(0, 3).join(', ')}
                      {exercise.muscle_groups.length > 3 && ` +${exercise.muscle_groups.length - 3} more`}
                    </p>
                  )}
                  {exercise.equipment && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {exercise.equipment}
                    </p>
                  )}
                </div>
                <button className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};