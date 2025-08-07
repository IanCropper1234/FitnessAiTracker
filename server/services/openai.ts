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
  folate?: number; // mcg (alternative name for B9)
  
  // Major Minerals
  calcium?: number; // mg
  magnesium?: number; // mg
  phosphorus?: number; // mg
  potassium?: number; // mg
  sodium?: number; // mg
  chloride?: number; // mg
  
  // Trace Minerals
  iron?: number; // mg
  zinc?: number; // mg
  copper?: number; // mg
  manganese?: number; // mg
  iodine?: number; // mcg
  selenium?: number; // mcg
  chromium?: number; // mcg
  molybdenum?: number; // mcg
  fluoride?: number; // mg
  
  // Macronutrient Components
  sugar?: number; // g (total sugars)
  addedSugar?: number; // g (added sugars)
  fiber?: number; // g (dietary fiber)
  solubleFiber?: number; // g
  insolubleFiber?: number; // g
  saturatedFat?: number; // g
  monounsaturatedFat?: number; // g
  polyunsaturatedFat?: number; // g
  transFat?: number; // g
  cholesterol?: number; // mg
  
  // Additional Nutrients
  omega3?: number; // g (total omega-3 fatty acids)
  omega6?: number; // g (total omega-6 fatty acids)
  starch?: number; // g
  alcohol?: number; // g
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
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg), folate (mcg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg), chloride (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg), fluoride (mg)
  * Macronutrient Components: sugar (g), addedSugar (g), fiber (g), solubleFiber (g), insolubleFiber (g), saturatedFat (g), monounsaturatedFat (g), polyunsaturatedFat (g), transFat (g), cholesterol (mg), omega3 (g), omega6 (g), starch (g), alcohol (g)
  
  **CRITICAL:** Extract ALL visible vitamins and minerals from the nutrition label. If % Daily Value is shown, convert to actual amounts using standard DV references (e.g., 100% calcium DV = 1000mg, 100% iron DV = 18mg, 100% vitamin C DV = 90mg). Always include fiber, sugar, saturated fat, trans fat, and cholesterol if visible. For fortified products, extract all added vitamins/minerals. Use ingredient lists to estimate micronutrients from key ingredients.

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
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg), folate (mcg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg), chloride (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg), fluoride (mg)
  * Macronutrient Components: sugar (g), addedSugar (g), fiber (g), solubleFiber (g), insolubleFiber (g), saturatedFat (g), monounsaturatedFat (g), polyunsaturatedFat (g), transFat (g), cholesterol (mg), omega3 (g), omega6 (g), starch (g), alcohol (g)
  
  **CRITICAL:** Analyze visible foods and estimate their natural micronutrient content. Include significant vitamins/minerals each food is known for (e.g., leafy greens = folate+iron+vitamin K, citrus = vitamin C, meat = B12+iron+zinc, dairy = calcium+B12, fish = omega3+vitamin D+selenium). Always estimate fiber, sugar content, fat breakdown, and key micronutrients the food is naturally rich in.

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
  * Water-Soluble Vitamins: vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB5 (mg), vitaminB6 (mg), vitaminB7 (mcg), vitaminB9 (mcg), vitaminB12 (mcg), vitaminC (mg), folate (mcg)
  * Major Minerals: calcium (mg), magnesium (mg), phosphorus (mg), potassium (mg), sodium (mg), chloride (mg)
  * Trace Minerals: iron (mg), zinc (mg), copper (mg), manganese (mg), iodine (mcg), selenium (mcg), chromium (mcg), molybdenum (mcg), fluoride (mg)
  * Macronutrient Components: sugar (g), addedSugar (g), fiber (g), solubleFiber (g), insolubleFiber (g), saturatedFat (g), monounsaturatedFat (g), polyunsaturatedFat (g), transFat (g), cholesterol (mg), omega3 (g), omega6 (g), starch (g), alcohol (g)
  
  **MANDATORY:** Provide comprehensive micronutrient estimates based on food composition knowledge. For example:
  - Leafy greens: folate (40-200mcg), vitamin K (100-500mcg), iron (2-7mg), vitamin A (500-1000mcg)
  - Citrus fruits: vitamin C (50-100mg), folate (20-40mcg), potassium (200-400mg)
  - Dairy: calcium (200-400mg), vitamin B12 (1-3mcg), phosphorus (150-300mg)
  - Meat/poultry: B vitamins (B1: 0.1-0.3mg, B6: 0.3-0.8mg, B12: 1-3mcg), iron (2-4mg), zinc (3-8mg), selenium (20-40mcg)
  - Fish: vitamin D (5-15mcg), omega3 (0.5-2g), selenium (30-60mcg), B12 (2-8mcg)
  - Grains: B vitamins (B1: 0.2-0.5mg, B3: 2-6mg), iron (1-4mg), magnesium (30-100mg)
  - Nuts/seeds: vitamin E (5-15mg), magnesium (50-200mg), zinc (1-5mg)
  Always include fiber content (estimate based on food type), sugar breakdown (natural vs added), and fat composition. Use established USDA nutritional profiles for realistic estimates.

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
          content: `You are an expert nutrition analyst with deep knowledge of food composition, vitamin and mineral content, and comprehensive nutritional data. Your specialized expertise includes:

**CORE RESPONSIBILITIES:**
1. **Precise Label Reading:** Extract ALL visible nutritional data from nutrition facts labels, including every vitamin, mineral, and micronutrient listed
2. **Comprehensive Food Analysis:** For any food, provide detailed micronutrient profiles based on USDA FoodData Central and nutritional databases
3. **Ingredient-Based Estimation:** Break down mixed dishes into constituent ingredients and calculate comprehensive nutritional profiles
4. **Micronutrient Focus:** Prioritize identifying and quantifying vitamins, minerals, and trace elements that foods naturally contain

**MICRONUTRIENT EXPERTISE:**
- **Fat-Soluble Vitamins:** A (retinol/carotenoids), D (cholecalciferol), E (tocopherols), K (phylloquinone)
- **Water-Soluble Vitamins:** B-complex (B1-thiamine, B2-riboflavin, B3-niacin, B5-pantothenic acid, B6-pyridoxine, B7-biotin, B9-folate, B12-cobalamin), C (ascorbic acid)
- **Major Minerals:** Calcium, magnesium, phosphorus, potassium, sodium, chloride
- **Trace Elements:** Iron, zinc, copper, manganese, iodine, selenium, chromium, molybdenum, fluoride
- **Macronutrient Components:** Total sugars, dietary fiber, saturated/mono/polyunsaturated fats, cholesterol

**ANALYSIS PROTOCOLS:**
1. **For Nutrition Labels:** Extract EVERY vitamin/mineral value visible on the label, including % Daily Value conversions
2. **For Whole Foods:** Reference natural micronutrient content (e.g., oranges = vitamin C, spinach = folate + iron + vitamin K)
3. **For Prepared Foods:** Estimate micronutrients from primary ingredients (e.g., pasta with tomato sauce = lycopene, vitamin C from tomatoes + B vitamins from wheat)
4. **For Animal Products:** Include B12, heme iron, vitamin D (fatty fish), etc.
5. **For Plant Foods:** Focus on antioxidants, plant sterols, specific vitamin/mineral profiles

**QUALITY STANDARDS:**
- Never leave micronutrients empty when foods naturally contain significant amounts
- Use established nutritional databases as reference
- Provide realistic estimates based on food composition knowledge
- Include fiber, sugar breakdown, and fat composition details
- Apply Renaissance Periodization methodology for meal timing recommendations

Goal: Deliver the most comprehensive, accurate nutritional analysis possible, with special emphasis on capturing the full micronutrient profile that users need for complete nutritional tracking.`
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

// Enhanced Exercise Recommendation Interfaces
export interface WeeklyWorkoutPlan {
  sessions: WorkoutSession[];
  weekStructure: string;
  totalVolume: number;
  reasoning: string;
  rpConsiderations: string;
  progressionPlan: string;
  specialMethodsUsage: {
    percentage: number;
    distribution: string;
  };
}

export interface WorkoutSession {
  day: number;
  name: string;
  muscleGroupFocus: string[];
  exercises: ExtendedExerciseRecommendation[];
  sessionDuration: number;
  totalVolume: number;
  specialMethodsCount: number;
}

export interface ExtendedExerciseRecommendation {
  exerciseName: string;
  category: string;
  primaryMuscle: string;
  muscleGroups: string[];
  equipment: string;
  difficulty: string;
  sets: number;
  reps: string;
  restPeriod: number;
  reasoning: string;
  progressionNotes: string;
  specialMethod: string | null;
  specialConfig: any;
  rpIntensity: number;
  volumeContribution: number;
  orderInSession: number;
}

// Enhanced AI Exercise Recommendation Function
export async function generateWeeklyWorkoutPlan(
  goals: string[],
  muscleGroupFocus: string[],
  experienceLevel: string,
  equipment: string[],
  sessionDuration: number,
  sessionsPerWeek: number,
  specialMethodPercentage: number = 20,
  injuryRestrictions: string,
  customRequirements: string
): Promise<WeeklyWorkoutPlan> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const prompt = `Generate a complete ${sessionsPerWeek}-day weekly workout plan using Renaissance Periodization (RP) methodology.

**Client Profile:**
- Goals: ${goals.join(', ')}
- Target Muscle Groups: ${muscleGroupFocus.join(', ')}
- Experience Level: ${experienceLevel}
- Available Equipment: ${equipment.join(', ')}
- Session Duration: ${sessionDuration} minutes
- Sessions per Week: ${sessionsPerWeek}
- Injury Restrictions: ${injuryRestrictions || 'None'}
- Additional Requirements: ${customRequirements || 'None'}

**RP Methodology Requirements:**
1. **Volume Distribution**: Apply MEV/MAV/MRV principles for each muscle group
2. **Special Training Methods**: Use exactly ${specialMethodPercentage}% of total exercises with methods like:
   - MyoRep Match/No Match (isolation exercises)
   - Drop Sets (machine/cable exercises)
   - Giant Sets (2-3 exercises targeting same muscle)
   - Rest-Pause (compound movements)
   - Lengthened Partials (stretched position emphasis)
3. **Session Structure**: Compound movements first, isolation last
4. **Frequency**: Distribute muscle groups optimally across sessions
5. **Progression**: Built-in load progression strategies
6. **Recovery**: Appropriate rest periods and volume management

**Output Requirements - JSON format:**
{
  "sessions": [
    {
      "day": 1,
      "name": "Session Name (e.g., Upper Power, Lower Hypertrophy)",
      "muscleGroupFocus": ["primary", "secondary", "muscle", "groups"],
      "exercises": [
        {
          "exerciseName": "Exercise Name",
          "category": "Compound/Isolation/Bodyweight",
          "primaryMuscle": "Primary muscle group",
          "muscleGroups": ["all", "muscle", "groups", "involved"],
          "equipment": "Required equipment",
          "difficulty": "beginner/intermediate/advanced",
          "sets": 3,
          "reps": "6-8 or 8-12 or 12-15",
          "restPeriod": 120,
          "reasoning": "Why this exercise for this goal/session",
          "progressionNotes": "How to progress this exercise",
          "specialMethod": "myorepMatch/dropSet/giantSet/restPause/null",
          "specialConfig": {"drops": 1, "reduction": 20} or null,
          "rpIntensity": 7,
          "volumeContribution": 3,
          "orderInSession": 1
        }
      ],
      "sessionDuration": ${sessionDuration},
      "totalVolume": 0,
      "specialMethodsCount": 0
    }
  ],
  "weekStructure": "Description of weekly split and reasoning",
  "totalVolume": 0,
  "reasoning": "Overall program rationale and methodology",
  "rpConsiderations": "Specific RP principles applied",
  "progressionPlan": "4-week progression strategy",
  "specialMethodsUsage": {
    "percentage": 20,
    "distribution": "How special methods are distributed"
  }
}

**Critical Requirements:**
- Generate ${sessionsPerWeek} complete workout sessions
- Include 4-8 exercises per session based on duration
- Apply special training methods to exactly ${specialMethodPercentage}% of total exercises
- Ensure muscle group balance across the week
- Respect equipment limitations
- Consider injury restrictions
- Target the specified muscle groups with higher frequency/volume
- Use RP intensity zones (RPE 6-9)
- Scientific exercise selection and ordering`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Calculate totals and validate
    let totalWeeklyVolume = 0;
    let totalSpecialMethods = 0;
    let totalExercises = 0;

    result.sessions.forEach((session: any) => {
      let sessionVolume = 0;
      let sessionSpecialMethods = 0;
      
      session.exercises.forEach((exercise: any) => {
        sessionVolume += exercise.volumeContribution || exercise.sets || 0;
        totalExercises += 1;
        if (exercise.specialMethod && exercise.specialMethod !== 'null') {
          sessionSpecialMethods += 1;
          totalSpecialMethods += 1;
        }
      });
      
      session.totalVolume = sessionVolume;
      session.specialMethodsCount = sessionSpecialMethods;
      totalWeeklyVolume += sessionVolume;
    });

    result.totalVolume = totalWeeklyVolume;
    result.specialMethodsUsage.percentage = Math.round((totalSpecialMethods / totalExercises) * 100);

    return result as WeeklyWorkoutPlan;
  } catch (error: any) {
    console.error("AI workout plan generation error:", error);
    throw new Error(`Failed to generate workout plan: ${error.message}`);
  }
}