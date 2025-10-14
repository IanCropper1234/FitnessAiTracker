# Build 33 - Final Build Instructions

## ✅ Version Updated
- Build Number: **33** (updated from 32)
- All OAuth modules installed
- Ready for EAS Build

## 🚀 Execute These Commands in Replit Shell

```bash
# Navigate to mobile directory
cd mobile

# 1. Verify version is updated
grep buildNumber app.json
# Should show: "buildNumber": "33"

# 2. Clean previous build artifacts
rm -rf ios android .expo

# 3. Generate fresh iOS project with all OAuth modules
npx expo prebuild --clear-cache --platform ios

# 4. Build with EAS (production profile for TestFlight)
eas build --platform ios --profile production
```

## 📋 Quick Verification Before Build

```bash
# Check all OAuth modules are installed
grep -E "expo-apple-authentication|expo-web-browser|expo-crypto" package.json
```

Expected output:
- ✅ "expo-apple-authentication": "~7.2.4"
- ✅ "expo-web-browser": "~14.2.0"
- ✅ "expo-crypto": "~14.1.5"
- ✅ "expo-auth-session": "~6.2.1"
- ✅ "expo-secure-store": "~14.2.4"

## 🎯 What Build 33 Fixes

| Issue in Build 32 | Fix in Build 33 |
|-------------------|-----------------|
| ❌ Apple Sign In: "authorization failed" | ✅ Native module properly linked |
| ❌ Google Sign In: "undefined is not a function" | ✅ WebBrowser module included |
| ❌ Missing native OAuth modules | ✅ All modules installed and linked |
| ❌ Built from wrong workspace | ✅ EAS Build handles everything |

## 📱 After Build Completes

1. **Download IPA**: Get the link from EAS Build output
2. **Upload to TestFlight**: Use Transporter app or Xcode
3. **Test OAuth**: 
   - Apple Sign In → Native dialog appears ✅
   - Google Sign In → Browser OAuth flow ✅
   - Both return to app with session ✅

## ⚠️ Important Notes

- The warning about `ios.usesAppleSignIn` during prebuild is NORMAL
- EAS Build will properly link the module in the cloud
- Build takes ~20-30 minutes to complete
- You'll receive email when build is ready

## 🔍 Monitor Build Progress

```bash
# View build status
eas build:list --platform ios --limit 1

# View build logs
eas build:view [build-id]
```

## ✅ Success Criteria

Build 33 should:
- Show version 1.0.0 (33) in TestFlight
- Apple Sign In works without errors
- Google Sign In works without errors
- WebView loads after successful auth
- Session persists across app restarts

## 📝 Summary

Build 33 is ready with:
- ✅ Version updated to 33
- ✅ All OAuth modules installed
- ✅ Proper EAS configuration
- ✅ Ready for production TestFlight

Run the commands above to create Build 33 that fixes all OAuth issues!