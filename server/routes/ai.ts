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

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('exerciseRecommendations', userId);
    const abTestGroup = process.env.AI_AB_TEST_ENABLED === 'true' ? 
      (modelConfig.name === process.env.AI_AB_TEST_MODEL ? 'test' : 'control') : 
      undefined;

    const systemPrompt = `You are an expert evidence-based fitness coach specializing in scientific exercise selection and program design. Your expertise includes:

    1. **Volume Landmarks**: Understanding MV, MEV, MAV, and MRV for all muscle groups
    2. **Fatigue Management**: Balancing stimulus and recovery based on RPE and fatigue indicators
    3. **Exercise Selection Principles**: Choosing exercises based on:
       - Muscle length-tension relationships
       - Training specificity to goals
       - Individual biomechanics and limitations
       - Progressive overload potential
       - Fatigue cost vs. stimulus ratio
    4. **Special Training Methods**: When and how to implement MyoReps, Drop Sets, Giant Sets
    5. **Periodization**: Structuring volume progression throughout mesocycles

    Always provide evidence-based recommendations with clear reasoning rooted in scientific methodology.`;

    const userPrompt = `Based on the following user data, provide intelligent exercise recommendations following evidence-based scientific methodology:

    **User Goals**: ${userGoals?.join(', ') || 'General fitness'}
    **Experience Level**: ${experienceLevel || 'intermediate'}
    **Muscle Group Focus**: ${muscleGroupFocus?.join(', ') || 'Full body'}
    **Available Equipment**: ${availableEquipment?.join(', ') || 'Full gym'}
    
    **CRITICAL CONSTRAINT: You MUST only recommend exercises from the following available exercise library. Do NOT create new exercise names - only select from this exact list:**
    ${currentExercises?.map((ex: any) => `- "${ex.name}" (ID: ${ex.id}, Category: ${ex.category}, Targets: ${ex.muscleGroups?.join(', ') || ex.primaryMuscle})`).join('\n') || 'No exercises available'}
    
    **IMPORTANT**: Use the EXACT exercise names as listed above. Do not modify, abbreviate, or create variations of these names.
    
    **Training History & Performance**:
    ${trainingHistory?.map((hist: any) => 
      `- ${hist.exerciseName}: Last ${hist.lastWeight}kg x ${hist.lastReps} reps, Progress: ${hist.progressRate}%/week, Fatigue: ${hist.fatigueLevel}/10`
    ).join('\n') || 'No training history provided'}
    
    ${timeConstraints ? `**Time Constraints**: ${timeConstraints.sessionDuration} min sessions, ${timeConstraints.sessionsPerWeek}x per week` : ''}
    ${injuryRestrictions ? `**Injury Restrictions**: ${Array.isArray(injuryRestrictions) ? injuryRestrictions.join(', ') : injuryRestrictions}` : ''}

    Please analyze this data and provide:
    1. 3-5 specific exercise recommendations SELECTED ONLY from the exercise library above
    2. Science-based reasoning for each recommendation
    3. Optimal set/rep ranges based on scientific guidelines
    4. Special training method suggestions where appropriate
    5. Volume progression considerations

    **MANDATORY**: Only use exercise names that appear EXACTLY in the exercise library list above. Do not create new exercises or modify existing names.

    Format your response as JSON with the following structure:
    {
      "recommendations": [
        {
          "exerciseName": "string (MUST match exactly from the exercise library)",
          "category": "string",
          "primaryMuscle": "string", 
          "muscleGroups": ["string"],
          "equipment": "string",
          "difficulty": "beginner|intermediate|advanced",
          "sets": number,
          "reps": "string (e.g., '6-8', '8-12')",
          "restPeriod": number,
          "reasoning": "string - Science-based explanation",
          "progressionNotes": "string - how to progress this exercise",
          "specialMethod": "myorepMatch|myorepNoMatch|dropSet|giant_set|null",
          "specialConfig": object or null,
          "rpIntensity": number (1-10 RPE scale),
          "volumeContribution": number (sets contributing to muscle group MEV)
        }
      ],
      "reasoning": "string - overall program logic",
      "rpConsiderations": "string - RP-specific insights",
      "progressionPlan": "string - how to integrate over time"
    }`;

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
      const response = await openai.chat.completions.create({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        recommendations: aiResponse.recommendations || [],
        reasoning: aiResponse.reasoning || '',
        rpConsiderations: aiResponse.rpConsiderations || '',
        progressionPlan: aiResponse.progressionPlan || ''
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
        // Consider record complete if it has at least 5 meaningful micronutrients
        return meaningfulValues >= 5;
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
    
    const dataCompletenessScore = (dataQualityMetrics.recordsWithCompleteMicronutrients / dataQualityMetrics.totalRecords) * 100;

    // Select appropriate model for user (with A/B testing support)
    const modelConfig = selectModelForUser('nutritionAnalysis', userId.toString());
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

    **Analysis Period**: ${timeRange || '7 days'} (${nutrition?.length || 0} total records analyzed)
    **Data Quality Notice**: Some nutrition entries may lack complete micronutrient data. Analysis confidence varies based on data completeness.
    **Nutrition Data Sample**: ${JSON.stringify(nutrition?.slice(0, 15) || [], null, 2)}
    
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

    // Monitor AI call performance
    const result = await monitorAICall({
      service: 'nutrition-analysis',
      model: modelConfig.name,
      userId: userId.toString(),
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      const response = await openai.chat.completions.create({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      });

      const responseContent = response.choices[0].message.content;
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

    // Monitor AI call performance
    const result = await monitorAICall({
      service: 'food-analysis',
      model: modelConfig.name,
      userId,
      abTestGroup,
      inputTokens: Math.ceil((systemPrompt + userPrompt).length / 4), // Rough estimate
      costPerInputToken: modelConfig.costPerToken.input,
      costPerOutputToken: modelConfig.costPerToken.output
    }, async () => {
      const response = await openai.chat.completions.create({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      });

      return JSON.parse(response.choices[0].message.content || '{}');
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
      const response = await openai.chat.completions.create({
        model: modelConfig.name,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.maxTokens
      });

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