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
  assumptions?: string; // key assumptions made during analysis
  servingDetails?: string; // clarification of portion analyzed
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

**Task:** Provide detailed nutritional analysis with transparent methodology and clear assumptions.

**Required Analysis:**
1. **Portion & Detail Recognition:** Accurately identify quantities, portion sizes, and preparation methods
2. **Ingredient Breakdown:** For mixed dishes, infer probable ingredients and proportions based on common recipes
3. **Database-Informed Estimation:** Base estimates on USDA FoodData Central, Open Food Facts, and trusted sources
4. **Assumption Transparency:** Clearly state any assumptions made due to ambiguous descriptions

**Output Requirements - JSON format with these exact fields:**
- calories: total calories (number)
- protein: protein in grams (number) 
- carbs: carbohydrates in grams (number)
- fat: fat in grams (number)
- confidence: confidence level 0-1 (number, where 1 is very confident)
- category: primary macro category (string: "protein", "carb", "fat", or "mixed")
- mealSuitability: suitable meal times (array of strings: "pre-workout", "post-workout", "regular", "snack")
- assumptions: key assumptions made (string)
- servingDetails: clarification of portion analyzed (string)

**Category Guidelines (Renaissance Periodization methodology):**
- "protein": >20g protein per 100 calories (chicken, fish, eggs, protein powder)
- "carb": >15g carbs per 100 calories, low fat (rice, oats, fruits, bread)  
- "fat": >8g fat per 100 calories (nuts, oils, avocado, fatty fish)
- "mixed": balanced macros or doesn't fit above categories

**Meal Suitability Guidelines:**
- "pre-workout": high carbs, moderate protein, low fat (fast energy)
- "post-workout": high protein, moderate carbs, low fat (recovery)
- "regular": balanced macros for main meals
- "snack": appropriate for between-meal consumption

**Analysis Process:**
- If description is vague, make reasonable assumptions based on typical serving sizes
- For mixed dishes, break down into probable ingredients and proportions
- Consider preparation methods that affect calories (grilled vs fried, etc.)
- Indicate uncertainty levels appropriately in confidence score
- Provide serving details and key assumptions for transparency

**Examples:**
- "grilled chicken sandwich" → Assume: 1 medium sandwich (~180g), standard mayo, grilled chicken breast, regular bun
- "medium bowl Thai green curry" → Assume: 300ml serving, chicken, eggplant, coconut milk, typical recipe proportions
- "2 slices pizza" → Assume: medium pizza slices, cheese pizza unless specified otherwise

Return only valid JSON with all required fields.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert nutrition assistant specializing in analyzing food descriptions and estimating their nutritional content, especially calories and macronutrients (protein, carbohydrates, fat). Your expertise includes:

1. **Interpret User Descriptions:** Carefully read food, meal, or recipe descriptions, whether simple ("grilled chicken sandwich") or elaborate ("a medium bowl of homemade Thai green curry with chicken, eggplant, coconut milk, and white rice").

2. **Portion & Detail Recognition:** Accurately identify and estimate quantities, portion sizes (e.g., "medium bowl", "2 slices"), and preparation methods that might affect calorie/macro values.

3. **Ingredient Breakdown:** For mixed dishes or ambiguous terms, intelligently infer the most probable ingredients and proportions based on common recipes and dietary habits. When a description is vague, clarify assumptions (e.g., "assuming regular mayonnaise").

4. **Database-Informed Estimation:** Base your answers on widely accepted nutrition databases (such as USDA FoodData Central, Open Food Facts, or similar trusted international sources) and up-to-date averages for regional/cultural variations. Use crowd-sourced or brand-level data when needed.

5. **Transparent Methodology:** Always indicate any notable assumptions, explain your reasoning for portion sizes, and state confidence levels based on description completeness.

6. **Renaissance Periodization Integration:** Apply RP methodology for food categorization and meal timing recommendations to support optimal training and recovery.

Goal: Provide the most realistic, transparent, and actionable nutritional information to support users in making healthy choices and accurately tracking their intake.`
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
      mealSuitability: result.mealSuitability || ["regular"],
      assumptions: result.assumptions || "Standard serving size and preparation method assumed",
      servingDetails: result.servingDetails || `${quantity} ${unit}(s) as described`
    };

  } catch (error: any) {
    console.error("OpenAI nutrition analysis error:", error);
    throw new Error(`Failed to analyze nutrition: ${error.message}`);
  }
}