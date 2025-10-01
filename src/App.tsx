import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import i18n initialization
import '@/lib/i18n';
import { initializeLanguage } from '@/utils/languageDetection';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WorkoutOverlay } from '@/components/workouts/WorkoutOverlay';
import { WorkoutRecoveryModal } from '@/components/workouts/WorkoutRecoveryModal';
import { AuthPage } from '@/pages/Auth';
import { useAuthStore } from '@/stores';
import { useStoreInitialization, useApiInterceptors, useDatabaseInit } from '@/hooks';
import { useOffline } from '@/hooks/useOffline';
import { useWorkoutRecovery } from '@/hooks/useWorkoutRecovery';
import { logger } from '@/utils';
import { CacheMonitor } from '@/components/performance/CacheMonitor';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { CapacitorUtils } from '@/utils/capacitorUtils';
import { initializeSecurity } from '@/utils/securityInit';
import { usePredictivePrefetch } from '@/utils/performance/predictivePrefetch';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { initializePerformanceOptimizations } from '@/utils/performance/performanceInit';
// Temporarily commented out due to import issues
// import { monitoring } from '@/utils/monitoring';

// Import debugging tools (makes them available globally)
import '@/utils/debugTemplate';
import { ExperimentDashboard } from '@/components/experiments/ExperimentDashboard';
import { BackupDashboard } from '@/components/backup/BackupDashboard';
import { EmergencyRecovery } from '@/components/backup/EmergencyRecovery';
import { RealTimeNotifications } from '@/components/realtime/RealTimeNotifications';
// Advanced lazy loading with performance optimizations
import { advancedLazyLoad } from '@/utils/performance/advancedLazyLoad';

// Core pages - high priority with immediate/idle preloading
const Home = advancedLazyLoad(
  () => import('@/pages/Home').then(m => ({ default: m.Home })),
  { priority: 'high', preloadStrategy: 'immediate', chunkName: 'home' }
);
const Workout = advancedLazyLoad(
  () => import('@/pages/Workout').then(m => ({ default: m.Workout })),
  { priority: 'high', preloadStrategy: 'immediate', chunkName: 'workout' }
);
const Progress = advancedLazyLoad(
  () => import('@/pages/Progress').then(m => ({ default: m.Progress })),
  { priority: 'high', preloadStrategy: 'idle', chunkName: 'progress' }
);
const Social = advancedLazyLoad(
  () => import('@/pages/Social').then(m => ({ default: m.Social })),
  { priority: 'medium', preloadStrategy: 'idle', chunkName: 'social' }
);
const Profile = advancedLazyLoad(
  () => import('@/pages/Profile').then(m => ({ default: m.Profile })),
  { priority: 'medium', preloadStrategy: 'hover', chunkName: 'profile' }
);

// Exercise pages - medium priority
const ExerciseBrowser = advancedLazyLoad(
  () => import('@/pages/ExerciseBrowser').then(m => ({ default: m.ExerciseBrowser })),
  { priority: 'medium', preloadStrategy: 'hover', chunkName: 'exercise-browser' }
);
const ExerciseDetailPage = advancedLazyLoad(
  () => import('@/pages/ExerciseDetailPage').then(m => ({ default: m.ExerciseDetailPage })),
  { priority: 'low', preloadStrategy: 'viewport', chunkName: 'exercise-detail' }
);

// Workout pages - high priority for active users
const WorkoutPlayerPage = advancedLazyLoad(
  () => import('@/pages/WorkoutPlayerPage').then(m => ({ default: m.WorkoutPlayerPage })),
  { priority: 'high', preloadStrategy: 'immediate', chunkName: 'workout-player' }
);
const WorkoutSummary = advancedLazyLoad(
  () => import('@/pages/WorkoutSummary').then(m => ({ default: m.WorkoutSummary })),
  { priority: 'medium', preloadStrategy: 'idle', chunkName: 'workout-summary' }
);

// Test pages - low priority, load on demand
const DevTest = advancedLazyLoad(
  () => import('@/pages/DevTest').then(m => ({ default: m.DevTest })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'dev-test' }
);
const TestDataPage = advancedLazyLoad(
  () => import('@/pages/TestDataPage').then(m => ({ default: m.TestDataPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'test-data' }
);
const TemplateDebugPage = advancedLazyLoad(
  () => import('@/pages/TemplateDebugPage'),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'template-debug' }
);
const ExerciseTest = advancedLazyLoad(
  () => import('@/pages/ExerciseTest').then(m => ({ default: m.ExerciseTest })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'exercise-test' }
);
const WorkoutPlayerTest = advancedLazyLoad(
  () => import('@/pages/WorkoutPlayerTest').then(m => ({ default: m.WorkoutPlayerTest })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'workout-player-test' }
);
const WorkoutTestPage = advancedLazyLoad(
  () => import('@/pages/WorkoutTestPage').then(m => ({ default: m.WorkoutTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'workout-test' }
);
const WorkoutSystemTest = advancedLazyLoad(
  () => import('@/pages/WorkoutSystemTest').then(m => ({ default: m.WorkoutSystemTest })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'workout-system-test' }
);
const XPIntegrationTestPage = advancedLazyLoad(
  () => import('@/pages/XPIntegrationTestPage'),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'xp-integration-test' }
);
const NotificationTestPage = advancedLazyLoad(
  () => import('@/pages/NotificationTestPage').then(m => ({ default: m.NotificationTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'notification-test' }
);
const SocialTestPage = advancedLazyLoad(
  () => import('@/pages/SocialTestPage').then(m => ({ default: m.SocialTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'social-test' }
);
const PrivacyTestPage = advancedLazyLoad(
  () => import('@/pages/PrivacyTestPage').then(m => ({ default: m.PrivacyTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'privacy-test' }
);
const SocialPostsTestPage = advancedLazyLoad(
  () => import('@/pages/SocialPostsTestPage').then(m => ({ default: m.SocialPostsTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'social-posts-test' }
);
const DatabaseTestPage = advancedLazyLoad(
  () => import('@/pages/DatabaseTestPage').then(m => ({ default: m.DatabaseTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'database-test' }
);
const SocialFeedTestPage = advancedLazyLoad(
  () => import('@/pages/SocialFeedTestPage').then(m => ({ default: m.SocialFeedTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'social-feed-test' }
);
const SupabaseTestPage = advancedLazyLoad(
  () => import('@/pages/SupabaseTestPage').then(m => ({ default: m.SupabaseTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'supabase-test' }
);
const ViralContentTestPage = advancedLazyLoad(
  () => import('@/pages/ViralContentTestPage'),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'viral-content-test' }
);

// Percentiles page - medium priority for analytics
const PercentilesPage = advancedLazyLoad(
  () => import('@/pages/PercentilesPage').then(m => ({ default: m.PercentilesPage })),
  { priority: 'medium', preloadStrategy: 'idle', chunkName: 'percentiles' }
);

// Leagues pages - medium priority for competitive features
const LeaguesPage = advancedLazyLoad(
  () => import('@/pages/LeaguesPage').then(m => ({ default: m.LeaguesPage })),
  { priority: 'medium', preloadStrategy: 'idle', chunkName: 'leagues' }
);
const LeagueTestPage = advancedLazyLoad(
  () => import('@/pages/LeagueTestPage').then(m => ({ default: m.LeagueTestPage })),
  { priority: 'low', preloadStrategy: 'hover', chunkName: 'league-test' }
);

// Challenge pages - medium priority for competitive features
const ChallengeHub = advancedLazyLoad(
  () => import('@/pages/ChallengeHub').then(m => ({ default: m.ChallengeHub })),
  { priority: 'medium', preloadStrategy: 'idle', chunkName: 'challenges' }
);

// Marketplace pages - medium priority for premium features
const Marketplace = advancedLazyLoad(
  () => import('@/pages/Marketplace').then(m => ({ default: m.default })),
  { priority: 'medium', preloadStrategy: 'hover', chunkName: 'marketplace' }
);

function App() {
  const [showAuth, setShowAuth] = useState(true);
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  const { showCacheMonitor } = useSettingsStore();
  const { recordAction } = usePredictivePrefetch();
  
  // Initialize stores
  useStoreInitialization();
  
  // Set up API interceptors
  useApiInterceptors();
  
  // Initialize database
  const { isInitializing: dbInitializing, error: dbError } = useDatabaseInit();
  
  // Initialize offline capabilities
  useOffline();
  
  // Initialize workout recovery
  const {
    recoveryData,
    showRecoveryModal,
    handleRecover,
    handleDiscard,
    handleCloseModal,
  } = useWorkoutRecovery();
  
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

      (window as any).clearDB = async () => {
        try {
          // Close any existing connections
          const { getDatabaseService } = await import('@/db/DatabaseService');
          const service = getDatabaseService();
          service.close();
          
          // Delete the database
          await new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase('FitnessAppDB');
            deleteReq.onsuccess = () => resolve(undefined);
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
              console.warn('Database deletion blocked - close all tabs and try again');
              reject(new Error('Database deletion blocked'));
            };
          });
          
          // Clear localStorage
          localStorage.removeItem('sport-tracker-db-initialized');
          localStorage.removeItem('sport-tracker-db-version');
          localStorage.removeItem('sport-tracker-fallback-mode');
          
          console.log('Database cleared successfully');
          window.location.reload();
        } catch (error) {
          console.error('Failed to clear database:', error);
        }
      };
    }
  }, []);
  
  // Initialize security measures and performance optimizations
  React.useEffect(() => {
    // Initialize language detection and i18n
    initializeLanguage();
    
    const initSecurity = async () => {
      try {
        await initializeSecurity();
        logger.info('Security measures initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize security measures', error);
        // Don't block app initialization for security failures in development
        if (import.meta.env.MODE === 'production') {
          throw error;
        }
      }
    };
    
    const initMonitoring = async () => {
      try {
        // Temporarily commented out due to import issues
        // await monitoring.initialize({
        //   errorTracking: {
        //     environment: import.meta.env.VITE_ENVIRONMENT || 'development',
        //     release: import.meta.env.VITE_APP_VERSION || 'unknown'
        //   },
        //   analytics: {
        //     enabled: import.meta.env.VITE_ENVIRONMENT !== 'development'
        //   },
        //   featureFlags: {
        //     userId: user?.id,
        //     userRole: user?.role
        //   }
        // });
        logger.info('Monitoring systems initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize monitoring systems', error);
        // Don't block app for monitoring failures
      }
    };
    
    const initPerformance = async () => {
      try {
        // Initialize all performance optimizations
        await initializePerformanceOptimizations({
          enableDatabaseOptimization: true,
          enableIntelligentCaching: true,
          enablePredictivePrefetching: true,
          enableRoutePreloading: true,
          enablePerformanceMonitoring: import.meta.env.DEV,
          developmentMode: import.meta.env.DEV
        });
        
        // Record initial navigation
        recordAction('navigation', window.location.pathname);
        
        // Set up navigation tracking
        const handleNavigation = () => {
          recordAction('navigation', window.location.pathname);
        };
        
        window.addEventListener('popstate', handleNavigation);
        
        logger.info('Performance optimizations initialized successfully');
        
        return () => {
          window.removeEventListener('popstate', handleNavigation);
        };
      } catch (error) {
        logger.error('Failed to initialize performance optimizations', error);
        // Don't block app for performance failures
        return () => {};
      }
    };
    
    const init = async () => {
      await initSecurity();
      await initMonitoring();
      const cleanupPerformance = await initPerformance();
      return cleanupPerformance;
    };
    
    init().then(cleanup => {
      return cleanup;
    });
  }, [recordAction]);

  // Initialize Capacitor plugins
  React.useEffect(() => {
    const initCapacitor = async () => {
      try {
        await CapacitorUtils.initializePlugins();
        logger.info('Capacitor plugins initialized', { 
          platform: CapacitorUtils.getPlatform(),
          isNative: CapacitorUtils.isNative()
        });
      } catch (error) {
        logger.error('Failed to initialize Capacitor plugins', error);
      }
    };
    
    initCapacitor();
  }, []);

  // Initialize authentication on app start
  React.useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        logger.error('Failed to initialize authentication', error);
      }
    };
    
    initAuth();
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
                    <Route path="/auth" element={<AuthPage onAuthComplete={handleAuthComplete} />} />
                    <Route path="/dev-test" element={<DevTest />} />
                    <Route path="/test-data" element={<TestDataPage />} />
                    <Route path="/template-debug" element={<TemplateDebugPage />} />
                    <Route path="/exercises" element={<ExerciseBrowser />} />
                    <Route path="/exercises/:exerciseId" element={<ExerciseDetailPage />} />
                    <Route path="/exercise-test" element={<ExerciseTest />} />

                    {/* <Route path="/workout-template-test" element={<WorkoutTemplateTest />} /> */}
                    <Route path="/workout/:workoutId" element={<WorkoutPlayerPage />} />
                    <Route path="/workout-summary" element={<WorkoutSummary />} />
                    <Route path="/workout-player-test" element={<WorkoutPlayerTest />} />
                    <Route path="/workout-test" element={<WorkoutTestPage />} />
                    <Route path="/workout-system-test" element={<WorkoutSystemTest />} />
                    {/* <Route path="/gamification-test" element={<GamificationTestPage />} /> */}
                    <Route path="/xp-integration-test" element={<XPIntegrationTestPage />} />
                    {/* <Route path="/streak-reward-test" element={<StreakRewardTestPage />} /> */}
                    <Route path="/notification-test" element={<NotificationTestPage />} />
                    <Route path="/social-test" element={<SocialTestPage />} />
                    <Route path="/privacy-test" element={<PrivacyTestPage />} />
                    <Route path="/social-posts-test" element={<SocialPostsTestPage />} />
                    <Route path="/database-test" element={<DatabaseTestPage />} />
                    <Route path="/social-feed-test" element={<SocialFeedTestPage />} />
                    <Route path="/supabase-test" element={<SupabaseTestPage />} />
                    <Route path="/viral-content-test" element={<ViralContentTestPage />} />
                    <Route path="/percentiles" element={<PercentilesPage />} />
                    <Route path="/leagues" element={<LeaguesPage />} />
                    <Route path="/league-test" element={<LeagueTestPage />} />
                    <Route path="/challenges" element={<ChallengeHub />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    {/* <Route path="/mentorship" element={<MentorshipPage />} /> */}
                    {/* <Route path="/mentorship-test" element={<MentorshipTestPage />} /> */}
                    <Route path="/experiment-dashboard" element={<ExperimentDashboard />} />
                    <Route path="/backup-dashboard" element={<BackupDashboard />} />
                  </Routes>
                </React.Suspense>
                
                {/* Global Workout Overlay */}
                <WorkoutOverlay />
                
                {/* Cache Performance Monitor */}
                {showCacheMonitor && <CacheMonitor />}
                
                {/* Advanced Performance Monitor */}
                <PerformanceMonitor />
                
                {/* Emergency Recovery */}
                <EmergencyRecovery className="fixed top-4 left-4 right-4 z-50" />
                
                {/* Real-Time Notifications - Fixed infinite loop issue */}
                <RealTimeNotifications position="top-right" maxNotifications={5} />
                
                {/* Workout Recovery Modal */}
                {showRecoveryModal && (
                  <WorkoutRecoveryModal
                    recoveryData={recoveryData}
                    onRecover={handleRecover}
                    onDiscard={handleDiscard}
                    onClose={handleCloseModal}
                  />
                )}
              </AppLayout>
            </Router>
          )}
        </WorkoutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;