import React from 'react';
import { AuthContainer } from '@/components/auth';
import { useAuthStore } from '@/stores';
import { logger } from '@/utils';

interface AuthPageProps {
  onAuthComplete: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthComplete }) => {
  const { isAuthenticated } = useAuthStore();

  // If already authenticated, complete immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, skipping auth page');
      onAuthComplete();
    }
  }, [isAuthenticated, onAuthComplete]);

  return <AuthContainer onAuthComplete={onAuthComplete} />;
};