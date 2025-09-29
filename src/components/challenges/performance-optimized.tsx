// Performance-optimized celebration component

import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { CelebrationData } from './celebration-factory';

// Lazy load heavy animation components
const EpicFireworks = lazy(() => import('./animations/EpicFireworks'));
const EpicConfetti = lazy(() => import('./animations/EpicConfetti'));

// Memoized utility functions to prevent recreations
const rankUtils = {
  getIcon: (rank: number): string => {
    const icons = { 1: '👑', 2: '🥈', 3: '🥉' };
    return icons[rank as keyof typeof icons] || '🏆';
  },
  
  getTitle: (rank: number): string => {
    const titles = { 1: 'CHAMPION', 2: 'RUNNER-UP', 3: 'THIRD PLACE' };
    return titles[rank as keyof typeof titles] || `#${rank}`;
  }
};

// Memoized components to prevent unnecessary re-renders
const CelebrationTitle = memo<{ title: string; rank: number }>(({ title, rank }) => (
  <h1 className="text-6xl font-bold mb-4">
    {rankUtils.getIcon(rank)} {title} {rankUtils.getIcon(rank)}
  </h1>
));

const XPDisplay = memo<{ xp: number }>(({ xp }) => {
  const formattedXP = useMemo(() => xp.toLocaleString(), [xp]);
  
  return (
    <div className="text-4xl font-bold mb-6">
      {formattedXP} XP
    </div>
  );
});

const SpecialRewardsList = memo<{ rewards: string[] }>(({ rewards }) => {
  const rewardElements = useMemo(() => 
    rewards.map((reward) => (
      <div key={reward} className="text-lg mb-2">
        🏅 {reward}
      </div>
    )), [rewards]
  );

  return <>{rewardElements}</>;
});

// Main optimized component
interface OptimizedCelebrationProps {
  data: CelebrationData;
  isVisible: boolean;
  onComplete?: () => void;
  className?: string;
}

export const OptimizedCelebration = memo<OptimizedCelebrationProps>(({
  data,
  isVisible,
  onComplete,
  className = ''
}) => {
  // Memoize expensive calculations
  const celebrationConfig = useMemo(() => ({
    title: rankUtils.getTitle(data.rank || 1),
    shouldShowFireworks: (data.rank || 1) <= 3,
    shouldShowConfetti: true,
    animationDuration: data.duration || 6000
  }), [data.rank, data.duration]);

  // Memoized callback to prevent child re-renders
  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Auto-complete with cleanup
  React.useEffect(() => {
    if (!isVisible || !onComplete) return;
    
    const timer = setTimeout(handleComplete, celebrationConfig.animationDuration);
    return () => clearTimeout(timer);
  }, [isVisible, handleComplete, celebrationConfig.animationDuration]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Background - static, no need to memoize */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black" />
      
      {/* Lazy-loaded animations with suspense */}
      <Suspense fallback={null}>
        {celebrationConfig.shouldShowFireworks && <EpicFireworks />}
        {celebrationConfig.shouldShowConfetti && <EpicConfetti />}
      </Suspense>
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full text-center text-white">
          <div className="mb-8">
            <CelebrationTitle 
              title={celebrationConfig.title} 
              rank={data.rank || 1} 
            />
            
            <h2 className="text-3xl font-bold mb-4">{data.title}</h2>
            
            <XPDisplay xp={data.xp} />
            
            {data.type === 'challenge_completion' && data.specialRewards && (
              <SpecialRewardsList rewards={data.specialRewards} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedCelebration.displayName = 'OptimizedCelebration';

// Custom hook for celebration state management
export const useCelebrationState = (initialData: CelebrationData) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [currentData, setCurrentData] = React.useState(initialData);

  const showCelebration = useCallback((data: CelebrationData) => {
    setCurrentData(data);
    setIsVisible(true);
  }, []);

  const hideCelebration = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    currentData,
    showCelebration,
    hideCelebration
  };
};