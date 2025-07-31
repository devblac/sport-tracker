/**
 * Achievement Gallery
 * 
 * Visual gallery component for displaying achievements in a more compact,
 * trophy case style layout. Perfect for profile pages and quick overviews.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Award, 
  Lock,
  Crown,
  Medal,
  Target,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAchievements } from '@/hooks/useAchievements';
import type { 
  Achievement, 
  AchievementCategory, 
  AchievementRarity 
} from '@/types/gamification';

interface AchievementGalleryProps {
  userId: string;
  className?: string;
  compact?: boolean;
  showOnlyUnlocked?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'list' | 'carousel';
}

interface AchievementTrophyProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

const AchievementTrophy: React.FC<AchievementTrophyProps> = ({
  achievement,
  isUnlocked,
  progress,
  size = 'md',
  showProgress = true,
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl'
  };

  const getRarityGlow = (rarity: AchievementRarity) => {
    if (!isUnlocked) return 'shadow-gray-300/50';
    
    const glows = {
      common: 'shadow-gray-400/60',
      uncommon: 'shadow-green-400/60',
      rare: 'shadow-blue-400/60',
      epic: 'shadow-purple-400/60',
      legendary: 'shadow-yellow-400/60',
      mythic: 'shadow-pink-400/60'
    };
    return glows[rarity];
  };

  const getRarityBorder = (rarity: AchievementRarity) => {
    if (!isUnlocked) return 'border-gray-300';
    
    const borders = {
      common: 'border-gray-400',
      uncommon: 'border-green-400',
      rare: 'border-blue-400',
      epic: 'border-purple-400',
      legendary: 'border-yellow-400',
      mythic: 'border-pink-400'
    };
    return borders[rarity];
  };

  const displayIcon = achievement.isSecret && !isUnlocked ? 
    <Lock className="w-6 h-6" /> : 
    achievement.icon;

  return (
    <motion.div
      className={cn(
        'relative cursor-pointer group',
        sizeClasses[size]
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Trophy Base */}
      <div className={cn(
        'w-full h-full rounded-full border-4 flex items-center justify-center transition-all duration-300',
        'bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800',
        getRarityBorder(achievement.rarity),
        getRarityGlow(achievement.rarity),
        isUnlocked ? 'opacity-100' : 'opacity-60 grayscale'
      )}>
        <div className={cn(
          'transition-all duration-300',
          isUnlocked ? 'text-gray-800 dark:text-white' : 'text-gray-400'
        )}>
          {displayIcon}
        </div>
      </div>

      {/* Rarity Indicator */}
      <div className={cn(
        'absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800',
        achievement.rarity === 'common' && 'bg-gray-400',
        achievement.rarity === 'uncommon' && 'bg-green-400',
        achievement.rarity === 'rare' && 'bg-blue-400',
        achievement.rarity === 'epic' && 'bg-purple-400',
        achievement.rarity === 'legendary' && 'bg-yellow-400',
        achievement.rarity === 'mythic' && 'bg-pink-400'
      )} />

      {/* Progress Ring for Locked Achievements */}
      {!isUnlocked && showProgress && progress > 0 && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-200 dark:text-gray-600"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-blue-500"
            strokeDasharray={`${2 * Math.PI * 46}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 46 * (1 - progress)
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
      )}

      {/* Unlock Animation */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-400/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 5
          }}
        />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          <div className="font-semibold">
            {achievement.isSecret && !isUnlocked ? '???' : achievement.name}
          </div>
          {!isUnlocked && showProgress && (
            <div className="text-gray-300">
              {Math.round(progress * 100)}% complete
            </div>
          )}
          <div className="text-gray-300 capitalize">
            {achievement.rarity} • {achievement.category}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Achievement Category Section
 */
const AchievementCategorySection: React.FC<{
  category: AchievementCategory;
  achievements: Achievement[];
  unlockedIds: Set<string>;
  getProgress: (id: string) => number;
  onAchievementClick: (achievement: Achievement) => void;
}> = ({ category, achievements, unlockedIds, getProgress, onAchievementClick }) => {
  const categoryIcons = {
    strength: <Trophy className="w-5 h-5" />,
    consistency: <Target className="w-5 h-5" />,
    social: <Star className="w-5 h-5" />,
    milestone: <Medal className="w-5 h-5" />,
    exploration: <Award className="w-5 h-5" />,
    mastery: <Crown className="w-5 h-5" />,
    community: <Star className="w-5 h-5" />
  };

  const categoryLabels = {
    strength: 'Strength',
    consistency: 'Consistency',
    social: 'Social',
    milestone: 'Milestones',
    exploration: 'Exploration',
    mastery: 'Mastery',
    community: 'Community'
  };

  const unlockedCount = achievements.filter(a => unlockedIds.has(a.id)).length;
  const totalCount = achievements.length;

  if (achievements.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            {categoryIcons[category]}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {categoryLabels[category]}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-32">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {achievements.map(achievement => (
          <AchievementTrophy
            key={achievement.id}
            achievement={achievement}
            isUnlocked={unlockedIds.has(achievement.id)}
            progress={getProgress(achievement.id)}
            onClick={() => onAchievementClick(achievement)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Achievement Carousel
 */
const AchievementCarousel: React.FC<{
  achievements: Achievement[];
  unlockedIds: Set<string>;
  getProgress: (id: string) => number;
  onAchievementClick: (achievement: Achievement) => void;
  itemsPerPage?: number;
}> = ({ achievements, unlockedIds, getProgress, onAchievementClick, itemsPerPage = 6 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(achievements.length / itemsPerPage);

  const currentAchievements = achievements.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  if (achievements.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Achievements
        </h3>
        
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentPage + 1} / {totalPages}
            </span>
            
            <button
              onClick={nextPage}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <AnimatePresence mode="wait">
          {currentAchievements.map((achievement, index) => (
            <motion.div
              key={`${currentPage}-${achievement.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <AchievementTrophy
                achievement={achievement}
                isUnlocked={unlockedIds.has(achievement.id)}
                progress={getProgress(achievement.id)}
                size="lg"
                onClick={() => onAchievementClick(achievement)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * Main Achievement Gallery Component
 */
export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  userId,
  className,
  compact = false,
  showOnlyUnlocked = false,
  maxItems,
  layout = 'grid'
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(layout === 'carousel' ? 'grid' : layout);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const {
    achievements,
    unlockedAchievements,
    recentUnlocks,
    getAchievementProgress,
    isLoading,
    error
  } = useAchievements({ userId });

  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  // Filter achievements
  let filteredAchievements = achievements;
  if (showOnlyUnlocked) {
    filteredAchievements = achievements.filter(a => unlockedIds.has(a.id));
  }

  // Apply max items limit
  if (maxItems) {
    filteredAchievements = filteredAchievements.slice(0, maxItems);
  }

  // Group by category for grid view
  const achievementsByCategory = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<AchievementCategory, Achievement[]>);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load achievements</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Achievement Gallery
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {unlockedAchievements.length} of {achievements.length} achievements unlocked
            </p>
          </div>

          {layout !== 'carousel' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Unlocks Carousel */}
      {layout === 'carousel' && recentUnlocks.length > 0 && (
        <AchievementCarousel
          achievements={recentUnlocks}
          unlockedIds={unlockedIds}
          getProgress={getAchievementProgress}
          onAchievementClick={setSelectedAchievement}
        />
      )}

      {/* Achievement Display */}
      {layout !== 'carousel' && (
        <>
          {viewMode === 'grid' ? (
            // Category-based grid view
            <div>
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <AchievementCategorySection
                  key={category}
                  category={category as AchievementCategory}
                  achievements={categoryAchievements}
                  unlockedIds={unlockedIds}
                  getProgress={getAchievementProgress}
                  onAchievementClick={setSelectedAchievement}
                />
              ))}
            </div>
          ) : (
            // Simple grid view
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {filteredAchievements.map(achievement => (
                <AchievementTrophy
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={unlockedIds.has(achievement.id)}
                  progress={getAchievementProgress(achievement.id)}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {showOnlyUnlocked ? 'No achievements unlocked yet' : 'No achievements available'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showOnlyUnlocked 
              ? 'Start working out to unlock your first achievement!'
              : 'Check back later for new achievements.'
            }
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          progress={getAchievementProgress(selectedAchievement.id)}
          isUnlocked={unlockedIds.has(selectedAchievement.id)}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
};

/**
 * Simple Achievement Detail Modal
 */
const AchievementDetailModal: React.FC<{
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  onClose: () => void;
}> = ({ achievement, progress, isUnlocked, onClose }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-4xl mb-3">{achievement.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {achievement.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {achievement.description}
          </p>
          
          {!isUnlocked && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">
                {Math.round(progress * 100)}% complete
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AchievementGallery;