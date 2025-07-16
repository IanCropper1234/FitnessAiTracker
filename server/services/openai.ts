import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function analyzeNutrition(
  foodDescription: string, 
  quantity: number = 1, 
  unit: string = "serving"
): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}> {
  try {
    const prompt = `Analyze the nutritional content of: "${foodDescription}" for ${quantity} ${unit}(s).

Please provide accurate nutritional information in JSON format with these exact fields:
- calories: total calories (number)
- protein: protein in grams (number) 
- carbs: carbohydrates in grams (number)
- fat: fat in grams (number)
- confidence: confidence level 0-1 (number, where 1 is very confident)

Be as accurate as possible based on standard nutritional databases. If the description is vague, make reasonable assumptions and lower the confidence score.

Examples:
- "100g grilled chicken breast" → high confidence 
- "a sandwich" → lower confidence due to vagueness
- "2 slices whole wheat bread with peanut butter" → medium-high confidence

Return only valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert. Analyze food descriptions and provide accurate nutritional information in JSON format."
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
      confidence: result.confidence || 0.8
    };

  } catch (error: any) {
    console.error("OpenAI nutrition analysis error:", error);
    throw new Error(`Failed to analyze nutrition: ${error.message}`);
  }
}