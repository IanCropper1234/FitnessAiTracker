#!/usr/bin/env node

// Test script to verify workout session deletion fix
import fs from 'fs';

const COOKIE = 'session-id=0r67X422t7KubRq4frfpyPyHaf4y5Pyf';
const BASE_URL = 'http://localhost:5000';

async function testSessionDeletion() {
  console.log('🧪 Testing Workout Session Deletion Fix...\n');

  try {
    // Step 1: Get current sessions to find a test session
    console.log('1️⃣ Fetching current workout sessions...');
    const sessionsResponse = await fetch(`${BASE_URL}/api/training/sessions`, {
      headers: { 'Cookie': COOKIE }
    });

    if (sessionsResponse.ok) {
      const sessions = await sessionsResponse.json();
      console.log(`✅ Found ${sessions.length} sessions`);
      
      // Find the "test session"
      const testSession = sessions.find(s => s.name && s.name.toLowerCase().includes('test'));
      
      if (testSession) {
        console.log(`📍 Found test session: ID ${testSession.id}, Name: "${testSession.name}"`);
        
        // Step 2: Try to delete the test session
        console.log('\n2️⃣ Attempting to delete test session...');
        const deleteResponse = await fetch(`${BASE_URL}/api/training/sessions/bulk`, {
          method: 'DELETE',
          headers: { 
            'Cookie': COOKIE,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionIds: [testSession.id] })
        });

        if (deleteResponse.ok) {
          const deleteResult = await deleteResponse.json();
          console.log(`✅ Session deletion successful:`, deleteResult);
          
          // Step 3: Verify session is actually deleted
          console.log('\n3️⃣ Verifying session deletion...');
          const verifyResponse = await fetch(`${BASE_URL}/api/training/sessions`, {
            headers: { 'Cookie': COOKIE }
          });
          
          if (verifyResponse.ok) {
            const updatedSessions = await verifyResponse.json();
            const stillExists = updatedSessions.find(s => s.id === testSession.id);
            
            if (!stillExists) {
              console.log('✅ Session successfully deleted and no longer exists');
              console.log(`📊 Sessions count: ${sessions.length} → ${updatedSessions.length}`);
            } else {
              console.log('❌ Session still exists after deletion attempt');
            }
          }
        } else {
          const error = await deleteResponse.text();
          console.log(`❌ Deletion failed: ${deleteResponse.status} - ${error}`);
        }
      } else {
        console.log('⚠️  No test session found, creating one for testing...');
        
        // Create a test session for deletion testing
        const createResponse = await fetch(`${BASE_URL}/api/training/sessions`, {
          method: 'POST',
          headers: { 
            'Cookie': COOKIE,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test Session for Deletion',
            isCompleted: true,
            programId: null,
            mesocycleId: null
          })
        });
        
        if (createResponse.ok) {
          const newSession = await createResponse.json();
          console.log(`✅ Created test session: ID ${newSession.id}`);
          console.log('🔄 Run this script again to test deletion');
        } else {
          console.log('❌ Failed to create test session');
        }
      }
    } else {
      console.log(`❌ Failed to fetch sessions: ${sessionsResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🎯 Session deletion testing completed!');
}

testSessionDeletion();