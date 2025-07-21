const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/analytics/comprehensive/1?days=14',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const analytics = JSON.parse(data);
      console.log('--- Macro Adjustment Analysis ---');
      console.log('Diet Goal:', analytics.macroAdjustment?.currentDietGoal || 'Not found');
      console.log('Weekly Weight Target:', analytics.macroAdjustment?.weeklyWeightTarget || 'Not found');
      console.log('Actual Weight Change:', analytics.macroAdjustment?.weightChange || 'Not found');
      console.log('Recommendation:', analytics.macroAdjustment?.recommendation || 'Not found');
      console.log('Adjustment Amount:', analytics.macroAdjustment?.adjustmentAmount || 'Not found');
      console.log('Current Calories:', analytics.macroAdjustment?.currentCalories || 'Not found');
      console.log('New Calories:', analytics.macroAdjustment?.newCalories || 'Not found');
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();