import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppLayout from './layouts/AppLayout';

// Simple loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Loading LiftFire
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        Preparing your fitness journey...
      </p>
    </div>
  </div>
);

// Lazy load only essential pages
const Home = React.lazy(() => import('./pages/Home'));
const Workout = React.lazy(() => import('./pages/Workout'));
const ExerciseBrowser = React.lazy(() => import('./pages/ExerciseBrowser'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Social = React.lazy(() => import('./pages/Social'));

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple initialization
    const initApp = async () => {
      try {
        // Basic app initialization
        console.log('🔥 LiftFire initializing...');
        
        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsInitialized(true);
        console.log('✅ LiftFire initialized successfully');
      } catch (err) {
        console.error('❌ App initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    };

    initApp();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-900 mb-2">App Error</h1>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/exercises" element={<ExerciseBrowser />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/social" element={<Social />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;