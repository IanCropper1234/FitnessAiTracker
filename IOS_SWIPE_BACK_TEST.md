# 🧪 iOS Native Swipe-Back Gesture Test Guide

## 📦 Implementation Summary

**Plugin Installed**: `capacitor-plugin-ios-swipe-back` v1.0.3

**Pages with Swipe-Back ENABLED** ✅:
- `/profile` - Profile Settings Page
- `/workout-settings` - Workout Settings Page

**Pages with Swipe-Back DISABLED** ❌:
- `/` (Dashboard) - Has bottom navigation
- `/nutrition` - Has floating menu
- `/training` - Has floating menu  
- All other complex pages

---

## 🧪 How to Test

### Step 1: Deploy to iOS App

On your **MacBook**, navigate to the iOS project:

```bash
cd ~/Desktop/FitnessAiTracker

# Pull latest changes from Replit
git pull origin main

# Sync Capacitor (should already be done, but just in case)
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### Step 2: Build & Run

1. **In Xcode**: Select your device or simulator
2. **Clean Build**: Press `⇧⌘K` (Shift + Command + K)
3. **Build & Run**: Press `⌘R` (Command + R)

### Step 3: Test Swipe-Back Gesture

#### Test on `/profile` page:

1. Launch the app and login
2. Navigate to **Dashboard** (`/`)
3. Tap on **Profile** button (bottom navigation)
4. **Try to swipe from left edge** → Should navigate back to Dashboard
5. **Observe**:
   - ✅ Does the swipe work?
   - ⚠️ Does the entire page (including navigation bar) swipe?
   - ⚠️ Any white screen flashing?
   - ✅ Does it smoothly return to Dashboard?

#### Test on `/workout-settings` page:

1. From Dashboard, navigate to **Training** page
2. Tap on any workout template or settings
3. Navigate to **Workout Settings** page
4. **Try to swipe from left edge** → Should navigate back
5. **Observe the same behaviors as above**

#### Test on other pages (should NOT work):

1. Navigate to **Dashboard**, **Nutrition**, or **Training**
2. **Try to swipe from left edge** → Should NOT trigger swipe-back
3. This is expected behavior to prevent conflicts

---

## 🔍 What to Look For

### ✅ Good Behaviors:
- Smooth swipe animation from left edge
- Successfully navigates back to previous page
- No crashes or freezes
- Gesture feels natural and responsive

### ⚠️ Known Issues to Watch:
- **Entire page swipes** (including navigation bar) - This is a WKWebView limitation, not a bug
- **White screen flashing** - May occur due to SPA routing mismatch
- **Navigation bar sliding with content** - Expected WKWebView behavior
- **Gesture not triggering** - Make sure you swipe from the very left edge

---

## 🐛 Troubleshooting

### Swipe not working at all?
- Check Xcode console for logs starting with `[useSwipeBack]`
- Expected logs:
  ```
  ✅ [useSwipeBack] Swipe back ENABLED
  ```

### Getting errors?
- Look for:
  ```
  [useSwipeBack] IosSwipeBack plugin not available
  [useSwipeBack] Failed to enable: <error>
  ```

### Page not responding correctly?
- Check if you're swiping from the very left edge (within 20px)
- Try increasing swipe distance before releasing

---

## 📊 Test Results Template

Please test and provide feedback:

**Device/Simulator**: ___________  
**iOS Version**: ___________

| Page | Swipe Works? | White Screen? | Navigation Bar Slides? | Overall Experience |
|------|--------------|---------------|------------------------|-------------------|
| `/profile` | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Good ☐ Poor |
| `/workout-settings` | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Yes ☐ No | ☐ Good ☐ Poor |
| `/` (Dashboard) | ☐ Disabled ✅ | N/A | N/A | N/A |

**Additional Notes**:
- 
- 
- 

---

## 🎯 Next Steps Based on Results

### If it works well:
- Consider enabling on more simple pages:
  - `/privacy-policy`
  - `/terms-of-service`
  - `/nutrition-facts`

### If it has issues:
- We can disable it completely by removing `useSwipeBack(true)` from pages
- Or we can adjust the implementation

### If white screens occur:
- We may need to add router state management
- Or disable on affected pages

---

## 🔧 Technical Implementation Details

**Hook Location**: `client/src/hooks/useSwipeBack.ts`

**Usage in Pages**:
```typescript
// In ProfilePage and WorkoutSettings
import { useSwipeBack } from '@/hooks/useSwipeBack';

export function ProfilePage() {
  // Enable native iOS swipe-back gesture
  useSwipeBack(true);
  
  // ... rest of component
}
```

**Plugin Registration**:
```typescript
// Uses Capacitor 7.x registerPlugin API
const IosSwipeBack = registerPlugin<SwipeBackPlugin>('IosSwipeBack');
```

**Cleanup**: Automatically disables swipe-back when component unmounts to prevent conflicts.

---

## 📝 Feedback

After testing, please provide:
1. Does it feel better or worse than the back button?
2. Any white screens or crashes?
3. Should we expand to more pages or remove completely?
