# Pre-Deployment Checklist

Use this checklist before deploying LiftFire to production. Check off each item as you complete it.

## Code Quality

### Testing
- [ ] All unit tests pass: `npm test`
- [ ] Test coverage is adequate: `npm run test:coverage`
- [ ] Manual testing completed on all platforms
- [ ] Edge cases tested (offline, slow network, errors)
- [ ] Authentication flow tested thoroughly
- [ ] Workout CRUD operations tested
- [ ] Social features tested (friends, likes, feed)
- [ ] Gamification tested (XP, levels, streaks, achievements)
- [ ] Offline sync tested and working

### Code Review
- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] No TypeScript `any` types used
- [ ] Linting passes: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments for critical issues
- [ ] All functions < 50 lines
- [ ] Code is well-documented

### Security
- [ ] No secrets in code or version control
- [ ] Environment variables properly configured
- [ ] Using `EXPO_PUBLIC_` prefix for client variables
- [ ] Never using `service_role` key in client
- [ ] RLS policies enabled on all Supabase tables
- [ ] Input validation implemented (Zod schemas)
- [ ] Tokens stored in SecureStore only
- [ ] No sensitive data in logs
- [ ] HTTPS used for all API calls

## Configuration

### Environment Setup
- [ ] Production Supabase project created
- [ ] Database migrations run successfully
- [ ] RLS policies tested and working
- [ ] Edge Functions deployed (if using)
- [ ] Production environment variables set
- [ ] EAS Secrets configured for production
- [ ] Different Supabase projects for dev/staging/prod

### App Configuration
- [ ] `app.json` version updated
- [ ] Android `versionCode` incremented
- [ ] iOS `buildNumber` incremented
- [ ] App name and description updated
- [ ] Bundle identifiers correct
- [ ] App icons configured
- [ ] Splash screen configured
- [ ] Permissions properly requested
- [ ] Deep linking configured

### Build Configuration
- [ ] `eas.json` configured for production
- [ ] Build profiles set up (preview, production)
- [ ] EAS project linked
- [ ] Build secrets configured
- [ ] Auto-increment enabled for production

## Features

### Core Features
- [ ] Authentication works (signup, login, logout)
- [ ] Workout tracking works (create, read, update, delete)
- [ ] Exercise tracking works (sets, reps, weight)
- [ ] Offline mode works (create workouts offline)
- [ ] Sync queue works (syncs when back online)
- [ ] Profile displays correctly (XP, level, streaks)

### Gamification
- [ ] XP calculation correct
- [ ] Level progression works
- [ ] Streak tracking accurate
- [ ] Achievements unlock correctly
- [ ] XP bar displays progress
- [ ] Streak display shows fire icon

### Social Features
- [ ] Friend requests work (send, accept, reject)
- [ ] Friends list displays correctly
- [ ] Activity feed shows friends' workouts
- [ ] Like functionality works
- [ ] Leaderboard displays rankings
- [ ] Leaderboard refreshes correctly

### UI/UX
- [ ] All screens render correctly
- [ ] Navigation works smoothly
- [ ] Loading states display properly
- [ ] Error messages are user-friendly
- [ ] Toast notifications work
- [ ] Pull-to-refresh works
- [ ] Offline indicators display
- [ ] Responsive on different screen sizes

## Platform Testing

### Web
- [ ] Tested on Chrome
- [ ] Tested on Safari
- [ ] Tested on Firefox
- [ ] Tested on mobile browsers
- [ ] PWA functionality works
- [ ] Responsive design works
- [ ] No console errors
- [ ] Performance is acceptable (< 3s load)

### Android
- [ ] Tested on Android emulator
- [ ] Tested on physical device
- [ ] Tested on different Android versions (9+)
- [ ] App icons display correctly
- [ ] Splash screen displays correctly
- [ ] Permissions requested properly
- [ ] Back button behavior correct
- [ ] Deep linking works
- [ ] No crashes
- [ ] Performance is acceptable

### iOS (if applicable)
- [ ] Tested on iOS simulator
- [ ] Tested on physical device
- [ ] Tested on different iOS versions (13+)
- [ ] App icons display correctly
- [ ] Launch screen displays correctly
- [ ] Permissions requested properly
- [ ] Navigation gestures work
- [ ] Deep linking works
- [ ] No crashes
- [ ] Performance is acceptable

## Database

### Supabase Setup
- [ ] Production database created
- [ ] All migrations applied successfully
- [ ] Tables created correctly
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Materialized view created (leaderboard)
- [ ] Functions created (refresh_weekly_leaderboard)
- [ ] Test data cleared (if any)

### Data Integrity
- [ ] Foreign key constraints working
- [ ] Unique constraints working
- [ ] Default values set correctly
- [ ] Timestamps auto-updating
- [ ] Cascading deletes working
- [ ] Data validation working

### Security
- [ ] RLS policies tested with different users
- [ ] Users can only access own data
- [ ] Friends can view each other's public data
- [ ] Leaderboard data is public (read-only)
- [ ] No data leaks between users
- [ ] Service key not exposed

## Documentation

### User Documentation
- [ ] README.md updated
- [ ] Setup instructions complete
- [ ] Supabase setup documented
- [ ] Environment variables documented
- [ ] Troubleshooting section complete
- [ ] Screenshots added (if available)

### Developer Documentation
- [ ] Code comments added where needed
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment guide created
- [ ] Contributing guidelines updated

### Legal
- [ ] Privacy policy created and hosted
- [ ] Terms of service created and hosted
- [ ] Content rating completed
- [ ] App store descriptions written
- [ ] Contact information provided

## App Store Preparation

### Assets
- [ ] App icons created (all sizes)
- [ ] Screenshots captured (all required sizes)
- [ ] Feature graphic created (Android)
- [ ] App preview video created (optional)
- [ ] All assets meet store requirements

### Listings
- [ ] App name finalized
- [ ] Short description written
- [ ] Full description written
- [ ] Keywords selected
- [ ] Category selected (Health & Fitness)
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] Contact email added

### Compliance
- [ ] Content rating completed
- [ ] Age rating selected
- [ ] Export compliance completed (iOS)
- [ ] Data safety form completed (Android)
- [ ] App review information provided

## Build Process

### Pre-Build
- [ ] Run validation script: `node scripts/validate-build.js`
- [ ] All validation checks pass
- [ ] Git repository clean (no uncommitted changes)
- [ ] Version tagged in Git
- [ ] Changelog updated

### Web Build
- [ ] Build completes: `npm run build:web`
- [ ] No build errors
- [ ] Bundle size acceptable (< 5MB)
- [ ] Test build locally: `npx serve dist`
- [ ] All features work in production build

### Android Build
- [ ] Preview build completes: `npm run build:android:preview`
- [ ] APK tested on device
- [ ] Production build completes: `npm run build:android:production`
- [ ] AAB file downloaded
- [ ] Build size acceptable

### iOS Build (if applicable)
- [ ] Preview build completes: `npm run build:ios:preview`
- [ ] Tested on simulator
- [ ] Production build completes: `npm run build:ios:production`
- [ ] IPA file downloaded
- [ ] Build size acceptable

## Deployment

### Web Deployment
- [ ] Hosting platform selected (Vercel/Netlify/Cloudflare)
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] Environment variables set on hosting platform
- [ ] Build deployed successfully
- [ ] Production URL accessible
- [ ] All features work on production URL

### Android Deployment
- [ ] Google Play Console account created
- [ ] App listing created
- [ ] All assets uploaded
- [ ] AAB uploaded
- [ ] Release notes written
- [ ] Submitted for review

### iOS Deployment (if applicable)
- [ ] App Store Connect account created
- [ ] App listing created
- [ ] All assets uploaded
- [ ] Build uploaded
- [ ] Release notes written
- [ ] Submitted for review

## Post-Deployment

### Monitoring
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Analytics set up (if using)
- [ ] Supabase logs monitored
- [ ] App store reviews monitored
- [ ] User feedback channels set up

### Communication
- [ ] Team notified of deployment
- [ ] Stakeholders informed
- [ ] Documentation updated with production URLs
- [ ] Release notes published
- [ ] Social media announcement (if applicable)

### Backup Plan
- [ ] Rollback procedure documented
- [ ] Previous version available for rollback
- [ ] Database backup created
- [ ] Emergency contacts identified

## Final Checks

- [ ] All items in this checklist completed
- [ ] No critical issues outstanding
- [ ] Team approval obtained
- [ ] Ready to deploy to production

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Version**: _______________  
**Notes**: _______________

---

**Last Updated**: 2025-11-05
