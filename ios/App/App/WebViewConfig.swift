import Foundation
import Capacitor

/**
 * iOS Native Swipe-Back Gesture Plugin
 * Implements the same functionality as capacitor-plugin-ios-swipe-back
 * without requiring CocoaPods installation
 */
@objc(IosSwipeBack)
public class IosSwipeBack: CAPPlugin {
    
    // Called when plugin is loaded - verify registration
    override public func load() {
        print("🔌 [IosSwipeBack] Plugin loaded successfully!")
    }
    
    @objc func enable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Use optional chaining - bridge is optional, getWebView() returns optional
            self.bridge?.getWebView()?.allowsBackForwardNavigationGestures = true
            
            print("✅ [IosSwipeBack] Native swipe-back gesture ENABLED")
            call.resolve(["error": 0])
        }
    }
    
    @objc func disable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Use optional chaining - bridge is optional, getWebView() returns optional
            self.bridge?.getWebView()?.allowsBackForwardNavigationGestures = false
            
            print("🚫 [IosSwipeBack] Native swipe-back gesture DISABLED")
            call.resolve(["error": 0])
        }
    }
}
