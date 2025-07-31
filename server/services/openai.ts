import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

export interface MicronutrientData {
  // Fat-Soluble Vitamins
  vitaminA?: number; // mcg RAE
  vitaminD?: number; // mcg
  vitaminE?: number; // mg
  vitaminK?: number; // mcg
  
  // Water-Soluble Vitamins
  vitaminB1?: number; // mg (Thiamine)
  vitaminB2?: number; // mg (Riboflavin)
  vitaminB3?: number; // mg (Niacin)
  vitaminB5?: number; // mg (Pantothenic Acid)
  vitaminB6?: number; // mg
  vitaminB7?: number; // mcg (Biotin)
  vitaminB9?: number; // mcg (Folate)
  vitaminB12?: number; // mcg
  vitaminC?: number; // mg
  
  // Major Minerals
  calcium?: number; // mg
  magnesium?: number; // mg
  phosphorus?: number; // mg
  potassium?: number; // mg
  sodium?: number; // mg
  
  // Trace Minerals
  iron?: number; // mg
  zinc?: number; // mg
  copper?: number; // mg
  manganese?: number; // mg
  iodine?: number; // mcg
  selenium?: number; // mcg
  chromium?: number; // mcg
  molybdenum?: number; // mcg
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
  micronutrients?: MicronutrientData; // comprehensive vitamin and mineral data
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
  portionUnit?: string,
  analysisType: 'nutrition_label' | 'actual_food' = 'nutrition_label'
): Promise<NutritionAnalysis> {
  try {
    // Build prompt based on available inputs
    let prompt = "";
    let messageContent: any = [];

    if (nutritionLabelImage) {
      // Image analysis mode - different prompts based on analysis type
      if (analysisType === 'nutrition_label') {
        // Nutrition label analysis
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
- micronutrients: comprehensive vitamin and mineral data (object with optional fields):
  * Fat-Soluble Vitamins: vitaminA (mcg RAE), vitaminD (mcg), vitaminE (mg), vitaminK (mcg)
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg)
  
  **Note:** Only include micronutrient values that are visible on the nutrition label or can be reasonably estimated from the food type. Use null for unknown values.

Return only valid JSON with all required fields.`
          },
          {
            type: "image_url",
            image_url: {
              url: nutritionLabelImage
            }
          }
        ];
      } else {
        // Actual food photo analysis
        prompt = `Analyze the actual food shown in this image${portionWeight && portionUnit ? ` estimating nutrition for ${portionWeight}${portionUnit}` : foodDescription ? ` for ${quantity} ${unit}(s) of "${foodDescription}"` : ""}.`;
        
        messageContent = [
          {
            type: "text",
            text: prompt + `

**Task:** Estimate nutritional content by analyzing the actual food portion shown in the image.

**Required Analysis:**
1. **Food Identification:** Identify all visible food items, ingredients, and preparation methods
2. **Portion Estimation:** Estimate the serving size/weight based on visual cues (plate size, utensils, comparison objects)
3. **Preparation Assessment:** Consider cooking methods, added oils, sauces, and seasonings visible
4. **Nutrition Estimation:** Provide realistic nutritional estimates based on identified foods and estimated portions

**Output Requirements - JSON format with these exact fields:**
- calories: estimated total calories (number)
- protein: estimated protein in grams (number) 
- carbs: estimated carbohydrates in grams (number)
- fat: estimated fat in grams (number)
- confidence: confidence level 0-1 (number, 0.6-0.8 typical for food photos)
- category: primary macro category (string: "protein", "carb", "fat", or "mixed")
- mealSuitability: suitable meal times (array of strings: "pre-workout", "post-workout", "regular", "snack")
- assumptions: key assumptions about portions, preparation, ingredients (string)
- servingDetails: description of estimated portion size and food components (string)
- micronutrients: comprehensive vitamin and mineral data (object with optional fields):
  * Fat-Soluble Vitamins: vitaminA (mcg RAE), vitaminD (mcg), vitaminE (mg), vitaminK (mcg)
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg)
  
  **Note:** Estimate key micronutrient values based on visible foods and typical nutritional profiles.

Return only valid JSON with all required fields.`
          },
          {
            type: "image_url",
            image_url: {
              url: nutritionLabelImage
            }
          }
        ];
      }
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
- micronutrients: comprehensive vitamin and mineral data (object with optional fields):
  * Fat-Soluble Vitamins: vitaminA (mcg RAE), vitaminD (mcg), vitaminE (mg), vitaminK (mcg)
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg)
  
  **Note:** Based on food type and ingredients, estimate key micronutrient values from USDA database knowledge. Focus on nutrients the food is known to be rich in.

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
      servingDetails: result.servingDetails || `${quantity} ${unit}(s) as described`,
      micronutrients: result.micronutrients || {}
    };

  } catch (error: any) {
    console.error("OpenAI nutrition analysis error:", error);
    throw new Error(`Failed to analyze nutrition: ${error.message}`);
  }
}