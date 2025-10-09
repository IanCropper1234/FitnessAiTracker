#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read app.json
const appJsonPath = join(__dirname, '../mobile/app.json');
const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));

// Replace environment variables
const googleClientIdWeb = process.env.GOOGLE_CLIENT_ID_WEB;
const googleClientIdIos = process.env.GOOGLE_CLIENT_ID_IOS;

if (!googleClientIdWeb || !googleClientIdIos) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   GOOGLE_CLIENT_ID_WEB:', googleClientIdWeb ? '✓' : '✗');
  console.error('   GOOGLE_CLIENT_ID_IOS:', googleClientIdIos ? '✓' : '✗');
  process.exit(1);
}

// Update app.json with actual values
appJson.expo.extra.googleClientIdWeb = googleClientIdWeb;
appJson.expo.extra.googleClientIdIos = googleClientIdIos;

// Write updated app.json
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

console.log('✅ app.json configured successfully!');
console.log('   Google Client ID Web:', googleClientIdWeb.substring(0, 30) + '...');
console.log('   Google Client ID iOS:', googleClientIdIos.substring(0, 30) + '...');
