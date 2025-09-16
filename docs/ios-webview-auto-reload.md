# iOS WebView Auto-Reload Implementation

## Overview

This implementation solves the issue where iOS WebView applications show blank pages after long periods of inactivity. The solution provides automatic reload mechanisms with comprehensive blank page detection and recovery.

## Features Implemented

### 1. Page Visibility API Detection
- **Location**: `client/src/hooks/useVisibilityDetection.ts`
- **Purpose**: Detects when app goes to background/foreground
- **Benefits**: Triggers data refresh when app becomes visible

### 2. Blank Page Detection Mechanism
- **Location**: `mobile/App.js` (injected JavaScript)
- **Detection Methods**:
  - Checks for missing essential DOM elements (#root, [data-reactroot])
  - Verifies presence of visible content
  - Validates proper background styling
  - Uses multiple indicators to avoid false positives

### 3. Automatic Reload Logic
- **Location**: `mobile/App.js` WebViewReloadManager
- **Features**:
  - Maximum retry attempts (3) to prevent infinite loops
  - Multiple reload triggers (background return, inactivity, blank page)
  - Fallback mechanisms (page reload → navigate to origin)
  - Comprehensive logging for debugging

### 4. iOS Lifecycle Integration
- **Location**: `ios/App/App/AppDelegate.swift`
- **Features**:
  - Background duration tracking using UserDefaults
  - Capacitor bridge notifications for WebView
  - Lifecycle state persistence across app launches

### 5. WebView State Monitoring
- **Location**: `mobile/App.js` handleMessage function
- **Features**:
  - Enhanced message handling for auto-reload events
  - Visibility change notifications
  - Session persistence tracking

## Implementation Details

### Auto-Reload Triggers

1. **Background Return**: After 5+ minutes in background
2. **Blank Page Detection**: Every 5 seconds when app is visible
3. **Long Inactivity**: After 30 minutes of no user interaction
4. **Page Show Events**: iOS-specific pageshow events

### Configuration Options

```javascript
// Configurable thresholds
blankPageCheckInterval: 5000,     // 5 seconds
inactivityThreshold: 30 * 60 * 1000, // 30 minutes
maxReloadAttempts: 3,             // Maximum retries
backgroundThreshold: 5 * 60       // 5 minutes
```

## Testing the Implementation

### Manual Testing Steps

1. **Background Test**:
   - Open the app and navigate to any page
   - Put app in background for 6+ minutes
   - Return to app - should detect and refresh if blank

2. **Inactivity Test**:
   - Leave app idle for 30+ minutes
   - System should detect inactivity and check for blank page

3. **Page Show Test**:
   - Force-close and reopen the app
   - System should check for blank page on pageshow event

### Console Monitoring

Look for these log messages to verify functionality:

```
[WebView] Auto-reload manager initialized
[WebView] App returned from background after: {duration} ms
[WebView] Blank page detected during monitoring
[WebView] Auto-reloading due to: {reason} attempt: {number}
[App] Visibility changed: visible/hidden
```

## Architecture Flow

```
iOS App Lifecycle
       ↓
AppDelegate Swift
       ↓
Capacitor Bridge
       ↓
WebView Injected JS
       ↓
WebViewReloadManager
       ↓
React Visibility Hook
       ↓
Data Refresh & Recovery
```

## Error Handling

### Graceful Degradation
- If auto-reload fails, fallback to manual user intervention
- Maximum retry limits prevent infinite reload loops
- Comprehensive error logging for debugging

### Fallback Mechanisms
1. `window.location.reload()` - Primary reload method
2. `window.location.href = origin` - Secondary navigation
3. User notification of reload attempts
4. Manual retry button for persistent errors

## Benefits

1. **Improved User Experience**: No more manual app restarts
2. **Automatic Recovery**: Transparent handling of blank page issues
3. **Data Freshness**: Automatic data refresh when returning from background
4. **Robust Error Handling**: Multiple fallback mechanisms
5. **Configurable Thresholds**: Customizable timing parameters

## Monitoring and Debugging

### Console Logs
All components provide detailed console logging with prefixes:
- `[WebView]` - Mobile WebView events
- `[AppDelegate]` - iOS lifecycle events
- `[App]` - React app visibility events

### Message Types
The system uses structured message passing:
- `VISIBILITY_CHANGE` - App visibility state changes
- `AUTO_RELOAD` - Automatic reload attempts
- `SESSION_PERSIST` - Session data persistence

## Future Enhancements

1. **Analytics Integration**: Track reload frequency and reasons
2. **User Preferences**: Allow users to configure reload thresholds
3. **Network Awareness**: Consider network state in reload decisions
4. **Progressive Recovery**: Implement graduated recovery strategies

## Troubleshooting

### Common Issues

1. **Excessive Reloads**: Check maxReloadAttempts configuration
2. **False Blank Detection**: Adjust blank page detection thresholds
3. **Missing Lifecycle Events**: Verify iOS AppDelegate implementation
4. **Session Loss**: Ensure session persistence is properly implemented

### Debug Mode

Enable detailed logging by setting console log level to 'debug' and monitoring WebView messages in React Native debugger.