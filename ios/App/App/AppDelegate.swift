import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Clear WKWebView cache to ensure latest CSS/HTML is loaded
        // This prevents TestFlight builds from showing stale cached assets
        clearWebViewCache()
        
        return true
    }
    
    func clearWebViewCache() {
        let websiteDataTypes = Set([
            WKWebsiteDataTypeDiskCache,
            WKWebsiteDataTypeMemoryCache,
            WKWebsiteDataTypeCookies,
            WKWebsiteDataTypeSessionStorage,
            WKWebsiteDataTypeLocalStorage,
            WKWebsiteDataTypeWebSQLDatabases,
            WKWebsiteDataTypeIndexedDBDatabases
        ])
        
        let date = Date(timeIntervalSince1970: 0)
        WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes, modifiedSince: date) {
            print("✅ [WKWebView Cache] Successfully cleared all cached data")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
        print("[AppDelegate] App will resign active - preparing for background")
        
        // Save the current timestamp for background duration tracking
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "app_background_time")
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        print("[AppDelegate] App did enter background")
        
        // Set background time for duration tracking
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "app_background_time")
        UserDefaults.standard.set(true, forKey: "app_was_backgrounded")
        UserDefaults.standard.synchronize()
        
        // Note: Capacitor bridge notifications removed - using React Native WebView instead
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
        print("[AppDelegate] App will enter foreground")
        
        let backgroundTime = UserDefaults.standard.double(forKey: "app_background_time")
        let wasBackgrounded = UserDefaults.standard.bool(forKey: "app_was_backgrounded")
        let currentTime = Date().timeIntervalSince1970
        let backgroundDuration = backgroundTime > 0 ? currentTime - backgroundTime : 0
        
        print("[AppDelegate] Background duration: \(backgroundDuration) seconds")
        
        // Clear background tracking
        UserDefaults.standard.removeObject(forKey: "app_background_time")
        UserDefaults.standard.set(false, forKey: "app_was_backgrounded")
        UserDefaults.standard.synchronize()
        
        // Note: Capacitor bridge notifications removed - React Native WebView handles state via injected JavaScript
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        print("[AppDelegate] App did become active")
        
        let backgroundTime = UserDefaults.standard.double(forKey: "app_background_time")
        let wasBackgrounded = UserDefaults.standard.bool(forKey: "app_was_backgrounded")
        let currentTime = Date().timeIntervalSince1970
        let backgroundDuration = backgroundTime > 0 ? currentTime - backgroundTime : 0
        
        // If app was in background for a long time (>5 minutes), it's likely to need a refresh
        let longBackgroundThreshold: Double = 5 * 60 // 5 minutes
        let shouldCheckForBlankPage = backgroundDuration > longBackgroundThreshold
        
        print("[AppDelegate] Should check for blank page: \(shouldCheckForBlankPage) (duration: \(backgroundDuration)s)")
        
        // Note: Capacitor bridge notifications removed - React Native WebView handles state changes via injected JavaScript
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("📱 [Deep Link] App opened with URL: \(url.absoluteString)")
        
        // Let Capacitor handle all deep links through its default handler
        // This will trigger the appUrlOpen event in the JavaScript code
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
