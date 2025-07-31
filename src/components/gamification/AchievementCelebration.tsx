/**
 * Achievement Celebration
 * 
 * Epic celebration components for achievement unlocks with different
 * animations and effects based on achievement rarity.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Sparkles,
  Crown,
  Zap,
  Award,
  PartyPopper
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Achievement, AchievementRarity } from '@/types/gamification';
import type { AchievementUnlockResult } from '@/services/AchievementEngine';

interface AchievementCelebrationProps {
  unlockResult: AchievementUnlockResult;
  onComplete: () => void;
  duration?: number;
}

interface ParticleProps {
  color: string;
  delay: number;
  duration: number;
  size: number;
  startX: number;
  startY: number;
}

const Particle: React.FC<ParticleProps> = ({ 
  color, 
  delay, 
  duration, 
  size, 
  startX, 
  startY 
}) => {
  return (
    <motion.div
      className={cn('absolute rounded-full', color)}
      style={{
        width: size,
        height: size,
        left: startX,
        top: startY,
      }}
      initial={{ 
        opacity: 0,
        scale: 0,
        x: 0,
        y: 0
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        rotate: Math.random() * 360
      }}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
    />
  );
};

/**
 * Confetti Effect
 */
const ConfettiEffect: React.FC<{
  rarity: AchievementRarity;
  particleCount?: number;
}> = ({ rarity, particleCount = 50 }) => {
  const getRarityColors = (rarity: AchievementRarity) => {
    const colorSets = {
      common: ['bg-gray-400', 'bg-gray-500', 'bg-gray-600'],
      uncommon: ['bg-green-400', 'bg-green-500', 'bg-green-600'],
      rare: ['bg-blue-400', 'bg-blue-500', 'bg-blue-600'],
      epic: ['bg-purple-400', 'bg-purple-500', 'bg-purple-600'],
      legendary: ['bg-yellow-400', 'bg-orange-400', 'bg-red-400'],
      mythic: ['bg-pink-400', 'bg-purple-400', 'bg-indigo-400']
    };
    return colorSets[rarity];
  };

  const colors = getRarityColors(rarity);
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 8,
    startX: Math.random() * window.innerWidth,
    startY: Math.random() * window.innerHeight
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        <Particle
          key={particle.id}
          color={particle.color}
          delay={particle.delay}
          duration={particle.duration}
          size={particle.size}
          startX={particle.startX}
          startY={particle.startY}
        />
      ))}
    </div>
  );
};

/**
 * Fireworks Effect
 */
const FireworksEffect: React.FC<{
  rarity: AchievementRarity;
}> = ({ rarity }) => {
  const [fireworks, setFireworks] = useState<Array<{
    id: number;
    x: number;
    y: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const fireworkCount = rarity === 'mythic' ? 8 : rarity === 'legendary' ? 6 : 4;
    const newFireworks = Array.from({ length: fireworkCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2,
      delay: i * 0.3
    }));
    setFireworks(newFireworks);
  }, [rarity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {fireworks.map(firework => (
        <motion.div
          key={firework.id}
          className="absolute"
          style={{ left: firework.x, top: firework.y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: firework.delay }}
        >
          {/* Firework burst */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * 30) * Math.PI / 180) * 100,
                y: Math.sin((i * 30) * Math.PI / 180) * 100,
              }}
              transition={{
                duration: 1.5,
                delay: firework.delay,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Screen Flash Effect
 */
const ScreenFlashEffect: React.FC<{
  rarity: AchievementRarity;
}> = ({ rarity }) => {
  const getFlashColor = (rarity: AchievementRarity) => {
    const colors = {
      common: 'bg-gray-500/20',
      uncommon: 'bg-green-500/20',
      rare: 'bg-blue-500/20',
      epic: 'bg-purple-500/20',
      legendary: 'bg-yellow-500/20',
      mythic: 'bg-pink-500/20'
    };
    return colors[rarity];
  };

  return (
    <motion.div
      className={cn('fixed inset-0 pointer-events-none z-40', getFlashColor(rarity))}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 0.5, times: [0, 0.1, 1] }}
    />
  );
};

/**
 * Achievement Badge Animation
 */
const AchievementBadgeAnimation: React.FC<{
  achievement: Achievement;
  xpAwarded: number;
}> = ({ achievement, xpAwarded }) => {
  const getRarityGradient = (rarity: AchievementRarity) => {
    const gradients = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-500',
      mythic: 'from-pink-400 to-purple-600'
    };
    return gradients[rarity];
  };

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: 0.8
      }}
    >
      {/* Glow effect */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full blur-xl',
          `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}`
        )}
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

      {/* Main badge */}
      <div className={cn(
        'relative w-32 h-32 rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800',
        'border-4 shadow-2xl',
        achievement.rarity === 'common' && 'border-gray-400',
        achievement.rarity === 'uncommon' && 'border-green-400',
        achievement.rarity === 'rare' && 'border-blue-400',
        achievement.rarity === 'epic' && 'border-purple-400',
        achievement.rarity === 'legendary' && 'border-yellow-400',
        achievement.rarity === 'mythic' && 'border-pink-400'
      )}>
        <div className="text-4xl">
          {achievement.icon}
        </div>
      </div>

      {/* Sparkle effects around badge */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: '-4px',
            marginTop: '-4px',
          }}
          animate={{
            x: Math.cos((i * 45) * Math.PI / 180) * 80,
            y: Math.sin((i * 45) * Math.PI / 180) * 80,
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: 0.5 + i * 0.1,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
      ))}

      {/* XP indicator */}
      {xpAwarded > 0 && (
        <motion.div
          className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>+{xpAwarded} XP</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Main Achievement Celebration Component
 */
export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  unlockResult,
  onComplete,
  duration = 4000
}) => {
  const { achievement, xpAwarded } = unlockResult;
  const [showEffects, setShowEffects] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEffects(false);
      setTimeout(onComplete, 500); // Allow exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const getCelebrationIntensity = (rarity: AchievementRarity) => {
    const intensities = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
      mythic: 6
    };
    return intensities[rarity];
  };

  const intensity = getCelebrationIntensity(achievement.rarity);

  return (
    <AnimatePresence>
      {showEffects && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Screen flash for epic+ achievements */}
          {intensity >= 4 && <ScreenFlashEffect rarity={achievement.rarity} />}

          {/* Confetti for all achievements */}
          <ConfettiEffect 
            rarity={achievement.rarity} 
            particleCount={intensity * 20}
          />

          {/* Fireworks for legendary+ achievements */}
          {intensity >= 5 && <FireworksEffect rarity={achievement.rarity} />}

          {/* Main content */}
          <motion.div
            className="relative z-10 text-center px-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 20
            }}
          >
            {/* Title */}
            <motion.div
              className="mb-8"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h1 className="text-4xl font-bold text-white">
                  Achievement Unlocked!
                </h1>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
              
              {/* Rarity indicator */}
              <motion.div
                className={cn(
                  'inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider',
                  achievement.rarity === 'common' && 'bg-gray-500 text-white',
                  achievement.rarity === 'uncommon' && 'bg-green-500 text-white',
                  achievement.rarity === 'rare' && 'bg-blue-500 text-white',
                  achievement.rarity === 'epic' && 'bg-purple-500 text-white',
                  achievement.rarity === 'legendary' && 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
                  achievement.rarity === 'mythic' && 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                )}
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 rgba(255,255,255,0)',
                    '0 0 20px rgba(255,255,255,0.5)',
                    '0 0 0 rgba(255,255,255,0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {achievement.rarity} Achievement
              </motion.div>
            </motion.div>

            {/* Achievement Badge */}
            <div className="mb-8">
              <AchievementBadgeAnimation 
                achievement={achievement}
                xpAwarded={xpAwarded}
              />
            </div>

            {/* Achievement Info */}
            <motion.div
              className="text-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                {achievement.name}
              </h2>
              
              <p className="text-xl text-gray-200 mb-6 max-w-md mx-auto">
                {achievement.description}
              </p>

              {/* Category */}
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Award className="w-5 h-5" />
                <span className="capitalize">{achievement.category}</span>
              </div>
            </motion.div>

            {/* Continue button */}
            <motion.button
              className="mt-8 px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => {
                setShowEffects(false);
                setTimeout(onComplete, 300);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue
            </motion.button>
          </motion.div>

          {/* Sound effect indicator (visual) */}
          {intensity >= 3 && (
            <motion.div
              className="absolute top-8 right-8 text-white"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5 }}
            >
              <PartyPopper className="w-8 h-8" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Mini Achievement Celebration (for less intrusive unlocks)
 */
export const MiniAchievementCelebration: React.FC<{
  achievement: Achievement;
  xpAwarded: number;
  onComplete: () => void;
  duration?: number;
}> = ({ achievement, xpAwarded, onComplete, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg p-4 max-w-sm"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Mini confetti */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -20, -40],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>

          <div className="relative flex items-center space-x-3">
            <motion.div
              className="text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              {achievement.icon}
            </motion.div>
            
            <div className="flex-1">
              <div className="font-bold text-sm">Achievement Unlocked!</div>
              <div className="text-xs opacity-90">{achievement.name}</div>
              {xpAwarded > 0 && (
                <div className="text-xs opacity-75 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>+{xpAwarded} XP</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementCelebration;