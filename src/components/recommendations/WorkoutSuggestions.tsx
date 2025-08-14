import React from 'react';
import { Brain, TrendingUp, Target, Clock } from 'lucide-react';
import { useExerciseRecommendations } from '@/hooks/useRecommendations';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

interface WorkoutSuggestionsProps {
  className?: string;
}

export const WorkoutSuggestions: React.FC<WorkoutSuggestionsProps> = ({
  className = ''
}) => {
  const { recommendations, loading } = useExerciseRecommendations();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            AI Workout Suggestions
          </h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            AI Workout Suggestions
          </h3>
        </div>
        <div className="text-center py-4">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Complete a few more workouts to get personalized suggestions
          </p>
        </div>
      </div>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          AI Workout Suggestions
        </h3>
        <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          Based on your performance
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div
            key={index}
            className={`border-l-4 rounded-r-lg p-3 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getPriorityIcon(rec.priority)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {rec.exerciseId.replace('_', ' ')}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === 'high' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {rec.reason}
                </p>
                
                <div className="mt-2">
                  <button className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
                    Add to next workout →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
            View all {recommendations.length} suggestions
          </button>
        </div>
      )}
    </div>
  );
};