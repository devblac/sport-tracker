import React, { useState } from 'react';
import { AIRecommendationService } from '@/services/AIRecommendationService';
import { RecoveryRecommendationService } from '@/services/RecoveryRecommendationService';
import type { AIRecommendations, RecoveryRecommendation } from '@/types/recommendations';
import type { User } from '@/schemas/user';

const AITestPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [recoveryRecs, setRecoveryRecs] = useState<RecoveryRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock user for testing
  const mockUser: User = {
    id: 'test-user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'basic',
    profile: {
      display_name: 'Test User',
      fitness_level: 'intermediate',
      goals: ['strength', 'muscle_gain']
    },
    settings: {
      theme: 'light',
      units: 'metric',
      notifications: {
        workout_reminders: true,
        achievement_unlocks: true,
        social_activity: true,
        streak_warnings: true,
        quiet_hours: {
          enabled: false,
          start_time: '22:00',
          end_time: '08:00'
        }
      },
      privacy: {
        profile_visibility: 'public',
        workout_sharing: 'friends'
      }
    },
    gamification: {
      level: 5,
      total_xp: 1250,
      current_streak: 7,
      best_streak: 14,
      achievements_unlocked: ['first_workout', 'week_warrior']
    },
    created_at: new Date('2024-01-01')
  };

  const testAIRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const aiService = AIRecommendationService.getInstance();
      const result = await aiService.generateRecommendations(mockUser.id, mockUser, {
        includeWeightSuggestions: true,
        includePlateauDetection: true,
        includeWeaknessAnalysis: true,
        includeRecoveryRecommendations: true,
        includeExerciseRecommendations: true,
        weeksToAnalyze: 4
      });
      
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating recommendations');
    } finally {
      setLoading(false);
    }
  };

  const testRecoveryRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock context for testing
      const mockContext = {
        user_id: mockUser.id,
        recent_workouts: [],
        recovery_status: {
          overall_fatigue: 7, // High fatigue for testing
          muscle_soreness: 6,
          sleep_quality: 5,
          stress_level: 7,
          last_rest_day: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
          consecutive_training_days: 4
        },
        user_goals: ['strength', 'muscle_gain'],
        fitness_level: 'intermediate' as const,
        available_equipment: ['barbell', 'dumbbells'],
        time_constraints: {
          max_workout_duration: 90,
          sessions_per_week: 4
        }
      };
      
      const result = await RecoveryRecommendationService.analyzeRecoveryNeeds(mockContext);
      setRecoveryRecs(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating recovery recommendations');
    } finally {
      setLoading(false);
    }
  };

  const testExerciseSpecific = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const aiService = AIRecommendationService.getInstance();
      const result = await aiService.getExerciseSpecificRecommendations(
        mockUser.id,
        'bench_press',
        10
      );
      
      console.log('Exercise-specific recommendations:', result);
      alert(`Exercise recommendations generated! Check console for details.\n\nWeight: ${result.weightRecommendation.suggestedWeight}kg\nConfidence: ${Math.round(result.weightRecommendation.confidence * 100)}%`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating exercise recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          AI Recommendations Test Page
        </h1>

        {/* Test Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={testAIRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test AI Recommendations'}
          </button>
          
          <button
            onClick={testRecoveryRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Recovery Recommendations'}
          </button>
          
          <button
            onClick={testExerciseSpecific}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Exercise Specific'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-red-800 font-semibold">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* AI Recommendations Display */}
        {recommendations && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              AI Recommendations Results
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {recommendations.plateau_detections.length}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Plateaus</div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {recommendations.weakness_analyses.length}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Weaknesses</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {recommendations.recovery_recommendations.length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Recovery</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {recommendations.workout_suggestions.length}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Suggestions</div>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(recommendations.confidence_score * 100)}%
                </div>
                <div className="text-sm text-indigo-700 dark:text-indigo-300">Confidence</div>
              </div>
              
              <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {recommendations.weight_suggestions.length}
                </div>
                <div className="text-sm text-pink-700 dark:text-pink-300">Weight Tips</div>
              </div>
            </div>

            {/* Workout Suggestions */}
            {recommendations.workout_suggestions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Workout Suggestions
                </h3>
                <div className="space-y-2">
                  {recommendations.workout_suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.priority === 'high' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {suggestion.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw Data */}
            <details className="mt-4">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                View Raw Data
              </summary>
              <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs overflow-auto">
                {JSON.stringify(recommendations, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Recovery Recommendations Display */}
        {recoveryRecs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recovery Recommendations ({recoveryRecs.length})
            </h2>
            
            <div className="space-y-4">
              {recoveryRecs.map((rec, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{rec.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Duración:</strong> {rec.duration}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Pasos:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {rec.implementation_steps.slice(0, 3).map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Beneficios:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {rec.expected_benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITestPage;