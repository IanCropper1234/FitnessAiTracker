#!/usr/bin/env node
/**
 * Script to check for deprecated toast usage in the codebase
 * Run: node scripts/check-notifications.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_DIR = path.join(__dirname, '../client/src');
const EXCLUDED_FILES = [
  'use-toast.ts',
  'toaster.tsx',
  'toast.tsx',
  'NOTIFICATION_STANDARDS.md'
];

function findFiles(dir, extension = '.tsx') {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extension));
    } else if (file.endsWith(extension) || file.endsWith('.ts')) {
      if (!EXCLUDED_FILES.some(excluded => file.includes(excluded))) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for useToast import
    if (line.includes('useToast') && line.includes('import')) {
      issues.push({
        type: 'deprecated-import',
        line: lineNumber,
        content: line.trim(),
        message: 'Use useIOSNotifications instead of useToast'
      });
    }
    
    // Check for toast() calls
    if (line.includes('toast(') && !line.includes('//')) {
      issues.push({
        type: 'deprecated-call',
        line: lineNumber,
        content: line.trim(),
        message: 'Use showSuccess/showError/showWarning/showInfo instead of toast()'
      });
    }
    
    // Check for toast destructuring
    if (line.includes('{ toast }') && line.includes('useToast')) {
      issues.push({
        type: 'deprecated-destructure',
        line: lineNumber,
        content: line.trim(),
        message: 'Use { showSuccess, showError } = useIOSNotifications() instead'
      });
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Checking for deprecated toast notifications...\n');
  
  const files = findFiles(CLIENT_DIR);
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  files.forEach(filePath => {
    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;
      
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`📁 ${relativePath}`);
      
      issues.forEach(issue => {
        const icon = {
          'deprecated-import': '📦',
          'deprecated-call': '🔔',
          'deprecated-destructure': '🔧'
        }[issue.type] || '⚠️';
        
        console.log(`  ${icon} Line ${issue.line}: ${issue.message}`);
        console.log(`     ${issue.content}`);
      });
      
      console.log();
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Files with issues: ${filesWithIssues}`);
  console.log(`   Total issues: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log(`\n💡 Migration Guide:`);
    console.log(`   See docs/NOTIFICATION_STANDARDS.md for detailed migration instructions`);
    console.log(`   Demo available at: /demo/notifications`);
    
    process.exit(1); // Exit with error code for CI/CD
  } else {
    console.log(`\n✅ All notifications are using the iOS notification system!`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkFile, findFiles };