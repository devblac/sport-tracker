/**
 * XP Progress Bar Component
 * 
 * Displays user's XP progress towards the next level with smooth animations
 * and visual feedback for XP gains.
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { UserLevel } from '@/types/gamification';

interface XPProgressBarProps {
  userLevel: UserLevel;
  showAnimation?: boolean;
  recentXPGain?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showXPNumbers?: boolean;
  className?: string;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  userLevel,
  showAnimation = true,
  recentXPGain = 0,
  size = 'md',
  showLabels = true,
  showXPNumbers = true,
  className
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showXPGainAnimation, setShowXPGainAnimation] = useState(false);
  const prevProgressRef = useRef(userLevel.progress);

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-2',
      textSize: 'text-xs',
      padding: 'px-2 py-1',
      xpGainSize: 'text-xs'
    },
    md: {
      height: 'h-3',
      textSize: 'text-sm',
      padding: 'px-3 py-2',
      xpGainSize: 'text-sm'
    },
    lg: {
      height: 'h-4',
      textSize: 'text-base',
      padding: 'px-4 py-3',
      xpGainSize: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Animate progress bar when progress changes
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimatedProgress(userLevel.progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(userLevel.progress);
    }
  }, [userLevel.progress, showAnimation]);

  // Show XP gain animation when recent XP is provided
  useEffect(() => {
    if (recentXPGain > 0) {
      setShowXPGainAnimation(true);
      const timer = setTimeout(() => {
        setShowXPGainAnimation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [recentXPGain]);

  // Check if progress increased (for special effects)
  const progressIncreased = userLevel.progress > prevProgressRef.current;
  useEffect(() => {
    prevProgressRef.current = userLevel.progress;
  }, [userLevel.progress]);

  return (
    <div className={cn('relative', className)}>
      {/* Level and XP Labels */}
      {showLabels && (
        <div className="flex justify-between items-center mb-2">
          <div className={cn('font-semibold text-gray-700 dark:text-gray-300', config.textSize)}>
            Level {userLevel.level}
          </div>
          {showXPNumbers && (
            <div className={cn('text-gray-500 dark:text-gray-400', config.textSize)}>
              {userLevel.currentXP.toLocaleString()} / {(userLevel.xpForNextLevel - userLevel.xpForCurrentLevel).toLocaleString()} XP
            </div>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={cn(
        'relative bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
        config.height
      )}>
        {/* Background Glow Effect */}
        {progressIncreased && showAnimation && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
        )}

        {/* Progress Fill */}
        <motion.div
          className={cn(
            'h-full rounded-full relative overflow-hidden',
            'bg-gradient-to-r from-blue-500 to-purple-600',
            'shadow-sm'
          )}
          initial={{ width: `${prevProgressRef.current * 100}%` }}
          animate={{ width: `${animatedProgress * 100}%` }}
          transition={{
            duration: showAnimation ? 0.8 : 0,
            ease: 'easeOut'
          }}
        >
          {/* Shimmer Effect */}
          {showAnimation && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: progressIncreased ? 2 : 0,
                ease: 'linear'
              }}
            />
          )}

          {/* Pulse Effect for Recent Gains */}
          {recentXPGain > 0 && showAnimation && (
            <motion.div
              className="absolute inset-0 bg-white/10 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{
                duration: 0.6,
                repeat: 3,
                ease: 'easeInOut'
              }}
            />
          )}
        </motion.div>

        {/* Progress Percentage Text */}
        {size === 'lg' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-white drop-shadow-sm">
              {Math.round(userLevel.progress * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* XP Gain Animation */}
      <AnimatePresence>
        {showXPGainAnimation && recentXPGain > 0 && (
          <motion.div
            className={cn(
              'absolute -top-8 right-0 font-bold text-green-500',
              config.xpGainSize
            )}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            +{recentXPGain} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Title */}
      {showLabels && userLevel.title && (
        <div className={cn(
          'text-center mt-2 font-medium text-gray-600 dark:text-gray-400',
          config.textSize
        )}>
          {userLevel.title}
        </div>
      )}

      {/* Next Level Preview */}
      {showLabels && size === 'lg' && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Current: Level {userLevel.level}</span>
          <span>Next: Level {userLevel.level + 1}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact XP Progress Bar for smaller spaces
 */
export const CompactXPProgressBar: React.FC<{
  userLevel: UserLevel;
  recentXPGain?: number;
  className?: string;
}> = ({ userLevel, recentXPGain, className }) => {
  return (
    <XPProgressBar
      userLevel={userLevel}
      recentXPGain={recentXPGain}
      size="sm"
      showLabels={false}
      showXPNumbers={false}
      className={className}
    />
  );
};

/**
 * Detailed XP Progress Bar with all information
 */
export const DetailedXPProgressBar: React.FC<{
  userLevel: UserLevel;
  recentXPGain?: number;
  className?: string;
}> = ({ userLevel, recentXPGain, className }) => {
  return (
    <div className={cn('space-y-2', className)}>
      <XPProgressBar
        userLevel={userLevel}
        recentXPGain={recentXPGain}
        size="lg"
        showLabels={true}
        showXPNumbers={true}
      />
      
      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Total XP:</span>
          <span className="ml-1">{userLevel.totalXP.toLocaleString()}</span>
        </div>
        <div>
          <span className="font-medium">Progress:</span>
          <span className="ml-1">{Math.round(userLevel.progress * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;