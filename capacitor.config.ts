import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trainpro.app',
  appName: 'MyTrainPro',
  // No webDir - we're loading from remote URL only
  server: {
    // Production: Load from mytrainpro.com
    url: 'https://mytrainpro.com',
    cleartext: false,
    // For local development, uncomment these:
    // url: 'http://localhost:5000',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000',
    allowsLinkPreview: true,
    limitsNavigationsToAppBoundDomains: false,
    preferredContentMode: 'mobile',
    // Inject custom user agent
    appendUserAgent: 'MyTrainPro-iOS/1.0.0'
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
};

export default config;
