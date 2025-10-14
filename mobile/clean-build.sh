#!/bin/bash
echo "🧹 Cleaning old build artifacts..."
rm -rf ios android

echo "📱 Running expo prebuild with Build 28..."
npx expo prebuild --platform ios

echo "✅ Build configuration updated to Build 28"
echo "You can now run: EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production"