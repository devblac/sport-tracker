// ChallengeXPProgress Component - Display XP progress and level information
// Implements requirement 12.3 - XP integration with challenges

import React, { useState, useEffect } from 'react';

interface XPProgressProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  totalXPForNextLevel: number;
  recentXPGain?: number;
  showAnimation?: boolean;
  className?: string;
}

export const ChallengeXPProgress: React.FC<XPProgressProps> = ({
  currentXP,
  level,
  xpToNextLevel,
  totalXPForNextLevel,
  recentXPGain = 0,
  showAnimation = false,
  className = ''
}) => {
  const [animatedXP, setAnimatedXP] = useState(currentXP - recentXPGain);
  const [showXPGain, setShowXPGain] = useState(false);

  // Calculate progress percentage
  const currentLevelXP = currentXP - (totalXPForNextLevel - xpToNextLevel);
  const levelXPRange = totalXPForNextLevel - (totalXPForNextLevel - xpToNextLevel);
  const progressPercentage = Math.min((currentLevelXP / levelXPRange) * 100, 100);

  // Animate XP gain
  useEffect(() => {
    if (showAnimation && recentXPGain > 0) {
      setShowXPGain(true);
      
      // Animate XP counter
      const duration = 1500;
      const steps = 30;
      const increment = recentXPGain / steps;
      let currentStep = 0;

      const animateXP = () => {
        if (currentStep < steps) {
          setAnimatedXP(prev => prev + increment);
          currentStep++;
          setTimeout(animateXP, duration / steps);
        } else {
          setAnimatedXP(currentXP);
          setTimeout(() => setShowXPGain(false), 2000);
        }
      };

      setTimeout(animateXP, 500);
    } else {
      setAnimatedXP(currentXP);
    }
  }, [currentXP, recentXPGain, showAnimation]);

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 30) return 'from-blue-500 to-purple-500';
    if (level >= 20) return 'from-green-500 to-blue-500';
    if (level >= 10) return 'from-yellow-500 to-green-500';
    return 'from-gray-400 to-blue-400';
  };

  const getLevelBadgeStyle = (level: number) => {
    if (level >= 50) return 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/50';
    if (level >= 30) return 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-500/50';
    if (level >= 20) return 'bg-gradient-to-r from-green-600 to-blue-600 shadow-green-500/50';
    if (level >= 10) return 'bg-gradient-to-r from-yellow-600 to-green-600 shadow-yellow-500/50';
    return 'bg-gradient-to-r from-gray-500 to-blue-500 shadow-gray-500/50';
  };

  const getLevelTitle = (level: number) => {
    if (level >= 50) return 'Legendary Athlete';
    if (level >= 30) return 'Elite Competitor';
    if (level >= 20) return 'Advanced Challenger';
    if (level >= 10) return 'Dedicated Trainer';
    if (level >= 5) return 'Rising Star';
    return 'Beginner';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Challenge Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getLevelTitle(level)}
          </p>
        </div>
        
        {/* Level Badge */}
        <div className={`relative px-4 py-2 rounded-full text-white font-bold shadow-lg ${getLevelBadgeStyle(level)}`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <span>Level {level}</span>
          </div>
          
          {/* Level glow effect */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${getLevelColor(level)} opacity-20 animate-pulse`} />
        </div>
      </div>

      {/* XP Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Experience Points
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.floor(animatedXP).toLocaleString()}
            </span>
            {showXPGain && recentXPGain > 0 && (
              <span className="text-green-500 font-bold animate-bounce">
                +{recentXPGain}
              </span>
            )}
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getLevelColor(level)} transition-all duration-1000 ease-out relative`}
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{Math.floor(currentLevelXP).toLocaleString()} XP</span>
            <span>{xpToNextLevel.toLocaleString()} to next level</span>
          </div>
        </div>
      </div>

      {/* Level Progress Info */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {Math.floor(progressPercentage)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Level Progress
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {level + 1}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Next Level
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {xpToNextLevel.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            XP Needed
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentXPGain > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-lg">🎉</span>
            <div>
              <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                XP Gained!
              </div>
              <div className="text-xs text-green-600 dark:text-green-300">
                You earned {recentXPGain} XP from challenge activities
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Benefits Preview */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Next Level Benefits:
        </div>
        <div className="flex flex-wrap gap-2">
          {getNextLevelBenefits(level + 1).map((benefit, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
            >
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get next level benefits
const getNextLevelBenefits = (nextLevel: number): string[] => {
  const benefits = [];
  
  if (nextLevel % 5 === 0) {
    benefits.push('🎁 Bonus Rewards');
  }
  
  if (nextLevel % 10 === 0) {
    benefits.push('👑 New Title');
  }
  
  if (nextLevel === 20) {
    benefits.push('🔥 XP Multiplier');
  }
  
  if (nextLevel === 30) {
    benefits.push('⭐ Elite Status');
  }
  
  if (nextLevel === 50) {
    benefits.push('🏆 Legendary Badge');
  }
  
  if (benefits.length === 0) {
    benefits.push('⚡ More XP Capacity');
  }
  
  return benefits;
};

export default ChallengeXPProgress;