/**
 * XP Integration Higher-Order Component
 * 
 * Wraps components with automatic XP integration for workout actions.
 * Provides XP context and automatic award handling.
 */

import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useWorkoutXP } from '@/hooks/useWorkoutXP';
import { useXPNotifications } from './XPNotifications';
import { logger } from '@/utils/logger';
import type { Workout } from '@/types/workout';
import type { PersonalRecord } from '@/types/analytics';
import type { XPAwardResult } from '@/types/gamification';

// XP Integration Context
interface XPIntegrationContextType {
  // Core XP Functions
  awardWorkoutXP: (workout: Workout, context?: WorkoutXPContext) => Promise<void>;
  awardPersonalRecordXP: (pr: PersonalRecord, improvement: number) => Promise<void>;
  awardSocialXP: (type: SocialXPType, targetId?: string) => Promise<void>;
  
  // Batch Operations
  processWorkoutCompletion: (workout: Workout, context?: WorkoutXPContext) => Promise<WorkoutXPResult>;
  
  // Utilities
  calculatePotentialXP: (workout: Workout) => Promise<number>;
  showXPPreview: boolean;
  
  // State
  isProcessingXP: boolean;
  lastXPAward: XPAwardResult | null;
}

interface WorkoutXPContext {
  personalRecords?: PersonalRecord[];
  isFirstWorkout?: boolean;
  weeklyWorkoutCount?: number;
  monthlyWorkoutCount?: number;
  totalVolume?: number;
  perfectForm?: boolean;
}

interface WorkoutXPResult {
  totalXP: number;
  awards: XPAwardResult[];
  levelUps: number;
  achievements: string[];
}

type SocialXPType = 'like_given' | 'comment_given' | 'workout_shared' | 'friend_added' | 'mentor_session';

const XPIntegrationContext = createContext<XPIntegrationContextType | null>(null);

// XP Integration Provider
interface XPIntegrationProviderProps {
  userId: string;
  showXPPreview?: boolean;
  autoAward?: boolean;
  showNotifications?: boolean;
  children: React.ReactNode;
}

export const XPIntegrationProvider: React.FC<XPIntegrationProviderProps> = ({
  userId,
  showXPPreview = true,
  autoAward = true,
  showNotifications = true,
  children
}) => {
  const workoutXP = useWorkoutXP({ 
    userId, 
    autoAward, 
    showNotifications 
  });
  
  const xpNotifications = useXPNotifications(userId);
  const processingRef = useRef(false);

  // Award workout XP with notifications
  const awardWorkoutXP = useCallback(async (
    workout: Workout, 
    context: WorkoutXPContext = {}
  ) => {
    try {
      const awards = await workoutXP.awardWorkoutCompletion(workout, context);
      
      // Trigger notifications for each award
      awards.forEach(award => {
        if (showNotifications) {
          const handler = (window as any)[`handleXPAward_${userId}`];
          if (handler) {
            handler(award);
          }
        }
      });
    } catch (error) {
      logger.error('Error awarding workout XP:', error);
    }
  }, [workoutXP, userId, showNotifications]);

  // Award personal record XP with notifications
  const awardPersonalRecordXP = useCallback(async (
    pr: PersonalRecord, 
    improvement: number
  ) => {
    try {
      const award = await workoutXP.awardPersonalRecord(pr, improvement);
      
      if (award && showNotifications) {
        const handler = (window as any)[`handleXPAward_${userId}`];
        if (handler) {
          handler(award);
        }
      }
    } catch (error) {
      logger.error('Error awarding personal record XP:', error);
    }
  }, [workoutXP, userId, showNotifications]);

  // Award social XP
  const awardSocialXP = useCallback(async (
    type: SocialXPType, 
    targetId?: string
  ) => {
    try {
      const award = await workoutXP.awardSocialInteraction(type, targetId);
      
      if (award && showNotifications) {
        xpNotifications.triggerXPGain(award.xpAwarded, type);
      }
    } catch (error) {
      logger.error('Error awarding social XP:', error);
    }
  }, [workoutXP, xpNotifications, showNotifications]);

  // Process complete workout with all XP awards
  const processWorkoutCompletion = useCallback(async (
    workout: Workout, 
    context: WorkoutXPContext = {}
  ): Promise<WorkoutXPResult> => {
    if (processingRef.current) {
      return { totalXP: 0, awards: [], levelUps: 0, achievements: [] };
    }

    try {
      processingRef.current = true;
      
      const result = await workoutXP.processWorkoutCompletion(workout, context);
      
      // Trigger notifications for the complete result
      if (showNotifications && result.totalXP > 0) {
        // Show summary notification
        const handler = (window as any)[`handleXPAward_${userId}`];
        if (handler && result.awards.length > 0) {
          // Show the most significant award (usually the first one)
          handler(result.awards[0]);
          
          // Show additional achievements if any
          result.awards.slice(1).forEach((award, index) => {
            setTimeout(() => handler(award), (index + 1) * 1000);
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error processing workout completion XP:', error);
      return { totalXP: 0, awards: [], levelUps: 0, achievements: [] };
    } finally {
      processingRef.current = false;
    }
  }, [workoutXP, userId, showNotifications]);

  const contextValue: XPIntegrationContextType = {
    awardWorkoutXP,
    awardPersonalRecordXP,
    awardSocialXP,
    processWorkoutCompletion,
    calculatePotentialXP: workoutXP.calculatePotentialXP,
    showXPPreview,
    isProcessingXP: workoutXP.isProcessing,
    lastXPAward: workoutXP.lastXPAward
  };

  return (
    <XPIntegrationContext.Provider value={contextValue}>
      {children}
    </XPIntegrationContext.Provider>
  );
};

// Hook to use XP integration context
export const useXPIntegration = (): XPIntegrationContextType => {
  const context = useContext(XPIntegrationContext);
  if (!context) {
    throw new Error('useXPIntegration must be used within XPIntegrationProvider');
  }
  return context;
};

// Higher-Order Component for XP integration
export function withXPIntegration<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    userId: string;
    showXPPreview?: boolean;
    autoAward?: boolean;
    showNotifications?: boolean;
  }
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <XPIntegrationProvider {...options}>
        <Component {...props} />
      </XPIntegrationProvider>
    );
  };

  WrappedComponent.displayName = `withXPIntegration(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// XP Action Wrapper Component
interface XPActionWrapperProps {
  children: (xpIntegration: XPIntegrationContextType) => React.ReactNode;
}

export const XPActionWrapper: React.FC<XPActionWrapperProps> = ({ children }) => {
  const xpIntegration = useXPIntegration();
  return <>{children(xpIntegration)}</>;
};

// XP Preview Component
export const XPPreview: React.FC<{
  workout?: Workout;
  className?: string;
}> = ({ workout, className }) => {
  const { calculatePotentialXP, showXPPreview } = useXPIntegration();
  const [potentialXP, setPotentialXP] = React.useState<number>(0);

  React.useEffect(() => {
    if (workout && showXPPreview) {
      calculatePotentialXP(workout).then(setPotentialXP);
    }
  }, [workout, calculatePotentialXP, showXPPreview]);

  if (!showXPPreview || !workout || potentialXP === 0) {
    return null;
  }

  return (
    <div className={`inline-flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 ${className}`}>
      <span>Potential XP:</span>
      <span className="font-bold">+{potentialXP}</span>
    </div>
  );
};

// XP Button Component - Button that awards XP when clicked
interface XPButtonProps {
  children: React.ReactNode;
  xpAmount: number;
  xpSource: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const XPButton: React.FC<XPButtonProps> = ({
  children,
  xpAmount,
  xpSource,
  onClick,
  disabled,
  className
}) => {
  const xpNotifications = useXPNotifications('current-user'); // Would get from context

  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick?.();
      xpNotifications.triggerXPGain(xpAmount, xpSource);
    }
  }, [onClick, disabled, xpAmount, xpSource, xpNotifications]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative ${className}`}
    >
      {children}
      {xpAmount > 0 && (
        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          +{xpAmount}
        </span>
      )}
    </button>
  );
};

// XP Multiplier Display
export const XPMultiplierDisplay: React.FC<{
  multiplier: number;
  source: string;
  className?: string;
}> = ({ multiplier, source, className }) => {
  if (multiplier <= 1) return null;

  return (
    <div className={`inline-flex items-center space-x-1 text-xs ${className}`}>
      <span className="text-green-600 dark:text-green-400 font-bold">
        {multiplier.toFixed(1)}x
      </span>
      <span className="text-gray-500 dark:text-gray-400">
        {source}
      </span>
    </div>
  );
};

export default withXPIntegration;