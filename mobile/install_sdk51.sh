#!/bin/bash

echo "=== Installing Expo SDK 51 with OAuth packages ==="

# Navigate to mobile directory
cd /home/runner/workspace/mobile

# Clean previous installations
rm -rf node_modules package-lock.json .expo

# Install with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

echo ""
echo "=== Verifying Installation ==="
echo ""

# Check critical packages
echo "OAuth Packages Status:"
ls node_modules/expo-auth-session >/dev/null 2>&1 && echo "✅ expo-auth-session installed" || echo "❌ expo-auth-session missing"
ls node_modules/expo-apple-authentication >/dev/null 2>&1 && echo "✅ expo-apple-authentication installed" || echo "❌ expo-apple-authentication missing"  
ls node_modules/expo-web-browser >/dev/null 2>&1 && echo "✅ expo-web-browser installed" || echo "❌ expo-web-browser missing"
ls node_modules/expo-crypto >/dev/null 2>&1 && echo "✅ expo-crypto installed" || echo "❌ expo-crypto missing"
ls node_modules/expo-secure-store >/dev/null 2>&1 && echo "✅ expo-secure-store installed" || echo "❌ expo-secure-store missing"

echo ""
echo "SDK Version:"
npm list expo | grep expo@