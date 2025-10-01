import React, { useState } from 'react';
import { Crown, Lock, Star, Zap, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/utils';

interface PremiumAccessGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  showUpgradeModal?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export const PremiumAccessGate: React.FC<PremiumAccessGateProps> = ({
  children,
  feature,
  description,
  showUpgradeModal = true,
  onUpgrade,
  className
}) => {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const hasPremiumAccess = user?.role === 'premium' || user?.role === 'trainer' || user?.role === 'admin';

  if (hasPremiumAccess) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else if (showUpgradeModal) {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className={cn('relative', className)}>
        {/* Blurred content */}
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <div className="p-3 bg-yellow-500 rounded-full w-fit mx-auto">
              <Crown className="w-8 h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Premium Feature
              </h3>
              <p className="text-white/90 text-sm max-w-xs">
                {description || `Unlock ${feature} with a premium subscription`}
              </p>
            </div>
            
            <button
              onClick={handleUpgradeClick}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 font-medium transition-all duration-200 transform hover:scale-105"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    Upgrade to Premium
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Feature highlight */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Unlock {feature}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {description || `Get access to ${feature} and many more premium features`}
                </p>
              </div>

              {/* Premium benefits */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Premium includes:</h4>
                {[
                  'Access to premium trainers',
                  'Exclusive workout programs',
                  'Advanced analytics',
                  'Priority support',
                  'Ad-free experience',
                  'Early access to new features'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-foreground">$9.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cancel anytime • 7-day free trial
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t space-y-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  // In real implementation, navigate to payment page
                  console.log('Navigate to premium upgrade');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 font-medium transition-all duration-200"
              >
                Start Free Trial
              </button>
              
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Premium badge component
interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className={cn(
      'inline-flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full font-bold',
      sizeClasses[size],
      className
    )}>
      <Crown className={iconSizes[size]} />
      <span>PRO</span>
    </span>
  );
};

// Premium feature wrapper
interface PremiumFeatureProps {
  children: React.ReactNode;
  enabled?: boolean;
  fallback?: React.ReactNode;
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  children,
  enabled = false,
  fallback
}) => {
  const { user } = useAuthStore();
  const hasPremiumAccess = user?.role === 'premium' || user?.role === 'trainer' || user?.role === 'admin';

  if (!enabled || !hasPremiumAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};