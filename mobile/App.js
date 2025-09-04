import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
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

  const serverUrl = 'https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev';

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
      // Configure viewport for mobile with scroll support
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      // Add mobile class to body for mobile-specific CSS
      document.body.classList.add('mobile-app');
      document.body.style.overflow = 'auto';
      document.body.style.webkitOverflowScrolling = 'touch';
      document.body.style.height = '100vh';
      
      // Fix safe area for different iPhone models
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
      
      // Add CSS for full screen support
      var style = document.createElement('style');
      style.textContent = \`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #000000;
          height: 100vh;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        .ios-pwa-container, .min-h-screen {
          min-height: 100vh;
          background-color: #000000;
        }
        
        /* Fix for notch and home indicator */
        .safe-area-pt { padding-top: var(--safe-area-inset-top, 0px); }
        .safe-area-pb { padding-bottom: var(--safe-area-inset-bottom, 0px); }
        .safe-area-pl { padding-left: var(--safe-area-inset-left, 0px); }
        .safe-area-pr { padding-right: var(--safe-area-inset-right, 0px); }
        
        /* Ensure scrolling works */
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Fix for white borders */
        #root, [data-reactroot] {
          background-color: #000000;
          min-height: 100vh;
        }
      \`;
      document.head.appendChild(style);
      
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
        scalesPageToFit={true}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        overScrollMode="always"
        
        // iOS specific
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        
        // Android specific
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        
        // Security and performance
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        cacheEnabled={true}
        incognito={false}
        
        // Handle different types of navigation
        onShouldStartLoadWithRequest={(request) => {
          // Allow all navigation within the app domain
          if (request.url.includes('worf.replit.dev')) {
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