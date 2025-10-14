#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix expo-auth-session module resolution issue
const indexPath = path.join(__dirname, 'node_modules/expo-auth-session/build/index.js');

if (fs.existsSync(indexPath)) {
  // Read the current content
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace ES module exports with file extensions
  content = content.replace(/export \* from '\.\/AuthRequest'/g, "export * from './AuthRequest.js'");
  content = content.replace(/export \* from '\.\/AuthRequestHooks'/g, "export * from './AuthRequestHooks.js'");
  content = content.replace(/export \* from '\.\/AuthSession'/g, "export * from './AuthSession.js'");
  content = content.replace(/export \* from '\.\/Errors'/g, "export * from './Errors.js'");
  content = content.replace(/export \* from '\.\/Fetch'/g, "export * from './Fetch.js'");
  content = content.replace(/export \* from '\.\/Discovery'/g, "export * from './Discovery.js'");
  content = content.replace(/export \* from '\.\/TokenRequest'/g, "export * from './TokenRequest.js'");
  content = content.replace(/export \* from '\.\/AuthRequest\.types'/g, "export * from './AuthRequest.types.js'");
  content = content.replace(/export \* from '\.\/AuthSession\.types'/g, "export * from './AuthSession.types.js'");
  content = content.replace(/export \* from '\.\/TokenRequest\.types'/g, "export * from './TokenRequest.types.js'");
  content = content.replace(/export \* from '\.\/providers\/Provider\.types'/g, "export * from './providers/Provider.types.js'");
  
  // Write the fixed content back
  fs.writeFileSync(indexPath, content);
  console.log('✅ Fixed expo-auth-session module resolution');
} else {
  console.log('❌ expo-auth-session not found');
}