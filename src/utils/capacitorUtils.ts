import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

/**
 * Utility functions for Capacitor integration
 */
export class CapacitorUtils {
  /**
   * Check if the app is running in a native environment
   */
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get the current platform
   */
  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * Initialize Capacitor plugins
   */
  static async initializePlugins(): Promise<void> {
    if (!this.isNative()) {
      console.log('Running in web environment, skipping native plugin initialization');
      return;
    }

    try {
      // Hide splash screen after app is ready
      await SplashScreen.hide();

      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1f2937' });

      console.log('Capacitor plugins initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor plugins:', error);
    }
  }

  /**
   * Get network status
   */
  static async getNetworkStatus() {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: true, connectionType: 'unknown' };
    }
  }

  /**
   * Store data using Capacitor Preferences
   */
  static async setPreference(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Error setting preference:', error);
      // Fallback to localStorage in web environment
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    }
  }

  /**
   * Get data using Capacitor Preferences
   */
  static async getPreference(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error('Error getting preference:', error);
      // Fallback to localStorage in web environment
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
  }

  /**
   * Remove data using Capacitor Preferences
   */
  static async removePreference(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Error removing preference:', error);
      // Fallback to localStorage in web environment
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Listen to network status changes
   */
  static addNetworkListener(callback: (status: { connected: boolean; connectionType: string }) => void) {
    if (!this.isNative()) {
      // Fallback for web environment
      window.addEventListener('online', () => callback({ connected: true, connectionType: 'unknown' }));
      window.addEventListener('offline', () => callback({ connected: false, connectionType: 'none' }));
      return;
    }

    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType
      });
    });
  }
}