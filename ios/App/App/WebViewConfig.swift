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
