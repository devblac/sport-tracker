import React, { useState } from 'react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useExercises } from '@/hooks/useExercises';
import type { SetData, WorkoutExercise } from '@/schemas/workout';

export const WorkoutPlayerView: React.FC = () => {
  const { 
    activeWorkout, 
    elapsedTime, 
    minimizeWorkout, 
    updateWorkout, 
    finishWorkout 
  } = useWorkout();
  
  const { getExerciseByIdSync } = useExercises();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  if (!activeWorkout) return null;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetComplete = (exerciseIndex: number, setIndex: number, updatedSet: SetData) => {
    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise, eIndex) =>
        eIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) =>
                sIndex === setIndex ? updatedSet : set
              ),
            }
          : exercise
      ),
    };

    updateWorkout(updatedWorkout);
  };

  const handleFinishWorkout = () => {
    finishWorkout();
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Minimize Button */}
            <button
              onClick={minimizeWorkout}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Workout Timer */}
            <div className="text-center">
              <div className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                {formatDuration(elapsedTime)}
              </div>
            </div>

            {/* Finish Button */}
            <button
              onClick={handleFinishWorkout}
              className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              FINISH
            </button>
          </div>
        </div>
      </div>

      {/* Workout Title */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeWorkout.name}
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {activeWorkout.exercises.map((exercise, exerciseIndex) => (
            <ExerciseSection
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={exerciseIndex}
              exerciseData={getExerciseByIdSync(exercise.exercise_id)}
              onSetComplete={handleSetComplete}
              isActive={exerciseIndex === currentExerciseIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ExerciseSectionProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  exerciseData: any;
  onSetComplete: (exerciseIndex: number, setIndex: number, updatedSet: SetData) => void;
  isActive: boolean;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  exerciseIndex,
  exerciseData,
  onSetComplete,
  isActive,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Exercise Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {exerciseData?.name || exercise.exercise_id}
          </h2>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* STRONG-style Table Header */}
        <div className="grid grid-cols-5 gap-2 mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <div className="text-center">SET</div>
          <div className="text-center">PREVIOUS</div>
          <div className="text-center">KG</div>
          <div className="text-center">REPS</div>
          <div className="text-center">✓</div>
        </div>

        {/* Sets Table */}
        <div className="space-y-1">
          {exercise.sets.map((set, setIndex) => (
            <SetRow
              key={set.id}
              set={set}
              setIndex={setIndex}
              exerciseIndex={exerciseIndex}
              previousSet={exercise.sets[setIndex - 1]}
              onSetComplete={onSetComplete}
            />
          ))}
        </div>

        {/* Add Set Button */}
        <button className="w-full mt-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
          ADD SET (2:00)
        </button>
      </div>
    </div>
  );
};

interface SetRowProps {
  set: SetData;
  setIndex: number;
  exerciseIndex: number;
  previousSet?: SetData;
  onSetComplete: (exerciseIndex: number, setIndex: number, updatedSet: SetData) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  setIndex,
  exerciseIndex,
  previousSet,
  onSetComplete,
}) => {
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());

  const handleComplete = () => {
    const completedSet: SetData = {
      ...set,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      completed: true,
      completed_at: new Date(),
    };

    onSetComplete(exerciseIndex, setIndex, completedSet);
  };

  const getSetTypeColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'text-yellow-600 dark:text-yellow-400';
      case 'failure': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-900 dark:text-gray-100';
    }
  };

  const isCompleted = set.completed;
  const rowBg = isCompleted 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';

  return (
    <div className={`grid grid-cols-5 gap-2 p-2 rounded-lg border ${rowBg}`}>
      {/* Set Number */}
      <div className="flex items-center justify-center">
        <span className={`font-medium ${getSetTypeColor(set.type)}`}>
          {set.type === 'warmup' ? 'W' : set.set_number}
          {set.type === 'failure' && <span className="text-red-500 ml-1">F</span>}
        </span>
      </div>

      {/* Previous */}
      <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
        {previousSet ? `${previousSet.weight} × ${previousSet.reps}` : '-'}
      </div>

      {/* Weight Input */}
      <div className="flex items-center justify-center">
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full text-center text-sm font-mono bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-1"
          disabled={isCompleted}
          step="0.5"
        />
      </div>

      {/* Reps Input */}
      <div className="flex items-center justify-center">
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-full text-center text-sm font-mono bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-1"
          disabled={isCompleted}
          min="1"
        />
      </div>

      {/* Completion Checkbox */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleComplete}
          disabled={isCompleted}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
          }`}
        >
          {isCompleted && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};