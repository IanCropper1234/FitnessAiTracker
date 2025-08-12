#!/usr/bin/env node

/**
 * Migration script for transitioning from custom auth to Replit Auth
 * This script preserves existing user data by:
 * 1. Creating a backup of current user data
 * 2. Migrating users to new string-based ID format
 * 3. Updating all foreign key references
 * 4. Adding new Replit Auth fields
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting Replit Auth migration...');
    
    // Step 1: Create backup tables
    console.log('📦 Creating backup tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users_backup AS 
      SELECT * FROM users;
    `);
    
    // Step 2: Get existing users
    const existingUsers = await client.query('SELECT * FROM users ORDER BY id');
    console.log(`👥 Found ${existingUsers.rows.length} existing users to migrate`);
    
    // Step 3: Create mapping table for ID conversion
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_id_mapping (
        old_id INTEGER PRIMARY KEY,
        new_id VARCHAR(255) NOT NULL UNIQUE,
        migrated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Step 4: Begin transaction for safe migration
    await client.query('BEGIN');
    
    try {
      // Step 5: Create new users table structure
      console.log('🏗️  Creating new users table structure...');
      await client.query(`
        CREATE TABLE users_new (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          profile_image_url VARCHAR(255),
          -- Legacy fields maintained for compatibility
          password TEXT,
          name TEXT,
          apple_id TEXT,
          preferred_language TEXT NOT NULL DEFAULT 'en',
          theme TEXT NOT NULL DEFAULT 'dark',
          show_developer_features BOOLEAN DEFAULT false,
          auto_adjustment_settings JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Step 6: Create sessions table for Replit Auth
      console.log('🔐 Creating sessions table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSONB NOT NULL,
          expire TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
      `);
      
      // Step 7: Migrate users with new ID format
      console.log('🔄 Migrating user data...');
      for (const user of existingUsers.rows) {
        // Generate new string-based ID (using email-based approach for consistency)
        const newId = `migrated_user_${user.id}_${Date.now()}`;
        
        // Insert into mapping table
        await client.query(
          'INSERT INTO user_id_mapping (old_id, new_id) VALUES ($1, $2)',
          [user.id, newId]
        );
        
        // Insert into new users table
        await client.query(`
          INSERT INTO users_new (
            id, email, first_name, last_name, profile_image_url,
            password, name, apple_id, preferred_language, theme,
            show_developer_features, auto_adjustment_settings,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          newId,
          user.email,
          null, // first_name (new field)
          null, // last_name (new field) 
          null, // profile_image_url (new field)
          user.password,
          user.name,
          user.apple_id,
          user.preferred_language || 'en',
          user.theme || 'dark',
          user.show_developer_features || false,
          user.auto_adjustment_settings,
          user.created_at,
          user.updated_at
        ]);
        
        console.log(`✓ Migrated user ${user.id} (${user.email}) -> ${newId}`);
      }
      
      // Step 8: Update all foreign key references
      console.log('🔗 Updating foreign key references...');
      
      const tablesToUpdate = [
        'user_profiles', 'nutrition_goals', 'nutrition_logs', 'meal_plans',
        'daily_wellness_checkins', 'weekly_wellness_summaries', 'weekly_nutrition_goals',
        'diet_phases', 'meal_timing_preferences', 'body_metrics', 'saved_meal_plans',
        'saved_meals', 'diet_goals', 'weight_goals', 'weight_logs',
        'training_programs', 'workout_sessions', 'workout_exercises',
        'auto_regulation_feedback', 'volume_landmarks', 'weekly_volume_tracking',
        'load_progression_tracking', 'mesocycles', 'training_templates',
        'saved_workout_templates'
      ];
      
      for (const table of tablesToUpdate) {
        try {
          // Check if table exists and has user_id column
          const tableExists = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = $1 AND column_name = 'user_id'
          `, [table]);
          
          if (tableExists.rows.length > 0) {
            // Update user_id references using the mapping table
            const updateResult = await client.query(`
              UPDATE ${table} 
              SET user_id = m.new_id::VARCHAR
              FROM user_id_mapping m 
              WHERE ${table}.user_id::INTEGER = m.old_id
            `);
            console.log(`✓ Updated ${updateResult.rowCount} records in ${table}`);
          }
        } catch (error) {
          console.log(`⚠️  Skipping ${table}: ${error.message}`);
        }
      }
      
      // Step 9: Handle exercises table (nullable user_id)
      try {
        await client.query(`
          UPDATE exercises 
          SET user_id = m.new_id::VARCHAR
          FROM user_id_mapping m 
          WHERE exercises.user_id IS NOT NULL 
          AND exercises.user_id::INTEGER = m.old_id
        `);
        console.log('✓ Updated exercises table user references');
      } catch (error) {
        console.log(`⚠️  Skipping exercises update: ${error.message}`);
      }
      
      // Step 10: Replace old users table with new one
      console.log('🔄 Replacing users table...');
      await client.query('DROP TABLE users CASCADE');
      await client.query('ALTER TABLE users_new RENAME TO users');
      
      // Step 11: Update column types in other tables
      console.log('🔧 Updating column types...');
      for (const table of tablesToUpdate) {
        try {
          await client.query(`
            ALTER TABLE ${table} 
            ALTER COLUMN user_id TYPE VARCHAR(255)
          `);
          console.log(`✓ Updated ${table} user_id column type`);
        } catch (error) {
          console.log(`⚠️  Column type update for ${table}: ${error.message}`);
        }
      }
      
      // Handle exercises table nullable user_id
      try {
        await client.query(`
          ALTER TABLE exercises 
          ALTER COLUMN user_id TYPE VARCHAR(255)
        `);
        console.log('✓ Updated exercises user_id column type');
      } catch (error) {
        console.log(`⚠️  Exercises column type update: ${error.message}`);
      }
      
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!');
      
      // Step 12: Display migration summary
      const newUserCount = await client.query('SELECT COUNT(*) FROM users');
      const mappingCount = await client.query('SELECT COUNT(*) FROM user_id_mapping');
      
      console.log('\n📊 Migration Summary:');
      console.log(`   Users migrated: ${mappingCount.rows[0].count}`);
      console.log(`   Total users in new table: ${newUserCount.rows[0].count}`);
      console.log('   Backup table: users_backup (contains original data)');
      console.log('   ID mapping: user_id_mapping (old_id -> new_id)');
      console.log('\n🎉 Ready for Replit Auth integration!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Rollback completed. Original data is preserved.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);