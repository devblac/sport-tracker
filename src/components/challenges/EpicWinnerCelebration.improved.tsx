// Improved EpicWinnerCelebration - Split into focused components
import React, { useEffect } from 'react';
import { CelebrationData } from '../../services/challengeGamificationService';
import { Challenge, ChallengeParticipant } from '../../types/challenges';

// Types
interface CelebrationRewards {
  baseXP: number;
  bonusXP: number;
  specialRewards: string[];
  totalXP: number;
}

interface TestCelebrationData {
  type: 'challenge_completion' | 'milestone_reached';
  challengeTitle: string;
  rewards: CelebrationRewards;
  rank?: number;
  totalParticipants?: number;
  completionTime?: number;
  achievements?: string[];
  milestone?: number;
}

interface EpicWinnerCelebrationProps {
  challenge?: Challenge;
  participant?: ChallengeParticipant;
  celebration?: CelebrationData;
  isVisible?: boolean;
  celebrationData?: TestCelebrationData;
  onComplete?: () => void;
  className?: string;
}

// Prop validation utility
class PropValidator {
  static validate(props: EpicWinnerCelebrationProps): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const { challenge, participant, celebration, celebrationData } = props;
    
    if (!challenge && !celebrationData) {
      console.warn('EpicWinnerCelebration: Missing challenge or celebrationData prop');
    }
    
    if (!participant && !celebrationData) {
      console.warn('EpicWinnerCelebration: Missing participant or celebrationData prop');
    }
    
    if (celebrationData && !celebrationData.challengeTitle) {
      console.warn('EpicWinnerCelebration: celebrationData missing challengeTitle');
    }
  }
}

// Data extraction utility
class CelebrationDataExtractor {
  static extract(props: EpicWinnerCelebrationProps) {
    const { challenge, participant, celebration, celebrationData } = props;
    
    return {
      rank: participant?.rank ?? celebrationData?.rank ?? 1,
      challengeName: challenge?.name ?? celebrationData?.challengeTitle ?? 'Challenge',
      totalParticipants: challenge?.participants_count ?? celebrationData?.totalParticipants ?? 1,
      xpGained: celebration?.xp_gained ?? celebrationData?.rewards?.totalXP ?? 0,
      celebrationType: celebration?.type ?? celebrationData?.type ?? 'challenge_completion',
      milestone: celebrationData?.milestone,
      completionTime: celebrationData?.completionTime,
      specialRewards: celebrationData?.rewards?.specialRewards ?? []
    };
  }
}/
/ Rank utilities
class RankUtils {
  static getIcon(rank: number): string {
    const icons = { 1: '👑', 2: '🥈', 3: '🥉' };
    return icons[rank as keyof typeof icons] || '🏆';
  }

  static getTitle(rank: number): string {
    const titles = { 1: 'CHAMPION', 2: 'RUNNER-UP', 3: 'THIRD PLACE' };
    return titles[rank as keyof typeof titles] || `#${rank}`;
  }

  static getColor(rank: number): string {
    const colors = {
      1: 'from-yellow-400 via-yellow-500 to-orange-500',
      2: 'from-gray-300 via-gray-400 to-gray-500',
      3: 'from-amber-400 via-amber-500 to-amber-600'
    };
    return colors[rank as keyof typeof colors] || 'from-blue-400 via-blue-500 to-blue-600';
  }

  static getCelebrationTitle(rank: number, type: string, milestone?: number): string {
    if (type === 'milestone_reached' && milestone) {
      return '🎯 MILESTONE REACHED! 🎯';
    }
    
    const titles = {
      1: '🏆 CHAMPION! 🏆',
      2: '🥈 EXCELLENT! 🥈',
      3: '🥉 GREAT JOB! 🥉'
    };
    return titles[rank as keyof typeof titles] || '🎉 CHALLENGE COMPLETED! 🎉';
  }

  static getDisplayText(rank: number, totalParticipants: number, type: string, milestone?: number): string {
    if (type === 'milestone_reached' && milestone) {
      return `${milestone}% Complete!`;
    }
    
    const ordinal = (n: number): string => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${ordinal(rank)} Place out of ${totalParticipants} participants!`;
  }
}

// Special rewards utilities
class SpecialRewardsUtils {
  private static readonly REWARD_CONFIG = {
    perfectionist: { icon: '🎯', title: 'Perfectionist' },
    speed_demon: { icon: '⚡', title: 'Speed Demon' },
    streak_master: { icon: '🔥', title: 'Streak Master' },
    champion: { icon: '👑', title: 'Champion' }
  };

  static getIcon(reward: string): string {
    return this.REWARD_CONFIG[reward as keyof typeof this.REWARD_CONFIG]?.icon || '🏅';
  }

  static getTitle(reward: string): string {
    return this.REWARD_CONFIG[reward as keyof typeof this.REWARD_CONFIG]?.title || 'Unknown Reward';
  }

  static formatCompletionTime(completionTime?: number): string {
    if (!completionTime) return '';
    const days = Math.ceil(completionTime / (1000 * 60 * 60 * 24));
    return `Completed in ${days} days!`;
  }
}

// Auto-complete hook
const useAutoComplete = (onComplete?: () => void, isVisible?: boolean) => {
  useEffect(() => {
    if (onComplete && isVisible !== false) {
      const timer = setTimeout(onComplete, 6000);
      return () => clearTimeout(timer);
    }
  }, [onComplete, isVisible]);
};

// Main component - now focused and clean
export const EpicWinnerCelebration: React.FC<EpicWinnerCelebrationProps> = (props) => {
  const { isVisible = true, onComplete, className = '' } = props;

  // Validate props and extract data
  PropValidator.validate(props);
  const data = CelebrationDataExtractor.extract(props);
  
  // Auto-complete functionality
  useAutoComplete(onComplete, isVisible);

  if (isVisible === false) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      <CelebrationBackground />
      <CelebrationContent data={data} />
    </div>
  );
};//
 Separated components for better maintainability
const CelebrationBackground: React.FC = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black" />
    <EpicFireworks />
    <EpicConfetti />
  </>
);

interface CelebrationContentProps {
  data: ReturnType<typeof CelebrationDataExtractor.extract>;
}

const CelebrationContent: React.FC<CelebrationContentProps> = ({ data }) => {
  const { rank, challengeName, totalParticipants, xpGained, celebrationType, milestone, completionTime, specialRewards } = data;

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
      <div className="max-w-2xl w-full text-center text-white">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4">
            {RankUtils.getCelebrationTitle(rank, celebrationType, milestone)}
          </h1>
          
          <h2 className="text-3xl font-bold mb-4">{challengeName}</h2>
          
          <p className="text-xl mb-6">
            {RankUtils.getDisplayText(rank, totalParticipants, celebrationType, milestone)}
          </p>
          
          <div className="text-4xl font-bold mb-6">
            {xpGained.toLocaleString()} XP
          </div>
          
          {completionTime && (
            <p className="text-lg mb-4">
              {SpecialRewardsUtils.formatCompletionTime(completionTime)}
            </p>
          )}
          
          <SpecialRewardsList rewards={specialRewards} />
        </div>
      </div>
    </div>
  );
};

const SpecialRewardsList: React.FC<{ rewards: string[] }> = ({ rewards }) => (
  <>
    {rewards.map((reward) => (
      <div key={reward} className="text-lg mb-2">
        {SpecialRewardsUtils.getIcon(reward)} {SpecialRewardsUtils.getTitle(reward)}
      </div>
    ))}
  </>
);

// Simplified animation components
const EpicFireworks: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 8 }, (_, i) => (
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
      </div>
    ))}
  </div>
);

const EpicConfetti: React.FC = () => {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 3000
  }));

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
            animationDuration: '4s'
          }}
        />
      ))}
    </div>
  );
};

export default EpicWinnerCelebration;