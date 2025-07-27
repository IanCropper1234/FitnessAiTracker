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
  foodDescription?: string, 
  quantity: number = 1, 
  unit: string = "serving",
  nutritionLabelImage?: string,
  portionWeight?: number,
  portionUnit?: string
): Promise<NutritionAnalysis> {
  try {
    // Build prompt based on available inputs
    let prompt = "";
    let messageContent: any = [];

    if (nutritionLabelImage) {
      // Image analysis mode
      prompt = `Analyze the nutrition facts label in this image${portionWeight && portionUnit ? ` for ${portionWeight}${portionUnit}` : foodDescription ? ` for ${quantity} ${unit}(s) of "${foodDescription}"` : ""}.`;
      
      messageContent = [
        {
          type: "text",
          text: prompt + `

**Task:** Extract nutritional information from the nutrition facts label in the image.

**Required Analysis:**
1. **Label Reading:** Carefully read all text and numerical values from the nutrition facts label
2. **Serving Size Recognition:** Identify the serving size shown on the label
3. **Portion Calculation:** ${portionWeight && portionUnit ? `Calculate nutrition for ${portionWeight}${portionUnit} based on the label's serving size` : `Use the serving size as shown on the label`}
4. **Accuracy Priority:** Base all values directly on what's visible in the label

**Output Requirements - JSON format with these exact fields:**
- calories: total calories (number)
- protein: protein in grams (number) 
- carbs: carbohydrates in grams (number)
- fat: fat in grams (number)
- confidence: confidence level 0-1 (number, 1 = very confident from clear label)
- category: primary macro category (string: "protein", "carb", "fat", or "mixed")
- mealSuitability: suitable meal times (array of strings: "pre-workout", "post-workout", "regular", "snack")
- assumptions: any assumptions made if label is unclear (string)
- servingDetails: clarification of portion analyzed from label (string)

Return only valid JSON with all required fields.`
        },
        {
          type: "image_url",
          image_url: {
            url: nutritionLabelImage
          }
        }
      ];
    } else if (foodDescription) {
      // Text description mode
      prompt = `Analyze the nutritional content of: "${foodDescription}" for ${quantity} ${unit}(s).`;
      messageContent = [
        {
          type: "text",
          text: prompt + `

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

Return only valid JSON with all required fields.`
        }
      ];
    } else {
      throw new Error("Either foodDescription or nutritionLabelImage must be provided");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert nutrition assistant specializing in analyzing food descriptions and nutrition labels, estimating their nutritional content, especially calories and macronutrients (protein, carbohydrates, fat). Your expertise includes:

1. **Interpret User Descriptions & Images:** Carefully read food descriptions and analyze nutrition facts labels from images
2. **Portion & Detail Recognition:** Accurately identify quantities, portion sizes, and preparation methods
3. **Label Reading:** Extract precise nutritional data from nutrition facts labels in images
4. **Database-Informed Estimation:** Base estimates on USDA FoodData Central, Open Food Facts, and trusted sources
5. **Transparent Methodology:** Always indicate assumptions and reasoning for accuracy
6. **Renaissance Periodization Integration:** Apply RP methodology for food categorization and meal timing recommendations

Goal: Provide the most realistic, transparent, and actionable nutritional information to support users in making healthy choices and accurately tracking their intake.`
        },
        {
          role: "user",
          content: messageContent
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