import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Dumbbell, 
  Users, 
  User, 
  Trophy,
  ShoppingBag,
  Target,
  Crown,
  Zap,
  Star,
  Award,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ConnectionDot } from '@/components/offline/OfflineIndicator';
import { cn } from '@/utils';
import type { UserRole } from '@/schemas/user';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  isMain?: boolean;
  requiredRole?: UserRole[];
  isNew?: boolean;
  isPremium?: boolean;
  badge?: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    color: 'text-blue-500',
    description: 'Your fitness dashboard'
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    path: '/progress',
    color: 'text-green-500',
    description: 'Track your fitness journey'
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell,
    path: '/workout',
    color: 'text-orange-500',
    isMain: true,
    description: 'Start your workout session'
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: Trophy,
    path: '/challenges',
    color: 'text-yellow-500',
    requiredRole: ['basic', 'premium', 'trainer', 'admin'],
    isNew: true,
    description: 'Compete with friends'
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
    path: '/social',
    color: 'text-purple-500',
    requiredRole: ['basic', 'premium', 'trainer', 'admin'],
    description: 'Connect with gym friends'
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    path: '/marketplace',
    color: 'text-pink-500',
    requiredRole: ['premium', 'trainer', 'admin'],
    isPremium: true,
    badge: 'PRO',
    description: 'Premium content & trainers'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    color: 'text-gray-500',
    description: 'Manage your account'
  },
];

interface DynamicNavigationProps {
  showFeatureDiscovery?: boolean;
  onFeatureDiscovered?: (featureId: string) => void;
}

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  showFeatureDiscovery = true,
  onFeatureDiscovered
}) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [discoveredFeatures, setDiscoveredFeatures] = useState<Set<string>>(new Set());
  const [showDiscoveryHint, setShowDiscoveryHint] = useState(false);

  // Load discovered features from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('discovered-features');
    if (stored) {
      setDiscoveredFeatures(new Set(JSON.parse(stored)));
    }
  }, []);

  // Save discovered features to localStorage
  const saveDiscoveredFeatures = (features: Set<string>) => {
    localStorage.setItem('discovered-features', JSON.stringify(Array.from(features)));
  };

  // Filter navigation items based on user role
  const getVisibleItems = (): NavigationItem[] => {
    if (!user) return navigationItems.filter(item => !item.requiredRole);

    return navigationItems.filter(item => {
      if (!item.requiredRole) return true;
      return item.requiredRole.includes(user.role);
    });
  };

  // Check if user has access to premium features
  const hasPremiumAccess = (): boolean => {
    return user?.role === 'premium' || user?.role === 'trainer' || user?.role === 'admin';
  };

  // Handle feature discovery
  const handleFeatureClick = (item: NavigationItem) => {
    if (showFeatureDiscovery && !discoveredFeatures.has(item.id)) {
      const newDiscovered = new Set(discoveredFeatures);
      newDiscovered.add(item.id);
      setDiscoveredFeatures(newDiscovered);
      saveDiscoveredFeatures(newDiscovered);
      
      if (onFeatureDiscovered) {
        onFeatureDiscovered(item.id);
      }
    }
  };

  // Show discovery hint for new users
  useEffect(() => {
    if (user && discoveredFeatures.size < 3) {
      const timer = setTimeout(() => setShowDiscoveryHint(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, discoveredFeatures.size]);

  const visibleItems = getVisibleItems();
  const newFeatures = visibleItems.filter(item => 
    item.isNew && !discoveredFeatures.has(item.id)
  );

  return (
    <>
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
        'border-t border-gray-200 dark:border-gray-700',
        'shadow-lg'
      )}>
        <div className="flex items-center justify-around px-2 py-2 relative">
          {/* Connection indicator */}
          <ConnectionDot className="absolute top-1 right-1" />
          
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isNewFeature = item.isNew && !discoveredFeatures.has(item.id);
            const isPremiumLocked = item.isPremium && !hasPremiumAccess();
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => handleFeatureClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg relative',
                  'min-w-[60px] transition-all duration-200 btn-mobile',
                  'transform active:scale-95',
                  isPremiumLocked && 'opacity-60',
                  isActive 
                    ? cn('text-primary-600 dark:text-primary-400', item.color)
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 mb-1 transition-transform duration-200',
                    isActive && 'scale-110'
                  )} />
                  
                  {/* New feature indicator */}
                  {isNewFeature && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  
                  {/* Premium lock indicator */}
                  {isPremiumLocked && (
                    <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                  )}
                </div>
                
                <span className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                )}>
                  {item.label}
                </span>
                
                {/* Premium badge */}
                {item.badge && (
                  <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 px-1 py-0.5 bg-yellow-500 text-white text-xs rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className={cn(
                    'absolute -top-0.5 left-1/2 transform -translate-x-1/2',
                    'w-1 h-1 rounded-full',
                    item.color
                  )} />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Feature Discovery Hint */}
      {showDiscoveryHint && newFeatures.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <div className="bg-primary text-primary-foreground rounded-lg p-4 shadow-lg animate-slide-up">
            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">New Features Available!</h4>
                <p className="text-sm opacity-90 mb-3">
                  Discover {newFeatures.length} new feature{newFeatures.length > 1 ? 's' : ''} to enhance your fitness journey.
                </p>
                <div className="space-y-2">
                  {newFeatures.slice(0, 2).map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2 text-sm">
                      <feature.icon className="w-4 h-4" />
                      <span>{feature.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowDiscoveryHint(false)}
                className="text-primary-foreground/70 hover:text-primary-foreground"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Feature Discovery Component for onboarding
interface FeatureDiscoveryProps {
  features: NavigationItem[];
  onComplete: () => void;
}

export const FeatureDiscovery: React.FC<FeatureDiscoveryProps> = ({
  features,
  onComplete
}) => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    } else {
      onComplete();
    }
  };

  const feature = features[currentFeature];
  if (!feature) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto">
            <feature.icon className={cn('w-8 h-8', feature.color)} />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {feature.label}
            </h3>
            <p className="text-muted-foreground">
              {feature.description}
            </p>
          </div>
          
          {feature.isPremium && (
            <div className="flex items-center justify-center space-x-2 text-yellow-600">
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">Premium Feature</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex space-x-1">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentFeature ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
            >
              {currentFeature < features.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};