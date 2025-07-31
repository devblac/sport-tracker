import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { TestDataGenerator } from '@/utils/testDataGenerator';
import { useAuthStore } from '@/stores';
import { 
  Database, 
  Trash2, 
  BarChart3, 
  Calendar, 
  Dumbbell,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader,
  Trophy,
  Zap,
  Target,
  Star
} from 'lucide-react';

export const TestDataPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Initialize test data generator lazily to avoid constructor issues
  const getTestDataGenerator = () => new TestDataGenerator();

  const handleGenerateTestData = async (preset: 'small' | 'medium' | 'large') => {
    if (!user) return;

    const presets = {
      small: { numWorkouts: 10, daysPeriod: 30, label: '10 workouts (30 days)' },
      medium: { numWorkouts: 25, daysPeriod: 90, label: '25 workouts (90 days)' },
      large: { numWorkouts: 50, daysPeriod: 180, label: '50 workouts (180 days)' },
    };

    const config = presets[preset];
    
    setIsGenerating(true);
    setLastResult(null);

    try {
      const testDataGenerator = getTestDataGenerator();
      const result = await testDataGenerator.generateTestData(user.id, {
        numWorkouts: config.numWorkouts,
        daysPeriod: config.daysPeriod,
        includeRecent: true,
      });

      if (result.success) {
        setLastResult({
          type: 'success',
          message: `Successfully generated ${result.workoutsGenerated} test workouts! Check your Progress page to see the data.`
        });
      } else {
        setLastResult({
          type: 'error',
          message: 'Failed to generate test data. Check the console for details.'
        });
      }
    } catch (error) {
      console.error('Error generating test data:', error);
      setLastResult({
        type: 'error',
        message: 'An error occurred while generating test data.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSingleWorkout = async () => {
    if (!user) return;

    setIsGenerating(true);
    setLastResult(null);

    try {
      const testDataGenerator = getTestDataGenerator();
      const workout = await testDataGenerator.generateRandomWorkout(user.id, 0);
      const success = await testDataGenerator.saveGeneratedWorkouts([workout]);

      if (success) {
        setLastResult({
          type: 'success',
          message: `Generated 1 workout: "${workout.name}" with ${workout.exercises.length} exercises.`
        });
      } else {
        setLastResult({
          type: 'error',
          message: 'Failed to save the generated workout.'
        });
      }
    } catch (error) {
      console.error('Error generating single workout:', error);
      setLastResult({
        type: 'error',
        message: 'An error occurred while generating the workout.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateGamificationData = async (scenario: 'beginner' | 'intermediate' | 'advanced' | 'expert') => {
    if (!user) return;

    const scenarios = {
      beginner: { totalWorkouts: 5, currentStreak: 3, unlockedAchievements: 2, label: 'Beginner (Level 1-2)' },
      intermediate: { totalWorkouts: 25, currentStreak: 7, unlockedAchievements: 8, label: 'Intermediate (Level 3-5)' },
      advanced: { totalWorkouts: 75, currentStreak: 21, unlockedAchievements: 15, label: 'Advanced (Level 6-8)' },
      expert: { totalWorkouts: 200, currentStreak: 45, unlockedAchievements: 20, label: 'Expert (Level 9+)' },
    };

    const config = scenarios[scenario];
    
    setIsGenerating(true);
    setLastResult(null);

    try {
      const testDataGenerator = getTestDataGenerator();
      const result = await testDataGenerator.generateCompleteTestData(user.id, {
        numWorkouts: config.totalWorkouts,
        daysPeriod: Math.max(90, config.totalWorkouts * 2), // Ensure enough days for workouts
        currentStreak: config.currentStreak,
        unlockedAchievements: config.unlockedAchievements,
      });

      if (result.success) {
        const { workouts, gamification } = result.data;
        setLastResult({
          type: 'success',
          message: `Successfully generated ${config.label} data:
            • ${workouts.workoutsGenerated} workouts
            • Level ${gamification.userLevel.level} (${gamification.userLevel.title})
            • ${gamification.userStats.totalXP.toLocaleString()} XP
            • ${config.currentStreak} day streak
            • ${config.unlockedAchievements} achievements unlocked`
        });
      } else {
        setLastResult({
          type: 'error',
          message: 'Failed to generate complete test data. Check the console for details.'
        });
      }
    } catch (error) {
      console.error('Error generating gamification data:', error);
      setLastResult({
        type: 'error',
        message: 'An error occurred while generating gamification data.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL your workout data? This action cannot be undone!'
    );
    
    if (!confirmed) return;

    setIsClearing(true);
    setLastResult(null);

    try {
      const testDataGenerator = getTestDataGenerator();
      const success = await testDataGenerator.clearUserWorkouts(user.id);

      if (success) {
        setLastResult({
          type: 'success',
          message: 'All workout data has been cleared successfully.'
        });
      } else {
        setLastResult({
          type: 'error',
          message: 'Failed to clear workout data. Check the console for details.'
        });
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      setLastResult({
        type: 'error',
        message: 'An error occurred while clearing data.'
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Test Data Generator
        </h1>
        <p className="text-muted-foreground">
          Generate realistic workout data for testing metrics and progress tracking
        </p>
      </div>

      {/* Status Message */}
      {lastResult && (
        <Card className={`border-l-4 ${
          lastResult.type === 'success' 
            ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {lastResult.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <p className={`text-sm ${
                lastResult.type === 'success' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {lastResult.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Test Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Generate Workout History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate realistic workout data with proper progression, personal records, and varied exercises.
            This will populate your Progress page with charts and metrics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleGenerateTestData('small')}
              disabled={isGenerating || isClearing}
              className="h-20 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Calendar className="w-5 h-5 mb-2" />
              )}
              <span className="font-semibold">Small Dataset</span>
              <span className="text-xs opacity-70">10 workouts (30 days)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerateTestData('medium')}
              disabled={isGenerating || isClearing}
              className="h-20 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <BarChart3 className="w-5 h-5 mb-2" />
              )}
              <span className="font-semibold">Medium Dataset</span>
              <span className="text-xs opacity-70">25 workouts (90 days)</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerateTestData('large')}
              disabled={isGenerating || isClearing}
              className="h-20 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5 mb-2" />
              )}
              <span className="font-semibold">Large Dataset</span>
              <span className="text-xs opacity-70">50 workouts (180 days)</span>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="primary"
              onClick={handleGenerateSingleWorkout}
              disabled={isGenerating || isClearing}
              className="w-full"
            >
              {isGenerating ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Dumbbell className="w-4 h-4 mr-2" />
              )}
              Generate Single Workout (Today)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generate Gamification Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Generate Complete Gamification Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate complete datasets with workouts + gamification data (XP, levels, achievements, streaks).
            This creates realistic user scenarios for testing all gamification features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleGenerateGamificationData('beginner')}
              disabled={isGenerating || isClearing}
              className="h-24 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Target className="w-5 h-5 mb-2 text-green-500" />
              )}
              <span className="font-semibold">Beginner</span>
              <span className="text-xs opacity-70">Level 1-2</span>
              <span className="text-xs opacity-70">5 workouts, 3-day streak</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerateGamificationData('intermediate')}
              disabled={isGenerating || isClearing}
              className="h-24 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mb-2 text-blue-500" />
              )}
              <span className="font-semibold">Intermediate</span>
              <span className="text-xs opacity-70">Level 3-5</span>
              <span className="text-xs opacity-70">25 workouts, 7-day streak</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerateGamificationData('advanced')}
              disabled={isGenerating || isClearing}
              className="h-24 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Trophy className="w-5 h-5 mb-2 text-purple-500" />
              )}
              <span className="font-semibold">Advanced</span>
              <span className="text-xs opacity-70">Level 6-8</span>
              <span className="text-xs opacity-70">75 workouts, 21-day streak</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleGenerateGamificationData('expert')}
              disabled={isGenerating || isClearing}
              className="h-24 flex-col"
            >
              {isGenerating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Star className="w-5 h-5 mb-2 text-yellow-500" />
              )}
              <span className="font-semibold">Expert</span>
              <span className="text-xs opacity-70">Level 9+</span>
              <span className="text-xs opacity-70">200 workouts, 45-day streak</span>
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Complete Data:</strong> Each scenario generates workouts, XP transactions, 
                achievements, streaks, and all gamification stats for realistic testing.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your test data. Use these tools to clean up or reset your workout history.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/gamification-test', '_blank')}
              className="h-12"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Gamification Components
            </Button>

            <Button
              variant="outline"
              onClick={() => window.open('/xp-integration-test', '_blank')}
              className="h-12"
            >
              <Zap className="w-4 h-4 mr-2" />
              XP Integration Test
            </Button>

            <Button
              variant="destructive"
              onClick={handleClearAllData}
              disabled={isGenerating || isClearing}
              className="h-12"
            >
              {isClearing ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Clear All Data
            </Button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Clearing data will permanently delete all your workout history. 
                This action cannot be undone.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Gets Generated */}
      <Card>
        <CardHeader>
          <CardTitle>What Gets Generated?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Workout Data:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Realistic exercise selection</li>
                <li>• Progressive weight increases</li>
                <li>• Varied rep ranges (6-12)</li>
                <li>• Multiple sets per exercise</li>
                <li>• Warmup and working sets</li>
                <li>• RPE ratings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Progress Metrics:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Personal records (PRs)</li>
                <li>• Volume progression</li>
                <li>• Workout frequency</li>
                <li>• Exercise variety</li>
                <li>• Time-based trends</li>
                <li>• Chart data points</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Gamification Data:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• XP points and levels</li>
                <li>• Achievement unlocks</li>
                <li>• Workout streaks</li>
                <li>• XP transaction history</li>
                <li>• Performance scores</li>
                <li>• Level progression</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};