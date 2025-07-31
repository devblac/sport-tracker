// EpicWinnerCelebration Component - Special celebrations for challenge winners
// Implements task 14.3 - Epic celebrations for winners

import React, { useState, useEffect } from 'react';
import { Challenge, ChallengeParticipant } from '../../types/challenges';
import { CelebrationData } from '../../services/challengeGamificationService';

interface EpicWinnerCelebrationProps {
  challenge: Challenge;
  participant: ChallengeParticipant;
  celebration: CelebrationData;
  onComplete?: () => void;
  className?: string;
}

export const EpicWinnerCelebration: React.FC<EpicWinnerCelebrationProps> = ({
  challenge,
  participant,
  celebration,
  onComplete,
  className = ''
}) => {
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'crown' | 'stats' | 'rewards' | 'share'>('intro');
  const [showFireworks, setShowFireworks] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  useEffect(() => {
    // Epic celebration sequence
    const sequence = async () => {
      // Phase 1: Dramatic intro with spotlight
      setShowSpotlight(true);
      await delay(1000);
      
      // Phase 2: Crown ceremony with fireworks
      setCurrentPhase('crown');
      setShowFireworks(true);
      await delay(3000);
      
      // Phase 3: Stats reveal with confetti
      setCurrentPhase('stats');
      setShowConfetti(true);
      await delay(2500);
      
      // Phase 4: Rewards showcase
      setCurrentPhase('rewards');
      await delay(2500);
      
      // Phase 5: Share celebration
      setCurrentPhase('share');
    };

    sequence();
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getRankIcon = () => {
    switch (participant.rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏆';
    }
  };

  const getRankTitle = () => {
    switch (participant.rank) {
      case 1: return 'CHAMPION';
      case 2: return 'RUNNER-UP';
      case 3: return 'THIRD PLACE';
      default: return `#${participant.rank}`;
    }
  };

  const getRankColor = () => {
    switch (participant.rank) {
      case 1: return 'from-yellow-400 via-yellow-500 to-orange-500';
      case 2: return 'from-gray-300 via-gray-400 to-gray-500';
      case 3: return 'from-amber-400 via-amber-500 to-amber-600';
      default: return 'from-blue-400 via-blue-500 to-blue-600';
    }
  };

  const getChallengeStats = () => {
    const completionTime = participant.completion_date 
      ? Math.ceil((participant.completion_date.getTime() - participant.joined_at.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      progress: Math.round(participant.progress),
      completionTime,
      rank: participant.rank,
      totalParticipants: challenge.participants_count
    };
  };

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Dramatic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black" />
      
      {/* Spotlight Effect */}
      {showSpotlight && (
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/5 to-transparent animate-pulse" />
      )}
      
      {/* Fireworks */}
      {showFireworks && <EpicFireworks />}
      
      {/* Confetti */}
      {showConfetti && <EpicConfetti />}
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-2xl w-full">
          
          {/* Intro Phase */}
          {currentPhase === 'intro' && (
            <div className="text-center animate-fade-in">
              <div className="text-8xl mb-6 animate-bounce">
                {getRankIcon()}
              </div>
              <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
                VICTORY!
              </h1>
              <p className="text-2xl text-gray-300">
                Preparing your celebration...
              </p>
            </div>
          )}

          {/* Crown Phase */}
          {currentPhase === 'crown' && (
            <div className="text-center animate-slide-up">
              <div className="relative mb-8">
                <div className={`text-9xl animate-bounce ${participant.rank === 1 ? 'animate-spin-slow' : ''}`}>
                  {getRankIcon()}
                </div>
                {participant.rank === 1 && (
                  <div className="absolute inset-0 animate-ping">
                    <div className="text-9xl opacity-75">👑</div>
                  </div>
                )}
              </div>
              
              <div className={`bg-gradient-to-r ${getRankColor()} bg-clip-text text-transparent`}>
                <h1 className="text-7xl font-black mb-4 animate-pulse">
                  {getRankTitle()}
                </h1>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {challenge.name}
                </h2>
                <p className="text-xl text-gray-300">
                  You conquered this challenge!
                </p>
              </div>
            </div>
          )}

          {/* Stats Phase */}
          {currentPhase === 'stats' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🏆 Victory Statistics
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <StatCard
                  icon="📊"
                  label="Progress"
                  value={`${getChallengeStats().progress}%`}
                  color="from-green-400 to-blue-500"
                />
                <StatCard
                  icon="⏱️"
                  label="Completion Time"
                  value={`${getChallengeStats().completionTime} days`}
                  color="from-purple-400 to-pink-500"
                />
                <StatCard
                  icon="🏅"
                  label="Final Rank"
                  value={`#${getChallengeStats().rank}`}
                  color="from-yellow-400 to-orange-500"
                />
                <StatCard
                  icon="👥"
                  label="Beat"
                  value={`${getChallengeStats().totalParticipants - getChallengeStats().rank} others`}
                  color="from-red-400 to-pink-500"
                />
              </div>
            </div>
          )}

          {/* Rewards Phase */}
          {currentPhase === 'rewards' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🎁 Your Rewards
                </h2>
              </div>
              
              <div className="space-y-4">
                {celebration.xp_gained && (
                  <RewardCard
                    icon="⚡"
                    title="Experience Points"
                    description={`${celebration.xp_gained} XP earned`}
                    rarity="epic"
                  />
                )}
                
                {celebration.achievements?.map((achievement, index) => (
                  <RewardCard
                    key={achievement.achievement_id}
                    icon="🏆"
                    title={achievement.name}
                    description={achievement.description}
                    rarity={achievement.rarity}
                    delay={index * 200}
                  />
                ))}
                
                {participant.rank === 1 && (
                  <RewardCard
                    icon="👑"
                    title="Champion Title"
                    description="Exclusive winner status"
                    rarity="legendary"
                    delay={400}
                  />
                )}
              </div>
            </div>
          )}

          {/* Share Phase */}
          {currentPhase === 'share' && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🚀 Share Your Victory
                </h2>
                <p className="text-xl text-gray-300">
                  Let the world know about your achievement!
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{getRankIcon()}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      I just won the {challenge.name}!
                    </h3>
                    <p className="text-gray-300">
                      Ranked #{participant.rank} out of {challenge.participants_count} participants
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>💪 {getChallengeStats().progress}% completion</span>
                  <span>⚡ {celebration.xp_gained} XP earned</span>
                  <span>🏆 {challenge.category} challenge</span>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    // Share to social media
                    alert('Sharing to social media!');
                  }}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  📱 Share Victory
                </button>
                
                <button
                  onClick={onComplete}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
                >
                  🎉 Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center transform hover:scale-105 transition-all duration-200">
    <div className="text-4xl mb-2">{icon}</div>
    <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1`}>
      {value}
    </div>
    <div className="text-gray-300 text-sm">{label}</div>
  </div>
);

// Reward Card Component
const RewardCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  rarity: string;
  delay?: number;
}> = ({ icon, title, description, rarity, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), delay);
  }, [delay]);

  const getRarityColor = () => {
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
      <div className={`bg-gradient-to-r ${getRarityColor()} p-4 rounded-xl text-white`}>
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{icon}</div>
          <div>
            <h4 className="text-xl font-bold">{title}</h4>
            <p className="text-sm opacity-90">{description}</p>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full mt-1 inline-block">
              {rarity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Epic Fireworks Component
const EpicFireworks: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(8)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-ping"
        style={{
          top: `${10 + (i % 4) * 25}%`,
          left: `${10 + (i % 3) * 30}%`,
          animationDelay: `${i * 300}ms`,
          animationDuration: '2s'
        }}
      >
        <div className="w-16 h-16 rounded-full border-4 border-yellow-400 opacity-75" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-red-400 opacity-50 animate-pulse" />
      </div>
    ))}
  </div>
);

// Epic Confetti Component
const EpicConfetti: React.FC = () => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const newParticles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 3000
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-bounce opacity-80"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '4s',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  );
};

export default EpicWinnerCelebration;