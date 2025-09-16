/**
 * Feature Gate Component
 * 
 * Conditionally renders content based on user feature access.
 * Shows upgrade prompts for restricted features.
 */

import React from 'react';
import { Crown, Lock, ArrowRight, Star } from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { hasFeatureAccess, getRoleDisplayName, FEATURE_DESCRIPTIONS } from '@/utils/featureAccess';
import type { FeatureAccess } from '@/utils/featureAccess';

interface FeatureGateProps {
  feature: keyof FeatureAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
  className?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
  className = '',
}) => {
  const { user } = useAuthStore();
  const hasAccess = hasFeatureAccess(user, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const isGuest = !user || user.role === 'guest';
  const featureDescription = FEATURE_DESCRIPTIONS[feature] || 'This feature';

  return (
    <Card className={`border-2 border-dashed border-primary/30 ${className}`}>
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {isGuest ? (
              <Lock className="w-8 h-8 text-primary" />
            ) : (
              <Crown className="w-8 h-8 text-primary" />
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isGuest ? 'Sign Up Required' : 'Premium Feature'}
            </h3>
            <p className="text-muted-foreground">
              {upgradeMessage || `${featureDescription} requires ${isGuest ? 'an account' : 'premium access'}.`}
            </p>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
            <div className="w-2 h-2 bg-muted-foreground rounded-full" />
            <span className="text-sm text-muted-foreground">
              Current: {getRoleDisplayName(user?.role as any || 'guest')}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {isGuest ? (
              <>
                <Button className="flex-1">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Sign Up Free
                </Button>
                <Button variant="outline" className="flex-1">
                  Sign In
                </Button>
              </>
            ) : (
              <>
                <Button className="flex-1">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
                <Button variant="outline" className="flex-1">
                  Learn More
                </Button>
              </>
            )}
          </div>

          {/* Feature Highlights */}
          {!isGuest && (
            <div className="w-full max-w-sm">
              <div className="text-xs text-muted-foreground mb-2">Premium includes:</div>
              <div className="flex flex-wrap gap-1">
                {['Unlimited Templates', 'Advanced Analytics', 'Priority Support', 'Ad-Free'].map((feature) => (
                  <div key={feature} className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                    <Star className="w-3 h-3" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Hook to check feature access
 */
export const useFeatureAccess = (feature: keyof FeatureAccess) => {
  const { user } = useAuthStore();
  return hasFeatureAccess(user, feature);
};

/**
 * Simple feature check component
 */
interface FeatureCheckProps {
  feature: keyof FeatureAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureCheck: React.FC<FeatureCheckProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const hasAccess = useFeatureAccess(feature);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default FeatureGate;