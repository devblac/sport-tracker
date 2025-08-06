// Premium Content Service - Cost-effective implementation
// Focuses on local storage and simple payment integration

import { 
  PremiumContent, 
  TrainerProfile, 
  PurchasedContent, 
  ContentReview,
  PaymentIntent,
  PremiumContentData
} from '../types/marketplace';

class PremiumContentService {
  private readonly STORAGE_KEYS = {
    PREMIUM_CONTENT: 'premium_content_catalog',
    PURCHASED_CONTENT: 'user_purchased_content',
    TRAINER_PROFILES: 'trainer_profiles',
    CONTENT_REVIEWS: 'content_reviews',
    PAYMENT_INTENTS: 'payment_intents'
  };

  // ===== CONTENT CATALOG MANAGEMENT =====
  
  /**
   * Get all available premium content (cached locally)
   */
  async getPremiumContentCatalog(): Promise<PremiumContent[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.PREMIUM_CONTENT);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // In a real app, this would fetch from API
      // For now, return sample data
      const sampleContent = this.getSamplePremiumContent();
      localStorage.setItem(this.STORAGE_KEYS.PREMIUM_CONTENT, JSON.stringify(sampleContent));
      return sampleContent;
    } catch (error) {
      console.error('Error loading premium content catalog:', error);
      return [];
    }
  }

  /**
   * Get content by category
   */
  async getContentByCategory(category: string): Promise<PremiumContent[]> {
    const allContent = await this.getPremiumContentCatalog();
    return allContent.filter(content => content.category === category);
  }

  /**
   * Get featured content
   */
  async getFeaturedContent(): Promise<PremiumContent[]> {
    const allContent = await this.getPremiumContentCatalog();
    return allContent.filter(content => content.is_featured);
  }

  /**
   * Search content by title, description, or tags
   */
  async searchContent(query: string): Promise<PremiumContent[]> {
    const allContent = await this.getPremiumContentCatalog();
    const searchTerm = query.toLowerCase();
    
    return allContent.filter(content => 
      content.title.toLowerCase().includes(searchTerm) ||
      content.description.toLowerCase().includes(searchTerm) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      content.trainer_name.toLowerCase().includes(searchTerm)
    );
  }

  // ===== PURCHASE MANAGEMENT =====
  
  /**
   * Check if user has purchased specific content
   */
  async hasPurchasedContent(contentId: string, userId: string): Promise<boolean> {
    const purchased = await this.getUserPurchasedContent(userId);
    return purchased.some(p => p.content_id === contentId);
  }

  /**
   * Get all content purchased by user
   */
  async getUserPurchasedContent(userId: string): Promise<PurchasedContent[]> {
    try {
      const key = `${this.STORAGE_KEYS.PURCHASED_CONTENT}_${userId}`;
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error loading purchased content:', error);
      return [];
    }
  }

  /**
   * Record a content purchase
   */
  async recordPurchase(purchase: Omit<PurchasedContent, 'completion_percentage' | 'is_favorite'>): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.PURCHASED_CONTENT}_${purchase.user_id}`;
      const existing = await this.getUserPurchasedContent(purchase.user_id);
      
      const newPurchase: PurchasedContent = {
        ...purchase,
        completion_percentage: 0,
        is_favorite: false
      };
      
      const updated = [...existing, newPurchase];
      localStorage.setItem(key, JSON.stringify(updated));
      
      // Update content purchase count
      await this.incrementPurchaseCount(purchase.content_id);
    } catch (error) {
      console.error('Error recording purchase:', error);
      throw error;
    }
  }

  /**
   * Get purchased content with full content data
   */
  async getPurchasedContentWithData(contentId: string, userId: string): Promise<PremiumContent | null> {
    const hasPurchased = await this.hasPurchasedContent(contentId, userId);
    if (!hasPurchased) {
      return null;
    }

    const allContent = await this.getPremiumContentCatalog();
    const content = allContent.find(c => c.id === contentId);
    
    if (content && !content.content_data) {
      // Load the actual content data (would be from secure storage/API)
      content.content_data = await this.loadContentData(contentId);
    }
    
    return content || null;
  }

  // ===== TRAINER PROFILES =====
  
  /**
   * Get trainer profile by ID
   */
  async getTrainerProfile(trainerId: string): Promise<TrainerProfile | null> {
    try {
      const profiles = await this.getTrainerProfiles();
      return profiles.find(p => p.id === trainerId) || null;
    } catch (error) {
      console.error('Error loading trainer profile:', error);
      return null;
    }
  }

  /**
   * Get all trainer profiles
   */
  async getTrainerProfiles(): Promise<TrainerProfile[]> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.TRAINER_PROFILES);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Return sample trainer data
      const sampleTrainers = this.getSampleTrainerProfiles();
      localStorage.setItem(this.STORAGE_KEYS.TRAINER_PROFILES, JSON.stringify(sampleTrainers));
      return sampleTrainers;
    } catch (error) {
      console.error('Error loading trainer profiles:', error);
      return [];
    }
  }

  /**
   * Get content by trainer
   */
  async getContentByTrainer(trainerId: string): Promise<PremiumContent[]> {
    const allContent = await this.getPremiumContentCatalog();
    return allContent.filter(content => content.trainer_id === trainerId);
  }

  // ===== REVIEWS =====
  
  /**
   * Get reviews for content
   */
  async getContentReviews(contentId: string): Promise<ContentReview[]> {
    try {
      const allReviews = localStorage.getItem(this.STORAGE_KEYS.CONTENT_REVIEWS);
      const reviews: ContentReview[] = allReviews ? JSON.parse(allReviews) : [];
      return reviews.filter(r => r.content_id === contentId);
    } catch (error) {
      console.error('Error loading reviews:', error);
      return [];
    }
  }

  /**
   * Add a review for content
   */
  async addContentReview(review: Omit<ContentReview, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const allReviews = localStorage.getItem(this.STORAGE_KEYS.CONTENT_REVIEWS);
      const reviews: ContentReview[] = allReviews ? JSON.parse(allReviews) : [];
      
      const newReview: ContentReview = {
        ...review,
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      reviews.push(newReview);
      localStorage.setItem(this.STORAGE_KEYS.CONTENT_REVIEWS, JSON.stringify(reviews));
      
      // Update content rating
      await this.updateContentRating(review.content_id);
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }

  // ===== PAYMENT INTEGRATION =====
  
  /**
   * Create payment intent for content purchase
   */
  async createPaymentIntent(contentId: string, userId: string): Promise<PaymentIntent> {
    const content = (await this.getPremiumContentCatalog()).find(c => c.id === contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const paymentIntent: PaymentIntent = {
      content_id: contentId,
      user_id: userId,
      amount: content.price,
      currency: content.currency,
      payment_method: 'stripe', // Default to Stripe
      status: 'pending',
      created_at: new Date()
    };

    // Store payment intent
    const key = this.STORAGE_KEYS.PAYMENT_INTENTS;
    const existing = localStorage.getItem(key);
    const intents: PaymentIntent[] = existing ? JSON.parse(existing) : [];
    intents.push(paymentIntent);
    localStorage.setItem(key, JSON.stringify(intents));

    return paymentIntent;
  }

  // ===== PRIVATE HELPER METHODS =====
  
  private async incrementPurchaseCount(contentId: string): Promise<void> {
    const allContent = await this.getPremiumContentCatalog();
    const contentIndex = allContent.findIndex(c => c.id === contentId);
    
    if (contentIndex !== -1) {
      allContent[contentIndex].purchase_count += 1;
      localStorage.setItem(this.STORAGE_KEYS.PREMIUM_CONTENT, JSON.stringify(allContent));
    }
  }

  private async updateContentRating(contentId: string): Promise<void> {
    const reviews = await this.getContentReviews(contentId);
    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    const allContent = await this.getPremiumContentCatalog();
    const contentIndex = allContent.findIndex(c => c.id === contentId);
    
    if (contentIndex !== -1) {
      allContent[contentIndex].rating = Math.round(averageRating * 10) / 10;
      allContent[contentIndex].review_count = reviews.length;
      localStorage.setItem(this.STORAGE_KEYS.PREMIUM_CONTENT, JSON.stringify(allContent));
    }
  }

  private async loadContentData(contentId: string): Promise<PremiumContentData> {
    // In a real implementation, this would fetch from secure storage
    // For now, return sample content data
    return {
      workouts: [
        {
          id: 'workout_1',
          name: 'Upper Body Strength',
          description: 'Focus on building upper body strength',
          exercises: [
            {
              exercise_id: 'bench_press',
              exercise_name: 'Bench Press',
              sets: 4,
              reps: '6-8',
              weight_guidance: '80-85% 1RM',
              rest_time: 180,
              notes: 'Focus on controlled movement'
            }
          ],
          estimated_duration: 60,
          difficulty: 'intermediate',
          equipment_needed: ['barbell', 'bench']
        }
      ]
    };
  }

  // Sample data for development
  private getSamplePremiumContent(): PremiumContent[] {
    return [
      {
        id: 'content_1',
        title: '12-Week Strength Building Program',
        description: 'Complete program to build raw strength with progressive overload',
        type: 'program',
        category: 'strength',
        difficulty_level: 'intermediate',
        duration_weeks: 12,
        price: 4999, // $49.99
        currency: 'USD',
        trainer_id: 'trainer_1',
        trainer_name: 'Mike Johnson',
        trainer_avatar: '/avatars/mike.jpg',
        preview_image: '/content/strength-program.jpg',
        tags: ['strength', 'powerlifting', 'progressive-overload'],
        rating: 4.8,
        review_count: 127,
        purchase_count: 1250,
        is_featured: true,
        is_active: true,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15')
      }
    ];
  }

  private getSampleTrainerProfiles(): TrainerProfile[] {
    return [
      {
        id: 'trainer_1',
        user_id: 'user_trainer_1',
        display_name: 'Mike Johnson',
        bio: 'Certified strength coach with 10+ years experience helping athletes reach their potential.',
        avatar_url: '/avatars/mike.jpg',
        certifications: [
          {
            id: 'cert_1',
            name: 'CSCS',
            organization: 'NSCA',
            issued_date: new Date('2020-01-01'),
            verification_status: 'verified'
          }
        ],
        specializations: ['Strength Training', 'Powerlifting', 'Athletic Performance'],
        experience_years: 10,
        rating: 4.9,
        review_count: 89,
        total_sales: 125000,
        follower_count: 5420,
        content_count: 8,
        featured_content_ids: ['content_1'],
        revenue_share_percentage: 70,
        total_earnings: 87500,
        is_verified: true,
        is_featured: true,
        is_active: true,
        created_at: new Date('2023-06-01'),
        updated_at: new Date('2024-01-15')
      }
    ];
  }
}

export const premiumContentService = new PremiumContentService();