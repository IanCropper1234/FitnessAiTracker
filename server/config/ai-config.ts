// AI Model Configuration System
// Supports dynamic model switching and A/B testing for GPT migration

export interface AIModelConfig {
  name: string;
  provider: 'openai';
  version: string;
  maxTokens: number;
  temperature: number;
  reasoning?: {
    effort: 'minimal' | 'low' | 'medium' | 'high';
  };
  text?: {
    verbosity: 'low' | 'medium' | 'high';
  };
  capabilities: {
    vision: boolean;
    jsonMode: boolean;
    functionCalling: boolean;
    reasoning?: boolean;
  };
  costPerToken: {
    input: number;
    output: number;
  };
}

export interface AIServiceConfig {
  exerciseRecommendations: AIModelConfig;
  nutritionAnalysis: AIModelConfig;
  foodAnalysis: AIModelConfig;
  programOptimization: AIModelConfig;
  multiImageNutrition: AIModelConfig;
}

// Model definitions
export const AI_MODELS: Record<string, AIModelConfig> = {
  'gpt-4o': {
    name: 'gpt-4o',
    provider: 'openai',
    version: '2024-05-13',
    maxTokens: 2000,
    temperature: 0.7,
    capabilities: {
      vision: true,
      jsonMode: true,
      functionCalling: true,
    },
    costPerToken: {
      input: 0.000005, // $5 per 1M input tokens
      output: 0.000015, // $15 per 1M output tokens
    }
  },
  'gpt-5-mini': {
    name: 'gpt-5-mini',
    provider: 'openai', 
    version: '2024-12-17',
    maxTokens: 4000, // Increased for comprehensive nutrition analysis
    temperature: 0.7,
    reasoning: {
      effort: 'low' // Faster responses for nutrition analysis - reduced from medium
    },
    text: {
      verbosity: 'low' // More concise responses for faster processing
    },
    capabilities: {
      vision: true,
      jsonMode: true,
      functionCalling: true,
      reasoning: true,
    },
    costPerToken: {
      input: 0.0000015, // $1.5 per 1M input tokens (70% cost reduction)
      output: 0.000006, // $6 per 1M output tokens (60% cost reduction)
    }
  }
};

// Environment-based configuration with GPT-5-mini as default
export const getAIConfig = (): AIServiceConfig => {
  // Allow per-service model override via environment variables
  const exerciseModel = process.env.AI_MODEL_EXERCISE || process.env.AI_MODEL || 'gpt-5-mini';
  const nutritionModel = process.env.AI_MODEL_NUTRITION || process.env.AI_MODEL || 'gpt-5-mini';
  const foodAnalysisModel = process.env.AI_MODEL_FOOD || process.env.AI_MODEL || 'gpt-5-mini';
  const programOptimizationModel = process.env.AI_MODEL_PROGRAM || process.env.AI_MODEL || 'gpt-5-mini';
  const multiImageModel = process.env.AI_MODEL_MULTI_IMAGE || process.env.AI_MODEL || 'gpt-4o'; // 臨時回退到 GPT-4o 以改善中文營養標籤讀取精確度

  return {
    exerciseRecommendations: AI_MODELS[exerciseModel] || AI_MODELS['gpt-5-mini'],
    nutritionAnalysis: AI_MODELS[nutritionModel] || AI_MODELS['gpt-5-mini'],
    foodAnalysis: AI_MODELS[foodAnalysisModel] || AI_MODELS['gpt-5-mini'],
    programOptimization: AI_MODELS[programOptimizationModel] || AI_MODELS['gpt-5-mini'],
    multiImageNutrition: AI_MODELS[multiImageModel] || AI_MODELS['gpt-5-mini'],
  };
};

// A/B Testing Configuration
export interface ABTestConfig {
  enabled: boolean;
  testName: string;
  controlModel: string;
  testModel: string;
  trafficSplit: number; // 0.0 to 1.0 (percentage for test model)
  excludeUserIds?: string[];
}

export const getABTestConfig = (): ABTestConfig => {
  // Direct migration: Disable A/B testing for full GPT-5-mini deployment
  const enabled = process.env.AI_AB_TEST_ENABLED === 'true' ? false : false; // Force disable
  const testName = process.env.AI_AB_TEST_NAME || 'gpt5-mini-migration-complete';
  const trafficSplit = parseFloat(process.env.AI_AB_TEST_SPLIT || '1.0'); // 100% to new model

  return {
    enabled,
    testName,
    controlModel: process.env.AI_AB_CONTROL_MODEL || 'gpt-4o',
    testModel: process.env.AI_AB_TEST_MODEL || 'gpt-5-mini',
    trafficSplit: Math.max(0, Math.min(1, trafficSplit)),
    excludeUserIds: process.env.AI_AB_EXCLUDE_USERS ? 
      process.env.AI_AB_EXCLUDE_USERS.split(',') : []
  };
};

// Model Selection Logic with A/B Testing Support
export const selectModelForUser = (
  service: keyof AIServiceConfig,
  userId: string
): AIModelConfig => {
  const config = getAIConfig();
  const abConfig = getABTestConfig();

  // Check if A/B testing is enabled and user is not excluded
  if (abConfig.enabled && !abConfig.excludeUserIds?.includes(userId)) {
    // Use simple hash-based assignment for consistent user experience
    const userHash = hashUserId(userId);
    const shouldUseTestModel = userHash < abConfig.trafficSplit;

    if (shouldUseTestModel) {
      return AI_MODELS[abConfig.testModel] || config[service];
    } else {
      return AI_MODELS[abConfig.controlModel] || config[service];
    }
  }

  // Default to configured model
  return config[service];
};

// Simple hash function for consistent user assignment
const hashUserId = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / Math.pow(2, 31); // Normalize to 0-1
};

// Export configuration for easy access
export const AI_CONFIG = getAIConfig();
export const AB_TEST_CONFIG = getABTestConfig();