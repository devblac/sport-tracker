/**
 * Viral Content Store
 * 
 * Zustand store for managing viral content tracking and rewards.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { viralContentOptimizer, type ViralMetrics } from '@/services/ViralContentOptimizer';
import type { ShareableContent, SharePlatform } from '@/types/shareableContent';

export interface ViralReward {
  id: string;
  contentId: string;
  type: 'xp_bonus' | 'badge' | 'title' | 'premium_days' | 'special_content';
  value: number;
  description: string;
  unlockedAt: Date;
  claimed: boolean;
}

export interface ViralMilestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'total_shares' | 'viral_coefficient' | 'engagement_rate' | 'platform_reach';
    value: number;
  };
  reward: Omit<ViralReward, 'id' | 'contentId' | 'unlockedAt' | 'claimed'>;
  unlocked: boolean;
}

export interface ContentPerformance {
  contentId: string;
  totalShares: number;
  totalLikes: number;
  totalComments: number;
  totalImpressions: number;
  engagementRate: number;
  viralCoefficient: number;
  platformReach: SharePlatform[];
  createdAt: Date;
  lastUpdated: Date;
}

interface ViralContentState {
  // Content tracking
  sharedContent: Map<string, ShareableContent>;
  contentPerformance: Map<string, ContentPerformance>;
  viralMetrics: Map<string, ViralMetrics[]>;
  
  // Rewards system
  availableRewards: ViralReward[];
  claimedRewards: ViralReward[];
  viralMilestones: ViralMilestone[];
  
  // User stats
  totalViralScore: number;
  viralLevel: number;
  viralBadges: string[];
  
  // UI state
  showViralCelebration: boolean;
  pendingRewards: ViralReward[];
}

interface ViralContentActions {
  // Content management
  addSharedContent: (content: ShareableContent) => void;
  trackContentShare: (contentId: string, platform: SharePlatform) => void;
  updateContentMetrics: (contentId: string, metrics: Partial<ViralMetrics>) => void;
  
  // Performance tracking
  getContentPerformance: (contentId: string) => ContentPerformance | null;
  getTopPerformingContent: (limit?: number) => ContentPerformance[];
  calculateViralScore: (userId: string) => number;
  
  // Rewards system
  checkForNewRewards: (userId: string) => ViralReward[];
  claimReward: (rewardId: string) => void;
  unlockMilestone: (milestoneId: string) => void;
  
  // Analytics
  getViralAnalytics: () => {
    totalShares: number;
    totalEngagement: number;
    averageViralCoefficient: number;
    topPlatforms: Array<{ platform: SharePlatform; shares: number }>;
    recentTrends: Array<{ date: string; shares: number; engagement: number }>;
  };
  
  // UI actions
  showCelebration: (rewards: ViralReward[]) => void;
  hideCelebration: () => void;
  clearPendingRewards: () => void;
}

const initialMilestones: ViralMilestone[] = [
  {
    id: 'first_share',
    name: 'Primer Compartir',
    description: 'Comparte tu primer logro',
    icon: '🚀',
    requirement: { type: 'total_shares', value: 1 },
    reward: {
      type: 'xp_bonus',
      value: 50,
      description: '+50 XP por compartir tu primer logro'
    },
    unlocked: false
  },
  {
    id: 'social_butterfly',
    name: 'Mariposa Social',
    description: 'Comparte en 3 plataformas diferentes',
    icon: '🦋',
    requirement: { type: 'platform_reach', value: 3 },
    reward: {
      type: 'badge',
      value: 1,
      description: 'Badge "Influencer Fitness"'
    },
    unlocked: false
  },
  {
    id: 'viral_sensation',
    name: 'Sensación Viral',
    description: 'Alcanza un coeficiente viral de 0.1',
    icon: '🔥',
    requirement: { type: 'viral_coefficient', value: 0.1 },
    reward: {
      type: 'premium_days',
      value: 7,
      description: '7 días de Premium gratis'
    },
    unlocked: false
  },
  {
    id: 'engagement_master',
    name: 'Maestro del Engagement',
    description: 'Logra 80% de engagement rate',
    icon: '⚡',
    requirement: { type: 'engagement_rate', value: 0.8 },
    reward: {
      type: 'title',
      value: 1,
      description: 'Título "Motivador Fitness"'
    },
    unlocked: false
  },
  {
    id: 'share_champion',
    name: 'Campeón del Compartir',
    description: 'Acumula 100 shares totales',
    icon: '👑',
    requirement: { type: 'total_shares', value: 100 },
    reward: {
      type: 'special_content',
      value: 1,
      description: 'Acceso a plantillas exclusivas'
    },
    unlocked: false
  }
];

export const useViralContentStore = create<ViralContentState & ViralContentActions>()(
  persist(
    (set, get) => ({
      // Initial state
      sharedContent: new Map(),
      contentPerformance: new Map(),
      viralMetrics: new Map(),
      availableRewards: [],
      claimedRewards: [],
      viralMilestones: initialMilestones,
      totalViralScore: 0,
      viralLevel: 1,
      viralBadges: [],
      showViralCelebration: false,
      pendingRewards: [],

      // Content management
      addSharedContent: (content) => {
        set((state) => {
          const newSharedContent = new Map(state.sharedContent);
          newSharedContent.set(content.id, content);
          
          const newPerformance = new Map(state.contentPerformance);
          newPerformance.set(content.id, {
            contentId: content.id,
            totalShares: 0,
            totalLikes: 0,
            totalComments: 0,
            totalImpressions: 0,
            engagementRate: 0,
            viralCoefficient: 0,
            platformReach: [],
            createdAt: content.createdAt,
            lastUpdated: new Date()
          });
          
          return {
            sharedContent: newSharedContent,
            contentPerformance: newPerformance
          };
        });
      },

      trackContentShare: (contentId, platform) => {
        set((state) => {
          const performance = state.contentPerformance.get(contentId);
          if (!performance) return state;
          
          const updatedPerformance = new Map(state.contentPerformance);
          const newPerformance = {
            ...performance,
            totalShares: performance.totalShares + 1,
            platformReach: performance.platformReach.includes(platform) 
              ? performance.platformReach 
              : [...performance.platformReach, platform],
            lastUpdated: new Date()
          };
          
          updatedPerformance.set(contentId, newPerformance);
          
          // Track metrics with viral optimizer
          viralContentOptimizer.trackViralMetrics({
            contentId,
            platform,
            shares: 1,
            likes: 0,
            comments: 0,
            clicks: 0,
            impressions: 1,
            engagementRate: 0,
            viralCoefficient: 0,
            timestamp: new Date()
          });
          
          return { contentPerformance: updatedPerformance };
        });
        
        // Check for new rewards after tracking
        const { checkForNewRewards } = get();
        const content = get().sharedContent.get(contentId);
        if (content) {
          checkForNewRewards(content.userId);
        }
      },

      updateContentMetrics: (contentId, metrics) => {
        set((state) => {
          const performance = state.contentPerformance.get(contentId);
          if (!performance) return state;
          
          const updatedPerformance = new Map(state.contentPerformance);
          const newPerformance = {
            ...performance,
            totalLikes: metrics.likes ?? performance.totalLikes,
            totalComments: metrics.comments ?? performance.totalComments,
            totalImpressions: metrics.impressions ?? performance.totalImpressions,
            engagementRate: metrics.engagementRate ?? performance.engagementRate,
            viralCoefficient: metrics.viralCoefficient ?? performance.viralCoefficient,
            lastUpdated: new Date()
          };
          
          updatedPerformance.set(contentId, newPerformance);
          return { contentPerformance: updatedPerformance };
        });
      },

      // Performance tracking
      getContentPerformance: (contentId) => {
        return get().contentPerformance.get(contentId) || null;
      },

      getTopPerformingContent: (limit = 10) => {
        const { contentPerformance } = get();
        return Array.from(contentPerformance.values())
          .sort((a, b) => {
            const scoreA = a.totalShares + a.totalLikes + a.totalComments;
            const scoreB = b.totalShares + b.totalLikes + b.totalComments;
            return scoreB - scoreA;
          })
          .slice(0, limit);
      },

      calculateViralScore: (userId) => {
        const { contentPerformance, sharedContent } = get();
        let totalScore = 0;
        
        for (const [contentId, performance] of contentPerformance) {
          const content = sharedContent.get(contentId);
          if (content?.userId === userId) {
            totalScore += performance.totalShares * 10;
            totalScore += performance.totalLikes * 2;
            totalScore += performance.totalComments * 5;
            totalScore += performance.viralCoefficient * 1000;
            totalScore += performance.platformReach.length * 20;
          }
        }
        
        set({ totalViralScore: totalScore });
        return totalScore;
      },

      // Rewards system
      checkForNewRewards: (userId) => {
        const state = get();
        const newRewards: ViralReward[] = [];
        
        // Calculate current stats
        const totalShares = Array.from(state.contentPerformance.values())
          .filter(p => {
            const content = state.sharedContent.get(p.contentId);
            return content?.userId === userId;
          })
          .reduce((sum, p) => sum + p.totalShares, 0);
        
        const platformReach = new Set(
          Array.from(state.contentPerformance.values())
            .filter(p => {
              const content = state.sharedContent.get(p.contentId);
              return content?.userId === userId;
            })
            .flatMap(p => p.platformReach)
        ).size;
        
        const avgViralCoefficient = Array.from(state.contentPerformance.values())
          .filter(p => {
            const content = state.sharedContent.get(p.contentId);
            return content?.userId === userId;
          })
          .reduce((sum, p, _, arr) => sum + p.viralCoefficient / arr.length, 0);
        
        const avgEngagementRate = Array.from(state.contentPerformance.values())
          .filter(p => {
            const content = state.sharedContent.get(p.contentId);
            return content?.userId === userId;
          })
          .reduce((sum, p, _, arr) => sum + p.engagementRate / arr.length, 0);
        
        // Check milestones
        const updatedMilestones = state.viralMilestones.map(milestone => {
          if (milestone.unlocked) return milestone;
          
          let requirementMet = false;
          switch (milestone.requirement.type) {
            case 'total_shares':
              requirementMet = totalShares >= milestone.requirement.value;
              break;
            case 'platform_reach':
              requirementMet = platformReach >= milestone.requirement.value;
              break;
            case 'viral_coefficient':
              requirementMet = avgViralCoefficient >= milestone.requirement.value;
              break;
            case 'engagement_rate':
              requirementMet = avgEngagementRate >= milestone.requirement.value;
              break;
          }
          
          if (requirementMet) {
            const reward: ViralReward = {
              id: `reward_${milestone.id}_${Date.now()}`,
              contentId: 'milestone',
              ...milestone.reward,
              unlockedAt: new Date(),
              claimed: false
            };
            
            newRewards.push(reward);
            return { ...milestone, unlocked: true };
          }
          
          return milestone;
        });
        
        if (newRewards.length > 0) {
          set((state) => ({
            viralMilestones: updatedMilestones,
            availableRewards: [...state.availableRewards, ...newRewards],
            pendingRewards: [...state.pendingRewards, ...newRewards]
          }));
          
          // Show celebration
          get().showCelebration(newRewards);
        }
        
        return newRewards;
      },

      claimReward: (rewardId) => {
        set((state) => {
          const reward = state.availableRewards.find(r => r.id === rewardId);
          if (!reward) return state;
          
          const updatedAvailable = state.availableRewards.filter(r => r.id !== rewardId);
          const updatedClaimed = [...state.claimedRewards, { ...reward, claimed: true }];
          
          return {
            availableRewards: updatedAvailable,
            claimedRewards: updatedClaimed
          };
        });
      },

      unlockMilestone: (milestoneId) => {
        set((state) => {
          const updatedMilestones = state.viralMilestones.map(milestone =>
            milestone.id === milestoneId ? { ...milestone, unlocked: true } : milestone
          );
          
          return { viralMilestones: updatedMilestones };
        });
      },

      // Analytics
      getViralAnalytics: () => {
        const { contentPerformance } = get();
        const performances = Array.from(contentPerformance.values());
        
        const totalShares = performances.reduce((sum, p) => sum + p.totalShares, 0);
        const totalEngagement = performances.reduce((sum, p) => 
          sum + p.totalLikes + p.totalComments + p.totalShares, 0
        );
        const averageViralCoefficient = performances.length > 0
          ? performances.reduce((sum, p) => sum + p.viralCoefficient, 0) / performances.length
          : 0;
        
        // Platform analysis
        const platformCounts = new Map<SharePlatform, number>();
        performances.forEach(p => {
          p.platformReach.forEach(platform => {
            platformCounts.set(platform, (platformCounts.get(platform) || 0) + p.totalShares);
          });
        });
        
        const topPlatforms = Array.from(platformCounts.entries())
          .map(([platform, shares]) => ({ platform, shares }))
          .sort((a, b) => b.shares - a.shares);
        
        // Recent trends (last 7 days)
        const recentTrends = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayPerformances = performances.filter(p => 
            p.lastUpdated.toISOString().split('T')[0] === dateStr
          );
          
          return {
            date: dateStr,
            shares: dayPerformances.reduce((sum, p) => sum + p.totalShares, 0),
            engagement: dayPerformances.reduce((sum, p) => 
              sum + p.totalLikes + p.totalComments, 0
            )
          };
        }).reverse();
        
        return {
          totalShares,
          totalEngagement,
          averageViralCoefficient,
          topPlatforms,
          recentTrends
        };
      },

      // UI actions
      showCelebration: (rewards) => {
        set({ 
          showViralCelebration: true,
          pendingRewards: rewards
        });
      },

      hideCelebration: () => {
        set({ showViralCelebration: false });
      },

      clearPendingRewards: () => {
        set({ pendingRewards: [] });
      }
    }),
    {
      name: 'viral-content-store',
      partialize: (state) => ({
        sharedContent: Array.from(state.sharedContent.entries()),
        contentPerformance: Array.from(state.contentPerformance.entries()),
        viralMetrics: Array.from(state.viralMetrics.entries()),
        availableRewards: state.availableRewards,
        claimedRewards: state.claimedRewards,
        viralMilestones: state.viralMilestones,
        totalViralScore: state.totalViralScore,
        viralLevel: state.viralLevel,
        viralBadges: state.viralBadges
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Maps
          state.sharedContent = new Map(state.sharedContent as any);
          state.contentPerformance = new Map(state.contentPerformance as any);
          state.viralMetrics = new Map(state.viralMetrics as any);
        }
      }
    }
  )
);