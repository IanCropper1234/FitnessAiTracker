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
  AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const webViewRef = useRef(null);
  const backgroundTimeRef = useRef(null);
  const reloadAttemptsRef = useRef(0);

  // Production URL - use deployed domain
  const serverUrl = 'https://fitness-ai-tracker-c0109009.replit.app';
  
  // Add error logging for TestFlight debugging
  useEffect(() => {
    console.log('[App] Environment:', __DEV__ ? 'development' : 'production');
    console.log('[App] Server URL:', serverUrl);
  }, []);

  // Handle loading state
  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  // Placeholder - will be set after handleWebViewError is defined
  let handleError;

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    // You can track navigation and add mobile-specific logic here
    console.log('Navigation to:', navState.url);
  };

  // 簡化的 AppState 處理 - 僅記錄狀態變化
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('[App] AppState:', nextAppState);
      
      if (nextAppState === 'active' && appState.match(/inactive|background/)) {
        // 從背景返回時簡單記錄
        console.log('[App] App became active');
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // WebView process termination handler
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('[App] WebView error:', nativeEvent);

    // Check if this is a process termination
    if (nativeEvent.description?.includes('terminated') || 
        nativeEvent.description?.includes('crash') ||
        nativeEvent.code === -999) {
      console.log('[App] WebView process terminated, force re-mounting');
      setWebViewKey(prev => prev + 1);
      reloadAttemptsRef.current = 0; // Reset attempts on process termination
    } else {
      setError(nativeEvent);
    }

    setIsLoading(false);
  };

  // Content process termination handler (iOS specific)
  const handleContentProcessDidTerminate = () => {
    console.log('[App] WebView content process terminated by iOS');
    setWebViewKey(prev => prev + 1);
    reloadAttemptsRef.current = 0;
  };

  // Set the error handler after function definitions
  handleError = handleWebViewError;

  // Minimal injectedJavaScript - 極簡版避免崩潰
  const injectedJavaScript = `
    (function() {
      try {
        // 只添加必要的 mobile class
        if (document.body) {
          document.body.classList.add('mobile-app');
        }
        
        // 發送就緒信號
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'READY',
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        // 靜默處理錯誤,避免崩潰
      }
    })();
    true;
  `;

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'READY') {
        console.log('[App] WebView ready');
        setIsLoading(false);
      }
    } catch (error) {
      // Silently handle parsing errors
      console.log('[App] Message parse error');
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
          <Text style={styles.errorDetails}>
            Error: {error.description || error.code || 'Unknown error'}
          </Text>
          <Text style={styles.errorDetails}>
            URL: {serverUrl}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              setWebViewKey(prev => prev + 1);
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
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: serverUrl }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleWebViewError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        userAgent={userAgent}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
        onRenderProcessGone={handleContentProcessDidTerminate}

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
    marginBottom: 12,
  },
  errorDetails: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Courier',
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