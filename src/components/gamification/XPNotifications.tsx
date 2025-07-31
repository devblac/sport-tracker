/**
 * XP Notifications Component
 * 
 * Displays XP gain notifications, level ups, and achievement unlocks
 * in response to user actions throughout the app.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Trophy, 
  Star, 
  Target, 
  Flame,
  Gift,
  Crown,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { LevelUpToast } from './LevelUpCelebration';
import type { XPAwardResult, Achievement } from '@/types/gamification';

interface XPNotification {
  id: string;
  type: 'xp_gain' | 'level_up' | 'achievement' | 'streak' | 'pr';
  title: string;
  message: string;
  xpAmount?: number;
  icon: React.ReactNode;
  color: string;
  duration: number;
  timestamp: Date;
  data?: any;
}

interface XPNotificationsProps {
  userId: string;
  className?: string;
}

export const XPNotifications: React.FC<XPNotificationsProps> = ({
  userId,
  className
}) => {
  const [notifications, setNotifications] = useState<XPNotification[]>([]);
  const [levelUpData, setLevelUpData] = useState<XPAwardResult['levelUp'] | null>(null);
  const [showLevelUpToast, setShowLevelUpToast] = useState(false);

  // Add notification to queue
  const addNotification = (notification: Omit<XPNotification, 'id' | 'timestamp'>) => {
    const newNotification: XPNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, notification.duration);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle XP award results
  const handleXPAward = (result: XPAwardResult) => {
    // Show XP gain notification
    if (result.xpAwarded > 0) {
      addNotification({
        type: 'xp_gain',
        title: 'XP Gained!',
        message: `+${result.xpAwarded} XP`,
        xpAmount: result.xpAwarded,
        icon: <Zap className="w-5 h-5" />,
        color: 'text-blue-500',
        duration: 3000
      });
    }

    // Show level up notification
    if (result.levelUp) {
      setLevelUpData(result.levelUp);
      setShowLevelUpToast(true);
    }

    // Show achievement notifications
    if (result.achievementsUnlocked) {
      result.achievementsUnlocked.forEach((achievement, index) => {
        setTimeout(() => {
          addNotification({
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: achievement.name,
            icon: <Trophy className="w-5 h-5" />,
            color: 'text-yellow-500',
            duration: 5000,
            data: achievement
          });
        }, index * 1000); // Stagger achievement notifications
      });
    }
  };

  // Expose method to parent components
  useEffect(() => {
    // This would be called by parent components when XP is awarded
    (window as any)[`handleXPAward_${userId}`] = handleXPAward;
    
    return () => {
      delete (window as any)[`handleXPAward_${userId}`];
    };
  }, [userId]);

  // Notification variants for animations
  const notificationVariants = {
    initial: { 
      opacity: 0, 
      x: 100, 
      scale: 0.8 
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0, 
      x: 100, 
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <>
      {/* Notification Container */}
      <div className={cn(
        'fixed top-4 right-4 z-50 space-y-2 max-w-sm',
        className
      )}>
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
                'p-4 flex items-center space-x-3 cursor-pointer',
                'hover:shadow-xl transition-shadow'
              )}
              onClick={() => removeNotification(notification.id)}
            >
              {/* Icon */}
              <div className={cn(
                'flex-shrink-0 p-2 rounded-full',
                notification.type === 'xp_gain' && 'bg-blue-100 dark:bg-blue-900/20',
                notification.type === 'level_up' && 'bg-purple-100 dark:bg-purple-900/20',
                notification.type === 'achievement' && 'bg-yellow-100 dark:bg-yellow-900/20',
                notification.type === 'streak' && 'bg-orange-100 dark:bg-orange-900/20',
                notification.type === 'pr' && 'bg-green-100 dark:bg-green-900/20'
              )}>
                <div className={notification.color}>
                  {notification.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {notification.message}
                </div>
              </div>

              {/* XP Amount Badge */}
              {notification.xpAmount && (
                <div className="flex-shrink-0">
                  <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    +{notification.xpAmount}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Level Up Toast */}
      <LevelUpToast
        isVisible={showLevelUpToast}
        levelUpData={levelUpData}
        onClose={() => setShowLevelUpToast(false)}
        duration={5000}
      />
    </>
  );
};

/**
 * XP Notification Provider Hook
 * 
 * Provides methods to trigger XP notifications from anywhere in the app
 */
export const useXPNotifications = (userId: string) => {
  const triggerXPGain = (amount: number, source: string) => {
    const handler = (window as any)[`handleXPAward_${userId}`];
    if (handler) {
      handler({
        xpAwarded: amount,
        newTotalXP: 0, // Would be calculated
        achievementsUnlocked: [],
        levelUp: null
      });
    }
  };

  const triggerLevelUp = (oldLevel: number, newLevel: number, newTitle: string) => {
    const handler = (window as any)[`handleXPAward_${userId}`];
    if (handler) {
      handler({
        xpAwarded: 0,
        newTotalXP: 0,
        achievementsUnlocked: [],
        levelUp: {
          oldLevel,
          newLevel,
          newTitle,
          unlockedFeatures: []
        }
      });
    }
  };

  const triggerAchievement = (achievement: Achievement) => {
    const handler = (window as any)[`handleXPAward_${userId}`];
    if (handler) {
      handler({
        xpAwarded: achievement.rewards.xp,
        newTotalXP: 0,
        achievementsUnlocked: [achievement],
        levelUp: null
      });
    }
  };

  return {
    triggerXPGain,
    triggerLevelUp,
    triggerAchievement
  };
};

/**
 * Floating XP Indicator
 * 
 * Shows XP gains directly over the action that triggered them
 */
export const FloatingXPIndicator: React.FC<{
  amount: number;
  position: { x: number; y: number };
  onComplete: () => void;
}> = ({ amount, position, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: -50,
        scale: [0.8, 1.2, 1, 0.8]
      }}
      transition={{ duration: 2, ease: 'easeOut' }}
    >
      <div className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg">
        +{amount} XP
      </div>
    </motion.div>
  );
};

/**
 * XP Progress Indicator
 * 
 * Shows real-time XP progress during activities
 */
export const XPProgressIndicator: React.FC<{
  currentXP: number;
  gainedXP: number;
  nextLevelXP: number;
  className?: string;
}> = ({ currentXP, gainedXP, nextLevelXP, className }) => {
  const progress = currentXP / nextLevelXP;
  const newProgress = (currentXP + gainedXP) / nextLevelXP;

  return (
    <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden', className)}>
      {/* Current Progress */}
      <motion.div
        className="h-full bg-blue-500 rounded-full"
        initial={{ width: `${progress * 100}%` }}
        animate={{ width: `${newProgress * 100}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      
      {/* Gained XP Highlight */}
      {gainedXP > 0 && (
        <motion.div
          className="absolute inset-0 bg-yellow-400 rounded-full opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};

export default XPNotifications;