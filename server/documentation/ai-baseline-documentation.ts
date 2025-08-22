// AI Baseline Documentation System
// Comprehensive documentation of current GPT-4o prompts and expected outputs
// This serves as the migration baseline for comparison with GPT-5-mini

export interface AIEndpointDocumentation {
  endpoint: string;
  service: string;
  currentModel: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  sampleRequest: Record<string, any>;
  sampleResponse: Record<string, any>;
  promptTemplate: {
    systemPrompt: string;
    userPromptTemplate: string;
    parameters: {
      temperature: number;
      maxTokens: number;
      responseFormat?: string;
    };
  };
  qualityMetrics: {
    expectedSuccessRate: number;
    expectedResponseTime: number;
    expectedJSONCompliance: number;
    criticalFeatures: string[];
  };
  knownIssues?: string[];
  migrationNotes?: string[];
}

export const AI_BASELINE_DOCUMENTATION: Record<string, AIEndpointDocumentation> = {
  'exercise-recommendations': {
    endpoint: '/api/ai/exercise-recommendations',
    service: 'exercise-recommendations',
    currentModel: 'gpt-4o',
    description: 'Generates evidence-based exercise recommendations using Renaissance Periodization methodology',
    
    inputSchema: {
      userGoals: { type: 'array', items: { type: 'string' }, description: 'User fitness goals' },
      currentExercises: { type: 'array', description: 'Available exercise library' },
      trainingHistory: { type: 'array', description: 'Recent performance data' },
      muscleGroupFocus: { type: 'array', items: { type: 'string' } },
      experienceLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'elite'] },
      availableEquipment: { type: 'array', items: { type: 'string' } },
      timeConstraints: { type: 'object', optional: true },
      injuryRestrictions: { type: 'array', optional: true }
    },

    outputSchema: {
      recommendations: {
        type: 'array',
        items: {
          exerciseName: { type: 'string', description: 'Exact match from exercise library' },
          category: { type: 'string' },
          primaryMuscle: { type: 'string' },
          muscleGroups: { type: 'array' },
          equipment: { type: 'string' },
          difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          sets: { type: 'number' },
          reps: { type: 'string' },
          restPeriod: { type: 'number' },
          reasoning: { type: 'string', description: 'Scientific explanation' },
          progressionNotes: { type: 'string' },
          specialMethod: { type: 'string', nullable: true },
          specialConfig: { type: 'object', nullable: true },
          rpIntensity: { type: 'number', min: 1, max: 10 },
          volumeContribution: { type: 'number' }
        }
      },
      reasoning: { type: 'string', description: 'Overall program logic' },
      rpConsiderations: { type: 'string', description: 'RP-specific insights' },
      progressionPlan: { type: 'string', description: 'Long-term integration strategy' }
    },

    sampleRequest: {
      userGoals: ['muscle_gain', 'strength'],
      experienceLevel: 'intermediate',
      muscleGroupFocus: ['chest', 'shoulders', 'triceps'],
      availableEquipment: ['barbell', 'dumbbells', 'bench'],
      trainingHistory: [
        {
          exerciseName: 'Bench Press',
          lastWeight: 80,
          lastReps: 8,
          progressRate: 2.5,
          fatigueLevel: 7
        }
      ]
    },

    sampleResponse: {
      recommendations: [
        {
          exerciseName: 'Incline Barbell Press',
          category: 'compound',
          primaryMuscle: 'chest',
          muscleGroups: ['chest', 'shoulders', 'triceps'],
          equipment: 'barbell',
          difficulty: 'intermediate',
          sets: 3,
          reps: '6-8',
          restPeriod: 180,
          reasoning: 'Excellent upper chest development with compound movement pattern',
          progressionNotes: 'Increase weight by 2.5kg when all sets achieve 8 reps',
          specialMethod: null,
          specialConfig: null,
          rpIntensity: 8,
          volumeContribution: 3
        }
      ],
      reasoning: 'Focus on compound movements for maximum muscle activation',
      rpConsiderations: 'Volume is within MEV-MAV range for chest development',
      progressionPlan: 'Progress weight weekly, implement MyoReps in weeks 3-4'
    },

    promptTemplate: {
      systemPrompt: `You are an expert evidence-based fitness coach specializing in scientific exercise selection and program design. Your expertise includes:

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

    Always provide evidence-based recommendations with clear reasoning rooted in scientific methodology.`,
      
      userPromptTemplate: `Based on the following user data, provide intelligent exercise recommendations following evidence-based scientific methodology:

    **User Goals**: {userGoals}
    **Experience Level**: {experienceLevel}
    **Muscle Group Focus**: {muscleGroupFocus}
    **Available Equipment**: {availableEquipment}
    
    **CRITICAL CONSTRAINT: You MUST only recommend exercises from the following available exercise library. Do NOT create new exercise names - only select from this exact list:**
    {currentExercises}
    
    **IMPORTANT**: Use the EXACT exercise names as listed above. Do not modify, abbreviate, or create variations of these names.
    
    **Training History & Performance**:
    {trainingHistory}
    
    {timeConstraints}
    {injuryRestrictions}

    Please analyze this data and provide:
    1. 3-5 specific exercise recommendations SELECTED ONLY from the exercise library above
    2. Science-based reasoning for each recommendation
    3. Optimal set/rep ranges based on scientific guidelines
    4. Special training method suggestions where appropriate
    5. Volume progression considerations

    **MANDATORY**: Only use exercise names that appear EXACTLY in the exercise library list above. Do not create new exercises or modify existing names.

    Format your response as JSON with the specified structure.`,

      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
        responseFormat: 'json_object'
      }
    },

    qualityMetrics: {
      expectedSuccessRate: 95,
      expectedResponseTime: 2500,
      expectedJSONCompliance: 98,
      criticalFeatures: [
        'Exact exercise name matching from library',
        'Scientific reasoning for selections',
        'Proper set/rep ranges',
        'RP methodology compliance',
        'JSON structure consistency'
      ]
    },

    knownIssues: [
      'Occasionally suggests exercise variations not in exact library',
      'May over-recommend advanced techniques for beginners',
      'Complex equipment constraints sometimes ignored'
    ],

    migrationNotes: [
      'GPT-5-mini may need stronger constraints on exact exercise matching',
      'Temperature may need adjustment for consistent scientific reasoning',
      'Monitor for creativity vs. constraint compliance balance'
    ]
  },

  'nutrition-analysis': {
    endpoint: '/api/ai/nutrition-analysis',
    service: 'nutrition-analysis',
    currentModel: 'gpt-4o',
    description: 'Comprehensive nutritional analysis with micronutrient assessment and RDA comparisons',

    inputSchema: {
      userProfile: {
        age: { type: 'number', nullable: true },
        gender: { type: 'string', nullable: true },
        weight: { type: 'number', nullable: true },
        height: { type: 'number', nullable: true },
        activityLevel: { type: 'string' },
        goals: { type: 'array' },
        healthConditions: { type: 'array', optional: true },
        isProfileComplete: { type: 'boolean' }
      },
      nutritionData: { type: 'array', description: 'Recent nutrition logs' },
      timeRange: { type: 'string', description: 'Analysis period' },
      healthConditions: { type: 'string', optional: true },
      primaryGoal: { type: 'string', optional: true }
    },

    outputSchema: {
      overallRating: { type: 'number', min: 1, max: 10 },
      dataQuality: {
        completenessScore: { type: 'number', min: 0, max: 100 },
        reliabilityNote: { type: 'string' },
        recommendedActions: { type: 'array', items: { type: 'string' } }
      },
      macronutrientAnalysis: {
        proteinStatus: { type: 'string' },
        carbStatus: { type: 'string' },
        fatStatus: { type: 'string' }
      },
      micronutrientAnalysis: {
        type: 'array',
        items: {
          nutrient: { type: 'string' },
          currentIntake: { type: 'number' },
          recommendedIntake: { type: 'number' },
          unit: { type: 'string' },
          status: { type: 'string', enum: ['deficient', 'adequate', 'excessive'] },
          healthImpact: { type: 'string' },
          foodSources: { type: 'array' },
          supplementRecommendation: { type: 'string', nullable: true }
        }
      },
      rdaComparison: {
        meetsRDA: { type: 'array' },
        belowRDA: { type: 'array' },
        exceedsRDA: { type: 'array' }
      },
      personalizedInsights: {
        type: 'array',
        items: {
          category: { type: 'string' },
          insight: { type: 'string' },
          actionItems: { type: 'array' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        }
      },
      supplementationAdvice: { type: 'array' },
      nextSteps: { type: 'array' }
    },

    sampleRequest: {
      userProfile: {
        age: 28,
        gender: 'male',
        weight: 75,
        height: 180,
        activityLevel: 'high',
        goals: ['muscle_gain'],
        healthConditions: [],
        isProfileComplete: true
      },
      timeRange: '7 days',
      nutritionData: [
        {
          date: '2024-01-15',
          calories: 2450,
          protein: 150,
          carbs: 280,
          fat: 90,
          micronutrients: {
            iron: 18,
            calcium: 1200,
            vitaminC: 90
          }
        }
      ]
    },

    sampleResponse: {
      overallRating: 7,
      dataQuality: {
        completenessScore: 85,
        reliabilityNote: 'Good data quality with comprehensive micronutrient tracking',
        recommendedActions: ['Continue detailed logging for 2 more weeks']
      },
      macronutrientAnalysis: {
        proteinStatus: 'Optimal for muscle growth (2g/kg body weight)',
        carbStatus: 'Adequate for high activity level',
        fatStatus: 'Within healthy range (25-30% of calories)'
      },
      micronutrientAnalysis: [
        {
          nutrient: 'Iron',
          currentIntake: 18,
          recommendedIntake: 8,
          unit: 'mg',
          status: 'excessive',
          healthImpact: 'Monitor for iron overload symptoms',
          foodSources: ['red meat', 'spinach', 'legumes'],
          supplementRecommendation: null
        }
      ],
      rdaComparison: {
        meetsRDA: ['protein', 'vitamin C', 'calcium'],
        belowRDA: ['vitamin D', 'omega-3'],
        exceedsRDA: ['iron', 'sodium']
      },
      personalizedInsights: [
        {
          category: 'Recovery',
          insight: 'Adequate protein intake supports muscle protein synthesis',
          actionItems: ['Maintain current protein timing around workouts'],
          priority: 'medium'
        }
      ],
      supplementationAdvice: [
        'Consider vitamin D3 supplementation (2000-4000 IU daily)',
        'Add omega-3 supplement (1-2g EPA/DHA daily)'
      ],
      nextSteps: [
        'Track vitamin D levels via blood test',
        'Monitor iron markers if high intake continues',
        'Continue current macro distribution'
      ]
    },

    promptTemplate: {
      systemPrompt: `You are an expert nutrition scientist and registered dietitian specializing in comprehensive nutritional analysis. You provide detailed micronutrient analysis, RDA comparisons, and personalized nutrition recommendations based on individual health profiles and dietary intake data.

    Your expertise includes:
    1. Micronutrient analysis and deficiency identification
    2. RDA/DRI calculations based on age, gender, activity level
    3. Personalized nutrition recommendations
    4. Health condition considerations
    5. Supplementation guidance
    6. Evidence-based nutritional science`,

      userPromptTemplate: `Analyze the following nutrition data and provide comprehensive insights:

    **User Profile**:
    - Age: {age}
    - Gender: {gender}
    - Weight: {weight}
    - Height: {height}
    - Activity Level: {activityLevel}
    - Goals: {goals}
    {healthConditions}
    - Profile Completeness: {isProfileComplete}
    
    **IMPORTANT**: When user profile data is incomplete (marked above), use general population averages for RDA calculations but clearly note this limitation in your analysis.

    **Analysis Period**: {timeRange} ({totalRecords} total records analyzed)
    **Data Quality Notice**: Some nutrition entries may lack complete micronutrient data. Analysis confidence varies based on data completeness.
    **Nutrition Data Sample**: {nutritionData}
    
    **DATA QUALITY ASSESSMENT**:
    {dataQualityMetrics}
    
    **CRITICAL ANALYSIS INSTRUCTIONS**:
    1. Base your confidence scores on actual data availability
    2. If data completeness is below 70%, clearly state limitations in micronutrient analysis
    3. Do not provide definitive deficiency diagnoses when source data is incomplete
    4. Include data quality warnings in your insights when appropriate
    5. Adjust your overall rating to reflect data quality (lower scores for incomplete data)

    Provide a comprehensive analysis in JSON format with the specified structure.`,

      parameters: {
        temperature: 0.6,
        maxTokens: 2500,
        responseFormat: 'json_object'
      }
    },

    qualityMetrics: {
      expectedSuccessRate: 92,
      expectedResponseTime: 3200,
      expectedJSONCompliance: 96,
      criticalFeatures: [
        'Accurate RDA calculations based on demographics',
        'Comprehensive micronutrient analysis',
        'Personalized recommendations',
        'Data quality assessment integration',
        'Scientific backing for all claims'
      ]
    },

    knownIssues: [
      'Incomplete user profiles sometimes lead to generic recommendations',
      'Complex health conditions may not be fully considered',
      'Supplement recommendations occasionally too conservative'
    ],

    migrationNotes: [
      'GPT-5-mini may need clearer guidelines for demographic-based calculations',
      'May require stronger emphasis on data quality disclaimers',
      'Scientific citation formatting may need adjustment'
    ]
  },

  'food-analysis': {
    endpoint: '/api/ai/food-analysis',
    service: 'food-analysis',
    currentModel: 'gpt-4o',
    description: 'Single food image recognition and nutrition estimation',

    inputSchema: {
      image: { type: 'string', description: 'Base64 encoded image' },
      context: {
        mealType: { type: 'string', optional: true },
        estimatedPortion: { type: 'string', optional: true }
      }
    },

    outputSchema: {
      foodItems: {
        type: 'array',
        items: {
          name: { type: 'string' },
          confidence: { type: 'number', min: 0, max: 1 },
          estimatedWeight: { type: 'number' },
          nutrition: {
            calories: { type: 'number' },
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            fiber: { type: 'number' },
            sugar: { type: 'number' }
          }
        }
      },
      totalNutrition: {
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' }
      },
      confidence: { type: 'number', min: 0, max: 1 },
      suggestions: { type: 'array', items: { type: 'string' } }
    },

    sampleRequest: {
      image: 'base64_encoded_food_image',
      context: {
        mealType: 'lunch',
        estimatedPortion: 'medium'
      }
    },

    sampleResponse: {
      foodItems: [
        {
          name: 'Grilled Chicken Breast',
          confidence: 0.92,
          estimatedWeight: 150,
          nutrition: {
            calories: 248,
            protein: 46,
            carbs: 0,
            fat: 5.4,
            fiber: 0,
            sugar: 0
          }
        }
      ],
      totalNutrition: {
        calories: 248,
        protein: 46,
        carbs: 0,
        fat: 5.4
      },
      confidence: 0.92,
      suggestions: [
        'Consider adding vegetables for micronutrients',
        'Portion size appears appropriate for muscle building goals'
      ]
    },

    promptTemplate: {
      systemPrompt: `You are an expert food recognition and nutrition analysis AI. You can identify foods from images and provide detailed nutritional information. Analyze food images with high accuracy and provide comprehensive nutrition data.`,

      userPromptTemplate: `Analyze this food image and provide detailed nutritional information:

    {mealType}
    {estimatedPortion}

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
    }`,

      parameters: {
        temperature: 0.5,
        maxTokens: 1500,
        responseFormat: 'json_object'
      }
    },

    qualityMetrics: {
      expectedSuccessRate: 88,
      expectedResponseTime: 1800,
      expectedJSONCompliance: 94,
      criticalFeatures: [
        'Accurate food identification',
        'Realistic portion estimation',
        'Nutritional accuracy within ±15%',
        'Confidence scoring reliability',
        'Useful suggestions for improvement'
      ]
    },

    knownIssues: [
      'Complex mixed dishes challenging to separate',
      'Lighting conditions affect accuracy',
      'Portion estimation varies with image quality'
    ],

    migrationNotes: [
      'Vision capabilities may differ between models',
      'May need adjusted prompting for portion estimation',
      'Confidence thresholds might require recalibration'
    ]
  },

  'multi-image-nutrition': {
    endpoint: '/api/nutrition/analyze',
    service: 'multi-image-nutrition',
    currentModel: 'gpt-4o',
    description: 'Advanced multi-image nutrition label reading and food composition analysis',

    inputSchema: {
      foodName: { type: 'string', optional: true },
      description: { type: 'string', optional: true },
      images: { type: 'array', items: { type: 'string' }, optional: true },
      portionWeight: { type: 'number', optional: true },
      portionUnit: { type: 'string', optional: true },
      quantity: { type: 'number', default: 1 },
      unit: { type: 'string', default: 'serving' },
      analysisType: { type: 'string', enum: ['nutrition_label', 'actual_food'], default: 'nutrition_label' }
    },

    outputSchema: {
      calories: { type: 'number' },
      protein: { type: 'number' },
      carbs: { type: 'number' },
      fat: { type: 'number' },
      confidence: { type: 'number', min: 0, max: 1 },
      category: { type: 'string', enum: ['protein', 'carb', 'fat', 'mixed'] },
      mealSuitability: { type: 'array', items: { type: 'string' } },
      assumptions: { type: 'string' },
      servingDetails: { type: 'string' },
      portionWeight: { type: 'number', nullable: true },
      portionUnit: { type: 'string', nullable: true },
      ingredientBreakdown: { type: 'array', items: { type: 'string' }, optional: true },
      micronutrients: {
        type: 'object',
        description: 'Comprehensive vitamin and mineral data'
      },
      nutritionValidation: { type: 'string' }
    },

    sampleRequest: {
      foodName: 'Dark Chocolate Bar',
      images: ['base64_nutrition_label_1', 'base64_nutrition_label_2'],
      portionWeight: 20,
      portionUnit: 'g',
      analysisType: 'nutrition_label'
    },

    sampleResponse: {
      calories: 107,
      protein: 1.8,
      carbs: 12.1,
      fat: 6.9,
      confidence: 0.95,
      category: 'mixed',
      mealSuitability: ['snack', 'pre-workout'],
      assumptions: 'Values read directly from nutrition facts label',
      servingDetails: '1 serving (20g) as stated on label',
      portionWeight: 20,
      portionUnit: 'g',
      micronutrients: {
        iron: 2.3,
        magnesium: 45,
        copper: 0.4,
        manganese: 0.8,
        antioxidants: 'high'
      },
      nutritionValidation: 'Values match nutrition label exactly - 107 calories confirmed'
    },

    promptTemplate: {
      systemPrompt: `You are a nutrition expert specializing in precise macro and micronutrient analysis with access to comprehensive nutritional databases (USDA FoodData Central). For nutrition labels, read values EXACTLY as shown - do not scale, multiply, or adjust. A label showing 107 calories should be reported as 107 calories, not 535. Always respond with valid JSON containing COMPLETE nutritional data including extensive micronutrient profiles. Every food contains multiple vitamins and minerals - never provide minimal micronutrient data. Use scientific nutritional composition data to ensure thoroughness. If you cannot analyze the image clearly, provide your best estimate with a lower confidence score.`,

      userPromptTemplate: `{analysisTask}

    {analysisInstructions}
    {additionalContext}

    {outputRequirements}

    Return only valid JSON with all required fields.`,

      parameters: {
        temperature: 0.1,
        maxTokens: 1500,
        responseFormat: 'json_object'
      }
    },

    qualityMetrics: {
      expectedSuccessRate: 96,
      expectedResponseTime: 2800,
      expectedJSONCompliance: 99,
      criticalFeatures: [
        'Exact nutrition label value reading (no scaling)',
        'Comprehensive micronutrient extraction',
        'Multi-image analysis capability',
        'Portion calculation accuracy',
        'Scientific nutritional database integration'
      ]
    },

    knownIssues: [
      'Occasionally over-estimates micronutrients for simple foods',
      'Complex multi-product labels sometimes parsed incorrectly',
      'Supplement facts panels need specific handling'
    ],

    migrationNotes: [
      'Critical: Maintain exact label reading accuracy',
      'May need stronger micronutrient database prompting',
      'Multi-image processing capabilities must be preserved'
    ]
  },

  'program-optimization': {
    endpoint: '/api/ai/program-optimization',
    service: 'program-optimization',
    currentModel: 'gpt-4o',
    description: 'Training program analysis and optimization recommendations',

    inputSchema: {
      currentProgram: { type: 'object', description: 'Current training program structure' },
      userGoals: { type: 'array', items: { type: 'string' } },
      performanceData: { type: 'object', description: 'Recent performance metrics' }
    },

    outputSchema: {
      analysis: { type: 'string', description: 'Overall program assessment' },
      optimizations: { type: 'array', items: { type: 'string' } },
      scientificAdjustments: { type: 'array', items: { type: 'string' } }
    },

    sampleRequest: {
      currentProgram: {
        frequency: 4,
        split: 'upper/lower',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 8 }
        ]
      },
      userGoals: ['strength', 'muscle_gain'],
      performanceData: {
        avgIntensity: 7.5,
        weeklyVolume: 16,
        recoveryScore: 6
      }
    },

    sampleResponse: {
      analysis: 'Current program shows good exercise selection but volume distribution could be optimized',
      optimizations: [
        'Increase posterior chain emphasis (current ratio 60/40 push/pull)',
        'Add unilateral movements for muscle imbalances',
        'Implement periodized intensity variation'
      ],
      scientificAdjustments: [
        'Increase weekly volume to 18-20 sets for chest (currently at MEV)',
        'Add MyoReps for hypertrophy blocks',
        'Implement RPE-based load progression'
      ]
    },

    promptTemplate: {
      systemPrompt: `You are an expert evidence-based fitness analyst. Analyze training programs for optimization opportunities based on:
    1. Volume distribution across muscle groups
    2. Exercise selection efficiency 
    3. Fatigue management
    4. Progressive overload potential
    5. Scientific periodization principles`,

      userPromptTemplate: `Analyze this training program and provide optimization suggestions:

    **Current Program**: {currentProgram}
    **User Goals**: {userGoals}
    **Performance Data**: {performanceData}

    Provide analysis and optimization suggestions in JSON format:
    {
      "analysis": "string - overall program assessment",
      "optimizations": ["string array - specific improvements"],
      "scientificAdjustments": ["string array - Evidence-based methodology adjustments"]
    }`,

      parameters: {
        temperature: 0.6,
        maxTokens: 1500,
        responseFormat: 'json_object'
      }
    },

    qualityMetrics: {
      expectedSuccessRate: 90,
      expectedResponseTime: 2000,
      expectedJSONCompliance: 95,
      criticalFeatures: [
        'Scientific backing for recommendations',
        'Practical optimization suggestions',
        'Volume landmark integration',
        'Progressive overload considerations',
        'Recovery and fatigue management'
      ]
    },

    knownIssues: [
      'May over-recommend advanced techniques',
      'Limited consideration of equipment constraints',
      'Sometimes too generic for specific sports'
    ],

    migrationNotes: [
      'May need more specific scientific reference prompting',
      'Program complexity analysis might need refinement',
      'Equipment constraint handling could improve'
    ]
  }
};

// Export function to generate comprehensive baseline report
export function generateBaselineReport(): {
  timestamp: string;
  modelVersion: string;
  totalEndpoints: number;
  documentation: typeof AI_BASELINE_DOCUMENTATION;
  migrationReadiness: {
    score: number;
    readyEndpoints: string[];
    needsAttention: string[];
    criticalIssues: string[];
  };
} {
  const readyEndpoints: string[] = [];
  const needsAttention: string[] = [];
  const criticalIssues: string[] = [];

  Object.entries(AI_BASELINE_DOCUMENTATION).forEach(([key, doc]) => {
    const hasKnownIssues = (doc.knownIssues?.length || 0) > 0;
    const hasLowSuccessRate = doc.qualityMetrics.expectedSuccessRate < 90;
    const hasSlowResponse = doc.qualityMetrics.expectedResponseTime > 3000;

    if (hasLowSuccessRate || hasSlowResponse) {
      criticalIssues.push(key);
    } else if (hasKnownIssues) {
      needsAttention.push(key);
    } else {
      readyEndpoints.push(key);
    }
  });

  const totalEndpoints = Object.keys(AI_BASELINE_DOCUMENTATION).length;
  const readinessScore = Math.round((readyEndpoints.length / totalEndpoints) * 100);

  return {
    timestamp: new Date().toISOString(),
    modelVersion: 'gpt-4o',
    totalEndpoints,
    documentation: AI_BASELINE_DOCUMENTATION,
    migrationReadiness: {
      score: readinessScore,
      readyEndpoints,
      needsAttention,
      criticalIssues
    }
  };
}