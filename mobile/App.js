import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const handleLoad = () => {
    // Hide splash screen after web app loads
    SplashScreen.hideAsync();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        source={{ uri: 'https://06480408-c2d8-4ed1-9930-a2a5f8dc92fd-00-3c6lztu4xeqmc.riker.replit.dev/' }}
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