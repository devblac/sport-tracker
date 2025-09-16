import React, { useState, useEffect } from 'react';
import { SetLogger } from './SetLogger';
import { RestTimer } from './RestTimer';
import { WorkoutRewardsModal } from '@/components/gamification/WorkoutRewardsModal';
import { useExercises } from '@/hooks/useExercises';
import { useWorkoutCompletion } from '@/hooks/useWorkoutCompletion';
import { workoutAutoSaveService } from '@/services/WorkoutAutoSaveService';
import { notificationService } from '@/services/NotificationService';
import type { Workout, WorkoutExercise, SetData } from '@/schemas/workout';

interface WorkoutPlayerProps {
  workout: Workout;
  onWorkoutComplete: (completedWorkout: Workout) => void;
  onWorkoutExit: () => void;
  className?: string;
}

export const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({
  workout: initialWorkout,
  onWorkoutComplete,
  onWorkoutExit,
  className = '',
}) => {
  const [workout, setWorkout] = useState<Workout>(initialWorkout);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(0);
  const [workoutStartTime] = useState(new Date());
  const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  const { getExerciseByIdSync } = useExercises();
  const { 
    isProcessing: isCompletingWorkout, 
    completionResult, 
    showRewardsModal, 
    completeWorkout, 
    closeRewardsModal 
  } = useWorkoutCompletion();

  const currentExercise = workout.exercises[currentExerciseIndex];
  const currentSet = currentExercise?.sets[currentSetIndex];
  const exerciseData = currentExercise?.exercise_id ? getExerciseByIdSync(currentExercise.exercise_id) : null;

  // Initialize exercise start time
  useEffect(() => {
    if (currentExercise && !exerciseStartTime) {
      setExerciseStartTime(new Date());
    }
  }, [currentExercise, exerciseStartTime]);

  // Update workout status when starting and initialize auto-save
  useEffect(() => {
    if (workout.status === 'planned') {
      const updatedWorkout = {
        ...workout,
        status: 'in_progress' as const,
        started_at: workoutStartTime,
      };
      setWorkout(updatedWorkout);
      
      // Start auto-save
      workoutAutoSaveService.startAutoSave(updatedWorkout);
    } else if (workout.status === 'in_progress') {
      // Resume auto-save for existing workout
      workoutAutoSaveService.startAutoSave(workout);
    }

    // Request notification permission
    notificationService.requestPermission();

    // Cleanup auto-save on unmount
    return () => {
      workoutAutoSaveService.stopAutoSave(workout.id);
    };
  }, [workoutStartTime, workout.status, workout.id]);

  const updateSet = (exerciseIndex: number, setIndex: number, updatedSet: SetData) => {
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((exercise, eIndex) =>
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
    
    setWorkout(updatedWorkout);
    
    // Trigger auto-save
    workoutAutoSaveService.updateWorkout(updatedWorkout);
  };

  const handleSetComplete = (completedSet: SetData) => {
    // Update the set in the workout
    updateSet(currentExerciseIndex, currentSetIndex, {
      ...completedSet,
      completed: true,
      completed_at: new Date(),
    });

    // Start rest timer if not the last set of the exercise
    const isLastSetOfExercise = currentSetIndex === currentExercise.sets.length - 1;
    const isLastExercise = currentExerciseIndex === workout.exercises.length - 1;

    if (!isLastSetOfExercise || !isLastExercise) {
      const restTime = completedSet.planned_rest_time || workout.default_rest_time || 90;
      setRestDuration(restTime);
      setIsResting(true);
    }

    // Move to next set or exercise
    if (isLastSetOfExercise) {
      if (!isLastExercise) {
        // Move to next exercise
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);
        setExerciseStartTime(new Date());
      } else {
        // Workout complete
        handleWorkoutComplete();
      }
    } else {
      // Move to next set
      setCurrentSetIndex(prev => prev + 1);
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    setRestDuration(0);
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestDuration(0);
  };

  const handlePauseWorkout = () => {
    if (!isPaused) {
      setIsPaused(true);
      setPausedAt(new Date());
      
      const pausedWorkout = {
        ...workout,
        status: 'paused' as const,
        paused_at: new Date(),
      };
      
      setWorkout(pausedWorkout);
      workoutAutoSaveService.updateWorkout(pausedWorkout);
      
      // Show notification
      notificationService.showWorkoutPausedNotification();
    }
  };

  const handleResumeWorkout = () => {
    if (isPaused && pausedAt) {
      const pauseDuration = Math.floor((new Date().getTime() - pausedAt.getTime()) / 1000);
      setTotalPausedTime(prev => prev + pauseDuration);
      
      setIsPaused(false);
      setPausedAt(null);
      
      const resumedWorkout = {
        ...workout,
        status: 'in_progress' as const,
        resumed_at: new Date(),
      };
      
      setWorkout(resumedWorkout);
      workoutAutoSaveService.updateWorkout(resumedWorkout);
    }
  };

  const handleWorkoutComplete = async () => {
    const actualDuration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000) - totalPausedTime;
    
    const completedWorkout: Workout = {
      ...workout,
      status: 'completed',
      completed_at: new Date(),
      total_duration: actualDuration,
      duration_minutes: Math.floor(actualDuration / 60),
    };

    try {
      // Force save before completing
      await workoutAutoSaveService.forceSave(workout.id);
      workoutAutoSaveService.stopAutoSave(workout.id);

      // Process gamification rewards through the hook
      await completeWorkout(completedWorkout);

      // Complete the workout (this will be called after rewards are shown)
      onWorkoutComplete(completedWorkout);
      
    } catch (error) {
      console.error('❌ Error in workout completion flow:', error);
      
      // Still complete the workout even if gamification fails
      onWorkoutComplete(completedWorkout);
    }
  };

  const handleExitWorkout = () => {
    // Save workout as paused
    const pausedWorkout: Workout = {
      ...workout,
      status: 'paused',
      paused_at: new Date(),
    };

    // Force save and stop auto-save
    workoutAutoSaveService.forceSave(workout.id).then(() => {
      workoutAutoSaveService.stopAutoSave(workout.id);
      onWorkoutExit();
    });
  };

  const getWorkoutProgress = () => {
    const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (total, exercise) => total + exercise.sets.filter(set => set.completed).length,
      0
    );
    return Math.round((completedSets / totalSets) * 100);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second (accounting for pauses)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (!isPaused) {
      interval = setInterval(() => {
        const currentTime = new Date().getTime();
        const rawElapsed = Math.floor((currentTime - workoutStartTime.getTime()) / 1000);
        const currentPausedTime = pausedAt ? Math.floor((currentTime - pausedAt.getTime()) / 1000) : 0;
        setElapsedTime(rawElapsed - totalPausedTime - currentPausedTime);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [workoutStartTime, isPaused, pausedAt, totalPausedTime]);

  // Handle empty workout (no exercises)
  if (workout.exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 min-h-screen">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <div className="max-w-md mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleExitWorkout}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <div className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {formatDuration(elapsedTime)}
                  </div>
                </div>
                <button
                  onClick={handleWorkoutComplete}
                  className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  FINISH
                </button>
              </div>
            </div>
          </div>

          {/* Empty Workout Content */}
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="text-4xl mb-4">💪</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Empty Workout
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Add exercises to start tracking your workout
              </p>
            </div>

            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Add Exercise
              </button>
              <button 
                onClick={handleWorkoutComplete}
                disabled={isCompletingWorkout}
                className="w-full px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompletingWorkout ? 'Finishing...' : 'Finish Empty Workout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle completed workout (all exercises done)
  if (!currentExercise || !currentSet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Workout Complete!
          </h2>
          <button
            onClick={handleWorkoutComplete}
            disabled={isCompletingWorkout}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompletingWorkout ? 'Finishing...' : 'Finish Workout'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Workout Rewards Modal */}
      <WorkoutRewardsModal
        result={completionResult}
        isOpen={showRewardsModal}
        onClose={closeRewardsModal}
      />
      
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back/Exit Button */}
            <button
              onClick={handleExitWorkout}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Workout Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="text-lg font-mono font-semibold text-gray-900 dark:text-gray-100">
                  {formatDuration(elapsedTime)}
                </div>
                {isPaused && (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isPaused ? 'Paused' : `${getWorkoutProgress()}% complete`}
              </div>
            </div>

            {/* Pause/Resume and Finish Buttons */}
            <div className="flex items-center space-x-2">
              {isPaused ? (
                <button
                  onClick={handleResumeWorkout}
                  className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  title="Resume Workout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h1m4 0h1" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handlePauseWorkout}
                  className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
                  title="Pause Workout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={handleWorkoutComplete}
                disabled={isCompletingWorkout}
                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompletingWorkout ? 'FINISHING...' : 'FINISH'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        {/* Workout Title */}
        <div className="px-4 py-3 bg-white dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {workout.name}
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDuration(elapsedTime)}
          </div>
        </div>

        {/* Current Exercise */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {exerciseData?.name || currentExercise.exercise_id}
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

            {/* Exercise Progress */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Exercise {currentExerciseIndex + 1} of {workout.exercises.length} • 
              Set {currentSetIndex + 1} of {currentExercise.sets.length}
            </div>
          </div>
        </div>

        {/* Rest Timer */}
        {isResting && (
          <RestTimer
            duration={restDuration}
            onComplete={handleRestComplete}
            onSkip={handleSkipRest}
          />
        )}

        {/* Pause Overlay */}
        {isPaused && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">⏸️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Workout Paused
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Take your time. Your progress is automatically saved.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleResumeWorkout}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Resume Workout
                </button>
                <button
                  onClick={handleExitWorkout}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-lg transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Set Logger */}
        {!isResting && !isPaused && (
          <SetLogger
            currentSet={currentSet}
            exercise={currentExercise}
            exerciseData={exerciseData}
            onSetComplete={handleSetComplete}
          />
        )}
      </div>
    </div>
    </>
  );
};