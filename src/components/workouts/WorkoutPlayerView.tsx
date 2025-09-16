import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useWorkout } from '@/contexts/WorkoutContext';
import { useExercises } from '@/hooks/useExercises';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutService } from '@/services/WorkoutService';
import { SmartWeightSuggestion } from '@/components/recommendations/SmartWeightSuggestion';
import { workoutAutoSaveService } from '@/services/WorkoutAutoSaveService';
import { notificationService } from '@/services/NotificationService';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { SetData, WorkoutExercise } from '@/schemas/workout';

export const WorkoutPlayerView: React.FC = () => {
  const { 
    activeWorkout, 
    elapsedTime, 
    minimizeWorkout, 
    updateWorkout, 
    finishWorkout,
    performCancelWorkout 
  } = useWorkout();
  
  const { getExerciseByIdSync } = useExercises();
  const { enableAIWorkoutSuggestions } = useSettingsStore();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, SetData[]>>({});
  
  const workoutService = WorkoutService.getInstance();

  // Initialize auto-save and notifications when workout starts
  useEffect(() => {
    if (activeWorkout) {
      // Start auto-save
      workoutAutoSaveService.startAutoSave(activeWorkout);
      
      // Request notification permission
      notificationService.requestPermission();
      
      // Cleanup on unmount
      return () => {
        workoutAutoSaveService.stopAutoSave(activeWorkout.id);
      };
    }
  }, [activeWorkout?.id]);

  // Format duration helper function
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Load exercise history when workout starts
  useEffect(() => {
    const loadExerciseHistory = async () => {
      if (!activeWorkout) return;
      
      const history: Record<string, SetData[]> = {};
      
      for (const exercise of activeWorkout.exercises) {
        try {
          // Get the last workout that included this exercise (excluding current workout)
          const lastWorkout = await workoutService.getLastWorkoutWithExercise(
            exercise.exercise_id, 
            activeWorkout.user_id,
            activeWorkout.id // Exclude current workout
          );
          
          if (lastWorkout) {
            const lastExercise = lastWorkout.exercises.find(e => e.exercise_id === exercise.exercise_id);
            if (lastExercise) {
              history[exercise.exercise_id] = lastExercise.sets;
            }
          }
        } catch (error) {
          console.error('Error loading exercise history:', error);
        }
      }
      
      setExerciseHistory(history);
    };

    loadExerciseHistory();
  }, [activeWorkout, workoutService]);

  if (!activeWorkout) return null;

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
    
    // Trigger auto-save
    workoutAutoSaveService.updateWorkout(updatedWorkout);
  };

  const handleWeightSelectAll = (exerciseIndex: number, weight: number) => {
    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise, eIndex) =>
        eIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set) => ({
                ...set,
                weight
              })),
            }
          : exercise
      ),
    };

    updateWorkout(updatedWorkout);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = activeWorkout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    const newSet: SetData = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      set_number: exercise.sets.length + 1,
      type: 'normal',
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      planned_rest_time: 120,
      completed: false,
      skipped: false,
    };

    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((ex, eIndex) =>
        eIndex === exerciseIndex
          ? {
              ...ex,
              sets: [...ex.sets, newSet],
            }
          : ex
      ),
    };

    updateWorkout(updatedWorkout);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise, eIndex) =>
        eIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, sIndex) => sIndex !== setIndex)
                .map((set, index) => ({ ...set, set_number: index + 1 })), // Renumber sets
            }
          : exercise
      ),
    };

    updateWorkout(updatedWorkout);
  };

  const handleSetTypeChange = (exerciseIndex: number, setIndex: number, newType: string) => {
    const updatedWorkout = {
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((exercise, eIndex) =>
        eIndex === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, sIndex) =>
                sIndex === setIndex ? { ...set, type: newType } : set
              ),
            }
          : exercise
      ),
    };

    updateWorkout(updatedWorkout);
  };

  const handleAddExercise = (exercise: WorkoutExercise) => {
    const updatedWorkout = {
      ...activeWorkout,
      exercises: [
        ...activeWorkout.exercises,
        {
          ...exercise,
          order: activeWorkout.exercises.length,
        },
      ],
    };

    updateWorkout(updatedWorkout);
    setShowExerciseSelector(false);
  };

  const handleFinishWorkout = () => {
    finishWorkout();
  };

  if (!activeWorkout) {
    return null;
  }

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

            {/* Cancel and Finish Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishWorkout}
                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Finish
              </button>
            </div>
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
          {activeWorkout.exercises.length === 0 ? (
            /* Empty Workout State */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Add Your First Exercise
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start building your workout by adding exercises
              </p>
              <button
                onClick={() => setShowExerciseSelector(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Exercise
              </button>
              
              {/* Cancel Workout Button for Empty State */}
              <div className="mt-8">
                <button
                  onClick={() => {
                    if (confirm('Discard workout?\n\nAre you sure you want to discard this workout? This cannot be undone.')) {
                      performCancelWorkout();
                    }
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                >
                  CANCEL WORKOUT
                </button>
              </div>
            </div>
          ) : (
            /* Exercise List */
            <>
              {activeWorkout.exercises.map((exercise, exerciseIndex) => (
                <ExerciseSection
                  key={exercise.id}
                  exercise={exercise}
                  exerciseIndex={exerciseIndex}
                  exerciseData={getExerciseByIdSync(exercise.exercise_id)}
                  exerciseHistory={exerciseHistory[exercise.exercise_id] || []}
                  onSetComplete={handleSetComplete}
                  onWeightSelectAll={handleWeightSelectAll}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onSetTypeChange={handleSetTypeChange}
                />
              ))}
              
              {/* Add Exercise Button */}
              <div className="p-4">
                <button
                  onClick={() => setShowExerciseSelector(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Exercise
                </button>
              </div>

              {/* Cancel Workout Button */}
              <div className="p-4 pt-8">
                <button
                  onClick={() => {
                    if (confirm('Discard workout?\n\nAre you sure you want to discard this workout? This cannot be undone.')) {
                      performCancelWorkout();
                    }
                  }}
                  className="w-full py-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
                >
                  CANCEL WORKOUT
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <ExerciseSelector
              onAddExercise={handleAddExercise}
              onClose={() => setShowExerciseSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Cancel Workout Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Cancel Workout?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel this workout? All progress will be lost and cannot be recovered.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Keep Workout
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    performCancelWorkout();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Cancel Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ExerciseSectionProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  exerciseData: any;
  exerciseHistory: SetData[];
  onSetComplete: (exerciseIndex: number, setIndex: number, updatedSet: SetData) => void;
  onWeightSelectAll: (exerciseIndex: number, weight: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onSetTypeChange: (exerciseIndex: number, setIndex: number, newType: string) => void;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({
  exercise,
  exerciseIndex,
  exerciseData,
  exerciseHistory,
  onSetComplete,
  onWeightSelectAll,
  onAddSet,
  onRemoveSet,
  onSetTypeChange,
}) => {
  const { enableAIWorkoutSuggestions } = useSettingsStore();
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

        {/* Smart Weight Suggestion - only show for first set and if AI is enabled */}
        {enableAIWorkoutSuggestions && exercise.sets.length > 0 && (
          <SmartWeightSuggestion
            exerciseId={exercise.exercise_id}
            targetReps={exercise.sets[0]?.reps || 8}
            currentSetNumber={1}
            currentWeight={exercise.sets[0]?.weight}
            onWeightSelect={(weight) => {
              const updatedSet = { ...exercise.sets[0], weight };
              onSetComplete(exerciseIndex, 0, updatedSet);
            }}
            onWeightSelectAll={(weight) => {
              onWeightSelectAll(exerciseIndex, weight);
            }}
            className="mb-3"
          />
        )}

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
              previousSet={exerciseHistory[setIndex]}
              onSetComplete={onSetComplete}
              onRemoveSet={onRemoveSet}
              onSetTypeChange={onSetTypeChange}
            />
          ))}
        </div>

        {/* Add Set Button */}
        <button 
          onClick={() => onAddSet(exerciseIndex)}
          className="w-full mt-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
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
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onSetTypeChange: (exerciseIndex: number, setIndex: number, newType: string) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  set,
  setIndex,
  exerciseIndex,
  previousSet,
  onSetComplete,
  onRemoveSet,
  onSetTypeChange,
}) => {
  const { enableAIWorkoutSuggestions } = useSettingsStore();
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync local state with set data when it changes
  useEffect(() => {
    setWeight(set.weight.toString());
    setReps(set.reps.toString());
  }, [set.weight, set.reps]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTypeMenu) {
        setShowTypeMenu(false);
      }
    };

    if (showTypeMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showTypeMenu]);

  // Touch/Mouse handlers for swipe-to-delete
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 80));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = startX - currentX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 80));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (swipeOffset > 40) {
      // Trigger delete
      onRemoveSet(exerciseIndex, setIndex);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (swipeOffset > 40) {
      // Trigger delete
      onRemoveSet(exerciseIndex, setIndex);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  const handleComplete = () => {
    const updatedSet: SetData = {
      ...set,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      completed: !set.completed,
      completed_at: !set.completed ? new Date() : undefined,
    };

    onSetComplete(exerciseIndex, setIndex, updatedSet);
    
    // Show rest timer notification when completing a set
    if (!set.completed) {
      const restTime = set.planned_rest_time || 120; // Default 2 minutes
      setTimeout(() => {
        import('@/services/NotificationService').then(({ notificationService }) => {
          notificationService.showRestTimerNotification(0);
        });
      }, restTime * 1000);
    }
  };

  const getSetTypeColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'text-yellow-600 dark:text-yellow-400';
      case 'failure': return 'text-red-600 dark:text-red-400';
      case 'dropset': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-900 dark:text-gray-100';
    }
  };

  const getSetTypeDisplay = (type: string, setNumber: number) => {
    switch (type) {
      case 'warmup': return 'W';
      case 'failure': return `${setNumber}F`;
      case 'dropset': return `${setNumber}D`;
      default: return setNumber.toString();
    }
  };

  const handleSetTypeSelect = (newType: string) => {
    if (newType === 'delete') {
      onRemoveSet(exerciseIndex, setIndex);
    } else {
      onSetTypeChange(exerciseIndex, setIndex, newType);
    }
    setShowTypeMenu(false);
  };

  const isCompleted = set.completed;
  const rowBg = isCompleted 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';

  return (
    <>
      <div className="relative overflow-hidden">
        {/* Delete Background */}
        {swipeOffset > 0 && (
          <div 
            className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 rounded-lg"
            style={{ transform: `translateX(${80 - swipeOffset}px)` }}
          >
            <div className="text-white flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-medium">🗑️</span>
            </div>
          </div>
        )}

        {/* Main Set Row */}
        <div 
          className={`grid grid-cols-5 gap-2 p-2 rounded-lg border ${rowBg} transition-transform duration-200`}
          style={{ transform: `translateX(-${swipeOffset}px)` }}
        >
          {/* Set Number with Type Menu */}
          <div 
            className="flex items-center justify-center relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                if (buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  setMenuPosition({
                    top: rect.bottom + 4,
                    left: rect.left
                  });
                }
                setShowTypeMenu(!showTypeMenu);
              }}
              className={`font-medium ${getSetTypeColor(set.type)} hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-2 py-1 transition-colors`}
            >
              {getSetTypeDisplay(set.type, set.set_number)}
            </button>
          </div>

        {/* Previous */}
        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
          {previousSet ? `${previousSet.weight} × ${previousSet.reps}` : '-'}
        </div>

          {/* Weight Input */}
          <div className="flex items-center justify-center relative group">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onFocus={(e) => e.target.select()} // Auto-select all text on focus
              onBlur={() => {
                const updatedSet: SetData = {
                  ...set,
                  weight: parseFloat(weight) || 0,
                  reps: parseInt(reps) || 0,
                };
                onSetComplete(exerciseIndex, setIndex, updatedSet);
              }}
              className="w-full text-center text-sm font-mono bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 rounded px-1 py-1"
              step="0.5"
              placeholder="0"
              inputMode="decimal"
            />
            
            {/* Smart suggestion indicator - only show if AI is enabled */}
            {enableAIWorkoutSuggestions && setIndex === 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                   title="AI suggestion available" />
            )}
          </div>

          {/* Reps Input */}
          <div className="flex items-center justify-center">
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onFocus={(e) => e.target.select()} // Auto-select all text on focus
              onBlur={() => {
                const updatedSet: SetData = {
                  ...set,
                  weight: parseFloat(weight) || 0,
                  reps: parseInt(reps) || 0,
                };
                onSetComplete(exerciseIndex, setIndex, updatedSet);
              }}
              className="w-full text-center text-sm font-mono bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 rounded px-1 py-1"
              min="0"
              placeholder="0"
              inputMode="numeric"
            />
          </div>

          {/* Completion Checkbox */}
          <div 
            className="flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={isDragging ? handleMouseMove : undefined}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <button
              onClick={handleComplete}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
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
      </div>

      {/* Set Type Menu Portal - Fixed positioned to escape overflow-hidden */}
      {showTypeMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowTypeMenu(false)}
          />
          {/* Menu positioned relative to viewport */}
          <div 
            className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-32"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`
            }}
          >
            <button
              onClick={() => handleSetTypeSelect('normal')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <span>Normal</span>
            </button>
            <button
              onClick={() => handleSetTypeSelect('warmup')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-yellow-600"
            >
              <span>W</span>
              <span>Warm up</span>
            </button>
            <button
              onClick={() => handleSetTypeSelect('dropset')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-purple-600"
            >
              <span>D</span>
              <span>Drop set</span>
            </button>
            <button
              onClick={() => handleSetTypeSelect('failure')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600"
            >
              <span>F</span>
              <span>Failure</span>
            </button>
            <hr className="border-gray-200 dark:border-gray-600" />
            <button
              onClick={() => handleSetTypeSelect('delete')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center space-x-2 text-red-600"
            >
              <span>X</span>
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};