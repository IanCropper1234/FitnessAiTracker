import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Search, Plus, ShoppingCart, Database, Brain, Loader2, Target, Calculator, BookOpen, Save, Edit, Trash2, Settings, Clock, Calendar, Activity, User } from "lucide-react";
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
    activityLevel?: string;
    fitnessGoal?: string;
  };
  profile?: {
    age?: number;
    weight?: number;
    height?: number;
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
  
  // UI State
  const [activeTab, setActiveTab] = useState<'diet-goal' | 'meal-timing' | 'meal-builder' | 'saved-plans'>('diet-goal');
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
    targetProtein: 150,
    targetCarbs: 200,
    targetFat: 65,
    autoRegulation: false,
    weeklyWeightTarget: 0
  });
  
  // Macro Percentage State - Start with standard macro distribution
  const [macroPercentages, setMacroPercentages] = useState({
    protein: 25, // 25% protein
    carbs: 45,   // 45% carbs  
    fat: 30      // 30% fat
  });

  // Refs for auto-centering wheel scrolls
  const proteinWheelRef = useRef<HTMLDivElement>(null);
  const carbsWheelRef = useRef<HTMLDivElement>(null);
  const fatWheelRef = useRef<HTMLDivElement>(null);

  // Track whether initial centering has been done
  const [hasInitialCentered, setHasInitialCentered] = useState(false);
  
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
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
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
  const { data: userProfileResponse } = useQuery<UserProfileResponse>({
    queryKey: ['/api/user/profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/user/profile/${userId}`);
      return response.json();
    }
  });

  // Extract profile data for easier access
  const userProfile = userProfileResponse?.profile || userProfileResponse?.user;

  // Fetch body metrics for recent weight
  const { data: bodyMetrics } = useQuery({
    queryKey: ['/api/body-metrics', userId],
    queryFn: async () => {
      const response = await fetch(`/api/body-metrics/${userId}`);
      return response.json();
    }
  });

  // Fetch current diet goal
  const { data: currentDietGoal } = useQuery<DietGoal>({
    queryKey: ['/api/diet-goals', userId],
    queryFn: async () => {
      const response = await fetch(`/api/diet-goals/${userId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setDietGoal(data);
      }
    }
  });

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
        if (currentDietGoal.goal !== expectedDietGoal) {
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
      const response = await fetch(`/api/meal-plans/saved/${userId}`);
      return response.json();
    }
  });

  // Fetch meal timing preferences for meal scheduling
  const { data: mealTimingPreferences } = useQuery<MealTimingPreference | null>({
    queryKey: ['/api/meal-timing', userId],
    queryFn: async () => {
      const response = await fetch(`/api/meal-timing/${userId}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Diet goal mutations
  const saveDietGoalMutation = useMutation({
    mutationFn: async (goal: DietGoal) => {
      // Always use PUT to update/create the goal for this user
      return await apiRequest("PUT", `/api/diet-goals/${userId}`, goal);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diet goal saved successfully!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/diet-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
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
      for (let i = 0; i < preWorkoutMeals; i++) {
        const mealTime = new Date(workout.getTime() - (preWorkoutWindow - (i * 0.5)) * 60 * 60 * 1000);
        mealSchedule.push({
          mealNumber: i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'pre-workout',
          description: `Pre-workout meal ${i + 1}`
        });
      }
      
      // Post-workout meals
      for (let i = 0; i < postWorkoutMeals; i++) {
        const mealTime = new Date(workout.getTime() + (postWorkoutWindow + (i * 0.5)) * 60 * 60 * 1000);
        mealSchedule.push({
          mealNumber: preWorkoutMeals + i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'post-workout',
          description: `Post-workout meal ${i + 1}`
        });
      }
      
      // Fill remaining meals
      const remainingMeals = mealsPerDay - preWorkoutMeals - postWorkoutMeals;
      const intervalHours = awakeHours / (remainingMeals + 1);
      
      for (let i = 0; i < remainingMeals; i++) {
        const mealTime = new Date(wake.getTime() + ((i + 1) * intervalHours * 60 * 60 * 1000));
        mealSchedule.push({
          mealNumber: preWorkoutMeals + postWorkoutMeals + i + 1,
          scheduledTime: mealTime.toTimeString().slice(0, 5),
          type: 'regular',
          description: `Meal ${preWorkoutMeals + postWorkoutMeals + i + 1}`
        });
      }
    } else {
      // Regular day - evenly distribute meals
      const intervalHours = awakeHours / (mealsPerDay + 1);
      
      for (let i = 0; i < mealsPerDay; i++) {
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
    const activeDietGoal = currentDietGoal || dietGoal;
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
          const remainingMeals = mealTimingPreferences.mealsPerDay - mealTimingPreferences.preWorkoutMeals - mealTimingPreferences.postWorkoutMeals;
          const remainingCalories = 0.45; // 45% for non-workout meals
          caloriePercent = remainingCalories / remainingMeals;
          proteinPercent = 0.45 / remainingMeals;
          carbPercent = 0.35 / remainingMeals;
          fatPercent = 0.7 / remainingMeals;
        }
      } else {
        // Even distribution across all meals
        caloriePercent = 1 / mealTimingPreferences.mealsPerDay;
        proteinPercent = 1 / mealTimingPreferences.mealsPerDay;
        carbPercent = 1 / mealTimingPreferences.mealsPerDay;
        fatPercent = 1 / mealTimingPreferences.mealsPerDay;
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

  // TDEE Calculation Function
  const calculateTDEE = (age: number, weight: number, height: number, activityLevel: string, gender: 'male' | 'female' = 'male') => {
    // Harris-Benedict Formula
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
        const calculatedTDEE = calculateTDEE(
          userProfile.age,
          Number(latestWeight),
          Number(userProfile.height),
          userProfile.activityLevel
        );
        
        const targetCalories = calculateTargetCalories(calculatedTDEE, dietGoal.goal, dietGoal.weeklyWeightTarget);
        
        setDietGoal(prev => ({
          ...prev,
          tdee: calculatedTDEE,
          targetCalories: targetCalories
        }));
      }
    }
  }, [userProfile, bodyMetrics, dietGoal.autoRegulation, dietGoal.goal, dietGoal.weeklyWeightTarget]);

  // Calculate target calories based on goal
  const calculateTargetCalories = (tdee: number, goal: string, weeklyTarget?: number) => {
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

  // Function to calculate macros from calories and percentages
  const calculateMacrosFromPercentages = (calories: number, percentages: { protein: number; carbs: number; fat: number }) => {
    // Ensure percentages total 100%
    const total = percentages.protein + percentages.carbs + percentages.fat;
    if (Math.abs(total - 100) > 0.1) {
      console.warn(`Macro percentages total ${total}%, adjusting to 100%`);
      const scale = 100 / total;
      const adjustedPercentages = {
        protein: percentages.protein * scale,
        carbs: percentages.carbs * scale,
        fat: percentages.fat * scale
      };
      return {
        protein: Math.round((calories * adjustedPercentages.protein / 100) / 4), // 4 cal per gram
        carbs: Math.round((calories * adjustedPercentages.carbs / 100) / 4),      // 4 cal per gram  
        fat: Math.round((calories * adjustedPercentages.fat / 100) / 9)          // 9 cal per gram
      };
    }

    return {
      protein: Math.round((calories * percentages.protein / 100) / 4), // 4 cal per gram
      carbs: Math.round((calories * percentages.carbs / 100) / 4),      // 4 cal per gram  
      fat: Math.round((calories * percentages.fat / 100) / 9)          // 9 cal per gram
    };
  };

  // Function to calculate current macro percentages from saved diet goal
  const calculateCurrentMacroPercentages = (dietGoal: DietGoal) => {
    const totalCalories = (dietGoal.targetProtein * 4) + (dietGoal.targetCarbs * 4) + (dietGoal.targetFat * 9);
    if (totalCalories === 0) return { protein: 25, carbs: 45, fat: 30 }; // Default
    
    return {
      protein: Math.round((dietGoal.targetProtein * 4 / totalCalories) * 100),
      carbs: Math.round((dietGoal.targetCarbs * 4 / totalCalories) * 100),
      fat: Math.round((dietGoal.targetFat * 9 / totalCalories) * 100)
    };
  };

  // Validation function to ensure percentages total 100%
  const validateMacroPercentages = (percentages: { protein: number; carbs: number; fat: number }) => {
    const total = percentages.protein + percentages.carbs + percentages.fat;
    return Math.abs(total - 100) < 0.1; // Allow small rounding errors
  };

  // Initialize macro percentages from saved diet goal
  useEffect(() => {
    if (currentDietGoal?.targetCalories && currentDietGoal.targetProtein && currentDietGoal.targetCarbs && currentDietGoal.targetFat) {
      const savedPercentages = calculateCurrentMacroPercentages(currentDietGoal);
      setMacroPercentages(savedPercentages);
    }
  }, [currentDietGoal]);

  // Auto-center wheels to selected percentages (only on initial load)
  useEffect(() => {
    if (hasInitialCentered) return; // Only center once
    
    const centerWheelOnPercentage = (wheelRef: React.RefObject<HTMLDivElement>, percentage: number) => {
      if (!wheelRef.current) return;
      
      // Find the selected button
      const buttons = wheelRef.current.querySelectorAll('button');
      const selectedButton = Array.from(buttons).find(button => 
        button.textContent?.trim() === `${percentage}%`
      );
      
      if (selectedButton) {
        // Calculate the scroll position to center the selected button
        const container = wheelRef.current;
        const buttonTop = selectedButton.offsetTop;
        const buttonHeight = selectedButton.offsetHeight;
        const containerHeight = container.offsetHeight;
        
        // Center the button in the container
        const scrollTop = buttonTop - (containerHeight / 2) + (buttonHeight / 2);
        
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    };

    // Center all three wheels with a delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      centerWheelOnPercentage(proteinWheelRef, macroPercentages.protein);
      centerWheelOnPercentage(carbsWheelRef, macroPercentages.carbs);
      centerWheelOnPercentage(fatWheelRef, macroPercentages.fat);
      setHasInitialCentered(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [macroPercentages, hasInitialCentered]);

  // Update macros and calories when percentages change
  useEffect(() => {
    if (!dietGoal.targetCalories) return; // Wait for target calories to be available
    
    // Validate percentages total 100%
    if (!validateMacroPercentages(macroPercentages)) {
      // Auto-adjust to ensure 100% total
      const total = macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat;
      const scale = 100 / total;
      const adjustedPercentages = {
        protein: Math.round(macroPercentages.protein * scale),
        carbs: Math.round(macroPercentages.carbs * scale),
        fat: Math.round(macroPercentages.fat * scale)
      };
      setMacroPercentages(adjustedPercentages);
      return;
    }
    
    const macros = calculateMacrosFromPercentages(dietGoal.targetCalories, macroPercentages);
    
    // Only update and save if macros actually changed
    const currentMacros = {
      protein: dietGoal.targetProtein,
      carbs: dietGoal.targetCarbs,
      fat: dietGoal.targetFat
    };
    
    if (macros.protein === currentMacros.protein && 
        macros.carbs === currentMacros.carbs && 
        macros.fat === currentMacros.fat) {
      return; // No changes, skip update
    }
    
    // Update local state
    setDietGoal(prev => ({
      ...prev,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat
    }));

    // Save to database with longer debouncing to prevent loops
    const timeoutId = setTimeout(() => {
      saveDietGoalMutation.mutate({
        ...dietGoal,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [macroPercentages.protein, macroPercentages.carbs, macroPercentages.fat, dietGoal.targetCalories]);

  // Handle macro percentage changes with validation
  const handleMacroPercentageChange = (macro: 'protein' | 'carbs' | 'fat', percentage: number) => {
    const newPercentages = { ...macroPercentages, [macro]: percentage };
    
    // Ensure total doesn't exceed 100%
    const total = newPercentages.protein + newPercentages.carbs + newPercentages.fat;
    if (total <= 100) {
      setMacroPercentages(newPercentages);
    } else {
      // If total exceeds 100%, adjust other macros proportionally
      const otherMacros = Object.keys(newPercentages).filter(key => key !== macro) as ('protein' | 'carbs' | 'fat')[];
      const remainingPercent = 100 - percentage;
      const currentOtherTotal = otherMacros.reduce((sum, key) => sum + macroPercentages[key], 0);
      
      if (currentOtherTotal > 0) {
        const adjustedPercentages = { ...newPercentages };
        otherMacros.forEach(key => {
          adjustedPercentages[key] = Math.round((macroPercentages[key] / currentOtherTotal) * remainingPercent);
        });
        setMacroPercentages(adjustedPercentages);
      }
    }
  };

  // Reset macro percentages to standard distribution
  const resetMacroPercentages = () => {
    const standardPercentages = { protein: 25, carbs: 45, fat: 30 };
    setMacroPercentages(standardPercentages);
  };



  // Calculate current calorie total from macros
  const calculateCurrentCalories = () => {
    return Math.round((dietGoal.targetProtein * 4) + (dietGoal.targetCarbs * 4) + (dietGoal.targetFat * 9));
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
    // Ensure weeklyWeightTarget is 0 for maintain goals
    const goalToSave = {
      ...dietGoal,
      weeklyWeightTarget: dietGoal.goal === 'maintain' ? 0 : dietGoal.weeklyWeightTarget
    };
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
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/logs', userId] });
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diet-goal" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Diet Goal
          </TabsTrigger>
          <TabsTrigger value="meal-timing" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Meal Timing
          </TabsTrigger>
          <TabsTrigger value="meal-builder" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Meal Builder
          </TabsTrigger>
          <TabsTrigger value="saved-plans" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Saved Plans
          </TabsTrigger>
        </TabsList>

        {/* Diet Goal Tab */}
        <TabsContent value="diet-goal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Diet Goal & TDEE Calculator
              </CardTitle>
              <CardDescription className="text-muted-foreground text-[12px]">
                Set your diet goals with automatic TDEE calculation and macro distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Integration Section */}
              {userProfile?.fitnessGoal && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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

              {/* Data Validation Messages */}
              {(!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)) && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
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

              {/* Auto-regulation Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium text-black dark:text-white">Auto-regulation</Label>
                  <p className="text-gray-600 dark:text-gray-400 text-[12px]">
                    Automatically adjust calories and macros based on your body data and weight logs
                  </p>
                  {(!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)) && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Disabled: Complete your profile data first
                    </p>
                  )}
                </div>
                <Switch
                  checked={dietGoal.autoRegulation && userProfile?.age && userProfile?.height && userProfile?.activityLevel && (bodyMetrics?.length > 0 || userProfile?.weight)}
                  onCheckedChange={(checked) => {
                    if (!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)) {
                      toast({
                        title: "Profile Incomplete",
                        description: "Please complete your profile data first to enable auto-regulation.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setDietGoal(prev => ({ ...prev, autoRegulation: checked }));
                  }}
                  disabled={!userProfile?.age || !userProfile?.height || !userProfile?.activityLevel || (!bodyMetrics?.length && !userProfile?.weight)}
                  className="bg-[#505d6e]"
                />
              </div>

              {/* TDEE and Goal Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-black dark:text-white">TDEE (Total Daily Energy Expenditure)</Label>
                    <Input
                      type="number"
                      value={dietGoal.tdee}
                      onChange={(e) => setDietGoal(prev => ({ ...prev, tdee: Number(e.target.value) }))}
                      disabled={dietGoal.autoRegulation}
                      className="border-gray-300 dark:border-gray-600"
                    />
                    {dietGoal.autoRegulation && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated from: {userProfile?.age}y, {bodyMetrics?.length > 0 ? bodyMetrics[0]?.weight : userProfile?.weight}kg, {userProfile?.height}cm, {userProfile?.activityLevel}
                      </p>
                    )}
                    {!dietGoal.autoRegulation && (
                      <p className="text-xs text-gray-500 mt-1">Manual entry mode</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-black dark:text-white">Diet Goal</Label>
                    <Select value={dietGoal.goal} onValueChange={(value) => {
                      const getDefaultWeightTarget = (goal: string) => {
                        switch (goal) {
                          case 'cut': return -0.5; // Default 0.5kg loss per week
                          case 'bulk': return 0.3; // Default 0.3kg gain per week
                          case 'maintain': return 0; // No weight change
                          default: return 0;
                        }
                      };
                      
                      setDietGoal(prev => ({ 
                        ...prev, 
                        goal: value as any,
                        weeklyWeightTarget: getDefaultWeightTarget(value)
                      }));
                    }}>
                      <SelectTrigger className="border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cut">Cut (Fat Loss)</SelectItem>
                        <SelectItem value="bulk">Bulk (Muscle Gain)</SelectItem>
                        <SelectItem value="maintain">Maintain</SelectItem>
                      </SelectContent>
                    </Select>
                    {userProfile?.fitnessGoal && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Target className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              <strong className="text-gray-800 dark:text-gray-200">
                                {userProfile.fitnessGoal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </strong>
                            </span>
                          </div>
                          <div className="text-xs">
                            {(() => {
                              let expectedGoal = 'maintain';
                              switch (userProfile.fitnessGoal) {
                                case 'Weight Loss':
                                case 'weight_loss':
                                  expectedGoal = 'cut';
                                  break;
                                case 'Muscle Gain':
                                case 'muscle_gain':
                                  expectedGoal = 'bulk';
                                  break;
                                default:
                                  expectedGoal = 'maintain';
                              }
                              const isMatched = dietGoal.goal === expectedGoal;
                              return (
                                <span className={isMatched ? 'text-green-600 dark:text-green-400 font-medium' : 'text-orange-600 dark:text-orange-400 font-medium'}>
                                  {isMatched ? '✓ Synced' : `→ Suggests ${expectedGoal}`}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {dietGoal.goal !== 'maintain' && (
                    <div>
                      <Label className="text-black dark:text-white">Weekly Weight Target (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dietGoal.weeklyWeightTarget || ''}
                        onChange={(e) => setDietGoal(prev => ({ ...prev, weeklyWeightTarget: Number(e.target.value) }))}
                        placeholder={dietGoal.goal === 'cut' ? '-0.5' : '0.3'}
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-black dark:text-white">Target Calories</Label>
                    <Input
                      type="number"
                      value={dietGoal.targetCalories}
                      onChange={(e) => setDietGoal(prev => ({ ...prev, targetCalories: Number(e.target.value) }))}
                      disabled={dietGoal.autoRegulation}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="min-w-0">
                      <Label className="text-black dark:text-white text-xs truncate block">Protein</Label>
                      <Input
                        type="number"
                        value={Math.round(dietGoal.targetProtein)}
                        onChange={(e) => setDietGoal(prev => ({ ...prev, targetProtein: Number(e.target.value) }))}
                        disabled={dietGoal.autoRegulation}
                        className="border-gray-300 dark:border-gray-600 text-xs h-8"
                        placeholder="g"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="text-black dark:text-white text-xs truncate block">Carbs</Label>
                      <Input
                        type="number"
                        value={Math.round(dietGoal.targetCarbs)}
                        onChange={(e) => setDietGoal(prev => ({ ...prev, targetCarbs: Number(e.target.value) }))}
                        disabled={dietGoal.autoRegulation}
                        className="border-gray-300 dark:border-gray-600 text-xs h-8"
                        placeholder="g"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="text-black dark:text-white text-xs truncate block">Fat</Label>
                      <Input
                        type="number"
                        value={Math.round(dietGoal.targetFat)}
                        onChange={(e) => setDietGoal(prev => ({ ...prev, targetFat: Number(e.target.value) }))}
                        disabled={dietGoal.autoRegulation}
                        className="border-gray-300 dark:border-gray-600 text-xs h-8"
                        placeholder="g"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro Distribution Chart */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-black dark:text-white mb-3 text-sm">Macro Distribution</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-0">
                    <div className="text-blue-700 dark:text-blue-300 font-medium text-xs truncate">Protein</div>
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100 leading-tight">
                      {Math.round(Number(dietGoal.targetProtein))}g
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {dietGoal.targetCalories > 0 ? Math.round((dietGoal.targetProtein * 4) / dietGoal.targetCalories * 100) : 0}%
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-0">
                    <div className="text-green-700 dark:text-green-300 font-medium text-xs truncate">Carbs</div>
                    <div className="text-lg font-bold text-green-900 dark:text-green-100 leading-tight">
                      {Math.round(Number(dietGoal.targetCarbs))}g
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      {dietGoal.targetCalories > 0 ? Math.round((dietGoal.targetCarbs * 4) / dietGoal.targetCalories * 100) : 0}%
                    </div>
                  </div>
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg min-w-0">
                    <div className="text-yellow-700 dark:text-yellow-300 font-medium text-xs truncate">Fat</div>
                    <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100 leading-tight">
                      {Math.round(Number(dietGoal.targetFat))}g
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {dietGoal.targetCalories > 0 ? Math.round((dietGoal.targetFat * 9) / dietGoal.targetCalories * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Dial/Wheel Controls Macro Adjustment Section */}
              {(
                <div className="bg-background border border-border rounded-lg p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Macro Adjustments</h4>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(calculateCurrentCalories())} cal
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetMacroPercentages}
                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm px-3 py-1 h-auto font-medium"
                    >
                      Reset
                    </Button>
                  </div>
                  
                  {/* iOS-Style Wheel Controls */}
                  <div className="bg-background border border-border rounded-2xl overflow-hidden ios-smooth-transform">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-accent/20">
                      <h4 className="text-sm font-semibold text-foreground">Macro Adjustments</h4>
                      <div className="text-xs text-muted-foreground">Swipe to adjust</div>
                    </div>
                    
                    {/* Macro Wheel Controls */}
                    <div className="px-4 py-6 overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
                      <div className="grid grid-cols-3 gap-2 text-center relative max-w-full">
                        
                        {/* Protein Wheel */}
                        <div className="flex flex-col items-center min-w-0">
                          <div className="text-blue-600 dark:text-blue-400 text-xs font-medium text-center mb-2">
                            Protein: {Math.round(Number(dietGoal.targetProtein))}g
                          </div>
                          <div ref={proteinWheelRef} className="max-h-32 overflow-y-auto space-y-1 date-picker-wheel py-8 w-full" style={{ touchAction: 'pan-y' }}>
                            {Array.from({ length: 41 }, (_, i) => i + 10).map((percentage) => (
                              <button
                                key={percentage}
                                onClick={() => handleMacroPercentageChange('protein', percentage)}
                                className={`w-full text-sm py-2 px-1 rounded-lg transition-all duration-200 touch-target min-h-[36px] flex items-center justify-center return-button-animation ${
                                  percentage === macroPercentages.protein
                                    ? 'bg-blue-500 text-white font-semibold shadow-md' 
                                    : 'text-foreground/70 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                                }`}
                              >
                                {percentage}%
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Carbs Wheel */}
                        <div className="flex flex-col items-center min-w-0">
                          <div className="text-green-600 dark:text-green-400 text-xs font-medium text-center mb-2">
                            Carbs: {Math.round(Number(dietGoal.targetCarbs))}g
                          </div>
                          <div ref={carbsWheelRef} className="max-h-32 overflow-y-auto space-y-1 date-picker-wheel py-8 w-full" style={{ touchAction: 'pan-y' }}>
                            {Array.from({ length: 41 }, (_, i) => i + 10).map((percentage) => (
                              <button
                                key={percentage}
                                onClick={() => handleMacroPercentageChange('carbs', percentage)}
                                className={`w-full text-sm py-2 px-1 rounded-lg transition-all duration-200 touch-target min-h-[36px] flex items-center justify-center return-button-animation ${
                                  percentage === macroPercentages.carbs
                                    ? 'bg-green-500 text-white font-semibold shadow-md' 
                                    : 'text-foreground/70 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400'
                                }`}
                              >
                                {percentage}%
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Fat Wheel */}
                        <div className="flex flex-col items-center min-w-0">
                          <div className="text-orange-600 dark:text-orange-400 text-xs font-medium text-center mb-2">
                            Fat: {Math.round(Number(dietGoal.targetFat))}g
                          </div>
                          <div ref={fatWheelRef} className="max-h-32 overflow-y-auto space-y-1 date-picker-wheel py-8 w-full" style={{ touchAction: 'pan-y' }}>
                            {Array.from({ length: 41 }, (_, i) => i + 10).map((percentage) => (
                              <button
                                key={percentage}
                                onClick={() => handleMacroPercentageChange('fat', percentage)}
                                className={`w-full text-sm py-2 px-1 rounded-lg transition-all duration-200 touch-target min-h-[36px] flex items-center justify-center return-button-animation ${
                                  percentage === macroPercentages.fat
                                    ? 'bg-orange-500 text-white font-semibold shadow-md' 
                                    : 'text-foreground/70 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400'
                                }`}
                              >
                                {percentage}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom Summary */}
                    <div className="px-4 py-3 bg-accent/10 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Distribution:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400">P: {macroPercentages.protein}%</span>
                          <span className="text-green-600 dark:text-green-400">C: {macroPercentages.carbs}%</span>
                          <span className="text-orange-600 dark:text-orange-400">F: {macroPercentages.fat}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Total:</span>
                        <div className={`font-medium ${
                          validateMacroPercentages(macroPercentages) 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat}% 
                          {validateMacroPercentages(macroPercentages) ? '✓' : '⚠'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSaveDietGoal}
                disabled={saveDietGoalMutation.isPending}
                className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              >
                {saveDietGoalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Diet Goal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meal Timing Tab */}
        <TabsContent value="meal-timing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Meal Timing & Distribution
              </CardTitle>
              <CardDescription>
                Generate personalized meal schedules based on your timing preferences and training schedule
              </CardDescription>
            </CardHeader>
          </Card>

          {!mealTimingPreferences ? (
            <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-100 text-lg">
                  Meal Timing Not Configured
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  Please set up your meal timing preferences in the Profile page to generate personalized meal schedules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setLocation('/profile')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Meal Timing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Meal Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Meal Schedule
                  </CardTitle>
                  <CardDescription>
                    Optimized timing based on your preferences and workout schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generateMealSchedule().map((meal, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            meal.type === 'pre-workout' ? 'bg-orange-500' :
                            meal.type === 'post-workout' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div>
                            <span className="font-medium text-black dark:text-white">{meal.scheduledTime}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">{meal.description}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          meal.type === 'pre-workout' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                          meal.type === 'post-workout' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                        }`}>
                          {meal.type === 'pre-workout' ? 'Pre-Workout' :
                           meal.type === 'post-workout' ? 'Post-Workout' :
                           'Regular'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Macro Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Macro Distribution
                  </CardTitle>
                  <CardDescription>
                    Optimized nutrient timing for each meal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!currentDietGoal ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please set up your diet goals first to see personalized macro distribution.
                      </p>
                      <Button
                        onClick={() => setActiveTab('diet-goal')}
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                        size="sm"
                      >
                        Set Diet Goals
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {distributeMacrosAcrossMeals().map((meal, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-black dark:text-white">{meal.scheduledTime} - {meal.description}</span>
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{Math.round(meal.targetCalories)} cal</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-green-600 dark:text-green-400 font-medium">{Number(meal.targetProtein).toFixed(1)}g</div>
                              <div className="text-gray-500">Protein</div>
                            </div>
                            <div className="text-center">
                              <div className="text-orange-600 dark:text-orange-400 font-medium">{Number(meal.targetCarbs).toFixed(1)}g</div>
                              <div className="text-gray-500">Carbs</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-600 dark:text-purple-400 font-medium">{Number(meal.targetFat).toFixed(1)}g</div>
                              <div className="text-gray-500">Fat</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Summary */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Daily Totals</div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-blue-600 dark:text-blue-400">{Number(currentDietGoal.targetCalories).toFixed(0)}</div>
                            <div className="text-gray-500">Calories</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-green-600 dark:text-green-400">{Number(currentDietGoal.targetProtein).toFixed(1)}g</div>
                            <div className="text-gray-500">Protein</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-orange-600 dark:text-orange-400">{Number(currentDietGoal.targetCarbs).toFixed(1)}g</div>
                            <div className="text-gray-500">Carbs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-purple-600 dark:text-purple-400">{Number(currentDietGoal.targetFat).toFixed(1)}g</div>
                            <div className="text-gray-500">Fat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* RP Methodology Features */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    RP Diet Coach Features
                  </CardTitle>
                  <CardDescription>
                    Advanced meal timing optimization using Renaissance Periodization methodology
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Nutrient Timing Principles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h4 className="font-medium text-orange-900 dark:text-orange-100">Pre-Workout</h4>
                      </div>
                      <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        <div>• Higher carbs for energy</div>
                        <div>• Moderate protein</div>
                        <div>• Lower fat for digestion</div>
                        <div>• Timing: 1-2 hours before</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-medium text-green-900 dark:text-green-100">Post-Workout</h4>
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <div>• High protein for recovery</div>
                        <div>• Moderate carbs for glycogen</div>
                        <div>• Lower fat initially</div>
                        <div>• Timing: Within 1-2 hours</div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">Regular Meals</h4>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <div>• Balanced macro distribution</div>
                        <div>• Higher fat for satiety</div>
                        <div>• Steady protein throughout</div>
                        <div>• Consistent timing</div>
                      </div>
                    </div>
                  </div>

                  {/* Timing Configuration Summary */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-black dark:text-white mb-3">Current Configuration</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.wakeTime}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Wake Time</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.sleepTime}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Sleep Time</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">{mealTimingPreferences.mealsPerDay}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Meals/Day</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-semibold text-black dark:text-white">
                          {mealTimingPreferences.workoutDays?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Workout Days</div>
                      </div>
                    </div>
                  </div>
                  
                  {mealTimingPreferences.workoutTime && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                        <Activity className="w-4 h-4" />
                        <span className="font-medium">Workout: {mealTimingPreferences.workoutTime}</span>
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {mealTimingPreferences.preWorkoutMeals} pre-workout meal(s) • {mealTimingPreferences.postWorkoutMeals} post-workout meal(s)
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => setLocation('/profile')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Adjust Timing Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Meal Builder Tab */}
        <TabsContent value="meal-builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Food Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {searchMode === 'database' ? <Search className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                  {searchMode === 'database' ? 'Food Database Search' : 'AI Food Analysis'}
                </CardTitle>
                <CardDescription>
                  {searchMode === 'database' 
                    ? 'Search from millions of foods in the Open Food Facts database'
                    : 'Describe your food and get instant nutrition analysis'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={searchMode === 'database' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('database')}
                    className={searchMode === 'database' 
                      ? "bg-black dark:bg-white text-white dark:text-black" 
                      : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Food Database
                  </Button>
                  <Button
                    variant={searchMode === 'ai' ? 'default' : 'outline'}
                    onClick={() => setSearchMode('ai')}
                    className={searchMode === 'ai' 
                      ? "bg-black dark:bg-white text-white dark:text-black" 
                      : "border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Analysis
                  </Button>
                </div>

                {/* Search Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={searchMode === 'database' 
                      ? "Search for foods (e.g., 'chicken breast', 'apple')..." 
                      : "Describe your food (e.g., '1 cup of cooked rice with butter')..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (searchMode === 'ai' ? handleAIAnalysis() : null)}
                    className="border-gray-300 dark:border-gray-600"
                  />
                  {searchMode === 'ai' && (
                    <Button 
                      onClick={handleAIAnalysis}
                      disabled={!searchQuery.trim() || aiAnalyzeMutation.isPending}
                      className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                    >
                      {aiAnalyzeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* AI Analysis Results */}
                {aiAnalyzeMutation.data && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Analysis Result</h4>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Calories:</span> {aiAnalyzeMutation.data.calories || 0}
                      </div>
                      <div className="text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Protein:</span> {aiAnalyzeMutation.data.protein || 0}g
                      </div>
                      <div className="text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Carbs:</span> {aiAnalyzeMutation.data.carbs || 0}g
                      </div>
                      <div className="text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Fat:</span> {aiAnalyzeMutation.data.fat || 0}g
                      </div>
                    </div>
                    <Button 
                      onClick={addAIAnalysisToMealPlan}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Meal Plan
                    </Button>
                  </div>
                )}

                {/* Search Results */}
                {searchMode === 'database' && (
                  <div className="space-y-2">
                    {isLoading && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-black dark:text-white" />
                      </div>
                    )}
                    {searchResults && searchResults.length > 0 && (
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {searchResults.map((food) => (
                          <div
                            key={food.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => addToMealPlan(food)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-black dark:text-white">{food.name}</h4>
                                {food.brand && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{food.brand}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="ml-2">
                                {food.source === 'openfoodfacts' ? 'OpenFood' : 'Custom'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <span><strong>Cal:</strong> {food.calories}</span>
                              <span><strong>P:</strong> {food.protein}g</span>
                              <span><strong>C:</strong> {food.carbs}g</span>
                              <span><strong>F:</strong> {food.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults && searchResults.length === 0 && searchQuery.length > 2 && !isLoading && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No foods found. Try a different search term or use AI analysis.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Meal Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Current Meal Plan
                </CardTitle>
                <CardDescription>
                  Selected foods for your meal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meal Type Selection */}
                <div>
                  <Label className="text-black dark:text-white">Meal Type</Label>
                  <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                    <SelectTrigger className="border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Meal Plan Name (for saving) */}
                <div>
                  <Label className="text-black dark:text-white">Meal Plan Name (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., High Protein Breakfast"
                    value={mealPlanName}
                    onChange={(e) => setMealPlanName(e.target.value)}
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label className="text-black dark:text-white">Description (Optional)</Label>
                  <Textarea
                    placeholder="Brief description of this meal plan..."
                    value={mealPlanDescription}
                    onChange={(e) => setMealPlanDescription(e.target.value)}
                    className="border-gray-300 dark:border-gray-600 min-h-[60px]"
                  />
                </div>

                {/* Selected Foods */}
                <div className="space-y-2">
                  {selectedFoods.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No foods selected yet. Search and add foods to build your meal.
                    </p>
                  ) : (
                    selectedFoods.map((food, index) => (
                      <div key={`${food.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-black dark:text-white">{food.name}</h4>
                          <div className="grid grid-cols-4 gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>{food.calories} cal</span>
                            <span>{food.protein}g P</span>
                            <span>{food.carbs}g C</span>
                            <span>{food.fat}g F</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromMealPlan(index)}
                          className="ml-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {selectedFoods.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Meal Totals</h4>
                    <div className="grid grid-cols-4 gap-2 text-sm text-green-700 dark:text-green-300">
                      <div><strong>Calories:</strong> {totals.calories}</div>
                      <div><strong>Protein:</strong> {totals.protein}g</div>
                      <div><strong>Carbs:</strong> {totals.carbs}g</div>
                      <div><strong>Fat:</strong> {totals.fat}g</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedFoods.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveMeal}
                      disabled={saveMealMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {saveMealMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Log Meal
                        </>
                      )}
                    </Button>
                    {mealPlanName.trim() && (
                      <Button
                        onClick={handleSaveMealPlan}
                        disabled={saveMealPlanMutation.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {saveMealPlanMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {isEditingPlan ? 'Update Plan' : 'Save Plan'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Saved Plans Tab */}
        <TabsContent value="saved-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Saved Meal Plans
              </CardTitle>
              <CardDescription>
                Manage your saved meal plans and quickly build meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!savedMealPlans || savedMealPlans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No saved meal plans yet. Create your first meal plan in the Meal Builder tab.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('meal-builder')}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Meal Plan
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedMealPlans.map((plan) => (
                    <Card key={plan.id} className="border border-gray-200 dark:border-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg text-black dark:text-white">{plan.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 capitalize">
                              {plan.mealType}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadMealPlan(plan)}
                              className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMealPlan(plan.id)}
                              disabled={deleteMealPlanMutation.isPending}
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="font-medium text-blue-900 dark:text-blue-100">{plan.totalCalories}</div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">Calories</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <div className="font-medium text-green-900 dark:text-green-100">{plan.totalProtein}g</div>
                            <div className="text-xs text-green-600 dark:text-green-400">Protein</div>
                          </div>
                          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                            <div className="font-medium text-yellow-900 dark:text-yellow-100">{plan.totalCarbs}g</div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">Carbs</div>
                          </div>
                          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                            <div className="font-medium text-orange-900 dark:text-orange-100">{plan.totalFat}g</div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">Fat</div>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Foods ({plan.foods.length}):</p>
                          {plan.foods.slice(0, 3).map((food, index) => (
                            <p key={index} className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              • {food.name}
                            </p>
                          ))}
                          {plan.foods.length > 3 && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              +{plan.foods.length - 3} more foods...
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleLogMealPlan(plan)}
                            disabled={logMealPlanMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Log Meal
                          </Button>
                          <Button
                            onClick={() => loadMealPlan(plan)}
                            variant="outline"
                            className="flex-1 border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
