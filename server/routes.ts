import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeExercises } from "./data/exercises";
import { initializeNutritionDatabase } from "./data/nutrition-seed";
import { initializeVolumeLandmarks } from "./init-volume-landmarks";
import { searchFoodDatabase, getFoodByBarcode } from "./data/foods";
import { getNutritionSummary, logFood, generateNutritionGoal, searchFood } from "./services/nutrition";
import { getTrainingStats, processAutoRegulation, createWorkoutSession, getWorkoutPlan } from "./services/training";
import { insertUserSchema, insertUserProfileSchema, insertNutritionLogSchema, insertAutoRegulationFeedbackSchema, insertWeightLogSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { generateVolumeRecommendations, getFatigueAnalysis, getVolumeRecommendations } from "./auto-regulation-algorithms";
import { MesocyclePeriodization } from "./services/mesocycle-periodization";
import { TemplateEngine } from "./services/template-engine";
import { LoadProgression } from "./services/load-progression";

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
  await initializeVolumeLandmarks();
  
  // Initialize training templates
  try {
    await TemplateEngine.initializeSystemTemplates();
    console.log("Training templates initialized successfully");
  } catch (error) {
    console.log("Training templates already initialized");
  }

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

  // Create new workout session
  app.post("/api/training/sessions", async (req, res) => {
    try {
      const sessionData = req.body;
      
      // Create the workout session
      const session = await storage.createWorkoutSession({
        userId: sessionData.userId,
        programId: null, // No program required for individual sessions
        name: sessionData.name,
        date: new Date(),
        isCompleted: false,
        totalVolume: 0,
        duration: 0
      });

      // Add exercises to session
      for (const exercise of sessionData.exercises) {
        await storage.createWorkoutExercise({
          sessionId: session.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          targetReps: exercise.targetReps,
          restPeriod: exercise.restPeriod,
          notes: exercise.notes || "",
          weight: null,
          actualReps: null,
          rpe: null,
          rir: null,
          isCompleted: false
        });
      }

      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get workout session with exercises
  app.get("/api/training/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      console.log(`API: Getting session ${sessionId}`);
      const session = await storage.getWorkoutSession(sessionId);
      
      if (!session) {
        console.log(`API: Session ${sessionId} not found`);
        return res.status(404).json({ message: "Session not found" });
      }

      console.log(`API: Found session ${sessionId}, getting exercises...`);
      // Get exercises for this session
      const workoutExercises = await storage.getWorkoutExercises(sessionId);
      
      // Get exercise details for each workout exercise
      const exercisesWithDetails = await Promise.all(
        workoutExercises.map(async (we) => {
          const exercise = await storage.getExercise(we.exerciseId);
          return {
            id: we.id,
            exerciseId: we.exerciseId,
            orderIndex: we.orderIndex,
            sets: we.sets,
            targetReps: we.targetReps,
            restPeriod: we.restPeriod || 90,
            notes: we.notes || "",
            weight: we.weight,
            actualReps: we.actualReps,
            rpe: we.rpe,
            rir: we.rir,
            isCompleted: we.isCompleted,
            exercise: exercise
          };
        })
      );

      const sessionWithExercises = {
        ...session,
        exercises: exercisesWithDetails
      };

      res.json(sessionWithExercises);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Save workout session progress
  app.put("/api/training/sessions/:sessionId/progress", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const progressData = req.body;

      // Update session with progress data (but don't mark as completed)
      const updatedSession = await storage.updateWorkoutSession(sessionId, {
        duration: progressData.duration,
        totalVolume: progressData.totalVolume
      });

      // Update workout exercises with actual performance data
      for (const exerciseData of progressData.exercises) {
        const workoutExercises = await storage.getWorkoutExercises(sessionId);
        const workoutExercise = workoutExercises.find(we => we.exerciseId === exerciseData.exerciseId);
        
        if (workoutExercise && exerciseData.sets.length > 0) {
          const completedSets = exerciseData.sets.filter((set: any) => set.completed);
          
          if (completedSets.length > 0) {
            const avgWeight = completedSets.reduce((sum: number, set: any) => sum + set.weight, 0) / completedSets.length;
            const actualReps = completedSets.map((set: any) => set.actualReps).join(',');
            const avgRpe = Math.round(completedSets.reduce((sum: number, set: any) => sum + set.rpe, 0) / completedSets.length);

            await storage.updateWorkoutExercise(workoutExercise.id, {
              actualReps,
              weight: avgWeight.toString(),
              rpe: avgRpe,
              isCompleted: completedSets.length === exerciseData.sets.length // Mark exercise complete only if all sets done
            });
          }
        }
      }

      res.json(updatedSession);
    } catch (error: any) {
      console.error('Save progress error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Complete workout session
  app.put("/api/training/sessions/:sessionId/complete", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const completionData = req.body;

      // Update session with completion data
      const updatedSession = await storage.updateWorkoutSession(sessionId, {
        isCompleted: true,
        duration: completionData.duration,
        totalVolume: completionData.totalVolume
      });

      // Update workout exercises with actual performance data
      for (const exerciseData of completionData.exercises) {
        const workoutExercises = await storage.getWorkoutExercises(sessionId);
        const workoutExercise = workoutExercises.find(we => we.exerciseId === exerciseData.exerciseId);
        
        if (workoutExercise && exerciseData.sets.length > 0) {
          const completedSets = exerciseData.sets.filter((set: any) => set.completed);
          
          if (completedSets.length > 0) {
            const avgWeight = completedSets.reduce((sum: number, set: any) => sum + set.weight, 0) / completedSets.length;
            const actualReps = completedSets.map((set: any) => set.actualReps).join(',');
            const avgRpe = Math.round(completedSets.reduce((sum: number, set: any) => sum + set.rpe, 0) / completedSets.length);

            await storage.updateWorkoutExercise(workoutExercise.id, {
              actualReps,
              weight: avgWeight.toString(),
              rpe: avgRpe,
              isCompleted: true
            });
          }
        }
      }

      res.json(updatedSession);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete workout session
  app.delete("/api/training/sessions/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      const success = await storage.deleteWorkoutSession(sessionId);
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Restart workout session (reset progress but keep structure)
  app.post("/api/training/sessions/:sessionId/restart", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      // Reset session to incomplete and clear progress data
      const updatedSession = await storage.updateWorkoutSession(sessionId, {
        isCompleted: false,
        totalVolume: 0,
        duration: 0
      });

      // Reset all exercise results for this session
      await storage.resetWorkoutSessionProgress(sessionId);
      
      res.json(updatedSession);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Duplicate workout session
  app.post("/api/training/sessions/:sessionId/duplicate", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      // Get original session
      const originalSession = await storage.getWorkoutSession(sessionId);
      if (!originalSession) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Create new session with same structure but fresh state
      const newSession = await storage.createWorkoutSession({
        userId: originalSession.userId,
        name: `${originalSession.name} (Copy)`,
        programId: originalSession.programId,
        isCompleted: false,
        totalVolume: 0,
        duration: 0,
        date: new Date()
      });

      // Copy all exercises from original session
      const originalExercises = await storage.getWorkoutExercises(sessionId);
      for (const exercise of originalExercises) {
        await storage.createExerciseResult({
          sessionId: newSession.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          targetReps: exercise.targetReps,
          actualReps: null,
          weight: null,
          rpe: null,
          rir: null,
          restPeriod: exercise.restPeriod,
          notes: null,
          isCompleted: false
        });
      }
      
      res.json(newSession);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Step 2: Volume Landmarks System API Routes

  // Get muscle groups
  app.get("/api/training/muscle-groups", async (req, res) => {
    try {
      const muscleGroups = await storage.getMuscleGroups();
      res.json(muscleGroups);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get volume landmarks for user
  app.get("/api/training/volume-landmarks/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const landmarks = await storage.getVolumeLandmarks(userId);
      res.json(landmarks);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update volume landmark
  app.put("/api/training/volume-landmarks/:userId/:muscleGroupId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const muscleGroupId = parseInt(req.params.muscleGroupId);
      const landmarkData = req.body;
      
      const updatedLandmark = await storage.updateVolumeLandmark(userId, muscleGroupId, landmarkData);
      
      if (!updatedLandmark) {
        return res.status(404).json({ message: "Volume landmark not found" });
      }
      
      res.json(updatedLandmark);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Step 3: Auto-Regulation System API Routes

  // Submit auto-regulation feedback
  app.post("/api/training/auto-regulation-feedback", async (req, res) => {
    try {
      const feedbackData = req.body;
      const feedback = await storage.createAutoRegulationFeedback(feedbackData);
      
      // Process workout completion data (load progression, volume tracking, etc.)
      if (feedbackData.sessionId && feedbackData.userId) {
        const { WorkoutDataProcessor } = await import("./services/workout-data-processor");
        await WorkoutDataProcessor.processWorkoutCompletion(feedbackData.sessionId, feedbackData.userId);
      }
      
      // Generate volume adjustment recommendations based on feedback
      const recommendations = await generateVolumeRecommendations(feedbackData.userId, feedback);
      
      res.json({ feedback, recommendations });
    } catch (error: any) {
      console.error('Auto-regulation feedback error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get auto-regulation feedback for session
  app.get("/api/training/auto-regulation-feedback/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const feedback = await storage.getAutoRegulationFeedback(sessionId);
      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get fatigue analysis for user
  app.get("/api/training/fatigue-analysis/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const days = parseInt(req.query.days as string) || 14; // Default 14 days
      
      const fatigueAnalysis = await getFatigueAnalysis(userId, days);
      res.json(fatigueAnalysis);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get volume recommendations for user
  app.get("/api/training/volume-recommendations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const recommendations = await getVolumeRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get weekly volume tracking
  app.get("/api/training/weekly-volume/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const weeklyTracking = await storage.getWeeklyVolumeTracking(userId);
      res.json(weeklyTracking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get exercise muscle mapping
  app.get("/api/training/exercise-muscles/:exerciseId", async (req, res) => {
    try {
      const exerciseId = parseInt(req.params.exerciseId);
      const mapping = await storage.getExerciseMuscleMapping(exerciseId);
      res.json(mapping);
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

  // Create new exercise
  app.post("/api/exercises", async (req, res) => {
    try {
      const exerciseData = req.body;
      const exercise = await storage.createExercise(exerciseData);
      res.json(exercise);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update exercise
  app.put("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exerciseData = req.body;
      const exercise = await storage.updateExercise(id, exerciseData);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json(exercise);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete exercise
  app.delete("/api/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteExercise(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      
      res.json({ success: true });
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

  // Advanced Training System Routes

  // Mesocycle management
  app.get("/api/training/mesocycles/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const userMesocycles = await storage.getUserMesocycles(userId);
      
      res.json(userMesocycles);
    } catch (error) {
      console.error("Error fetching mesocycles:", error);
      res.status(500).json({ error: "Failed to fetch mesocycles" });
    }
  });

  app.post("/api/training/mesocycles", async (req, res) => {
    try {
      const { userId, name, templateId, totalWeeks, customProgram } = req.body;
      
      const mesocycleId = await MesocyclePeriodization.createMesocycleWithProgram(
        userId, 
        name, 
        templateId, 
        totalWeeks,
        customProgram
      );
      
      res.json({ id: mesocycleId, message: "Mesocycle created successfully" });
    } catch (error) {
      console.error("Error creating mesocycle:", error);
      res.status(500).json({ error: "Failed to create mesocycle" });
    }
  });

  // Update mesocycle (pause/restart/modify)
  app.put("/api/training/mesocycles/:id", async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedMesocycle = await MesocyclePeriodization.updateMesocycle(mesocycleId, updateData);
      
      res.json(updatedMesocycle);
    } catch (error) {
      console.error("Error updating mesocycle:", error);
      res.status(500).json({ error: "Failed to update mesocycle" });
    }
  });

  // Delete mesocycle
  app.delete("/api/training/mesocycles/:id", async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.id);
      
      await MesocyclePeriodization.deleteMesocycle(mesocycleId);
      
      res.json({ message: "Mesocycle deleted successfully" });
    } catch (error) {
      console.error("Error deleting mesocycle:", error);
      res.status(500).json({ error: "Failed to delete mesocycle" });
    }
  });

  // Get mesocycle workout program
  app.get("/api/training/mesocycles/:id/program", async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.id);
      
      const program = await MesocyclePeriodization.getMesocycleProgram(mesocycleId);
      
      res.json(program);
    } catch (error) {
      console.error("Error fetching mesocycle program:", error);
      res.status(500).json({ error: "Failed to fetch program" });
    }
  });

  // Advance mesocycle week (auto-progression)
  app.post("/api/training/mesocycles/:id/advance-week", async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.id);
      
      const result = await MesocyclePeriodization.advanceWeek(mesocycleId);
      
      res.json(result);
    } catch (error) {
      console.error("Error advancing mesocycle week:", error);
      res.status(500).json({ error: "Failed to advance week" });
    }
  });

  app.get("/api/training/mesocycle-recommendations/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      const recommendations = await MesocyclePeriodization.generateMesocycleRecommendations(userId);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating mesocycle recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Training templates
  app.get("/api/training/templates", async (req, res) => {
    try {
      const { category, userId } = req.query;
      
      const templates = await TemplateEngine.getAvailableTemplates(
        category as string, 
        userId ? parseInt(userId as string) : undefined
      );
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/training/templates", async (req, res) => {
    try {
      const { userId, name, description, category, daysPerWeek, templateData } = req.body;
      
      const template = await TemplateEngine.createUserTemplate(
        userId,
        name,
        description,
        category,
        daysPerWeek,
        templateData
      );
      
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/training/templates/:templateId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const updateData = req.body;
      
      const template = await TemplateEngine.updateTemplate(templateId, updateData);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/training/templates/:templateId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const { userId } = req.body;
      
      const success = await TemplateEngine.deleteTemplate(templateId, userId);
      
      if (!success) {
        return res.status(404).json({ error: "Template not found or unauthorized" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.post("/api/training/templates/generate-workout", async (req, res) => {
    try {
      const { userId, templateId, workoutDay } = req.body;
      
      // Get template data to determine total workouts
      const template = await storage.getTrainingTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Calculate next workout day based on user's progression
      let nextWorkoutDay = workoutDay || 0;
      if (userId && workoutDay === undefined) {
        // Get user's recent sessions for this template to determine progression
        const recentSessions = await storage.getUserWorkoutSessions(userId, { templateId, limit: 10 });
        const totalWorkouts = template.templateData?.workouts?.length || 1;
        
        if (recentSessions.length > 0) {
          // Find the last completed session and increment workout day
          const lastSession = recentSessions.find(s => s.isCompleted);
          if (lastSession) {
            // Extract workout day from session data and increment
            const lastWorkoutDay = lastSession.programId ? (lastSession.programId % totalWorkouts) : 0;
            nextWorkoutDay = (lastWorkoutDay + 1) % totalWorkouts;
          }
        }
      }
      
      const workout = await TemplateEngine.generateWorkoutFromTemplate(
        userId, 
        templateId, 
        nextWorkoutDay
      );
      
      // Automatically add to recent workout sessions
      res.json({ 
        ...workout, 
        workoutDay: nextWorkoutDay,
        totalWorkouts: template.templateData?.workouts?.length || 1,
        message: "Workout generated and added to your workout sessions" 
      });
    } catch (error) {
      console.error("Error generating workout from template:", error);
      res.status(500).json({ error: "Failed to generate workout" });
    }
  });

  app.get("/api/training/templates/:templateId/customize/:userId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const userId = parseInt(req.params.userId);
      const { specialization, availableDays } = req.query;
      
      const customizedTemplate = await TemplateEngine.customizeTemplateForUser(
        templateId,
        userId,
        specialization as string,
        availableDays ? parseInt(availableDays as string) : undefined
      );
      
      res.json(customizedTemplate);
    } catch (error) {
      console.error("Error customizing template:", error);
      res.status(500).json({ error: "Failed to customize template" });
    }
  });

  // Load progression
  app.get("/api/training/load-progression/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { exerciseIds } = req.query;
      
      const exerciseIdArray = exerciseIds 
        ? (exerciseIds as string).split(',').map(id => parseInt(id))
        : [];
      
      const progressions = await LoadProgression.getWorkoutProgressions(userId, exerciseIdArray);
      
      res.json(progressions);
    } catch (error) {
      console.error("Error fetching load progressions:", error);
      res.status(500).json({ error: "Failed to fetch load progressions" });
    }
  });

  app.post("/api/training/load-progression", async (req, res) => {
    try {
      const {
        userId,
        exerciseId,
        sessionId,
        previousWeight,
        currentWeight,
        averageRpe,
        averageRir,
        progressionType,
        notes
      } = req.body;
      
      await LoadProgression.recordProgression(
        userId,
        exerciseId,
        sessionId,
        previousWeight,
        currentWeight,
        averageRpe,
        averageRir,
        progressionType,
        notes
      );
      
      res.json({ message: "Load progression recorded successfully" });
    } catch (error) {
      console.error("Error recording load progression:", error);
      res.status(500).json({ error: "Failed to record load progression" });
    }
  });

  app.get("/api/training/performance-analysis/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { timeframeDays } = req.query;
      
      const analysis = await LoadProgression.analyzePerformance(
        userId,
        timeframeDays ? parseInt(timeframeDays as string) : 28
      );
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing performance:", error);
      res.status(500).json({ error: "Failed to analyze performance" });
    }
  });

  // Initialize system templates on startup
  app.post("/api/training/init-templates", async (req, res) => {
    try {
      await TemplateEngine.initializeSystemTemplates();
      res.json({ message: "System templates initialized successfully" });
    } catch (error) {
      console.error("Error initializing templates:", error);
      res.status(500).json({ error: "Failed to initialize templates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}