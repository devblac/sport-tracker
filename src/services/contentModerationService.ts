// Content Moderation Service - Basic validation and moderation
// Cost-effective approach with client-side validation and simple rules

import { PremiumContent, TrainerProfile, ContentReview } from '../types/marketplace';

interface ModerationResult {
  approved: boolean;
  issues: string[];
  warnings: string[];
  score: number; // 0-100, higher is better
}

interface ContentValidationRules {
  minTitleLength: number;
  maxTitleLength: number;
  minDescriptionLength: number;
  maxDescriptionLength: number;
  maxTagCount: number;
  minPrice: number;
  maxPrice: number;
  requiredFields: string[];
  bannedWords: string[];
  requiredCertifications: string[];
}

class ContentModerationService {
  private readonly validationRules: ContentValidationRules = {
    minTitleLength: 10,
    maxTitleLength: 100,
    minDescriptionLength: 50,
    maxDescriptionLength: 1000,
    maxTagCount: 10,
    minPrice: 99, // $0.99 minimum
    maxPrice: 49999, // $499.99 maximum
    requiredFields: ['title', 'description', 'type', 'category', 'price'],
    bannedWords: [
      'scam', 'fake', 'guaranteed', 'miracle', 'instant',
      'secret', 'hack', 'cheat', 'illegal', 'dangerous'
    ],
    requiredCertifications: ['NASM', 'ACSM', 'NSCA', 'ACE', 'ISSA']
  };

  /**
   * Validate premium content before submission
   */
  async validatePremiumContent(content: Partial<PremiumContent>): Promise<ModerationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check required fields
    for (const field of this.validationRules.requiredFields) {
      if (!content[field as keyof PremiumContent]) {
        issues.push(`Missing required field: ${field}`);
        score -= 20;
      }
    }

    // Validate title
    if (content.title) {
      if (content.title.length < this.validationRules.minTitleLength) {
        issues.push(`Title too short (minimum ${this.validationRules.minTitleLength} characters)`);
        score -= 15;
      }
      if (content.title.length > this.validationRules.maxTitleLength) {
        issues.push(`Title too long (maximum ${this.validationRules.maxTitleLength} characters)`);
        score -= 10;
      }
      if (this.containsBannedWords(content.title)) {
        issues.push('Title contains inappropriate language');
        score -= 25;
      }
    }

    // Validate description
    if (content.description) {
      if (content.description.length < this.validationRules.minDescriptionLength) {
        issues.push(`Description too short (minimum ${this.validationRules.minDescriptionLength} characters)`);
        score -= 15;
      }
      if (content.description.length > this.validationRules.maxDescriptionLength) {
        issues.push(`Description too long (maximum ${this.validationRules.maxDescriptionLength} characters)`);
        score -= 10;
      }
      if (this.containsBannedWords(content.description)) {
        issues.push('Description contains inappropriate language');
        score -= 25;
      }
    }

    // Validate price
    if (content.price !== undefined) {
      if (content.price < this.validationRules.minPrice) {
        issues.push(`Price too low (minimum $${this.validationRules.minPrice / 100})`);
        score -= 15;
      }
      if (content.price > this.validationRules.maxPrice) {
        warnings.push(`Price is quite high ($${content.price / 100}). Consider market rates.`);
        score -= 5;
      }
    }

    // Validate tags
    if (content.tags && content.tags.length > this.validationRules.maxTagCount) {
      issues.push(`Too many tags (maximum ${this.validationRules.maxTagCount})`);
      score -= 10;
    }

    // Content type specific validation
    if (content.type === 'program' && !content.duration_weeks) {
      warnings.push('Programs should specify duration in weeks');
      score -= 5;
    }

    // Check for quality indicators
    if (!content.preview_image) {
      warnings.push('Adding a preview image will improve conversion rates');
      score -= 5;
    }

    if (!content.preview_video_url) {
      warnings.push('Adding a preview video will significantly improve sales');
      score -= 10;
    }

    return {
      approved: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Validate trainer profile
   */
  async validateTrainerProfile(profile: Partial<TrainerProfile>): Promise<ModerationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check required fields
    const requiredFields = ['display_name', 'bio', 'experience_years'];
    for (const field of requiredFields) {
      if (!profile[field as keyof TrainerProfile]) {
        issues.push(`Missing required field: ${field}`);
        score -= 20;
      }
    }

    // Validate display name
    if (profile.display_name) {
      if (profile.display_name.length < 2) {
        issues.push('Display name too short');
        score -= 15;
      }
      if (profile.display_name.length > 50) {
        issues.push('Display name too long');
        score -= 10;
      }
      if (this.containsBannedWords(profile.display_name)) {
        issues.push('Display name contains inappropriate language');
        score -= 25;
      }
    }

    // Validate bio
    if (profile.bio) {
      if (profile.bio.length < 50) {
        warnings.push('Bio should be at least 50 characters for better credibility');
        score -= 5;
      }
      if (profile.bio.length > 500) {
        warnings.push('Bio is quite long, consider making it more concise');
        score -= 5;
      }
      if (this.containsBannedWords(profile.bio)) {
        issues.push('Bio contains inappropriate language');
        score -= 25;
      }
    }

    // Validate experience
    if (profile.experience_years !== undefined) {
      if (profile.experience_years < 1) {
        warnings.push('Minimum 1 year of experience recommended for credibility');
        score -= 10;
      }
      if (profile.experience_years > 50) {
        warnings.push('Experience years seems unusually high');
        score -= 5;
      }
    }

    // Check certifications
    if (!profile.certifications || profile.certifications.length === 0) {
      issues.push('At least one fitness certification is required');
      score -= 30;
    } else {
      const hasRecognizedCert = profile.certifications.some(cert =>
        this.validationRules.requiredCertifications.some(required =>
          cert.name.toUpperCase().includes(required)
        )
      );
      
      if (!hasRecognizedCert) {
        warnings.push('Consider adding a widely recognized certification (NASM, ACSM, NSCA, ACE, ISSA)');
        score -= 10;
      }
    }

    // Check for quality indicators
    if (!profile.avatar_url) {
      warnings.push('Adding a professional photo will improve trust and sales');
      score -= 10;
    }

    if (!profile.specializations || profile.specializations.length === 0) {
      warnings.push('Adding specializations will help users find relevant content');
      score -= 5;
    }

    return {
      approved: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Moderate content review
   */
  async moderateReview(review: Partial<ContentReview>): Promise<ModerationResult> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check required fields
    if (!review.rating || review.rating < 1 || review.rating > 5) {
      issues.push('Rating must be between 1 and 5');
      score -= 20;
    }

    // Validate review text if provided
    if (review.review_text) {
      if (review.review_text.length < 10) {
        warnings.push('Review text is quite short');
        score -= 5;
      }
      
      if (review.review_text.length > 1000) {
        issues.push('Review text too long (maximum 1000 characters)');
        score -= 10;
      }

      if (this.containsBannedWords(review.review_text)) {
        issues.push('Review contains inappropriate language');
        score -= 30;
      }

      // Check for spam patterns
      if (this.isSpamReview(review.review_text)) {
        issues.push('Review appears to be spam');
        score -= 50;
      }
    }

    return {
      approved: issues.length === 0,
      issues,
      warnings,
      score: Math.max(0, score)
    };
  }

  /**
   * Get content quality score
   */
  async getContentQualityScore(content: PremiumContent): Promise<number> {
    let score = 50; // Base score

    // Title quality
    if (content.title.length >= 20 && content.title.length <= 60) score += 10;
    if (!this.containsBannedWords(content.title)) score += 5;

    // Description quality
    if (content.description.length >= 100) score += 10;
    if (content.description.includes('workout') || content.description.includes('exercise')) score += 5;

    // Media presence
    if (content.preview_image) score += 10;
    if (content.preview_video_url) score += 15;

    // Social proof
    if (content.rating >= 4.0) score += 10;
    if (content.review_count >= 10) score += 5;
    if (content.purchase_count >= 50) score += 10;

    // Tags and categorization
    if (content.tags.length >= 3 && content.tags.length <= 7) score += 5;

    // Pricing appropriateness
    const avgPrice = this.getAveragePriceForCategory(content.category);
    if (content.price >= avgPrice * 0.7 && content.price <= avgPrice * 1.5) score += 5;

    return Math.min(100, score);
  }

  /**
   * Generate content improvement suggestions
   */
  async getContentImprovementSuggestions(content: PremiumContent): Promise<string[]> {
    const suggestions: string[] = [];

    if (!content.preview_image) {
      suggestions.push('Add a high-quality preview image to increase click-through rates');
    }

    if (!content.preview_video_url) {
      suggestions.push('Create a preview video to showcase your content and improve conversions');
    }

    if (content.description.length < 150) {
      suggestions.push('Expand your description to better explain the value and benefits');
    }

    if (content.tags.length < 3) {
      suggestions.push('Add more relevant tags to improve discoverability');
    }

    if (content.rating < 4.0 && content.review_count > 5) {
      suggestions.push('Consider updating your content based on user feedback to improve ratings');
    }

    const avgPrice = this.getAveragePriceForCategory(content.category);
    if (content.price > avgPrice * 1.5) {
      suggestions.push('Your price is above market average. Consider the value proposition.');
    }

    if (content.purchase_count < 10 && Date.now() - content.created_at.getTime() > 30 * 24 * 60 * 60 * 1000) {
      suggestions.push('Low sales after 30 days. Consider revising title, description, or price.');
    }

    return suggestions;
  }

  // ===== PRIVATE HELPER METHODS =====

  private containsBannedWords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.validationRules.bannedWords.some(word => 
      lowerText.includes(word.toLowerCase())
    );
  }

  private isSpamReview(text: string): boolean {
    // Simple spam detection patterns
    const spamPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /^.{1,10}$/, // Too short
      /http[s]?:\/\//, // Contains URLs
      /\b(buy|click|visit|check)\b.*\b(here|now|link)\b/i, // Promotional language
      /^(great|good|bad|terrible)!*$/i // Single word reviews
    ];

    return spamPatterns.some(pattern => pattern.test(text));
  }

  private getAveragePriceForCategory(category: string): number {
    // Simplified average prices by category (in cents)
    const averagePrices: Record<string, number> = {
      strength: 2999, // $29.99
      cardio: 1999, // $19.99
      flexibility: 1499, // $14.99
      nutrition: 2499, // $24.99
      general: 1999 // $19.99
    };

    return averagePrices[category] || 2499;
  }
}

export const contentModerationService = new ContentModerationService();