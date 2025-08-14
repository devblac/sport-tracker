import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage, logger } from '@/utils';

interface UIState {
  // State
  activeTab: string;
  isOffline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
  toasts: Toast[];
  modals: {
    [key: string]: boolean;
  };
  
  // Actions
  setActiveTab: (tab: string) => void;
  setOfflineStatus: (isOffline: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      activeTab: 'home',
      isOffline: !navigator.onLine,
      syncStatus: 'idle',
      toasts: [],
      modals: {},

      // Actions
      setActiveTab: (tab) => {
        set((state) => ({
          ...state,
          activeTab: tab,
        }));
      },

      setOfflineStatus: (isOffline) => {
        set((state) => ({
          ...state,
          isOffline,
        }));
      },

      setSyncStatus: (status) => {
        set((state) => ({
          ...state,
          syncStatus: status,
        }));
      },

      showToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...toast, id };
        
        set((state) => ({
          ...state,
          toasts: [...state.toasts, newToast],
        }));

        // Auto-dismiss after duration (default: 5000ms)
        if (toast.duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              ...state,
              toasts: state.toasts.filter(t => t.id !== id),
            }));
          }, toast.duration || 5000);
        }
      },

      dismissToast: (id) => {
        set((state) => ({
          ...state,
          toasts: state.toasts.filter(toast => toast.id !== id),
        }));
      },

      openModal: (modalId) => {
        set((state) => ({
          ...state,
          modals: {
            ...state.modals,
            [modalId]: true,
          },
        }));
      },

      closeModal: (modalId) => {
        set((state) => ({
          ...state,
          modals: {
            ...state.modals,
            [modalId]: false,
          },
        }));
      },
    }),
    {
      name: 'sport-tracker-ui-storage',
      storage: {
        getItem: (name) => {
          const value = storage.get(name);
          return Promise.resolve(value);
        },
        setItem: (name, value) => {
          storage.set(name, value);
          return Promise.resolve();
        },
        removeItem: (name) => {
          storage.remove(name);
          return Promise.resolve();
        },
      },
      partialize: (state) => ({
        activeTab: state.activeTab,
        // Don't persist these states
        // isOffline: state.isOffline,
        // syncStatus: state.syncStatus,
        // toasts: state.toasts,
        // modals: state.modals,
      }),
    }
  )
);

// Setup event listeners for online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useUIStore.getState().setOfflineStatus(false);
    // Removed annoying "Back online" toast - sync happens silently
  });

  window.addEventListener('offline', () => {
    useUIStore.getState().setOfflineStatus(true);
    useUIStore.getState().showToast({
      type: 'warning',
      title: 'You are offline',
      message: 'Changes will be saved locally and synced when you reconnect.',
      duration: 5000,
    });
  });
}