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

    // Add response format if specified
    if (responseFormat) {
      params.response_format = responseFormat;
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
      ],
      max_tokens: model.maxTokens,
      temperature: model.temperature
    };

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
   * Check if the model is a GPT-5 model
   */
  private isGPT5Model(modelName: string): boolean {
    return modelName.startsWith('gpt-5');
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