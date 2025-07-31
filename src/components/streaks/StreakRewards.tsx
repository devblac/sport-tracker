/**
 * Streak Rewards Component
 * 
 * Displays milestone rewards, titles, and shields earned through streaks.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreakRewards } from '@/hooks/useStreakRewards';

interface StreakRewardsProps {
  userId: string;
  className?: string;
}

export const StreakRewards: React.FC<StreakRewardsProps> = ({
  userId,
  className = ''
}) => {
  const {
    userRewards,
    activeTitle,
    availableShields,
    currentXPMultiplier,
    setActiveTitle,
    isLoading
  } = useStreakRewards(userId);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
      </div>
    );
  }

  if (!userRewards) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 border-gray-300';
      case 'uncommon': return 'text-green-600 border-green-300';
      case 'rare': return 'text-blue-600 border-blue-300';
      case 'epic': return 'text-purple-600 border-purple-300';
      case 'legendary': return 'text-yellow-600 border-yellow-300';
      case 'mythic': return 'text-red-600 border-red-300';
      default: return 'text-gray-600 border-gray-300';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-50 dark:bg-gray-800';
      case 'uncommon': return 'bg-green-50 dark:bg-green-900/20';
      case 'rare': return 'bg-blue-50 dark:bg-blue-900/20';
      case 'epic': return 'bg-purple-50 dark:bg-purple-900/20';
      case 'legendary': return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'mythic': return 'bg-red-50 dark:bg-red-900/20';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* XP Multiplier Display */}
      {currentXPMultiplier > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Multiplicador de XP Activo</h3>
              <p className="text-sm opacity-90">
                Ganando {Math.round((currentXPMultiplier - 1) * 100)}% XP extra por tu racha
              </p>
            </div>
            <div className="text-2xl font-bold">
              {currentXPMultiplier.toFixed(1)}x
            </div>
          </div>
        </motion.div>
      )}

      {/* Active Title */}
      {activeTitle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 ${getRarityColor(activeTitle.rarity)} ${getRarityBg(activeTitle.rarity)}`}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{activeTitle.icon}</span>
            <div>
              <h3 className="font-semibold">Título Activo</h3>
              <p className="text-lg font-bold">{activeTitle.name}</p>
              <p className="text-sm opacity-75">{activeTitle.description}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available Titles */}
      {userRewards.titles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Títulos Desbloqueados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {userRewards.titles.map((title) => (
                <motion.div
                  key={title.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    title.isActive 
                      ? `${getRarityColor(title.rarity)} ${getRarityBg(title.rarity)} ring-2 ring-current`
                      : `border-gray-200 dark:border-gray-700 hover:${getRarityBg(title.rarity)}`
                  }`}
                  onClick={() => setActiveTitle(title.id)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{title.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{title.name}</p>
                      <p className="text-xs opacity-75">{title.description}</p>
                    </div>
                    {title.isActive && (
                      <div className="text-xs bg-current text-white px-2 py-1 rounded">
                        Activo
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Available Shields */}
      {availableShields.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Escudos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {availableShields.map((shield) => (
                <motion.div
                  key={shield.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`p-3 rounded-lg border ${getRarityColor(shield.rarity)} ${getRarityBg(shield.rarity)}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{shield.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{shield.name}</p>
                      <p className="text-xs opacity-75">{shield.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-current text-white px-2 py-1 rounded">
                          {shield.usesRemaining} usos
                        </span>
                        <span className="text-xs opacity-75">
                          {shield.duration} días
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Milestone Progress */}
      {userRewards.milestoneRewards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Hitos Alcanzados</h3>
          <div className="space-y-2">
            {userRewards.milestoneRewards
              .sort((a, b) => b.streakLength - a.streakLength)
              .slice(0, 5)
              .map((milestone, index) => (
                <motion.div
                  key={`${milestone.streakLength}-${milestone.rewardId}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{milestone.rewardId}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {milestone.streakLength} días consecutivos
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(milestone.unlockedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Estadísticas de Recompensas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userRewards.titles.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Títulos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userRewards.shields.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Escudos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userRewards.milestoneRewards.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Hitos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{userRewards.longestRewardedStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mejor Racha</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakRewards;