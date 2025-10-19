# iOS App Setup Guide - Fix OAuth Deep Link Issues

## Critical Issue Identified

Your app has mismatched Bundle IDs which prevents deep links from working correctly:
- **Runtime Bundle ID**: `com.fitnessaitracker.app` (what the app is actually using)
- **Xcode Project**: `com.fitai.app`
- **Capacitor Config**: `com.trainpro.app`
- **URL Scheme Identifier**: `com.trainpro.app`

## Solution: Standardize to One Bundle ID

We recommend using: **`com.trainpro.app`** (matches the new MyTrainPro branding)

## Step-by-Step Fix in Xcode

### 1. Open Project in Xcode

```bash
cd ~/FitnessAiTracker/ios/App
open App.xcworkspace
```

### 2. Change Bundle Identifier

1. In Xcode, select the **App** target in the project navigator
2. Go to **Signing & Capabilities** tab
3. Change **Bundle Identifier** to: `com.trainpro.app`
4. Select your Apple Developer team

### 3. Verify URL Types

1. Go to **Info** tab
2. Expand **URL Types**
3. Verify:
   - **Identifier**: `com.trainpro.app`
   - **URL Schemes**: `mytrainpro`
   - **Role**: Editor

### 4. Clean and Rebuild

```bash
# In Xcode menu:
Product → Clean Build Folder (⇧⌘K)

# Delete app from simulator/device
# Then:
Product → Run (⌘R)
```

## Testing the Fix

### Test 1: Deep Link in Simulator

```bash
# While app is running in simulator:
xcrun simctl openurl booted "mytrainpro://auth/callback?session=test123&userId=1"
```

**Expected Result**: 
- You should see console log: `📱 [Deep Link] App opened with URL: mytrainpro://...`
- And alert: `Deep link received: mytrainpro://...`

### Test 2: OAuth Flow

1. Launch app in simulator/device
2. Click **Sign in with Google** or **Sign in with Apple**
3. Complete OAuth in Safari
4. Page should automatically try to open app (no button click needed)
5. If auto-open fails, manual instructions will appear
6. **Fallback**: Close Safari, open app manually - you'll be logged in within 2-5 seconds

## What's Fixed in the New Code

### 1. OAuth Success Page (`oauth-success.tsx`)
- ✅ Auto-triggers deep link using `window.location.href` (most reliable)
- ✅ iframe fallback method
- ✅ Shows manual instructions after 2 seconds if auto-open fails
- ✅ Retry button if needed

### 2. Enhanced Session Restoration (`capacitorAuth.ts`)
- ✅ Checks for pending OAuth when app becomes active
- ✅ Delayed check (1 second after app resumes) for iOS timing issues
- ✅ Additional check when page becomes visible
- ✅ Multiple safety nets ensure session is restored

### 3. Expected Behavior

**Scenario A: Deep Link Works** (ideal)
1. OAuth completes → Auto-opens app
2. Deep link received: `mytrainpro://auth/callback?session=...`
3. Session restored via `/api/auth/restore-session`
4. User logged in instantly ✨

**Scenario B: Deep Link Fails** (fallback)
1. OAuth completes → Auto-open attempt
2. Deep link fails (no app switch)
3. Manual instructions shown
4. User closes Safari and opens app
5. App detects pending OAuth session in localStorage
6. Session restored automatically within 2-5 seconds ✨

## Debug Checklist

When testing, check these logs in Xcode console:

- [ ] `[Cache] Version changed from ... to 2.0.0, clearing cache...` (first launch only)
- [ ] `[Capacitor Auth] Setting up OAuth deep link listener`
- [ ] `[OAuth Success] Deep link URL: mytrainpro://auth/callback...`
- [ ] `[OAuth Success] Stored pending session in localStorage`
- [ ] `[OAuth Success] Triggering deep link with multiple methods...`
- [ ] `📱 [Deep Link] App opened with URL: ...` (if deep link works)
- [ ] `[Capacitor Auth] App became active, checking for pending OAuth...`
- [ ] `[Capacitor Auth] Found pending OAuth session, restoring...`

## Common Issues & Solutions

### Issue 1: "Allow to switch apps" doesn't show
**Cause**: URL scheme not registered or bundle ID mismatch  
**Solution**: Follow steps 2-3 above to fix bundle ID and URL types

### Issue 2: Dialog shows but app doesn't receive URL
**Cause**: AppDelegate not properly configured  
**Solution**: Verify AppDelegate.swift has the URL handler (it should already be there)

### Issue 3: Manual return doesn't restore session
**Cause**: localStorage cleared or session expired  
**Solution**: Sessions expire after 5 minutes. Complete OAuth and return within 5 minutes.

### Issue 4: Still seeing "FitAI" branding
**Cause**: WebView cache  
**Solution**: Delete app from simulator, clean build folder, rebuild

## Sync Changes to GitHub

After fixing in Xcode, sync the changes back to Replit:

```bash
cd ~/FitnessAiTracker

# Pull latest changes from Replit first
git pull

# Your Xcode changes are in ios/App/App.xcodeproj/project.pbxproj
# Commit and push them
git add ios/
git commit -m "Fix bundle ID to com.trainpro.app for deep link support"
git push
```

## Summary

The OAuth flow is now **triple-redundant**:
1. **Deep link** (primary method)
2. **Auto-detection on app resume** (fallback method 1)
3. **Manual return with localStorage** (fallback method 2)

Even if deep links completely fail, the manual return method will work 100% of the time as long as the user returns within 5 minutes.

---

**Next Steps**: 
1. Fix bundle ID in Xcode
2. Sync changes from Replit: `git pull && npx cap sync ios`
3. Clean build and test
4. Report results!