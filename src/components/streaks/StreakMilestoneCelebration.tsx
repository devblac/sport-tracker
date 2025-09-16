/**
 * Streak Milestone Celebration Component
 * 
 * Epic visual celebrations for streak milestones with animations,
 * confetti, rewards display, and social sharing options.
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  Crown,
  Zap,
  Share2,
  Download,
  X,
  Gift,
  Award,
  Sparkles,
  Heart,
  Target
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { StreakMilestoneReward, StreakReward } from '@/types/streakRewards';

interface StreakMilestoneCelebrationProps {
  milestone: StreakMilestoneReward;
  rewards: StreakReward[];
  streakLength: number;
  onClose: () => void;
  onShare?: () => void;
  className?: string;
}

export const StreakMilestoneCelebration: React.FC<StreakMilestoneCelebrationProps> = ({
  milestone,
  rewards,
  streakLength,
  onClose,
  onShare,
  className = ''
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);

  useEffect(() => {
    // Auto-advance through rewards
    if (rewards.length > 1) {
      const timer = setInterval(() => {
        setCurrentRewardIndex((prev) => (prev + 1) % rewards.length);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [rewards.length]);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'uncommon': return 'from-green-400 to-green-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      case 'mythic': return 'from-pink-400 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getCelebrationIcon = () => {
    switch (milestone.celebrationLevel) {
      case 'epic': return <Crown className="w-16 h-16 text-yellow-400" />;
      case 'legendary': return <Trophy className="w-16 h-16 text-yellow-400" />;
      default: return <Award className="w-16 h-16 text-blue-400" />;
    }
  };

  return (
    <div className={cn('fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4', className)}>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      {/* Main Celebration Modal */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={cn('bg-gradient-to-r p-6 text-white text-center relative', getRarityColor(milestone.rarity))}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mb-4">
            {getCelebrationIcon()}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{milestone.name}</h1>
          <p className="text-lg opacity-90">{streakLength} días consecutivos</p>
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {milestone.rarity.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="text-center">
            <p className="text-gray-600 leading-relaxed">
              {milestone.description}
            </p>
          </div>

          {/* Rewards Display */}
          {rewards.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-gray-900">
                🎁 Recompensas Desbloqueadas
              </h3>
              
              <div className="bg-gray-50 rounded-xl p-4">
                {rewards.map((reward, index) => (
                  <div
                    key={reward.id}
                    className={cn(
                      'flex items-center space-x-3 p-3 rounded-lg transition-all',
                      index === currentRewardIndex ? 'bg-white shadow-md scale-105' : 'opacity-60'
                    )}
                  >
                    <div className="text-2xl">{reward.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{reward.name}</h4>
                      <p className="text-sm text-gray-600">{reward.description}</p>
                      {reward.type === 'xp' && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600">
                            +{reward.value} XP
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      getRarityColor(reward.rarity).replace('from-', 'bg-').replace(' to-gray-600', '').replace(' to-green-600', '').replace(' to-blue-600', '').replace(' to-purple-600', '').replace(' to-yellow-600', '').replace(' to-pink-600', ''),
                      'text-white'
                    )}>
                      {reward.rarity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Display */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{streakLength}</div>
              <div className="text-xs text-blue-600">Días</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {rewards.filter(r => r.type === 'xp').reduce((sum, r) => sum + (typeof r.value === 'number' ? r.value : 0), 0)}
              </div>
              <div className="text-xs text-green-600">XP Total</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">{rewards.length}</div>
              <div className="text-xs text-purple-600">Recompensas</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continuar
            </button>
          </div>

          {/* Motivational Message */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              <span className="font-semibold text-gray-900">¡Sigue así!</span>
            </div>
            <p className="text-sm text-gray-600">
              Tu dedicación es inspiradora. Cada día que entrenas te acercas más a tus metas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakMilestoneCelebration;