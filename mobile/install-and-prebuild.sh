#!/bin/bash
# Install dependencies and run prebuild for EAS build

echo "📦 Installing dependencies in mobile directory..."
cd /home/runner/workspace/mobile
npm install

echo "🔨 Running Expo prebuild..."
npx expo prebuild --clear --platform ios

echo "✅ Dependencies installed and prebuild completed!"
echo "You can now run: EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production"