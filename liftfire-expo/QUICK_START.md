# Quick Start Guide

## 🚀 Start the Development Server

```bash
cd liftfire-expo
npm start
```

## 🌐 What You Should See

### In Terminal
After running `npm start`, you'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

### Press `w` for Web
When you press `w`, it will:
1. Open your default browser
2. Navigate to `http://localhost:8081`
3. Show the LiftFire MVP app

## ✅ What You Should See in Browser

A white screen with centered text:
```
Welcome to LiftFire MVP
Fitness Tracking Simplified
```

The page should have:
- White background
- Centered content
- Bold title text (24px)
- Gray subtitle text (16px)
- Responsive layout

## 🎨 Visual Preview

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│     Welcome to LiftFire MVP         │
│   Fitness Tracking Simplified       │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

## 🔧 If Nothing Shows Up

### 1. Check Terminal for Errors
Look for any error messages in the terminal where you ran `npm start`.

### 2. Check Browser Console
Open browser DevTools (F12) and check the Console tab for errors.

### 3. Verify Port
Make sure port 8081 is not in use:
```bash
# Kill any process on port 8081
npx kill-port 8081

# Then restart
npm start
```

### 4. Clear Cache
```bash
# Clear Expo cache
npx expo start --clear

# Or
npm start -- --clear
```

### 5. Reinstall Dependencies
```bash
rm -rf node_modules
npm install
npm start
```

## 📱 Test on Mobile

### Android (with Expo Go app)
1. Install Expo Go from Play Store
2. Scan the QR code in terminal
3. App will load on your phone

### iOS (with Camera app)
1. Open Camera app
2. Scan the QR code in terminal
3. Tap the notification to open in Expo Go

## 🎯 Expected Behavior

### Hot Reload
When you edit `app/index.tsx`:
1. Save the file
2. Browser automatically refreshes
3. Changes appear instantly

### Example: Change the Title
Edit `liftfire-expo/app/index.tsx`:
```tsx
<Text style={styles.title}>Hello from LiftFire! 🏋️</Text>
```

Save and watch it update in the browser!

## 🐛 Common Issues

### Issue: "Cannot find module 'expo-router'"
**Solution**: 
```bash
npm install
```

### Issue: "Port 8081 already in use"
**Solution**:
```bash
npx kill-port 8081
npm start
```

### Issue: White screen with no text
**Solution**: Check browser console for errors. Likely a JavaScript error.

### Issue: "Unable to resolve module"
**Solution**:
```bash
npm start -- --clear
```

## ✨ Next Steps

Once you see the app running:

1. **Explore the code**:
   - `app/index.tsx` - Home screen
   - `app/_layout.tsx` - Navigation layout
   - `types/index.ts` - TypeScript types

2. **Make changes**:
   - Edit the title text
   - Change colors in styles
   - Add more components

3. **Continue with Task 2**:
   - Set up Supabase database
   - Create migrations
   - Add authentication

## 📊 Performance

Expected metrics:
- **Initial load**: 2-3 seconds
- **Hot reload**: < 1 second
- **Bundle size**: ~2-3 MB (dev mode)

## 🎉 Success!

If you see "Welcome to LiftFire MVP" in your browser, **Task 1 is complete and working!** 🎊

---

**Need Help?** Check the main README.md or open an issue.
