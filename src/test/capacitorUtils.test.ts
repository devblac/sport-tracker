import { describe, it, expect, vi } from 'vitest';
import { CapacitorUtils } from '@/utils/capacitorUtils';

// Mock Capacitor modules
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web')
  }
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn()
  }
}));

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn(),
    setBackgroundColor: vi.fn()
  },
  Style: {
    Dark: 'DARK'
  }
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(() => ({ value: 'test-value' })),
    remove: vi.fn()
  }
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(() => ({ connected: true, connectionType: 'wifi' })),
    addListener: vi.fn()
  }
}));

describe('CapacitorUtils', () => {
  it('should detect web platform correctly', () => {
    expect(CapacitorUtils.isNative()).toBe(false);
    expect(CapacitorUtils.getPlatform()).toBe('web');
  });

  it('should initialize plugins in web environment', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await CapacitorUtils.initializePlugins();
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Running in web environment, skipping native plugin initialization'
    );
    
    consoleSpy.mockRestore();
  });

  it('should get network status', async () => {
    const status = await CapacitorUtils.getNetworkStatus();
    
    expect(status).toEqual({
      connected: true,
      connectionType: 'wifi'
    });
  });

  it('should handle preferences with localStorage fallback', async () => {
    // Mock localStorage
    const localStorageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(() => 'fallback-value'),
      removeItem: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    await CapacitorUtils.setPreference('test-key', 'test-value');
    const value = await CapacitorUtils.getPreference('test-key');
    await CapacitorUtils.removePreference('test-key');

    // In web environment, should fall back to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    expect(value).toBe('test-value'); // From Preferences mock
  });

  it('should add network listeners with web fallback', () => {
    const callback = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    CapacitorUtils.addNetworkListener(callback);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
  });
});