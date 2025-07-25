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
import { logger } from '@/utils';
import { Home } from '@/pages/Home';
import { Progress } from '@/pages/Progress';
import { Workout } from '@/pages/Workout';
import { Social } from '@/pages/Social';
import { Profile } from '@/pages/Profile';
import { DevTest } from '@/pages/DevTest';
import { ExerciseBrowser } from '@/pages/ExerciseBrowser';
import { ExerciseTest } from '@/pages/ExerciseTest';
import { ExerciseDetailPage } from '@/pages/ExerciseDetailPage';
import { WorkoutTemplates } from '@/pages/WorkoutTemplates';
import { WorkoutTemplateTest } from '@/pages/WorkoutTemplateTest';
import { WorkoutPlayerPage } from '@/pages/WorkoutPlayerPage';
import { WorkoutSummary } from '@/pages/WorkoutSummary';
import { WorkoutPlayerTest } from '@/pages/WorkoutPlayerTest';
import { WorkoutTestPage } from '@/pages/WorkoutTestPage';
import { WorkoutSystemTest } from '@/pages/WorkoutSystemTest';

function App() {
  const [showAuth, setShowAuth] = useState(true);
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  
  // Initialize stores
  useStoreInitialization();
  
  // Set up API interceptors
  useApiInterceptors();
  
  // Initialize database
  const { isInitializing: dbInitializing, error: dbError } = useDatabaseInit();
  
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
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
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
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/workout" element={<Workout />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/dev-test" element={<DevTest />} />
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
                </Routes>
                
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