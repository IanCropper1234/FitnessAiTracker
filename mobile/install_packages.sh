#!/bin/bash

echo "Installing packages for mobile app..."

# Navigate to mobile directory
cd /home/runner/workspace/mobile

# Clean any existing installations
rm -rf node_modules package-lock.json

# Install all packages with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

echo "Installation complete!"

# Verify critical packages
echo ""
echo "Verifying critical OAuth packages:"
ls node_modules/expo-auth-session >/dev/null 2>&1 && echo "✅ expo-auth-session installed" || echo "❌ expo-auth-session missing"
ls node_modules/expo-apple-authentication >/dev/null 2>&1 && echo "✅ expo-apple-authentication installed" || echo "❌ expo-apple-authentication missing"
ls node_modules/expo-web-browser >/dev/null 2>&1 && echo "✅ expo-web-browser installed" || echo "❌ expo-web-browser missing"
ls node_modules/expo-crypto >/dev/null 2>&1 && echo "✅ expo-crypto installed" || echo "❌ expo-crypto missing"
ls node_modules/expo-secure-store >/dev/null 2>&1 && echo "✅ expo-secure-store installed" || echo "❌ expo-secure-store missing"