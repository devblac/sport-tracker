/**
 * Epic Achievement Unlock Component
 * 
 * Creates epic visual celebrations for achievement unlocks with sharing capabilities.
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Sparkles,
  Share2,
  Download
} from 'lucide-react';
import { shareableContentService } from '@/services/ShareableContentService';
import { AchievementCard } from './AchievementCard';
import { ShareModal } from './ShareModal';
import type { ShareableContent, AchievementCardData } from '@/types/shareableContent';
import type { Achievement } from '@/types/gamification';

interface EpicAchievementUnlockProps {
  achievement: Achievement;
  userId: string;
  progress: {
    current: number;
    total: number;
    unit: string;
  };
  onClose?: () => void;
  onShare?: (content: ShareableContent) => void;
}

export const EpicAchievementUnlock: React.FC<EpicAchievementUnlockProps> = ({
  achievement,
  userId,
  progress,
  onClose,
  onShare
}) => {
  const [showCelebration, setShowCelebration] = useState(true);
  const [generatedCard, setGeneratedCard] = useState<ShareableContent | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'entrance' | 'celebration' | 'card'>('entrance');

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setAnimationPhase('celebration'), 1000);
    const timer2 = setTimeout(() => setAnimationPhase('card'), 3000);
    const timer3 = setTimeout(() => generateAchievementCard(), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const generateAchievementCard = async () => {
    try {
      const content = await shareableContentService.generateAchievementCard(
        {
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          achievementIcon: achievement.icon,
          rarity: achievement.rarity,
          category: achievement.category,
          unlockedAt: new Date(),
          progress
        },
        userId
      );
      
      setGeneratedCard(content);
    } catch (error) {
      console.error('Failed to generate achievement card:', error);
    }
  };

  const handleShare = () => {
    if (generatedCard) {
      setShowShareModal(true);
      onShare?.(generatedCard);
    }
  };

  const handleTemplateChange = async (templateName: string) => {
    if (!generatedCard) return;
    
    try {
      const updatedContent = await shareableContentService.generateAchievementCard(
        {
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          achievementIcon: achievement.icon,
          rarity: achievement.rarity,
          category: achievement.category,
          unlockedAt: new Date(),
          progress
        },
        userId,
        templateName
      );
      
      setGeneratedCard(updatedContent);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const getRarityConfig = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          color: '#fbbf24',
          bgGradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
          particles: '✨',
          icon: Crown,
          celebration: 'LEGENDARY ACHIEVEMENT!',
          effects: 'animate-pulse shadow-2xl shadow-yellow-500/50'
        };
      case 'epic':
        return {
          color: '#a855f7',
          bgGradient: 'from-purple-400 via-purple-500 to-purple-600',
          particles: '⚡',
          icon: Zap,
          celebration: 'EPIC ACHIEVEMENT!',
          effects: 'animate-bounce shadow-2xl shadow-purple-500/50'
        };
      case 'rare':
        return {
          color: '#3b82f6',
          bgGradient: 'from-blue-400 via-blue-500 to-blue-600',
          particles: '💫',
          icon: Star,
          celebration: 'RARE ACHIEVEMENT!',
          effects: 'animate-pulse shadow-2xl shadow-blue-500/50'
        };
      default:
        return {
          color: '#10b981',
          bgGradient: 'from-green-400 via-green-500 to-green-600',
          particles: '🌟',
          icon: Trophy,
          celebration: 'ACHIEVEMENT UNLOCKED!',
          effects: 'animate-bounce shadow-2xl shadow-green-500/50'
        };
    }
  };

  const rarityConfig = getRarityConfig();
  const RarityIcon = rarityConfig.icon;

  if (!showCelebration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          >
            {rarityConfig.particles}
          </div>
        ))}
        
        {/* Radial gradient overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-radial ${rarityConfig.bgGradient} opacity-20`}
        />
      </div>

      {/* Main Content */}
      <div className="relative max-w-4xl w-full">
        {/* Entrance Animation */}
        {animationPhase === 'entrance' && (
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${rarityConfig.effects} mb-8`}>
              <RarityIcon 
                className="w-16 h-16 text-white" 
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))' }}
              />
            </div>
            <div className="text-6xl animate-pulse">{achievement.icon}</div>
          </div>
        )}

        {/* Celebration Phase */}
        {animationPhase === 'celebration' && (
          <div className="text-center space-y-8">
            {/* Epic Header */}
            <div className="space-y-4">
              <div className="text-8xl animate-bounce">{achievement.icon}</div>
              <h1 
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r"
                style={{ 
                  backgroundImage: `linear-gradient(45deg, ${rarityConfig.color}, #ffffff)`,
                  textShadow: '0 0 30px rgba(255,255,255,0.5)'
                }}
              >
                {rarityConfig.celebration}
              </h1>
            </div>

            {/* Achievement Details */}
            <div className="bg-black bg-opacity-50 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-4xl font-bold text-white mb-4">
                {achievement.name}
              </h2>
              <p className="text-xl text-gray-300 mb-6">
                {achievement.description}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                <div 
                  className="h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: '100%',
                    backgroundColor: rarityConfig.color,
                    boxShadow: `0 0 20px ${rarityConfig.color}50`
                  }}
                />
              </div>
              
              <div className="text-lg text-white">
                <span className="font-bold">{progress.current}</span> / {progress.total} {progress.unit}
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 pointer-events-none">
              {achievement.rarity === 'legendary' && (
                <>
                  <div className="absolute top-10 left-10 text-6xl animate-spin">⭐</div>
                  <div className="absolute top-20 right-20 text-4xl animate-bounce">🎉</div>
                  <div className="absolute bottom-20 left-20 text-4xl animate-pulse">👑</div>
                  <div className="absolute bottom-10 right-10 text-6xl animate-spin">✨</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Card Display Phase */}
        {animationPhase === 'card' && generatedCard && (
          <div className="space-y-8">
            {/* Generated Card */}
            <div className="flex justify-center">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <AchievementCard
                  data={generatedCard.data as AchievementCardData}
                  backgroundColor={generatedCard.backgroundColor}
                  textColor={generatedCard.textColor}
                  accentColor={generatedCard.accentColor}
                  template={generatedCard.template}
                  className="max-w-md"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleShare}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <Share2 className="w-6 h-6" />
                <span>Compartir Logro</span>
              </button>
              
              <button
                onClick={() => {
                  if (generatedCard) {
                    shareableContentService.shareContent(generatedCard.id, {
                      platform: 'download_image',
                      includeAppBranding: true,
                      includeUserInfo: true
                    });
                  }
                }}
                className="px-6 py-4 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Descargar</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-4 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {animationPhase === 'card' && !generatedCard && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-xl">Generando tarjeta épica...</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        content={generatedCard}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onTemplateChange={handleTemplateChange}
      />

      {/* Sparkle Effects for Legendary */}
      {achievement.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute top-1/4 left-1/4 w-8 h-8 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute top-1/3 right-1/4 w-6 h-6 text-yellow-300 animate-bounce" />
          <Sparkles className="absolute bottom-1/4 left-1/3 w-10 h-10 text-yellow-500 animate-ping" />
          <Sparkles className="absolute bottom-1/3 right-1/3 w-7 h-7 text-yellow-400 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default EpicAchievementUnlock;