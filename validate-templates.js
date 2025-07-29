#!/usr/bin/env node

/**
 * Template Validation Command Script
 * 
 * This script validates all training templates in the database and removes
 * those that are invalid or contain errors.
 * 
 * Usage: node validate-templates.js
 */

import { validateAndCleanupTemplates } from './server/validate-templates.ts';

async function main() {
  console.log('🔍 Starting template validation and cleanup...\n');
  
  try {
    const result = await validateAndCleanupTemplates();
    
    console.log('\n✅ Template validation completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   • Total templates: ${result.totalTemplates}`);
    console.log(`   • Valid templates: ${result.validTemplates}`);
    console.log(`   • Invalid templates: ${result.invalidTemplates}`);
    console.log(`   • Deleted templates: ${result.deletedTemplates}`);
    
    if (result.deletedTemplates > 0) {
      console.log('\n🗑️  Deleted templates:');
      result.validationResults
        .filter(r => !r.isValid)
        .forEach(template => {
          console.log(`   • ${template.name} (ID: ${template.templateId})`);
          console.log(`     Issues: ${template.issues.join(', ')}`);
        });
    }
    
    if (result.validTemplates > 0) {
      console.log('\n✅ Valid templates remaining:');
      result.validationResults
        .filter(r => r.isValid)
        .forEach(template => {
          console.log(`   • ${template.name} (ID: ${template.templateId})`);
        });
    }
    
    console.log('\n🎉 Template database is now clean and optimized!');
    
  } catch (error) {
    console.error('\n❌ Template validation failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the validation
main();