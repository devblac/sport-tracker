import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sporttracker.fitness',
  appName: 'Sport Tracker - Fitness Gamificada',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://*.supabase.co',
      'https://supabase.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#1f2937',
      androidSplashResourceName: 'splash_screen',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#3b82f6',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1f2937',
      overlaysWebView: false
    },
    Preferences: {
      group: 'SportTrackerPrefs'
    },
    Network: {
      // Network plugin configuration for connectivity monitoring
    }
  },
  android: {
    minWebViewVersion: 60,
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Performance optimizations for WebView
    useLegacyBridge: false,
    mixedContentMode: 'never',
    // Enable hardware acceleration
    hardwareAccelerated: true,
    // Optimize WebView for performance
    webViewSettings: {
      // Enable DOM storage for better PWA support
      domStorageEnabled: true,
      // Enable database storage
      databaseEnabled: true,
      // Optimize caching
      cacheMode: 'LOAD_DEFAULT',
      // Enable JavaScript optimizations
      javaScriptEnabled: true,
      // Optimize rendering
      renderPriority: 'high',
      // Enable zoom controls but disable zoom buttons
      builtInZoomControls: true,
      displayZoomControls: false,
      // Optimize text rendering
      textZoom: 100,
      // Enable safe browsing
      safeBrowsingEnabled: true
    }
  }
};

export default config;
