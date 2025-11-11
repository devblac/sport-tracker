# Android Build & Play Store Submission Guide

## Prerequisites

Before building for Android, ensure you have:

1. **Expo Account** - Sign up at https://expo.dev
2. **EAS CLI** - Install globally: `npm install -g eas-cli`
3. **Google Play Console Account** - https://play.google.com/console
4. **Production Environment Variables** - Configured in `.env.production`

## Step 1: Configure EAS Project

### 1.1 Login to EAS
```bash
eas login
```

### 1.2 Configure Project
Update `app.json` with your Expo username and project ID:
```json
{
  "expo": {
    "owner": "your-expo-username",
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### 1.3 Initialize EAS Build (if not done)
```bash
eas build:configure
```

## Step 2: Prepare for Production Build

### 2.1 Update Version Numbers
In `app.json`:
- `version`: "1.0.0" (user-facing version)
- `android.versionCode`: 1 (increment for each release)

### 2.2 Verify Environment Variables
Check `.env.production` has:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### 2.3 Verify Assets
Ensure these files exist:
- `./assets/icon.png` (1024x1024px)
- `./assets/adaptive-icon.png` (1024x1024px)
- `./assets/splash-icon.png` (1284x2778px)

## Step 3: Build Android App Bundle (AAB)

### 3.1 Build for Production
```bash
eas build --platform android --profile production
```

This will:
- Build an Android App Bundle (.aab)
- Use production environment variables
- Auto-increment version code
- Upload to EAS servers

### 3.2 Monitor Build Progress
- Build progress shown in terminal
- View detailed logs at: https://expo.dev/accounts/[username]/projects/liftfire/builds

### 3.3 Download AAB
Once complete, download the `.aab` file from:
- EAS dashboard
- Or use: `eas build:download --platform android --profile production`

## Step 4: Test Build (Optional but Recommended)

### 4.1 Build APK for Testing
```bash
eas build --platform android --profile preview
```

### 4.2 Install APK on Device
```bash
# Download APK
eas build:download --platform android --profile preview

# Install via ADB
adb install path/to/app.apk
```

### 4.3 Test Checklist
- [ ] App launches successfully
- [ ] Authentication works (sign up/login)
- [ ] Workout creation and editing
- [ ] Offline mode works
- [ ] Social features load
- [ ] No crashes or errors

## Step 5: Prepare Play Store Listing

### 5.1 Create App in Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **LiftFire**
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free
   - Declarations: Accept terms

### 5.2 Store Listing Content

**App name**: LiftFire - Fitness Tracker

**Short description** (80 chars max):
Track workouts, earn XP, compete with friends. Gamified fitness tracking.

**Full description** (4000 chars max):
```
LiftFire is a simple yet powerful fitness tracking app that makes working out fun through gamification and social features.

🏋️ WORKOUT TRACKING
• Log exercises with sets, reps, and weight
• Track workout duration and notes
• Offline support - works without internet
• Automatic sync when back online

🎮 GAMIFICATION
• Earn XP for every workout
• Level up as you progress
• Maintain daily streaks
• Unlock achievements
• Compete on weekly leaderboards

👥 SOCIAL FEATURES
• Connect with friends
• See recent workout activity
• Like and encourage friends
• Weekly leaderboard competition

✨ KEY FEATURES
• Simple, intuitive interface
• Works offline with automatic sync
• Cross-platform (Android, iOS, Web)
• Secure authentication
• Privacy-focused design
• Free to use

📊 TRACK YOUR PROGRESS
• View workout history
• Monitor XP and level progress
• Track streak consistency
• See achievement progress

🔒 PRIVACY & SECURITY
• Your data is encrypted
• Control who sees your profile
• Optional social features
• GDPR compliant

Perfect for fitness enthusiasts who want a simple, fast app to track workouts and stay motivated through friendly competition!
```

### 5.3 Graphics Assets

Required assets for Play Store:

**App icon** (512x512px, PNG, 32-bit):
- Upload your icon.png

**Feature graphic** (1024x500px, JPG or PNG):
- Create a banner with app name and tagline

**Screenshots** (minimum 2, up to 8):
- Phone: 16:9 or 9:16 ratio
- Recommended: 1080x1920px or 1080x2340px
- Show: Login, Workout list, Workout detail, Social feed, Profile

**Optional**:
- Promo video (YouTube link)
- TV banner (1280x720px)
- Wear OS screenshots

### 5.4 Categorization
- **App category**: Health & Fitness
- **Tags**: fitness, workout, tracking, gamification, social
- **Content rating**: Everyone
- **Target audience**: Ages 13+

## Step 6: Upload to Play Console

### 6.1 Create Release
1. Go to "Production" in Play Console
2. Click "Create new release"
3. Upload the `.aab` file
4. Add release notes:

```
Initial release of LiftFire!

Features:
• Workout tracking with offline support
• XP, levels, and achievements
• Social features and leaderboards
• Simple, fast, and secure

Thank you for trying LiftFire!
```

### 6.2 Complete Content Rating
1. Go to "Content rating"
2. Fill out questionnaire
3. Submit for rating

### 6.3 Set Up Pricing & Distribution
1. Go to "Pricing & distribution"
2. Select countries (or "All countries")
3. Confirm free app
4. Accept content guidelines

### 6.4 Privacy Policy
Add privacy policy URL:
- Host on your website or GitHub Pages
- Include data collection practices
- GDPR compliance information

### 6.5 Data Safety
Declare what data you collect:
- **Location**: No
- **Personal info**: Email, username
- **Financial info**: No
- **Health & fitness**: Workout data
- **Messages**: No
- **Photos & videos**: Optional (profile pictures)
- **Files & docs**: No
- **Calendar**: No
- **Contacts**: No
- **App activity**: Workout logs
- **Web browsing**: No
- **App info & performance**: Crash logs
- **Device or other IDs**: No

## Step 7: Submit for Review

### 7.1 Review Checklist
- [ ] Store listing complete
- [ ] Screenshots uploaded
- [ ] Content rating received
- [ ] Pricing & distribution set
- [ ] Privacy policy added
- [ ] Data safety declared
- [ ] App bundle uploaded
- [ ] Release notes added

### 7.2 Submit
1. Click "Review release"
2. Verify all information
3. Click "Start rollout to Production"

### 7.3 Review Timeline
- Initial review: 1-7 days
- Updates: Usually faster (1-3 days)
- You'll receive email notifications

## Step 8: Post-Submission

### 8.1 Monitor Release
- Check Play Console for review status
- Respond to any review feedback
- Monitor crash reports and ANRs

### 8.2 Staged Rollout (Recommended)
- Start with 20% of users
- Monitor for issues
- Gradually increase to 100%

### 8.3 Update Process
For future updates:
1. Increment `android.versionCode` in app.json
2. Update `version` if needed (e.g., 1.0.0 → 1.1.0)
3. Run `eas build --platform android --profile production`
4. Upload new AAB to Play Console
5. Add release notes
6. Submit for review

## Troubleshooting

### Build Fails
- Check EAS build logs
- Verify all dependencies installed
- Ensure environment variables set
- Check for TypeScript errors

### Upload Rejected
- Verify package name matches (com.liftfire.app)
- Check version code is incremented
- Ensure signing key is consistent

### Review Rejected
- Address specific feedback from Google
- Update store listing or app as needed
- Resubmit with changes

## Useful Commands

```bash
# Check EAS account
eas whoami

# View build history
eas build:list --platform android

# Download latest build
eas build:download --platform android --profile production

# View build logs
eas build:view [build-id]

# Cancel running build
eas build:cancel

# Submit to Play Store (automated)
eas submit --platform android --profile production
```

## Cost Considerations

- **EAS Build**: Free tier includes limited builds/month
- **Google Play Console**: One-time $25 registration fee
- **Paid EAS**: $29/month for unlimited builds (optional)

## Next Steps

After successful Play Store submission:
1. Share app link with beta testers
2. Gather user feedback
3. Monitor analytics and crash reports
4. Plan feature updates
5. Respond to user reviews

## Support

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Expo Forums**: https://forums.expo.dev/

Good luck with your launch! 🚀
