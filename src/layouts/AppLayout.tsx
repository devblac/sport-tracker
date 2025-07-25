import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavigation } from '@/components/shared/BottomNavigation';
import { ToastContainer } from '@/components/ui/Toast';
import { DevTools } from '@/components/DevTools';
import { cn } from '@/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={cn(
      'min-h-screen min-h-dvh bg-gray-50 dark:bg-gray-900',
      'flex flex-col transition-colors duration-200'
    )}>
      {/* Status bar safe area */}
      <div className="safe-area-top" />
      
      {/* Main content area */}
      <main className={cn(
        'flex-1 pb-20', // Extra padding for bottom nav
        'overflow-y-auto overscroll-behavior-y-contain'
      )}>
        <div className="container mx-auto max-w-md sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 py-4">
          {children || <Outlet />}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* DevTools (development only) */}
      <DevTools />
      
      {/* Bottom safe area */}
      <div className="safe-area-bottom" />
    </div>
  );
};