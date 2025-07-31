/**
 * Shareable Content Service
 * 
 * Service for generating and managing shareable visual content cards.
 */

import type {
  ShareableContent,
  ShareableContentType,
  ShareableContentData,
  ShareOptions,
  ShareResult,
  SharePlatform,
  CardTemplate,
  CARD_TEMPLATES,
  SHARE_PLATFORMS
} from '@/types/shareableContent';

export class ShareableContentService {
  private static instance: ShareableContentService;
  private generatedContent: Map<string, ShareableContent> = new Map();

  static getInstance(): ShareableContentService {
    if (!ShareableContentService.instance) {
      ShareableContentService.instance = new ShareableContentService();
    }
    return ShareableContentService.instance;
  }

  // ============================================================================
  // Content Generation
  // ============================================================================

  /**
   * Generate shareable content card
   */
  async generateContent(
    type: ShareableContentType,
    data: ShareableContentData,
    userId: string,
    templateName?: string
  ): Promise<ShareableContent> {
    const templates = CARD_TEMPLATES[type];
    const template = templateName 
      ? templates.find(t => t.name === templateName) || templates[0]
      : templates[0];

    const content: ShareableContent = {
      id: `share_${type}_${userId}_${Date.now()}`,
      type,
      title: this.generateTitle(type, data),
      description: this.generateDescription(type, data),
      data,
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      accentColor: template.accentColor,
      template: template.name,
      createdAt: new Date(),
      userId,
      isPublic: true
    };

    this.generatedContent.set(content.id, content);
    return content;
  }

  /**
   * Generate workout card
   */
  async generateWorkoutCard(
    workoutData: {
      workoutName: string;
      duration: number;
      exerciseCount: number;
      totalVolume: number;
      personalRecords: string[];
      date: Date;
      workoutType: string;
      topExercises: Array<{
        name: string;
        sets: number;
        reps: number;
        weight: number;
      }>;
    },
    userId: string,
    templateName?: string
  ): Promise<ShareableContent> {
    const data: ShareableContentData = {
      type: 'workout_card',
      ...workoutData
    };

    return this.generateContent('workout_card', data, userId, templateName);
  }

  /**
   * Generate achievement card
   */
  async generateAchievementCard(
    achievementData: {
      achievementName: string;
      achievementDescription: string;
      achievementIcon: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      category: string;
      unlockedAt: Date;
      progress: {
        current: number;
        total: number;
        unit: string;
      };
    },
    userId: string,
    templateName?: string
  ): Promise<ShareableContent> {
    const data: ShareableContentData = {
      type: 'achievement_card',
      ...achievementData
    };

    return this.generateContent('achievement_card', data, userId, templateName);
  }

  /**
   * Generate personal record card
   */
  async generatePersonalRecordCard(
    recordData: {
      exerciseName: string;
      recordType: '1rm' | 'volume' | 'reps' | 'duration';
      previousValue: number;
      newValue: number;
      improvement: number;
      achievedAt: Date;
      exerciseCategory: string;
    },
    userId: string,
    templateName?: string
  ): Promise<ShareableContent> {
    const data: ShareableContentData = {
      type: 'personal_record_card',
      ...recordData
    };

    return this.generateContent('personal_record_card', data, userId, templateName);
  }

  // ============================================================================
  // Content Sharing
  // ============================================================================

  /**
   * Share content to platform
   */
  async shareContent(
    contentId: string,
    options: ShareOptions
  ): Promise<ShareResult> {
    const content = this.generatedContent.get(contentId);
    if (!content) {
      return {
        success: false,
        platform: options.platform,
        error: 'Content not found'
      };
    }

    try {
      switch (options.platform) {
        case 'facebook':
          return await this.shareToFacebook(content, options);
        case 'twitter':
          return await this.shareToTwitter(content, options);
        case 'instagram':
          return await this.shareToInstagram(content, options);
        case 'whatsapp':
          return await this.shareToWhatsApp(content, options);
        case 'telegram':
          return await this.shareToTelegram(content, options);
        case 'linkedin':
          return await this.shareToLinkedIn(content, options);
        case 'copy_link':
          return await this.copyToClipboard(content, options);
        case 'download_image':
          return await this.downloadImage(content, options);
        default:
          return {
            success: false,
            platform: options.platform,
            error: 'Unsupported platform'
          };
      }
    } catch (error) {
      return {
        success: false,
        platform: options.platform,
        error: error instanceof Error ? error.message : 'Share failed'
      };
    }
  }

  /**
   * Generate share text
   */
  generateShareText(content: ShareableContent, options: ShareOptions): string {
    let text = options.customMessage || content.description;
    
    if (options.includeAppBranding) {
      text += '\n\n🏋️ Compartido desde FitnessApp';
    }

    if (options.hashtags && options.hashtags.length > 0) {
      text += '\n\n' + options.hashtags.map(tag => `#${tag}`).join(' ');
    }

    // Truncate based on platform limits
    const platform = SHARE_PLATFORMS[options.platform];
    if (platform.maxTextLength && text.length > platform.maxTextLength) {
      text = text.substring(0, platform.maxTextLength - 3) + '...';
    }

    return text;
  }

  // ============================================================================
  // Platform-specific sharing
  // ============================================================================

  private async shareToFacebook(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const text = this.generateShareText(content, options);
    const shareUrl = this.generateShareUrl(content);
    
    const facebookUrl = SHARE_PLATFORMS.facebook.urlTemplate!
      .replace('{url}', encodeURIComponent(shareUrl))
      .replace('{text}', encodeURIComponent(text));

    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    return {
      success: true,
      platform: 'facebook',
      shareUrl: facebookUrl
    };
  }

  private async shareToTwitter(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const text = this.generateShareText(content, options);
    const shareUrl = this.generateShareUrl(content);
    
    const twitterUrl = SHARE_PLATFORMS.twitter.urlTemplate!
      .replace('{text}', encodeURIComponent(text))
      .replace('{url}', encodeURIComponent(shareUrl));

    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    return {
      success: true,
      platform: 'twitter',
      shareUrl: twitterUrl
    };
  }

  private async shareToInstagram(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    // Instagram doesn't support direct web sharing, so we'll copy the text and show instructions
    const text = this.generateShareText(content, options);
    
    try {
      await navigator.clipboard.writeText(text);
      alert('Texto copiado al portapapeles. Abre Instagram y pega el contenido en tu historia o post.');
      
      return {
        success: true,
        platform: 'instagram'
      };
    } catch (error) {
      return {
        success: false,
        platform: 'instagram',
        error: 'Failed to copy to clipboard'
      };
    }
  }

  private async shareToWhatsApp(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const text = this.generateShareText(content, options);
    const shareUrl = this.generateShareUrl(content);
    
    const whatsappUrl = SHARE_PLATFORMS.whatsapp.urlTemplate!
      .replace('{text}', encodeURIComponent(text))
      .replace('{url}', encodeURIComponent(shareUrl));

    window.open(whatsappUrl, '_blank');
    
    return {
      success: true,
      platform: 'whatsapp',
      shareUrl: whatsappUrl
    };
  }

  private async shareToTelegram(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const text = this.generateShareText(content, options);
    const shareUrl = this.generateShareUrl(content);
    
    const telegramUrl = SHARE_PLATFORMS.telegram.urlTemplate!
      .replace('{url}', encodeURIComponent(shareUrl))
      .replace('{text}', encodeURIComponent(text));

    window.open(telegramUrl, '_blank');
    
    return {
      success: true,
      platform: 'telegram',
      shareUrl: telegramUrl
    };
  }

  private async shareToLinkedIn(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const shareUrl = this.generateShareUrl(content);
    
    const linkedinUrl = SHARE_PLATFORMS.linkedin.urlTemplate!
      .replace('{url}', encodeURIComponent(shareUrl));

    window.open(linkedinUrl, '_blank', 'width=600,height=400');
    
    return {
      success: true,
      platform: 'linkedin',
      shareUrl: linkedinUrl
    };
  }

  private async copyToClipboard(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    const text = this.generateShareText(content, options);
    const shareUrl = this.generateShareUrl(content);
    const fullText = `${text}\n\n${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      return {
        success: true,
        platform: 'copy_link'
      };
    } catch (error) {
      return {
        success: false,
        platform: 'copy_link',
        error: 'Failed to copy to clipboard'
      };
    }
  }

  private async downloadImage(content: ShareableContent, options: ShareOptions): Promise<ShareResult> {
    try {
      // Generate image canvas and download
      const canvas = await this.generateImageCanvas(content);
      const link = document.createElement('a');
      link.download = `${content.type}_${content.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      return {
        success: true,
        platform: 'download_image'
      };
    } catch (error) {
      return {
        success: false,
        platform: 'download_image',
        error: 'Failed to generate image'
      };
    }
  }

  // ============================================================================
  // Content Generation Helpers
  // ============================================================================

  private generateTitle(type: ShareableContentType, data: ShareableContentData): string {
    switch (type) {
      case 'workout_card':
        const workoutData = data as any;
        return `💪 ${workoutData.workoutName}`;
      case 'achievement_card':
        const achievementData = data as any;
        return `🏆 ${achievementData.achievementName}`;
      case 'personal_record_card':
        const recordData = data as any;
        return `🎯 Nuevo PR en ${recordData.exerciseName}`;
      case 'streak_milestone_card':
        const streakData = data as any;
        return `🔥 ${streakData.streakDays} días de racha`;
      case 'level_up_card':
        const levelData = data as any;
        return `⬆️ ¡Nivel ${levelData.newLevel}!`;
      default:
        return 'Logro Fitness';
    }
  }

  private generateDescription(type: ShareableContentType, data: ShareableContentData): string {
    switch (type) {
      case 'workout_card':
        const workoutData = data as any;
        return `Completé "${workoutData.workoutName}" - ${workoutData.exerciseCount} ejercicios en ${workoutData.duration} min. ${workoutData.totalVolume} kg levantados total.`;
      case 'achievement_card':
        const achievementData = data as any;
        return `¡Acabo de desbloquear "${achievementData.achievementName}"! ${achievementData.achievementDescription}`;
      case 'personal_record_card':
        const recordData = data as any;
        return `¡Nuevo récord personal! ${recordData.exerciseName}: ${recordData.previousValue} → ${recordData.newValue} (+${recordData.improvement}%)`;
      case 'streak_milestone_card':
        const streakData = data as any;
        return `🔥 ¡${streakData.streakDays} días consecutivos entrenando! Manteniendo la consistencia.`;
      case 'level_up_card':
        const levelData = data as any;
        return `⬆️ ¡Subí al nivel ${levelData.newLevel}! Gané ${levelData.xpGained} XP y ahora tengo ${levelData.totalXP} XP total.`;
      default:
        return 'Compartiendo mi progreso fitness';
    }
  }

  private generateShareUrl(content: ShareableContent): string {
    // In a real app, this would be a deep link to the content
    return `https://fitnessapp.com/share/${content.id}`;
  }

  private async generateImageCanvas(content: ShareableContent): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = content.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = content.textColor;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(content.title, canvas.width / 2, 100);

    // Description
    ctx.font = '24px Arial';
    const words = content.description.split(' ');
    let line = '';
    let y = 200;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > canvas.width - 100 && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    // App branding
    ctx.font = '20px Arial';
    ctx.fillStyle = content.accentColor;
    ctx.fillText('🏋️ FitnessApp', canvas.width / 2, canvas.height - 50);

    return canvas;
  }

  // ============================================================================
  // Content Management
  // ============================================================================

  /**
   * Get generated content by ID
   */
  async getContent(contentId: string): Promise<ShareableContent | null> {
    return this.generatedContent.get(contentId) || null;
  }

  /**
   * Get user's generated content
   */
  async getUserContent(userId: string): Promise<ShareableContent[]> {
    return Array.from(this.generatedContent.values())
      .filter(content => content.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete generated content
   */
  async deleteContent(contentId: string): Promise<void> {
    this.generatedContent.delete(contentId);
  }

  /**
   * Get available templates for content type
   */
  getTemplatesForType(type: ShareableContentType): CardTemplate[] {
    return CARD_TEMPLATES[type] || [];
  }

  /**
   * Get supported platforms
   */
  getSupportedPlatforms(): SharePlatform[] {
    return Object.keys(SHARE_PLATFORMS) as SharePlatform[];
  }
}

export const shareableContentService = ShareableContentService.getInstance();