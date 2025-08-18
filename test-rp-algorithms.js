// RP Algorithm Testing Script
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const COOKIE = 'session-id=0r67X422t7KubRq4frfpyPyHaf4y5Pyf';

async function testRPAlgorithms() {
  console.log('🧪 Testing RP Algorithm Core Integration...\n');

  try {
    // Test 1: Mesocycle Recommendations
    console.log('1️⃣ Testing Mesocycle Recommendations...');
    const mesocycleResponse = await fetch(`${BASE_URL}/api/training/mesocycle-recommendations`, {
      headers: { 'Cookie': COOKIE }
    });
    
    if (mesocycleResponse.ok) {
      const mesocycleData = await mesocycleResponse.json();
      console.log('✅ Mesocycle recommendations retrieved successfully');
      console.log(`   - Should deload: ${mesocycleData.shouldDeload}`);
      console.log(`   - Fatigue score: ${mesocycleData.fatigueFeedback?.overallFatigue}`);
      console.log(`   - Volume data count: ${mesocycleData.nextWeekVolume?.length || 0}\n`);
    } else {
      console.log(`❌ Mesocycle test failed: ${mesocycleResponse.status}\n`);
    }

    // Test 2: Volume Recommendations
    console.log('2️⃣ Testing Volume Recommendations...');
    const volumeResponse = await fetch(`${BASE_URL}/api/training/volume-recommendations`, {
      headers: { 'Cookie': COOKIE }
    });
    
    if (volumeResponse.ok) {
      const volumeData = await volumeResponse.json();
      console.log('✅ Volume recommendations retrieved successfully');
      console.log(`   - Recommendations count: ${volumeData.length}`);
      if (volumeData.length > 0) {
        console.log(`   - Sample muscle group: ${volumeData[0].muscleGroupName}`);
        console.log(`   - Sample recommendation: ${volumeData[0].recommendation}`);
      }
      console.log('');
    } else {
      console.log(`❌ Volume recommendations test failed: ${volumeResponse.status}\n`);
    }

    // Test 3: Fatigue Analysis
    console.log('3️⃣ Testing Fatigue Analysis...');
    const fatigueResponse = await fetch(`${BASE_URL}/api/training/fatigue-analysis`, {
      headers: { 'Cookie': COOKIE }
    });
    
    if (fatigueResponse.ok) {
      const fatigueData = await fatigueResponse.json();
      console.log('✅ Fatigue analysis retrieved successfully');
      console.log(`   - Overall fatigue: ${fatigueData.overallFatigue}`);
      console.log(`   - Recovery trend: ${fatigueData.recoveryTrend}`);
      console.log(`   - Deload recommended: ${fatigueData.deloadRecommended}`);
      console.log(`   - Muscle group fatigue count: ${fatigueData.muscleGroupFatigue?.length || 0}\n`);
    } else {
      console.log(`❌ Fatigue analysis test failed: ${fatigueResponse.status}\n`);
    }

    // Test 4: Check if algorithms are consistent
    console.log('4️⃣ Testing Algorithm Consistency...');
    if (mesocycleResponse.ok && fatigueResponse.ok) {
      const mesocycleData = await fetch(`${BASE_URL}/api/training/mesocycle-recommendations`, {
        headers: { 'Cookie': COOKIE }
      }).then(r => r.json());
      
      const fatigueData = await fetch(`${BASE_URL}/api/training/fatigue-analysis`, {
        headers: { 'Cookie': COOKIE }
      }).then(r => r.json());

      const mesocycleFatigue = mesocycleData.fatigueFeedback?.overallFatigue;
      const directFatigue = fatigueData.overallFatigue;
      
      if (Math.abs(mesocycleFatigue - directFatigue) < 0.1) {
        console.log('✅ Fatigue calculations are consistent across services');
        console.log(`   - Mesocycle fatigue: ${mesocycleFatigue}`);
        console.log(`   - Direct fatigue: ${directFatigue}\n`);
      } else {
        console.log('⚠️ Fatigue calculations may be inconsistent');
        console.log(`   - Mesocycle fatigue: ${mesocycleFatigue}`);
        console.log(`   - Direct fatigue: ${directFatigue}\n`);
      }
    }

    console.log('🎯 RP Algorithm testing completed!\n');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

testRPAlgorithms();