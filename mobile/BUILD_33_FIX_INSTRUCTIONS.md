# Build 33 - Native OAuth Module Fix Instructions

## ⚠️ Critical Issue in Build 32
Build 32 was built from the wrong Xcode workspace and is missing critical native OAuth modules:
- ❌ `expo-apple-authentication` - Causes Apple Sign In to fail
- ❌ `expo-web-browser` - Causes Google Sign In to fail  
- ❌ `expo-crypto` - Required for PKCE security

## ✅ Solution: Build from Correct Workspace

### Option 1: EAS Build (Recommended)
Run from the `mobile` directory:

```bash
# Ensure you're in the mobile directory
cd mobile

# Login to your Expo account
eas login

# Build for iOS (will handle all native dependencies automatically)
eas build --platform ios --profile preview
```

### Option 2: Local macOS Build
If building locally on macOS:

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install/verify dependencies
npm install
npx expo install expo-apple-authentication expo-web-browser expo-crypto expo-auth-session expo-secure-store

# 3. Clean and regenerate iOS project
npx expo prebuild --clean --platform ios

# 4. Install CocoaPods
cd ios
pod install

# 5. Open in Xcode
open MyTrainPro.xcworkspace

# 6. Build and Archive from Xcode
# Select "MyTrainPro" scheme
# Product > Archive
```

## 🔍 Verification Checklist

Before building, verify in Xcode:

### 1. Capabilities Tab
- ✅ Sign in with Apple enabled
- ✅ Associated Domains configured (if needed)

### 2. Info.plist
- ✅ URL Scheme: `mytrainpro`
- ✅ Bundle ID matches Apple Developer account

### 3. Pods Directory
After `pod install`, verify these pods exist:
- ✅ `EXAppleAuthentication`
- ✅ `EXWebBrowser`
- ✅ `ExpoCrypto`
- ✅ `ExpoSecureStore`
- ✅ `EXAuthSession`

### 4. Build Settings
- ✅ iOS Deployment Target: 15.1 or higher
- ✅ Code Signing configured

## 🚀 Expected Results in Build 33

After proper build:
1. ✅ Apple Sign In button opens native Apple authentication
2. ✅ Google Sign In button opens browser OAuth flow
3. ✅ Both return to app with session tokens
4. ✅ WebView loads with authenticated session

## 📱 Testing Steps

1. Install Build 33 on device
2. Tap "Sign in with Apple"
   - Should show native Apple Sign In dialog
   - Complete authentication
   - Should return to app logged in
3. Tap "Sign in with Google"  
   - Should open browser
   - Complete Google login
   - Should redirect back to app
4. Verify WebView shows logged-in state

## ⚠️ Important Notes

- **DO NOT** build from old `ios/App` directory (Capacitor)
- **ALWAYS** build from `mobile/ios/MyTrainPro.xcworkspace`
- **VERIFY** pods are installed before archiving
- **TEST** on real device, not just simulator

## 🔧 Troubleshooting

If OAuth still fails in Build 33:
1. Check device logs in Xcode Console
2. Verify all environment secrets are set
3. Confirm backend URL is accessible
4. Check Apple Developer portal configuration

## 📦 Build Output

Build 33 should include:
- Properly linked native OAuth modules
- Correct URL scheme configuration
- Apple Sign In capability
- All required pods embedded

This will fix the "undefined is not a function" and "authorization failed" errors from Build 32.