import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  StatusBar,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  // Production URL - use the main production domain
  const serverUrl = 'https://fitness-ai-tracker-c0109009.replit.app';

  // Handle loading state
  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError(nativeEvent);
    setIsLoading(false);
  };

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    // You can track navigation and add mobile-specific logic here
    console.log('Navigation to:', navState.url);
  };

  // Inject JavaScript to optimize for mobile
  const injectedJavaScript = `
    // Add mobile-specific optimizations
    (function() {
      // Configure viewport for mobile with safe area support
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      // Add mobile class to body for mobile-specific CSS
      document.body.classList.add('mobile-app');
      document.body.style.overflow = 'auto';
      document.body.style.webkitOverflowScrolling = 'touch';
      
      // Add CSS for proper safe area handling
      var style = document.createElement('style');
      style.textContent = \`
        :root {
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
          --safe-area-inset-left: env(safe-area-inset-left);
          --safe-area-inset-right: env(safe-area-inset-right);
        }
        
        html, body {
          margin: 0;
          padding: 0;
          background-color: #000000;
          height: 100vh;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        /* iPhone-specific safe area handling */
        @supports (padding: max(0px)) {
          .ios-pwa-container, .min-h-screen, #root, [data-reactroot] {
            background-color: #000000;
            min-height: 100vh;
            padding-top: max(44px, env(safe-area-inset-top)) !important;
            padding-bottom: max(34px, env(safe-area-inset-bottom)) !important;
            padding-left: env(safe-area-inset-left) !important;
            padding-right: env(safe-area-inset-right) !important;
            box-sizing: border-box;
          }
        }
        
        /* Fallback for older devices */
        .ios-pwa-container, .min-h-screen, #root, [data-reactroot] {
          background-color: #000000;
          min-height: 100vh;
          padding-top: 44px !important;
          padding-bottom: 34px !important;
          box-sizing: border-box;
        }
        
        /* Apply safe area to all direct children of main container */
        .ios-pwa-container > *, .min-h-screen > * {
          box-sizing: border-box;
        }
        
        /* Specific fixes for dashboard and other main content */
        main, .page-container, .dashboard-container {
          padding-top: max(1rem, var(--safe-area-inset-top, 0px)) !important;
          padding-bottom: max(1rem, var(--safe-area-inset-bottom, 0px)) !important;
          box-sizing: border-box;
        }
        
        /* Bottom navigation safe area fix */
        .fixed.bottom-0, .bottom-nav {
          bottom: var(--safe-area-inset-bottom, 0px) !important;
          padding-bottom: 0 !important;
        }
        
        /* Ensure scrolling works smoothly */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Fix for content being cut off */
        .container, .content-wrapper {
          padding-top: var(--safe-area-inset-top, 0px);
          padding-bottom: var(--safe-area-inset-bottom, 0px);
        }
        
        /* Hide development banners completely */
        .dev-banner, .preview-banner, [data-preview], .replit-preview-notice {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Fix for Replit development preview */
        body.mobile-app .replit-ui, body.mobile-app [class*="preview"], body.mobile-app [class*="banner"] {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);
      
      // Apply device-specific safe area handling
      setTimeout(function() {
        // Remove any development banners
        var banners = document.querySelectorAll('.dev-banner, .preview-banner, [data-preview], .replit-preview-notice, .replit-ui');
        banners.forEach(function(banner) {
          if (banner) banner.remove();
        });
        
        // Detect iPhone model and apply appropriate spacing
        var isIPhoneX = /iPhone|iPad|iPod/.test(navigator.userAgent) && window.screen.height >= 812;
        var safeAreaTop = isIPhoneX ? 'max(44px, env(safe-area-inset-top))' : '20px';
        var safeAreaBottom = isIPhoneX ? 'max(34px, env(safe-area-inset-bottom))' : '0px';
        
        var containers = document.querySelectorAll('.ios-pwa-container, .min-h-screen, #root, [data-reactroot]');
        containers.forEach(function(container) {
          container.style.paddingTop = safeAreaTop;
          container.style.paddingBottom = safeAreaBottom;
          container.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
          container.style.paddingRight = 'env(safe-area-inset-right, 0px)';
          container.style.boxSizing = 'border-box';
        });
        
        // Fix bottom navigation for all iPhone models
        var bottomNav = document.querySelector('.fixed.bottom-0');
        if (bottomNav) {
          bottomNav.style.bottom = safeAreaBottom;
        }
        
        // Ensure session persistence
        if (window.localStorage) {
          var sessionData = window.localStorage.getItem('session_data');
          if (sessionData && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SESSION_PERSIST',
              data: sessionData
            }));
          }
        }
      }, 1000);
      
      // Enable smooth scrolling
      document.addEventListener('touchstart', function() {}, { passive: true });
      document.addEventListener('touchmove', function(e) {
        // Allow scrolling
      }, { passive: true });
      
      // Send ready signal to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'READY',
        timestamp: Date.now()
      }));
    })();
    
    true; // Required for injected JavaScript
  `;

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', message);
      
      switch (message.type) {
        case 'READY':
          console.log('WebView is ready');
          break;
        case 'NAVIGATION':
          // Handle navigation events
          break;
        case 'ERROR':
          Alert.alert('Error', message.error);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Custom user agent to identify mobile app requests
  const userAgent = Platform.select({
    ios: 'MyTrainPro-iOS/1.0.0 (iPhone; iOS 14.0) AppleWebKit/605.1.15 Safari/604.1',
    android: 'MyTrainPro-Android/1.0.0 (Android 10; Mobile) Chrome/91.0.4472.120',
  });

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            Unable to load MyTrainPro. Please check your internet connection.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={true} />
      
      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading MyTrainPro...</Text>
        </View>
      )}

      {/* Full-screen WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: serverUrl }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        userAgent={userAgent}
        
        // WebView configuration
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        overScrollMode="always"
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        
        // iOS specific
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        
        // Android specific
        mixedContentMode="compatibility"
        
        // Security and performance
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        cacheEnabled={true}
        incognito={false}
        
        // Session persistence settings
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        
        // Handle different types of navigation with session persistence
        onShouldStartLoadWithRequest={(request) => {
          // Allow all navigation within the app domains
          if (request.url.includes('fitness-ai-tracker-c0109009.replit.app') || 
              request.url.includes('mytrainpro.com')) {
            return true;
          }
          
          // Handle external links
          if (request.url.startsWith('http') || request.url.startsWith('https')) {
            Linking.openURL(request.url);
            return false;
          }
          
          return true;
        }}
        
        // Optimize rendering
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}
        
        // Handle HTTP errors
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP Error:', nativeEvent.statusCode, nativeEvent.description);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});