// AI Nutrition Analysis service - server-side API calls only

interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: string;
  goals: string[];
  healthConditions?: string[];
}

interface NutritionAnalysisRequest {
  userProfile: UserProfile;
  nutritionData: any[];
  timeRange: string;
}

interface MicronutrientAnalysis {
  nutrient: string;
  currentIntake: number;
  recommendedIntake: number;
  unit: string;
  status: 'deficient' | 'adequate' | 'excessive';
  healthImpact: string;
  foodSources: string[];
  supplementRecommendation?: string;
}

interface NutritionInsight {
  category: string;
  insight: string;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high';
}

interface AINutritionAnalysisResponse {
  overallRating: number;
  macronutrientAnalysis: {
    proteinStatus: string;
    carbStatus: string;
    fatStatus: string;
  };
  micronutrientAnalysis: MicronutrientAnalysis[];
  rdaComparison: {
    meetsRDA: string[];
    belowRDA: string[];
    exceedsRDA: string[];
  };
  personalizedInsights: NutritionInsight[];
  supplementationAdvice?: string[];
  nextSteps?: string[];
}

interface FoodItem {
  name: string;
  confidence: number;
  estimatedWeight: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
}

interface FoodAnalysisResponse {
  foodItems: FoodItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: number;
  suggestions: string[];
}

export class AINutritionAnalysisService {
  
  /**
   * Analyze nutrition data and provide comprehensive insights
   */
  static async analyzeNutrition(
    request: NutritionAnalysisRequest
  ): Promise<AINutritionAnalysisResponse> {
    try {
      const response = await fetch('/api/ai/nutrition-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze nutrition: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error analyzing nutrition:', error);
      throw new Error(`Failed to analyze nutrition: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Analyze food from image
   */
  static async analyzeFood(
    base64Image: string,
    context?: {
      mealType?: string;
      estimatedPortion?: string;
    }
  ): Promise<FoodAnalysisResponse> {
    try {
      const response = await fetch('/api/ai/food-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: base64Image,
          context
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze food image: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error analyzing food image:', error);
      throw new Error(`Failed to analyze food image: ${error?.message || 'Unknown error'}`);
    }
  }
}