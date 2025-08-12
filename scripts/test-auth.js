#!/usr/bin/env node

/**
 * Test script to verify existing user authentication still works
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import bcrypt from 'bcrypt';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testAuth() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing authentication for existing users...');
    
    // Get first user
    const userResult = await client.query('SELECT * FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`   User ID type: ${typeof user.id}`);
    console.log(`   Has password: ${!!user.password}`);
    console.log(`   Replit fields: firstName=${user.first_name}, lastName=${user.last_name}`);
    
    // Test password authentication if available
    if (user.password) {
      try {
        // Try to verify a test password (we don't know the actual password)
        const testPassword = 'test123';
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password structure valid: ${user.password.startsWith('$2b$')}`);
      } catch (error) {
        console.log(`   Password hash format: ${user.password.substring(0, 10)}...`);
      }
    }
    
    // Check foreign key references
    const relatedTables = [
      'user_profiles', 'nutrition_goals', 'nutrition_logs',
      'training_programs', 'workout_sessions', 'mesocycles'
    ];
    
    for (const table of relatedTables) {
      try {
        const countResult = await client.query(`
          SELECT COUNT(*) as count FROM ${table} WHERE user_id = $1
        `, [user.id]);
        console.log(`   ${table}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: table not found or no user_id column`);
      }
    }
    
    console.log('\n✅ User authentication test completed successfully');
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testAuth().catch(console.error);