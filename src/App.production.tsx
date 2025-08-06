/**
 * Production App Component
 * Clean, optimized version for app store release
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WorkoutOverlay } from '@/components/workouts/WorkoutOverlay';
import { AuthPage } from '@/pages/Auth';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { useAuthStore } from '@/stores';
import { useStoreInitialization, useApiInterceptors, useDatabaseInit } from '@/hooks';
import { useOffline } from '@/hooks/useOffline';
import { logger } from '@/utils';
import { PerformanceMonitor, MemoryMonitor } from '@/utils/performance';
import { SecureLogger } from '@/utils/security';

// Lazy load main pages for better performance
const Home = React.lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Progress = React.lazy(() => import('@/pages/Progress').then(m => ({ default: m.Progress })));
const Workout = React.lazy(() => import('@/pages/Workout').then(m => ({ default: m.Workout })));
const Social = React.lazy(() => import('@/pages/Social').then(m => ({ default: m.Social })));
const Profile = React.lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));

// Exercise pages
const ExerciseBrowser = React.lazy(() => import('@/pages/ExerciseBrowser').then(m => ({ default: m.ExerciseBrowser })));
const ExerciseDetailPage = React.lazy(() => import('@/pages/ExerciseDetailPage').then(m => ({ default: m.ExerciseDetailPage })));

// Workout pages
const WorkoutTemplates = React.lazy(() => import('@/pages/WorkoutTemplates').then(m => ({ default: m.WorkoutTemplates })));
const WorkoutPlayerPage = React.lazy(() => import('@/pages/WorkoutPlayerPage').then(m => ({ default: m.WorkoutPlayerPage })));
const WorkoutSummary = React.lazy(() => import('@/pages/WorkoutSummary').then(m => ({ default: m.WorkoutSummary })));

// Analytics pages
const PercentileAnalytics = React.lazy(() => import('@/pages/PercentileAnalytics').then(m => ({ default: m.PercentileAnalytics })));
const ChallengeHub = React.lazy(() => import('@/pages/ChallengeHub').then(m => ({ default: m.ChallengeHub })));

// Marketplace demo
const MarketplaceDemo = React.lazy(() => import('@/components/marketplace/MarketplaceDemo').then(m => ({ default: m.MarketplaceDemo })));

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
  
  // Initialize authentication on app start
  React.useEffect(() => {
    initializeAuth();
    
    // Initialize performance monitoring
    PerformanceMonitor.init();
    MemoryMonitor.startMonitoring();
    
    // Log app startup
    SecureLogger.logError(new Error('App started'), {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
    
    return () => {
      MemoryMonitor.stopMonitoring();
      PerformanceMonitor.cleanup();
    };
  }, [initializeAuth]);

  // Check authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('User authenticated successfully');
      setShowAuth(false);
    } else {
      setShowAuth(true);
    }
  }, [isAuthenticated, user]);

  const handleAuthComplete = () => {
    setShowAuth(false);
  };

  // Show loading screen while database is initializing
  if (dbInitializing) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <LoadingScreen 
            title="Setting up your fitness journey..."
            subtitle="Preparing exercise database and offline features"
            progress={75}
          />
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
              <h2 className="text-xl font-semibold text-foreground">Setup Error</h2>
              <p className="text-muted-foreground">{dbError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
              >
                Try Again
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
                <React.Suspense fallback={
                  <LoadingScreen 
                    title="Loading..."
                    subtitle="Getting things ready"
                    progress={50}
                  />
                }>
                  <Routes>
                    {/* Main Navigation Pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/workout" element={<Workout />} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* Exercise Pages */}
                    <Route path="/exercises" element={<ExerciseBrowser />} />
                    <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
                    
                    {/* Workout Pages */}
                    <Route path="/workout-templates" element={<WorkoutTemplates />} />
                    <Route path="/workout/:workoutId" element={<WorkoutPlayerPage />} />
                    <Route path="/workout-summary" element={<WorkoutSummary />} />
                    
                    {/* Analytics & Social Pages */}
                    <Route path="/analytics" element={<PercentileAnalytics />} />
                    <Route path="/challenges" element={<ChallengeHub />} />
                    
                    {/* Marketplace Demo */}
                    <Route path="/marketplace-demo" element={<MarketplaceDemo />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Home />} />
                  </Routes>
                </React.Suspense>
                
                {/* Global Workout Overlay */}
                <WorkoutOverlay />
                
                {/* PWA Features */}
                <InstallPrompt />
                
                {/* Offline Indicator */}
                <div className="fixed top-4 right-4 z-40">
                  <OfflineIndicator />
                </div>
              </AppLayout>
            </Router>
          )}
        </WorkoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;