import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface NutritionAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

export interface MacroRecommendation {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  reasoning: string;
}

export interface TrainingAdjustment {
  volumeChange: number; // +/- sets
  intensityChange: number; // +/- weight percentage
  recommendation: string;
  reasoning: string;
}

export async function analyzeNutrition(
  foodDescription: string,
  quantity: number,
  unit: string
): Promise<NutritionAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a nutrition expert. Analyze the nutritional content of food items and provide accurate macronutrient information. 
          Respond with JSON in this format: { "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number }
          Confidence should be between 0 and 1. Use standard nutrition databases as reference.`
        },
        {
          role: "user",
          content: `Analyze the nutritional content of ${quantity} ${unit} of ${foodDescription}. 
          Provide calories, protein (g), carbs (g), and fat (g).`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      calories: Math.round(result.calories || 0),
      protein: Math.round((result.protein || 0) * 10) / 10,
      carbs: Math.round((result.carbs || 0) * 10) / 10,
      fat: Math.round((result.fat || 0) * 10) / 10,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
  } catch (error) {
    throw new Error(`Failed to analyze nutrition: ${error.message}`);
  }
}

export async function calculateMacros(
  weight: number,
  height: number,
  age: number,
  activityLevel: string,
  goal: string
): Promise<MacroRecommendation> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a sports nutrition expert following Renaissance Periodization methodology. 
          Calculate daily macro targets based on scientific principles. 
          Respond with JSON in this format: { "dailyCalories": number, "protein": number, "carbs": number, "fat": number, "reasoning": string }
          Use evidence-based calculations for optimal body composition.`
        },
        {
          role: "user",
          content: `Calculate macros for:
          - Weight: ${weight}kg
          - Height: ${height}cm  
          - Age: ${age} years
          - Activity level: ${activityLevel}
          - Goal: ${goal}
          
          Provide daily calories and macros in grams with detailed reasoning.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      dailyCalories: Math.round(result.dailyCalories || 2000),
      protein: Math.round((result.protein || 150) * 10) / 10,
      carbs: Math.round((result.carbs || 200) * 10) / 10,
      fat: Math.round((result.fat || 70) * 10) / 10,
      reasoning: result.reasoning || "Standard macro calculation based on provided parameters."
    };
  } catch (error) {
    throw new Error(`Failed to calculate macros: ${error.message}`);
  }
}

export async function generateTrainingAdjustment(
  pumpQuality: number,
  muscleSoreness: number,
  perceivedEffort: number,
  currentVolume: number,
  currentWeek: number
): Promise<TrainingAdjustment> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Renaissance Periodization training expert. Use auto-regulation principles to adjust training volume and intensity.
          Respond with JSON in this format: { "volumeChange": number, "intensityChange": number, "recommendation": string, "reasoning": string }
          Volume change is +/- sets, intensity change is +/- weight percentage.`
        },
        {
          role: "user",
          content: `Analyze training feedback and recommend adjustments:
          - Pump quality: ${pumpQuality}/10
          - Muscle soreness: ${muscleSoreness}/10
          - Perceived effort: ${perceivedEffort}/10
          - Current volume: ${currentVolume} sets
          - Current week: ${currentWeek}
          
          Provide specific training adjustments with reasoning.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      volumeChange: Math.round(result.volumeChange || 0),
      intensityChange: Math.round((result.intensityChange || 0) * 10) / 10,
      recommendation: result.recommendation || "Maintain current training parameters.",
      reasoning: result.reasoning || "Based on current recovery and performance metrics."
    };
  } catch (error) {
    throw new Error(`Failed to generate training adjustment: ${error.message}`);
  }
}
