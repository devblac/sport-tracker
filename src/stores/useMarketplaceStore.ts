// ============================================================================
// MARKETPLACE STORE
// ============================================================================
// Zustand store for trainer marketplace functionality
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  MarketplaceState, 
  TrainerProfile, 
  PremiumContent, 
  TrainingSession,
  Purchase,
  TrainerSearchFilters,
  ContentSearchFilters,
  BookSessionForm,
  CreateContentForm,
  TrainerProfileForm,
  PaymentMethod,
  TrainerReview,
  TrainerDashboardStats,
  TrainerEarnings
} from '@/types/marketplace';

// Mock data for development
const mockTrainers: TrainerProfile[] = [
  {
    id: '1',
    userId: 'trainer1',
    displayName: 'Sarah Johnson',
    bio: 'Certified personal trainer with 8+ years of experience specializing in strength training and weight loss.',
    specialties: ['Strength Training', 'Weight Loss', 'HIIT', 'Nutrition'],
    certifications: ['NASM-CPT', 'Precision Nutrition Level 1'],
    experience: 8,
    rating: 4.9,
    totalReviews: 127,
    hourlyRate: 75,
    currency: 'USD',
    availability: {
      timezone: 'America/New_York',
      schedule: {
        monday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
        tuesday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
        wednesday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
        thursday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
        friday: { available: true, slots: [{ startTime: '09:00', endTime: '15:00' }] },
        saturday: { available: false, slots: [] },
        sunday: { available: false, slots: [] }
      }
    },
    profileImage: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400',
    languages: ['English', 'Spanish'],
    isVerified: true,
    isActive: true,
    totalEarnings: 45000,
    totalClients: 89,
    joinedAt: new Date('2022-01-15'),
    lastActive: new Date()
  },
  {
    id: '2',
    userId: 'trainer2',
    displayName: 'Mike Chen',
    bio: 'Former Olympic weightlifter turned coach. Specializing in powerlifting and athletic performance.',
    specialties: ['Powerlifting', 'Olympic Lifting', 'Athletic Performance', 'Mobility'],
    certifications: ['USAPL Coach', 'CSCS'],
    experience: 12,
    rating: 4.8,
    totalReviews: 203,
    hourlyRate: 90,
    currency: 'USD',
    availability: {
      timezone: 'America/Los_Angeles',
      schedule: {
        monday: { available: true, slots: [{ startTime: '06:00', endTime: '20:00' }] },
        tuesday: { available: true, slots: [{ startTime: '06:00', endTime: '20:00' }] },
        wednesday: { available: true, slots: [{ startTime: '06:00', endTime: '20:00' }] },
        thursday: { available: true, slots: [{ startTime: '06:00', endTime: '20:00' }] },
        friday: { available: true, slots: [{ startTime: '06:00', endTime: '18:00' }] },
        saturday: { available: true, slots: [{ startTime: '08:00', endTime: '16:00' }] },
        sunday: { available: false, slots: [] }
      }
    },
    profileImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    languages: ['English', 'Mandarin'],
    isVerified: true,
    isActive: true,
    totalEarnings: 78000,
    totalClients: 156,
    joinedAt: new Date('2021-06-10'),
    lastActive: new Date()
  }
];

const mockPremiumContent: PremiumContent[] = [
  {
    id: '1',
    trainerId: '1',
    title: '12-Week Strength Building Program',
    description: 'Complete progressive overload program designed to build serious strength in all major lifts.',
    type: 'workout_plan',
    price: 49.99,
    currency: 'USD',
    category: 'Strength Training',
    tags: ['Strength', 'Progressive Overload', 'Beginner Friendly'],
    difficulty: 'intermediate',
    duration: 12, // weeks
    previewImages: ['https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400'],
    content: {
      weeks: 12,
      workoutsPerWeek: 4,
      exercises: 45,
      includes: ['PDF Guide', 'Exercise Videos', 'Progress Tracker']
    },
    rating: 4.7,
    totalReviews: 89,
    totalSales: 234,
    isActive: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-11-20')
  },
  {
    id: '2',
    trainerId: '2',
    title: 'Olympic Lifting Masterclass',
    description: 'Learn proper technique for snatch and clean & jerk from an Olympic coach.',
    type: 'video_course',
    price: 79.99,
    currency: 'USD',
    category: 'Olympic Lifting',
    tags: ['Olympic Lifting', 'Technique', 'Advanced'],
    difficulty: 'advanced',
    duration: 180, // minutes
    previewImages: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'],
    previewVideo: 'https://example.com/preview.mp4',
    content: {
      modules: 8,
      totalVideos: 24,
      includes: ['HD Videos', 'Technique Breakdowns', 'Common Mistakes Guide']
    },
    rating: 4.9,
    totalReviews: 156,
    totalSales: 89,
    isActive: true,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-12-01')
  }
];

const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      // State
      trainers: mockTrainers,
      selectedTrainer: null,
      trainerSearchFilters: {},
      
      premiumContent: mockPremiumContent,
      selectedContent: null,
      contentSearchFilters: {},
      
      userPurchases: [],
      userSessions: [],
      
      trainerProfile: null,
      trainerStats: null,
      trainerEarnings: [],
      
      paymentMethods: [],
      subscription: null,
      
      isLoading: false,
      error: null,

      // Actions
      searchTrainers: async (filters: TrainerSearchFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if filters haven't changed to avoid unnecessary work
          const currentFilters = get().trainerSearchFilters;
          const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(filters);
          
          if (!filtersChanged && get().trainers.length > 0) {
            set({ isLoading: false });
            return;
          }

          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let filteredTrainers = [...mockTrainers];
          
          // Apply filters with early returns for performance
          if (filters.specialties?.length) {
            const specialtySet = new Set(filters.specialties);
            filteredTrainers = filteredTrainers.filter(trainer =>
              trainer.specialties.some(specialty => specialtySet.has(specialty))
            );
          }
          
          if (filters.minRating) {
            filteredTrainers = filteredTrainers.filter(trainer =>
              trainer.rating >= filters.minRating!
            );
          }
          
          if (filters.maxHourlyRate) {
            filteredTrainers = filteredTrainers.filter(trainer =>
              trainer.hourlyRate <= filters.maxHourlyRate!
            );
          }
          
          if (filters.languages?.length) {
            filteredTrainers = filteredTrainers.filter(trainer =>
              filters.languages!.some(lang =>
                trainer.languages.includes(lang)
              )
            );
          }
          
          // Apply sorting
          if (filters.sortBy) {
            filteredTrainers.sort((a, b) => {
              switch (filters.sortBy) {
                case 'rating':
                  return b.rating - a.rating;
                case 'price_low':
                  return a.hourlyRate - b.hourlyRate;
                case 'price_high':
                  return b.hourlyRate - a.hourlyRate;
                case 'experience':
                  return b.experience - a.experience;
                case 'reviews':
                  return b.totalReviews - a.totalReviews;
                default:
                  return 0;
              }
            });
          }
          
          set({ 
            trainers: filteredTrainers, 
            trainerSearchFilters: filters,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Failed to search trainers', 
            isLoading: false 
          });
        }
      },

      searchContent: async (filters: ContentSearchFilters) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          let filteredContent = [...mockPremiumContent];
          
          // Apply filters
          if (filters.type) {
            filteredContent = filteredContent.filter(content =>
              content.type === filters.type
            );
          }
          
          if (filters.difficulty) {
            filteredContent = filteredContent.filter(content =>
              content.difficulty === filters.difficulty
            );
          }
          
          if (filters.minRating) {
            filteredContent = filteredContent.filter(content =>
              content.rating >= filters.minRating!
            );
          }
          
          if (filters.maxPrice) {
            filteredContent = filteredContent.filter(content =>
              content.price <= filters.maxPrice!
            );
          }
          
          if (filters.tags?.length) {
            filteredContent = filteredContent.filter(content =>
              filters.tags!.some(tag =>
                content.tags.includes(tag)
              )
            );
          }
          
          // Apply sorting
          if (filters.sortBy) {
            filteredContent.sort((a, b) => {
              switch (filters.sortBy) {
                case 'rating':
                  return b.rating - a.rating;
                case 'price_low':
                  return a.price - b.price;
                case 'price_high':
                  return b.price - a.price;
                case 'newest':
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'popular':
                  return b.totalSales - a.totalSales;
                default:
                  return 0;
              }
            });
          }
          
          set({ 
            premiumContent: filteredContent, 
            contentSearchFilters: filters,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Failed to search content', 
            isLoading: false 
          });
        }
      },

      bookSession: async (sessionData: BookSessionForm) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const trainer = get().trainers.find(t => t.id === sessionData.trainerId);
          if (!trainer) {
            throw new Error('Trainer not found');
          }
          
          const newSession: TrainingSession = {
            id: `session_${Date.now()}`,
            trainerId: sessionData.trainerId,
            clientId: 'current_user', // Would come from auth
            type: sessionData.sessionType,
            title: `${sessionData.sessionType} with ${trainer.displayName}`,
            description: sessionData.message || '',
            scheduledAt: new Date(`${sessionData.date}T${sessionData.timeSlot}`),
            duration: sessionData.duration,
            price: trainer.hourlyRate * (sessionData.duration / 60),
            currency: trainer.currency,
            status: 'scheduled',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const newPurchase: Purchase = {
            id: `purchase_${Date.now()}`,
            userId: 'current_user',
            trainerId: sessionData.trainerId,
            itemType: 'session',
            itemId: newSession.id,
            amount: newSession.price,
            currency: newSession.currency,
            status: 'completed',
            paymentMethod: 'card',
            purchasedAt: new Date()
          };
          
          set(state => ({
            userSessions: [...state.userSessions, newSession],
            userPurchases: [...state.userPurchases, newPurchase],
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to book session', 
            isLoading: false 
          });
        }
      },

      purchaseContent: async (contentId: string, paymentMethodId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const content = get().premiumContent.find(c => c.id === contentId);
          if (!content) {
            throw new Error('Content not found');
          }
          
          const newPurchase: Purchase = {
            id: `purchase_${Date.now()}`,
            userId: 'current_user',
            trainerId: content.trainerId,
            itemType: 'content',
            itemId: contentId,
            amount: content.price,
            currency: content.currency,
            status: 'completed',
            paymentMethod: 'card',
            purchasedAt: new Date()
          };
          
          set(state => ({
            userPurchases: [...state.userPurchases, newPurchase],
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to purchase content', 
            isLoading: false 
          });
        }
      },

      createTrainerProfile: async (profileData: TrainerProfileForm) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newProfile: TrainerProfile = {
            id: `trainer_${Date.now()}`,
            userId: 'current_user',
            displayName: profileData.displayName,
            bio: profileData.bio,
            specialties: profileData.specialties,
            certifications: profileData.certifications,
            experience: profileData.experience,
            rating: 0,
            totalReviews: 0,
            hourlyRate: profileData.hourlyRate,
            currency: 'USD',
            availability: profileData.availability,
            languages: profileData.languages,
            isVerified: false,
            isActive: true,
            totalEarnings: 0,
            totalClients: 0,
            joinedAt: new Date(),
            lastActive: new Date()
          };
          
          set({ 
            trainerProfile: newProfile,
            isLoading: false 
          });
          
        } catch (error) {
          set({ 
            error: 'Failed to create trainer profile', 
            isLoading: false 
          });
        }
      },

      updateTrainerProfile: async (profileData: Partial<TrainerProfileForm>) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            trainerProfile: state.trainerProfile ? {
              ...state.trainerProfile,
              ...profileData,
              updatedAt: new Date()
            } : null,
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: 'Failed to update trainer profile', 
            isLoading: false 
          });
        }
      },

      createContent: async (contentData: CreateContentForm) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newContent: PremiumContent = {
            id: `content_${Date.now()}`,
            trainerId: 'current_user',
            title: contentData.title,
            description: contentData.description,
            type: contentData.type,
            price: contentData.price,
            currency: 'USD',
            category: contentData.category,
            tags: contentData.tags,
            difficulty: contentData.difficulty,
            duration: contentData.duration,
            previewImages: [], // Would handle file upload
            content: contentData.content,
            rating: 0,
            totalReviews: 0,
            totalSales: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set(state => ({
            premiumContent: [...state.premiumContent, newContent],
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: 'Failed to create content', 
            isLoading: false 
          });
        }
      },

      addPaymentMethod: async (paymentMethod) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const newPaymentMethod: PaymentMethod = {
            ...paymentMethod,
            id: `pm_${Date.now()}`,
            userId: 'current_user',
            createdAt: new Date()
          };
          
          set(state => ({
            paymentMethods: [...state.paymentMethods, newPaymentMethod],
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: 'Failed to add payment method', 
            isLoading: false 
          });
        }
      },

      cancelSession: async (sessionId: string, reason: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            userSessions: state.userSessions.map(session =>
              session.id === sessionId
                ? { ...session, status: 'cancelled' as const, notes: reason }
                : session
            ),
            isLoading: false
          }));
          
        } catch (error) {
          set({ 
            error: 'Failed to cancel session', 
            isLoading: false 
          });
        }
      },

      leaveReview: async (reviewData) => {
        set({ isLoading: true, error: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Create new review
          const newReview: TrainerReview = {
            id: `review_${Date.now()}`,
            ...reviewData,
            createdAt: new Date()
          };
          
          // In real implementation, this would:
          // 1. Save review to database
          // 2. Update trainer/content average rating
          // 3. Send notification to trainer
          
          // Update local state if needed
          if (reviewData.type === 'content') {
            set(state => ({
              premiumContent: state.premiumContent.map(content =>
                content.id === reviewData.itemId
                  ? {
                      ...content,
                      totalReviews: content.totalReviews + 1,
                      // Recalculate rating (simplified)
                      rating: ((content.rating * content.totalReviews) + reviewData.rating) / (content.totalReviews + 1)
                    }
                  : content
              ),
              isLoading: false
            }));
          } else {
            // Update trainer rating
            set(state => ({
              trainers: state.trainers.map(trainer =>
                trainer.id === reviewData.trainerId
                  ? {
                      ...trainer,
                      totalReviews: trainer.totalReviews + 1,
                      rating: ((trainer.rating * trainer.totalReviews) + reviewData.rating) / (trainer.totalReviews + 1)
                    }
                  : trainer
              ),
              isLoading: false
            }));
          }
          
        } catch (error) {
          set({ 
            error: 'Failed to submit review', 
            isLoading: false 
          });
        }
      }
    }),
    {
      name: 'marketplace-store',
      partialize: (state) => ({
        userPurchases: state.userPurchases,
        userSessions: state.userSessions,
        trainerProfile: state.trainerProfile,
        paymentMethods: state.paymentMethods,
        subscription: state.subscription
      })
    }
  )
);

export default useMarketplaceStore;