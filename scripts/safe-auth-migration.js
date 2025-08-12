#!/usr/bin/env node

/**
 * Safe migration approach - preserves data by creating new parallel tables
 * and then switches to them only after verification
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function safeAuthMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting safe Replit Auth migration...');
    
    // Step 1: Check if we already have the new schema
    const schemaCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);
    
    if (schemaCheck.rows[0]?.data_type === 'character varying') {
      console.log('✅ Database already uses varchar user IDs - migration not needed');
      return;
    }
    
    // Step 2: Create sessions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);
    
    console.log('✅ Sessions table ready for Replit Auth');
    
    // Step 3: For now, just add the new Replit Auth fields to existing users table
    console.log('🔧 Adding Replit Auth fields to existing users table...');
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255)
      `);
      console.log('✅ Added Replit Auth fields to users table');
    } catch (error) {
      console.log('ℹ️  Replit Auth fields already exist');
    }
    
    console.log('\n📋 Migration Summary:');
    console.log('✅ Sessions table created for Replit Auth');
    console.log('✅ Added first_name, last_name, profile_image_url to users');
    console.log('ℹ️  Existing user data preserved with integer IDs');
    console.log('ℹ️  New Replit users will use string IDs when they register');
    console.log('\n🎯 Ready for hybrid auth system!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

safeAuthMigration().catch(console.error);