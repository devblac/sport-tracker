import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/layouts/AppLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthPage } from '@/pages/Auth';
import { useAuthStore } from '@/stores';
import { useStoreInitialization, useApiInterceptors } from '@/hooks';
import { logger } from '@/utils';
import { Home } from '@/pages/Home';
import { Progress } from '@/pages/Progress';
import { Workout } from '@/pages/Workout';
import { Social } from '@/pages/Social';
import { Profile } from '@/pages/Profile';
import { DevTest } from '@/pages/DevTest';

function App() {
  const [showAuth, setShowAuth] = useState(true);
  const { isAuthenticated, user, initializeAuth } = useAuthStore();
  
  // Initialize stores
  useStoreInitialization();
  
  // Set up API interceptors
  useApiInterceptors();
  
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

  return (
    <ErrorBoundary>
      <ThemeProvider>
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
              </Routes>
            </AppLayout>
          </Router>
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;