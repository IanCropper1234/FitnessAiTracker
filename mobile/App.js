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

  // Inject JavaScript to optimize for mobile and handle visibility/reload
  const injectedJavaScript = `
    // Add mobile-specific optimizations and auto-reload functionality
    (function() {
      // Configure viewport for mobile with safe area support - prevent auto-zoom
      var existingMeta = document.querySelector('meta[name="viewport"]');
      if (existingMeta) {
        existingMeta.remove();
      }
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      // Enhanced WebView Auto-Reload System
      var WebViewReloadManager = {
        lastActivity: Date.now(),
        backgroundTime: null,
        isVisible: !document.hidden,
        checkInterval: null,
        reloadAttempts: 0,
        maxReloadAttempts: 3,
        lastReloadAttempt: 0,
        
        // Initialize the reload manager
        init: function() {
          this.setupVisibilityListeners();
          this.setupActivityTracking();
          this.startBlankPageMonitoring();
          this.startInactivityMonitoring();
          console.log('[WebView] Auto-reload manager initialized');
        },
        
        // Setup visibility change listeners
        setupVisibilityListeners: function() {
          var self = this;
          
          document.addEventListener('visibilitychange', function() {
            var isVisible = !document.hidden;
            var wasVisible = self.isVisible;
            self.isVisible = isVisible;
            
            if (isVisible && !wasVisible) {
              // App became visible (returned from background)
              var backgroundDuration = self.backgroundTime ? Date.now() - self.backgroundTime : 0;
              console.log('[WebView] App returned from background after:', backgroundDuration, 'ms');
              
              self.backgroundTime = null;
              self.updateActivity();
              
              // Check for blank page after returning from background
              setTimeout(function() {
                if (self.isPageBlank()) {
                  console.log('[WebView] Blank page detected after background return');
                  self.handleAutoReload('background_return');
                }
              }, 1000);
              
            } else if (!isVisible && wasVisible) {
              // App went to background
              self.backgroundTime = Date.now();
              console.log('[WebView] App went to background');
            }
            
            // Notify React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'VISIBILITY_CHANGE',
                isVisible: isVisible,
                backgroundDuration: backgroundDuration || 0,
                timestamp: Date.now()
              }));
            }
          });
          
          // iOS-specific page show/hide events
          window.addEventListener('pageshow', function(event) {
            console.log('[WebView] Page show event, persisted:', event.persisted);
            setTimeout(function() {
              if (self.isPageBlank()) {
                console.log('[WebView] Blank page detected on page show');
                self.handleAutoReload('page_show');
              }
            }, 1000);
          });
          
          window.addEventListener('pagehide', function() {
            console.log('[WebView] Page hide event');
            self.backgroundTime = Date.now();
          });
        },
        
        // Setup activity tracking
        setupActivityTracking: function() {
          var self = this;
          var events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
          
          events.forEach(function(event) {
            document.addEventListener(event, function() {
              self.updateActivity();
            }, { passive: true });
          });
        },
        
        // Update last activity timestamp
        updateActivity: function() {
          this.lastActivity = Date.now();
        },
        
        // Check if page appears blank
        isPageBlank: function() {
          try {
            // Check essential indicators of a blank page - optimized
            var hasContent = document.body && document.body.children.length > 0;
            var hasRoot = document.getElementById('root') && document.getElementById('root').innerHTML.trim() !== '';
            
            // Check for visible elements with content
            var visibleElements = document.querySelectorAll('*:not(script):not(style):not(meta):not(link)');
            var hasVisibleContent = false;
            
            for (var i = 0; i < Math.min(visibleElements.length, 20); i++) {
              var el = visibleElements[i];
              try {
                var style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && el.textContent && el.textContent.trim()) {
                  hasVisibleContent = true;
                  break;
                }
              } catch (e) {
                // Skip elements that can't be styled
              }
            }
            
            // Check for white/empty background
            var bodyStyle = window.getComputedStyle(document.body);
            var hasProperBackground = bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                     bodyStyle.backgroundColor !== 'transparent';
            
            // Page is blank if essential indicators suggest it
            var blankIndicators = [
              !hasContent,
              !hasRoot,
              !hasVisibleContent
            ].filter(Boolean).length;
            
            return blankIndicators >= 2;
          } catch (error) {
            console.warn('[WebView] Error checking blank page:', error);
            return false;
          }
        },
        
        // Start monitoring for blank pages
        startBlankPageMonitoring: function() {
          var self = this;
          
          self.checkInterval = setInterval(function() {
            if (self.isVisible && self.isPageBlank()) {
              console.log('[WebView] Blank page detected during monitoring');
              self.handleAutoReload('blank_page_monitoring');
            }
          }, 12000); // Check every 12 seconds - optimized interval
        },
        
        // Start monitoring for long inactivity
        startInactivityMonitoring: function() {
          var self = this;
          
          setInterval(function() {
            var timeSinceActivity = Date.now() - self.lastActivity;
            var inactivityThreshold = 30 * 60 * 1000; // 30 minutes
            
            if (timeSinceActivity > inactivityThreshold) {
              console.log('[WebView] Long inactivity detected:', timeSinceActivity, 'ms');
              
              if (self.isPageBlank()) {
                console.log('[WebView] Blank page detected during inactivity');
                self.handleAutoReload('inactivity');
              }
            }
          }, 90000); // Check every 90 seconds - optimized for performance
        },
        
        // Handle automatic reload with exponential backoff
        handleAutoReload: function(reason) {
          var now = Date.now();
          var timeSinceLastAttempt = this.lastReloadAttempt ? now - this.lastReloadAttempt : 0;
          
          // Exponential backoff: 1min, 2min, 4min (60000, 120000, 240000 ms)
          var backoffTime = Math.pow(2, this.reloadAttempts) * 60000;
          
          // Check if we're within backoff period
          if (timeSinceLastAttempt < backoffTime) {
            console.log('[WebView] Reload attempt skipped due to backoff period:', Math.round((backoffTime - timeSinceLastAttempt) / 1000), 'seconds remaining');
            return;
          }
          
          if (this.reloadAttempts >= this.maxReloadAttempts) {
            console.log('[WebView] Max reload attempts reached, skipping');
            return;
          }
          
          this.reloadAttempts++;
          this.lastReloadAttempt = now;
          console.log('[WebView] Auto-reloading due to:', reason, 'attempt:', this.reloadAttempts, 'next backoff:', Math.pow(2, this.reloadAttempts) * 60000 / 1000, 'seconds');
          
          // Notify React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTO_RELOAD',
              reason: reason,
              attempt: this.reloadAttempts,
              nextBackoffSeconds: Math.pow(2, this.reloadAttempts) * 60,
              timestamp: now
            }));
          }
          
          // Attempt reload with fallback
          try {
            window.location.reload();
          } catch (error) {
            console.error('[WebView] Failed to reload:', error);
            // Fallback: navigate to origin
            setTimeout(function() {
              try {
                window.location.href = window.location.origin;
              } catch (e) {
                console.error('[WebView] Failed to navigate to origin:', e);
              }
            }, 1000);
          }
        },
        
        // Cleanup
        destroy: function() {
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
          }
        }
      };
      
      // Initialize the reload manager
      WebViewReloadManager.init();
      
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
        
        /* iPhone-specific safe area handling - Reduced top padding */
        @supports (padding: max(0px)) {
          .ios-pwa-container, .min-h-screen, #root, [data-reactroot] {
            background-color: #000000;
            min-height: 100vh;
            padding-top: max(8px, env(safe-area-inset-top)) !important;
            padding-bottom: max(34px, env(safe-area-inset-bottom)) !important;
            padding-left: env(safe-area-inset-left) !important;
            padding-right: env(safe-area-inset-right) !important;
            box-sizing: border-box;
          }
        }
        
        /* Fallback for older devices - Reduced top padding */
        .ios-pwa-container, .min-h-screen, #root, [data-reactroot] {
          background-color: #000000;
          min-height: 100vh;
          padding-top: 8px !important;
          padding-bottom: 34px !important;
          box-sizing: border-box;
        }
        
        /* Apply safe area to all direct children of main container */
        .ios-pwa-container > *, .min-h-screen > * {
          box-sizing: border-box;
        }
        
        /* Remove all custom padding - let the app handle its own spacing */
        main, .page-container, .dashboard-container, .content-area {
          padding-top: 0px !important;
          padding-bottom: 70px !important;
          padding-left: 0px !important;
          padding-right: 0px !important;
          box-sizing: border-box;
          min-height: 100vh;
          overflow-x: hidden;
        }
        
        /* Bottom navigation - stick to bottom with safe area */
        .fixed.bottom-0, nav[class*="bottom"] {
          position: fixed !important;
          bottom: 0px !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1000 !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
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
      
      // Note: iOS Input Auto-Zoom Prevention is now handled by CSS in index.css
      
      // Apply device-specific safe area handling
      setTimeout(function() {
        // Remove any development banners
        var banners = document.querySelectorAll('.dev-banner, .preview-banner, [data-preview], .replit-preview-notice, .replit-ui');
        banners.forEach(function(banner) {
          if (banner) banner.remove();
        });
        
        // Note: Input auto-zoom prevention is handled by CSS in index.css for .mobile-app class
        
        // Detect device type and apply universal spacing
        var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        var isIPhoneX = isIOS && window.screen.height >= 812;
        
        // Reset all containers to default
        var containers = document.querySelectorAll('.ios-pwa-container, .min-h-screen, #root, [data-reactroot]');
        containers.forEach(function(container) {
          container.style.paddingTop = '';
          container.style.paddingBottom = '';
          container.style.paddingLeft = '';
          container.style.paddingRight = '';
          container.style.minHeight = '100vh';
        });
        
        // Only adjust main content area for bottom navigation
        var mainContent = document.querySelectorAll('main, .page-container, .dashboard-container');
        mainContent.forEach(function(element) {
          element.style.paddingBottom = '70px';
        });
        
        // Fix bottom navigation
        var bottomNavs = document.querySelectorAll('.fixed.bottom-0, nav[class*=\"bottom\"]');
        bottomNavs.forEach(function(nav) {
          nav.style.position = 'fixed';
          nav.style.bottom = '0px';
          nav.style.left = '0px';
          nav.style.right = '0px';
          nav.style.zIndex = '1000';
          if (isIPhoneX) {
            nav.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
          }
        });
        
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
          setIsLoading(false);
          break;
        case 'NAVIGATION':
          // Handle navigation events
          break;
        case 'ERROR':
          Alert.alert('Error', message.error);
          break;
        case 'AUTO_RELOAD':
          console.log(`WebView auto-reload triggered: ${message.reason} (attempt ${message.attempt})`);
          // Optional: Show user notification about auto-reload
          if (message.attempt === 1) {
            console.log('First auto-reload attempt, refreshing session...');
          }
          break;
        case 'VISIBILITY_CHANGE':
          console.log(`WebView visibility: ${message.isVisible ? 'visible' : 'hidden'}`);
          if (message.backgroundDuration) {
            console.log(`Background duration: ${message.backgroundDuration}ms`);
          }
          break;
        case 'SESSION_PERSIST':
          // Handle session data persistence
          console.log('Session data persisted:', message.data);
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