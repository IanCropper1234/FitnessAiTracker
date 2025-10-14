#!/bin/bash

echo "=== EAS Build Hook - Fixing expo-auth-session module ==="

# Navigate to the project directory
cd "$EAS_BUILD_WORKINGDIR" || exit 1

# Fix the expo-auth-session module resolution issue
if [ -f "node_modules/expo-auth-session/build/index.js" ]; then
  echo "Fixing expo-auth-session module..."
  sed -i "s/export \* from '\.\/AuthRequest'/export * from '.\/AuthRequest.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/AuthRequestHooks'/export * from '.\/AuthRequestHooks.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/AuthSession'/export * from '.\/AuthSession.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/Errors'/export * from '.\/Errors.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/Fetch'/export * from '.\/Fetch.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/Discovery'/export * from '.\/Discovery.js'/g" node_modules/expo-auth-session/build/index.js
  sed -i "s/export \* from '\.\/TokenRequest'/export * from '.\/TokenRequest.js'/g" node_modules/expo-auth-session/build/index.js
  echo "✅ Module fix applied"
fi

echo "=== Build hook completed ==="