/**
 * Viral Rewards Celebration Component
 * 
 * Celebrates viral milestones and rewards with epic animations.
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Gift,
  TrendingUp,
  Users,
  Share2,
  X
} from 'lucide-react';
import { useViralContentStore, type ViralReward } from '@/stores/useViralContentStore';

interface ViralRewardsCelebrationProps {
  rewards: ViralReward[];
  onClose: () => void;
  onClaimAll: () => void;
}

export const ViralRewardsCelebration: React.FC<ViralRewardsCelebrationProps> = ({
  rewards,
  onClose,
  onClaimAll
}) => {
  const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
  const [showRewards, setShowRewards] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'rewards' | 'summary'>('entrance');

  useEffect(() => {
    const timer1 = setTimeout(() => setAnimationPhase('rewards'), 1500);
    const timer2 = setTimeout(() => setShowRewards(true), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getRewardIcon = (type: ViralReward['type']) => {
    switch (type) {
      case 'xp_bonus':
        return { icon: Zap, color: '#fbbf24', bg: 'from-yellow-400 to-yellow-600' };
      case 'badge':
        return { icon: Trophy, color: '#f59e0b', bg: 'from-orange-400 to-orange-600' };
      case 'title':
        return { icon: Crown, color: '#a855f7', bg: 'from-purple-400 to-purple-600' };
      case 'premium_days':
        return { icon: Star, color: '#3b82f6', bg: 'from-blue-400 to-blue-600' };
      case 'special_content':
        return { icon: Gift, color: '#10b981', bg: 'from-green-400 to-green-600' };
      default:
        return { icon: Trophy, color: '#6b7280', bg: 'from-gray-400 to-gray-600' };
    }
  };

  const handleNextReward = () => {
    if (currentRewardIndex < rewards.length - 1) {
      setCurrentRewardIndex(currentRewardIndex + 1);
    } else {
      setAnimationPhase('summary');
    }
  };

  const handleClaimAndNext = () => {
    const reward = rewards[currentRewardIndex];
    useViralContentStore.getState().claimReward(reward.id);
    handleNextReward();
  };

  if (rewards.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-xl animate-bounce opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          >
            {['🎉', '✨', '🌟', '💫', '🎊'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
        
        {/* Radial gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-blue-900/20 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative max-w-2xl w-full">
        {/* Entrance Animation */}
        {animationPhase === 'entrance' && (
          <div className="text-center space-y-8">
            <div className="text-8xl animate-bounce">🎉</div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
              ¡VIRAL!
            </h1>
            <p className="text-2xl text-white">
              ¡Tu contenido está causando sensación!
            </p>
            
            {/* Viral metrics animation */}
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-2 animate-pulse" />
                <div className="text-3xl font-bold text-white">📈</div>
                <div className="text-sm text-gray-300">Engagement</div>
              </div>
              <div className="text-center">
                <Share2 className="w-12 h-12 text-blue-400 mx-auto mb-2 animate-bounce" />
                <div className="text-3xl font-bold text-white">🚀</div>
                <div className="text-sm text-gray-300">Shares</div>
              </div>
              <div className="text-center">
                <Users className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-pulse" />
                <div className="text-3xl font-bold text-white">👥</div>
                <div className="text-sm text-gray-300">Reach</div>
              </div>
            </div>
          </div>
        )}

        {/* Individual Reward Display */}
        {animationPhase === 'rewards' && showRewards && (
          <div className="text-center space-y-8">
            {(() => {
              const reward = rewards[currentRewardIndex];
              const rewardConfig = getRewardIcon(reward.type);
              const RewardIcon = rewardConfig.icon;
              
              return (
                <>
                  {/* Reward Header */}
                  <div className="space-y-4">
                    <div className="text-4xl font-bold text-white">
                      ¡Recompensa Desbloqueada!
                    </div>
                    <div className="text-lg text-gray-300">
                      Recompensa {currentRewardIndex + 1} de {rewards.length}
                    </div>
                  </div>

                  {/* Reward Icon */}
                  <div className="flex justify-center">
                    <div 
                      className={`w-32 h-32 rounded-full bg-gradient-to-br ${rewardConfig.bg} flex items-center justify-center shadow-2xl animate-pulse`}
                      style={{ boxShadow: `0 0 50px ${rewardConfig.color}50` }}
                    >
                      <RewardIcon 
                        className="w-16 h-16 text-white" 
                        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' }}
                      />
                    </div>
                  </div>

                  {/* Reward Details */}
                  <div className="bg-black bg-opacity-50 rounded-2xl p-8 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {reward.type === 'xp_bonus' && `+${reward.value} XP Bonus`}
                      {reward.type === 'badge' && 'Nuevo Badge'}
                      {reward.type === 'title' && 'Nuevo Título'}
                      {reward.type === 'premium_days' && `${reward.value} Días Premium`}
                      {reward.type === 'special_content' && 'Contenido Especial'}
                    </h2>
                    
                    <p className="text-xl text-gray-300 mb-6">
                      {reward.description}
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="flex justify-center space-x-2 mb-6">
                      {rewards.map((_, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentRewardIndex 
                              ? 'bg-white' 
                              : index < currentRewardIndex 
                                ? 'bg-green-400' 
                                : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleClaimAndNext}
                      className={`px-8 py-4 bg-gradient-to-r ${rewardConfig.bg} text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-lg`}
                    >
                      {currentRewardIndex < rewards.length - 1 ? 'Reclamar y Continuar' : 'Reclamar'}
                    </button>
                    
                    {rewards.length > 1 && (
                      <button
                        onClick={() => setAnimationPhase('summary')}
                        className="px-6 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-colors"
                      >
                        Ver Resumen
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Summary Phase */}
        {animationPhase === 'summary' && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-white">
                ¡Felicidades!
              </h1>
              <p className="text-xl text-gray-300">
                Has desbloqueado {rewards.length} recompensa{rewards.length !== 1 ? 's' : ''} viral{rewards.length !== 1 ? 'es' : ''}
              </p>
            </div>

            {/* Rewards Summary */}
            <div className="bg-black bg-opacity-50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-white mb-6">Recompensas Obtenidas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward, index) => {
                  const rewardConfig = getRewardIcon(reward.type);
                  const RewardIcon = rewardConfig.icon;
                  
                  return (
                    <div 
                      key={reward.id}
                      className="flex items-center space-x-4 p-4 bg-white bg-opacity-10 rounded-lg"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${rewardConfig.bg} flex items-center justify-center`}
                      >
                        <RewardIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white">
                          {reward.type === 'xp_bonus' && `+${reward.value} XP`}
                          {reward.type === 'badge' && 'Badge'}
                          {reward.type === 'title' && 'Título'}
                          {reward.type === 'premium_days' && `${reward.value}d Premium`}
                          {reward.type === 'special_content' && 'Contenido Especial'}
                        </div>
                        <div className="text-sm text-gray-300 truncate">
                          {reward.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClaimAll}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
              >
                Reclamar Todas
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default ViralRewardsCelebration;