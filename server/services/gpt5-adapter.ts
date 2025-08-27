import OpenAI from "openai";
import { AIModelConfig } from '../config/ai-config';

/**
 * GPT-5 Adapter Service
 * Handles the transition between GPT-4o (chat.completions) and GPT-5 (responses) APIs
 */
export class GPT5Adapter {
  private openai: OpenAI;

  constructor(openai: OpenAI) {
    this.openai = openai;
  }

  /**
   * Unified AI call that automatically selects the appropriate API based on model
   */
  async createCompletion(config: {
    model: AIModelConfig;
    systemPrompt: string;
    userPrompt: string;
    messages?: any[];
    responseFormat?: { type: string };
  }): Promise<{ content: string; usage?: any }> {
    const { model, systemPrompt, userPrompt, messages, responseFormat } = config;

    // Check if this is a GPT-5 model
    if (this.isGPT5Model(model.name)) {
      return this.callGPT5API(model, systemPrompt, userPrompt, responseFormat);
    } else {
      return this.callGPT4API(model, systemPrompt, userPrompt, messages, responseFormat);
    }
  }

  /**
   * GPT-5 API call using the new /responses endpoint
   */
  private async callGPT5API(
    model: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    responseFormat?: { type: string }
  ): Promise<{ content: string; usage?: any }> {
    const input = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

    const params: any = {
      model: model.name,
      input,
      reasoning: model.reasoning || { effort: 'medium' },
      text: model.text || { verbosity: 'medium' }
    };

    // Add response format if specified (GPT-5 uses text.format with correct value)
    if (responseFormat?.type === 'json_object') {
      params.text = {
        ...params.text,
        format: 'json_object'
      };
    }

    const response = await this.openai.responses.create(params);

    return {
      content: response.output_text,
      usage: response.usage
    };
  }

  /**
   * GPT-4 API call using the traditional chat.completions endpoint
   */
  private async callGPT4API(
    model: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    messages?: any[],
    responseFormat?: { type: string }
  ): Promise<{ content: string; usage?: any }> {
    const params: any = {
      model: model.name,
      messages: messages || [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    // Use max_completion_tokens for GPT-5-mini and newer models
    if (model.name.includes('gpt-5') || model.name.includes('o1')) {
      params.max_completion_tokens = model.maxTokens;
      // GPT-5-mini only supports temperature = 1.0 (default)
      if (model.temperature !== 1.0) {
        console.warn(`GPT-5-mini only supports temperature=1.0, ignoring temperature=${model.temperature}`);
      }
      // Don't set temperature parameter for GPT-5-mini (uses default 1.0)
    } else {
      params.max_tokens = model.maxTokens;
      params.temperature = model.temperature;
    }

    if (responseFormat) {
      params.response_format = responseFormat;
    }

    const response = await this.openai.chat.completions.create(params);

    return {
      content: response.choices[0].message.content || '',
      usage: response.usage
    };
  }

  /**
   * Check if the model is a GPT-5 model that uses the responses API
   * Note: GPT-5-mini still uses chat.completions API
   */
  private isGPT5Model(modelName: string): boolean {
    // Currently no models use the responses API in production
    // GPT-5-mini uses chat.completions with max_completion_tokens
    return false;
  }

  /**
   * Get optimal reasoning effort based on task complexity
   */
  static getOptimalReasoningEffort(taskType: 'simple' | 'medium' | 'complex'): 'minimal' | 'low' | 'medium' | 'high' {
    switch (taskType) {
      case 'simple':
        return 'minimal'; // Fast responses for simple tasks
      case 'medium':
        return 'medium';  // Balanced for most tasks
      case 'complex':
        return 'high';    // Deep reasoning for complex tasks
      default:
        return 'medium';
    }
  }

  /**
   * Get optimal verbosity based on use case
   */
  static getOptimalVerbosity(useCase: 'concise' | 'standard' | 'detailed'): 'low' | 'medium' | 'high' {
    switch (useCase) {
      case 'concise':
        return 'low';     // Quick answers
      case 'standard':
        return 'medium';  // Balanced explanations
      case 'detailed':
        return 'high';    // Comprehensive explanations
      default:
        return 'medium';
    }
  }
}