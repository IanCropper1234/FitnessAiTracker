import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

export interface NutritionAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  category?: string; // protein, carb, fat, mixed
  mealSuitability?: string[]; // pre-workout, post-workout, regular, snack
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function analyzeNutrition(
  foodDescription: string, 
  quantity: number = 1, 
  unit: string = "serving"
): Promise<NutritionAnalysis> {
  try {
    const prompt = `Analyze the nutritional content of: "${foodDescription}" for ${quantity} ${unit}(s).

Please provide accurate nutritional information in JSON format with these exact fields:
- calories: total calories (number)
- protein: protein in grams (number) 
- carbs: carbohydrates in grams (number)
- fat: fat in grams (number)
- confidence: confidence level 0-1 (number, where 1 is very confident)
- category: primary macro category (string: "protein", "carb", "fat", or "mixed")
- mealSuitability: suitable meal times (array of strings: "pre-workout", "post-workout", "regular", "snack")

Category Guidelines (Renaissance Periodization methodology):
- "protein": >20g protein per 100 calories (chicken, fish, eggs, protein powder)
- "carb": >15g carbs per 100 calories, low fat (rice, oats, fruits, bread)
- "fat": >8g fat per 100 calories (nuts, oils, avocado, fatty fish)
- "mixed": balanced macros or doesn't fit above categories

Meal Suitability Guidelines:
- "pre-workout": high carbs, moderate protein, low fat (fast energy)
- "post-workout": high protein, moderate carbs, low fat (recovery)
- "regular": balanced macros for main meals
- "snack": appropriate for between-meal consumption

Examples:
- "100g grilled chicken breast" → category: "protein", suitability: ["post-workout", "regular"]
- "1 banana" → category: "carb", suitability: ["pre-workout", "snack"]
- "30g almonds" → category: "fat", suitability: ["regular", "snack"]
- "oatmeal with berries" → category: "mixed", suitability: ["pre-workout", "regular"]

Return only valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in Renaissance Periodization methodology. Analyze food descriptions and categorize them for optimal meal timing and macro distribution."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1 // Low temperature for consistent nutritional data
    });

    const responseContent = response.choices[0].message.content;
    console.log("OpenAI Raw Response:", responseContent);
    
    const result = JSON.parse(responseContent || "{}");
    
    // Validate the response has required fields
    if (typeof result.calories !== 'number' || 
        typeof result.protein !== 'number' || 
        typeof result.carbs !== 'number' || 
        typeof result.fat !== 'number') {
      console.error("Invalid OpenAI response:", result);
      throw new Error("Invalid nutrition analysis response - missing or invalid numeric fields");
    }

    return {
      calories: Math.round(result.calories * 100) / 100,
      protein: Math.round(result.protein * 100) / 100,
      carbs: Math.round(result.carbs * 100) / 100,
      fat: Math.round(result.fat * 100) / 100,
      confidence: result.confidence || 0.8,
      category: result.category || "mixed",
      mealSuitability: result.mealSuitability || ["regular"]
    };

  } catch (error: any) {
    console.error("OpenAI nutrition analysis error:", error);
    throw new Error(`Failed to analyze nutrition: ${error.message}`);
  }
}