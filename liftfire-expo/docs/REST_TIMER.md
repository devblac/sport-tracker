# Rest Timer Feature

## Overview
The Rest Timer helps users track rest periods between sets during workouts. It provides haptic feedback, visual countdown, and quick time adjustments.

## Features
- **Countdown Display**: Large, color-coded timer (green → orange → red)
- **Haptic Feedback**: Vibration at 10, 5, 3, 2, 1 seconds remaining
- **Quick Adjustments**: +15s, +30s, +1m, -15s buttons
- **Preset Durations**: 30s, 1m, 1.5m, 2m, 3m
- **Play/Pause/Reset**: Full timer control

## Usage

### In Workout Form
After entering exercise details, tap "Start Rest Timer" to begin countdown.

### Timer Controls
- **Play/Pause**: Center button
- **Reset**: Left button (resets to selected duration)
- **+15s**: Right button (adds 15 seconds)
- **Quick Adjust**: -15s, +30s, +1m buttons below controls
- **Presets**: Tap any preset to change duration

## Technical Details

### Dependencies
- `expo-haptics`: Haptic feedback
- `expo-av`: Audio notifications (future)

### Component
- **Location**: `components/RestTimer.tsx`
- **Props**:
  - `visible`: boolean - Show/hide modal
  - `onClose`: () => void - Close callback
  - `defaultDuration`: number - Initial duration in seconds (default: 90)

### Integration
```tsx
import { RestTimer } from './components/RestTimer';

const [showTimer, setShowTimer] = useState(false);

<RestTimer
  visible={showTimer}
  onClose={() => setShowTimer(false)}
  defaultDuration={90}
/>
```

## Future Enhancements
- Persist timer state across app backgrounding
- Custom sound notifications
- User-configurable default duration
- Timer history/analytics
