/**
 * Comparison Demo Component
 * 
 * Demonstrates the StrengthComparison and GlobalRankings components
 * with sample data and interactive features.
 */

import React, { useState } from 'react';
import StrengthComparison from './StrengthComparison';
import GlobalRankings from './GlobalRankings';

interface DemoUser {
  id: string;
  name: string;
  description: string;
}

const ComparisonDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strength' | 'rankings'>('strength');
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

  // Demo users from our seed data
  const demoUsers: DemoUser[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Alex',
      description: '25M, 75kg, Intermediate - Well-rounded athlete'
    },
    {
      id: '22222222-2222-2222-2222-222222222221',
      name: 'Sarah',
      description: '25F, 60kg, Intermediate - Consistent performer'
    },
    {
      id: '11111111-1111-1111-1111-111111111115',
      name: 'Mike',
      description: '25M, 90kg, Expert - High-level competitor'
    },
    {
      id: '33333333-3333-3333-3333-333333333331',
      name: 'David',
      description: '32M, 80kg, Advanced - Experienced lifter'
    }
  ];

  const exercises = [
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Bench Press' },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Squat' },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Deadlift' },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Overhead Press' }
  ];

  const exerciseNames = exercises.reduce((acc, ex) => {
    acc[ex.id] = ex.name;
    return acc;
  }, {} as { [key: string]: string });

  React.useEffect(() => {
    // Set default user
    setSelectedUser(demoUsers[0]);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Performance Comparison & Rankings Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Explore strength comparisons and global rankings with interactive visualizations.
          This demo shows how users can compare their performance across exercises and see where they rank globally.
        </p>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = demoUsers.find(u => u.id === e.target.value);
                setSelectedUser(user || null);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {demoUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exercise (for Rankings)
            </label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Mode
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setActiveTab('strength')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'strength'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Strength Comparison
                </button>
                <button
                  onClick={() => setActiveTab('rankings')}
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === 'rankings'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Global Rankings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'strength' && selectedUser && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Strength Comparison Analysis for {selectedUser.name}
            </h2>
            <p className="text-gray-600">
              Compare performance across all exercises and demographic segments
            </p>
          </div>
          
          <StrengthComparison
            userId={selectedUser.id}
            exerciseIds={exercises.map(e => e.id)}
            exerciseNames={exerciseNames}
          />
        </div>
      )}

      {activeTab === 'rankings' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Global Rankings for {exerciseNames[selectedExercise]}
            </h2>
            <p className="text-gray-600">
              See how {selectedUser?.name || 'users'} compare to top performers worldwide
            </p>
          </div>
          
          <GlobalRankings
            exerciseId={selectedExercise}
            exerciseName={exerciseNames[selectedExercise]}
            userId={selectedUser?.id}
          />
        </div>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🏋️ Strength Comparison Features
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Multi-exercise performance analysis</li>
            <li>• Demographic segment comparisons</li>
            <li>• Visual percentile charts</li>
            <li>• Strength balance assessment</li>
            <li>• Personalized insights and recommendations</li>
            <li>• Absolute vs relative strength metrics</li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            🏆 Global Rankings Features
          </h3>
          <ul className="text-sm text-green-800 space-y-2">
            <li>• World record and top performer tracking</li>
            <li>• Demographic segment leaderboards</li>
            <li>• Performance distribution analysis</li>
            <li>• User position in global rankings</li>
            <li>• Multiple metric comparisons</li>
            <li>• Interactive segment selection</li>
          </ul>
        </div>
      </div>

      {/* Technical Implementation Notes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          🔧 Implementation Notes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
            <ul className="space-y-1">
              <li>• Supabase PostgreSQL for percentile storage</li>
              <li>• Pre-calculated daily percentile updates</li>
              <li>• Demographic segmentation by age/gender/weight</li>
              <li>• Real-time user ranking calculations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance Optimizations</h4>
            <ul className="space-y-1">
              <li>• Client-side caching with TTL</li>
              <li>• Lazy loading of ranking data</li>
              <li>• Efficient database indexes</li>
              <li>• Batch API calls for multiple exercises</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonDemo;