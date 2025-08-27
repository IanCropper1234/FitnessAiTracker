import OpenAI from "openai";
import { AIModelConfig } from '../config/ai-config';

/**
 * GPT-5 Adapter Service
 * Handles the transition between GPT-4o (chat.completions) and GPT-5 (responses) APIs
 */
export class GPT5Adapter {
  private openai: OpenAI;

  constructor(openai?: OpenAI) {
    this.openai = openai || new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Unified AI call that automatically selects the appropriate API based on model
   */
  async createCompletion({
    model,
    systemPrompt,
    userPrompt,
    messages,
    responseFormat
  }: {
    model: AIModelConfig;
    systemPrompt: string;
    userPrompt: string;
    messages?: any[];
    responseFormat?: { type: string };
  }): Promise<{ content: string; usage?: any }> {
    // Check if this is a GPT-5 model
    if (this.isGPT5Model(model.name)) {
      return this.callGPT5API(model, systemPrompt, userPrompt, responseFormat);
    } else {
      return this.callGPT4API(model, systemPrompt, userPrompt, messages, responseFormat);
    }
  }

  /**
   * Vision completion for image analysis
   */
  async createVisionCompletion(
    model: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    image: string,
    responseFormat?: { type: string }
  ): Promise<{ content: string; usage?: any }> {
    // Check if this is a GPT-5 model
    if (this.isGPT5Model(model.name)) {
      // For GPT-5, we need to handle vision differently
      const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;
      return this.callGPT5API(model, "", combinedPrompt, responseFormat);
    } else {
      // For GPT-4, use traditional vision API
      return this.callGPT4VisionAPI(model, systemPrompt, userPrompt, image, responseFormat);
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

    // Add response format if specified (GPT-5 uses text.format with correct object structure)
    if (responseFormat?.type === 'json_object') {
      params.text = {
        ...params.text,
        format: { type: 'json_object' }
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
      ],
      max_completion_tokens: model.maxTokens
    };

    // Only add temperature for non-GPT-5 models
    if (!this.isGPT5Model(model.name)) {
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
   * GPT-4 Vision API call for image analysis
   */
  private async callGPT4VisionAPI(
    model: AIModelConfig,
    systemPrompt: string,
    userPrompt: string,
    image: string,
    responseFormat?: { type: string }
  ): Promise<{ content: string; usage?: any }> {
    const params: any = {
      model: model.name,
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
      max_completion_tokens: model.maxTokens
    };

    // Only add temperature for non-GPT-5 models
    if (!this.isGPT5Model(model.name)) {
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
   * Check if the model is a GPT-5 model
   */
  private isGPT5Model(modelName?: string): boolean {
    if (!modelName || typeof modelName !== 'string') {
      console.warn('isGPT5Model: modelName is undefined or not a string:', modelName);
      return false;
    }
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