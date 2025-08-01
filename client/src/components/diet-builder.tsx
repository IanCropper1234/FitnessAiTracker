import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Search, Plus, ShoppingCart, Database, Brain, Loader2, Target, Calculator, BookOpen, Save, Edit, Trash2, Settings, Clock, Calendar, Activity, User, AlertTriangle } from "lucide-react";
import type { MealTimingPreference } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";


interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  barcode?: string;
  source: 'openfoodfacts' | 'custom';
  quantity?: number;
}

interface SavedMealPlan {
  id: number;
  name: string;
  description?: string;
  mealType: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

interface DietGoal {
  id?: number;
  userId: number;
  tdee: number;
  goal: 'cut' | 'bulk' | 'maintain';
  targetCalories: number;
  customTargetCalories?: number;
  useCustomCalories: boolean;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  autoRegulation: boolean;
  weeklyWeightTarget?: number;
}

interface UserProfileResponse {
  user: {
    id: number;
    email: string;
    age?: number;
    weight?: number;
    height?: number;
    weightUnit?: string;
    heightUnit?: string;
    activityLevel?: string;
    fitnessGoal?: string;
  };
  profile?: {
    age?: number;
    weight?: number;
    height?: number;
    weightUnit?: string;
    heightUnit?: string;
    activityLevel?: string;
    fitnessGoal?: string;
  };
}

interface DietBuilderProps {
  userId: number;
}

export function DietBuilder({ userId }: DietBuilderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Local unit conversion helper
  const convertValue = (value: number, type: 'weight' | 'measurement', fromUnit: 'metric' | 'imperial', toUnit: 'metric' | 'imperial'): number => {
    if (fromUnit === toUnit || !value) return value;
    
    if (type === 'weight') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 2.20462 * 10) / 10; // kg to lbs
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 0.453592 * 10) / 10; // lbs to kg
      }
    } else if (type === 'measurement') {
      if (fromUnit === 'metric' && toUnit === 'imperial') {
        return Math.round(value * 0.393701 * 10) / 10; // cm to inches
      } else if (fromUnit === 'imperial' && toUnit === 'metric') {
        return Math.round(value * 2.54 * 10) / 10; // inches to cm
      }
    }
    return value;
  };
  
  // UI State
  const [activeTab, setActiveTab] = useState<'diet-goal' | 'meal-timing' | 'meal-builder' | 'saved-plans'>('diet-goal');
  
  // New state for goal selection mode
  const [goalSelectionMode, setGoalSelectionMode] = useState<'selection' | 'recommended' | 'custom'>('selection');
  const [goalSubTab, setGoalSubTab] = useState<'recommended' | 'custom'>('recommended');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [searchMode, setSearchMode] = useState<'database' | 'ai'>('database');
  const [selectedMealType, setSelectedMealType] = useState<string>("breakfast");
  
  // Diet Goal State - Initialize with auto-regulation off until data is available
  const [dietGoal, setDietGoal] = useState<DietGoal>({
    userId,
    tdee: 2000,
    goal: 'maintain',
    targetCalories: 2000,
    customTargetCalories: 2000,
    useCustomCalories: false,
    targetProtein: 150,
    targetCarbs: 200,
    targetFat: 65,
    autoRegulation: false,
    weeklyWeightTarget: 0
  });
  
  // Helper function to get optimal macro distribution based on calories
  const getOptimalMacroDistribution = (calories: number) => {
    if (calories <= 1200) {
      // Very low calorie - higher protein to preserve muscle
      return { protein: 35, carbs: 35, fat: 30 };
    } else if (calories <= 1600) {
      // Low calorie - moderate protein, moderate carbs
      return { protein: 30, carbs: 40, fat: 30 };
    } else if (calories <= 2000) {
      // Moderate calorie - balanced approach
      return { protein: 25, carbs: 45, fat: 30 };
    } else if (calories <= 2500) {
      // Higher calorie - can support more carbs
      return { protein: 20, carbs: 50, fat: 30 };
    } else {
      // Very high calorie - optimized for performance
      return { protein: 18, carbs: 55, fat: 27 };
    }
  };

  // MyFitnessPal-style percentage state - Initialize with smart defaults
  const [proteinPercentage, setProteinPercentage] = useState(25);
  const [carbsPercentage, setCarbsPercentage] = useState(45);
  const [fatPercentage, setFatPercentage] = useState(30);
  const [userSetPercentages, setUserSetPercentages] = useState(false); // Track if user manually set percentages
  const [showMacroDistribution, setShowMacroDistribution] = useState(false); // Track if macro section should be expanded

  // Function to update macros from percentages
  const updateMacrosFromPercentages = (protein: number, carbs: number, fat: number) => {
    const totalCalories = dietGoal.targetCalories || 2000;
    
    setDietGoal(prev => ({
      ...prev,
      targetProtein: Math.round((totalCalories * (protein / 100)) / 4),
      targetCarbs: Math.round((totalCalories * (carbs / 100)) / 4),
      targetFat: Math.round((totalCalories * (fat / 100)) / 9)
    }));
  };

  // Initialize percentages when diet goal loads or changes (only if user hasn't manually set them)
  useEffect(() => {
    // Don't override user's manual percentage changes
    if (userSetPercentages) return;
    
    const currentCalories = dietGoal.targetCalories;
      
    if (currentCalories > 0) {
      // If we have existing goal data with macros, calculate percentages from saved values
      if (dietGoal.targetProtein > 0) {
        const proteinCals = (dietGoal.targetProtein * 4);
        const carbsCals = (dietGoal.targetCarbs * 4);
        const fatCals = (dietGoal.targetFat * 9);

        setProteinPercentage(Math.round((proteinCals / currentCalories) * 100));
        setCarbsPercentage(Math.round((carbsCals / currentCalories) * 100));
        setFatPercentage(Math.round((fatCals / currentCalories) * 100));
      } else {
        // Use optimal distribution for new goals or when no macro data exists
        const optimalDistribution = getOptimalMacroDistribution(currentCalories);
        setProteinPercentage(optimalDistribution.protein);
        setCarbsPercentage(optimalDistribution.carbs);
        setFatPercentage(optimalDistribution.fat);
        
        // Update the macro gram values based on optimal percentages
        updateMacrosFromPercentages(optimalDistribution.protein, optimalDistribution.carbs, optimalDistribution.fat);
      }
    }
  }, [dietGoal.targetCalories, dietGoal.targetProtein, dietGoal.targetCarbs, dietGoal.targetFat, userSetPercentages]);

  // Helper function to get total percentage
  const getTotalPercentage = () => {
    return proteinPercentage + carbsPercentage + fatPercentage;
  };

  // Helper function to auto-adjust macros to 100%
  const autoAdjustMacros = () => {
    const total = getTotalPercentage();
    if (total === 100) return;

    // Scale proportionally to reach 100%
    const scaleFactor = 100 / total;
    const newProtein = Math.round(proteinPercentage * scaleFactor);
    const newCarbs = Math.round(carbsPercentage * scaleFactor);
    const newFat = 100 - newProtein - newCarbs; // Ensure exact 100%

    setUserSetPercentages(true); // Mark that user set percentages
    setProteinPercentage(newProtein);
    setCarbsPercentage(newCarbs);
    setFatPercentage(newFat);
    updateMacrosFromPercentages(newProtein, newCarbs, newFat);
  };

  // Meal Plan State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [mealPlanName, setMealPlanName] = useState("");
  const [mealPlanDescription, setMealPlanDescription] = useState("");

  // Search Open Food Facts database
  const { data: searchResults, isLoading: isSearchLoading } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/food/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length > 2 && searchMode === 'database'
  });

  // Get custom food database
  const { data: customFoods } = useQuery<FoodItem[]>({
    queryKey: ['/api/food/items'],
    queryFn: async () => {
      const response = await fetch('/api/food/items');
      return response.json();
    }
  });

  // AI analysis mutation
  const aiAnalyzeMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/nutrition/analyze", {
        foodDescription: description,
        quantity: 1,
        unit: "serving"
      });
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze food",
        variant: "destructive"
      });
    }
  });

  // Save meal mutation
  const saveMealMutation = useMutation({
    mutationFn: async (mealData: { foods: FoodItem[], mealType: string }) => {
      const promises = mealData.foods.map(food => 
        apiRequest("POST", "/api/nutrition/log", {
          userId,
          foodName: food.name,
          quantity: 1,
          unit: "serving",
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          mealType: mealData.mealType,
          date: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Meal saved to ${selectedMealType} successfully!`
      });
      setSelectedFoods([]);
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal",
        variant: "destructive"
      });
    }
  });

  // Fetch user profile for TDEE calculation
  const { data: userProfileResponse, isLoading: isUserProfileLoading } = useQuery<UserProfileResponse>({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile`);
      return response.json();
    }
  });

  // Extract profile data for easier access
  const userProfile = userProfileResponse?.profile || userProfileResponse?.user;

  // Fetch body metrics for recent weight
  const { data: bodyMetrics, isLoading: isBodyMetricsLoading } = useQuery({
    queryKey: ['/api/body-metrics', userId],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics`);
      return response.json();
    }
  });

  // Fetch current diet goal
  const { data: currentDietGoal, isLoading: isDietGoalLoading } = useQuery<DietGoal>({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals`);
      return response.json();
    }
  });

  // Overall loading state to prevent premature warning display
  const isDataLoading = isUserProfileLoading || isBodyMetricsLoading || isDietGoalLoading;

  // Update local state when diet goal data is fetched
  useEffect(() => {
    if (currentDietGoal) {
      // Convert string values to numbers for frontend state
      const normalizedGoal = {
        ...currentDietGoal,
        tdee: Number(currentDietGoal.tdee),
        targetCalories: Number(currentDietGoal.targetCalories),
        customTargetCalories: Number(currentDietGoal.customTargetCalories),
        targetProtein: Number(currentDietGoal.targetProtein),
        targetCarbs: Number(currentDietGoal.targetCarbs),
        targetFat: Number(currentDietGoal.targetFat),
        weeklyWeightTarget: Number(currentDietGoal.weeklyWeightTarget)
      };
      setDietGoal(normalizedGoal);
    }
  }, [currentDietGoal]);

  // Auto-sync with profile fitness goal changes and enable auto-regulation
  useEffect(() => {
    if (userProfile && currentDietGoal) {
      const hasCompleteData = userProfile.age && userProfile.height && userProfile.activityLevel && 
                               (bodyMetrics?.length > 0 || userProfile.weight);
      
      // Check if fitness goal mapping needs update
      const fitnessGoal = userProfile.fitnessGoal;
      if (fitnessGoal) {
        let expectedDietGoal = 'maintain';
        
        switch (fitnessGoal) {
          case 'Weight Loss':
          case 'weight_loss':
            expectedDietGoal = 'cut';
            break;
          case 'Muscle Gain':
          case 'muscle_gain':
            expectedDietGoal = 'bulk';
            break;
          case 'Maintain Weight':
          case 'maintain_weight':
          default:
            expectedDietGoal = 'maintain';
            break;
        }
        
        // If current diet goal doesn't match expected, immediately sync the display to show the correct goal
        if (currentDietGoal && currentDietGoal.goal !== expectedDietGoal) {
          // Update the local state to show the expected goal that matches user's fitness goal
          setDietGoal(prev => ({ 
            ...prev, 
            goal: expectedDietGoal as any,
            weeklyWeightTarget: expectedDietGoal === 'cut' ? -0.5 : expectedDietGoal === 'bulk' ? 0.3 : 0
          }));
        }
      }
      
      // Enable auto-regulation for complete profiles
      if (hasCompleteData && !dietGoal.autoRegulation) {
        setDietGoal(prev => ({ ...prev, autoRegulation: true }));
      }
    }
  }, [userProfile, bodyMetrics, currentDietGoal, dietGoal.autoRegulation, userId, queryClient, toast]);

  // Fetch saved meal plans
  const { data: savedMealPlans } = useQuery<SavedMealPlan[]>({
    queryKey: ['/api/meal-plans/saved', userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-plans/saved`);
      return response.json();
    }
  });

  // Fetch meal timing preferences for meal scheduling
  const { data: mealTimingPreferences } = useQuery<MealTimingPreference | null>({
    queryKey: ['/api/meal-timing', userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Diet goal mutations
  const saveDietGoalMutation = useMutation({
    mutationFn: async (goal: DietGoal): Promise<DietGoal> => {
      // Always use PUT to update/create the goal for this user
      const response = await apiRequest("PUT", `/api/diet-goals`, goal);
      return response.json();
    },
    onSuccess: (savedGoal: DietGoal) => {
      toast({
        title: "Success",
        description: "Diet goal saved successfully!"
      });
      
      // Convert string values to numbers for frontend state
      const normalizedGoal = {
        ...savedGoal,
        tdee: Number(savedGoal.tdee),
        targetCalories: Number(savedGoal.targetCalories),
        customTargetCalories: Number(savedGoal.customTargetCalories),
        targetProtein: Number(savedGoal.targetProtein),
        targetCarbs: Number(savedGoal.targetCarbs),
        targetFat: Number(savedGoal.targetFat),
        weeklyWeightTarget: Number(savedGoal.weeklyWeightTarget)
      };
      
      // Update local state with normalized data
      setDietGoal(normalizedGoal);
      
      // Invalidate all related caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight-goals'] });
      
      // Force refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: ['/api/diet-goals', userId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save diet goal",
        variant: "destructive"
      });
    }
  });

  // Saved meal plan mutations
  const saveMealPlanMutation = useMutation({
    mutationFn: async (mealPlanData: any) => {
      if (isEditingPlan && editingPlanId) {
        return await apiRequest("PUT", `/api/meal-plans/saved/${editingPlanId}`, mealPlanData);
      } else {
        return await apiRequest("POST", "/api/meal-plans/saved", mealPlanData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditingPlan ? "Meal plan updated!" : "Meal plan saved!"
      });
      setMealPlanName("");
      setMealPlanDescription("");
      setSelectedFoods([]);
      setIsEditingPlan(false);
      setEditingPlanId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans/saved'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save meal plan",
        variant: "destructive"
      });
    }
  });

  const deleteMealPlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/meal-plans/saved/${planId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan deleted!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meal-plans/saved'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete meal plan",
        variant: "destructive"
      });
    }
  });

  // Meal Timing & Distribution Functions
  const generateMealSchedule = () => {
    if (!mealTimingPreferences) return [];
    
    const { wakeTime, sleepTime, workoutTime, mealsPerDay, preWorkoutMeals, postWorkoutMeals } = mealTimingPreferences;
    
    // Parse times
    const wake = new Date(`2025-01-01T${wakeTime}:00`);
    const sleep = new Date(`2025-01-01T${sleepTime}:00`);
    const workout = workoutTime ? new Date(`2025-01-01T${workoutTime}:00`) : null;
    
    // Calculate awake hours
    let awakeHours = (sleep.getTime() - wake.getTime()) / (1000 * 60 * 60);
    if (awakeHours < 0) awakeHours += 24; // Handle overnight sleep
    
    const mealSchedule = [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkoutDay = mealTimingPreferences.workoutDays?.includes(today) || false;
    
    if (isWorkoutDay && workout) {
      // Calculate pre and post workout meal timing
      const preWorkoutWindow = 2; // 2 hours before workout
      const postWorkoutWindow = 1; // 1 hour after workout
      
      // Pre-workout meals
      for (let i = 0; i < (preWorkoutMeals || 1); i++) {
        const mealTime = new Date(workout.getTime() - (preWorkoutWindow - (i * 0.5)) * 60 * 60 * 1000);
        mealSchedule.push({
          mealNumber: i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'pre-workout',
          description: `Pre-workout meal ${i + 1}`
        });
      }
      
      // Post-workout meals
      for (let i = 0; i < (postWorkoutMeals || 1); i++) {
        const mealTime = new Date(workout.getTime() + (postWorkoutWindow + (i * 0.5)) * 60 * 60 * 1000);
        mealSchedule.push({
          mealNumber: (preWorkoutMeals || 1) + i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'post-workout',
          description: `Post-workout meal ${i + 1}`
        });
      }
      
      // Fill remaining meals
      const remainingMeals = (mealsPerDay || 4) - (preWorkoutMeals || 1) - (postWorkoutMeals || 1);
      const intervalHours = awakeHours / (remainingMeals + 1);
      
      for (let i = 0; i < remainingMeals; i++) {
        const mealTime = new Date(wake.getTime() + ((i + 1) * intervalHours * 60 * 60 * 1000));
        mealSchedule.push({
          mealNumber: (preWorkoutMeals || 1) + (postWorkoutMeals || 1) + i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'regular',
          description: `Meal ${(preWorkoutMeals || 1) + (postWorkoutMeals || 1) + i + 1}`
        });
      }
    } else {
      // Regular day - evenly distribute meals
      const intervalHours = awakeHours / ((mealsPerDay || 4) + 1);
      
      for (let i = 0; i < (mealsPerDay || 4); i++) {
        const mealTime = new Date(wake.getTime() + ((i + 1) * intervalHours * 60 * 60 * 1000));
        mealSchedule.push({
          mealNumber: i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'regular',
          description: `Meal ${i + 1}`
        });
      }
    }
    
    return mealSchedule.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  };

  const distributeMacrosAcrossMeals = () => {
    if (!mealTimingPreferences) return [];
    
    const mealSchedule = generateMealSchedule();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkoutDay = mealTimingPreferences.workoutDays?.includes(today) || false;
    
    // Use saved diet goals from database, fallback to current state
    const activeDietGoal = (currentDietGoal as DietGoal) || dietGoal;
    const totalCalories = activeDietGoal.targetCalories;
    const totalProtein = activeDietGoal.targetProtein;
    const totalCarbs = activeDietGoal.targetCarbs;
    const totalFat = activeDietGoal.targetFat;
    
    return mealSchedule.map(meal => {
      let caloriePercent, proteinPercent, carbPercent, fatPercent;
      
      if (isWorkoutDay && mealTimingPreferences.workoutTime) {
        if (meal.type === 'pre-workout') {
          // Higher carbs, moderate protein, lower fat
          caloriePercent = 0.25;
          proteinPercent = 0.2;
          carbPercent = 0.35;
          fatPercent = 0.15;
        } else if (meal.type === 'post-workout') {
          // High protein, moderate carbs, lower fat
          caloriePercent = 0.3;
          proteinPercent = 0.35;
          carbPercent = 0.3;
          fatPercent = 0.15;
        } else {
          // Regular distribution for remaining meals
          const remainingMeals = (mealTimingPreferences.mealsPerDay || 4) - (mealTimingPreferences.preWorkoutMeals || 1) - (mealTimingPreferences.postWorkoutMeals || 1);
          const remainingCalories = 0.45; // 45% for non-workout meals
          caloriePercent = remainingCalories / remainingMeals;
          proteinPercent = 0.45 / remainingMeals;
          carbPercent = 0.35 / remainingMeals;
          fatPercent = 0.7 / remainingMeals;
        }
      } else {
        // Even distribution across all meals
        const mealsPerDay = mealTimingPreferences?.mealsPerDay || 4;
        caloriePercent = 1 / mealsPerDay;
        proteinPercent = 1 / mealsPerDay;
        carbPercent = 1 / mealsPerDay;
        fatPercent = 1 / mealsPerDay;
      }
      
      return {
        ...meal,
        targetCalories: Math.round(totalCalories * caloriePercent),
        targetProtein: Math.round(totalProtein * proteinPercent * 10) / 10,
        targetCarbs: Math.round(totalCarbs * carbPercent * 10) / 10,
        targetFat: Math.round(totalFat * fatPercent * 10) / 10
      };
    });
  };

  // TDEE Calculation Function for useEffect
  // Note: Harris-Benedict Formula expects weight in kg and height in cm
  const calculateTDEEWithParams = (age: number, weight: number, height: number, activityLevel: string, gender: 'male' | 'female' = 'male') => {
    // Harris-Benedict Formula (weight in kg, height in cm)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multipliers
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9
    };

    return Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55));
  };

  // Auto-calculate TDEE when user profile changes
  useEffect(() => {
    if (userProfile && dietGoal.autoRegulation) {
      const latestWeight = bodyMetrics && bodyMetrics.length > 0 ? bodyMetrics[0]?.weight : userProfile.weight;
      
      if (userProfile.age && latestWeight && userProfile.height && userProfile.activityLevel) {
        // Get the weight unit and height unit
        const weightUnit = bodyMetrics && bodyMetrics.length > 0 ? bodyMetrics[0]?.unit : (userProfile?.weightUnit || 'metric');
        const heightUnit = userProfile?.heightUnit || 'metric';
        
        // Convert weight and height to metric (kg and cm) for TDEE calculation
        const weightInKg = weightUnit === 'metric' 
          ? Number(latestWeight) 
          : convertValue(Number(latestWeight), 'weight', 'imperial', 'metric');
        
        const heightInCm = heightUnit === 'metric' 
          ? Number(userProfile.height) 
          : convertValue(Number(userProfile.height), 'measurement', 'imperial', 'metric');
        
        const calculatedTDEE = calculateTDEEWithParams(
          userProfile.age,
          weightInKg,
          heightInCm,
          userProfile.activityLevel,
          'male' // default gender for now
        );
        
        const targetCalories = calculateTargetCaloriesWithParams(calculatedTDEE, dietGoal.goal, dietGoal.weeklyWeightTarget);
        
        setDietGoal(prev => ({
          ...prev,
          tdee: calculatedTDEE,
          targetCalories: targetCalories
        }));
      }
    }
  }, [userProfile, bodyMetrics, dietGoal.autoRegulation, dietGoal.goal, dietGoal.weeklyWeightTarget]);

  // Calculate target calories based on goal
  const calculateTargetCaloriesWithParams = (tdee: number, goal: string, weeklyTarget?: number) => {
    const dailyDeficitSurplus = (weeklyTarget || 0) * 7700 / 7; // 7700 calories per kg
    
    switch (goal) {
      case 'cut':
        return Math.round(tdee - Math.abs(dailyDeficitSurplus || 500)); // Default 500 cal deficit
      case 'bulk':
        return Math.round(tdee + Math.abs(dailyDeficitSurplus || 300)); // Default 300 cal surplus
      case 'maintain':
      default:
        return Math.round(tdee);
    }
  };

  // Calculate macros based on calories and goal with percentage adjustments
  const calculateMacros = (calories: number, goal: string, adjustments = { protein: 0, carbs: 0, fat: 0 }) => {
    let proteinRatio, fatRatio, carbRatio;
    
    switch (goal) {
      case 'cut':
        proteinRatio = 0.3; // 30% protein
        fatRatio = 0.25;    // 25% fat
        carbRatio = 0.45;   // 45% carbs
        break;
      case 'bulk':
        proteinRatio = 0.25; // 25% protein
        fatRatio = 0.25;     // 25% fat
        carbRatio = 0.5;     // 50% carbs
        break;
      case 'maintain':
      default:
        proteinRatio = 0.25; // 25% protein
        fatRatio = 0.3;      // 30% fat
        carbRatio = 0.45;    // 45% carbs
        break;
    }

    // Apply percentage adjustments
    const adjustedProteinRatio = proteinRatio * (1 + adjustments.protein / 100);
    const adjustedCarbRatio = carbRatio * (1 + adjustments.carbs / 100);
    const adjustedFatRatio = fatRatio * (1 + adjustments.fat / 100);

    return {
      protein: Math.round((calories * adjustedProteinRatio) / 4), // 4 cal per gram
      carbs: Math.round((calories * adjustedCarbRatio) / 4),      // 4 cal per gram  
      fat: Math.round((calories * adjustedFatRatio) / 9)          // 9 cal per gram
    };
  };

  // Update macros and calories when goal changes (only for auto-regulation)
  useEffect(() => {
    if (!dietGoal.tdee || !dietGoal.autoRegulation) return; // Wait for TDEE and only if auto-regulation is on
    
    // Start with original TDEE-based calories for the baseline
    const originalCalories = Math.round(dietGoal.tdee * (dietGoal.goal === 'cut' ? 0.85 : dietGoal.goal === 'bulk' ? 1.15 : 1));
    const macros = calculateMacros(originalCalories, dietGoal.goal, { protein: 0, carbs: 0, fat: 0 });
    
    // Update local state with baseline macros
    setDietGoal(prev => ({
      ...prev,
      targetCalories: originalCalories,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat
    }));
  }, [dietGoal.goal, dietGoal.tdee, dietGoal.autoRegulation]);





  // Helper function to get current target calories (custom or suggested)
  const getCurrentTargetCalories = () => {
    return dietGoal.targetCalories;
  };

  // Calculate current calorie total from macros
  const calculateCurrentCalories = () => {
    return Math.round((dietGoal.targetProtein * 4) + (dietGoal.targetCarbs * 4) + (dietGoal.targetFat * 9));
  };

  // BMR Calculation function
  const calculateBMR = () => {
    const latestWeight = bodyMetrics && bodyMetrics.length > 0 ? bodyMetrics[0]?.weight : userProfile?.weight;
    if (!userProfile?.age || !userProfile?.height || !latestWeight) return 2000; // fallback
    
    const age = userProfile.age;
    const height = userProfile.height;
    const weight = latestWeight;
    const gender = 'male'; // default gender
    
    // Harris-Benedict Formula
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  };

  // Updated TDEE calculation
  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const activityLevel = userProfile?.activityLevel || 'moderately_active';
    
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9
    };

    return bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55);
  };

  // Updated target calories calculation
  const calculateTargetCalories = (goal?: string) => {
    const tdee = calculateTDEE();
    const currentGoal = goal || dietGoal.goal || 'maintain';
    
    switch (currentGoal) {
      case 'cut':
        return tdee * 0.85; // 15% deficit
      case 'bulk':
        return tdee * 1.15; // 15% surplus
      case 'maintain':
      default:
        return tdee;
    }
  };

  // Recommended macro calculations
  const calculateRecommendedProtein = () => {
    const targetCalories = calculateTargetCalories();
    const proteinPercentage = dietGoal.goal === 'cut' ? 0.35 : dietGoal.goal === 'bulk' ? 0.25 : 0.30;
    return (targetCalories * proteinPercentage) / 4;
  };

  const calculateRecommendedCarbs = () => {
    const targetCalories = calculateTargetCalories();
    const carbsPercentage = dietGoal.goal === 'cut' ? 0.35 : dietGoal.goal === 'bulk' ? 0.50 : 0.40;
    return (targetCalories * carbsPercentage) / 4;
  };

  const calculateRecommendedFat = () => {
    const targetCalories = calculateTargetCalories();
    const fatPercentage = dietGoal.goal === 'cut' ? 0.30 : dietGoal.goal === 'bulk' ? 0.25 : 0.30;
    return (targetCalories * fatPercentage) / 9;
  };



  // Reset macro targets to baseline
  const resetMacroTargets = () => {
    const targetCalories = getCurrentTargetCalories();
    const baseMacros = calculateMacros(targetCalories, dietGoal.goal, { protein: 0, carbs: 0, fat: 0 });
    
    setDietGoal(prev => ({
      ...prev,
      targetProtein: baseMacros.protein,
      targetCarbs: baseMacros.carbs,
      targetFat: baseMacros.fat
    }));
  };



  // Food search and meal plan functions
  const addToMealPlan = (food: FoodItem) => {
    setSelectedFoods([...selectedFoods, { ...food, quantity: 1 }]);
  };

  const addAIAnalysisToMealPlan = () => {
    if (aiAnalyzeMutation.data) {
      const aiFood: FoodItem = {
        id: `ai-${Date.now()}`,
        name: searchQuery,
        calories: aiAnalyzeMutation.data.calories,
        protein: aiAnalyzeMutation.data.protein,
        carbs: aiAnalyzeMutation.data.carbs,
        fat: aiAnalyzeMutation.data.fat,
        source: 'custom',
        quantity: 1
      };
      setSelectedFoods([...selectedFoods, aiFood]);
      setSearchQuery("");
      aiAnalyzeMutation.reset();
    }
  };

  const removeFromMealPlan = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleAIAnalysis = () => {
    if (!searchQuery.trim()) return;
    aiAnalyzeMutation.mutate(searchQuery);
  };

  const handleSaveMeal = () => {
    if (selectedFoods.length === 0) return;
    saveMealMutation.mutate({ foods: selectedFoods, mealType: selectedMealType });
  };

  const handleSaveMealPlan = () => {
    if (selectedFoods.length === 0 || !mealPlanName.trim()) return;
    
    const totals = selectedFoods.reduce((acc, food) => ({
      calories: acc.calories + (food.calories * (food.quantity || 1)),
      protein: acc.protein + (food.protein * (food.quantity || 1)),
      carbs: acc.carbs + (food.carbs * (food.quantity || 1)),
      fat: acc.fat + (food.fat * (food.quantity || 1))
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const mealPlanData = {
      userId,
      name: mealPlanName,
      description: mealPlanDescription,
      mealType: selectedMealType,
      foods: selectedFoods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat
    };

    saveMealPlanMutation.mutate(mealPlanData);
  };

  const handleSaveDietGoal = () => {
    // Create a properly typed object that matches the backend expectations
    const goalToSave = {
      ...dietGoal,
      // Ensure weeklyWeightTarget is 0 for maintain goals
      weeklyWeightTarget: dietGoal.goal === 'maintain' ? 0 : (dietGoal.weeklyWeightTarget || 0)
    };
    
    console.log('Saving diet goal:', goalToSave); // Debug log to see what's being sent
    saveDietGoalMutation.mutate(goalToSave);
  };

  const loadMealPlan = (plan: SavedMealPlan) => {
    setSelectedFoods(plan.foods);
    setSelectedMealType(plan.mealType);
    setMealPlanName(plan.name);
    setMealPlanDescription(plan.description || "");
    setIsEditingPlan(true);
    setEditingPlanId(plan.id);
    setActiveTab('meal-builder');
  };

  const deleteMealPlan = (planId: number) => {
    deleteMealPlanMutation.mutate(planId);
  };

  // Log meal plan mutation
  const logMealPlanMutation = useMutation({
    mutationFn: async (data: { planId: number; targetDate?: string; mealType?: string }) => {
      return await apiRequest("POST", "/api/nutrition/log-meal-plan", {
        userId,
        ...data
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      toast({
        title: "Meal Logged Successfully",
        description: `Added ${data.loggedCount} food entries to your nutrition log`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to log meal plan",
        variant: "destructive"
      });
    }
  });

  const handleLogMealPlan = (plan: SavedMealPlan) => {
    const today = new Date().toISOString().split('T')[0];
    logMealPlanMutation.mutate({
      planId: plan.id,
      targetDate: today,
      mealType: plan.mealType
    });
  };

  const calculateTotalMacros = () => {
    return selectedFoods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totals = calculateTotalMacros();
  const isLoading = isSearchLoading || aiAnalyzeMutation.isPending;

  return (
    <div className="space-y-6">
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
        

        {/* Diet Goal Tab */}
        <TabsContent value="diet-goal" className="space-y-6">
          {goalSelectionMode === 'selection' ? (
            // Goal Selection Screen
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Calorie & Macro Goal Setup
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[12px]">
                  Choose how you want to set your daily nutrition goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommended Goals Card */}
                  <div 
                    className="relative p-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors"
                    onClick={() => {
                      setGoalSelectionMode('recommended');
                      setGoalSubTab('recommended');
                    }}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 mx-auto flex items-center justify-center">
                        <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Recommended</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 text-left">
                          <li>• TDEE-based calculations</li>
                          <li>• Auto-regulation system</li>
                          <li>• RP methodology</li>
                          <li>• Smart adjustments</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setGoalSelectionMode('recommended');
                          setGoalSubTab('recommended');
                        }}
                      >
                        SELECT
                      </Button>
                    </div>
                  </div>

                  {/* Custom Goals Card */}
                  <div 
                    className="relative p-6 border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 cursor-pointer transition-colors"
                    onClick={() => {
                      setGoalSelectionMode('custom');
                      setGoalSubTab('custom');
                    }}
                  >
                    <div className="text-center space-y-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-800 mx-auto flex items-center justify-center">
                        <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Custom</h4>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                          <li>• Manual calorie entry</li>
                          <li>• Full control over macros</li>
                          <li>• Your own numbers</li>
                          <li>• Flexible approach</li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setGoalSelectionMode('custom');
                          setGoalSubTab('custom');
                        }}
                      >
                        SELECT
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profile Warning for TDEE */}
                {!isDataLoading && (!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)) && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">Profile Required for TDEE</h4>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      Complete your profile to use the recommended TDEE-based approach:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 mb-3">
                      {!userProfile?.age && <li>• Add your age</li>}
                      {!userProfile?.height && <li>• Add your height</li>}
                      {!userProfile?.activityLevel && <li>• Set activity level</li>}
                      {(!bodyMetrics?.length && !userProfile?.weight) && <li>• Add current weight</li>}
                    </ul>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation('/profile')}
                      className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
                    >
                      Complete Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Goal Configuration Screen with Tabs
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    {goalSelectionMode === 'recommended' ? 'Recommended Goals' : 'Custom Goals'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGoalSelectionMode('selection')}
                    className="text-xs"
                  >
                    Change Mode
                  </Button>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[12px]">
                  {goalSelectionMode === 'recommended' 
                    ? 'TDEE-based calculations with automatic macro distribution'
                    : 'Manual calorie and macro goal management'
                  }
                </CardDescription>
              </CardHeader>
              
              {/* Sub Tabs for Recommended vs Custom */}
              <div className="px-6 pb-2">
                <Tabs value={goalSubTab} onValueChange={(value) => setGoalSubTab(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger 
                      value="recommended" 
                      disabled={goalSelectionMode !== 'recommended'}
                      className={goalSelectionMode !== 'recommended' ? 'opacity-50' : ''}
                    >
                      Recommended
                    </TabsTrigger>
                    <TabsTrigger 
                      value="custom"
                      disabled={goalSelectionMode !== 'custom'}
                      className={goalSelectionMode !== 'custom' ? 'opacity-50' : ''}
                    >
                      Custom
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <CardContent className="space-y-6">
                {/* Content based on selected tab */}
                {goalSubTab === 'recommended' && goalSelectionMode === 'recommended' && (
                  // Recommended Goals Content
                  <div className="space-y-6">
                    {/* Loading State */}
                    {isDataLoading && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Loading Profile Data</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Fetching your profile information and settings...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Integration Section */}
              {!isDataLoading && userProfile?.fitnessGoal && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">Profile Integration</span>
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation('/profile')}
                      className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 text-xs px-2 py-1 self-start sm:self-auto"
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Goal:</strong> <span className="break-words">{userProfile.fitnessGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Auto-synced with diet goals
                    </p>
                  </div>
                </div>
              )}

              {/* Data Validation Messages - Only show when data is loaded and actually missing */}
              {!isDataLoading && (!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 ">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Missing Profile Data</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    To use TDEE calculation and auto-regulation, please complete your profile first:
                  </p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    {!userProfile?.age && <li>• Add your age in profile settings</li>}
                    {!userProfile?.height && <li>• Add your height in profile settings</li>}
                    {!userProfile?.activityLevel && <li>• Set your activity level in profile settings</li>}
                    {(!bodyMetrics?.length && !userProfile?.weight) && <li>• Add your current weight in Body Tracking tab</li>}
                  </ul>
                </div>
              )}

                    {/* Auto-regulation Toggle - Read-only display */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-gray-700 dark:text-gray-300">Auto-regulation</Label>
                        <p className="text-gray-600 dark:text-gray-400 text-[12px]">
                          Connected to your body data and weight tracking system
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {Boolean(dietGoal.autoRegulation && userProfile?.age && userProfile?.height && userProfile?.activityLevel && (bodyMetrics?.length > 0 || userProfile?.weight)) 
                            ? "✓ Active - automatically adjusting based on your progress data"
                            : "○ Inactive - complete profile data to enable automatic adjustments"
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={Boolean(dietGoal.autoRegulation && userProfile?.age && userProfile?.height && userProfile?.activityLevel && (bodyMetrics?.length > 0 || userProfile?.weight))}
                          disabled={true}
                          className="bg-gray-400 dark:bg-gray-600 pointer-events-none opacity-75"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">System managed</span>
                      </div>
                    </div>

                    {/* TDEE Calculation Results */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 border">
                      <h3 className="text-lg font-semibold mb-3 text-foreground">TDEE Calculation</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* BMR */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{Math.round(calculateBMR())}</div>
                          <div className="text-sm text-muted-foreground">BMR</div>
                          <div className="text-xs text-muted-foreground">Base metabolic rate</div>
                        </div>

                        {/* TDEE */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(calculateTDEE())}</div>
                          <div className="text-sm text-muted-foreground">TDEE</div>
                          <div className="text-xs text-muted-foreground">Total daily energy expenditure</div>
                        </div>

                        {/* Target Calories */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(calculateTargetCalories())}</div>
                          <div className="text-sm text-muted-foreground">Target</div>
                          <div className="text-xs text-muted-foreground">Daily calorie goal</div>
                        </div>
                      </div>
                    </div>

                    {/* Goal Selection */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-foreground">Diet Goal</h3>
                      <RadioGroup
                        value={dietGoal.goal || 'maintain'}
                        onValueChange={(value: 'cut' | 'bulk' | 'maintain') => 
                          setDietGoal({...dietGoal, goal: value, targetCalories: calculateTargetCalories(value)})
                        }
                        className="grid grid-cols-3 gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cut" id="cut" />
                          <Label htmlFor="cut" className="cursor-pointer">Cut (Lose Weight)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="maintain" id="maintain" />
                          <Label htmlFor="maintain" className="cursor-pointer">Maintain</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bulk" id="bulk" />
                          <Label htmlFor="bulk" className="cursor-pointer">Bulk (Gain Weight)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Calculated Macros Display */}
                    <div className="bg-background border border-border p-4 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Calculated Daily Goals</h3>
                      
                      {/* Calorie Goal */}
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <span className="font-medium text-blue-900 dark:text-blue-100">Daily Calories</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{Math.round(calculateTargetCalories())} kcal</span>
                      </div>

                      {/* Macro Breakdown */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Protein */}
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">{Math.round(calculateRecommendedProtein())}g</div>
                          <div className="text-sm text-green-700 dark:text-green-300">Protein</div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            {Math.round((calculateRecommendedProtein() * 4) / calculateTargetCalories() * 100)}%
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{Math.round(calculateRecommendedCarbs())}g</div>
                          <div className="text-sm text-orange-700 dark:text-orange-300">Carbs</div>
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            {Math.round((calculateRecommendedCarbs() * 4) / calculateTargetCalories() * 100)}%
                          </div>
                        </div>

                        {/* Fat */}
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{Math.round(calculateRecommendedFat())}g</div>
                          <div className="text-sm text-purple-700 dark:text-purple-300">Fat</div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            {Math.round((calculateRecommendedFat() * 9) / calculateTargetCalories() * 100)}%
                          </div>
                        </div>
                      </div>

                      {/* RP Methodology Info */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Renaissance Periodization Guidelines</h4>
                        <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                          <li>• Protein: 0.8-1.2g per lb bodyweight for muscle preservation</li>
                          <li>• Fat: 20-35% of calories for hormone production</li>
                          <li>• Carbs: Remainder for energy and performance</li>
                        </ul>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4">
                        <Button
                          onClick={() => {
                            const updatedGoal = {
                              ...dietGoal,
                              targetCalories: Math.round(calculateTargetCalories()),
                              targetProtein: Math.round(calculateRecommendedProtein()),
                              targetCarbs: Math.round(calculateRecommendedCarbs()),
                              targetFat: Math.round(calculateRecommendedFat()),
                              autoRegulation: true
                            };
                            setDietGoal(updatedGoal);
                            handleSaveDietGoal();
                          }}
                          disabled={saveDietGoalMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {saveDietGoalMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving Recommended Goals...
                            </>
                          ) : (
                            'Save Recommended Goals'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {goalSubTab === 'custom' && goalSelectionMode === 'custom' && (
                  // Custom Goals Content
                  <div className="space-y-6">
                    {/* Manual Calorie Input */}
                    <div className="bg-background border border-border p-4 space-y-4">
                      <h4 className="font-medium text-foreground text-sm">Daily Calorie Target</h4>
                      <Input
                        type="number"
                        value={dietGoal.targetCalories}
                        onChange={(e) => setDietGoal(prev => ({ ...prev, targetCalories: Number(e.target.value) }))}
                        className="border-gray-300 dark:border-gray-600"
                        placeholder="Enter calories..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your desired daily calorie target manually
                      </p>
                    </div>

                    {/* MyFitnessPal-Style Macro Percentage Controls */}
                    <div className="bg-background border border-border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground text-sm">Macro Distribution</h4>
                          <p className="text-xs text-muted-foreground">Adjust percentages to total 100%</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-medium ${getTotalPercentage() === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {getTotalPercentage()}%
                          </span>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>

                      {/* Percentage Sliders */}
                      <div className="space-y-4">
                        {/* Protein */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium text-green-600 dark:text-green-400">Protein</Label>
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              {proteinPercentage}% ({Math.round(dietGoal.targetCalories * proteinPercentage / 100 / 4)}g)
                            </div>
                          </div>
                          <Slider
                            value={[proteinPercentage]}
                            onValueChange={(value) => {
                              setProteinPercentage(value[0]);
                              setUserSetPercentages(true);
                              updateMacrosFromPercentages(value[0], carbsPercentage, fatPercentage);
                            }}
                            max={80}
                            min={10}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Carbs */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium text-orange-600 dark:text-orange-400">Carbs</Label>
                            <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                              {carbsPercentage}% ({Math.round(dietGoal.targetCalories * carbsPercentage / 100 / 4)}g)
                            </div>
                          </div>
                          <Slider
                            value={[carbsPercentage]}
                            onValueChange={(value) => {
                              setCarbsPercentage(value[0]);
                              setUserSetPercentages(true);
                              updateMacrosFromPercentages(proteinPercentage, value[0], fatPercentage);
                            }}
                            max={80}
                            min={10}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Fat */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-medium text-purple-600 dark:text-purple-400">Fat</Label>
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {fatPercentage}% ({Math.round(dietGoal.targetCalories * fatPercentage / 100 / 9)}g)
                            </div>
                          </div>
                          <Slider
                            value={[fatPercentage]}
                            onValueChange={(value) => {
                              setFatPercentage(value[0]);
                              setUserSetPercentages(true);
                              updateMacrosFromPercentages(proteinPercentage, carbsPercentage, value[0]);
                            }}
                            max={60}
                            min={15}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {getTotalPercentage() !== 100 && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Please adjust percentages to total exactly 100% before saving
                          </p>
                        </div>
                      )}

                      {/* Save Button */}
                      <div className="pt-4">
                        <Button
                          onClick={handleSaveDietGoal}
                          disabled={saveDietGoalMutation.isPending || getTotalPercentage() !== 100}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {saveDietGoalMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving Custom Goals...
                            </>
                          ) : (
                            'Save Custom Goals'
                          )}
                        </Button>
                        
                        {getTotalPercentage() !== 100 && (
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                            Please adjust macros to total 100% before saving
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="auto-regulation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auto-Regulation & Feedback</CardTitle>
              <p className="text-sm text-muted-foreground">
                RP methodology-based automatic adjustments based on your progress
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Auto-regulation features coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meal-planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meal Planning & Templates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Save and manage your meal plans
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Meal planning features coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
