# LiftFire Deployment Guide

This guide covers deploying LiftFire to production for Web, Android, and iOS platforms.

## Prerequisites

Before deploying, ensure you have:

- [ ] Completed all development and testing
- [ ] Set up production Supabase project
- [ ] Created Expo account (free tier available)
- [ ] Installed EAS CLI: `npm install -g eas-cli`
- [ ] Logged into EAS: `eas login`
- [ ] Updated version in `app.json`
- [ ] All tests passing: `npm test`
- [ ] TypeScript checks passing: `npm run type-check`
- [ ] Code linted: `npm run lint`

## Environment Setup

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project for production
3. Run database migrations (see README.md)
4. Get production API keys
5. Deploy Edge Functions (if using)

### 2. Configure EAS Project

```bash
# Initialize EAS project (if not already done)
eas build:configure

# This will:
# - Create eas.json (already exists)
# - Link to your Expo account
# - Generate a project ID
```

Update `app.json` with your EAS project ID:
```json
{
  "extra": {
    "eas": {
      "projectId": "your-actual-project-id"
    }
  }
}
```

### 3. Set Production Secrets

Use EAS Secrets for sensitive production values:

```bash
# Set Supabase credentials
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-prod.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-prod-anon-key"

# Set environment
eas secret:create --scope project --name EXPO_PUBLIC_ENVIRONMENT --value "production"

# Optional: Set analytics keys
eas secret:create --scope project --name EXPO_PUBLIC_ANALYTICS_ID --value "your-analytics-id"
```

View all secrets:
```bash
eas secret:list
```

## Web Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Build web version**:
```bash
npx expo export:web
```

3. **Deploy to Vercel**:
```bash
cd dist
vercel --prod
```

4. **Configure custom domain** (optional):
- Go to Vercel dashboard
- Add custom domain
- Update DNS records

### Option 2: Netlify

1. **Build web version**:
```bash
npx expo export:web
```

2. **Deploy via Netlify CLI**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Or drag and drop `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

### Option 3: Cloudflare Pages

1. **Build web version**:
```bash
npx expo export:web
```

2. **Deploy via Wrangler**:
```bash
npm install -g wrangler
wrangler pages deploy dist
```

### Web Deployment Checklist

- [ ] Build completes without errors
- [ ] Test build locally: `npx serve dist`
- [ ] Verify environment variables are set
- [ ] Test authentication flow
- [ ] Test offline functionality
- [ ] Check browser console for errors
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Verify mobile responsiveness
- [ ] Check PWA functionality
- [ ] Test all features work in production

## Android Deployment

### 1. Prepare for Build

Update version in `app.json`:
```json
{
  "version": "1.0.0",
  "android": {
    "versionCode": 1
  }
}
```

### 2. Build APK (for testing)

```bash
# Build APK for internal testing
eas build --platform android --profile preview

# Wait for build to complete (10-20 minutes)
# Download APK from build URL
```

### 3. Build AAB (for Play Store)

```bash
# Build Android App Bundle for production
eas build --platform android --profile production

# Wait for build to complete
# Download AAB from build URL
```

### 4. Test APK on Device

```bash
# Install APK on connected device
adb install path/to/your-app.apk

# Or scan QR code from EAS build page
```

### 5. Submit to Google Play Store

#### Manual Submission

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in app details:
   - App name: LiftFire
   - Description: (see play-store-assets/full-description-en.txt)
   - Screenshots: (see play-store-assets/)
   - Category: Health & Fitness
4. Upload AAB file
5. Complete content rating questionnaire
6. Set pricing (Free)
7. Submit for review

#### Automated Submission (requires setup)

```bash
# Configure Google Service Account
# 1. Create service account in Google Cloud Console
# 2. Download JSON key
# 3. Save as google-service-account.json

# Submit to Play Store
eas submit --platform android --profile production
```

### Android Deployment Checklist

- [ ] Version code incremented
- [ ] Build completes successfully
- [ ] APK tested on physical device
- [ ] All features work in production build
- [ ] Offline sync works correctly
- [ ] Authentication works
- [ ] No crashes or errors
- [ ] App icons and splash screen correct
- [ ] Permissions requested properly
- [ ] Back button behavior correct
- [ ] Deep linking works
- [ ] Play Store listing complete
- [ ] Screenshots uploaded
- [ ] Privacy policy linked

## iOS Deployment (Mac only)

### 1. Prerequisites

- Mac computer with Xcode installed
- Apple Developer account ($99/year)
- App Store Connect access

### 2. Configure iOS Build

Update `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.liftfire.app",
    "buildNumber": "1"
  }
}
```

### 3. Build for iOS

```bash
# Build for iOS
eas build --platform ios --profile production

# Wait for build to complete (15-30 minutes)
```

### 4. Test on Simulator

```bash
# Build for simulator
eas build --platform ios --profile preview

# Download and install in simulator
```

### 5. Submit to App Store

#### Manual Submission

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in app details
4. Upload build (via Xcode or Transporter)
5. Submit for review

#### Automated Submission

```bash
# Configure in eas.json (see submit.production.ios)
eas submit --platform ios --profile production
```

### iOS Deployment Checklist

- [ ] Build number incremented
- [ ] Build completes successfully
- [ ] Tested on simulator
- [ ] Tested on physical device
- [ ] All features work
- [ ] No crashes
- [ ] App icons correct
- [ ] Launch screen correct
- [ ] Permissions requested properly
- [ ] App Store listing complete
- [ ] Screenshots uploaded (required sizes)
- [ ] Privacy policy linked
- [ ] Export compliance completed

## Post-Deployment

### 1. Monitor for Issues

- Check error tracking (Sentry, etc.)
- Monitor Supabase logs
- Watch for user reports
- Check app store reviews

### 2. Update Documentation

- Update README with production URLs
- Document any deployment issues
- Update version numbers
- Tag release in Git

### 3. Announce Release

- Notify team
- Update project status
- Share with stakeholders
- Post on social media (if applicable)

## Rollback Procedure

If issues are found in production:

### Web Rollback

```bash
# Revert to previous deployment
vercel rollback  # or netlify rollback
```

### Mobile Rollback

1. **Immediate**: Remove app from stores temporarily
2. **Quick fix**: Build and submit hotfix version
3. **OTA Update**: Use Expo Updates for JavaScript-only fixes

```bash
# Publish OTA update
eas update --branch production --message "Hotfix: description"
```

## Troubleshooting

### Build Fails

- Check EAS build logs
- Verify all dependencies are compatible
- Check for TypeScript errors
- Ensure secrets are set correctly

### App Crashes on Launch

- Check native logs (Xcode/Android Studio)
- Verify environment variables
- Test Supabase connection
- Check for missing permissions

### Features Don't Work

- Verify production Supabase is configured
- Check RLS policies are enabled
- Test API endpoints manually
- Check network requests in DevTools

### Submission Rejected

- Read rejection reason carefully
- Fix issues mentioned
- Update screenshots/description if needed
- Resubmit with changes

## Continuous Deployment (Optional)

Set up automated deployments with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx expo export:web
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --non-interactive --no-wait
```

## Support

For deployment issues:
- Check [Expo documentation](https://docs.expo.dev)
- Check [EAS Build documentation](https://docs.expo.dev/build/introduction/)
- Check [Supabase documentation](https://supabase.com/docs)
- Contact support if needed

---

**Last Updated**: 2025-11-05
