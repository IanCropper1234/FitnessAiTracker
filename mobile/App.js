import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';

// Keep the splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Check for updates when app starts
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Restart app to apply update
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Handle update errors gracefully
        console.log('Update check failed:', error);
      }
    }

    if (!__DEV__) {
      checkForUpdates();
    }
  }, []);

  const handleLoad = () => {
    // Hide splash screen after web app loads
    SplashScreen.hideAsync();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        source={{ uri: 'https://trainpro-app.replit.app/' }}
        style={styles.webview}
        onLoad={handleLoad}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
});