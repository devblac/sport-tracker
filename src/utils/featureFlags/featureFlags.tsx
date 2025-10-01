/**
 * Feature flags system for controlled feature rollouts
 * Supports A/B testing, gradual rollouts, and environment-based flags
 */

import React from 'react';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: FeatureFlagCondition[];
  variants?: FeatureFlagVariant[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagCondition {
  type: 'user_id' | 'user_role' | 'environment' | 'date_range' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureFlagVariant {
  key: string;
  name: string;
  weight: number;
  payload?: Record<string, any>;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  environment?: string;
  customAttributes?: Record<string, any>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};
  private isInitialized = false;
  private refreshInterval = 300000; // 5 minutes
  private refreshTimer?: NodeJS.Timeout;

  async initialize(context: FeatureFlagContext = {}) {
    if (this.isInitialized) return;

    this.context = {
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      ...context
    };

    await this.loadFlags();
    this.startPeriodicRefresh();
    this.isInitialized = true;
    
    console.log('Feature flags initialized', {
      flagCount: this.flags.size,
      context: this.context
    });
  }

  private async loadFlags() {
    try {
      // Load from multiple sources
      await Promise.all([
        this.loadLocalFlags(),
        this.loadRemoteFlags(),
        this.loadEnvironmentFlags()
      ]);
    } catch (error) {
      console.warn('Failed to load some feature flags:', error);
    }
  }

  private async loadLocalFlags() {
    // Load flags from local configuration
    const localFlags: FeatureFlag[] = [
      {
        key: 'social_features',
        name: 'Social Features',
        description: 'Enable social features like gym friends and feed',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'user_role',
            operator: 'not_equals',
            value: 'guest'
          }
        ]
      },
      {
        key: 'premium_features',
        name: 'Premium Features',
        description: 'Enable premium subscription features',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'user_role',
            operator: 'in',
            value: ['premium', 'trainer', 'admin']
          }
        ]
      },
      {
        key: 'ai_recommendations',
        name: 'AI Recommendations',
        description: 'Enable AI-powered workout recommendations',
        enabled: false,
        rolloutPercentage: 10,
        conditions: [
          {
            type: 'environment',
            operator: 'in',
            value: ['staging', 'production']
          }
        ]
      },
      {
        key: 'new_workout_player',
        name: 'New Workout Player',
        description: 'Enable the redesigned workout player interface',
        enabled: true,
        rolloutPercentage: 50,
        variants: [
          {
            key: 'control',
            name: 'Original Player',
            weight: 50
          },
          {
            key: 'new_design',
            name: 'New Design',
            weight: 50,
            payload: {
              theme: 'modern',
              animations: true
            }
          }
        ]
      },
      {
        key: 'real_time_notifications',
        name: 'Real-time Notifications',
        description: 'Enable real-time push notifications',
        enabled: false,
        rolloutPercentage: 0,
        metadata: {
          reason: 'Currently disabled due to infinite loop bug'
        }
      },
      {
        key: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Enable advanced performance analytics',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [
          {
            type: 'environment',
            operator: 'equals',
            value: 'production'
          }
        ]
      },
      {
        key: 'beta_features',
        name: 'Beta Features',
        description: 'Enable beta features for testing',
        enabled: true,
        rolloutPercentage: 20,
        conditions: [
          {
            type: 'custom',
            operator: 'equals',
            value: 'beta_tester'
          }
        ]
      }
    ];

    for (const flag of localFlags) {
      this.flags.set(flag.key, flag);
    }
  }

  private async loadRemoteFlags() {
    // Load flags from remote service (e.g., LaunchDarkly, Split.io)
    try {
      const response = await fetch('/api/feature-flags', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const remoteFlags: FeatureFlag[] = await response.json();
        for (const flag of remoteFlags) {
          this.flags.set(flag.key, flag);
        }
      }
    } catch (error) {
      console.warn('Failed to load remote feature flags:', error);
    }
  }

  private async loadEnvironmentFlags() {
    // Load flags from environment variables
    const envFlags: Record<string, boolean> = {};
    
    // Parse environment variables starting with VITE_FEATURE_
    for (const [key, value] of Object.entries(import.meta.env)) {
      if (key.startsWith('VITE_FEATURE_')) {
        const flagKey = key.replace('VITE_FEATURE_', '').toLowerCase();
        envFlags[flagKey] = value === 'true';
      }
    }

    // Override local flags with environment flags
    for (const [key, enabled] of Object.entries(envFlags)) {
      const existingFlag = this.flags.get(key);
      if (existingFlag) {
        this.flags.set(key, { ...existingFlag, enabled });
      } else {
        this.flags.set(key, {
          key,
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Environment flag for ${key}`,
          enabled,
          rolloutPercentage: enabled ? 100 : 0
        });
      }
    }
  }

  private startPeriodicRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadRemoteFlags();
    }, this.refreshInterval);
  }

  // Check if a feature is enabled for the current context
  isEnabled(flagKey: string, context?: Partial<FeatureFlagContext>): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) {
      console.warn(`Feature flag '${flagKey}' not found`);
      return false;
    }

    const effectiveContext = { ...this.context, ...context };
    
    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check conditions
    if (flag.conditions && !this.evaluateConditions(flag.conditions, effectiveContext)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashContext(flagKey, effectiveContext);
      const percentage = (hash % 100) + 1;
      if (percentage > flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  // Get variant for A/B testing
  getVariant(flagKey: string, context?: Partial<FeatureFlagContext>): string | null {
    const flag = this.flags.get(flagKey);
    if (!flag || !flag.variants || !this.isEnabled(flagKey, context)) {
      return null;
    }

    const effectiveContext = { ...this.context, ...context };
    const hash = this.hashContext(flagKey, effectiveContext);
    const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
    
    let currentWeight = 0;
    const targetWeight = (hash % totalWeight) + 1;
    
    for (const variant of flag.variants) {
      currentWeight += variant.weight;
      if (targetWeight <= currentWeight) {
        return variant.key;
      }
    }

    return flag.variants[0]?.key || null;
  }

  // Get variant payload
  getVariantPayload(flagKey: string, context?: Partial<FeatureFlagContext>): Record<string, any> | null {
    const flag = this.flags.get(flagKey);
    const variantKey = this.getVariant(flagKey, context);
    
    if (!flag || !variantKey) {
      return null;
    }

    const variant = flag.variants?.find(v => v.key === variantKey);
    return variant?.payload || null;
  }

  private evaluateConditions(conditions: FeatureFlagCondition[], context: FeatureFlagContext): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: FeatureFlagCondition, context: FeatureFlagContext): boolean {
    let contextValue: any;

    switch (condition.type) {
      case 'user_id':
        contextValue = context.userId;
        break;
      case 'user_role':
        contextValue = context.userRole;
        break;
      case 'environment':
        contextValue = context.environment;
        break;
      case 'date_range':
        contextValue = new Date();
        break;
      case 'custom':
        contextValue = context.customAttributes?.[condition.value];
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      case 'not_equals':
        return contextValue !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(contextValue);
      case 'greater_than':
        return contextValue > condition.value;
      case 'less_than':
        return contextValue < condition.value;
      default:
        return false;
    }
  }

  private hashContext(flagKey: string, context: FeatureFlagContext): number {
    // Create a deterministic hash based on flag key and user context
    const str = `${flagKey}-${context.userId || 'anonymous'}-${context.userRole || 'guest'}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  private getAuthToken(): string | null {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.token;
      }
    } catch (e) {
      // Ignore errors when getting auth token
    }
    return null;
  }

  // Update context (e.g., when user logs in)
  updateContext(newContext: Partial<FeatureFlagContext>) {
    this.context = { ...this.context, ...newContext };
  }

  // Get all flags (for debugging)
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Get flag details
  getFlag(flagKey: string): FeatureFlag | null {
    return this.flags.get(flagKey) || null;
  }

  // Force refresh flags
  async refresh() {
    await this.loadFlags();
  }

  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export function useFeatureFlag(flagKey: string, context?: Partial<FeatureFlagContext>) {
  const [isEnabled, setIsEnabled] = React.useState(() => 
    featureFlags.isEnabled(flagKey, context)
  );
  
  const [variant, setVariant] = React.useState(() => 
    featureFlags.getVariant(flagKey, context)
  );

  const [payload, setPayload] = React.useState(() => 
    featureFlags.getVariantPayload(flagKey, context)
  );

  React.useEffect(() => {
    // Update when context changes
    setIsEnabled(featureFlags.isEnabled(flagKey, context));
    setVariant(featureFlags.getVariant(flagKey, context));
    setPayload(featureFlags.getVariantPayload(flagKey, context));
  }, [flagKey, context]);

  return {
    isEnabled,
    variant,
    payload,
    flag: featureFlags.getFlag(flagKey)
  };
}

// Higher-order component for feature flags
export function withFeatureFlag<P extends object>(
  flagKey: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlagWrapper(props: P) {
    const { isEnabled } = useFeatureFlag(flagKey);
    
    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

// Component for conditional rendering based on feature flags
export function FeatureFlag({ 
  flag, 
  children, 
  fallback,
  context 
}: {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: Partial<FeatureFlagContext>;
}) {
  const { isEnabled } = useFeatureFlag(flag, context);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}