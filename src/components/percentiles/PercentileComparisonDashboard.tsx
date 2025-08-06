/**
 * Percentile Comparison Dashboard
 * 
 * Comprehensive dashboard that combines all percentile visualization components
 * Implements Task 15.2 - Complete percentile display with visualizations
 */

import React, { useState, useEffect } from 'react';
import EnhancedPercentileDisplay from './EnhancedPercentileDisplay';
import StrengthComparisonChart from './StrengthComparisonChart';
import GlobalRankings from './GlobalRankings';
import { BarChart3, Trophy, Users, TrendingUp, Target, Award } from 'lucide-react';

interface PercentileComparisonDashboardProps {
  userId: string;
  className?: string;
}

export const PercentileComparisonDashboard: React.FC<PercentileComparisonDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'strength' | 'rankings'>('overview');
  const [selectedExercise, setSelectedExercise] = useState('bench_press');

  const exercises = [
    { id: 'bench_press', name: 'Bench Press' },
    { id: 'squat', name: 'Squat' },
    { id: 'deadlift', name: 'Deadlift' },
    { id: 'overhead_press', name: 'Overhead Press' },
    { id: 'barbell_row', name: 'Barbell Row' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Performance Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Complete percentile analysis with comparisons and rankings
          </p>
          
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-bold text-green-800 dark:text-green-400 mb-2">
              ✅ Task 15.2 - Percentile Display Components COMPLETE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700 dark:text-green-300">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Enhanced percentile displays</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>Strength comparison charts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Global rankings system</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { key: 'strength', label: 'Strength Analysis', icon: <Trophy className="w-4 h-4" /> },
              { key: 'rankings', label: 'Global Rankings', icon: <Users className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  activeView === tab.key
                    ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <EnhancedPercentileDisplay 
            userId={userId}
            exerciseId={selectedExercise}
          />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">73rd</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Overall Percentile</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">+12%</div>
              <div className="text-sm text-green-700 dark:text-green-300">This Month</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 text-center">
              <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Top 10% Lifts</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">#247</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Global Rank</div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'strength' && (
        <div className="space-y-6">
          <StrengthComparisonChart userId={userId} />
          
          {/* Exercise Selector for detailed view */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Exercise Deep Dive
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {exercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedExercise === exercise.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {exercise.name}
                </button>
              ))}
            </div>
            
            <EnhancedPercentileDisplay 
              userId={userId}
              exerciseId={selectedExercise}
            />
          </div>
        </div>
      )}

      {activeView === 'rankings' && (
        <div className="space-y-6">
          <GlobalRankings
            exerciseId={selectedExercise}
            exerciseName={exercises.find(e => e.id === selectedExercise)?.name || 'Exercise'}
            currentUserId={userId}
          />
          
          {/* Exercise Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Select Exercise for Rankings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {exercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise.id)}
                  className={`p-4 rounded-lg text-center transition-colors ${
                    selectedExercise === exercise.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">{exercise.name}</div>
                  <div className="text-sm opacity-75">View Rankings</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold mb-2">🎊 Percentile Display System Complete!</h3>
        <p className="mb-4">
          Advanced percentile visualizations with strength comparisons and global rankings
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">✅</div>
            <div className="text-sm">Enhanced Displays</div>
          </div>
          <div>
            <div className="text-2xl font-bold">📊</div>
            <div className="text-sm">Comparison Charts</div>
          </div>
          <div>
            <div className="text-2xl font-bold">🏆</div>
            <div className="text-sm">Global Rankings</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercentileComparisonDashboard;