// Marketplace Components - Export all marketplace-related components

export { ContentMarketplace } from './ContentMarketplace';
export { ContentCard } from './ContentCard';
export { ContentFilters } from './ContentFilters';
export { TrainerProfile } from './TrainerProfile';
export { PremiumContentPlayer } from './PremiumContentPlayer';
export { MarketplaceDemo } from './MarketplaceDemo';

// Re-export types for convenience
export type {
  PremiumContent,
  TrainerProfile as TrainerProfileType,
  PurchasedContent,
  ContentReview,
  PaymentIntent,
  PremiumContentData,
  PremiumWorkout,
  ContentSection,
  VideoContent
} from '../../types/marketplace';