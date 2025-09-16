/**
 * Build Configuration for Mobile App Packaging
 * 
 * This file documents the build process and provides configuration
 * for different build environments and targets.
 */

export const buildConfig = {
  // Environment configurations
  environments: {
    development: {
      mode: 'development',
      sourcemap: true,
      minify: false,
      livereload: true,
      host: '0.0.0.0',
      port: 5173
    },
    production: {
      mode: 'production',
      sourcemap: false,
      minify: true,
      livereload: false,
      optimize: true
    }
  },

  // Mobile build targets
  targets: {
    web: {
      outDir: 'dist',
      format: 'es',
      platform: 'browser'
    },
    android: {
      platform: 'android',
      minSdkVersion: 24,
      targetSdkVersion: 34,
      compileSdkVersion: 34
    }
  },

  // Build optimization settings
  optimization: {
    splitChunks: true,
    treeshaking: true,
    compression: 'gzip',
    bundleAnalysis: true
  },

  // Capacitor integration settings
  capacitor: {
    webDir: 'dist',
    bundledWebRuntime: false,
    plugins: [
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
      '@capacitor/network',
      '@capacitor/preferences'
    ]
  },

  // Build scripts mapping
  scripts: {
    // Development workflow
    'dev': 'Start web development server',
    'dev:mobile': 'Start mobile development server with device access',
    'mobile:dev': 'Start development with live reload on device',
    
    // Build workflow
    'build': 'Standard web build',
    'build:production': 'Optimized production build',
    'build:mobile': 'Build PWA and sync to Capacitor',
    'build:mobile:production': 'Production build and sync',
    
    // Mobile specific
    'android:run': 'Build and run on Android',
    'android:run:dev': 'Build and run with live reload',
    'android:build:debug': 'Build debug APK',
    'android:build:release': 'Build signed release APK',
    
    // Maintenance
    'clean': 'Clean all build artifacts',
    'clean:full': 'Full clean including node_modules'
  },

  // File paths and directories
  paths: {
    src: 'src',
    dist: 'dist',
    android: 'android',
    assets: 'src/assets',
    public: 'public',
    scripts: 'scripts'
  }
};

export default buildConfig;