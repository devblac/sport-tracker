# App Store Assets Guide

This document outlines all assets needed for publishing LiftFire to Google Play Store and Apple App Store.

## App Icons

### Android

**Required sizes:**
- 512x512 px - Play Store listing icon (PNG, 32-bit, no transparency)
- 192x192 px - Adaptive icon foreground (PNG)
- 192x192 px - Adaptive icon background (PNG or solid color)

**Current assets:**
- `assets/icon.png` - 1024x1024 (needs resizing to 512x512)
- `assets/adaptive-icon.png` - 192x192 ✓

**To generate:**
```bash
# Resize icon for Play Store
convert assets/icon.png -resize 512x512 assets/play-store-icon.png
```

### iOS

**Required sizes:**
- 1024x1024 px - App Store icon (PNG, no transparency, no alpha channel)

**Current assets:**
- `assets/icon.png` - 1024x1024 ✓

## Screenshots

### Android (Google Play Store)

**Required:**
- Minimum 2 screenshots
- Maximum 8 screenshots
- Format: PNG or JPEG
- Dimensions: 16:9 or 9:16 aspect ratio
- Recommended: 1080x1920 px (portrait) or 1920x1080 px (landscape)

**Recommended screenshots:**
1. **Login/Signup** - Show authentication screen
2. **Workout List** - Show list of workouts with XP
3. **Workout Detail** - Show exercise details
4. **Create Workout** - Show workout creation form
5. **Profile** - Show XP, level, streaks, achievements
6. **Social Feed** - Show friends' activity
7. **Leaderboard** - Show weekly rankings
8. **Offline Mode** - Show offline indicator and sync

**How to capture:**
```bash
# On Android device/emulator
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Or use Android Studio's screenshot tool
```

### iOS (App Store)

**Required:**
- Minimum 3 screenshots per device size
- Maximum 10 screenshots per device size
- Format: PNG or JPEG
- No alpha channel

**Device sizes required:**
- 6.7" Display (iPhone 14 Pro Max): 1290x2796 px
- 6.5" Display (iPhone 11 Pro Max): 1242x2688 px
- 5.5" Display (iPhone 8 Plus): 1242x2208 px

**Recommended screenshots:** (same as Android)

**How to capture:**
```bash
# In iOS Simulator
# Cmd+S to save screenshot
# Or use Xcode's screenshot tool
```

## Feature Graphic (Android only)

**Required for Play Store:**
- Size: 1024x500 px
- Format: PNG or JPEG
- No transparency

**Content ideas:**
- App logo + tagline: "Track. Compete. Achieve."
- Showcase key features with icons
- Show app on device with key screens
- Use brand colors (#FF6B35 primary)

## App Preview Video (Optional but Recommended)

**Specifications:**
- Length: 15-30 seconds
- Format: MP4 or MOV
- Resolution: 1080p minimum
- Aspect ratio: 16:9 or 9:16

**Content outline:**
1. Open app (0-3s)
2. Create workout (3-8s)
3. View XP and level up (8-13s)
4. Check social feed (13-18s)
5. View leaderboard (18-23s)
6. Show offline sync (23-28s)
7. End with logo/tagline (28-30s)

## App Store Descriptions

### Short Description (80 characters max)

**English:**
```
Track workouts, earn XP, compete with friends. Fitness made fun!
```

**Spanish:**
```
Registra entrenamientos, gana XP, compite con amigos. ¡Fitness divertido!
```

### Full Description

**English (4000 characters max):**
```
LiftFire - Your Fitness Journey, Gamified

Transform your fitness routine into an exciting adventure! LiftFire combines workout tracking with gaming elements to keep you motivated and engaged.

🏋️ WORKOUT TRACKING
• Log exercises with sets, reps, and weight
• Track workout duration and notes
• View your complete workout history
• Works offline - sync when you're back online

🎮 GAMIFICATION
• Earn XP for every workout completed
• Level up as you progress
• Maintain workout streaks for bonus XP
• Unlock achievements for milestones
• Compete on weekly leaderboards

👥 SOCIAL FEATURES
• Connect with friends
• See friends' recent workouts
• Like and encourage each other
• Compare progress on leaderboards
• Stay motivated together

📱 OFFLINE FIRST
• Create workouts without internet
• Automatic sync when online
• Never lose your progress
• Works anywhere, anytime

✨ KEY FEATURES
• Simple, intuitive interface
• Fast and responsive
• Secure authentication
• Privacy-focused design
• Cross-platform (Web, Android, iOS)

🎯 PERFECT FOR
• Gym enthusiasts
• Home workout fans
• Fitness beginners
• Competitive athletes
• Anyone wanting to stay motivated

💪 START YOUR JOURNEY
Download LiftFire today and turn your fitness goals into achievements!

Privacy Policy: [your-privacy-policy-url]
Terms of Service: [your-terms-url]
```

**Spanish:**
```
LiftFire - Tu Viaje de Fitness, Gamificado

¡Transforma tu rutina de fitness en una aventura emocionante! LiftFire combina el seguimiento de entrenamientos con elementos de juego para mantenerte motivado.

[Similar structure in Spanish...]
```

### Keywords (100 characters max)

**English:**
```
fitness,workout,gym,exercise,tracking,gamification,xp,level,streak,social,friends,leaderboard
```

## Privacy Policy

**Required for both stores.**

Create a privacy policy that covers:
- What data you collect (email, workout data, profile info)
- How you use the data (app functionality, analytics)
- How you protect the data (encryption, Supabase security)
- User rights (access, deletion, export)
- Third-party services (Supabase, analytics)
- Contact information

**Host at:** `https://your-domain.com/privacy-policy`

## Terms of Service

**Required for both stores.**

Create terms of service that cover:
- Acceptable use policy
- User responsibilities
- Content ownership
- Liability limitations
- Termination conditions
- Dispute resolution

**Host at:** `https://your-domain.com/terms-of-service`

## Content Rating

### Google Play Store

Complete the content rating questionnaire:
- Violence: None
- Sexual content: None
- Profanity: None
- Controlled substances: None
- Gambling: None
- User interaction: Yes (social features)
- Personal information: Yes (email, profile)
- Location: No

Expected rating: **Everyone** or **Teen**

### Apple App Store

Select appropriate age rating:
- Infrequent/Mild Cartoon or Fantasy Violence: No
- Infrequent/Mild Realistic Violence: No
- Infrequent/Mild Sexual Content: No
- Infrequent/Mild Profanity: No
- Infrequent/Mild Alcohol/Tobacco: No
- Unrestricted Web Access: No
- Gambling: No

Expected rating: **4+** or **9+**

## App Store Listing Checklist

### Google Play Store
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (2-8, 1080x1920)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App category (Health & Fitness)
- [ ] Content rating completed
- [ ] Privacy policy URL
- [ ] Contact email
- [ ] APK/AAB uploaded

### Apple App Store
- [ ] App icon (1024x1024)
- [ ] Screenshots (3-10 per device size)
- [ ] App preview video (optional)
- [ ] App name
- [ ] Subtitle (30 chars)
- [ ] Description (4000 chars)
- [ ] Keywords (100 chars)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy policy URL
- [ ] App category (Health & Fitness)
- [ ] Age rating completed
- [ ] Build uploaded

## Asset Generation Tools

### Recommended tools:
- **Figma** - Design screenshots and graphics
- **Canva** - Create feature graphics
- **Sketch** - Design app icons
- **Adobe Photoshop** - Edit images
- **ImageMagick** - Batch resize images

### Automated tools:
```bash
# Install ImageMagick
brew install imagemagick  # Mac
apt-get install imagemagick  # Linux

# Resize icon for Play Store
convert assets/icon.png -resize 512x512 play-store-icon.png

# Create feature graphic template
convert -size 1024x500 xc:white -fill "#FF6B35" -draw "rectangle 0,0 1024,500" feature-graphic-base.png
```

## Brand Guidelines

**Colors:**
- Primary: #FF6B35 (Orange)
- Secondary: #004E89 (Blue)
- Accent: #F7B801 (Yellow)
- Background: #FFFFFF (White)
- Text: #1A1A1A (Dark Gray)

**Typography:**
- Headings: Bold, sans-serif
- Body: Regular, sans-serif
- Monospace: For stats/numbers

**Tone:**
- Energetic and motivating
- Friendly and approachable
- Clear and concise
- Positive and encouraging

## Timeline

**Week 1:**
- [ ] Design and create app icons
- [ ] Capture screenshots on all devices
- [ ] Write app descriptions
- [ ] Create feature graphic

**Week 2:**
- [ ] Create privacy policy and terms
- [ ] Complete content rating questionnaires
- [ ] Review all assets
- [ ] Get feedback from team

**Week 3:**
- [ ] Upload to Play Store (draft)
- [ ] Upload to App Store (draft)
- [ ] Test store listings
- [ ] Make final adjustments

**Week 4:**
- [ ] Submit for review
- [ ] Monitor review status
- [ ] Address any issues
- [ ] Publish!

---

**Last Updated**: 2025-11-05
