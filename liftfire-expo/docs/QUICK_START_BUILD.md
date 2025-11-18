# Quick Start: Build Android App

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev
2. Sign up for free
3. Then run `eas login`

## Step 3: Configure Your Project

Update these values in `app.json`:

```json
{
  "expo": {
    "owner": "your-expo-username",  // ← Your Expo username
    "extra": {
      "eas": {
        "projectId": "your-project-id"  // ← Will be generated
      }
    }
  }
}
```

## Step 4: Initialize EAS (First Time Only)

```bash
eas build:configure
```

This will:
- Create/update `eas.json`
- Link your project to EAS
- Generate a project ID

## Step 5: Build APK for Testing (Recommended First)

```bash
eas build --platform android --profile preview
```

This creates an APK you can install directly on your phone to test.

**Wait time**: 10-20 minutes

Once complete:
1. Download the APK from the link provided
2. Transfer to your Android device
3. Install and test thoroughly

## Step 6: Build AAB for Play Store

After testing the APK, build the production version:

```bash
eas build --platform android --profile production
```

This creates an Android App Bundle (.aab) for the Play Store.

**Wait time**: 10-20 minutes

Once complete:
1. Download the .aab file
2. Upload to Google Play Console

## Step 7: Submit to Play Store

### Option A: Manual Upload
1. Go to https://play.google.com/console
2. Create your app listing
3. Upload the .aab file
4. Fill in store details
5. Submit for review

### Option B: Automated Submit (After Manual Setup)
```bash
eas submit --platform android --profile production
```

## Quick Reference

```bash
# Check if logged in
eas whoami

# View build status
eas build:list

# Download latest build
eas build:download --platform android

# Cancel a build
eas build:cancel
```

## What You Need Before Building

✅ **Expo account** (free)
✅ **EAS CLI installed** (`npm install -g eas-cli`)
✅ **Production environment variables** (`.env.production`)
✅ **App assets** (icon, splash screen)

## What You Need for Play Store

✅ **Google Play Console account** ($25 one-time fee)
✅ **App screenshots** (at least 2)
✅ **Feature graphic** (1024x500px)
✅ **Privacy policy** (URL)
✅ **Store listing text** (description, etc.)

## Costs

- **EAS Build Free Tier**: Limited builds per month
- **EAS Build Paid**: $29/month for unlimited builds
- **Google Play Console**: $25 one-time registration

## Timeline

- **First build**: ~20 minutes
- **Subsequent builds**: ~10-15 minutes
- **Play Store review**: 1-7 days (first submission)
- **Updates**: 1-3 days typically

## Need Help?

See `ANDROID_BUILD_GUIDE.md` for detailed instructions.

## Common Issues

**"eas: command not found"**
→ Run: `npm install -g eas-cli`

**"Not logged in"**
→ Run: `eas login`

**"Project not configured"**
→ Run: `eas build:configure`

**Build fails**
→ Check build logs in terminal or at expo.dev

Ready to build? Start with Step 1! 🚀
