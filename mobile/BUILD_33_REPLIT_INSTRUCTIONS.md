# Build 33 - Complete EAS Build Instructions for Replit

## ✅ Yes! You can use Option 1 (EAS Build) on Replit!

EAS Build is perfect for Replit since it builds in the cloud and doesn't require macOS.

## 🚀 Complete Build Steps (Run in Replit Shell)

```bash
# Navigate to mobile directory
cd mobile

# 1. Ensure all OAuth modules are installed
npx expo install expo-apple-authentication expo-web-browser expo-crypto expo-auth-session expo-secure-store

# 2. Clean previous build artifacts
rm -rf ios android .expo

# 3. Generate fresh iOS project with all modules linked
npx expo prebuild --clear-cache --platform ios

# 4. Build with EAS (includes all native modules)
eas build --platform ios --profile production
```

## 📋 Pre-Build Checklist

Before running `eas build`, verify:

### 1. Check package.json has all modules:
```bash
grep -E "expo-apple-authentication|expo-web-browser|expo-crypto" package.json
```

Expected output:
- "expo-apple-authentication": "~7.2.4" ✅
- "expo-web-browser": "~14.2.0" ✅  
- "expo-crypto": "~14.1.5" ✅
- "expo-auth-session": "~6.2.1" ✅
- "expo-secure-store": "~14.2.4" ✅

### 2. Verify app.json configuration:
```bash
grep -A2 "usesAppleSignIn\|googleClientId" app.json
```

Should show:
- "usesAppleSignIn": true
- Google Client IDs in extra section

## 🔍 What EAS Build Does

EAS Build handles everything automatically:
1. ✅ Installs all npm packages
2. ✅ Runs prebuild to generate native code
3. ✅ Links all native modules (expo-apple-authentication, etc.)
4. ✅ Configures capabilities (Sign in with Apple)
5. ✅ Sets up code signing
6. ✅ Builds the IPA file

## ⚠️ Important: After Prebuild Warning

If you see this warning:
```
» ios: ios.usesAppleSignIn: Install expo-apple-authentication to enable this feature
```

This is OK! The warning appears during prebuild, but EAS Build will properly install and link the module during the cloud build process.

## 📱 Build Output

After successful build:
- You'll get a link to download the .ipa file
- Example: https://expo.dev/artifacts/eas/[build-id].ipa
- This can be uploaded to TestFlight

## 🧪 Testing Build 33

1. Download the .ipa from EAS Build link
2. Upload to TestFlight via:
   - Transporter app (recommended)
   - Xcode Organizer
   - altool command line
3. Test on real device:
   - Apple Sign In should show native dialog ✅
   - Google Sign In should open browser ✅
   - Both should return to app with session ✅

## 🔧 Troubleshooting

If OAuth still fails after Build 33:

### Check EAS Build logs:
```bash
eas build:list --platform ios --limit 1
eas build:view [build-id]
```

### Verify in build logs:
- Look for "Installing pods"
- Check for "EXAppleAuthentication"
- Check for "EXWebBrowser"
- Check for "ExpoCrypto"

### Common issues:
1. **Module not linked** → Run `npx expo prebuild --clear-cache`
2. **Old cache** → Delete `.expo` directory
3. **Wrong profile** → Use `production` profile for TestFlight

## 🎯 Expected Result

Build 33 from EAS will:
- ✅ Include all native OAuth modules
- ✅ Fix "undefined is not a function" error
- ✅ Fix "authorization failed" error
- ✅ Enable native Apple/Google sign in

## 📝 Summary

Yes, you should absolutely use Option 1 (EAS Build) on Replit! It's the recommended approach since:
- No macOS required
- Handles all native module linking automatically
- Manages code signing and provisioning
- Produces ready-to-upload IPA files

Just make sure to run the complete steps above, especially installing the OAuth modules before running `eas build`.