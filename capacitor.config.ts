import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trainpro.app',
  appName: 'MyTrainPro',
  // No webDir - we're loading from remote URL only
  server: {
    // Production: Load from mytrainpro.com
    url: 'https://mytrainpro.com',
    cleartext: false,
    // Allow OAuth navigation - prevent opening in external browser
    allowNavigation: [
      'https://mytrainpro.com',
      'https://accounts.google.com',
      'https://appleid.apple.com',
      'https://*.google.com',
      'https://*.apple.com'
    ],
    // For local development, uncomment these:
    // url: 'http://localhost:5000',
    // cleartext: true
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#000000',
    allowsLinkPreview: true,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
    // Enable native scrolling performance
    scrollEnabled: true,
    // Inject custom user agent
    appendUserAgent: 'MyTrainPro-iOS/1.0.0',
    // Register custom iOS plugins
    packageClassList: [
      'AppPlugin',
      'CAPBrowserPlugin',
      'CAPCameraPlugin',
      'HapticsPlugin',
      'KeyboardPlugin',
      'StatusBarPlugin',
      'IosSwipeBack'
    ]
  },
  plugins: {
    App: {
      launchAutoHide: true
    },
    Keyboard: {
      resize: 'ionic',
      style: 'dark'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000'
    },
    Haptics: {
      enabled: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
} as CapacitorConfig;

export default config;
