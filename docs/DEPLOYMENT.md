# 🚀 Deployment Guide

## Overview

This guide covers the deployment process for Sport Tracker PWA, including build optimization, hosting setup, and production configuration.

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or yarn 1.22.0+)
- **Git**: For version control
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Tools

- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint

## 🏗️ Build Process

### Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in development mode with debugging
npm run dev:debug
```

### Production Build

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run build:analyze
```

### Build Configuration

The build process is configured in `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'zod']
        }
      }
    }
  }
});
```

## 🌐 Hosting Options

### Static Hosting (Recommended)

#### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project directory
   vercel
   ```

2. **Configuration** (`vercel.json`):
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "headers": [
       {
         "source": "/sw.js",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache, no-store, must-revalidate"
           }
         ]
       },
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

#### Netlify

1. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Configuration** (`netlify.toml`):
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   
   [[headers]]
     for = "/sw.js"
     [headers.values]
       Cache-Control = "no-cache, no-store, must-revalidate"
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-XSS-Protection = "1; mode=block"
       X-Content-Type-Options = "nosniff"
   ```

#### GitHub Pages

1. **Setup GitHub Actions** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - name: Checkout
         uses: actions/checkout@v3
       
       - name: Setup Node.js
         uses: actions/setup-node@v3
         with:
           node-version: '18'
           cache: 'npm'
       
       - name: Install dependencies
         run: npm ci
       
       - name: Build
         run: npm run build
       
       - name: Deploy
         uses: peaceiris/actions-gh-pages@v3
         with:
           github_token: ${{ secrets.GITHUB_TOKEN }}
           publish_dir: ./dist
   ```

2. **Configure Base Path** (for GitHub Pages):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: '/sport-tracker/', // Replace with your repo name
     // ... other config
   });
   ```

### Self-Hosted Options

#### Docker Deployment

1. **Dockerfile**:
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   # Production stage
   FROM nginx:alpine
   
   # Copy built app
   COPY --from=builder /app/dist /usr/share/nginx/html
   
   # Copy nginx configuration
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Nginx Configuration** (`nginx.conf`):
   ```nginx
   events {
     worker_connections 1024;
   }
   
   http {
     include /etc/nginx/mime.types;
     default_type application/octet-stream;
     
     gzip on;
     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
     
     server {
       listen 80;
       server_name localhost;
       root /usr/share/nginx/html;
       index index.html;
       
       # Handle client-side routing
       location / {
         try_files $uri $uri/ /index.html;
       }
       
       # Cache static assets
       location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
         expires 1y;
         add_header Cache-Control "public, immutable";
       }
       
       # Service worker should not be cached
       location /sw.js {
         add_header Cache-Control "no-cache, no-store, must-revalidate";
       }
       
       # Security headers
       add_header X-Frame-Options "DENY";
       add_header X-XSS-Protection "1; mode=block";
       add_header X-Content-Type-Options "nosniff";
     }
   }
   ```

3. **Docker Compose** (`docker-compose.yml`):
   ```yaml
   version: '3.8'
   
   services:
     sport-tracker:
       build: .
       ports:
         - "80:80"
       restart: unless-stopped
       environment:
         - NODE_ENV=production
   ```

## ⚙️ Environment Configuration

### Environment Variables

Create environment files for different stages:

#### `.env.development`
```env
VITE_APP_NAME=Sport Tracker (Dev)
VITE_APP_VERSION=1.0.0-dev
VITE_API_BASE_URL=http://localhost:3001
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PUSH_NOTIFICATIONS=false
VITE_LOG_LEVEL=debug
```

#### `.env.production`
```env
VITE_APP_NAME=Sport Tracker
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.sporttracker.com
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_LOG_LEVEL=error
```

#### `.env.staging`
```env
VITE_APP_NAME=Sport Tracker (Staging)
VITE_APP_VERSION=1.0.0-staging
VITE_API_BASE_URL=https://staging-api.sporttracker.com
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_LOG_LEVEL=warn
```

### Build-time Configuration

```typescript
// src/config/index.ts
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Sport Tracker',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  },
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
  },
  logging: {
    level: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
};
```

## 🔒 Security Configuration

### Content Security Policy

Add CSP headers for enhanced security:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://api.sporttracker.com;
  manifest-src 'self';
  worker-src 'self';
">
```

### HTTPS Configuration

Ensure HTTPS is enforced in production:

```typescript
// src/utils/security.ts
export const enforceHTTPS = () => {
  if (import.meta.env.PROD && location.protocol !== 'https:') {
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
};
```

### Service Worker Security

```javascript
// public/sw.js
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Validate request headers
  if (event.request.headers.get('X-Requested-With') !== 'XMLHttpRequest') {
    // Handle accordingly
  }
});
```

## 📊 Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Generate bundle report
npm run build:report
```

### Code Splitting Strategy

```typescript
// Lazy load heavy components
const WorkoutPlayer = lazy(() => import('@/components/workouts/WorkoutPlayer'));
const AnalyticsDashboard = lazy(() => import('@/components/analytics/AnalyticsDashboard'));
const ExerciseDatabase = lazy(() => import('@/components/exercises/ExerciseDatabase'));

// Route-based splitting
const routes = [
  {
    path: '/workout/:id',
    component: lazy(() => import('@/pages/Workout')),
  },
  {
    path: '/analytics',
    component: lazy(() => import('@/pages/Analytics')),
  },
];
```

### Asset Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/
    
    - name: Deploy to staging
      run: |
        # Deploy to staging environment
        echo "Deploying to staging..."

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/
    
    - name: Deploy to production
      run: |
        # Deploy to production environment
        echo "Deploying to production..."
```

## 📱 PWA Configuration

### Web App Manifest

The PWA manifest is automatically generated by Vite PWA plugin:

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Sport Tracker',
    short_name: 'SportTracker',
    description: 'Your personal fitness tracking companion',
    theme_color: '#3b82f6',
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
  }
})
```

### Service Worker Configuration

```javascript
// public/sw.js - Custom service worker logic
const CACHE_NAME = 'sport-tracker-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Cache strategies
const cacheStrategies = {
  static: 'CacheFirst',
  api: 'NetworkFirst',
  images: 'CacheFirst',
  fonts: 'CacheFirst'
};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // Add other critical resources
      ]);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

## 🔍 Monitoring and Analytics

### Error Tracking

```typescript
// src/utils/errorTracking.ts
export const initErrorTracking = () => {
  if (import.meta.env.PROD) {
    // Initialize error tracking service (e.g., Sentry)
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // Send to error tracking service
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Send to error tracking service
    });
  }
};
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const trackPerformance = () => {
  if ('performance' in window) {
    // Track Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
};
```

## 🚨 Troubleshooting

### Common Build Issues

#### Bundle Size Too Large
```bash
# Analyze bundle
npm run build:analyze

# Check for duplicate dependencies
npm ls --depth=0

# Use bundle analyzer
npx vite-bundle-analyzer dist
```

#### Service Worker Issues
```bash
# Clear service worker cache
# In browser DevTools > Application > Storage > Clear storage

# Debug service worker
# DevTools > Application > Service Workers
```

#### TypeScript Errors
```bash
# Type check without emitting
npm run type-check

# Clear TypeScript cache
rm -rf node_modules/.cache/typescript
```

### Performance Issues

#### Slow Build Times
```typescript
// vite.config.ts - Optimize build
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'esbuild', // Faster than terser
  },
  esbuild: {
    target: 'esnext',
  },
});
```

#### Runtime Performance
```typescript
// Enable React DevTools Profiler
if (import.meta.env.DEV) {
  import('@welldone-software/why-did-you-render').then((whyDidYouRender) => {
    whyDidYouRender.default(React, {
      trackAllPureComponents: true,
    });
  });
}
```

## 📋 Deployment Checklist

### Pre-deployment

- [ ] Run all tests (`npm test`)
- [ ] Check TypeScript compilation (`npm run type-check`)
- [ ] Lint code (`npm run lint`)
- [ ] Build successfully (`npm run build`)
- [ ] Test production build locally (`npm run preview`)
- [ ] Check bundle size (`npm run build:analyze`)
- [ ] Verify PWA functionality
- [ ] Test offline capabilities
- [ ] Validate service worker registration

### Post-deployment

- [ ] Verify app loads correctly
- [ ] Test PWA installation
- [ ] Check service worker updates
- [ ] Validate offline functionality
- [ ] Test on different devices/browsers
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify analytics tracking

### Security Checklist

- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Security headers present
- [ ] No sensitive data in client code
- [ ] Service worker security validated
- [ ] API endpoints secured
- [ ] Authentication working correctly

---

*This deployment guide is maintained alongside the application and updated with each release. Last updated: January 2025*