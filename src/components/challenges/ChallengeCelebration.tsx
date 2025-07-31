// ChallengeCelebration Component - Epic celebrations for challenge achievements
// Implements requirement 12.3 - Challenge celebration system

import React, { useState, useEffect } from 'react';
import { CelebrationData, AchievementUnlock } from '../services/challengeGamificationService';

interface ChallengeCelebrationProps {
  celebration: CelebrationData;
  onComplete?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

export const ChallengeCelebration: React.FC<ChallengeCelebrationProps> = ({
  celebration,
  onComplete,
  autoClose = true,
  autoCloseDelay = 5000,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'xp' | 'achievements' | 'complete'>('intro');

  useEffect(() => {
    // Start celebration sequence
    setIsVisible(true);
    
    if (celebration.visual_effects.confetti) {
      setShowConfetti(true);
    }
    
    if (celebration.visual_effects.fireworks) {
      setShowFireworks(true);
    }

    // Play sound effect
    if (celebration.visual_effects.sound) {
      playSound(celebration.visual_effects.sound);
    }

    // Auto-advance through celebration steps
    const sequence = async () => {
      await delay(1000);
      setCurrentStep('xp');
      
      if (celebration.achievements && celebration.achievements.length > 0) {
        await delay(2000);
        setCurrentStep('achievements');
        await delay(3000);
      } else {
        await delay(2000);
      }
      
      setCurrentStep('complete');
      
      if (autoClose) {
        await delay(autoCloseDelay);
        handleClose();
      }
    };

    sequence();
  }, [celebration, autoClose, autoCloseDelay]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const playSound = (soundName: string) => {
    // In a real app, this would play actual sound files
    console.log(`Playing sound: ${soundName}`);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete?.();
    }, 300);
  };

  const getCelebrationIcon = () => {
    switch (celebration.type) {
      case 'challenge_completed': return '🏆';
      case 'achievement_unlocked': return '🎖️';
      case 'level_up': return '⬆️';
      case 'rank_improved': return '📈';
      case 'xp_gained': return '⚡';
      default: return '🎉';
    }
  };

  const getCelebrationColor = () => {
    switch (celebration.type) {
      case 'challenge_completed': return 'from-yellow-400 to-orange-500';
      case 'achievement_unlocked': return 'from-purple-400 to-pink-500';
      case 'level_up': return 'from-green-400 to-blue-500';
      case 'rank_improved': return 'from-blue-400 to-purple-500';
      case 'xp_gained': return 'from-indigo-400 to-purple-500';
      default: return 'from-pink-400 to-red-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
      
      {/* Confetti Effect */}
      {showConfetti && <ConfettiEffect />}
      
      {/* Fireworks Effect */}
      {showFireworks && <FireworksEffect />}
      
      {/* Main Celebration Card */}
      <div className={`relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all duration-500 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        
        {/* Glow Effect */}
        {celebration.visual_effects.glow && (
          <div className={`absolute inset-0 bg-gradient-to-r ${getCelebrationColor()} opacity-20 animate-pulse`} />
        )}
        
        {/* Header */}
        <div className={`bg-gradient-to-r ${getCelebrationColor()} p-6 text-center relative overflow-hidden`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-repeat animate-pulse" 
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
          
          <div className="relative z-10">
            <div className="text-6xl mb-2 animate-bounce">
              {getCelebrationIcon()}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {celebration.title}
            </h2>
            <p className="text-white text-opacity-90">
              {celebration.message}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* XP Gained Animation */}
          {currentStep !== 'intro' && celebration.xp_gained && (
            <div className={`text-center transform transition-all duration-1000 ${
              currentStep === 'xp' ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
            }`}>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      +{celebration.xp_gained} XP
                    </div>
                    <div className="text-yellow-100 text-sm">
                      Experience Points Earned
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Level Up Display */}
          {celebration.level_gained && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl">🆙</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      Level {celebration.level_gained}!
                    </div>
                    <div className="text-green-100 text-sm">
                      You leveled up!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rank Change Display */}
          {celebration.rank_change && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-3xl">📈</span>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      #{celebration.rank_change.to}
                    </div>
                    <div className="text-blue-100 text-sm">
                      Up from #{celebration.rank_change.from}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Achievements */}
          {currentStep === 'achievements' && celebration.achievements && celebration.achievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-4">
                🏆 Achievements Unlocked!
              </h3>
              {celebration.achievements.map((achievement, index) => (
                <AchievementCard 
                  key={achievement.achievement_id} 
                  achievement={achievement} 
                  delay={index * 500}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {currentStep === 'complete' && (
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  // In a real app, this would share to social media
                  alert('Sharing to social media!');
                }}
                className={`flex-1 py-3 px-6 bg-gradient-to-r ${getCelebrationColor()} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
              >
                Share 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Achievement Card Component
const AchievementCard: React.FC<{ achievement: AchievementUnlock; delay: number }> = ({ 
  achievement, 
  delay 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-indigo-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className={`transform transition-all duration-500 ${
      isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4'
    }`}>
      <div className={`bg-gradient-to-r ${getRarityColor(achievement.rarity)} rounded-lg p-4 text-white`}>
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🏆</div>
          <div className="flex-1">
            <h4 className="font-bold">{achievement.name}</h4>
            <p className="text-sm opacity-90">{achievement.description}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                {achievement.rarity}
              </span>
              <span className="text-xs">+{achievement.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confetti Effect Component
const ConfettiEffect: React.FC = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  useEffect(() => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2000
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

// Fireworks Effect Component
const FireworksEffect: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-32 h-32 rounded-full border-4 border-yellow-400 animate-ping"
          style={{
            top: `${20 + i * 30}%`,
            left: `${20 + i * 25}%`,
            animationDelay: `${i * 500}ms`,
            animationDuration: '2s'
          }}
        />
      ))}
    </div>
  );
};

export default ChallengeCelebration;