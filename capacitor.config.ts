import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitai.app',
  appName: 'FitAI',
  webDir: 'dist/public',
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
    }
  }
};

export default config;
