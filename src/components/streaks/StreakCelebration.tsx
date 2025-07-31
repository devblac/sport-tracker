/**
 * Streak Celebration Component
 * 
 * Epic celebration components for streak milestones with different
 * animations and effects based on streak length and importance.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Trophy, 
  Star, 
  Crown, 
  Zap,
  Award,
  Target,
  Calendar,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  icon: React.ReactNode;
  color: string;
  rewards?: {
    xp: number;
    title?: string;
    badge?: string;
  };
}

interface StreakCelebrationProps {
  streakDays: number;
  scheduleName: string;
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
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
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
 * Flame particles for streak celebrations
 */
const FlameParticles: React.FC<{
  count?: number;
  intensity: number;
}> = ({ count = 30, intensity }) => {
  const colors = [
    'bg-orange-400',
    'bg-red-400', 
    'bg-yellow-400',
    'bg-orange-500',
    'bg-red-500'
  ];

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1.5,
    size: 3 + Math.random() * (intensity * 2),
    startX: Math.random() * window.innerWidth,
    startY: Math.random() * window.innerHeight
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
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
 * Fireworks effect for major milestones
 */
const FireworksEffect: React.FC<{
  intensity: number;
}> = ({ intensity }) => {
  const [fireworks, setFireworks] = useState<Array<{
    id: number;
    x: number;
    y: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const fireworkCount = Math.min(intensity, 8);
    
    const newFireworks = Array.from({ length: fireworkCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2,
      delay: i * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    
    setFireworks(newFireworks);
  }, [intensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
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
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: firework.color }}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos((i * 22.5) * Math.PI / 180) * 80,
                y: Math.sin((i * 22.5) * Math.PI / 180) * 80,
              }}
              transition={{
                duration: 1.2,
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
 * Get milestone data based on streak days
 */
const getStreakMilestone = (days: number): StreakMilestone | null => {
  const milestones: StreakMilestone[] = [
    {
      days: 3,
      title: 'Getting Started!',
      description: 'You\'re building momentum with a 3-day streak!',
      rarity: 'common',
      icon: <Flame className="w-8 h-8" />,
      color: 'from-orange-400 to-red-500',
      rewards: { xp: 100 }
    },
    {
      days: 7,
      title: 'Week Warrior!',
      description: 'Amazing! You\'ve maintained a full week streak!',
      rarity: 'uncommon',
      icon: <Target className="w-8 h-8" />,
      color: 'from-green-400 to-blue-500',
      rewards: { xp: 250, title: 'Week Warrior' }
    },
    {
      days: 14,
      title: 'Two Week Champion!',
      description: 'Incredible consistency! Two weeks of dedication!',
      rarity: 'rare',
      icon: <Award className="w-8 h-8" />,
      color: 'from-blue-400 to-purple-500',
      rewards: { xp: 500, title: 'Consistent Champion' }
    },
    {
      days: 30,
      title: 'Monthly Master!',
      description: 'Outstanding! A full month of unwavering commitment!',
      rarity: 'epic',
      icon: <Calendar className="w-8 h-8" />,
      color: 'from-purple-400 to-pink-500',
      rewards: { xp: 1000, title: 'Monthly Master', badge: 'monthly_master' }
    },
    {
      days: 50,
      title: 'Streak Superstar!',
      description: 'Phenomenal! 50 days of pure dedication!',
      rarity: 'legendary',
      icon: <Star className="w-8 h-8" />,
      color: 'from-yellow-400 to-orange-500',
      rewards: { xp: 2000, title: 'Streak Superstar', badge: 'superstar' }
    },
    {
      days: 100,
      title: 'Centurion Legend!',
      description: 'LEGENDARY! 100 days of unstoppable commitment!',
      rarity: 'legendary',
      icon: <Crown className="w-8 h-8" />,
      color: 'from-yellow-300 to-yellow-600',
      rewards: { xp: 5000, title: 'Centurion', badge: 'centurion' }
    },
    {
      days: 365,
      title: 'Immortal Streak!',
      description: 'MYTHIC ACHIEVEMENT! A full year of dedication!',
      rarity: 'mythic',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-pink-400 to-purple-600',
      rewards: { xp: 10000, title: 'Immortal', badge: 'immortal' }
    }
  ];

  // Find the highest milestone achieved
  const achievedMilestones = milestones.filter(m => days >= m.days);
  return achievedMilestones.length > 0 ? achievedMilestones[achievedMilestones.length - 1] : null;
};

/**
 * Get celebration intensity based on rarity
 */
const getCelebrationIntensity = (rarity: string): number => {
  const intensities = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythic: 6
  };
  return intensities[rarity as keyof typeof intensities] || 1;
};

/**
 * Main Streak Celebration Component
 */
export const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  streakDays,
  scheduleName,
  onComplete,
  duration = 4000
}) => {
  const [showEffects, setShowEffects] = useState(true);
  const milestone = getStreakMilestone(streakDays);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowEffects(false);
      setTimeout(onComplete, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!milestone) {
    onComplete();
    return null;
  }

  const intensity = getCelebrationIntensity(milestone.rarity);

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

          {/* Flame particles */}
          <FlameParticles count={intensity * 10} intensity={intensity} />

          {/* Fireworks for epic+ milestones */}
          {intensity >= 4 && <FireworksEffect intensity={intensity} />}

          {/* Main content */}
          <motion.div
            className="relative z-10 text-center px-6 max-w-2xl"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 20
            }}
          >
            {/* Streak flame animation */}
            <motion.div
              className="mb-8"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  className={cn(
                    'absolute inset-0 rounded-full blur-2xl',
                    `bg-gradient-to-br ${milestone.color}`
                  )}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />

                {/* Main flame icon */}
                <div className={cn(
                  'relative w-32 h-32 rounded-full flex items-center justify-center text-white',
                  `bg-gradient-to-br ${milestone.color}`,
                  'shadow-2xl'
                )}>
                  <Flame className="w-16 h-16" />
                </div>

                {/* Streak number */}
                <motion.div
                  className="absolute -bottom-4 left-1/2 transform -translate-x-1/2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-lg">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {streakDays}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Title and description */}
            <motion.div
              className="mb-8"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="text-white text-3xl">
                  {milestone.icon}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {milestone.title}
                </h1>
                <div className="text-white text-3xl">
                  {milestone.icon}
                </div>
              </div>
              
              <p className="text-xl text-gray-200 mb-4">
                {milestone.description}
              </p>
              
              <div className="text-lg text-gray-300">
                <span className="font-semibold">{scheduleName}</span> • {streakDays} Day Streak
              </div>
            </motion.div>

            {/* Rarity badge */}
            <motion.div
              className="mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
            >
              <div className={cn(
                'inline-block px-6 py-3 rounded-full text-white font-bold uppercase tracking-wider text-sm',
                `bg-gradient-to-r ${milestone.color}`,
                'shadow-lg'
              )}>
                {milestone.rarity} Milestone
              </div>
            </motion.div>

            {/* Rewards */}
            {milestone.rewards && (
              <motion.div
                className="mb-8"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center justify-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Rewards Earned</span>
                  </h3>
                  
                  <div className="flex items-center justify-center space-x-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-yellow-400 mb-1">
                        <Zap className="w-4 h-4" />
                        <span className="font-bold">{milestone.rewards.xp} XP</span>
                      </div>
                      <div className="text-xs text-gray-300">Experience Points</div>
                    </div>
                    
                    {milestone.rewards.title && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 text-purple-400 mb-1">
                          <Crown className="w-4 h-4" />
                          <span className="font-bold">{milestone.rewards.title}</span>
                        </div>
                        <div className="text-xs text-gray-300">Title Unlocked</div>
                      </div>
                    )}
                    
                    {milestone.rewards.badge && (
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 text-blue-400 mb-1">
                          <Award className="w-4 h-4" />
                          <span className="font-bold">Badge</span>
                        </div>
                        <div className="text-xs text-gray-300">Special Badge</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Continue button */}
            <motion.button
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
              onClick={() => {
                setShowEffects(false);
                setTimeout(onComplete, 300);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Your Streak!
            </motion.button>

            {/* Celebration indicator */}
            <motion.div
              className="absolute top-8 right-8 text-white"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.5 }}
            >
              <PartyPopper className="w-8 h-8" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Mini Streak Celebration (for smaller milestones)
 */
export const MiniStreakCelebration: React.FC<{
  streakDays: number;
  scheduleName: string;
  onComplete: () => void;
  duration?: number;
}> = ({ streakDays, scheduleName, onComplete, duration = 2000 }) => {
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
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm"
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Mini flame particles */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
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
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Flame />
            </motion.div>
            
            <div className="flex-1">
              <div className="font-bold text-sm">
                {streakDays} Day Streak! 🔥
              </div>
              <div className="text-xs opacity-90">
                {scheduleName}
              </div>
              <div className="text-xs opacity-75">
                Keep it burning!
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;