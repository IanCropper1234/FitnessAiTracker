import { db } from "../db";
import { 
  dietGoals, 
  dailyWellnessCheckins,
  nutritionGoals,
  weeklyNutritionGoals,
  users
} from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";

interface RecoveryNutritionPlan {
  adjustedCalories: number;
  adjustedProtein: number;
  adjustedCarbs: number;
  adjustedFat: number;
  hydrationMultiplier: number; // 1.5x normal for illness
  micronutrientFocus: string[];
  supplementRecommendations: string[];
  recoveryPriorities: string[];
}

interface RecoveryAdjustments {
  calorieAdjustment: number; // percentage change
  proteinBoost: number; // percentage increase
  hydrationFocus: boolean;
  micronutrientEmphasis: boolean;
  illnessModifier: number;
}

interface IllnessNutritionProtocol {
  phase: 'acute' | 'recovery' | 'return';
  macroAdjustments: {
    calories: number; // percentage of normal
    protein: number; // percentage of normal
    carbs: number; // percentage of normal
    fat: number; // percentage of normal
  };
  priorities: string[];
  duration: string;
}

export class NutritionRecoveryService {

  /**
   * Calculate illness-specific nutrition adjustments based on RP methodology
   * Emphasizes immune support, hydration, and protein maintenance
   */
  static async calculateIllnessNutrition(
    userId: number,
    illnessSeverity: number, // 1-5 scale
    illnessType: string = "general_illness"
  ): Promise<RecoveryNutritionPlan> {

    // Get current diet goals
    const currentDietGoal = await db
      .select()
      .from(dietGoals)
      .where(eq(dietGoals.userId, userId))
      .orderBy(desc(dietGoals.createdAt))
      .limit(1);

    if (currentDietGoal.length === 0) {
      throw new Error("No diet goals found for user");
    }

    const baseGoals = currentDietGoal[0];
    
    // RP Illness Nutrition Protocol: Prioritize recovery over physique goals
    const protocol = this.getIllnessNutritionProtocol(illnessSeverity, illnessType);
    
    // Calculate adjusted macros
    const adjustedCalories = Math.round(parseFloat(baseGoals.targetCalories.toString()) * protocol.macroAdjustments.calories);
    const adjustedProtein = Math.round(parseFloat(baseGoals.targetProtein.toString()) * protocol.macroAdjustments.protein);
    const adjustedCarbs = Math.round(parseFloat(baseGoals.targetCarbs.toString()) * protocol.macroAdjustments.carbs);
    const adjustedFat = Math.round(parseFloat(baseGoals.targetFat.toString()) * protocol.macroAdjustments.fat);

    // Hydration emphasis during illness (1.5-2x normal intake)
    const hydrationMultiplier = 1.5 + (illnessSeverity * 0.1); // 1.6x to 2.0x based on severity

    // Micronutrient focus for immune support
    const micronutrientFocus = this.getImmuneSupportMicronutrients(illnessType);
    
    // Supplement recommendations
    const supplementRecommendations = this.getRecoverySupplements(illnessSeverity, illnessType);

    // Recovery priorities based on RP principles
    const recoveryPriorities = this.getRecoveryPriorities(illnessSeverity, protocol.phase);

    return {
      adjustedCalories,
      adjustedProtein,
      adjustedCarbs,
      adjustedFat,
      hydrationMultiplier,
      micronutrientFocus,
      supplementRecommendations,
      recoveryPriorities
    };
  }

  /**
   * Get illness-specific nutrition protocol based on RP methodology
   */
  private static getIllnessNutritionProtocol(severity: number, illnessType: string): IllnessNutritionProtocol {
    
    // Determine illness phase based on severity
    let phase: 'acute' | 'recovery' | 'return';
    if (severity >= 4) {
      phase = 'acute';
    } else if (severity >= 2) {
      phase = 'recovery';
    } else {
      phase = 'return';
    }

    const protocols: Record<string, IllnessNutritionProtocol> = {
      acute: {
        phase: 'acute',
        macroAdjustments: {
          calories: 1.05, // Slight increase for immune function
          protein: 1.2,   // 20% increase for tissue repair
          carbs: 1.1,     // 10% increase for energy
          fat: 0.9        // 10% decrease to focus on other macros
        },
        priorities: [
          "Immune system support",
          "Hydration maintenance", 
          "Protein for tissue repair",
          "Easy-to-digest foods"
        ],
        duration: "Until symptoms resolve"
      },
      recovery: {
        phase: 'recovery',
        macroAdjustments: {
          calories: 1.0,  // Maintain normal calories
          protein: 1.15,  // 15% increase for recovery
          carbs: 1.05,    // 5% increase for energy
          fat: 0.95       // 5% decrease
        },
        priorities: [
          "Gradual return to normal eating",
          "Continued protein emphasis",
          "Nutrient-dense foods",
          "Gut health restoration"
        ],
        duration: "1-2 weeks post-symptoms"
      },
      return: {
        phase: 'return',
        macroAdjustments: {
          calories: 1.0,  // Normal calories
          protein: 1.1,   // 10% increase for continued recovery
          carbs: 1.0,     // Normal carbs
          fat: 1.0        // Normal fat
        },
        priorities: [
          "Return to physique goals",
          "Maintain elevated protein",
          "Full nutrient spectrum",
          "Training fuel restoration"
        ],
        duration: "1 week transition period"
      }
    };

    // Adjust based on illness type
    const baseProtocol = protocols[phase];
    
    if (illnessType === 'stress' || illnessType === 'fatigue') {
      // Stress-related illness: emphasize magnesium, B-vitamins
      baseProtocol.macroAdjustments.carbs *= 0.95; // Slightly lower carbs
      baseProtocol.priorities.push("Stress-reducing nutrients");
    } else if (illnessType === 'cold' || illnessType === 'flu') {
      // Viral illness: emphasize vitamin C, zinc
      baseProtocol.macroAdjustments.protein *= 1.05; // Extra protein boost
      baseProtocol.priorities.push("Antiviral nutrient support");
    }

    return baseProtocol;
  }

  /**
   * Get immune-supporting micronutrients based on illness type
   */
  private static getImmuneSupportMicronutrients(illnessType: string): string[] {
    const baseMicronutrients = [
      "Vitamin C (1000-2000mg)",
      "Vitamin D3 (2000-4000 IU)", 
      "Zinc (15-30mg)",
      "Magnesium (400-600mg)",
      "B-Complex vitamins"
    ];

    const typeSpecific: Record<string, string[]> = {
      'cold': ["Echinacea", "Elderberry", "Quercetin"],
      'flu': ["N-Acetyl Cysteine", "Selenium", "Vitamin E"],
      'stress': ["Ashwagandha", "L-Theanine", "Rhodiola"],
      'fatigue': ["Coenzyme Q10", "Iron (if deficient)", "B12"],
      'general_illness': ["Probiotics", "Omega-3 fatty acids"]
    };

    return [...baseMicronutrients, ...(typeSpecific[illnessType] || typeSpecific['general_illness'])];
  }

  /**
   * Get recovery supplement recommendations
   */
  private static getRecoverySupplements(severity: number, illnessType: string): string[] {
    const supplements: string[] = [];

    // Core recovery supplements
    supplements.push("High-quality multivitamin");
    supplements.push("Vitamin C (time-released)");
    supplements.push("Zinc bisglycinate");

    if (severity >= 3) {
      supplements.push("Immune support complex");
      supplements.push("Electrolyte replacement");
    }

    if (illnessType === 'stress' || illnessType === 'fatigue') {
      supplements.push("Adaptogenic herbs (ashwagandha, rhodiola)");
      supplements.push("Magnesium glycinate");
    }

    if (illnessType === 'cold' || illnessType === 'flu') {
      supplements.push("Elderberry extract");
      supplements.push("Probiotics (multi-strain)");
    }

    return supplements;
  }

  /**
   * Get recovery priorities based on severity and phase
   */
  private static getRecoveryPriorities(severity: number, phase: 'acute' | 'recovery' | 'return'): string[] {
    const priorities: string[] = [];

    switch (phase) {
      case 'acute':
        priorities.push("Hydration is TOP priority");
        priorities.push("Protein intake every 3-4 hours");
        priorities.push("Easily digestible foods only");
        if (severity >= 4) {
          priorities.push("Liquid nutrition if solid food is difficult");
        }
        break;

      case 'recovery':
        priorities.push("Gradual increase in food variety");
        priorities.push("Focus on nutrient density over calories");
        priorities.push("Gut health restoration with probiotics");
        priorities.push("Begin planning return to training nutrition");
        break;

      case 'return':
        priorities.push("Resume physique-focused nutrition");
        priorities.push("Maintain elevated protein for 1 week");
        priorities.push("Monitor energy levels with food choices");
        priorities.push("Prepare for training performance demands");
        break;
    }

    return priorities;
  }

  /**
   * Apply recovery nutrition adjustments to user's diet goals
   */
  static async applyRecoveryMacros(
    userId: number,
    adjustments: RecoveryAdjustments
  ): Promise<any> {

    // Get current diet goals
    const currentGoals = await db
      .select()
      .from(dietGoals)
      .where(eq(dietGoals.userId, userId))
      .orderBy(desc(dietGoals.createdAt))
      .limit(1);

    if (currentGoals.length === 0) {
      throw new Error("No current diet goals found");
    }

    const baseGoals = currentGoals[0];

    // Store pre-illness targets if not already stored
    const preIllnessTargets = baseGoals.preIllnessTargets || {
      calories: parseFloat(baseGoals.targetCalories.toString()),
      protein: parseFloat(baseGoals.targetProtein.toString()),
      carbs: parseFloat(baseGoals.targetCarbs.toString()),
      fat: parseFloat(baseGoals.targetFat.toString()),
      goal: baseGoals.goal,
      autoRegulation: baseGoals.autoRegulation
    };

    // Calculate adjusted targets
    const adjustedCalories = Math.round((preIllnessTargets as any).calories * (1 + adjustments.calorieAdjustment / 100));
    const adjustedProtein = Math.round((preIllnessTargets as any).protein * (1 + adjustments.proteinBoost / 100));
    const adjustedCarbs = Math.round((preIllnessTargets as any).carbs * 1.05); // Slight carb increase for energy
    const adjustedFat = Math.round((preIllnessTargets as any).fat * 0.95); // Slight fat decrease

    // Update diet goals with recovery mode
    const updatedGoals = await db
      .update(dietGoals)
      .set({
        targetCalories: adjustedCalories.toString(),
        targetProtein: adjustedProtein.toString(),
        targetCarbs: adjustedCarbs.toString(),
        targetFat: adjustedFat.toString(),
        recoveryMode: true,
        preIllnessTargets: preIllnessTargets,
        illnessModifier: adjustments.illnessModifier.toString(),
        hydrationEmphasis: adjustments.hydrationFocus,
        micronutrientFocus: adjustments.micronutrientEmphasis,
        updatedAt: new Date()
      })
      .where(eq(dietGoals.id, baseGoals.id))
      .returning();

    return updatedGoals[0];
  }

  /**
   * Generate meal recommendations for recovery phase
   */
  static async generateRecoveryMealRecommendations(
    userId: number,
    illnessSeverity: number,
    illnessType: string
  ): Promise<{
    breakfastOptions: string[];
    lunchOptions: string[];
    dinnerOptions: string[];
    snackOptions: string[];
    hydrationPlan: string[];
  }> {

    const phase = illnessSeverity >= 4 ? 'acute' : illnessSeverity >= 2 ? 'recovery' : 'return';

    const recommendations = {
      acute: {
        breakfastOptions: [
          "Protein smoothie with banana and berries",
          "Soft scrambled eggs with toast",
          "Greek yogurt with honey and soft fruits",
          "Oatmeal with protein powder and cinnamon"
        ],
        lunchOptions: [
          "Chicken noodle soup with extra protein",
          "Soft cooked salmon with rice",
          "Turkey and avocado wrap (soft tortilla)",
          "Protein-rich bone broth with vegetables"
        ],
        dinnerOptions: [
          "Slow-cooked chicken with mashed sweet potato",
          "Fish with quinoa and steamed vegetables",
          "Turkey meatballs with pasta",
          "Lean beef stew with soft vegetables"
        ],
        snackOptions: [
          "Protein shake with electrolytes",
          "Cottage cheese with soft fruit",
          "Nut butter on soft bread",
          "Greek yogurt with probiotics"
        ],
        hydrationPlan: [
          "Water: 3-4 liters daily",
          "Electrolyte drinks (low sugar)",
          "Herbal teas (ginger, chamomile)",
          "Bone broth for sodium and amino acids"
        ]
      },
      recovery: {
        breakfastOptions: [
          "Protein pancakes with berries",
          "Veggie omelet with cheese",
          "Overnight oats with protein powder",
          "Smoothie bowl with nuts and seeds"
        ],
        lunchOptions: [
          "Grilled chicken salad with quinoa",
          "Salmon bowl with brown rice",
          "Turkey and hummus wrap",
          "Lentil soup with lean protein"
        ],
        dinnerOptions: [
          "Lean steak with roasted vegetables",
          "Baked cod with sweet potato",
          "Chicken stir-fry with brown rice",
          "Turkey chili with beans"
        ],
        snackOptions: [
          "Trail mix with dried fruit",
          "Apple with almond butter",
          "Protein bars (low sugar)",
          "Hummus with vegetables"
        ],
        hydrationPlan: [
          "Water: 2.5-3 liters daily",
          "Green tea with antioxidants",
          "Coconut water for electrolytes",
          "Herbal teas for continued healing"
        ]
      },
      return: {
        breakfastOptions: [
          "Full balanced breakfast with all macros",
          "Pre-workout meal if training resumes",
          "Higher protein options for muscle recovery",
          "Include pre-illness favorites gradually"
        ],
        lunchOptions: [
          "Return to normal portion sizes",
          "Include training-supporting nutrients",
          "Balance for afternoon energy",
          "Add back complex meals"
        ],
        dinnerOptions: [
          "Full portion proteins with sides",
          "Post-workout meals if training",
          "Include all food groups",
          "Return to pre-illness meal structure"
        ],
        snackOptions: [
          "Resume normal snacking patterns",
          "Include performance-supporting snacks",
          "Add back treat foods in moderation",
          "Focus on training fuel timing"
        ],
        hydrationPlan: [
          "Water: 2-2.5 liters daily (normal)",
          "Add sports drinks if training resumes",
          "Coffee can be reintroduced",
          "Monitor hydration during workouts"
        ]
      }
    };

    return recommendations[phase];
  }

  /**
   * Transition back to normal nutrition after full recovery
   */
  static async transitionToNormalNutrition(userId: number): Promise<{
    success: boolean;
    restoredGoals: any;
    transitionPlan: string[];
  }> {

    // Get current diet goals in recovery mode
    const currentGoals = await db
      .select()
      .from(dietGoals)
      .where(and(
        eq(dietGoals.userId, userId),
        eq(dietGoals.recoveryMode, true)
      ))
      .orderBy(desc(dietGoals.createdAt))
      .limit(1);

    if (currentGoals.length === 0) {
      throw new Error("No recovery mode diet goals found");
    }

    const recoveryGoals = currentGoals[0];
    const preIllnessTargets = recoveryGoals.preIllnessTargets as any;

    if (!preIllnessTargets) {
      throw new Error("No pre-illness targets found to restore");
    }

    // Restore pre-illness targets with gradual transition
    const restoredGoals = await db
      .update(dietGoals)
      .set({
        targetCalories: preIllnessTargets.calories.toString(),
        targetProtein: preIllnessTargets.protein.toString(),
        targetCarbs: preIllnessTargets.carbs.toString(),
        targetFat: preIllnessTargets.fat.toString(),
        goal: preIllnessTargets.goal,
        autoRegulation: preIllnessTargets.autoRegulation,
        recoveryMode: false,
        preIllnessTargets: null,
        illnessModifier: "1.00",
        hydrationEmphasis: false,
        micronutrientFocus: false,
        updatedAt: new Date()
      })
      .where(eq(dietGoals.id, recoveryGoals.id))
      .returning();

    const transitionPlan = [
      "Week 1: Maintain elevated protein (10% above normal)",
      "Week 2: Return to normal macronutrient ratios",
      "Week 3: Resume full physique-focused nutrition",
      "Monitor energy levels throughout transition",
      "Return to normal meal timing and portions",
      "Reintroduce any restricted foods gradually",
      "Watch for any digestive sensitivity"
    ];

    return {
      success: true,
      restoredGoals: restoredGoals[0],
      transitionPlan
    };
  }

  /**
   * Monitor nutrition adherence during recovery
   */
  static async monitorRecoveryNutrition(userId: number): Promise<{
    adherenceScore: number;
    proteinAdequacy: boolean;
    hydrationStatus: 'good' | 'moderate' | 'poor';
    recommendations: string[];
    shouldAdjustPlan: boolean;
  }> {

    // This would integrate with existing nutrition logging to assess adherence
    // For now, we'll return a template structure that can be implemented
    // when nutrition logging data is available

    return {
      adherenceScore: 85, // Would be calculated from actual logged food
      proteinAdequacy: true, // Would check if protein targets are being met
      hydrationStatus: 'good', // Would assess from logged fluid intake
      recommendations: [
        "Continue current nutrition plan",
        "Focus on consistent meal timing",
        "Monitor energy levels with food choices",
        "Gradually increase food variety as tolerance allows"
      ],
      shouldAdjustPlan: false // Would trigger plan adjustments if needed
    };
  }
}