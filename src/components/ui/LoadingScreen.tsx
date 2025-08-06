/**
 * Professional Loading Screen Component
 * Used during app initialization and page transitions
 */

import React from 'react';
import { Dumbbell } from 'lucide-react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  progress?: number;
  showProgress?: boolean;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = "Loading...",
  subtitle,
  progress = 0,
  showProgress = false,
  className = ""
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center ${className}`}>
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-blue-600 animate-bounce" />
            </div>
          </div>
          
          {/* Spinning Ring */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20">
            <div className="w-full h-full border-4 border-blue-200 dark:border-gray-600 rounded-full animate-spin border-t-blue-600"></div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* App Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>FitTracker Pro</div>
          <div>Your Personal Fitness Journey</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;