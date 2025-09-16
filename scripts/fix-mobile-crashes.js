#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Fixing mobile app crashes...');

// Fix 1: Create a safer main.tsx entry point
const saferMainTsx = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Error handling for the entire app
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Safer app loading
async function loadApp() {
  try {
    const { default: App } = await import('./App.stable');
    
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('✅ App loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load app:', error);
    
    // Show basic error UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = \`
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f3f4f6;
          padding: 1rem;
        ">
          <div style="text-align: center; max-width: 400px;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">💥</div>
            <h1 style="color: #dc2626; margin-bottom: 1rem;">App Failed to Load</h1>
            <p style="color: #6b7280; margin-bottom: 2rem;">
              There was an error loading the application. Please try refreshing the page.
            </p>
            <button 
              onclick="window.location.reload()" 
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                cursor: pointer;
                font-size: 1rem;
              "
            >
              Reload App
            </button>
          </div>
        </div>
      \`;
    }
  }
}

// Load app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadApp);
} else {
  loadApp();
}
`;

// Fix 2: Create a minimal capacitor config
const saferCapacitorConfig = `
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liftfire.gymtracker',
  appName: 'LiftFire - GymTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1f2937',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark'
    }
  }
};

export default config;
`;

// Fix 3: Create polyfills for missing APIs
const polyfills = `
// Polyfills for mobile compatibility

// IndexedDB polyfill check
if (typeof window !== 'undefined' && !window.indexedDB) {
  console.warn('IndexedDB not available, using localStorage fallback');
  // Simple localStorage fallback would go here
}

// Console polyfill for older WebViews
if (typeof console === 'undefined') {
  window.console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    group: () => {},
    groupEnd: () => {},
    time: () => {},
    timeEnd: () => {}
  };
}

// Fetch polyfill check
if (typeof fetch === 'undefined') {
  console.error('Fetch API not available');
}

// Performance API polyfill
if (typeof performance === 'undefined') {
  window.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {},
    getEntriesByType: () => [],
    getEntriesByName: () => []
  };
}

export {};
`;

// Write the fixes
try {
  // Create safer main.tsx
  fs.writeFileSync(path.join(path.dirname(__dirname), 'src/main.safe.tsx'), saferMainTsx);
  console.log('✅ Created safer main.tsx');

  // Create safer capacitor config
  fs.writeFileSync(path.join(path.dirname(__dirname), 'capacitor.config.safe.ts'), saferCapacitorConfig);
  console.log('✅ Created safer capacitor config');

  // Create polyfills
  fs.writeFileSync(path.join(path.dirname(__dirname), 'src/polyfills.ts'), polyfills);
  console.log('✅ Created polyfills');

  // Create a safer vite config for mobile
  const saferViteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015', // Better mobile compatibility
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  define: {
    global: 'globalThis', // Fix for some mobile WebViews
  },
});
`;

  fs.writeFileSync(path.join(path.dirname(__dirname), 'vite.config.mobile.ts'), saferViteConfig);
  console.log('✅ Created mobile-optimized vite config');

  console.log('🎉 Mobile crash fixes applied!');
  console.log('');
  console.log('📱 To build a more stable APK:');
  console.log('1. npm run build -- --config vite.config.mobile.ts');
  console.log('2. npm run cap:sync:android');
  console.log('3. cd android && ./gradlew assembleDebug');

} catch (error) {
  console.error('❌ Failed to apply fixes:', error);
}