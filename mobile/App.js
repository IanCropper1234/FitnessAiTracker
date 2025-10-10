import React, { useState, useEffect, useRef } from "react";
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
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import * as AppleAuthentication from 'expo-apple-authentication';
import { AuthManager } from './auth/AuthManager';

const { width, height } = Dimensions.get("window");

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [appState, setAppState] = useState(AppState.currentState);
  const [session, setSession] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  const webViewRef = useRef(null);
  const backgroundTimeRef = useRef(null);
  const reloadAttemptsRef = useRef(0);

  const serverUrl = "https://fitness-ai-tracker-c0109009.replit.app";

  useEffect(() => {
    checkExistingSession();
    checkAppleSignInAvailability();
  }, []);

  const checkExistingSession = async () => {
    try {
      const savedSession = await AuthManager.getSession();
      if (savedSession) {
        console.log("[Auth] Found existing session:", savedSession);
        setSession(savedSession);
      }
    } catch (error) {
      console.error("[Auth] Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAppleSignInAvailability = async () => {
    const available = await AuthManager.isAppleSignInAvailable();
    setIsAppleSignInAvailable(available);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await AuthManager.signInWithGoogle();
      if (result.success) {
        console.log("[Auth] Google sign in successful");
        setSession(result.sessionData);
        // Trigger WebView reload to inject session
        setWebViewKey(prev => prev + 1);
      } else {
        // Display detailed error to user
        Alert.alert(
          "Google Sign In Failed", 
          result.error || "Unable to sign in with Google",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("[Auth] Error details:", result.details);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("[Auth] Google sign in error:", error);
      Alert.alert("Error", `An error occurred: ${error.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await AuthManager.signInWithApple();
      if (result.success) {
        console.log("[Auth] Apple sign in successful");
        setSession(result.sessionData);
        // Trigger WebView reload to inject session
        setWebViewKey(prev => prev + 1);
      } else {
        // Display detailed error to user
        Alert.alert(
          "Apple Sign In Failed", 
          result.error || "Unable to sign in with Apple",
          [
            {
              text: "OK",
              onPress: () => {
                console.log("[Auth] Error details:", result.details);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("[Auth] Apple sign in error:", error);
      Alert.alert("Error", `An error occurred: ${error.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthManager.clearSession();
      setSession(null);
      setWebViewKey(prev => prev + 1);
    } catch (error) {
      console.error("[Auth] Sign out error:", error);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleNavigationStateChange = (navState) => {
    console.log("Navigation to:", navState.url);
  };

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log("[App] AppState changed from", appState, "to", nextAppState);

      if (appState.match(/inactive|background/) && nextAppState === "active") {
        const backgroundDuration = backgroundTimeRef.current
          ? Date.now() - backgroundTimeRef.current
          : 0;

        console.log(
          "[App] Returned from background after",
          backgroundDuration,
          "ms",
        );

        if (backgroundDuration > 5 * 60 * 1000) {
          console.log("[App] Long background detected, checking WebView state");

          setTimeout(() => {
            if (webViewRef.current) {
              console.log("[App] Attempting WebView reload after background");
              webViewRef.current.reload();
            }
          }, 1000);

          setTimeout(() => {
            if (reloadAttemptsRef.current < 2) {
              console.log(
                "[App] Force re-mounting WebView due to potential blank page",
              );
              reloadAttemptsRef.current++;
              setWebViewKey((prev) => prev + 1);
            }
          }, 4000);
        }

        backgroundTimeRef.current = null;
      } else if (nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
        console.log("[App] App going to background");
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => subscription?.remove();
  }, [appState]);

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("[App] WebView error:", nativeEvent);

    if (
      nativeEvent.description?.includes("terminated") ||
      nativeEvent.description?.includes("crash") ||
      nativeEvent.code === -999
    ) {
      console.log("[App] WebView process terminated, force re-mounting");
      setWebViewKey((prev) => prev + 1);
      reloadAttemptsRef.current = 0;
    } else {
      setError(nativeEvent);
    }

    setIsLoading(false);
  };

  const handleContentProcessDidTerminate = () => {
    console.log("[App] WebView content process terminated by iOS");
    setWebViewKey((prev) => prev + 1);
    reloadAttemptsRef.current = 0;
  };

  const injectedJavaScriptBeforeContentLoaded = session ? `
    (function() {
      try {
        // Inject session data
        const sessionData = ${JSON.stringify(session)};
        
        if (sessionData && sessionData.user) {
          // Store user data in localStorage
          window.localStorage.setItem('auth_user', JSON.stringify(sessionData.user));
          window.localStorage.setItem('auth_session_injected', 'true');
          
          // Inject cookies if available
          if (sessionData.cookies) {
            // Parse and set cookies
            const cookies = sessionData.cookies.split(';');
            cookies.forEach(cookie => {
              document.cookie = cookie.trim();
            });
          }
          
          console.log('[Mobile] Session injected successfully');
        }
      } catch (error) {
        console.error('[Mobile] Session injection failed:', error);
      }
    })();
    true;
  ` : 'true;';

  const injectedJavaScript = `
    (function() {
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.getElementsByTagName('head')[0].appendChild(meta);
      
      var WebViewReloadManager = {
        lastActivity: Date.now(),
        backgroundTime: null,
        isVisible: !document.hidden,
        checkInterval: null,
        reloadAttempts: 0,
        maxReloadAttempts: 2,
        lastReloadAttempt: null,
        isReactNativeHandling: true,
        
        init: function() {
          this.setupVisibilityListeners();
          this.setupActivityTracking();
          this.startBlankPageMonitoring();
          this.startInactivityMonitoring();
          console.log('[WebView] Auto-reload manager initialized');
        },
        
        setupVisibilityListeners: function() {
          var self = this;
          
          document.addEventListener('visibilitychange', function() {
            var isVisible = !document.hidden;
            var wasVisible = self.isVisible;
            self.isVisible = isVisible;
            
            if (isVisible && !wasVisible) {
              var backgroundDuration = self.backgroundTime ? Date.now() - self.backgroundTime : 0;
              console.log('[WebView] App returned from background after:', backgroundDuration, 'ms');
              
              self.backgroundTime = null;
              self.updateActivity();
              
              setTimeout(function() {
                if (self.isPageBlank()) {
                  console.log('[WebView] Blank page detected after background return');
                  self.handleAutoReload('background_return');
                }
              }, 1000);
              
            } else if (!isVisible && wasVisible) {
              self.backgroundTime = Date.now();
              console.log('[WebView] App went to background');
            }
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'VISIBILITY_CHANGE',
                isVisible: isVisible,
                backgroundDuration: backgroundDuration || 0,
                timestamp: Date.now()
              }));
            }
          });
          
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
        
        setupActivityTracking: function() {
          var self = this;
          var events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
          
          events.forEach(function(event) {
            document.addEventListener(event, function() {
              self.updateActivity();
            }, { passive: true });
          });
        },
        
        updateActivity: function() {
          this.lastActivity = Date.now();
        },
        
        isPageBlank: function() {
          try {
            var hasContent = document.body && document.body.children.length > 0;
            var hasRoot = document.getElementById('root') && document.getElementById('root').innerHTML.trim() !== '';
            
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
              }
            }
            
            var bodyStyle = window.getComputedStyle(document.body);
            var hasProperBackground = bodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                     bodyStyle.backgroundColor !== 'transparent';
            
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
        
        startBlankPageMonitoring: function() {
          var self = this;
          
          self.checkInterval = setInterval(function() {
            if (self.isVisible && self.isPageBlank()) {
              console.log('[WebView] Blank page detected during monitoring');
              self.handleAutoReload('blank_page_monitoring');
            }
          }, 12000);
        },
        
        startInactivityMonitoring: function() {
          var self = this;
          
          setInterval(function() {
            var timeSinceActivity = Date.now() - self.lastActivity;
            var inactivityThreshold = 30 * 60 * 1000;
            
            if (timeSinceActivity > inactivityThreshold) {
              console.log('[WebView] Long inactivity detected:', timeSinceActivity, 'ms');
              
              if (self.isPageBlank()) {
                console.log('[WebView] Blank page detected during inactivity');
                self.handleAutoReload('inactivity');
              }
            }
          }, 90000);
        },
        
        handleAutoReload: function(reason) {
          var now = Date.now();
          var timeSinceLastAttempt = this.lastReloadAttempt ? now - this.lastReloadAttempt : Infinity;
          
          var backoffTime = Math.pow(2, this.reloadAttempts + 1) * 60000;
          
          if (this.isReactNativeHandling && reason === 'background_return') {
            console.log('[WebView] Background return detected, deferring to React Native AppState handling');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'BLANK_PAGE_DETECTED',
                reason: reason,
                timestamp: now
              }));
            }
            return;
          }
          
          if (timeSinceLastAttempt < backoffTime) {
            console.log('[WebView] Reload attempt skipped due to backoff period:', Math.round((backoffTime - timeSinceLastAttempt) / 1000), 'seconds remaining');
            return;
          }
          
          if (this.reloadAttempts >= this.maxReloadAttempts) {
            console.log('[WebView] Max reload attempts reached, notifying React Native for key-based re-mount');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'FORCE_REMOUNT_NEEDED',
                reason: 'max_reload_attempts_reached',
                timestamp: now
              }));
            }
            return;
          }
          
          this.reloadAttempts++;
          this.lastReloadAttempt = now;
          console.log('[WebView] Auto-reloading due to:', reason, 'attempt:', this.reloadAttempts, 'next backoff:', Math.pow(2, this.reloadAttempts) * 60000 / 1000, 'seconds');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'AUTO_RELOAD',
              reason: reason,
              attempt: this.reloadAttempts,
              nextBackoffSeconds: Math.pow(2, this.reloadAttempts) * 60,
              timestamp: now
            }));
          }
          
          try {
            window.location.reload();
          } catch (error) {
            console.error('[WebView] Failed to reload:', error);
            setTimeout(function() {
              try {
                window.location.href = window.location.origin;
              } catch (e) {
                console.error('[WebView] Failed to navigate to origin:', e);
              }
            }, 1000);
          }
        },
        
        destroy: function() {
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
          }
        }
      };
      
      WebViewReloadManager.init();
      
      document.body.classList.add('mobile-app');
      document.body.style.overflow = 'auto';
      document.body.style.webkitOverflowScrolling = 'touch';
      
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
        
        .fixed.bottom-0, nav[class*="bottom"] {
          position: fixed !important;
          bottom: 0px !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1000 !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
        }
        
        * {
          -webkit-overflow-scrolling: touch;
        }
        
        .container:not(.ios-pwa-container), .content-wrapper {
          padding-top: var(--safe-area-inset-top, 0px);
          padding-bottom: var(--safe-area-inset-bottom, 0px);
        }
        
        .dev-banner, .preview-banner, [data-preview], .replit-preview-notice {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        body.mobile-app .replit-ui, body.mobile-app [class*="preview"], body.mobile-app [class*="banner"] {
          display: none !important;
        }
      \`;
      document.head.appendChild(style);
      
      setTimeout(function() {
        var banners = document.querySelectorAll('.dev-banner, .preview-banner, [data-preview], .replit-preview-notice, .replit-ui');
        banners.forEach(function(banner) {
          if (banner) banner.remove();
        });
        
        var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        var isIPhoneX = isIOS && window.screen.height >= 812;
        
        var containers = document.querySelectorAll('.ios-pwa-container, .min-h-screen, #root, [data-reactroot]');
        containers.forEach(function(container) {
          container.style.paddingTop = '';
          container.style.paddingBottom = '';
          container.style.paddingLeft = '';
          container.style.paddingRight = '';
          container.style.minHeight = '100vh';
        });
        
        var mainContent = document.querySelectorAll('main, .page-container, .dashboard-container');
        mainContent.forEach(function(element) {
          element.style.paddingBottom = '70px';
        });
        
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
      
      document.addEventListener('touchstart', function() {}, { passive: true });
      document.addEventListener('touchmove', function(e) {
      }, { passive: true });
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'READY',
        timestamp: Date.now()
      }));
    })();
    
    true;
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", message);

      switch (message.type) {
        case "READY":
          console.log("WebView is ready");
          setIsLoading(false);
          break;
        case "OAUTH_REQUEST":
          console.log(`[App] OAuth request from WebView: ${message.provider}`);
          if (message.provider === 'google') {
            handleGoogleSignIn();
          } else if (message.provider === 'apple') {
            handleAppleSignIn();
          }
          break;
        case "NAVIGATION":
          break;
        case "ERROR":
          Alert.alert("Error", message.error);
          break;
        case "AUTO_RELOAD":
          console.log(
            `WebView auto-reload triggered: ${message.reason} (attempt ${message.attempt})`,
          );
          if (message.attempt === 1) {
            console.log("First auto-reload attempt, refreshing session...");
          }
          break;
        case "VISIBILITY_CHANGE":
          console.log(
            `WebView visibility: ${message.isVisible ? "visible" : "hidden"}`,
          );
          if (message.backgroundDuration) {
            console.log(`Background duration: ${message.backgroundDuration}ms`);
          }
          break;
        case "SESSION_PERSIST":
          console.log("Session data persisted:", message.data);
          break;
        case "BLANK_PAGE_DETECTED":
          console.log(`[App] WebView detected blank page: ${message.reason}`);
          setTimeout(() => {
            if (webViewRef.current) {
              console.log("[App] React Native handling blank page with reload");
              webViewRef.current.reload();
            }
          }, 500);
          break;
        case "FORCE_REMOUNT_NEEDED":
          console.log(
            "[App] WebView requested force re-mount due to:",
            message.reason,
          );
          setWebViewKey((prev) => prev + 1);
          reloadAttemptsRef.current = 0;
          break;
        default:
          console.log("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const userAgent = Platform.select({
    ios: "MyTrainPro-iOS/1.0.0 (iPhone; iOS 14.0) AppleWebKit/605.1.15 Safari/604.1",
    android:
      "MyTrainPro-Android/1.0.0 (Android 10; Mobile) Chrome/91.0.4472.120",
  });

  if (!session && !isLoading) {
    return (
      <View style={styles.authContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#000000"
          translucent={true}
        />
        
        <View style={styles.authContent}>
          <Text style={styles.authTitle}>MyTrainPro</Text>
          <Text style={styles.authSubtitle}>AI-Powered Fitness Coaching</Text>
          
          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {isAppleSignInAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#000000"
          translucent={true}
        />
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={true}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading MyTrainPro...</Text>
        </View>
      )}

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
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedJavaScript={injectedJavaScript}
        userAgent={userAgent}
        onContentProcessDidTerminate={handleContentProcessDidTerminate}
        onRenderProcessGone={handleContentProcessDidTerminate}
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
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        cacheEnabled={true}
        incognito={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.includes("fitness-ai-tracker-c0109009.replit.app") ||
            request.url.includes("mytrainpro.com")
          ) {
            return true;
          }

          if (
            request.url.startsWith("http") ||
            request.url.startsWith("https")
          ) {
            Linking.openURL(request.url);
            return false;
          }

          return true;
        }}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn(
            "HTTP Error:",
            nativeEvent.statusCode,
            nativeEvent.description,
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  authContent: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  authTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: "#999999",
    marginBottom: 48,
  },
  authButtons: {
    width: "100%",
    gap: 16,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  appleButton: {
    width: "100%",
    height: 50,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  webviewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
