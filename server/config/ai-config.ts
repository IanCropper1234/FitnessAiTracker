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
    maxTokens: 2000,
    temperature: 1.0,
    reasoning: {
      effort: 'medium'
    },
    text: {
      verbosity: 'medium'
    },
    capabilities: {
      vision: true,
      jsonMode: true,
      functionCalling: true,
      reasoning: true,
    },
    costPerToken: {
      input: 0.0000015, // $1.5 per 1M input tokens
      output: 0.000006, // $6 per 1M output tokens
    }
  }
};

// Environment-based configuration with GPT-5-mini as default
export const getAIConfig = (): AIServiceConfig => {
  // Force all services to use GPT-5-mini
  return {
    exerciseRecommendations: AI_MODELS['gpt-5-mini'],
    nutritionAnalysis: AI_MODELS['gpt-5-mini'],
    foodAnalysis: AI_MODELS['gpt-5-mini'],
    programOptimization: AI_MODELS['gpt-5-mini'],
    multiImageNutrition: AI_MODELS['gpt-5-mini'],
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
  // Force disable A/B testing - all users use GPT-5-mini
  return {
    enabled: false,
    testName: 'gpt5-mini-full-deployment',
    controlModel: 'gpt-5-mini',
    testModel: 'gpt-5-mini',
    trafficSplit: 1.0,
    excludeUserIds: []
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