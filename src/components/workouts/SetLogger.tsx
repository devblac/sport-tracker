import React, { useState, useEffect } from 'react';
import type { SetData, WorkoutExercise } from '@/schemas/workout';
import type { Exercise } from '@/schemas/exercise';

interface SetLoggerProps {
  currentSet: SetData;
  exercise: WorkoutExercise;
  exerciseData?: Exercise | null;
  onSetComplete: (completedSet: SetData) => void;
  className?: string;
}

export const SetLogger: React.FC<SetLoggerProps> = ({
  currentSet,
  exercise,
  exerciseData,
  onSetComplete,
  className = '',
}) => {
  const [weight, setWeight] = useState(currentSet.weight.toString());
  const [reps, setReps] = useState(currentSet.reps.toString());
  const [rpe, setRpe] = useState(currentSet.rpe?.toString() || '');
  const [notes, setNotes] = useState(currentSet.notes || '');
  const [setStartTime] = useState(new Date());

  // Get previous set data for reference
  const getPreviousSetData = () => {
    const completedSets = exercise.sets.filter(set => set.completed && set.set_number < currentSet.set_number);
    if (completedSets.length > 0) {
      return completedSets[completedSets.length - 1];
    }
    return null;
  };

  const previousSet = getPreviousSetData();

  // Auto-fill from previous set if available
  useEffect(() => {
    if (previousSet && currentSet.set_number > 1) {
      setWeight(previousSet.weight.toString());
      setReps(previousSet.reps.toString());
    }
  }, [previousSet, currentSet.set_number]);

  const handleComplete = () => {
    const completedSet: SetData = {
      ...currentSet,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      rpe: rpe ? parseFloat(rpe) : undefined,
      notes: notes.trim() || undefined,
      started_at: setStartTime,
      ended_at: new Date(),
      completed: true,
    };

    onSetComplete(completedSet);
  };

  const handleSkip = () => {
    const skippedSet: SetData = {
      ...currentSet,
      skipped: true,
      completed: false,
      started_at: setStartTime,
      ended_at: new Date(),
    };

    onSetComplete(skippedSet);
  };

  const isValidInput = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const rpeNum = rpe ? parseFloat(rpe) : null;

    return (
      !isNaN(weightNum) &&
      weightNum >= 0 &&
      !isNaN(repsNum) &&
      repsNum > 0 &&
      (rpeNum === null || (rpeNum >= 1 && rpeNum <= 10))
    );
  };

  const getSetTypeDisplay = (type: string) => {
    const displays: Record<string, string> = {
      normal: 'Working Set',
      warmup: 'Warm-up',
      failure: 'To Failure',
      dropset: 'Drop Set',
      amrap: 'AMRAP',
    };
    return displays[type] || type;
  };

  const getSetTypeColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failure': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'dropset': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'amrap': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* Set Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentSet.set_number}
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSetTypeColor(currentSet.type)}`}>
              {getSetTypeDisplay(currentSet.type)}
            </span>
          </div>
          
          {/* Previous Set Reference */}
          {previousSet && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Previous: {previousSet.weight}kg × {previousSet.reps}
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 space-y-4">
        {/* Weight and Reps */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              KG
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              step="0.5"
              min="0"
            />
          </div>

          {/* Reps Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              REPS
            </label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="1"
            />
          </div>
        </div>

        {/* RPE Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            RPE (1-10) - Optional
          </label>
          <input
            type="number"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="w-full px-4 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rate of Perceived Exertion"
            step="0.5"
            min="1"
            max="10"
          />
        </div>

        {/* Notes Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes - Optional
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="How did this set feel?"
            rows={2}
          />
        </div>

        {/* Set History Preview */}
        {exercise.sets.filter(set => set.completed).length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Previous Sets
            </h4>
            <div className="space-y-1">
              {exercise.sets
                .filter(set => set.completed)
                .map((set, index) => (
                  <div key={set.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Set {set.set_number}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono">
                      {set.weight}kg × {set.reps}
                      {set.rpe && <span className="text-gray-500 ml-2">RPE {set.rpe}</span>}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
          >
            Skip Set
          </button>
          
          <button
            onClick={handleComplete}
            disabled={!isValidInput()}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Complete Set
          </button>
        </div>
      </div>
    </div>
  );
};