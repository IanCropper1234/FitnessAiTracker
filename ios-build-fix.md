# iOS Build Fix for Deep Linking

## Problem
The iOS app doesn't open when clicking the deep link "mytrainpro://auth/callback" even after clicking "Allow" on the iOS prompt. This happens because the URL scheme isn't properly registered in the TestFlight build.

## Solution Steps

### 1. Clean Capacitor Sync
```bash
cd ios/App
rm -rf App/capacitor.config.json
cd ../..
npx cap sync ios
```

### 2. Fix URL Scheme in Xcode

Open `ios/App/App.xcworkspace` in Xcode and:

1. Select your App target
2. Go to **Info** tab
3. Under **URL Types**, ensure you have:
   - **Identifier**: `com.trainpro.app`
   - **URL Schemes**: `mytrainpro`
   - **Role**: Editor

4. Go to **Signing & Capabilities** tab
5. Add **Associated Domains** capability
6. Add these domains:
   - `applinks:mytrainpro.com`
   - `webcredentials:mytrainpro.com`

### 3. Update Info.plist

Ensure `ios/App/App/Info.plist` contains:
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

### 4. Clean Build
1. Product → Clean Build Folder (⇧⌘K)
2. Delete derived data: ~/Library/Developer/Xcode/DerivedData
3. Product → Build

### 5. Test Deep Link
Before uploading to TestFlight, test in simulator:
```bash
xcrun simctl openurl booted mytrainpro://auth/callback?test=1
```

If the app opens, the URL scheme is working.

### 6. Archive and Upload
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload to TestFlight

## Alternative: Universal Links

If custom URL schemes still don't work, use Universal Links:

1. Upload the `apple-app-site-association` file to your server at:
   `https://mytrainpro.com/.well-known/apple-app-site-association`

2. Update it with your Team ID:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.trainpro.app",
        "paths": ["/app/*", "/oauth-success", "/auth/callback/*"]
      }
    ]
  }
}
```

3. In the app, handle Universal Links instead of custom scheme.

## Testing OAuth Flow

After the new build:
1. Open MyTrainPro app
2. Click Google/Apple Sign In
3. Complete authentication
4. On success page, click "Return to MyTrainPro App"
5. The app should open and restore session

If still not working, check device logs in Xcode Console for specific errors.