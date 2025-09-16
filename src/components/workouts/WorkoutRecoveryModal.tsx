import React from 'react';
import type { RecoveryData } from '@/services/WorkoutRecoveryService';

interface WorkoutRecoveryModalProps {
  recoveryData: RecoveryData[];
  onRecover: (data: RecoveryData) => void;
  onDiscard: (data: RecoveryData) => void;
  onClose: () => void;
}

export const WorkoutRecoveryModal: React.FC<WorkoutRecoveryModalProps> = ({
  recoveryData,
  onRecover,
  onDiscard,
  onClose,
}) => {
  if (recoveryData.length === 0) {
    return null;
  }

  const formatDuration = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    }
    return `${diffMinutes}m ago`;
  };

  const getSourceIcon = (source: RecoveryData['source']) => {
    switch (source) {
      case 'database':
        return '☁️';
      case 'localStorage':
        return '💾';
      case 'sessionStorage':
        return '🔄';
      default:
        return '📱';
    }
  };

  const getSourceLabel = (source: RecoveryData['source']) => {
    switch (source) {
      case 'database':
        return 'Cloud Backup';
      case 'localStorage':
        return 'Local Backup';
      case 'sessionStorage':
        return 'Session Backup';
      default:
        return 'Device Storage';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                🔄 Workout Recovery
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                We found {recoveryData.length} interrupted workout{recoveryData.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Recovery Options */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {recoveryData.map((data, index) => (
            <div
              key={`${data.workout.id}-${index}`}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {/* Workout Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {data.workout.name}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {data.workout.exercises.length} exercise{data.workout.exercises.length !== 1 ? 's' : ''}
                    {' • '}
                    {formatDuration(data.timestamp)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-lg">{getSourceIcon(data.source)}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {getSourceLabel(data.source)}
                  </span>
                </div>
              </div>

              {/* Workout Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    data.workout.status === 'paused' 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {data.workout.status.replace('_', ' ')}
                  </span>
                </div>
                
                {!data.isValid && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ May be corrupted
                  </span>
                )}
              </div>

              {/* Progress Info */}
              {data.workout.exercises.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Progress
                  </div>
                  <div className="space-y-1">
                    {data.workout.exercises.slice(0, 3).map((exercise, exerciseIndex) => {
                      const completedSets = exercise.sets.filter(set => set.completed).length;
                      const totalSets = exercise.sets.length;
                      
                      return (
                        <div key={exerciseIndex} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400 truncate">
                            Exercise {exerciseIndex + 1}
                          </span>
                          <span className="text-gray-500 dark:text-gray-500">
                            {completedSets}/{totalSets} sets
                          </span>
                        </div>
                      );
                    })}
                    {data.workout.exercises.length > 3 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        +{data.workout.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => onRecover(data)}
                  disabled={!data.isValid}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    data.isValid
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Resume
                </button>
                <button
                  onClick={() => onDiscard(data)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your workout data is automatically saved every 10 seconds
            </p>
            <button
              onClick={onClose}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};