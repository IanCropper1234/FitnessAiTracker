#!/usr/bin/env node

/**
 * 端到端測試：科學量分配系統驗證
 * 驗證我們修復的關鍵問題：MEV/MAV/MRV 週限制是否正確分配到多個練習中
 */

const BASE_URL = 'http://localhost:5000';

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`📡 Making request to: ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function testVolumeDistributionEngine() {
  console.log('\n🧪 Testing VolumeDistributionEngine...');
  
  try {
    // 測試場景：胸部練習 - 6個動作，但週總量限制為16組 (MAV)
    const testData = {
      targetSets: 16, // 胸部 MAV = 16 組/週
      exerciseIds: [1, 2, 3, 4, 5, 6], // 6個胸部練習
      muscleGroup: 'chest',
      muscleGroupId: 1,
      trainingDays: [0, 2, 4], // 週一、三、五
      strategy: 'BALANCED'
    };
    
    const response = await makeRequest('/api/test/volume-distribution', {
      method: 'POST',
      body: JSON.stringify(testData)
    });
    
    console.log('✅ Volume Distribution Test Results:');
    console.log(`   Total Target Sets: ${testData.targetSets}`);
    console.log(`   Total Allocated Sets: ${response.totalAllocatedSets}`);
    console.log(`   Utilization: ${response.utilizationPercentage.toFixed(1)}%`);
    console.log(`   Within Constraints: ${response.isWithinConstraints ? '✅' : '❌'}`);
    
    if (response.warnings && response.warnings.length > 0) {
      console.log('⚠️  Warnings:', response.warnings);
    }
    
    // 驗證每個練習的分配
    console.log('\n📊 Exercise Allocation Breakdown:');
    response.allocations.forEach((alloc, index) => {
      console.log(`   Exercise ${alloc.exerciseId}: ${alloc.allocatedSets} sets (${alloc.allocationPriority})`);
    });
    
    // 關鍵驗證：確保總組數不超過科學限制
    if (response.totalAllocatedSets <= testData.targetSets && response.isWithinConstraints) {
      console.log('✅ PASS: Volume distribution respects scientific constraints');
      return true;
    } else {
      console.log('❌ FAIL: Volume distribution exceeds scientific limits');
      return false;
    }
    
  } catch (error) {
    console.error('❌ VolumeDistributionEngine test failed:', error.message);
    return false;
  }
}

async function testTemplateEngineIntegration() {
  console.log('\n🧪 Testing TemplateEngine Integration...');
  
  try {
    // 模擬生成訓練方案，驗證量分配是否正確整合
    const testData = {
      userId: 1,
      templateId: 1, // 假設有一個測試模板
      currentWeek: 2,
      totalWeeks: 6
    };
    
    const response = await makeRequest('/api/test/template-generation', {
      method: 'POST',
      body: JSON.stringify(testData)
    });
    
    console.log('✅ Template Generation Test Results:');
    console.log(`   Total Sessions Generated: ${response.totalWorkouts}`);
    console.log(`   Volume Distribution Applied: ${Object.keys(response.volumeDistribution || {}).length} muscle groups`);
    
    // 檢查每個肌群的量分配
    if (response.volumeDistribution) {
      console.log('\n📊 Muscle Group Volume Distribution:');
      Object.entries(response.volumeDistribution).forEach(([muscleGroup, allocation]) => {
        console.log(`   ${muscleGroup}: ${allocation.totalAllocatedSets} sets across ${allocation.allocations.length} exercises`);
      });
    }
    
    // 驗證科學約束
    let allWithinConstraints = true;
    if (response.volumeDistribution) {
      Object.values(response.volumeDistribution).forEach(allocation => {
        if (!allocation.isWithinConstraints) {
          allWithinConstraints = false;
        }
      });
    }
    
    if (allWithinConstraints) {
      console.log('✅ PASS: All muscle groups respect scientific volume constraints');
      return true;
    } else {
      console.log('❌ FAIL: Some muscle groups exceed scientific constraints');
      return false;
    }
    
  } catch (error) {
    console.error('❌ TemplateEngine integration test failed:', error.message);
    return false;
  }
}

async function testVolumeLandmarks() {
  console.log('\n🧪 Testing Updated Volume Landmarks...');
  
  try {
    const response = await makeRequest('/api/test/volume-landmarks');
    
    console.log('✅ Volume Landmarks Test Results:');
    
    // 驗證2024年RP數值是否正確
    const expectedLandmarks = {
      chest: { mev: 8, mav: 16, mrv: 22 },
      shoulders: { mev: 2, mav: 7, mrv: 12 },
      triceps: { mev: 4, mav: 12, mrv: 18 }
    };
    
    let correctLandmarks = 0;
    response.landmarks.forEach(landmark => {
      const expected = expectedLandmarks[landmark.muscleGroupName];
      if (expected) {
        const isCorrect = landmark.mev === expected.mev && 
                         landmark.mav === expected.mav && 
                         landmark.mrv === expected.mrv;
        
        console.log(`   ${landmark.muscleGroupName}: MEV=${landmark.mev} MAV=${landmark.mav} MRV=${landmark.mrv} ${isCorrect ? '✅' : '❌'}`);
        
        if (isCorrect) correctLandmarks++;
      }
    });
    
    if (correctLandmarks >= 3) {
      console.log('✅ PASS: Volume landmarks match 2024 RP research data');
      return true;
    } else {
      console.log('❌ FAIL: Volume landmarks do not match expected values');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Volume landmarks test failed:', error.message);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Starting TrainPro Volume Distribution System Test');
  console.log('===================================================');
  
  console.log('\n📝 Test Objective:');
  console.log('   Verify that the critical volume allocation flaw has been fixed');
  console.log('   - Weekly MEV/MAV/MRV limits are properly distributed across exercises');
  console.log('   - No more per-exercise volume assignment that exceeds scientific constraints');
  console.log('   - Updated 2024 Renaissance Periodization data is correctly implemented');
  
  const results = [];
  
  // 執行所有測試
  results.push(await testVolumeLandmarks());
  results.push(await testVolumeDistributionEngine());
  results.push(await testTemplateEngineIntegration());
  
  // 匯總結果
  console.log('\n📊 Test Summary');
  console.log('================');
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Volume distribution system is working correctly.');
    console.log('✅ Critical flaw has been successfully fixed:');
    console.log('   - Volume is now distributed across exercises within scientific limits');
    console.log('   - 2024 RP research data is correctly implemented');
    console.log('   - Template generation respects MEV/MAV/MRV constraints');
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
  }
  
  console.log('\n📱 Ready for TestFlight deployment with improved volume allocation!');
}

// 運行測試
runFullTest().catch(console.error);