import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeExercises } from "./data/exercises";
import { initializeNutritionDatabase } from "./data/nutrition-seed";
import { searchFoodDatabase, getFoodByBarcode } from "./data/foods";
import { getNutritionSummary, logFood, generateNutritionGoal, searchFood } from "./services/nutrition";
import { getTrainingStats, processAutoRegulation, createWorkoutSession, getWorkoutPlan } from "./services/training";
import { insertUserSchema, insertUserProfileSchema, insertNutritionLogSchema, insertAutoRegulationFeedbackSchema, insertWeightLogSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { sql } from "drizzle-orm";

// RP Diet Coach categorization functions
function categorizeFoodByRP(calories: number, protein: number, carbs: number, fat: number): string {
  if (calories === 0) return "mixed";
  
  // RP methodology ratios per 100 calories
  const proteinPer100Cal = (protein * 4 * 100) / calories;
  const carbsPer100Cal = (carbs * 4 * 100) / calories;
  const fatPer100Cal = (fat * 9 * 100) / calories;
  
  // Primary protein source: >20g protein per 100 calories
  if (proteinPer100Cal >= 80) return "protein";
  
  // Primary carb source: >15g carbs per 100 calories, low fat
  if (carbsPer100Cal >= 60 && fatPer100Cal < 25) return "carb";
  
  // Primary fat source: >8g fat per 100 calories
  if (fatPer100Cal >= 65) return "fat";
  
  return "mixed";
}

function getMealSuitability(category: string, protein: number, carbs: number, fat: number): string[] {
  const suitability: string[] = [];
  
  switch (category) {
    case "protein":
      suitability.push("post-workout", "regular");
      if (fat < 3) suitability.push("pre-workout");
      break;
    case "carb":
      suitability.push("pre-workout", "regular");
      if (protein > 5) suitability.push("post-workout");
      break;
    case "fat":
      suitability.push("regular", "snack");
      break;
    case "mixed":
      suitability.push("regular");
      if (carbs > 15 && fat < 8) suitability.push("pre-workout");
      if (protein > 15) suitability.push("post-workout");
      break;
  }
  
  // All foods can be snacks
  if (!suitability.includes("snack")) {
    suitability.push("snack");
  }
  
  return suitability;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data
  await initializeExercises();
  await initializeNutritionDatabase();

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, preferredLanguage } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        preferredLanguage: preferredLanguage || "en",
        theme: "dark"
      });

      // Create default profile
      await storage.createUserProfile({
        userId: user.id,
        activityLevel: "moderately_active",
        fitnessGoal: "muscle_gain",
        dietaryRestrictions: []
      });

      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User profile routes
  app.get("/api/user/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const profile = await storage.getUserProfile(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user, profile });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/user/profile/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profileData = insertUserProfileSchema.parse(req.body);
      
      const profile = await storage.updateUserProfile(userId, profileData);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Nutrition routes
  app.get("/api/nutrition/summary/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const summary = await getNutritionSummary(userId, date);
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/nutrition/log", async (req, res) => {
    try {
      const logData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      const log = await storage.createNutritionLog(logData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/nutrition/logs/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      const logs = await storage.getNutritionLogs(userId, date);
      res.json(logs);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/nutrition/log/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNutritionLog(id);
      
      if (!success) {
        return res.status(404).json({ message: "Log not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/nutrition/goal/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { activityLevel, fitnessGoal, height, weight, age } = req.body;
      
      const goal = await storage.createNutritionGoal({
        userId: userId,
        dailyCalories: 2000, // Will be calculated by AI later
        protein: "150",
        carbs: "200",
        fat: "60"
      });
      
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AI nutrition analysis
  app.post("/api/nutrition/analyze", async (req, res) => {
    try {
      const { foodDescription, quantity, unit } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      // Import the analyzeNutrition function from services
      const { analyzeNutrition } = await import("./services/openai");
      
      const analysis = await analyzeNutrition(
        foodDescription, 
        quantity || 1, 
        unit || "serving"
      );
      
      res.json(analysis);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Quick add suggestions based on patterns
  app.get("/api/nutrition/quick-add/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealType = req.query.mealType as string;
      
      // Get logs from past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const logs = await storage.getNutritionLogsInRange(userId, thirtyDaysAgo, new Date());
      console.log(`Quick add: Found ${logs.length} logs for user ${userId} in past 30 days`);
      
      // Find patterns - foods logged 2+ times in same meal type
      const foodCounts = logs
        .filter(log => !mealType || log.mealType === mealType)
        .reduce((acc: any, log) => {
          const key = `${log.foodName}_${log.mealType}_${log.quantity}_${log.unit}`;
          if (!acc[key]) {
            acc[key] = { count: 0, log: log };
          }
          acc[key].count++;
          return acc;
        }, {});
      
      console.log('Food counts:', Object.keys(foodCounts).length, 'unique combinations');
      
      // Return foods with 2+ occurrences, sorted by frequency
      const suggestions = Object.values(foodCounts)
        .filter((item: any) => item.count >= 2)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 6)
        .map((item: any) => ({
          ...item.log,
          frequency: item.count
        }));
      
      console.log(`Quick add: Found ${suggestions.length} suggestions with 2+ occurrences`);
      res.json(suggestions);
    } catch (error: any) {
      console.error('Quick add error:', error);
      res.json([]); // Return empty array on error to avoid breaking UI
    }
  });

  // Copy meals from another date
  app.post("/api/nutrition/copy-meals", async (req, res) => {
    try {
      const { userId, fromDate, toDate, mealTypes } = req.body;
      
      // Get logs from source date
      const sourceLogs = await storage.getNutritionLogs(userId, new Date(fromDate));
      
      // Filter by selected meal types if specified
      const logsToCopy = mealTypes && mealTypes.length > 0 
        ? sourceLogs.filter(log => mealTypes.includes(log.mealType))
        : sourceLogs;
      
      // Create new logs for target date
      const copiedLogs = [];
      for (const log of logsToCopy) {
        const newLog = {
          userId,
          date: new Date(toDate),
          foodName: log.foodName,
          quantity: log.quantity,
          unit: log.unit,
          calories: log.calories,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
          mealType: log.mealType,
          category: log.category,
          mealSuitability: log.mealSuitability
        };
        const createdLog = await storage.createNutritionLog(newLog);
        copiedLogs.push(createdLog);
      }
      
      res.json({ copiedCount: copiedLogs.length, logs: copiedLogs });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced Food search routes with RP categorization
  app.get("/api/food/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const category = req.query.category as string; // protein, carb, fat, mixed
      const mealType = req.query.mealType as string; // pre-workout, post-workout, regular, snack
      
      console.log('Enhanced food search:', { query, category, mealType });
      
      if (!query || query.length < 3) {
        return res.json([]);
      }

      // Search Open Food Facts API
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments,serving_size,code`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Open Food Facts API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform and categorize foods using RP methodology
      const foods = await Promise.all(data.products?.map(async (product: any) => {
        const calories = Math.round(product.nutriments?.['energy-kcal_100g'] || 0);
        const protein = Math.round(product.nutriments?.['proteins_100g'] || 0);
        const carbs = Math.round(product.nutriments?.['carbohydrates_100g'] || 0);
        const fat = Math.round(product.nutriments?.['fat_100g'] || 0);
        
        if (calories === 0) return null;
        
        // Apply RP categorization logic
        const foodCategory = categorizeFoodByRP(calories, protein, carbs, fat);
        const suitability = getMealSuitability(foodCategory, protein, carbs, fat);
        
        return {
          id: product.code || `off_${Date.now()}_${Math.random()}`,
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          calories,
          protein,
          carbs,
          fat,
          serving_size: product.serving_size || '100g',
          barcode: product.code,
          source: 'openfoodfacts',
          category: foodCategory,
          mealSuitability: suitability
        };
      }) || []);

      // Filter out null values and apply category/meal type filters
      let filteredFoods = foods.filter(food => food !== null);
      
      if (category) {
        filteredFoods = filteredFoods.filter(food => food.category === category);
      }
      
      if (mealType) {
        filteredFoods = filteredFoods.filter(food => 
          food.mealSuitability && food.mealSuitability.includes(mealType)
        );
      }

      console.log(`Returning ${filteredFoods.length} enhanced foods with RP categorization`);
      res.json(filteredFoods);
    } catch (error: any) {
      console.error('Enhanced food search error:', error);
      res.json([]);
    }
  });

  app.get("/api/food/barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      const food = getFoodByBarcode(barcode);
      
      if (!food) {
        return res.status(404).json({ message: "Food not found" });
      }

      res.json(food);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // RP Diet Coach food recommendations
  app.get("/api/food/recommendations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealType = req.query.mealType as string;
      const currentTime = req.query.time as string;
      
      // Get user's recent logs to understand preferences
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentLogs = await storage.getNutritionLogsInRange(userId, thirtyDaysAgo, new Date());
      
      // Analyze food patterns by category
      const categoryPreferences = recentLogs.reduce((acc: any, log) => {
        if (log.category) {
          if (!acc[log.category]) acc[log.category] = [];
          acc[log.category].push(log.foodName);
        }
        return acc;
      }, {});
      
      // Generate RP-based recommendations
      const recommendations = [];
      
      // Pre-workout recommendations (high carb, low fat)
      if (mealType === "pre-workout") {
        recommendations.push(
          { name: "Banana", category: "carb", reason: "Fast-digesting carbs for energy" },
          { name: "Oatmeal", category: "carb", reason: "Sustained energy release" },
          { name: "White rice", category: "carb", reason: "Quick carb absorption" }
        );
      }
      
      // Post-workout recommendations (high protein, moderate carbs)
      if (mealType === "post-workout") {
        recommendations.push(
          { name: "Whey protein shake", category: "protein", reason: "Fast protein absorption for recovery" },
          { name: "Greek yogurt", category: "mixed", reason: "High protein with carbs for glycogen replenishment" },
          { name: "Chicken breast", category: "protein", reason: "High-quality lean protein" }
        );
      }
      
      // Regular meal recommendations (balanced)
      if (mealType === "regular" || !mealType) {
        recommendations.push(
          { name: "Salmon", category: "mixed", reason: "Omega-3 fatty acids and high-quality protein" },
          { name: "Sweet potato", category: "carb", reason: "Complex carbs with fiber" },
          { name: "Avocado", category: "fat", reason: "Healthy monounsaturated fats" }
        );
      }
      
      res.json(recommendations);
    } catch (error: any) {
      console.error('Food recommendations error:', error);
      res.json([]);
    }
  });

  // Training routes
  app.get("/api/training/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await getTrainingStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/training/sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await storage.getWorkoutSessions(userId);
      res.json(sessions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/training/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercises();
      res.json(exercises);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/training/session/complete", async (req, res) => {
    try {
      const sessionData = req.body;
      const result = await createWorkoutSession(sessionData.userId, sessionData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/training/auto-regulation", async (req, res) => {
    try {
      const feedbackData = req.body;
      const result = await processAutoRegulation(
        feedbackData.sessionId,
        feedbackData.userId,
        {
          pumpQuality: feedbackData.pumpQuality,
          muscleSoreness: feedbackData.muscleSoreness,
          perceivedEffort: feedbackData.perceivedEffort,
          energyLevel: feedbackData.energyLevel,
          sleepQuality: feedbackData.sleepQuality,
        }
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/training/plan/:userId/:day", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const day = req.params.day;
      
      const plan = await getWorkoutPlan(userId, day);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/exercises", async (req, res) => {
    try {
      const category = req.query.category as string;
      
      if (category) {
        const exercises = await storage.getExercisesByCategory(category);
        res.json(exercises);
      } else {
        const exercises = await storage.getExercises();
        res.json(exercises);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Weight tracking
  app.post("/api/weight/log", async (req, res) => {
    try {
      const logData = insertWeightLogSchema.parse(req.body);
      const log = await storage.createWeightLog(logData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/weight/logs/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const logs = await storage.getWeightLogs(userId);
      res.json(logs);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Enhanced Nutrition Routes - RP Diet Coach Features
  
  // Food Categories
  app.get("/api/food/categories", async (req, res) => {
    try {
      const macroType = req.query.macroType as string;
      
      if (macroType) {
        const categories = await storage.getFoodCategoriesByMacroType(macroType);
        res.json(categories);
      } else {
        const categories = await storage.getFoodCategories();
        res.json(categories);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Food Items
  app.get("/api/food/items", async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      const search = req.query.search as string;
      
      if (search) {
        const items = await storage.searchFoodItems(search);
        res.json(items);
      } else if (categoryId) {
        const items = await storage.getFoodItemsByCategory(categoryId);
        res.json(items);
      } else {
        const items = await storage.getFoodItems();
        res.json(items);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/food/barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      const item = await storage.getFoodItemByBarcode(barcode);
      
      if (!item) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Meal Planning
  app.get("/api/meal-plans/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const plans = await storage.getMealPlans(userId, date);
      res.json(plans);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-plans", async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createMealPlan(planData);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const planData = req.body;
      const plan = await storage.updateMealPlan(id, planData);
      
      if (!plan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMealPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Weekly Nutrition Goals
  app.get("/api/weekly-nutrition-goal/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weekStartDate = req.query.weekStartDate ? new Date(req.query.weekStartDate as string) : null;
      
      let goal;
      if (weekStartDate) {
        goal = await storage.getWeeklyNutritionGoal(userId, weekStartDate);
      } else {
        goal = await storage.getCurrentWeeklyNutritionGoal(userId);
      }
      
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/weekly-nutrition-goal", async (req, res) => {
    try {
      const goalData = req.body;
      const goal = await storage.createWeeklyNutritionGoal(goalData);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Diet Phases
  app.get("/api/diet-phases/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activeOnly = req.query.activeOnly === 'true';
      
      if (activeOnly) {
        const phase = await storage.getActiveDietPhase(userId);
        res.json(phase);
      } else {
        const phases = await storage.getDietPhases(userId);
        res.json(phases);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/diet-phases", async (req, res) => {
    try {
      const phaseData = req.body;
      const phase = await storage.createDietPhase(phaseData);
      res.json(phase);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Meal Timing Preferences
  app.get("/api/meal-timing/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await storage.getMealTimingPreferences(userId);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-timing", async (req, res) => {
    try {
      const preferencesData = req.body;
      const preferences = await storage.createMealTimingPreferences(preferencesData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/meal-timing/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferencesData = req.body;
      const preferences = await storage.updateMealTimingPreferences(userId, preferencesData);
      
      if (!preferences) {
        return res.status(404).json({ message: "Meal timing preferences not found" });
      }
      
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });



  // Body Metrics
  app.get("/api/body-metrics/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const metrics = await storage.getBodyMetrics(userId);
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/body-metrics", async (req, res) => {
    try {
      const metricData = {
        ...req.body,
        date: new Date(req.body.date)
      };
      const metric = await storage.createBodyMetric(metricData);
      res.json(metric);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/body-metrics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBodyMetric(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Body metric not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Nutrition Progression
  app.get("/api/nutrition/progression/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const startDate = new Date(req.query.start as string);
      const endDate = new Date(req.query.end as string);
      
      const progression = await storage.getNutritionProgression(userId, startDate, endDate);
      res.json(progression);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Saved Meal Plans - Diet Builder
  app.get("/api/meal-plans/saved/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealType = req.query.mealType as string;
      
      if (mealType) {
        const plans = await storage.getSavedMealPlansByType(userId, mealType);
        res.json(plans);
      } else {
        const plans = await storage.getSavedMealPlans(userId);
        res.json(plans);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-plans/saved", async (req, res) => {
    try {
      const mealPlan = await storage.createSavedMealPlan(req.body);
      res.json(mealPlan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/meal-plans/saved/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.updateSavedMealPlan(id, req.body);
      
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/meal-plans/saved/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSavedMealPlan(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Diet Goals - TDEE and Auto-regulation
  app.get("/api/diet-goals/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const goal = await storage.getDietGoal(userId);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/diet-goals", async (req, res) => {
    try {
      const goal = await storage.createDietGoal(req.body);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/diet-goals/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const goal = await storage.updateDietGoal(userId, req.body);
      
      if (!goal) {
        return res.status(404).json({ message: "Diet goal not found" });
      }
      
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Advanced Macro Management API endpoints
  const { AdvancedMacroManagementService } = await import("./services/advanced-macro-management");

  // Weekly macro adjustment endpoint
  app.post("/api/weekly-adjustment", async (req, res) => {
    try {
      const { userId, weekStartDate, currentGoals, adjustmentReason, energyLevels, hungerLevels, adherencePercentage } = req.body;
      
      // Calculate the adjustment based on RP methodology
      const adjustment = await AdvancedMacroManagementService.calculateWeeklyAdjustment(userId, weekStartDate);
      
      // Create weekly goal entry
      const weeklyGoal = await AdvancedMacroManagementService.createWeeklyGoal({
        userId,
        weekStartDate,
        dailyCalories: adjustment.adjustment.newCalories,
        protein: adjustment.adjustment.newProtein,
        carbs: adjustment.adjustment.newCarbs,
        fat: adjustment.adjustment.newFat,
        adjustmentReason: adjustment.adjustment.adjustmentReason,
        adherencePercentage: adjustment.adherencePercentage,
        energyLevels,
        hungerLevels,
        adjustmentPercentage: adjustment.adjustment.adjustmentPercentage
      });

      // Always update current diet goals with the new adjustments
      const updatedDietGoals = await storage.updateDietGoal(userId, {
        targetCalories: adjustment.adjustment.newCalories.toString(),
        targetProtein: adjustment.adjustment.newProtein.toString(),
        targetCarbs: adjustment.adjustment.newCarbs.toString(),
        targetFat: adjustment.adjustment.newFat.toString()
      });

      res.json({
        weeklyGoal,
        adjustment: adjustment.adjustment,
        appliedToCurrentGoals: true,
        updatedDietGoals
      });
    } catch (error: any) {
      console.error('Weekly adjustment error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get weekly goals
  app.get("/api/weekly-goals/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const week = req.query.week as string;
      
      const weeklyGoals = await AdvancedMacroManagementService.getWeeklyGoals(userId, week);
      res.json(weeklyGoals);
    } catch (error: any) {
      console.error('Get weekly goals error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get available weeks with food log data
  app.get("/api/nutrition/available-weeks/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get distinct weeks that have food logs
      const result = await db.execute(sql`
        SELECT 
          date_trunc('week', date)::date as week_start,
          COUNT(*) as log_count,
          MIN(date)::date as first_log,
          MAX(date)::date as last_log
        FROM nutrition_logs 
        WHERE user_id = ${userId}
        GROUP BY date_trunc('week', date)
        ORDER BY week_start DESC
        LIMIT 12
      `);
      
      const availableWeeks = result.rows.map((row: any) => ({
        weekStart: row.week_start,
        logCount: parseInt(row.log_count),
        firstLog: row.first_log,
        lastLog: row.last_log,
        weekLabel: `Week of ${new Date(row.week_start).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })}`
      }));

      res.json(availableWeeks);
    } catch (error: any) {
      console.error('Get available weeks error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}