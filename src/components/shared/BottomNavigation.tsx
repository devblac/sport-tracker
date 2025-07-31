import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Dumbbell, Users, User } from 'lucide-react';
import { ConnectionDot } from '@/components/offline/OfflineIndicator';
import { cn } from '@/utils';

const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/',
    color: 'text-blue-500',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    path: '/progress',
    color: 'text-green-500',
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell,
    path: '/workout',
    color: 'text-orange-500',
    isMain: true, // Center workout button
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
    path: '/social',
    color: 'text-purple-500',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    color: 'text-gray-500',
  },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
      'border-t border-gray-200 dark:border-gray-700',
      'shadow-lg'
    )}>
      <div className="flex items-center justify-around px-2 py-2 relative">
        {/* Connection indicator */}
        <ConnectionDot className="absolute top-2 right-2" />
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.isMain) {
            // Main workout button with consistent styling
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-2 rounded-lg',
                  'min-w-[60px] transition-all duration-200 btn-mobile',
                  'transform active:scale-95',
                  isActive 
                    ? cn('text-primary-600 dark:text-primary-400', item.color)
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 mb-1 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
                )}>
                  {item.label}
                </span>
                
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
          }
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg',
                'min-w-[60px] transition-all duration-200 btn-mobile',
                'transform active:scale-95',
                isActive 
                  ? cn('text-primary-600 dark:text-primary-400', item.color)
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1 transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
              )}>
                {item.label}
              </span>
              
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
  );
};