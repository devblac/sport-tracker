/**
 * Level Up Celebration Component
 * 
 * Epic celebration animation when user levels up, showing new level,
 * unlocked features, and congratulatory effects.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Star, 
  Sparkles, 
  Trophy, 
  Gift, 
  Unlock,
  ChevronRight,
  Share2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { LevelBadge } from './LevelBadge';
import type { XPAwardResult } from '@/types/gamification';

interface LevelUpCelebrationProps {
  isOpen: boolean;
  levelUpData: XPAwardResult['levelUp'];
  onClose: () => void;
  onShare?: () => void;
  className?: string;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  isOpen,
  levelUpData,
  onClose,
  onShare,
  className
}) => {
  const [showContent, setShowContent] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  useEffect(() => {
    if (isOpen && levelUpData) {
      // Stagger the animations
      const timer1 = setTimeout(() => setShowContent(true), 500);
      const timer2 = setTimeout(() => setShowFeatures(true), 1500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setShowContent(false);
      setShowFeatures(false);
      setCurrentFeatureIndex(0);
    }
  }, [isOpen, levelUpData]);

  // Cycle through unlocked features
  useEffect(() => {
    if (showFeatures && levelUpData?.unlockedFeatures.length > 1) {
      const interval = setInterval(() => {
        setCurrentFeatureIndex(prev => 
          (prev + 1) % levelUpData.unlockedFeatures.length
        );
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [showFeatures, levelUpData?.unlockedFeatures.length]);

  if (!isOpen || !levelUpData) return null;

  // Create floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    color: ['text-yellow-400', 'text-blue-400', 'text-purple-400', 'text-pink-400'][Math.floor(Math.random() * 4)]
  }));

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.5, 
      opacity: 0,
      rotateY: -90
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      rotateY: 0,
      transition: { 
        duration: 0.6,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100
      }
    },
    exit: { 
      scale: 0.5, 
      opacity: 0,
      rotateY: 90,
      transition: { duration: 0.3 }
    }
  };

  const contentVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  const featureVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    exit: { 
      x: -50, 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/80 backdrop-blur-sm',
          className
        )}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        {/* Floating Particles */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className={cn(
              'absolute pointer-events-none',
              particle.color
            )}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [-20, -100],
              rotate: [0, 360]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          >
            <Sparkles className="w-full h-full" />
          </motion.div>
        ))}

        {/* Main Modal */}
        <motion.div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-pink-600/10" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Header */}
          <div className="relative px-6 pt-8 pb-4 text-center">
            {/* Crown Animation */}
            <motion.div
              className="flex justify-center mb-4"
              initial={{ y: -50, rotate: -180, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <Crown className="w-12 h-12 text-yellow-500" />
            </motion.div>

            {/* Level Up Text */}
            <motion.h1
              className="text-3xl font-bold text-gray-800 dark:text-white mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
            >
              LEVEL UP!
            </motion.h1>

            <motion.p
              className="text-gray-600 dark:text-gray-300"
              variants={contentVariants}
              initial="hidden"
              animate={showContent ? "visible" : "hidden"}
            >
              Congratulations! You've reached a new level!
            </motion.p>
          </div>

          {/* Level Transition */}
          <AnimatePresence mode="wait">
            {showContent && (
              <motion.div
                className="px-6 py-4"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center justify-center space-x-6">
                  {/* Old Level */}
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Previous
                    </div>
                    <LevelBadge
                      userLevel={{
                        userId: '',
                        level: levelUpData.oldLevel,
                        currentXP: 0,
                        totalXP: 0,
                        xpForCurrentLevel: 0,
                        xpForNextLevel: 0,
                        progress: 1,
                        title: '',
                        perks: [],
                        updatedAt: new Date()
                      }}
                      size="md"
                      variant="minimal"
                      showAnimation={false}
                    />
                  </div>

                  {/* Arrow */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <ChevronRight className="w-8 h-8 text-blue-500" />
                  </motion.div>

                  {/* New Level */}
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      New Level
                    </div>
                    <LevelBadge
                      userLevel={{
                        userId: '',
                        level: levelUpData.newLevel,
                        currentXP: 0,
                        totalXP: 0,
                        xpForCurrentLevel: 0,
                        xpForNextLevel: 0,
                        progress: 0,
                        title: levelUpData.newTitle,
                        perks: [],
                        updatedAt: new Date()
                      }}
                      size="lg"
                      variant="minimal"
                      showAnimation={true}
                      glowEffect={true}
                    />
                  </div>
                </div>

                {/* New Title */}
                <motion.div
                  className="text-center mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {levelUpData.newTitle}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unlocked Features */}
          <AnimatePresence>
            {showFeatures && levelUpData.unlockedFeatures.length > 0 && (
              <motion.div
                className="px-6 py-4 border-t border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-center mb-3">
                  <Unlock className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Features Unlocked!
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeatureIndex}
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center"
                    variants={featureVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <Gift className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      {levelUpData.unlockedFeatures[currentFeatureIndex]
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {levelUpData.unlockedFeatures.length > 1 && (
                  <div className="flex justify-center mt-2 space-x-1">
                    {levelUpData.unlockedFeatures.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === currentFeatureIndex
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        )}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              {onShare && (
                <motion.button
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  onClick={onShare}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </motion.button>
              )}
              
              <motion.button
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Simple Level Up Toast Notification
 */
export const LevelUpToast: React.FC<{
  isVisible: boolean;
  levelUpData: XPAwardResult['levelUp'];
  onClose: () => void;
  duration?: number;
}> = ({ isVisible, levelUpData, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!levelUpData) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg p-4 max-w-sm"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <div>
              <div className="font-bold">Level Up!</div>
              <div className="text-sm opacity-90">
                You're now level {levelUpData.newLevel} - {levelUpData.newTitle}
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpCelebration;