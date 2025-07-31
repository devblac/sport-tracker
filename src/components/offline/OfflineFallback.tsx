import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { WifiOff, RefreshCw, Download } from 'lucide-react';

interface OfflineFallbackProps {
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  title = 'You\'re Offline',
  message = 'This content is not available offline. Please check your internet connection and try again.',
  showRetry = true,
  onRetry,
  className = ''
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="text-center py-8">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {message}
        </p>
        
        {showRetry && (
          <Button
            variant="primary"
            onClick={handleRetry}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const WorkoutOfflineFallback: React.FC = () => (
  <OfflineFallback
    title="Workouts Unavailable"
    message="Your workout data is stored locally, but some features require an internet connection. You can still view cached workouts and create new ones offline."
    showRetry={false}
  />
);

export const ExerciseOfflineFallback: React.FC = () => (
  <OfflineFallback
    title="Exercise Database Offline"
    message="The exercise database is cached locally. You can browse previously viewed exercises, but new exercise data requires an internet connection."
    showRetry={false}
  />
);

export const SocialOfflineFallback: React.FC = () => (
  <OfflineFallback
    title="Social Features Offline"
    message="Social features require an internet connection. Your activities will sync automatically when you're back online."
  />
);

export const ProgressOfflineFallback: React.FC = () => (
  <OfflineFallback
    title="Progress Data Offline"
    message="Your progress data is stored locally. Charts and statistics are available offline, but some features may be limited."
    showRetry={false}
  />
);

// Generic offline boundary component
interface OfflineBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  isOnline?: boolean;
}

export const OfflineBoundary: React.FC<OfflineBoundaryProps> = ({
  children,
  fallback: FallbackComponent = OfflineFallback,
  isOnline = navigator.onLine
}) => {
  if (!isOnline) {
    return <FallbackComponent />;
  }

  return <>{children}</>;
};