import Foundation
import Capacitor

// WebView Configuration Extension for OAuth handling
@objc(WebViewConfigPlugin)
public class WebViewConfigPlugin: CAPPlugin {
    
    @objc override public func load() {
        // Configure WebView to handle all navigations internally
        // This prevents OAuth flows from opening in external Safari
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(webViewConfigured(_:)),
            name: .capacitorWebViewDidLoad,
            object: nil
        )
    }
    
    @objc func webViewConfigured(_ notification: Notification) {
        guard let webView = self.bridge?.webView else { return }
        
        // Allow all navigation to happen within the WebView
        webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        print("✅ [WebView Config] WebView configured to handle OAuth internally")
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// iOS Native Swipe-Back Gesture Plugin
// Implements the same functionality as capacitor-plugin-ios-swipe-back
// without requiring CocoaPods installation
@objc(IosSwipeBack)
public class IosSwipeBack: CAPPlugin {
    
    @objc func enable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("WebView not available")
                return
            }
            
            // Enable iOS native swipe-back gesture
            webView.allowsBackForwardNavigationGestures = true
            
            print("✅ [IosSwipeBack] Native swipe-back gesture ENABLED")
            call.resolve(["error": 0])
        }
    }
    
    @objc func disable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("WebView not available")
                return
            }
            
            // Disable iOS native swipe-back gesture
            webView.allowsBackForwardNavigationGestures = false
            
            print("🚫 [IosSwipeBack] Native swipe-back gesture DISABLED")
            call.resolve(["error": 0])
        }
    }
}
