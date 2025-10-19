# iOS OAuth Authentication Fix

## Current Issue
After OAuth authentication completes successfully, the deep link (`mytrainpro://auth/callback`) is triggered and iOS shows the "Allow to switch apps" prompt, but the app doesn't receive or process the deep link correctly, resulting in users staying on the auth page instead of being logged in.

## Root Causes
1. **Deep Link Handler Not Triggered**: The `appUrlOpen` event listener in Capacitor may not be firing when the app is already open
2. **Session Cookie Isolation**: Safari and the app WebView have separate cookie stores, so the session created in Safari isn't accessible to the app
3. **Missing URL Scheme Handler**: The iOS native code may not be properly handling the custom URL scheme

## Solution Implemented

### 1. Enhanced Deep Link Handler (capacitorAuth.ts)
- Added debug alerts to verify if deep links are being received
- Added `App.getLaunchUrl()` to handle URLs when app launches from closed state
- Added manual fallback with pending session checking
- Added visual feedback for debugging

### 2. Manual Fallback Mechanism
When deep links fail, users can:
1. Close the OAuth success browser tab
2. Return to the MyTrainPro app manually
3. The app will automatically detect the pending OAuth session and complete login

### 3. Testing Steps
After deploying these changes:

1. **Test Deep Link Reception**:
   - Complete OAuth flow
   - Click "Open MyTrainPro App" 
   - You should see an alert: "Deep link received: mytrainpro://auth/callback..."
   - If no alert appears, the deep link handler isn't working

2. **Test Manual Return**:
   - Complete OAuth flow
   - Instead of clicking the button, just close Safari
   - Open MyTrainPro app manually
   - The app should automatically log you in within 2-5 seconds

## Required iOS Native Fix

If deep links still don't work, you need to rebuild the iOS app with these fixes:

### 1. Verify AppDelegate.swift
```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    // Handle deep links when app is already running
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    // Handle deep links for iOS 13+
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
```

### 2. Verify Info.plist
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>mytrainpro</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.trainpro.app</string>
    </dict>
</array>
```

### 3. Clean Build Process
```bash
# 1. Clean and sync Capacitor
cd ios/App
rm -rf DerivedData
npx cap sync ios

# 2. Open in Xcode
open App.xcworkspace

# 3. In Xcode:
# - Product → Clean Build Folder (⇧⌘K)
# - Delete app from simulator/device
# - Product → Build
# - Test deep link in simulator:
xcrun simctl openurl booted mytrainpro://auth/callback?test=1

# 4. If working, archive and upload to TestFlight
```

## Alternative: Web-Based Session Check

If native deep links cannot be fixed, implement a web-based solution:

1. **OAuth Success Page**: Save session to localStorage with timestamp
2. **Auth Page**: Check for pending session every 2 seconds for 10 seconds
3. **Auto-Login**: If pending session found, restore it automatically

This approach works because localStorage is shared within the WebView, even if cookies aren't.

## Debug Checklist

- [ ] Deep link alert appears when clicking "Open MyTrainPro App"
- [ ] Session is saved to localStorage on OAuth success page
- [ ] Auth page checks for pending session on visibility change
- [ ] Manual return (close browser, open app) works within 5 minutes
- [ ] URL scheme is registered in Xcode (Identifier: com.trainpro.app, Scheme: mytrainpro)
- [ ] AppDelegate.swift has proper Capacitor imports and handlers
- [ ] Info.plist has CFBundleURLTypes configuration
- [ ] Test with `xcrun simctl openurl booted mytrainpro://test` works

## Summary

The OAuth flow is working correctly (authentication succeeds), but the deep link handling is broken. The solution provides:
1. Debug alerts to identify if deep links are received
2. Multiple fallback mechanisms for session restoration
3. Manual return option that works even without deep links

For a permanent fix, the iOS app needs to be rebuilt with proper deep link handling in the native code.