/**
 * Achievement Celebration Component
 * 
 * Displays epic celebration animations when achievements are unlocked.
 * Includes confetti, sound effects, and sharing options.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Share2, 
  X, 
  Sparkles,
  Award,
  Crown,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Achievement, AchievementRarity } from '@/types/gamification';

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  isVisible: boolean;
  onClose: () => void;
  onShare?: () => void;
  className?: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
}

const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  achievement,
  isVisible,
  onClose,
  onShare,
  className
}) => {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // ============================================================================
  // Confetti Animation
  // ============================================================================

  const createConfetti = () => {
    const particles: ConfettiParticle[] = [];
    const colors = getRarityColors(achievement?.rarity || 'common');
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2
        }
      });
    }
    
    setConfetti(particles);
    setShowConfetti(true);
    
    // Stop confetti after 3 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  const updateConfetti = () => {
    if (!showConfetti) return;
    
    setConfetti(prev => 
      prev.map(particle => ({
        ...particle,
        x: particle.x + particle.velocity.x,
        y: particle.y + particle.velocity.y,
        rotation: particle.rotation + 5,
        velocity: {
          ...particle.velocity,
          y: particle.velocity.y + 0.1 // gravity
        }
      })).filter(particle => particle.y < window.innerHeight + 50)
    );
  };

  useEffect(() => {
    if (isVisible && achievement) {
      createConfetti();
    }
  }, [isVisible, achievement]);

  useEffect(() => {
    if (!showConfetti) return;
    
    const interval = setInterval(updateConfetti, 16); // ~60fps
    return () => clearInterval(interval);
  }, [showConfetti]);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  const getRarityColors = (rarity: AchievementRarity): string[] => {
    const colorMap = {
      common: ['#6B7280', '#9CA3AF', '#D1D5DB'],
      uncommon: ['#10B981', '#34D399', '#6EE7B7'],
      rare: ['#3B82F6', '#60A5FA', '#93C5FD'],
      epic: ['#8B5CF6', '#A78BFA', '#C4B5FD'],
      legendary: ['#F59E0B', '#FBBF24', '#FCD34D'],
      mythic: ['#EC4899', '#F472B6', '#F9A8D4']
    };
    return colorMap[rarity];
  };

  const getRarityGradient = (rarity: AchievementRarity): string => {
    const gradients = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600',
      mythic: 'from-pink-400 to-pink-600'
    };
    return gradients[rarity];
  };

  const getRarityIcon = (rarity: AchievementRarity) => {
    const icons = {
      common: Star,
      uncommon: Award,
      rare: Trophy,
      epic: Crown,
      legendary: Sparkles,
      mythic: Zap
    };
    return icons[rarity];
  };

  const getCelebrationLevel = (rarity: AchievementRarity): 'normal' | 'epic' | 'legendary' => {
    if (rarity === 'mythic' || rarity === 'legendary') return 'legendary';
    if (rarity === 'epic' || rarity === 'rare') return 'epic';
    return 'normal';
  };

  if (!achievement) return null;

  const RarityIcon = getRarityIcon(achievement.rarity);
  const celebrationLevel = getCelebrationLevel(achievement.rarity);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Confetti Overlay */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[60]">
              {confetti.map(particle => (
                <div
                  key={particle.id}
                  className="absolute w-2 h-2 rounded"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    backgroundColor: particle.color,
                    width: particle.size,
                    height: particle.size,
                    transform: `rotate(${particle.rotation}deg)`
                  }}
                />
              ))}
            </div>
          )}

          {/* Main Modal */}
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className={cn(
                'relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-8 text-center',
                'shadow-2xl border-4',
                achievement.rarity === 'common' && 'border-gray-300',
                achievement.rarity === 'uncommon' && 'border-green-300',
                achievement.rarity === 'rare' && 'border-blue-300',
                achievement.rarity === 'epic' && 'border-purple-300',
                achievement.rarity === 'legendary' && 'border-yellow-300',
                achievement.rarity === 'mythic' && 'border-pink-300',
                className
              )}
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                ...(celebrationLevel === 'legendary' && {
                  boxShadow: [
                    '0 0 0 0 rgba(255, 215, 0, 0.7)',
                    '0 0 0 20px rgba(255, 215, 0, 0)',
                    '0 0 0 0 rgba(255, 215, 0, 0)'
                  ]
                })
              }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ 
                duration: 0.5, 
                type: 'spring', 
                bounce: 0.3,
                ...(celebrationLevel === 'legendary' && {
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
                })
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Achievement Unlocked Header */}
              <motion.div
                className="mb-6"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className={cn(
                  'inline-flex items-center space-x-2 px-4 py-2 rounded-full text-white font-bold text-sm',
                  `bg-gradient-to-r ${getRarityGradient(achievement.rarity)}`
                )}>
                  <Trophy className="w-4 h-4" />
                  <span>Achievement Unlocked!</span>
                </div>
              </motion.div>

              {/* Achievement Icon */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
              >
                <div className={cn(
                  'relative mx-auto w-24 h-24 rounded-full flex items-center justify-center text-4xl',
                  `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}`,
                  'shadow-lg'
                )}>
                  <span className="text-white">{achievement.icon}</span>
                  
                  {/* Rarity indicator */}
                  <div className="absolute -top-2 -right-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}`,
                      'border-2 border-white dark:border-gray-800'
                    )}>
                      <RarityIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Legendary glow effect */}
                  {celebrationLevel === 'legendary' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-400/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Achievement Details */}
              <motion.div
                className="mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {achievement.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {achievement.description}
                </p>
                
                {/* Rarity and Category */}
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <RarityIcon className="w-4 h-4" />
                    <span className="capitalize font-medium">{achievement.rarity}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span className="capitalize text-gray-600 dark:text-gray-400">
                    {achievement.category}
                  </span>
                </div>
              </motion.div>

              {/* XP Reward */}
              <motion.div
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">+{achievement.rewards.xp} XP</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex space-x-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {onShare && (
                  <button
                    onClick={onShare}
                    className={cn(
                      'flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all',
                      `bg-gradient-to-r ${getRarityGradient(achievement.rarity)}`,
                      'text-white hover:shadow-lg transform hover:scale-105'
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Continue
                </button>
              </motion.div>

              {/* Sparkle Effects for Epic+ Achievements */}
              {(celebrationLevel === 'epic' || celebrationLevel === 'legendary') && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: 'easeInOut'
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AchievementCelebration;