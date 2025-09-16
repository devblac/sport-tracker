/**
 * Viral Content Optimizer Service
 * 
 * Optimizes content for maximum viral potential across social media platforms.
 */

import type { 
  ShareableContent, 
  SharePlatform, 
  ShareOptions 
} from '@/types/shareableContent';

export interface ViralOptimization {
  platform: SharePlatform;
  optimizedText: string;
  hashtags: string[];
  bestPostingTime?: Date;
  engagementScore: number;
  viralPotential: 'low' | 'medium' | 'high' | 'viral';
}

export interface ViralMetrics {
  contentId: string;
  platform: SharePlatform;
  shares: number;
  likes: number;
  comments: number;
  clicks: number;
  impressions: number;
  engagementRate: number;
  viralCoefficient: number;
  timestamp: Date;
}

export class ViralContentOptimizer {
  private static instance: ViralContentOptimizer;
  private viralMetrics: Map<string, ViralMetrics[]> = new Map();
  private platformOptimizations: Map<SharePlatform, any> = new Map();

  static getInstance(): ViralContentOptimizer {
    if (!ViralContentOptimizer.instance) {
      ViralContentOptimizer.instance = new ViralContentOptimizer();
    }
    return ViralContentOptimizer.instance;
  }

  constructor() {
    this.initializePlatformOptimizations();
  }

  // ============================================================================
  // Content Optimization
  // ============================================================================

  /**
   * Optimize content for specific platform
   */
  optimizeForPlatform(
    content: ShareableContent,
    platform: SharePlatform,
    userPreferences?: any
  ): ViralOptimization {
    const platformConfig = this.platformOptimizations.get(platform);
    if (!platformConfig) {
      throw new Error(`Platform ${platform} not supported`);
    }

    const optimizedText = this.optimizeText(content, platform);
    const hashtags = this.generateOptimalHashtags(content, platform);
    const engagementScore = this.calculateEngagementScore(content, platform);
    const viralPotential = this.assessViralPotential(content, platform, engagementScore);

    return {
      platform,
      optimizedText,
      hashtags,
      bestPostingTime: this.getBestPostingTime(platform, userPreferences),
      engagementScore,
      viralPotential
    };
  }

  /**
   * Optimize text for platform-specific requirements
   */
  private optimizeText(content: ShareableContent, platform: SharePlatform): string {
    let text = content.description;
    
    switch (platform) {
      case 'twitter':
        return this.optimizeForTwitter(text, content);
      case 'facebook':
        return this.optimizeForFacebook(text, content);
      case 'instagram':
        return this.optimizeForInstagram(text, content);
      case 'linkedin':
        return this.optimizeForLinkedIn(text, content);
      case 'whatsapp':
        return this.optimizeForWhatsApp(text, content);
      case 'telegram':
        return this.optimizeForTelegram(text, content);
      default:
        return text;
    }
  }

  private optimizeForTwitter(text: string, content: ShareableContent): string {
    // Twitter optimization: concise, engaging, with call-to-action
    const hooks = [
      '🔥 ¡Nuevo récord personal!',
      '💪 ¡Entrenamiento completado!',
      '🏆 ¡Logro desbloqueado!',
      '⚡ ¡Progreso imparable!',
      '🎯 ¡Meta alcanzada!'
    ];
    
    const hook = hooks[Math.floor(Math.random() * hooks.length)];
    const shortText = text.length > 200 ? text.substring(0, 197) + '...' : text;
    
    return `${hook}\n\n${shortText}\n\n¿Cuál es tu próxima meta? 💭`;
  }

  private optimizeForFacebook(text: string, content: ShareableContent): string {
    // Facebook optimization: storytelling, emotional connection
    const storyStarters = [
      'Hace unos meses no podía ni imaginar...',
      'El progreso no siempre es lineal, pero...',
      'Cada entrenamiento es una pequeña victoria...',
      'La consistencia está dando sus frutos...'
    ];
    
    const starter = storyStarters[Math.floor(Math.random() * storyStarters.length)];
    return `${starter}\n\n${text}\n\n¡La constancia es la clave del éxito! 💪\n\n¿Qué te motiva a seguir entrenando?`;
  }

  private optimizeForInstagram(text: string, content: ShareableContent): string {
    // Instagram optimization: visual storytelling, lifestyle focus
    const vibes = [
      '✨ Ese feeling post-workout ✨',
      '🌟 Transformando mi cuerpo y mente 🌟',
      '💫 Cada día más fuerte 💫',
      '🔥 Burning calories and breaking limits 🔥'
    ];
    
    const vibe = vibes[Math.floor(Math.random() * vibes.length)];
    return `${vibe}\n\n${text}\n\n#TransformationTuesday #FitnessMotivation #ProgressNotPerfection`;
  }

  private optimizeForLinkedIn(text: string, content: ShareableContent): string {
    // LinkedIn optimization: professional development, discipline
    return `💼 Lecciones del gimnasio aplicables al trabajo:\n\n${text}\n\nLa disciplina en el fitness se traduce en disciplina profesional. ¿Cómo te ayuda el ejercicio en tu carrera?`;
  }

  private optimizeForWhatsApp(text: string, content: ShareableContent): string {
    // WhatsApp optimization: personal, friendly tone
    return `¡Hola! 👋\n\nQuería compartir contigo mi progreso:\n\n${text}\n\n¡Espero que te inspire a seguir con tus metas! 💪`;
  }

  private optimizeForTelegram(text: string, content: ShareableContent): string {
    // Telegram optimization: community focused
    return `🏋️‍♂️ Actualización de entrenamiento:\n\n${text}\n\n¡Sigamos motivándonos mutuamente! 🚀`;
  }

  /**
   * Generate optimal hashtags for platform and content
   */
  private generateOptimalHashtags(content: ShareableContent, platform: SharePlatform): string[] {
    const baseHashtags = this.getBaseHashtags(content.type);
    const trendingHashtags = this.getTrendingHashtags(platform);
    const personalizedHashtags = this.getPersonalizedHashtags(content);
    
    const allHashtags = [...baseHashtags, ...trendingHashtags, ...personalizedHashtags];
    
    // Platform-specific hashtag limits
    const limits = {
      twitter: 3,
      instagram: 15,
      facebook: 5,
      linkedin: 3,
      whatsapp: 0,
      telegram: 5,
      copy_link: 5,
      download_image: 0
    };
    
    const limit = limits[platform] || 5;
    return allHashtags.slice(0, limit);
  }

  private getBaseHashtags(contentType: string): string[] {
    const hashtagMap = {
      workout_card: ['fitness', 'workout', 'gym', 'training', 'progress'],
      achievement_card: ['achievement', 'milestone', 'success', 'goals', 'motivation'],
      personal_record_card: ['PR', 'personalrecord', 'strength', 'gains', 'breakthrough'],
      streak_milestone_card: ['consistency', 'streak', 'discipline', 'habits', 'dedication'],
      level_up_card: ['levelup', 'progress', 'growth', 'improvement', 'journey']
    };
    
    return hashtagMap[contentType] || ['fitness', 'health', 'wellness'];
  }

  private getTrendingHashtags(platform: SharePlatform): string[] {
    // In a real app, this would fetch from trending APIs
    const trending = {
      twitter: ['FitnessMotivation', 'HealthyLifestyle', 'WorkoutWednesday'],
      instagram: ['FitspoDaily', 'GymLife', 'TransformationTuesday', 'MotivationMonday'],
      facebook: ['FitnessJourney', 'HealthyLiving', 'WorkoutMotivation'],
      linkedin: ['ProfessionalDevelopment', 'Discipline', 'HealthyHabits'],
      telegram: ['FitnessGroup', 'MotivationDaily'],
      whatsapp: [],
      copy_link: ['fitness', 'motivation'],
      download_image: []
    };
    
    return trending[platform] || [];
  }

  private getPersonalizedHashtags(content: ShareableContent): string[] {
    // Generate hashtags based on content data
    const hashtags: string[] = [];
    
    if (content.type === 'workout_card') {
      const data = content.data as any;
      if (data.workoutType) {
        hashtags.push(data.workoutType.toLowerCase().replace(/\s+/g, ''));
      }
      if (data.personalRecords?.length > 0) {
        hashtags.push('newPR');
      }
    }
    
    return hashtags;
  }

  // ============================================================================
  // Engagement & Viral Potential
  // ============================================================================

  /**
   * Calculate engagement score for content
   */
  private calculateEngagementScore(content: ShareableContent, platform: SharePlatform): number {
    let score = 0;
    
    // Content type scoring
    const typeScores = {
      achievement_card: 0.9,
      personal_record_card: 0.8,
      workout_card: 0.7,
      streak_milestone_card: 0.6,
      level_up_card: 0.8,
      progress_summary_card: 0.5
    };
    
    score += (typeScores[content.type] || 0.5) * 30;
    
    // Platform-specific scoring
    const platformMultipliers = {
      instagram: 1.2,
      facebook: 1.0,
      twitter: 0.9,
      linkedin: 0.7,
      whatsapp: 1.1,
      telegram: 0.8,
      copy_link: 0.5,
      download_image: 0.3
    };
    
    score *= (platformMultipliers[platform] || 1.0);
    
    // Content quality factors
    if (content.description.length > 50 && content.description.length < 300) {
      score += 10; // Optimal length
    }
    
    if (content.type === 'achievement_card') {
      const data = content.data as any;
      if (data.rarity === 'legendary') score += 20;
      else if (data.rarity === 'epic') score += 15;
      else if (data.rarity === 'rare') score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Assess viral potential
   */
  private assessViralPotential(
    content: ShareableContent, 
    platform: SharePlatform, 
    engagementScore: number
  ): 'low' | 'medium' | 'high' | 'viral' {
    if (engagementScore >= 85) return 'viral';
    if (engagementScore >= 70) return 'high';
    if (engagementScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Get optimal posting time for platform
   */
  private getBestPostingTime(platform: SharePlatform, userPreferences?: any): Date {
    // Platform-specific optimal times (in hours, 24h format)
    const optimalTimes = {
      instagram: [9, 11, 13, 17, 19], // Peak engagement times
      facebook: [9, 13, 15, 19, 21],
      twitter: [8, 12, 17, 19],
      linkedin: [8, 10, 12, 14, 17],
      whatsapp: [19, 20, 21], // Evening when people check messages
      telegram: [18, 19, 20],
      copy_link: [12], // Midday
      download_image: [12]
    };
    
    const times = optimalTimes[platform] || [12];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    
    const now = new Date();
    const bestTime = new Date(now);
    bestTime.setHours(randomTime, 0, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (bestTime <= now) {
      bestTime.setDate(bestTime.getDate() + 1);
    }
    
    return bestTime;
  }

  // ============================================================================
  // Metrics Tracking
  // ============================================================================

  /**
   * Track viral metrics for content
   */
  trackViralMetrics(metrics: ViralMetrics): void {
    const contentMetrics = this.viralMetrics.get(metrics.contentId) || [];
    contentMetrics.push(metrics);
    this.viralMetrics.set(metrics.contentId, contentMetrics);
  }

  /**
   * Get viral performance for content
   */
  getViralPerformance(contentId: string): ViralMetrics[] {
    return this.viralMetrics.get(contentId) || [];
  }

  /**
   * Calculate viral coefficient
   */
  calculateViralCoefficient(contentId: string): number {
    const metrics = this.getViralPerformance(contentId);
    if (metrics.length === 0) return 0;
    
    const totalShares = metrics.reduce((sum, m) => sum + m.shares, 0);
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    
    return totalImpressions > 0 ? totalShares / totalImpressions : 0;
  }

  /**
   * Get top performing content
   */
  getTopPerformingContent(limit: number = 10): Array<{
    contentId: string;
    totalEngagement: number;
    viralCoefficient: number;
    platforms: SharePlatform[];
  }> {
    const contentPerformance = new Map<string, any>();
    
    for (const [contentId, metrics] of this.viralMetrics) {
      const totalEngagement = metrics.reduce((sum, m) => 
        sum + m.likes + m.comments + m.shares, 0
      );
      const viralCoefficient = this.calculateViralCoefficient(contentId);
      const platforms = [...new Set(metrics.map(m => m.platform))];
      
      contentPerformance.set(contentId, {
        contentId,
        totalEngagement,
        viralCoefficient,
        platforms
      });
    }
    
    return Array.from(contentPerformance.values())
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, limit);
  }

  // ============================================================================
  // Platform Configurations
  // ============================================================================

  private initializePlatformOptimizations(): void {
    this.platformOptimizations.set('twitter', {
      maxLength: 280,
      optimalLength: 100,
      hashtagLimit: 3,
      imageRequired: false,
      videoSupport: true,
      linkPreview: true
    });
    
    this.platformOptimizations.set('instagram', {
      maxLength: 2200,
      optimalLength: 150,
      hashtagLimit: 30,
      imageRequired: true,
      videoSupport: true,
      linkPreview: false
    });
    
    this.platformOptimizations.set('facebook', {
      maxLength: 63206,
      optimalLength: 250,
      hashtagLimit: 5,
      imageRequired: false,
      videoSupport: true,
      linkPreview: true
    });
    
    this.platformOptimizations.set('linkedin', {
      maxLength: 3000,
      optimalLength: 200,
      hashtagLimit: 3,
      imageRequired: false,
      videoSupport: true,
      linkPreview: true
    });
  }
}

export const viralContentOptimizer = ViralContentOptimizer.getInstance();