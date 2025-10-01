// Legacy services for backward compatibility
export { authService } from './AuthService';
export { apiClient } from './ApiClient';
export { workoutService } from './WorkoutService';
export { notificationService } from './NotificationService';
export { workoutAutoSaveService } from './WorkoutAutoSaveService';
export { workoutRecoveryService } from './WorkoutRecoveryService';
export { shareableContentService } from './ShareableContentService';
export { viralContentOptimizer } from './ViralContentOptimizer';

// AI and Recommendation services
export { AIRecommendationService } from './AIRecommendationService';
export { RecoveryRecommendationService } from './RecoveryRecommendationService';
export { RecommendationEngine } from './recommendationEngine';

// New service registry and real services
export { 
  serviceRegistry,
  getAuthService,
  getGamificationService,
  getWorkoutService,
  getSocialService,
  getDatabaseService
} from './ServiceRegistry';

export { supabaseService } from './SupabaseService';
export { supabaseAuthService } from './supabaseAuthService';
export { realGamificationService } from './RealGamificationService';
export { enhancedWorkoutService } from './EnhancedWorkoutService';
export { realSocialService } from './RealSocialService';

// Export types
export type { ApiRequestConfig, ApiResponse, ApiError } from './ApiClient';