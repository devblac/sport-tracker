import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh optimizations
      plugins: [
        // Add React compiler optimizations in development
        ...(process.env.NODE_ENV === 'development' ? [] : [])
      ]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Fitness Gamificada PWA',
        short_name: 'FitnessApp',
        description: 'App de fitness gamificada con funcionalidades sociales offline-first',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.fitness-app\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    }),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // State management
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('radix-ui')) {
              return 'ui-vendor';
            }
            // Charts and visualization
            if (id.includes('chart') || id.includes('d3') || id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Date/time libraries
            if (id.includes('date-fns') || id.includes('moment') || id.includes('dayjs')) {
              return 'date-vendor';
            }
            // Other vendor libraries
            return 'vendor';
          }
          
          // App chunks by feature
          if (id.includes('/pages/')) {
            // Group test pages together
            if (id.includes('Test') || id.includes('/dev-test') || id.includes('/test-data')) {
              return 'test-pages';
            }
            // Group workout-related pages
            if (id.includes('Workout') || id.includes('Exercise')) {
              return 'workout-pages';
            }
            // Group social/profile pages
            if (id.includes('Social') || id.includes('Profile') || id.includes('Progress')) {
              return 'user-pages';
            }
            return 'main-pages';
          }
          
          // Component chunks
          if (id.includes('/components/')) {
            // Heavy components
            if (id.includes('charts') || id.includes('visualization')) {
              return 'chart-components';
            }
            // Workout components
            if (id.includes('workout') || id.includes('exercise')) {
              return 'workout-components';
            }
            // UI components
            if (id.includes('/ui/') || id.includes('form') || id.includes('modal')) {
              return 'ui-components';
            }
            return 'components';
          }
          
          // Utils and services
          if (id.includes('/utils/') || id.includes('/services/')) {
            return 'utils-services';
          }
          
          // Stores and hooks
          if (id.includes('/stores/') || id.includes('/hooks/')) {
            return 'state-hooks';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize build performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'lucide-react'
      ],
      exclude: [
        // Exclude heavy dependencies that should be lazy loaded
        'chart.js',
        'recharts',
        'd3'
      ]
    }
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand'
    ]
  },
  // Enable esbuild optimizations
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Optimize for modern browsers
    target: 'esnext'
  }
})
