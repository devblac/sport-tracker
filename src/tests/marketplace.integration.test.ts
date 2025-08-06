// Marketplace Integration Tests
// Test the complete marketplace workflow

import { premiumContentService } from '../services/premiumContentService';
import { paymentService } from '../services/paymentService';
import { contentUploadService } from '../services/contentUploadService';
import { contentModerationService } from '../services/contentModerationService';

describe('Marketplace Integration Tests', () => {
  const mockUserId = 'test_user_123';
  const mockTrainerId = 'trainer_1';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Content Catalog Management', () => {
    test('should load premium content catalog', async () => {
      const catalog = await premiumContentService.getPremiumContentCatalog();
      expect(catalog).toBeDefined();
      expect(Array.isArray(catalog)).toBe(true);
      
      if (catalog.length > 0) {
        const firstItem = catalog[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('title');
        expect(firstItem).toHaveProperty('price');
        expect(firstItem).toHaveProperty('trainer_id');
      }
    });

    test('should filter content by category', async () => {
      const strengthContent = await premiumContentService.getContentByCategory('strength');
      expect(Array.isArray(strengthContent)).toBe(true);
      
      strengthContent.forEach(content => {
        expect(content.category).toBe('strength');
      });
    });

    test('should search content by query', async () => {
      const searchResults = await premiumContentService.searchContent('strength');
      expect(Array.isArray(searchResults)).toBe(true);
      
      searchResults.forEach(content => {
        const matchesTitle = content.title.toLowerCase().includes('strength');
        const matchesDescription = content.description.toLowerCase().includes('strength');
        const matchesTags = content.tags.some(tag => tag.toLowerCase().includes('strength'));
        
        expect(matchesTitle || matchesDescription || matchesTags).toBe(true);
      });
    });
  });

  describe('Purchase Workflow', () => {
    test('should validate payment before processing', async () => {
      const catalog = await premiumContentService.getPremiumContentCatalog();
      if (catalog.length === 0) return; // Skip if no content
      
      const contentId = catalog[0].id;
      const validation = await paymentService.validatePayment(contentId, mockUserId);
      
      expect(validation).toHaveProperty('valid');
      expect(typeof validation.valid).toBe('boolean');
      
      if (!validation.valid) {
        expect(validation).toHaveProperty('error');
      }
    });

    test('should get content pricing', async () => {
      const catalog = await premiumContentService.getPremiumContentCatalog();
      if (catalog.length === 0) return;
      
      const contentId = catalog[0].id;
      const pricing = await paymentService.getContentPricing(contentId, mockUserId);
      
      expect(pricing).toHaveProperty('originalPrice');
      expect(pricing).toHaveProperty('finalPrice');
      expect(pricing).toHaveProperty('currency');
      expect(typeof pricing.originalPrice).toBe('number');
      expect(pricing.originalPrice).toBeGreaterThan(0);
    });

    test('should record purchase correctly', async () => {
      const catalog = await premiumContentService.getPremiumContentCatalog();
      if (catalog.length === 0) return;
      
      const content = catalog[0];
      
      // Record purchase
      await premiumContentService.recordPurchase({
        content_id: content.id,
        user_id: mockUserId,
        purchase_date: new Date(),
        price_paid: content.price,
        currency: content.currency,
        payment_method: 'stripe',
        transaction_id: 'test_transaction_123',
        last_accessed: new Date()
      });
      
      // Verify purchase was recorded
      const hasPurchased = await premiumContentService.hasPurchasedContent(content.id, mockUserId);
      expect(hasPurchased).toBe(true);
      
      // Verify it appears in user's purchased content
      const userPurchases = await premiumContentService.getUserPurchasedContent(mockUserId);
      expect(userPurchases.some(p => p.content_id === content.id)).toBe(true);
    });
  });

  describe('Content Validation', () => {
    test('should validate premium content correctly', async () => {
      const validContent = {
        title: 'Complete Strength Training Program',
        description: 'This is a comprehensive strength training program designed for intermediate lifters who want to build muscle and increase their overall strength.',
        type: 'program' as const,
        category: 'strength' as const,
        difficulty_level: 'intermediate' as const,
        duration_weeks: 12,
        price: 4999,
        currency: 'USD' as const,
        tags: ['strength', 'muscle-building', 'intermediate']
      };
      
      const result = await contentModerationService.validatePremiumContent(validContent);
      
      expect(result).toHaveProperty('approved');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.approved).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test('should reject content with banned words', async () => {
      const invalidContent = {
        title: 'Guaranteed Miracle Workout Scam',
        description: 'This fake program promises instant results with secret hacks.',
        type: 'program' as const,
        category: 'strength' as const,
        price: 999
      };
      
      const result = await contentModerationService.validatePremiumContent(invalidContent);
      
      expect(result.approved).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    test('should validate trainer profile correctly', async () => {
      const validTrainer = {
        display_name: 'John Smith',
        bio: 'Certified personal trainer with over 10 years of experience helping clients achieve their fitness goals through strength training and nutrition coaching.',
        experience_years: 10,
        certifications: [
          {
            id: 'cert_1',
            name: 'NASM-CPT',
            organization: 'NASM',
            issued_date: new Date('2020-01-01'),
            verification_status: 'verified' as const
          }
        ],
        specializations: ['Strength Training', 'Weight Loss', 'Nutrition']
      };
      
      const result = await contentModerationService.validateTrainerProfile(validTrainer);
      
      expect(result).toHaveProperty('approved');
      expect(result).toHaveProperty('score');
      expect(typeof result.approved).toBe('boolean');
      expect(typeof result.score).toBe('number');
    });
  });

  describe('Content Upload Workflow', () => {
    test('should create and manage content drafts', async () => {
      // Start content creation
      const contentId = await contentUploadService.startContentCreation(mockTrainerId);
      expect(typeof contentId).toBe('string');
      expect(contentId.startsWith('draft_')).toBe(true);
      
      // Update basic info
      const basicInfo = {
        title: 'Test Workout Program',
        description: 'This is a test workout program for integration testing purposes.',
        type: 'program' as const,
        category: 'strength' as const,
        difficulty_level: 'beginner' as const,
        price: 2999,
        currency: 'USD' as const,
        tags: ['test', 'beginner', 'strength']
      };
      
      const progress1 = await contentUploadService.updateBasicInfo(contentId, basicInfo);
      expect(progress1.contentId).toBe(contentId);
      expect(progress1.step).toBe('basic_info');
      expect(typeof progress1.progress).toBe('number');
      
      // Add content data
      const contentData = {
        workouts: [
          {
            id: 'test_workout_1',
            name: 'Upper Body Test',
            description: 'Test workout for upper body',
            exercises: [
              {
                exercise_id: 'push_ups',
                exercise_name: 'Push-ups',
                sets: 3,
                reps: '10-15',
                weight_guidance: 'Bodyweight',
                rest_time: 60
              }
            ],
            estimated_duration: 30,
            difficulty: 'beginner' as const,
            equipment_needed: ['none']
          }
        ]
      };
      
      const progress2 = await contentUploadService.uploadContentData(contentId, contentData);
      expect(progress2.contentId).toBe(contentId);
      expect(progress2.step).toBe('content_data');
      
      // Get draft
      const draft = await contentUploadService.getDraft(contentId);
      expect(draft).toBeDefined();
      expect(draft?.id).toBe(contentId);
      expect(draft?.trainer_id).toBe(mockTrainerId);
      expect(draft?.basic_info.title).toBe(basicInfo.title);
      expect(draft?.content_data).toBeDefined();
      
      // Clean up
      await contentUploadService.deleteDraft(contentId);
      const deletedDraft = await contentUploadService.getDraft(contentId);
      expect(deletedDraft).toBeNull();
    });
  });

  describe('Trainer Management', () => {
    test('should load trainer profiles', async () => {
      const trainers = await premiumContentService.getTrainerProfiles();
      expect(Array.isArray(trainers)).toBe(true);
      
      if (trainers.length > 0) {
        const trainer = trainers[0];
        expect(trainer).toHaveProperty('id');
        expect(trainer).toHaveProperty('display_name');
        expect(trainer).toHaveProperty('bio');
        expect(trainer).toHaveProperty('experience_years');
        expect(trainer).toHaveProperty('certifications');
        expect(Array.isArray(trainer.certifications)).toBe(true);
      }
    });

    test('should get content by trainer', async () => {
      const trainers = await premiumContentService.getTrainerProfiles();
      if (trainers.length === 0) return;
      
      const trainerId = trainers[0].id;
      const trainerContent = await premiumContentService.getContentByTrainer(trainerId);
      
      expect(Array.isArray(trainerContent)).toBe(true);
      trainerContent.forEach(content => {
        expect(content.trainer_id).toBe(trainerId);
      });
    });
  });

  describe('Review System', () => {
    test('should add and retrieve content reviews', async () => {
      const catalog = await premiumContentService.getPremiumContentCatalog();
      if (catalog.length === 0) return;
      
      const contentId = catalog[0].id;
      
      // Add a review
      const review = {
        content_id: contentId,
        user_id: mockUserId,
        rating: 5,
        review_text: 'Excellent program! Really helped me build strength.',
        is_verified_purchase: true
      };
      
      await premiumContentService.addContentReview(review);
      
      // Retrieve reviews
      const reviews = await premiumContentService.getContentReviews(contentId);
      expect(Array.isArray(reviews)).toBe(true);
      
      const addedReview = reviews.find(r => r.user_id === mockUserId);
      expect(addedReview).toBeDefined();
      expect(addedReview?.rating).toBe(5);
      expect(addedReview?.review_text).toBe(review.review_text);
    });
  });

  describe('Price Formatting', () => {
    test('should format prices correctly', () => {
      expect(paymentService.formatPrice(999, 'USD')).toBe('$9.99');
      expect(paymentService.formatPrice(2999, 'USD')).toBe('$29.99');
      expect(paymentService.formatPrice(10000, 'USD')).toBe('$100.00');
    });
  });
});

// Helper function to run tests manually in browser console
(window as any).runMarketplaceTests = async () => {
  console.log('🧪 Running Marketplace Integration Tests...');
  
  try {
    // Test content loading
    console.log('📚 Testing content catalog...');
    const catalog = await premiumContentService.getPremiumContentCatalog();
    console.log(`✅ Loaded ${catalog.length} content items`);
    
    // Test trainers
    console.log('👨‍🏫 Testing trainer profiles...');
    const trainers = await premiumContentService.getTrainerProfiles();
    console.log(`✅ Loaded ${trainers.length} trainer profiles`);
    
    // Test validation
    console.log('🔍 Testing content validation...');
    const testContent = {
      title: 'Test Program',
      description: 'This is a test program description that should be long enough to pass validation.',
      type: 'program' as const,
      category: 'strength' as const,
      price: 2999
    };
    const validation = await contentModerationService.validatePremiumContent(testContent);
    console.log(`✅ Validation result: ${validation.approved ? 'PASSED' : 'FAILED'} (Score: ${validation.score})`);
    
    // Test payment validation
    if (catalog.length > 0) {
      console.log('💳 Testing payment validation...');
      const paymentValidation = await paymentService.validatePayment(catalog[0].id, 'test_user');
      console.log(`✅ Payment validation: ${paymentValidation.valid ? 'VALID' : 'INVALID'}`);
    }
    
    console.log('🎉 All tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};