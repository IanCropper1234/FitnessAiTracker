// AI Prompt Template Registry
// Centralized management of all AI prompts with versioning and A/B testing support

export interface PromptTemplate {
  id: string;
  service: string;
  version: string;
  systemPrompt: string;
  userPromptTemplate: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    responseFormat?: 'json_object' | 'text';
  };
  description: string;
  lastUpdated: Date;
  testResults?: {
    successRate: number;
    avgResponseTime: number;
    qualityScore: number;
  };
}

// Current Production Prompts (GPT-4o optimized)
export const CURRENT_PROMPTS: Record<string, PromptTemplate> = {
  'exercise-recommendations-v1': {
    id: 'exercise-recommendations-v1',
    service: 'exercise-recommendations',
    version: '1.0.0',
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
    },
    description: 'Scientific exercise recommendations based on RP methodology',
    lastUpdated: new Date('2024-01-15')
  },

  'nutrition-analysis-v1': {
    id: 'nutrition-analysis-v1',
    service: 'nutrition-analysis', 
    version: '1.0.0',
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
    },
    description: 'Comprehensive nutrition analysis with micronutrient assessment and RDA comparisons',
    lastUpdated: new Date('2024-01-15')
  },

  'food-analysis-v1': {
    id: 'food-analysis-v1',
    service: 'food-analysis',
    version: '1.0.0',
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
    },
    description: 'Food image recognition and nutrition estimation',
    lastUpdated: new Date('2024-01-15')
  },

  'program-optimization-v1': {
    id: 'program-optimization-v1',
    service: 'program-optimization',
    version: '1.0.0',
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
    },
    description: 'Training program analysis and optimization recommendations',
    lastUpdated: new Date('2024-01-15')
  },

  'multi-image-nutrition-v1': {
    id: 'multi-image-nutrition-v1',
    service: 'multi-image-nutrition',
    version: '1.0.0',
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
    },
    description: 'Advanced multi-image nutrition label reading and food composition analysis',
    lastUpdated: new Date('2024-01-15')
  }
};

// GPT-5-mini optimized prompts (for migration testing)
export const GPT5_MINI_PROMPTS: Record<string, PromptTemplate> = {
  // Will be populated during migration testing phase
  // These prompts will be optimized for GPT-5-mini characteristics
};

export class PromptRegistry {
  private static instance: PromptRegistry;
  private currentPrompts: Record<string, PromptTemplate>;

  private constructor() {
    this.currentPrompts = { ...CURRENT_PROMPTS };
  }

  static getInstance(): PromptRegistry {
    if (!PromptRegistry.instance) {
      PromptRegistry.instance = new PromptRegistry();
    }
    return PromptRegistry.instance;
  }

  getPrompt(service: string, version: string = 'v1'): PromptTemplate | null {
    const promptId = `${service}-${version}`;
    return this.currentPrompts[promptId] || null;
  }

  getAllPrompts(): Record<string, PromptTemplate> {
    return { ...this.currentPrompts };
  }

  updatePrompt(promptId: string, updates: Partial<PromptTemplate>) {
    if (this.currentPrompts[promptId]) {
      this.currentPrompts[promptId] = {
        ...this.currentPrompts[promptId],
        ...updates,
        lastUpdated: new Date()
      };
    }
  }

  addPrompt(prompt: PromptTemplate) {
    this.currentPrompts[prompt.id] = prompt;
  }

  // Template variable replacement
  renderPrompt(
    service: string,
    variables: Record<string, any>,
    version: string = 'v1'
  ): { systemPrompt: string; userPrompt: string; parameters: any } | null {
    const template = this.getPrompt(service, version);
    if (!template) return null;

    let userPrompt = template.userPromptTemplate;
    
    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const replacement = Array.isArray(value) ? value.join(', ') : 
                         typeof value === 'object' ? JSON.stringify(value, null, 2) :
                         String(value);
      userPrompt = userPrompt.replace(new RegExp(placeholder, 'g'), replacement);
    });

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      parameters: template.parameters
    };
  }

  // Export prompts for documentation
  exportPrompts(): string {
    const exported = Object.entries(this.currentPrompts).map(([id, prompt]) => ({
      id,
      service: prompt.service,
      version: prompt.version,
      description: prompt.description,
      parameters: prompt.parameters,
      lastUpdated: prompt.lastUpdated.toISOString(),
      systemPromptLength: prompt.systemPrompt.length,
      userPromptTemplateLength: prompt.userPromptTemplate.length,
      testResults: prompt.testResults
    }));

    return JSON.stringify(exported, null, 2);
  }
}

// Export singleton instance
export const promptRegistry = PromptRegistry.getInstance();

// Helper function to get current baseline for migration comparison
export const getCurrentBaselineMetrics = () => {
  const prompts = promptRegistry.getAllPrompts();
  
  return Object.entries(prompts).map(([id, prompt]) => ({
    promptId: id,
    service: prompt.service,
    version: prompt.version,
    parameters: prompt.parameters,
    testResults: prompt.testResults || {
      successRate: 0,
      avgResponseTime: 0,
      qualityScore: 0
    },
    lastUpdated: prompt.lastUpdated
  }));
};