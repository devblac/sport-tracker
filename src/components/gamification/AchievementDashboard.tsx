/**
 * Achievement Dashboard
 * 
 * Comprehensive dashboard for displaying achievements, progress, and statistics.
 * Shows unlocked achievements, progress towards locked ones, and achievement categories.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Filter,
  Search,
  Lock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAchievements } from '@/hooks/useAchievements';
import type { 
  Achievement, 
  AchievementCategory, 
  AchievementRarity 
} from '@/types/gamification';

interface AchievementDashboardProps {
  userId: string;
  className?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  progress: number;
  isUnlocked: boolean;
  isSecret?: boolean;
  onClick?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  progress,
  isUnlocked,
  isSecret = false,
  onClick
}) => {
  const getRarityStyles = (rarity: AchievementRarity) => {
    const styles = {
      common: 'border-gray-300 bg-gray-50 dark:bg-gray-800',
      uncommon: 'border-green-300 bg-green-50 dark:bg-green-900/20',
      rare: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',
      epic: 'border-purple-300 bg-purple-50 dark:bg-purple-900/20',
      legendary: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
      mythic: 'border-pink-300 bg-pink-50 dark:bg-pink-900/20'
    };
    return styles[rarity];
  };

  const getRarityGlow = (rarity: AchievementRarity) => {
    if (!isUnlocked) return '';
    
    const glows = {
      common: 'shadow-gray-500/20',
      uncommon: 'shadow-green-500/30',
      rare: 'shadow-blue-500/30',
      epic: 'shadow-purple-500/30',
      legendary: 'shadow-yellow-500/30',
      mythic: 'shadow-pink-500/30'
    };
    return glows[rarity];
  };

  const displayName = isSecret && !isUnlocked ? '???' : achievement.name;
  const displayDescription = isSecret && !isUnlocked ? 'Hidden achievement' : achievement.description;
  const displayIcon = isSecret && !isUnlocked ? <Lock className="w-6 h-6" /> : achievement.icon;

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
        'hover:scale-105 hover:shadow-lg',
        getRarityStyles(achievement.rarity),
        getRarityGlow(achievement.rarity),
        isUnlocked ? 'opacity-100' : 'opacity-75'
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-bold capitalize',
          achievement.rarity === 'common' && 'bg-gray-200 text-gray-700',
          achievement.rarity === 'uncommon' && 'bg-green-200 text-green-700',
          achievement.rarity === 'rare' && 'bg-blue-200 text-blue-700',
          achievement.rarity === 'epic' && 'bg-purple-200 text-purple-700',
          achievement.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700',
          achievement.rarity === 'mythic' && 'bg-pink-200 text-pink-700'
        )}>
          {achievement.rarity}
        </div>
      </div>

      {/* Achievement icon */}
      <div className="flex justify-center mb-3">
        <div className={cn(
          'p-3 rounded-full text-2xl',
          isUnlocked ? 'bg-white dark:bg-gray-700 shadow-md' : 'bg-gray-200 dark:bg-gray-600'
        )}>
          {displayIcon}
        </div>
      </div>

      {/* Achievement info */}
      <div className="text-center">
        <h3 className={cn(
          'font-bold text-lg mb-2',
          isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
        )}>
          {displayName}
        </h3>
        
        <p className={cn(
          'text-sm mb-3',
          isUnlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
        )}>
          {displayDescription}
        </p>

        {/* Progress bar for locked achievements */}
        {!isUnlocked && !isSecret && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Unlock status */}
        <div className="flex items-center justify-center space-x-2">
          {isUnlocked ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Unlocked
              </span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">
                {isSecret ? 'Hidden' : 'Locked'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Unlock animation overlay */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      )}
    </motion.div>
  );
};

/**
 * Achievement Stats Summary
 */
const AchievementStats: React.FC<{
  stats: ReturnType<typeof useAchievements>['achievementStats'];
}> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {stats.unlockedAchievements}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Unlocked
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {Math.round(stats.completionPercentage)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Complete
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {stats.recentUnlocks.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Recent
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {stats.nearCompletion.length}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Near Done
        </div>
      </div>
    </div>
  );
};

/**
 * Achievement Filters
 */
const AchievementFilters: React.FC<{
  selectedCategory: AchievementCategory | 'all';
  selectedRarity: AchievementRarity | 'all';
  showUnlockedOnly: boolean;
  showSecrets: boolean;
  searchQuery: string;
  onCategoryChange: (category: AchievementCategory | 'all') => void;
  onRarityChange: (rarity: AchievementRarity | 'all') => void;
  onShowUnlockedChange: (show: boolean) => void;
  onShowSecretsChange: (show: boolean) => void;
  onSearchChange: (query: string) => void;
}> = ({
  selectedCategory,
  selectedRarity,
  showUnlockedOnly,
  showSecrets,
  searchQuery,
  onCategoryChange,
  onRarityChange,
  onShowUnlockedChange,
  onShowSecretsChange,
  onSearchChange
}) => {
  const categories: Array<{ value: AchievementCategory | 'all'; label: string }> = [
    { value: 'all', label: 'All Categories' },
    { value: 'strength', label: 'Strength' },
    { value: 'consistency', label: 'Consistency' },
    { value: 'social', label: 'Social' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'exploration', label: 'Exploration' },
    { value: 'mastery', label: 'Mastery' },
    { value: 'community', label: 'Community' }
  ];

  const rarities: Array<{ value: AchievementRarity | 'all'; label: string }> = [
    { value: 'all', label: 'All Rarities' },
    { value: 'common', label: 'Common' },
    { value: 'uncommon', label: 'Uncommon' },
    { value: 'rare', label: 'Rare' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'mythic', label: 'Mythic' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as AchievementCategory | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Rarity Filter */}
        <select
          value={selectedRarity}
          onChange={(e) => onRarityChange(e.target.value as AchievementRarity | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {rarities.map(rarity => (
            <option key={rarity.value} value={rarity.value}>
              {rarity.label}
            </option>
          ))}
        </select>

        {/* Toggle Filters */}
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => onShowUnlockedChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Unlocked only</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showSecrets}
              onChange={(e) => onShowSecretsChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              {showSecrets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Secrets</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Achievement Dashboard Component
 */
export const AchievementDashboard: React.FC<AchievementDashboardProps> = ({
  userId,
  className
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const {
    achievements,
    userAchievements,
    achievementStats,
    unlockedAchievements,
    lockedAchievements,
    nearCompletionAchievements,
    recentUnlocks,
    getAchievementProgress,
    isLoading,
    error
  } = useAchievements({ userId });

  // Filter achievements based on current filters
  const filteredAchievements = achievements.filter(achievement => {
    // Category filter
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }

    // Rarity filter
    if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) {
      return false;
    }

    // Unlocked only filter
    if (showUnlockedOnly) {
      const isUnlocked = unlockedAchievements.some(ua => ua.id === achievement.id);
      if (!isUnlocked) return false;
    }

    // Secret filter
    if (!showSecrets && achievement.isSecret) {
      const isUnlocked = unlockedAchievements.some(ua => ua.id === achievement.id);
      if (!isUnlocked) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = achievement.name.toLowerCase().includes(query);
      const matchesDescription = achievement.description.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription) return false;
    }

    return true;
  });

  // Sort achievements: unlocked first, then by progress, then by rarity
  const sortedAchievements = filteredAchievements.sort((a, b) => {
    const aUnlocked = unlockedAchievements.some(ua => ua.id === a.id);
    const bUnlocked = unlockedAchievements.some(ub => ub.id === b.id);
    
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    
    if (!aUnlocked && !bUnlocked) {
      const aProgress = getAchievementProgress(a.id);
      const bProgress = getAchievementProgress(b.id);
      if (aProgress !== bProgress) return bProgress - aProgress;
    }
    
    const rarityOrder = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-red-500 mb-4">
          <Trophy className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Failed to load achievements</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your fitness journey and unlock epic rewards
        </p>
      </div>

      {/* Stats Summary */}
      <AchievementStats stats={achievementStats} />

      {/* Recent Unlocks */}
      {recentUnlocks.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Unlocks
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentUnlocks.slice(0, 6).map(achievement => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {achievement.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {achievement.rarity} • {achievement.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Near Completion */}
      {nearCompletionAchievements.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Almost There
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearCompletionAchievements.map(({ achievement, progress }) => (
              <div
                key={achievement.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-xl">{achievement.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(progress * 100)}% complete
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <AchievementFilters
        selectedCategory={selectedCategory}
        selectedRarity={selectedRarity}
        showUnlockedOnly={showUnlockedOnly}
        showSecrets={showSecrets}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategory}
        onRarityChange={setSelectedRarity}
        onShowUnlockedChange={setShowUnlockedOnly}
        onShowSecretsChange={setShowSecrets}
        onSearchChange={setSearchQuery}
      />

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {sortedAchievements.map(achievement => {
            const isUnlocked = unlockedAchievements.some(ua => ua.id === achievement.id);
            const progress = getAchievementProgress(achievement.id);
            
            return (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <AchievementCard
                  achievement={achievement}
                  progress={progress}
                  isUnlocked={isUnlocked}
                  isSecret={achievement.isSecret}
                  onClick={() => setSelectedAchievement(achievement)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {sortedAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or start working out to unlock achievements!
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          progress={getAchievementProgress(selectedAchievement.id)}
          isUnlocked={unlockedAchievements.some(ua => ua.id === selectedAchievement.id)}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  );
};

/**
 * Achievement Detail Modal
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
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{achievement.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {achievement.name}
          </h2>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold capitalize',
              achievement.rarity === 'common' && 'bg-gray-200 text-gray-700',
              achievement.rarity === 'uncommon' && 'bg-green-200 text-green-700',
              achievement.rarity === 'rare' && 'bg-blue-200 text-blue-700',
              achievement.rarity === 'epic' && 'bg-purple-200 text-purple-700',
              achievement.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700',
              achievement.rarity === 'mythic' && 'bg-pink-200 text-pink-700'
            )}>
              {achievement.rarity}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {achievement.category}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 text-center mb-6">
          {achievement.description}
        </p>

        {/* Progress */}
        {!isUnlocked && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-blue-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rewards</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {achievement.rewards.xp} XP
              </span>
            </div>
            {achievement.rewards.title && (
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Title: {achievement.rewards.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-6">
          {isUnlocked ? (
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Achievement Unlocked!</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Target className="w-5 h-5" />
              <span>Keep working to unlock this achievement</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default AchievementDashboard;