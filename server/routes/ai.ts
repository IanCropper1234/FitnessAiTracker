import { Router, Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { selectModelForUser } from '../config/ai-config';
import { monitorAICall, aiPerformanceMonitor } from '../services/ai-performance-monitor';
import { promptRegistry } from '../services/ai-prompt-registry';

const router = Router();

// Use the global auth middleware - no need for custom auth in AI routes

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Exercise Recommendations
router.post('/exercise-recommendations', async (req, res) => {
  try {
    const { userGoals, currentExercises, trainingHistory, muscleGroupFocus, experienceLevel, availableEquipment, timeConstraints, injuryRestrictions } = req.body;
    const userId = req.userId;

    // Debug logging
    console.log('AI Exercise Recommendations Request:');
    console.log('- User Goals:', userGoals);
    console.log('- Muscle Group Focus:', muscleGroupFocus);
    console.log('- Experience Level:', experienceLevel);
    console.log('- Available Equipment:', availableEquipment);
    console.log('- Current Exercises count:', currentExercises?.length || 0);
    console.log('- Current Exercises sample:', currentExercises?.slice(0, 3)?.map((ex: any) => ({ name: ex.name, category: ex.category })) || 'None');
    console.log('- Training History count:', trainingHistory?.length || 0);

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('exerciseRecommendations', userId);
    const abTestGroup = process.env.AI_AB_TEST_ENABLED === 'true' ? 
      (modelConfig.name === process.env.AI_AB_TEST_MODEL ? 'test' : 'control') : 
      undefined;

    const systemPrompt = `You are an expert fitness coach. You MUST always respond with valid JSON containing a recommendations array with at least 4 exercises.

    Your response MUST follow this exact format:
    {
      "recommendations": [
        {
          "exerciseName": "exact name from exercise library",
          "category": "push/pull/legs",
          "primaryMuscle": "muscle name",
          "muscleGroups": ["muscle1", "muscle2"],
          "equipment": "equipment type",
          "difficulty": "beginner/intermediate/advanced",
          "sets": 3,
          "reps": "8-12",
          "restPeriod": 90,
          "reasoning": "scientific explanation",
          "progressionNotes": "how to progress",
          "specialMethod": null,
          "specialConfig": null,
          "rpIntensity": 8,
          "volumeContribution": 3
        }
      ],
      "reasoning": "overall analysis",
      "rpConsiderations": "evidence-based insights", 
      "progressionPlan": "progression strategy"
    }`;

    const userPrompt = `RESPOND WITH VALID JSON ONLY.

    User Request:
    - Goals: ${userGoals?.join(', ') || 'Muscle Hypertrophy'}
    - Muscle Focus: ${muscleGroupFocus?.join(', ') || 'Full body'}
    - Experience: ${experienceLevel || 'intermediate'}
    - Equipment: ${availableEquipment?.join(', ') || 'Full gym'}

    Exercise Library (MUST use exact names):
    ${currentExercises?.slice(0, 50).map((ex: any) => `"${ex.name}"`).join(', ') || 'Bench Press, Squats, Deadlifts, Pull-ups, Rows'}

    Requirements:
    1. MUST return JSON with "recommendations" array containing exactly 4-5 exercises
    2. MUST use exact exercise names from library above
    3. MUST target muscle groups: ${muscleGroupFocus?.join(', ') || 'all'}
    4. Each exercise needs: exerciseName, category, primaryMuscle, muscleGroups, equipment, difficulty, sets, reps, restPeriod, reasoning, progressionNotes, specialMethod, specialConfig, rpIntensity, volumeContribution

    Respond with JSON only - no other text.`;

    // Monitor AI call performance
    const result = await monitorAICall({
      service: 'exercise-recommendations',
      model: modelConfig.name,
      userId,
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      const params: any = {
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: modelConfig.maxTokens
      };

      // Only add temperature for non-GPT-5 models (GPT-5 only supports default value of 1)
      if (!modelConfig.name.startsWith('gpt-5')) {
        params.temperature = modelConfig.temperature;
      }

      const response = await openai.chat.completions.create(params);
      
      console.log('Raw AI response content:', response.choices[0].message.content);
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content that failed to parse:', response.choices[0].message.content);
        // Return a fallback response
        aiResponse = {
          recommendations: [],
          reasoning: "Failed to parse AI response",
          rpConsiderations: "Error in AI processing",
          progressionPlan: "Please try again"
        };
      }
      
      // Validate and ensure we have recommendations
      const recommendations = aiResponse.recommendations || [];
      console.log('AI Response validation:');
      console.log('- Recommendations count:', recommendations.length);
      console.log('- Requested muscle groups:', muscleGroupFocus);
      console.log('- Recommended exercises with muscles:', recommendations.map((r: any) => ({ 
        name: r.exerciseName, 
        primary: r.primaryMuscle, 
        groups: r.muscleGroups 
      })));
      
      // Check muscle group coverage
      const targetedMuscles = new Set();
      recommendations.forEach((rec: any) => {
        if (rec.primaryMuscle) targetedMuscles.add(rec.primaryMuscle);
        if (rec.muscleGroups && Array.isArray(rec.muscleGroups)) {
          rec.muscleGroups.forEach((muscle: string) => targetedMuscles.add(muscle));
        }
      });
      console.log('- Muscle groups covered:', Array.from(targetedMuscles));
      
      if (recommendations.length === 0) {
        console.warn('AI returned no recommendations - this should not happen');
        // Log the full AI response for debugging
        console.log('Full AI response:', JSON.stringify(aiResponse, null, 2));
      }
      
      return {
        recommendations: recommendations,
        reasoning: aiResponse.reasoning || 'AI analysis completed successfully.',
        rpConsiderations: aiResponse.rpConsiderations || 'Applied evidence-based training principles.',
        progressionPlan: aiResponse.progressionPlan || 'Progress gradually with consistent training.'
      };
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error getting AI exercise recommendations:', error);
    res.status(500).json({ 
      message: 'Failed to get AI recommendations',
      error: error.message 
    });
  }
});

// AI Nutrition Analysis
router.post('/nutrition-analysis', async (req, res) => {
  try {
    const { userProfile, nutritionData, timeRange, healthConditions, primaryGoal } = req.body;
    const userId = Number(req.userId);

    // If no user profile provided, fetch from database
    let profile = userProfile;
    if (!profile) {
      const { db } = await import('../db');
      const { userProfiles, users } = await import('../../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const [userProfileData] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, Number(userId)))
        .limit(1);
      
      const [userData] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(userId)))
        .limit(1);
      
      // Improved profile handling with better default value management
      const hasCompleteProfile = userProfileData?.age && userProfileData?.gender && userProfileData?.weight && userProfileData?.height;
      
      profile = {
        age: userProfileData?.age || null,
        gender: userProfileData?.gender || null,
        weight: userProfileData?.weight || null,
        height: userProfileData?.height || null,
        activityLevel: userProfileData?.activityLevel || 'moderate',
        goals: [primaryGoal || 'health optimization'],
        healthConditions: healthConditions ? [healthConditions] : [],
        isProfileComplete: hasCompleteProfile
      };
    }

    // If no nutrition data provided, fetch recent logs
    let nutrition = nutritionData;
    if (!nutrition) {
      const { db } = await import('../db');
      const { nutritionLogs } = await import('../../shared/schema');
      const { eq, gte, and } = await import('drizzle-orm');
      
      // Fix time range mapping to match frontend values
      let daysAgo = 7; // default
      if (timeRange) {
        if (timeRange.includes('7') || timeRange === 'Last 7 Days') daysAgo = 7;
        else if (timeRange.includes('14')) daysAgo = 14;
        else if (timeRange.includes('30')) daysAgo = 30;
        else if (timeRange.includes('90')) daysAgo = 90;
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      nutrition = await db
        .select()
        .from(nutritionLogs)
        .where(and(eq(nutritionLogs.userId, Number(userId)), gte(nutritionLogs.date, startDate)))
        .orderBy(nutritionLogs.date)
        .limit(200); // Increase sample size for better analysis accuracy
    }

    if (!nutrition || nutrition.length === 0) {
      return res.status(400).json({ 
        message: "No nutrition data found. Please log some meals first to get personalized analysis." 
      });
    }

    // Analyze data quality for better AI instruction
    const dataQualityMetrics = {
      totalRecords: nutrition.length,
      recordsWithMicronutrients: nutrition.filter((n: any) => n.micronutrients && Object.keys(n.micronutrients).length > 0).length,
      recordsWithCompleteMicronutrients: nutrition.filter((n: any) => {
        const micro = n.micronutrients || {};
        // Count meaningful micronutrient values (more realistic approach)
        const meaningfulValues = Object.keys(micro).filter(key => {
          const value = micro[key];
          return value !== null && 
                 value !== undefined && 
                 value !== 0 && 
                 value !== '' &&
                 typeof value === 'number' &&
                 value > 0;
        }).length;
        // Consider record complete if it has at least 2 meaningful micronutrients (more realistic standard)
        return meaningfulValues >= 2;
      }).length,
      avgMicronutrientsPerRecord: nutrition.reduce((acc: number, n: any) => {
        const micro = n.micronutrients || {};
        return acc + Object.keys(micro).filter(key => {
          const value = micro[key];
          return value !== null && 
                 value !== undefined && 
                 value !== 0 && 
                 value !== '' &&
                 typeof value === 'number' &&
                 value > 0;
        }).length;
      }, 0) / nutrition.length
    };
    
    // Enhanced completeness score that considers both presence and completeness of micronutrients
    const basicMicronutrientPresence = (dataQualityMetrics.recordsWithMicronutrients / dataQualityMetrics.totalRecords) * 100;
    const comprehensiveDataScore = (dataQualityMetrics.recordsWithCompleteMicronutrients / dataQualityMetrics.totalRecords) * 100;
    
    // Weighted score: 60% for having any micronutrients, 40% for comprehensive data
    const dataCompletenessScore = (basicMicronutrientPresence * 0.6) + (comprehensiveDataScore * 0.4);

    // Calculate macronutrient totals for better AI analysis
    const macronutrientTotals = nutrition.reduce((totals: any, log: any) => {
      return {
        totalCalories: totals.totalCalories + (parseFloat(log.calories) || 0),
        totalProtein: totals.totalProtein + (parseFloat(log.protein) || 0),
        totalCarbs: totals.totalCarbs + (parseFloat(log.carbs) || 0),
        totalFat: totals.totalFat + (parseFloat(log.fat) || 0),
        recordsCount: totals.recordsCount + 1
      };
    }, {
      totalCalories: 0,
      totalProtein: 0, 
      totalCarbs: 0,
      totalFat: 0,
      recordsCount: 0
    });

    // Calculate daily averages
    const daysInPeriod = timeRange === 'Last 7 Days' || timeRange === '7days' ? 7 :
                        timeRange === '14days' ? 14 :
                        timeRange === '30days' ? 30 :
                        timeRange === '90days' ? 90 : 7;
    
    const dailyAverages = {
      avgCaloriesPerDay: macronutrientTotals.totalCalories / daysInPeriod,
      avgProteinPerDay: macronutrientTotals.totalProtein / daysInPeriod,
      avgCarbsPerDay: macronutrientTotals.totalCarbs / daysInPeriod,
      avgFatPerDay: macronutrientTotals.totalFat / daysInPeriod
    };

    console.log('🔍 Macronutrient Analysis Data:', {
      totalRecords: nutrition.length,
      timeRange,
      daysInPeriod,
      macronutrientTotals,
      dailyAverages
    });

    // Debug micronutrient data quality
    console.log('🧪 Micronutrient Data Quality Debug:', {
      totalRecords: dataQualityMetrics.totalRecords,
      recordsWithMicronutrients: dataQualityMetrics.recordsWithMicronutrients,
      recordsWithCompleteMicronutrients: dataQualityMetrics.recordsWithCompleteMicronutrients,
      avgMicronutrientsPerRecord: dataQualityMetrics.avgMicronutrientsPerRecord.toFixed(1),
      basicMicronutrientPresence: basicMicronutrientPresence.toFixed(1) + '%',
      comprehensiveDataScore: comprehensiveDataScore.toFixed(1) + '%',
      finalCompletenessScore: dataCompletenessScore.toFixed(1) + '%'
    });
    
    // Sample micronutrient data from first few records for debugging
    nutrition.slice(0, 3).forEach((record: any, index: number) => {
      const micro = record.micronutrients || {};
      const meaningfulMicroCount = Object.keys(micro).filter(key => {
        const value = micro[key];
        return value !== null && value !== undefined && value !== 0 && value !== '' && typeof value === 'number' && value > 0;
      }).length;
      
      console.log(`📊 Sample Record ${index + 1}:`, {
        foodName: record.foodName || 'Unknown',
        totalMicronutrients: Object.keys(micro).length,
        meaningfulMicronutrients: meaningfulMicroCount,
        sampleMicronutrients: Object.keys(micro).slice(0, 8),
        actualMicroData: Object.fromEntries(
          Object.entries(micro).slice(0, 8).map(([key, value]) => [key, value])
        ),
        isConsideredComplete: meaningfulMicroCount >= 2
      });
    });

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('nutritionAnalysis', userId ? userId.toString() : '1');
    const abTestGroup = process.env.AI_AB_TEST_ENABLED === 'true' ? 
      (modelConfig.name === process.env.AI_AB_TEST_MODEL ? 'test' : 'control') : 
      undefined;

    const systemPrompt = `You are an expert nutrition scientist and registered dietitian specializing in comprehensive nutritional analysis. You provide detailed micronutrient analysis, RDA comparisons, and personalized nutrition recommendations based on individual health profiles and dietary intake data.

    Your expertise includes:
    1. Micronutrient analysis and deficiency identification
    2. RDA/DRI calculations based on age, gender, activity level
    3. Personalized nutrition recommendations
    4. Health condition considerations
    5. Supplementation guidance
    6. Evidence-based nutritional science`;

    const userPrompt = `Analyze the following nutrition data and provide comprehensive insights:

    **User Profile**:
    - Age: ${profile?.age || 'Not provided (affects RDA calculations)'}
    - Gender: ${profile?.gender || 'Not specified (affects RDA calculations)'}
    - Weight: ${profile?.weight ? profile.weight + 'kg' : 'Not provided (affects calorie and protein needs assessment)'}
    - Height: ${profile?.height ? profile.height + 'cm' : 'Not provided (affects BMR calculations)'}
    - Activity Level: ${profile?.activityLevel || 'moderate'}
    - Goals: ${profile?.goals?.join(', ') || 'health optimization'}
    ${profile?.healthConditions?.length ? `- Health Conditions: ${profile.healthConditions.join(', ')}` : ''}
    - Profile Completeness: ${profile?.isProfileComplete ? 'Complete' : 'Incomplete - some RDA calculations may use general population averages'}
    
    **IMPORTANT**: When user profile data is incomplete (marked above), use general population averages for RDA calculations but clearly note this limitation in your analysis.

    **Analysis Period**: ${timeRange || '7 days'} (${nutrition?.length || 0} total records analyzed over ${daysInPeriod} days)
    **Data Quality Notice**: Some nutrition entries may lack complete micronutrient data. Analysis confidence varies based on data completeness.
    
    **MACRONUTRIENT TOTALS & DAILY AVERAGES**:
    - Total Period: ${daysInPeriod} days
    - Total Calories: ${macronutrientTotals.totalCalories.toFixed(1)} cal (avg: ${dailyAverages.avgCaloriesPerDay.toFixed(1)} cal/day)
    - Total Protein: ${macronutrientTotals.totalProtein.toFixed(1)}g (avg: ${dailyAverages.avgProteinPerDay.toFixed(1)}g/day)
    - Total Carbs: ${macronutrientTotals.totalCarbs.toFixed(1)}g (avg: ${dailyAverages.avgCarbsPerDay.toFixed(1)}g/day)
    - Total Fat: ${macronutrientTotals.totalFat.toFixed(1)}g (avg: ${dailyAverages.avgFatPerDay.toFixed(1)}g/day)
    
    **IMPORTANT**: Use the totals and daily averages above for your macronutrient analysis. The protein daily average of ${dailyAverages.avgProteinPerDay.toFixed(1)}g should be used as the "currentIntake" for protein analysis.
    
    **Nutrition Data Sample**: ${JSON.stringify(nutrition?.slice(0, 10) || [], null, 2)}
    
    **DATA QUALITY ASSESSMENT**:
    - Total nutrition records analyzed: ${dataQualityMetrics.totalRecords}
    - Records with micronutrient data: ${dataQualityMetrics.recordsWithMicronutrients} (${Math.round((dataQualityMetrics.recordsWithMicronutrients/dataQualityMetrics.totalRecords)*100)}%)
    - Records with comprehensive micronutrients: ${dataQualityMetrics.recordsWithCompleteMicronutrients} (${Math.round(dataCompletenessScore)}%)
    - Average micronutrients per record: ${Math.round(dataQualityMetrics.avgMicronutrientsPerRecord)}
    - Data completeness score: ${Math.round(dataCompletenessScore)}%
    
    **CRITICAL ANALYSIS INSTRUCTIONS**:
    1. Base your confidence scores on actual data availability
    2. If data completeness is below 70%, clearly state limitations in micronutrient analysis
    3. Do not provide definitive deficiency diagnoses when source data is incomplete
    4. Include data quality warnings in your insights when appropriate
    5. Adjust your overall rating to reflect data quality (lower scores for incomplete data)

    Provide a comprehensive analysis in JSON format:
    {
      "overallRating": number (1-10 scale, adjusted based on data quality),
      "dataQuality": {
        "completenessScore": number (0-100),
        "reliabilityNote": "string - explanation of data limitations",
        "recommendedActions": ["string - suggestions for improving data quality"]
      },
      "macronutrientAnalysis": {
        "proteinStatus": "string",
        "carbStatus": "string", 
        "fatStatus": "string"
      },
      "micronutrientAnalysis": [
        {
          "nutrient": "string",
          "currentIntake": number,
          "recommendedIntake": number,
          "unit": "string",
          "status": "deficient|adequate|excessive",
          "healthImpact": "string",
          "foodSources": ["string"],
          "supplementRecommendation": "string or null"
        }
      ],
      "rdaComparison": {
        "meetsRDA": ["string"],
        "belowRDA": ["string"],
        "exceedsRDA": ["string"]
      },
      "personalizedInsights": [
        {
          "category": "string",
          "insight": "string",
          "actionItems": ["string"],
          "priority": "low|medium|high"
        }
      ],
      "supplementationAdvice": ["string"],
      "nextSteps": ["string"]
    }`;

    // Monitor AI call performance using GPT-5 Adapter
    const { GPT5Adapter } = await import('../services/gpt5-adapter');
    const gpt5Adapter = new GPT5Adapter();

    const result = await monitorAICall({
      service: 'nutrition-analysis',
      model: modelConfig.name,
      userId: userId ? userId.toString() : '1',
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      const response = await gpt5Adapter.createCompletion({
        model: modelConfig,
        systemPrompt,
        userPrompt,
        responseFormat: { type: "json_object" }
      });

      const responseContent = response.content;
      if (!responseContent) {
        throw new Error('Empty response from AI');
      }

      return JSON.parse(responseContent);
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error analyzing nutrition:', error);
    res.status(500).json({ 
      message: error.message.includes('pattern') ? error.message : 'Failed to analyze nutrition',
      error: error.message 
    });
  }
});

// AI Food Analysis from Image
router.post('/food-analysis', async (req, res) => {
  try {
    const { image, context } = req.body;
    const userId = req.userId;

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('foodAnalysis', userId);
    const abTestGroup = process.env.AI_AB_TEST_ENABLED === 'true' ? 
      (modelConfig.name === process.env.AI_AB_TEST_MODEL ? 'test' : 'control') : 
      undefined;

    const systemPrompt = `You are an expert food recognition and nutrition analysis AI. You can identify foods from images and provide detailed nutritional information. Analyze food images with high accuracy and provide comprehensive nutrition data.`;

    const userPrompt = `Analyze this food image and provide detailed nutritional information:

    ${context?.mealType ? `Meal Type: ${context.mealType}` : ''}
    ${context?.estimatedPortion ? `Estimated Portion: ${context.estimatedPortion}` : ''}

    Provide analysis in JSON format:
    {
      "foodItems": [
        {
          "name": "string",
          "confidence": number (0-1),
          "estimatedWeight": number,
          "nutrition": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number,
            "fiber": number,
            "sugar": number
          }
        }
      ],
      "totalNutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      },
      "confidence": number (0-1),
      "suggestions": ["string"]
    }`;

    // Monitor AI call performance using GPT-5 Adapter
    const { GPT5Adapter } = await import('../services/gpt5-adapter');
    const gpt5Adapter = new GPT5Adapter();

    const result = await monitorAICall({
      service: 'food-analysis',
      model: modelConfig.name,
      userId,
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      // For image analysis, we need to use the vision capabilities
      const response = await gpt5Adapter.createVisionCompletion(
        modelConfig,
        systemPrompt,
        userPrompt,
        image,
        { type: "json_object" }
      );

      const responseContent = response.content;
      if (!responseContent) {
        throw new Error('Empty response from AI');
      }

      return JSON.parse(responseContent);
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error analyzing food image:', error);
    res.status(500).json({ 
      message: 'Failed to analyze food image',
      error: error.message 
    });
  }
});

// Program Optimization Analysis
router.post('/program-optimization', async (req, res) => {
  try {
    const { currentProgram, userGoals, performanceData } = req.body;
    const userId = req.userId;

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('programOptimization', userId);
    const abTestGroup = process.env.AI_AB_TEST_ENABLED === 'true' ? 
      (modelConfig.name === process.env.AI_AB_TEST_MODEL ? 'test' : 'control') : 
      undefined;

    const systemPrompt = `You are an expert evidence-based fitness analyst. Analyze training programs for optimization opportunities based on:
    1. Volume distribution across muscle groups
    2. Exercise selection efficiency 
    3. Fatigue management
    4. Progressive overload potential
    5. Scientific periodization principles`;

    const userPrompt = `Analyze this training program and provide optimization suggestions:

    **Current Program**: ${JSON.stringify(currentProgram, null, 2)}
    **User Goals**: ${userGoals?.join(', ') || 'General fitness'}
    **Performance Data**: ${JSON.stringify(performanceData, null, 2)}

    Provide analysis and optimization suggestions in JSON format:
    {
      "analysis": "string - overall program assessment",
      "optimizations": ["string array - specific improvements"],
      "scientificAdjustments": ["string array - Evidence-based methodology adjustments"]
    }`;

    // Monitor AI call performance
    const result = await monitorAICall({
      service: 'program-optimization',
      model: modelConfig.name,
      userId,
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      const params: any = {
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: modelConfig.maxTokens
      };

      // Only add temperature for non-GPT-5 models
      if (!modelConfig.name.startsWith('gpt-5')) {
        params.temperature = modelConfig.temperature;
      }

      const response = await openai.chat.completions.create(params);

      return JSON.parse(response.choices[0].message.content || '{}');
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error analyzing program:', error);
    res.status(500).json({ 
      message: 'Failed to analyze program',
      error: error.message 
    });
  }
});

export default router;