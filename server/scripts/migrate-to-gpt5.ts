/**
 * GPT-5 Migration Script
 * Handles the complete migration from GPT-4o to GPT-5-mini
 */

import { getAIConfig, selectModelForUser } from '../config/ai-config';

export class GPT5MigrationManager {
  
  /**
   * Check migration readiness
   */
  static checkMigrationReadiness(): {
    ready: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      issues.push('OPENAI_API_KEY environment variable not set');
    }
    
    // Check if GPT-5 is enabled in configuration
    const config = getAIConfig();
    const gpt5Services = Object.values(config).filter(model => 
      model.name.startsWith('gpt-5')
    ).length;
    
    if (gpt5Services === 0) {
      recommendations.push('No services configured for GPT-5 models');
    }
    
    // Check A/B testing configuration
    if (process.env.AI_AB_TEST_ENABLED === 'true') {
      recommendations.push('A/B testing is enabled - migration will be gradual');
    } else {
      recommendations.push('A/B testing disabled - migration will be immediate');
    }
    
    return {
      ready: issues.length === 0,
      issues,
      recommendations
    };
  }
  
  /**
   * Get migration statistics
   */
  static getMigrationStats(): {
    totalServices: number;
    gpt4Services: number;
    gpt5Services: number;
    migrationProgress: number;
  } {
    const config = getAIConfig();
    const services = Object.values(config);
    
    const gpt4Services = services.filter(model => model.name.startsWith('gpt-4')).length;
    const gpt5Services = services.filter(model => model.name.startsWith('gpt-5')).length;
    const totalServices = services.length;
    
    return {
      totalServices,
      gpt4Services,
      gpt5Services,
      migrationProgress: Math.round((gpt5Services / totalServices) * 100)
    };
  }
  
  /**
   * Validate GPT-5 configuration
   */
  static validateGPT5Config(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const config = getAIConfig();
      
      Object.entries(config).forEach(([serviceName, modelConfig]) => {
        if (modelConfig.name.startsWith('gpt-5')) {
          // Check reasoning configuration
          if (!modelConfig.reasoning) {
            warnings.push(`Service ${serviceName}: Missing reasoning configuration for GPT-5`);
          }
          
          // Check text verbosity configuration
          if (!modelConfig.text) {
            warnings.push(`Service ${serviceName}: Missing text verbosity configuration for GPT-5`);
          }
          
          // Check capabilities
          if (!modelConfig.capabilities.reasoning) {
            warnings.push(`Service ${serviceName}: Reasoning capability not enabled`);
          }
        }
      });
      
    } catch (error) {
      errors.push(`Configuration validation failed: ${error}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get optimal GPT-5 settings for different use cases
   */
  static getOptimalSettings(useCase: 'nutrition' | 'exercise' | 'analysis' | 'general') {
    const settings = {
      nutrition: {
        reasoning: { effort: 'medium' },
        text: { verbosity: 'medium' },
        temperature: 0.3,
        description: 'Balanced reasoning for accurate nutrition analysis'
      },
      exercise: {
        reasoning: { effort: 'high' },
        text: { verbosity: 'high' },
        temperature: 0.7,
        description: 'High reasoning for complex exercise programming'
      },
      analysis: {
        reasoning: { effort: 'high' },
        text: { verbosity: 'medium' },
        temperature: 0.5,
        description: 'Deep reasoning with concise output for analytics'
      },
      general: {
        reasoning: { effort: 'medium' },
        text: { verbosity: 'medium' },
        temperature: 0.7,
        description: 'Balanced settings for general use'
      }
    };
    
    return settings[useCase];
  }
}

/**
 * Environment variable helper for GPT-5 migration
 */
export class GPT5EnvironmentManager {
  
  /**
   * Get required environment variables for GPT-5
   */
  static getRequiredEnvVars(): string[] {
    return [
      'OPENAI_API_KEY',
      'AI_MODEL', // Default model
      'AI_AB_TEST_ENABLED', // A/B testing
      'AI_AB_TEST_MODEL', // Test model for A/B
      'AI_AB_CONTROL_MODEL', // Control model for A/B
      'AI_AB_TEST_SPLIT' // Traffic split percentage
    ];
  }
  
  /**
   * Get optimal environment configuration for production
   */
  static getProductionEnvConfig(): Record<string, string> {
    return {
      AI_MODEL: 'gpt-5-mini',
      AI_AB_TEST_ENABLED: 'false', // Disable A/B testing in production
      AI_MODEL_EXERCISE: 'gpt-5-mini',
      AI_MODEL_NUTRITION: 'gpt-5-mini',
      AI_MODEL_FOOD: 'gpt-5-mini',
      AI_MODEL_PROGRAM: 'gpt-5-mini',
      AI_MODEL_MULTI_IMAGE: 'gpt-5-mini'
    };
  }
  
  /**
   * Get gradual migration environment configuration
   */
  static getGradualMigrationConfig(): Record<string, string> {
    return {
      AI_MODEL: 'gpt-4o', // Keep default as GPT-4o
      AI_AB_TEST_ENABLED: 'true',
      AI_AB_CONTROL_MODEL: 'gpt-4o',
      AI_AB_TEST_MODEL: 'gpt-5-mini',
      AI_AB_TEST_SPLIT: '0.2', // 20% traffic to GPT-5
      // Gradually migrate specific services
      AI_MODEL_NUTRITION: 'gpt-5-mini', // Start with nutrition
      AI_MODEL_FOOD: 'gpt-5-mini' // And food analysis
    };
  }
}

export default GPT5MigrationManager;