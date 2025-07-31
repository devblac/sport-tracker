/**
 * Level Badge Component
 * 
 * Displays user's current level with badge styling, animations, and customization options.
 * Shows level number, title, and optional perks/features.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Trophy, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { UserLevel, LevelConfig } from '@/types/gamification';

interface LevelBadgeProps {
  userLevel: UserLevel;
  levelConfig?: LevelConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'compact' | 'detailed' | 'minimal';
  showAnimation?: boolean;
  showTitle?: boolean;
  showPerks?: boolean;
  glowEffect?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  userLevel,
  levelConfig,
  size = 'md',
  variant = 'default',
  showAnimation = true,
  showTitle = true,
  showPerks = false,
  glowEffect = false,
  className,
  onClick
}) => {
  // Size configurations
  const sizeConfig = {
    xs: {
      container: 'w-8 h-8',
      text: 'text-xs',
      icon: 'w-3 h-3',
      padding: 'p-1'
    },
    sm: {
      container: 'w-12 h-12',
      text: 'text-sm',
      icon: 'w-4 h-4',
      padding: 'p-2'
    },
    md: {
      container: 'w-16 h-16',
      text: 'text-base',
      icon: 'w-5 h-5',
      padding: 'p-3'
    },
    lg: {
      container: 'w-20 h-20',
      text: 'text-lg',
      icon: 'w-6 h-6',
      padding: 'p-4'
    },
    xl: {
      container: 'w-24 h-24',
      text: 'text-xl',
      icon: 'w-8 h-8',
      padding: 'p-5'
    }
  };

  const config = sizeConfig[size];

  // Get level-specific styling
  const getLevelStyling = (level: number) => {
    if (level >= 15) return {
      gradient: 'from-purple-600 via-pink-600 to-red-600',
      shadow: 'shadow-purple-500/50',
      glow: 'shadow-purple-500/30',
      icon: Crown,
      iconColor: 'text-yellow-300'
    };
    if (level >= 12) return {
      gradient: 'from-indigo-600 via-purple-600 to-pink-600',
      shadow: 'shadow-indigo-500/50',
      glow: 'shadow-indigo-500/30',
      icon: Sparkles,
      iconColor: 'text-cyan-300'
    };
    if (level >= 10) return {
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      shadow: 'shadow-yellow-500/50',
      glow: 'shadow-yellow-500/30',
      icon: Trophy,
      iconColor: 'text-white'
    };
    if (level >= 8) return {
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      shadow: 'shadow-green-500/50',
      glow: 'shadow-green-500/30',
      icon: Shield,
      iconColor: 'text-white'
    };
    if (level >= 5) return {
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      shadow: 'shadow-blue-500/50',
      glow: 'shadow-blue-500/30',
      icon: Zap,
      iconColor: 'text-white'
    };
    return {
      gradient: 'from-gray-500 via-gray-600 to-gray-700',
      shadow: 'shadow-gray-500/50',
      glow: 'shadow-gray-500/30',
      icon: Star,
      iconColor: 'text-white'
    };
  };

  const styling = getLevelStyling(userLevel.level);
  const IconComponent = styling.icon;

  // Animation variants
  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        `0 0 20px ${styling.glow}`,
        `0 0 30px ${styling.glow}`,
        `0 0 20px ${styling.glow}`
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold',
          `bg-gradient-to-br ${styling.gradient}`,
          config.container,
          config.text,
          'text-white shadow-lg',
          onClick && 'cursor-pointer',
          className
        )}
        variants={showAnimation ? badgeVariants : undefined}
        initial={showAnimation ? 'initial' : undefined}
        animate={showAnimation ? 'animate' : undefined}
        whileHover={onClick && showAnimation ? 'hover' : undefined}
        whileTap={onClick && showAnimation ? 'tap' : undefined}
        onClick={onClick}
      >
        {userLevel.level}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1 rounded-full',
          `bg-gradient-to-r ${styling.gradient}`,
          'text-white shadow-lg',
          onClick && 'cursor-pointer',
          className
        )}
        variants={showAnimation ? badgeVariants : undefined}
        initial={showAnimation ? 'initial' : undefined}
        animate={showAnimation ? 'animate' : undefined}
        whileHover={onClick && showAnimation ? 'hover' : undefined}
        whileTap={onClick && showAnimation ? 'tap' : undefined}
        onClick={onClick}
      >
        <IconComponent className={cn(config.icon, styling.iconColor)} />
        <span className={cn('font-bold', config.text)}>
          {userLevel.level}
        </span>
        {showTitle && (
          <span className={cn('font-medium', config.text)}>
            {userLevel.title}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main Badge */}
      <motion.div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-full',
          `bg-gradient-to-br ${styling.gradient}`,
          config.container,
          `shadow-lg ${styling.shadow}`,
          'text-white border-2 border-white/20',
          onClick && 'cursor-pointer',
          glowEffect && 'animate-pulse'
        )}
        variants={showAnimation ? badgeVariants : undefined}
        initial={showAnimation ? 'initial' : undefined}
        animate={showAnimation ? ['animate', glowEffect ? 'glow' : 'animate'] : undefined}
        whileHover={onClick && showAnimation ? 'hover' : undefined}
        whileTap={onClick && showAnimation ? 'tap' : undefined}
        onClick={onClick}
      >
        {/* Glow Effect */}
        {glowEffect && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              `bg-gradient-to-br ${styling.gradient}`,
              'blur-md opacity-75'
            )}
            variants={glowVariants}
            animate="animate"
          />
        )}

        {/* Badge Content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {size !== 'xs' && size !== 'sm' && (
            <IconComponent className={cn(config.icon, styling.iconColor, 'mb-1')} />
          )}
          <span className={cn('font-bold leading-none', config.text)}>
            {userLevel.level}
          </span>
        </div>

        {/* Level Ring Animation */}
        {showAnimation && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.div>

      {/* Title */}
      {showTitle && variant === 'detailed' && (
        <div className="text-center mt-2">
          <div className={cn('font-semibold text-gray-800 dark:text-gray-200', config.text)}>
            {userLevel.title}
          </div>
        </div>
      )}

      {/* Perks */}
      {showPerks && levelConfig && variant === 'detailed' && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
            Level Perks:
          </div>
          <div className="space-y-1">
            {levelConfig.perks.slice(0, 3).map((perk, index) => (
              <div
                key={index}
                className="text-xs text-gray-700 dark:text-gray-300 text-center"
              >
                • {perk}
              </div>
            ))}
            {levelConfig.perks.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                +{levelConfig.perks.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Animated Level Badge with pulse effect
 */
export const AnimatedLevelBadge: React.FC<{
  userLevel: UserLevel;
  levelConfig?: LevelConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ userLevel, levelConfig, size = 'md', className }) => {
  return (
    <LevelBadge
      userLevel={userLevel}
      levelConfig={levelConfig}
      size={size}
      showAnimation={true}
      glowEffect={true}
      className={className}
    />
  );
};

/**
 * Clickable Level Badge for navigation
 */
export const ClickableLevelBadge: React.FC<{
  userLevel: UserLevel;
  levelConfig?: LevelConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick: () => void;
  className?: string;
}> = ({ userLevel, levelConfig, size = 'md', onClick, className }) => {
  return (
    <LevelBadge
      userLevel={userLevel}
      levelConfig={levelConfig}
      size={size}
      showAnimation={true}
      onClick={onClick}
      className={cn('transition-transform hover:scale-105', className)}
    />
  );
};

/**
 * Level Badge with detailed information
 */
export const DetailedLevelBadge: React.FC<{
  userLevel: UserLevel;
  levelConfig?: LevelConfig;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ userLevel, levelConfig, size = 'lg', className }) => {
  return (
    <LevelBadge
      userLevel={userLevel}
      levelConfig={levelConfig}
      size={size}
      variant="detailed"
      showTitle={true}
      showPerks={true}
      showAnimation={true}
      glowEffect={true}
      className={className}
    />
  );
};

export default LevelBadge;