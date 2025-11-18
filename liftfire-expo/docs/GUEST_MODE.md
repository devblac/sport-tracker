# Guest Mode Feature

## Overview

The LiftFire app now supports **Guest Mode**, allowing users to use the app without creating an account. This provides a frictionless onboarding experience while encouraging users to register for cloud backup and social features.

## How It Works

### Guest User Experience

When users access the app without signing in:

1. **Full Workout Tracking**: Users can create, edit, and delete workouts
2. **Local Storage**: All data is stored locally using SQLite
3. **Gamification**: XP, levels, streaks, and achievements work normally
4. **No Cloud Sync**: Data is not backed up to the cloud
5. **No Social Features**: Cannot add friends, view leaderboards, or like workouts

### Professional Encouragement Banners

The profile screen displays professional, non-intrusive banners that:

#### Overview Tab Banner
- **Icon**: Cloud offline icon (orange)
- **Title**: "Using Guest Mode"
- **Message**: "Your workout data is stored locally on this device. Create an account to securely save your progress to the cloud and access it from any device."
- **Primary CTA**: "Create Account" button (blue)
- **Secondary CTA**: "Already have an account? Sign In" link

#### Settings Tab Banner
- **Icon**: Shield checkmark icon (green)
- **Title**: "Secure Your Data"
- **Message**: "Create an account to enable cloud backup, sync across devices, and unlock social features like competing with friends."
- **Primary CTA**: "Create Account" button (blue)

#### Data & Storage Warning
- **Storage Location**: Shows "Local Only" instead of "Active"
- **Warning Box**: "Your data is only stored on this device. If you uninstall the app or clear data, your progress will be lost."

## UI Changes for Guest Mode

### Hidden Features
- **Edit Profile Button**: Only shown for authenticated users
- **Sign Out Button**: Only shown for authenticated users
- **Social Tab**: Disabled or shows registration prompt (future implementation)

### Modified Features
- **Profile Display**: Shows generic avatar and "Guest" username
- **Sync Status**: Shows "Local Only" instead of "Active"

## Benefits

### For Users
- **Try Before Commit**: Users can test the app without registration
- **Privacy**: No account required for basic features
- **Flexibility**: Can upgrade to full account anytime

### For Product
- **Lower Barrier**: Reduces friction in onboarding
- **Conversion Funnel**: Clear path to registration
- **Data Safety**: Users understand the risks of local-only storage

## Technical Implementation

### Authentication Check
```typescript
const { user, isAuthenticated } = useAuth();

// Show guest banner when not authenticated
{!isAuthenticated && (
  <GuestBanner />
)}
```

### Conditional Rendering
- Edit profile button: `{isAuthenticated && <EditButton />}`
- Sign out button: `{isAuthenticated && <SignOutButton />}`
- Storage status: `{isAuthenticated ? 'Active' : 'Local Only'}`

### Navigation
- Banners link to `/(auth)/signup` and `/(auth)/login`
- Smooth transition from guest to authenticated state

## User Flow

```
Guest User Opens App
    ↓
Uses App (Local Storage)
    ↓
Sees Professional Banner
    ↓
Clicks "Create Account"
    ↓
Signs Up
    ↓
Data Syncs to Cloud
    ↓
Full Features Unlocked
```

## Design Principles

### Professional Tone
- Clear, benefit-focused messaging
- No aggressive sales tactics
- Respectful of user choice

### Visual Design
- Warm, inviting colors (yellow/orange for warning, blue for action)
- Clear hierarchy with icons and typography
- Non-intrusive placement (top of content, not blocking)

### User-Centric
- Explains benefits, not just features
- Highlights data safety concerns
- Provides clear next steps

## Future Enhancements

1. **Social Tab Prompt**: Show registration prompt when guest tries to access social features
2. **Data Migration**: Seamless migration of local data to cloud on registration
3. **Limited Features**: Show "locked" badges on premium features
4. **Progress Reminder**: Periodic reminders about data backup
5. **Export Data**: Allow guests to export their data before uninstalling

## Security Considerations

- Guest data is stored locally only
- No PII collected without registration
- Clear communication about data persistence
- Secure transition to authenticated state

## Metrics to Track

- Guest user conversion rate
- Time to registration
- Banner click-through rate
- Feature usage in guest mode
- Data loss incidents (uninstall without backup)
