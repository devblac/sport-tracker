import React from 'react';
import { Outlet } from 'react-router-dom';
import { DynamicNavigation } from '@/components/navigation/DynamicNavigation';
import { FeatureDiscoverySystem } from '@/components/navigation/FeatureDiscoverySystem';
import { ToastContainer } from '@/components/ui/Toast';
import { UpdateNotification } from '@/components/offline/UpdateNotification';
import { OfflineIndicator, SyncFAB } from '@/components/offline/OfflineIndicator';
import { SyncNotifications } from '@/components/sync/SyncNotifications';
import { DevTools } from '@/components/DevTools';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { cn } from '@/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { showDevTools } = useSettingsStore();
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
      
      {/* Dynamic Navigation */}
      <DynamicNavigation />
      
      {/* Feature Discovery System */}
      <FeatureDiscoverySystem />
      
      {/* Toast Notifications */}
      <ToastContainer />
      
      {/* Update Notification */}
      <UpdateNotification />
      
      {/* Offline Indicator */}
      <OfflineIndicator position="top" />
      
      {/* Sync Notifications */}
      <SyncNotifications />
      
      {/* Sync FAB */}
      <SyncFAB />
      
      {/* DevTools (controlled by settings) */}
      {showDevTools && <DevTools />}
      
      {/* Bottom safe area */}
      <div className="safe-area-bottom" />
    </div>
  );
};