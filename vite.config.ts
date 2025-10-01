import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3000000, // 3MB limit for mobile
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
              networkTimeoutSeconds: 10,
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                    // Remove auth tokens from cache keys for security
                    const url = new URL(request.url);
                    url.searchParams.delete('apikey');
                    return url.href;
                  },
                }
              ],
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100, // Reduced for mobile
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
        ],
      },
      manifest: {
        name: 'FitTracker Pro - Smart Fitness Companion',
        short_name: 'FitTracker',
        description: 'Your intelligent fitness companion with gamification, social features, and premium content marketplace',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['health', 'fitness', 'lifestyle'],
        screenshots: [
          {
            src: '/screenshots/workout-player.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Workout Player - Track your sets and reps in real-time'
          },
          {
            src: '/screenshots/dashboard.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Dashboard - Monitor your progress and streaks'
          }
        ],
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Start Workout',
            short_name: 'Workout',
            description: 'Start a new workout session',
            url: '/workout',
            icons: [{ src: '/icons/shortcut-workout.png', sizes: '96x96' }]
          },
          {
            name: 'View Progress',
            short_name: 'Progress',
            description: 'Check your fitness progress',
            url: '/progress',
            icons: [{ src: '/icons/shortcut-progress.png', sizes: '96x96' }]
          }
        ]
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    cssMinify: 'lightningcss',
    reportCompressedSize: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks(id) {
          // Vendor chunks - optimized for mobile loading performance
          if (id.includes('node_modules')) {
            // Critical path - keep as small as possible
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            
            // Essential routing - loaded early
            if (id.includes('react-router')) {
              return 'react-router';
            }
            
            // State management - critical for app functionality
            if (id.includes('zustand') || id.includes('zod')) {
              return 'state-utils';
            }
            
            // Mobile-specific libraries
            if (id.includes('@capacitor/')) {
              return 'capacitor';
            }
            
            // Backend integration - can be lazy loaded
            if (id.includes('@supabase/')) {
              return 'supabase';
            }
            
            // UI libraries - split by usage frequency
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('framer-motion')) {
              return 'animations';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-primitives';
            }
            
            // Heavy libraries - lazy load
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts';
            }
            
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('immer')) {
              return 'utils';
            }
            
            // PWA and service worker
            if (id.includes('workbox') || id.includes('vite-plugin-pwa')) {
              return 'pwa';
            }
            
            // Other vendor libraries - keep small
            return 'vendor';
          }
          
          // Feature-based chunks for lazy-loaded routes - mobile optimized
          if (id.includes('/pages/')) {
            if (id.includes('Workout') || id.includes('Exercise')) {
              return 'workout-pages';
            }
            if (id.includes('Social') || id.includes('Profile') || id.includes('Friends')) {
              return 'social-pages';
            }
            if (id.includes('Progress') || id.includes('Analytics')) {
              return 'analytics-pages';
            }
            if (id.includes('Settings') || id.includes('Auth')) {
              return 'settings-pages';
            }
            if (id.includes('Test') || id.includes('Dev')) {
              return 'dev-pages';
            }
          }
          
          // Component chunks - optimized for mobile
          if (id.includes('/components/')) {
            if (id.includes('workouts/')) {
              return 'workout-components';
            }
            if (id.includes('social/')) {
              return 'social-components';
            }
            if (id.includes('gamification/')) {
              return 'gamification-components';
            }
            if (id.includes('ui/') && !id.includes('ui/charts')) {
              return 'ui-components';
            }
            if (id.includes('ui/charts') || id.includes('analytics/')) {
              return 'chart-components';
            }
          }
          
          // Service chunks
          if (id.includes('/services/')) {
            return 'services';
          }
          
          // Hooks and utilities
          if (id.includes('/hooks/') || id.includes('/utils/')) {
            return 'app-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    headers: {
      // Security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    headers: {
      // Security headers for preview
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
    },
  },
});