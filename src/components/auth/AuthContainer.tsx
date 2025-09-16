import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthModeSelector } from './AuthModeSelector';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OnboardingFlow } from './OnboardingFlow';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils';

type AuthMode = 'selector' | 'login' | 'register' | 'onboarding';

interface AuthContainerProps {
  onAuthComplete: () => void;
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<AuthMode>('selector');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { loginAsGuest, isAuthenticated, user } = useAuthStore();

  // Safely get location only if inside Router context
  let location: any = null;
  try {
    location = useLocation();
  } catch (error) {
    // Not inside Router context, location will remain null
    console.log('AuthContainer rendered outside Router context');
  }

  // Handle navigation state (forceSelection from Profile/Social pages)
  useEffect(() => {
    if (location?.state?.forceSelection) {
      setMode('selector');
    }
  }, [location?.state]);

  // Check if user needs onboarding
  useEffect(() => {
    // If forceSelection is true, always show the selector (don't auto-complete)
    if (location?.state?.forceSelection) {
      return;
    }

    if (isAuthenticated && user && user.role !== 'guest') {
      // Check if user has completed basic profile setup
      const needsOnboarding = 
        !user.profile.goals?.length || 
        !user.profile.scheduled_days?.length;
      
      if (needsOnboarding) {
        setShowOnboarding(true);
      } else {
        onAuthComplete();
      }
    } else if (isAuthenticated && user?.role === 'guest') {
      // Guest users skip onboarding
      onAuthComplete();
    }
  }, [isAuthenticated, user, onAuthComplete, location?.state]);

  const handleLoginAsGuest = () => {
    logger.info('User chose to continue as guest');
    loginAsGuest();
  };

  const handleAuthSuccess = () => {
    logger.info('User authentication successful');
    // The useEffect above will handle onboarding check
  };

  const handleOnboardingComplete = () => {
    logger.info('User completed onboarding');
    setShowOnboarding(false);
    onAuthComplete();
  };

  const handleOnboardingSkip = () => {
    logger.info('User skipped onboarding');
    setShowOnboarding(false);
    onAuthComplete();
  };

  // Show onboarding if needed
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    );
  }

  // Show auth forms
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {mode === 'selector' && (
        <AuthModeSelector
          onSelectLogin={() => setMode('login')}
          onSelectRegister={() => setMode('register')}
          onSelectGuest={handleLoginAsGuest}
        />
      )}
      
      {mode === 'login' && (
        <LoginForm
          onSwitchToRegister={() => setMode('register')}
          onLoginAsGuest={handleLoginAsGuest}
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {mode === 'register' && (
        <RegisterForm
          onSwitchToLogin={() => setMode('login')}
          onLoginAsGuest={handleLoginAsGuest}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};