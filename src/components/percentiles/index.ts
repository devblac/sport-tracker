/**
 * Percentiles Components Index
 * 
 * Exports all percentile-related components for easy importing
 */

export { GlobalPercentilesVisualization } from './GlobalPercentilesVisualization';
export { PercentileDashboard } from './PercentileDashboard';
export { SupabasePercentileDisplay } from './SupabasePercentileDisplay';
export { EnhancedPercentileDisplay } from './EnhancedPercentileDisplay';
export { PercentileSystemDemo } from './PercentileSystemDemo';

// Re-export types for convenience
export type {
  UserDemographics,
  ExercisePerformance,
  PercentileSegment,
  PercentileData,
  UserPercentileRanking,
  PercentileComparison,
  GlobalRanking
} from '@/types/percentiles';

// Re-export services
export { GlobalPercentilesService } from '@/services/GlobalPercentilesService';
export { supabasePercentileService } from '@/services/SupabasePercentileService';
export { percentileIntegrationService } from '@/services/percentileIntegrationService';
export { realTimePercentileUpdater } from '@/services/realTimePercentileUpdater';
export { DemographicSegmentation } from '@/utils/demographicSegmentation';