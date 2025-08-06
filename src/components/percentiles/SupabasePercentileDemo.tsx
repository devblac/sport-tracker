/**
 * Supabase Percentile Demo Component
 * 
 * Demonstrates the Supabase-based percentile system with real backend data.
 */

import React, { useState, useEffect } from 'react';
import { supabasePercentileService } from '../../services/SupabasePercentileService';
import { percentileTestRunner } from '../../utils/testSupabasePercentiles';
import SupabasePercentileDisplay from './SupabasePercentileDisplay';

interface TestUser {
  id: string;
  name: string;
  demographics: string;
}

const SupabasePercentileDemo: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<TestUser | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState<any>(null);

  // Test users from the seed data
  const testUsers: TestUser[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Alex (25M, 75kg, Intermediate)',
      demographics: '25 years old, Male, 75kg, Intermediate'
    },
    {
      id: '22222222-2222-2222-2222-222222222221',
      name: 'Sarah (25F, 60kg, Intermediate)',
      demographics: '25 years old, Female, 60kg, Intermediate'
    },
    {
      id: '11111111-1111-1111-1111-111111111115',
      name: 'Mike (25M, 90kg, Expert)',
      demographics: '25 years old, Male, 90kg, Expert'
    },
    {
      id: '33333333-3333-3333-3333-333333333331',
      name: 'David (32M, 80kg, Advanced)',
      demographics: '32 years old, Male, 80kg, Advanced'
    }
  ];

  const exercises = [
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Bench Press' },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Squat' },
    { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Deadlift' },
    { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Overhead Press' }
  ];

  useEffect(() => {
    setSelectedUser(testUsers[0]);
    loadJobStatus();
  }, []);

  const loadJobStatus = async () => {
    try {
      const status = await supabasePercentileService.getLatestJobStatus();
      setJobStatus(status);
    } catch (error) {
      console.error('Failed to load job status:', error);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await percentileTestRunner.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCalculation = async () => {
    setIsLoading(true);
    try {
      const success = await supabasePercentileService.triggerPercentileCalculation();
      if (success) {
        alert('Percentile calculation triggered successfully! Results will be available in a few minutes.');
        await loadJobStatus();
      } else {
        alert('Failed to trigger percentile calculation. Check the console for errors.');
      }
    } catch (error) {
      console.error('Failed to trigger calculation:', error);
      alert('Error triggering calculation. Make sure the Edge Function is deployed.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Supabase Percentile System Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demo shows the Supabase-based percentile calculation system with real backend data.
          Percentiles are calculated daily and cached for fast access.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = testUsers.find(u => u.id === e.target.value);
                setSelectedUser(user || null);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {testUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Exercise
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
            <button
              onClick={runTests}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Running Tests...' : 'Run System Tests'}
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={triggerCalculation}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Triggering...' : 'Trigger Calculation'}
            </button>
          </div>
        </div>
      </div>

      {/* Job Status */}
      {jobStatus && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Latest Calculation Job
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                jobStatus.status === 'completed' ? 'bg-green-100 text-green-800' :
                jobStatus.status === 'running' ? 'bg-blue-100 text-blue-800' :
                jobStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {jobStatus.status}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Users Processed:</span>
              <span className="ml-2 font-medium">{jobStatus.processed_users || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Started:</span>
              <span className="ml-2 font-medium">
                {jobStatus.started_at ? formatDate(jobStatus.started_at) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-medium">
                {jobStatus.completed_at ? formatDate(jobStatus.completed_at) : 'N/A'}
              </span>
            </div>
          </div>
          {jobStatus.error_message && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Error: {jobStatus.error_message}
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            System Test Results
          </h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">{result.message}</span>
                </div>
                {result.error && (
                  <div className="mt-1 text-sm opacity-75">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Percentile Display */}
      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SupabasePercentileDisplay
              userId={selectedUser.id}
              exerciseId={selectedExercise}
              exerciseName={exercises.find(e => e.id === selectedExercise)?.name || ''}
              showAllMetrics={true}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                User Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Demographics:</span>
                  <span className="ml-2 font-medium">{selectedUser.demographics}</span>
                </div>
                <div>
                  <span className="text-gray-600">User ID:</span>
                  <span className="ml-2 font-mono text-xs">{selectedUser.id}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                How It Works
              </h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• Data stored in Supabase PostgreSQL</p>
                <p>• Percentiles calculated daily via Edge Function</p>
                <p>• Results cached for instant loading</p>
                <p>• Demographic segmentation for fair comparison</p>
                <p>• Cost-effective batch processing</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                Setup Required
              </h3>
              <div className="text-xs text-yellow-800 space-y-1">
                <p>1. Start Supabase locally: <code>supabase start</code></p>
                <p>2. Deploy Edge Function: <code>supabase functions deploy</code></p>
                <p>3. Run tests to verify setup</p>
                <p>4. Trigger calculation to populate data</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabasePercentileDemo;