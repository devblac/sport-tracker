/**
 * Gamification Dashboard Component
 * 
 * Comprehensive dashboard showing user's gamification progress including
 * XP, level, achievements, streaks, and recent activity.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  TrendingUp,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { XPProgressBar, DetailedXPProgressBar } from './XPProgressBar';
import { LevelBadge, DetailedLevelBadge } from './LevelBadge';
import { LevelUpCelebration } from './LevelUpCelebration';
import type { 
  UserLevel, 
  GamificationStats, 
  Achievement, 
  UserStreak,
  XPAwardResult 
} from '@/types/gamification';

interface GamificationDashboardProps {
  userLevel: UserLevel;
  userStats: GamificationStats;
  userStreak: UserStreak;
  recentAchievements: Achievement[];
  recentXPGain?: number;
  levelUpData?: XPAwardResult['levelUp'];
  onLevelUpClose?: () => void;
  onShareLevelUp?: () => void;
  className?: string;
}

export const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  userLevel,
  userStats,
  userStreak,
  recentAchievements,
  recentXPGain = 0,
  levelUpData,
  onLevelUpClose,
  onShareLevelUp,
  className
}) => {
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);

  useEffect(() => {
    if (levelUpData) {
      setShowLevelUpCelebration(true);
    }
  }, [levelUpData]);

  const handleLevelUpClose = () => {
    setShowLevelUpCelebration(false);
    onLevelUpClose?.();
  };

  // Calculate completion percentages
  const achievementCompletion = (userStats.achievementsUnlocked / userStats.totalAchievements) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      className={cn('space-y-6', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
            <p className="text-blue-100">
              Keep pushing your limits and unlock new achievements!
            </p>
          </div>
          <DetailedLevelBadge
            userLevel={userLevel}
            size="xl"
            className="text-white"
          />
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* XP Progress Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Experience
              </span>
            </div>
            {recentXPGain > 0 && (
              <span className="text-sm font-medium text-green-500">
                +{recentXPGain} XP
              </span>
            )}
          </div>
          
          <DetailedXPProgressBar
            userLevel={userLevel}
            recentXPGain={recentXPGain}
          />
        </motion.div>

        {/* Streak Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Current Streak
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">
              {userStreak.currentStreak}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              days in a row
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Best: {userStreak.longestStreak} days
            </div>
          </div>
        </motion.div>

        {/* Achievements Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Achievements
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {userStats.achievementsUnlocked}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              of {userStats.totalAchievements} unlocked
            </div>
            
            {/* Achievement Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${achievementCompletion}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {Math.round(achievementCompletion)}% complete
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Workouts Card */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Total Workouts
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {userStreak.totalWorkouts}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              workouts completed
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Award className="w-5 h-5 text-purple-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Recent Achievements
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAchievements.slice(0, 6).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {achievement.description}
                  </div>
                </div>
                <div className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  achievement.rarity === 'common' && 'bg-gray-100 text-gray-700',
                  achievement.rarity === 'uncommon' && 'bg-green-100 text-green-700',
                  achievement.rarity === 'rare' && 'bg-blue-100 text-blue-700',
                  achievement.rarity === 'epic' && 'bg-purple-100 text-purple-700',
                  achievement.rarity === 'legendary' && 'bg-yellow-100 text-yellow-700',
                  achievement.rarity === 'mythic' && 'bg-pink-100 text-pink-700'
                )}>
                  {achievement.rarity}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Performance Metrics
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-500 mb-1">
              {userStats.consistencyScore}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Consistency
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500 mb-1">
              {userStats.strengthScore}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Strength
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500 mb-1">
              {userStats.varietyScore}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Variety
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-1">
              {userStats.socialScore}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Social
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scheduled Days */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-teal-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Workout Schedule
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <div
              key={day}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium',
                userStreak.scheduledDays.includes(day)
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              )}
            >
              {day.charAt(0).toUpperCase() + day.slice(1, 3)}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Sick days used: {userStreak.sickDaysUsed}/{userStreak.maxSickDays}</span>
            <span>Vacation days used: {userStreak.vacationDaysUsed}/{userStreak.maxVacationDays}</span>
          </div>
        </div>
      </motion.div>

      {/* Level Up Celebration */}
      <LevelUpCelebration
        isOpen={showLevelUpCelebration}
        levelUpData={levelUpData}
        onClose={handleLevelUpClose}
        onShare={onShareLevelUp}
      />
    </motion.div>
  );
};

/**
 * Compact Gamification Summary for smaller spaces
 */
export const CompactGamificationSummary: React.FC<{
  userLevel: UserLevel;
  userStreak: UserStreak;
  recentXPGain?: number;
  className?: string;
}> = ({ userLevel, userStreak, recentXPGain, className }) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-3">
        <LevelBadge
          userLevel={userLevel}
          size="sm"
          variant="compact"
          showTitle={true}
        />
        <div className="flex items-center space-x-1 text-orange-500">
          <Flame className="w-4 h-4" />
          <span className="font-bold">{userStreak.currentStreak}</span>
        </div>
      </div>
      
      <XPProgressBar
        userLevel={userLevel}
        recentXPGain={recentXPGain}
        size="sm"
        showLabels={false}
      />
    </div>
  );
};

export default GamificationDashboard;