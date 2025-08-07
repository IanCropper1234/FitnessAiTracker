import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId || typeof userId !== 'number') {
    return res.status(401).json({ message: "Not authenticated" });
  }
  req.userId = userId;
  next();
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Exercise Recommendations
router.post('/exercise-recommendations', requireAuth, async (req, res) => {
  try {
    const { userGoals, currentExercises, trainingHistory, muscleGroupFocus, experienceLevel, availableEquipment, timeConstraints, injuryRestrictions } = req.body;

    const systemPrompt = `You are an expert Renaissance Periodization (RP) methodology coach specializing in evidence-based exercise selection and program design. Your expertise includes:

    1. **RP Volume Landmarks**: Understanding MV, MEV, MAV, and MRV for all muscle groups
    2. **Fatigue Management**: Balancing stimulus and recovery based on RPE and fatigue indicators
    3. **Exercise Selection Principles**: Choosing exercises based on:
       - Muscle length-tension relationships
       - Training specificity to goals
       - Individual biomechanics and limitations
       - Progressive overload potential
       - Fatigue cost vs. stimulus ratio
    4. **Special Training Methods**: When and how to implement MyoReps, Drop Sets, Giant Sets
    5. **Periodization**: Structuring volume progression throughout mesocycles

    Always provide evidence-based recommendations with clear reasoning rooted in RP methodology.`;

    const userPrompt = `Based on the following user data, provide intelligent exercise recommendations following RP methodology:

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
    2. RP-based reasoning for each recommendation
    3. Optimal set/rep ranges based on RP guidelines
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
          "reasoning": "string - RP-based explanation",
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    
    res.json({
      recommendations: aiResponse.recommendations || [],
      reasoning: aiResponse.reasoning || '',
      rpConsiderations: aiResponse.rpConsiderations || '',
      progressionPlan: aiResponse.progressionPlan || ''
    });

  } catch (error: any) {
    console.error('Error getting AI exercise recommendations:', error);
    res.status(500).json({ 
      message: 'Failed to get AI recommendations',
      error: error.message 
    });
  }
});

// AI Nutrition Analysis
router.post('/nutrition-analysis', requireAuth, async (req, res) => {
  try {
    const { userProfile, nutritionData, timeRange } = req.body;

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
    - Age: ${userProfile?.age || 30}
    - Gender: ${userProfile?.gender || 'not specified'}
    - Weight: ${userProfile?.weight || 70}kg
    - Height: ${userProfile?.height || 170}cm
    - Activity Level: ${userProfile?.activityLevel || 'moderate'}
    - Goals: ${userProfile?.goals?.join(', ') || 'health optimization'}
    ${userProfile?.healthConditions ? `- Health Conditions: ${userProfile.healthConditions.join(', ')}` : ''}

    **Analysis Period**: ${timeRange || '7 days'}
    **Nutrition Data**: ${JSON.stringify(nutritionData?.slice(0, 10) || [], null, 2)}

    Provide a comprehensive analysis in JSON format:
    {
      "overallRating": number (1-10 scale),
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 2500
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    res.json(aiResponse);

  } catch (error: any) {
    console.error('Error analyzing nutrition:', error);
    res.status(500).json({ 
      message: 'Failed to analyze nutrition',
      error: error.message 
    });
  }
});

// AI Food Analysis from Image
router.post('/food-analysis', requireAuth, async (req, res) => {
  try {
    const { image, context } = req.body;

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      temperature: 0.5,
      max_tokens: 1500
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    res.json(aiResponse);

  } catch (error: any) {
    console.error('Error analyzing food image:', error);
    res.status(500).json({ 
      message: 'Failed to analyze food image',
      error: error.message 
    });
  }
});

// Program Optimization Analysis
router.post('/program-optimization', requireAuth, async (req, res) => {
  try {
    const { currentProgram, userGoals, performanceData } = req.body;

    const systemPrompt = `You are an expert RP methodology analyst. Analyze training programs for optimization opportunities based on:
    1. Volume distribution across muscle groups
    2. Exercise selection efficiency 
    3. Fatigue management
    4. Progressive overload potential
    5. RP periodization principles`;

    const userPrompt = `Analyze this training program and provide optimization suggestions:

    **Current Program**: ${JSON.stringify(currentProgram, null, 2)}
    **User Goals**: ${userGoals?.join(', ') || 'General fitness'}
    **Performance Data**: ${JSON.stringify(performanceData, null, 2)}

    Provide analysis and optimization suggestions in JSON format:
    {
      "analysis": "string - overall program assessment",
      "optimizations": ["string array - specific improvements"],
      "rpAdjustments": ["string array - RP methodology adjustments"]
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 1500
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    res.json(aiResponse);

  } catch (error: any) {
    console.error('Error analyzing program:', error);
    res.status(500).json({ 
      message: 'Failed to analyze program',
      error: error.message 
    });
  }
});

export default router;