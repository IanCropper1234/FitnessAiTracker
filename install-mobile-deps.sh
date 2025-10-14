#!/bin/bash

echo "=== Installing SDK 51 dependencies in mobile folder ==="

# Make sure we're in the mobile directory
cd /home/runner/workspace/mobile

# Clean previous installations
rm -rf node_modules package-lock.json .expo

# Install all dependencies with legacy peer deps
npm install --legacy-peer-deps

echo ""
echo "=== Verification ==="
if [ -d "node_modules/expo-auth-session" ]; then
  echo "✅ expo-auth-session installed"
else  
  echo "❌ expo-auth-session missing"
fi

if [ -d "node_modules/expo-apple-authentication" ]; then
  echo "✅ expo-apple-authentication installed"
else
  echo "❌ expo-apple-authentication missing"
fi

if [ -d "node_modules/expo-web-browser" ]; then
  echo "✅ expo-web-browser installed"
else
  echo "❌ expo-web-browser missing"
fi

if [ -d "node_modules/expo-crypto" ]; then
  echo "✅ expo-crypto installed"
else
  echo "❌ expo-crypto missing"
fi

if [ -d "node_modules/expo-secure-store" ]; then
  echo "✅ expo-secure-store installed"
else
  echo "❌ expo-secure-store missing"
fi

echo ""
echo "Installation complete!"