import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trophy, 
  Users, 
  ShoppingBag, 
  Target,
  Crown,
  Star,
  ChevronRight,
  X,
  Gift
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/utils';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  isPremium?: boolean;
  isNew?: boolean;
  benefits: string[];
  requiredRole?: string[];
}

const features: Feature[] = [
  {
    id: 'challenges',
    name: 'Challenges',
    description: 'Compete with friends in fitness challenges and earn rewards',
    icon: Trophy,
    path: '/challenges',
    isNew: true,
    requiredRole: ['basic', 'premium', 'trainer', 'admin'],
    benefits: [
      'Compete with gym friends',
      'Earn XP and achievements',
      'Track progress in real-time',
      'Join group competitions'
    ]
  },
  {
    id: 'social',
    name: 'Social Feed',
    description: 'Share workouts and connect with the fitness community',
    icon: Users,
    path: '/social',
    requiredRole: ['basic', 'premium', 'trainer', 'admin'],
    benefits: [
      'Share workout achievements',
      'Follow friends\' progress',
      'Get motivation from community',
      'Celebrate milestones together'
    ]
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Access premium content and personal trainers',
    icon: ShoppingBag,
    path: '/marketplace',
    isPremium: true,
    requiredRole: ['premium', 'trainer', 'admin'],
    benefits: [
      'Premium workout programs',
      'Personal trainer sessions',
      'Exclusive content library',
      'Advanced analytics'
    ]
  }
];

interface FeatureDiscoverySystemProps {
  onFeatureUnlocked?: (featureId: string) => void;
}

export const FeatureDiscoverySystem: React.FC<FeatureDiscoverySystemProps> = ({
  onFeatureUnlocked
}) => {
  const { user } = useAuthStore();
  const [discoveredFeatures, setDiscoveredFeatures] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);
  const [showFeatureUnlock, setShowFeatureUnlock] = useState<string | null>(null);

  // Load discovered features from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('discovered-features');
    if (stored) {
      setDiscoveredFeatures(new Set(JSON.parse(stored)));
    }
  }, []);

  // Check if user should see onboarding
  useEffect(() => {
    if (user && discoveredFeatures.size === 0) {
      const hasSeenOnboarding = localStorage.getItem('has-seen-feature-onboarding');
      if (!hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, [user, discoveredFeatures.size]);

  // Save discovered features
  const saveDiscoveredFeatures = (features: Set<string>) => {
    localStorage.setItem('discovered-features', JSON.stringify(Array.from(features)));
  };

  // Get available features for user
  const getAvailableFeatures = (): Feature[] => {
    if (!user) return [];
    
    return features.filter(feature => {
      if (!feature.requiredRole) return true;
      return feature.requiredRole.includes(user.role);
    });
  };

  // Handle feature unlock
  const unlockFeature = (featureId: string) => {
    const newDiscovered = new Set(discoveredFeatures);
    newDiscovered.add(featureId);
    setDiscoveredFeatures(newDiscovered);
    saveDiscoveredFeatures(newDiscovered);
    
    setShowFeatureUnlock(featureId);
    setTimeout(() => setShowFeatureUnlock(null), 3000);
    
    if (onFeatureUnlocked) {
      onFeatureUnlocked(featureId);
    }
  };

  // Handle onboarding completion
  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('has-seen-feature-onboarding', 'true');
    
    // Unlock all available features
    const availableFeatures = getAvailableFeatures();
    const newDiscovered = new Set(discoveredFeatures);
    availableFeatures.forEach(feature => newDiscovered.add(feature.id));
    setDiscoveredFeatures(newDiscovered);
    saveDiscoveredFeatures(newDiscovered);
  };

  // Get undiscovered features
  const getUndiscoveredFeatures = (): Feature[] => {
    return getAvailableFeatures().filter(feature => 
      !discoveredFeatures.has(feature.id)
    );
  };

  const availableFeatures = getAvailableFeatures();
  const undiscoveredFeatures = getUndiscoveredFeatures();
  const currentFeature = availableFeatures[currentOnboardingStep];

  return (
    <>
      {/* Feature Unlock Notification */}
      {showFeatureUnlock && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-4 shadow-lg animate-slide-down">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Feature Unlocked!</h4>
                <p className="text-sm opacity-90">
                  {features.find(f => f.id === showFeatureUnlock)?.name} is now available
                </p>
              </div>
              <Gift className="w-6 h-6 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && currentFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Discover Features
                </h2>
                <button
                  onClick={completeOnboarding}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feature Icon */}
              <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                <currentFeature.icon className="w-8 h-8 text-primary" />
              </div>
              
              {/* Feature Info */}
              <div>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {currentFeature.name}
                  </h3>
                  {currentFeature.isPremium && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                  {currentFeature.isNew && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  {currentFeature.description}
                </p>
              </div>
              
              {/* Benefits */}
              <div className="text-left space-y-2">
                <h4 className="font-semibold text-foreground text-center">Benefits:</h4>
                {currentFeature.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              
              {/* Premium Notice */}
              {currentFeature.isPremium && user?.role !== 'premium' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">Premium Feature</span>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Upgrade to premium to unlock this feature
                  </p>
                </div>
              )}
              
              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex space-x-1">
                  {availableFeatures.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentOnboardingStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  {currentOnboardingStep > 0 && (
                    <button
                      onClick={() => setCurrentOnboardingStep(currentOnboardingStep - 1)}
                      className="px-3 py-2 text-muted-foreground hover:text-foreground"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (currentOnboardingStep < availableFeatures.length - 1) {
                        setCurrentOnboardingStep(currentOnboardingStep + 1);
                      } else {
                        completeOnboarding();
                      }
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center space-x-2"
                  >
                    <span>
                      {currentOnboardingStep < availableFeatures.length - 1 ? 'Next' : 'Get Started'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Feature Hints */}
      {undiscoveredFeatures.length > 0 && !showOnboarding && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowOnboarding(true)}
            className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-all duration-200 animate-pulse"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
};