# Build 33 - Complete Authentication Fix

## 🚨 Critical Issues in Build 32

All authentication methods are broken:
1. ❌ Apple Sign In - Missing native module
2. ❌ Google Sign In - Missing native module  
3. ❌ Email/Password - WebView loads homepage instead of login page

## 🔧 Immediate Fix Required

### Step 1: Fix Email/Password Login (Quick Fix)

Edit `mobile/App.js` line 130:
```javascript
// BEFORE:
const serverUrl = "https://mytrainpro.com";

// AFTER (for login screen):
const serverUrl = "https://mytrainpro.com/login";
```

OR better yet, make it conditional:

```javascript
const serverUrl = session ? "https://mytrainpro.com" : "https://mytrainpro.com/login";
```

### Step 2: Build 33 with Native OAuth Fix

Run these commands in Replit Shell:

```bash
cd mobile

# 1. Update build number to 33 (already done)
grep buildNumber app.json

# 2. Ensure all OAuth modules installed
npm install --save \
  expo-apple-authentication@~7.2.4 \
  expo-web-browser@~14.2.0 \
  expo-crypto@~14.1.5 \
  expo-auth-session@~6.2.1 \
  expo-secure-store@~14.2.4

# 3. Clean and prebuild
rm -rf ios android .expo
npx expo prebuild --clear-cache --platform ios

# 4. Build with EAS
eas build --platform ios --profile production
```

## ✅ What Build 33 Will Fix

### Native OAuth (Google & Apple)
- ✅ `expo-apple-authentication` linked → Apple Sign In works
- ✅ `expo-web-browser` linked → Google Sign In works
- ✅ `expo-crypto` linked → PKCE security works

### Email/Password Login
- ✅ WebView loads `/login` page when not authenticated
- ✅ Users can enter email and password
- ✅ After login, WebView loads main app

## 📱 Expected User Flow in Build 33

### Initial Screen
```
MyTrainPro
AI-Powered Fitness Coaching

[Continue with Google]     <- Works ✅
[Sign in with Apple]       <- Works ✅
        OR
[Continue with Email]      <- Opens login page ✅
```

### When "Continue with Email" is clicked:
- WebView loads https://mytrainpro.com/login
- User sees email/password form
- After login, redirects to main app

## 🚀 EAS Build Command (Complete)

```bash
# Full command with all checks
cd mobile && \
npm list expo-apple-authentication expo-web-browser expo-crypto && \
npx expo prebuild --clear-cache --platform ios && \
eas build --platform ios --profile production
```

## 📋 Pre-Build Verification

```bash
# Check all modules installed
npm list | grep -E "expo-apple-authentication|expo-web-browser|expo-crypto"

# Expected output:
├── expo-apple-authentication@7.2.4
├── expo-auth-session@6.2.1
├── expo-crypto@14.1.5
├── expo-secure-store@14.2.4
└── expo-web-browser@14.2.0
```

## ⏰ Timeline

1. **Now**: Start EAS Build (~25 minutes)
2. **While waiting**: Can test email/password on web
3. **After build**: Upload to TestFlight
4. **Test all 3 auth methods**

## 🎯 Success Criteria

Build 33 must have:
- ✅ Apple Sign In shows native dialog
- ✅ Google Sign In opens browser OAuth
- ✅ Email button loads login page (not homepage)
- ✅ All methods successfully authenticate
- ✅ Session persists after app restart

## 🔍 Why Build 32 Failed

Build 32 was created from wrong workspace missing:
- Native module pods not linked
- WebView URL not configured for auth flow
- No fallback for broken OAuth

Build 33 fixes all these issues!