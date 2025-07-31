import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WorkoutOverlay } from '@/components/workouts/WorkoutOverlay';
import { AuthPage } from '@/pages/Auth';
import { useAuthStore } from '@/stores';
import { useStoreInitialization, useApiInterceptors, useDatabaseInit } from '@/hooks';
import { useOffline } from '@/hooks/useOffline';
import { logger } from '@/utils';
// Lazy load pages for better performance
const Home = React.lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Progress = React.lazy(() => import('@/pages/Progress').then(m => ({ default: m.Progress })));
const Workout = React.lazy(() => import('@/pages/Workout').then(m => ({ default: m.Workout })));
const Social = React.lazy(() => import('@/pages/Social').then(m => ({ default: m.Social })));
const Profile = React.lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const DevTest = React.lazy(() => import('@/pages/DevTest').then(m => ({ default: m.DevTest })));
const TestDataPage = React.lazy(() => import('@/pages/TestDataPage').then(m => ({ default: m.TestDataPage })));
const ExerciseBrowser = React.lazy(() => import('@/pages/ExerciseBrowser').then(m => ({ default: m.ExerciseBrowser })));
const ExerciseTest = React.lazy(() => import('@/pages/ExerciseTest').then(m => ({ default: m.ExerciseTest })));
const ExerciseDetailPage = React.lazy(() => import('@/pages/ExerciseDetailPage').then(m => ({ default: m.ExerciseDetailPage })));
const WorkoutTemplates = React.lazy(() => import('@/pages/WorkoutTemplates').then(m => ({ default: m.WorkoutTemplates })));
const WorkoutTemplateTest = React.lazy(() => import('@/pages/WorkoutTemplateTest').then(m => ({ default: m.WorkoutTemplateTest })));
const WorkoutPlayerPage = React.lazy(() => import('@/pages/WorkoutPlayerPage').then(m => ({ default: m.WorkoutPlayerPage })));
const WorkoutSummary = React.lazy(() => import('@/pages/WorkoutSummary').then(m => ({ default: m.WorkoutSummary })));
const WorkoutPlayerTest = React.lazy(() => import('@/pages/WorkoutPlayerTest').then(m => ({ default: m.WorkoutPlayerTest })));
const WorkoutTestPage = React.lazy(() => import('@/pages/WorkoutTestPage').then(m => ({ default: m.WorkoutTestPage })));
const WorkoutSystemTest = React.lazy(() => import('@/pages/WorkoutSystemTest').then(m => ({ default: m.WorkoutSystemTest })));
const GamificationTestPage = React.lazy(() => import('@/pages/GamificationTestPage').then(m => ({ default: m.GamificationTestPage })));
const XPIntegrationTestPage = React.lazy(() => import('@/pages/XPIntegrationTestPage').then(m => ({ default: m.XPIntegrationTestPage })));
const StreakRewardTestPage = React.lazy(() => import('@/pages/StreakRewardTestPage').then(m => ({ default: m.StreakRewardTestPage })));
const NotificationTestPage = React.lazy(() => import('@/pages/NotificationTestPage').then(m => ({ default: m.NotificationTestPage })));
const SocialTestPage = React.lazy(() => import('@/pages/SocialTestPage').then(m => ({ default: m.SocialTestPage })));
const PrivacyTestPage = React.lazy(() => import('@/pages/PrivacyTestPage').then(m => ({ default: m.PrivacyTestPage })));
const SocialPostsTestPage = React.lazy(() => import('@/pages/SocialPostsTestPage').then(m => ({ default: m.SocialPostsTestPage })));
const DatabaseTestPage = React.lazy(() => import('@/pages/DatabaseTestPage').then(m => ({ default: m.DatabaseTestPage })));
const SocialFeedTestPage = React.lazy(() => import('@/pages/SocialFeedTestPage').then(m => ({ default: m.SocialFeedTestPage })));

function App() {
  const [showAuth, setShowAuth] = useState(true);
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  
  // Initialize stores
  useStoreInitialization();
  
  // Set up API interceptors
  useApiInterceptors();
  
  // Initialize database
  const { isInitializing: dbInitializing, error: dbError } = useDatabaseInit();
  
  // Initialize offline capabilities
  const offlineState = useOffline();
  
  // Add debug functions to window object in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugDB = async () => {
        const { default: DatabaseInitService } = await import('@/services/DatabaseInitService');
        await DatabaseInitService.debugDatabase();
      };
      
      (window as any).resetDB = async () => {
        const { resetDatabase } = await import('@/utils/databaseReset');
        await resetDatabase();
        window.location.reload();
      };

      (window as any).forceResetDB = async () => {
        const { default: DatabaseInitService } = await import('@/services/DatabaseInitService');
        await DatabaseInitService.forceReset();
        window.location.reload();
      };
    }
  }, []);
  
  // Initialize authentication on app start
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('User is authenticated', { userId: user.id, role: user.role });
      setShowAuth(false);
    } else {
      logger.info('User is not authenticated, showing auth page');
      setShowAuth(true);
    }
  }, [isAuthenticated, user]);

  const handleAuthComplete = () => {
    logger.info('Authentication completed');
    setShowAuth(false);
  };

  // Log app initialization
  logger.info('App initialized');

  // Show loading screen while database is initializing
  if (dbInitializing) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold text-foreground">Initializing Database...</h2>
              <p className="text-muted-foreground">Setting up exercise data for offline use</p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show error screen if database initialization failed
  if (dbError) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md mx-auto p-6">
              <div className="text-destructive text-4xl">⚠️</div>
              <h2 className="text-xl font-semibold text-foreground">Database Error</h2>
              <p className="text-muted-foreground">{dbError}</p>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Retry
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const { resetDatabase } = await import('@/utils/databaseReset');
                      await resetDatabase();
                      window.location.reload();
                    } catch (error) {
                      console.error('Reset failed:', error);
                      alert('Reset failed. Please try refreshing the page.');
                    }
                  }} 
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
                >
                  Reset Database
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                If the problem persists, try opening the browser console and running: <br/>
                <code className="bg-secondary px-1 rounded">window.debugDB()</code>
              </p>
            </div>
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WorkoutProvider>
          {showAuth ? (
            <AuthPage onAuthComplete={handleAuthComplete} />
          ) : (
            <Router>
              <AppLayout>
                <React.Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/workout" element={<Workout />} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/dev-test" element={<DevTest />} />
                    <Route path="/test-data" element={<TestDataPage />} />
                    <Route path="/exercises" element={<ExerciseBrowser />} />
                    <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
                    <Route path="/exercise-test" element={<ExerciseTest />} />
                    <Route path="/workout-templates" element={<WorkoutTemplates />} />
                    <Route path="/workout-template-test" element={<WorkoutTemplateTest />} />
                    <Route path="/workout/:workoutId" element={<WorkoutPlayerPage />} />
                    <Route path="/workout-summary" element={<WorkoutSummary />} />
                    <Route path="/workout-player-test" element={<WorkoutPlayerTest />} />
                    <Route path="/workout-test" element={<WorkoutTestPage />} />
                    <Route path="/workout-system-test" element={<WorkoutSystemTest />} />
                    <Route path="/gamification-test" element={<GamificationTestPage />} />
                    <Route path="/xp-integration-test" element={<XPIntegrationTestPage />} />
                    <Route path="/streak-reward-test" element={<StreakRewardTestPage />} />
                    <Route path="/notification-test" element={<NotificationTestPage />} />
                    <Route path="/social-test" element={<SocialTestPage />} />
                    <Route path="/privacy-test" element={<PrivacyTestPage />} />
                    <Route path="/social-posts-test" element={<SocialPostsTestPage />} />
                    <Route path="/database-test" element={<DatabaseTestPage />} />
                    <Route path="/social-feed-test" element={<SocialFeedTestPage />} />
                  </Routes>
                </React.Suspense>
                
                {/* Global Workout Overlay */}
                <WorkoutOverlay />
              </AppLayout>
            </Router>
          )}
        </WorkoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;