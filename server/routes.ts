import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeExercises } from "./data/exercises";
import { initializeNutritionDatabase } from "./data/nutrition-seed";
import { initializeVolumeLandmarks } from "./init-volume-landmarks";
import { searchFoodDatabase, getFoodByBarcode } from "./data/foods";
import { getNutritionSummary, logFood, generateNutritionGoal, searchFood } from "./services/nutrition";
import { getTrainingStats, processAutoRegulation, createWorkoutSession, getWorkoutPlan } from "./services/training";
import { insertUserSchema, insertUserProfileSchema, insertNutritionLogSchema, insertAutoRegulationFeedbackSchema, insertWeightLogSchema, nutritionLogs } from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { generateVolumeRecommendations, getFatigueAnalysis, getVolumeRecommendations } from "./auto-regulation-algorithms";
import { MesocyclePeriodization } from "./services/mesocycle-periodization";
import { TemplateEngine } from "./services/template-engine";
import { LoadProgression } from "./services/load-progression";
import { AnalyticsService } from "./services/analytics-service";
import { validateAndCleanupTemplates } from "./validate-templates";
import { workoutExercises, workoutSessions, exercises } from "@shared/schema";
import { eq, and, desc, sql, lt, inArray } from "drizzle-orm";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any).userId;
  console.log('RequireAuth - Session ID:', req.sessionID);
  console.log('RequireAuth - Session userId:', userId);
  console.log('RequireAuth - Headers:', req.headers.cookie);
  
  if (!userId) {
    console.log('RequireAuth failed - no userId in session');
    return res.status(401).json({ message: "Not authenticated" });
  }
  (req as any).userId = userId;
  console.log('RequireAuth successful for userId:', userId);
  next();
}

// Extend Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Auto-progression algorithm for workout sessions
async function getAutoProgressedValues(exerciseId: number, userId: number, previousExercise: any) {
  try {
    // Get recent performance data for this exercise
    const recentSessions = await storage.getWorkoutSessions(userId);
    const completedSessions = recentSessions.filter(s => s.isCompleted).slice(0, 3); // Last 3 sessions
    
    let recentPerformance = [];
    for (const session of completedSessions) {
      const exercises = await storage.getWorkoutExercises(session.id);
      const exerciseData = exercises.find(e => e.exerciseId === exerciseId && e.isCompleted);
      if (exerciseData && exerciseData.weight && exerciseData.actualReps) {
        recentPerformance.push({
          weight: parseFloat(exerciseData.weight),
          reps: exerciseData.actualReps.split(',').map(r => parseInt(r.trim())),
          rpe: exerciseData.rpe || 7,
          date: session.date
        });
      }
    }

    // Progressive overload based on recent performance
    if (recentPerformance.length > 0) {
      const lastPerformance = recentPerformance[0];
      const avgRPE = recentPerformance.reduce((sum, p) => sum + p.rpe, 0) / recentPerformance.length;
      
      let newWeight = lastPerformance.weight;
      let newSets = previousExercise.sets;
      let newTargetReps = previousExercise.targetReps;

      // Progressive overload logic based on RPE
      if (avgRPE < 7) {
        // Low RPE - increase weight by 2.5%
        newWeight = Math.round((lastPerformance.weight * 1.025) * 4) / 4;
      } else if (avgRPE <= 8) {
        // Moderate RPE - small increase
        newWeight = Math.round((lastPerformance.weight * 1.0125) * 4) / 4;
      } else {
        // High RPE - maintain weight, possibly add volume
        newWeight = lastPerformance.weight;
        if (newSets < 4) newSets += 1;
      }

      return {
        weight: newWeight.toString(),
        sets: newSets,
        targetReps: newTargetReps
      };
    }

    // No recent data, use previous values with small progression
    const baseWeight = previousExercise.weight ? parseFloat(previousExercise.weight) : 20;
    return {
      weight: (Math.round((baseWeight * 1.025) * 4) / 4).toString(),
      sets: previousExercise.sets,
      targetReps: previousExercise.targetReps
    };
    
  } catch (error) {
    console.error('Error calculating auto-progression:', error);
    return {
      weight: previousExercise.weight || "20",
      sets: previousExercise.sets,
      targetReps: previousExercise.targetReps
    };
  }
}

// Auto-sync diet goals with fitness goal changes
async function syncDietGoalsWithFitnessGoal(userId: number, fitnessGoal: string, profileData: any) {
  // Map fitness goals to diet goals and calculate appropriate macros
  let dietGoal = "maintain";
  let calorieAdjustment = 0;
  let weeklyWeightTarget = 0;
  
  switch (fitnessGoal) {
    case "Weight Loss":
    case "weight_loss":
      dietGoal = "cut";
      calorieAdjustment = -300; // 300 calorie deficit
      weeklyWeightTarget = -0.5; // 0.5kg loss per week
      break;
    case "Muscle Gain":
    case "muscle_gain":
      dietGoal = "bulk";
      calorieAdjustment = +250; // 250 calorie surplus
      weeklyWeightTarget = 0.25; // 0.25kg gain per week
      break;
    case "Body Recomposition":
    case "body_recomposition":
      dietGoal = "maintain";
      calorieAdjustment = 0; // Maintenance calories
      weeklyWeightTarget = 0;
      break;
    case "Strength Gain":
    case "strength_gain":
      dietGoal = "bulk";
      calorieAdjustment = +200; // Modest surplus
      weeklyWeightTarget = 0.2;
      break;
    case "Endurance Improvement":
    case "endurance_improvement":
      dietGoal = "maintain";
      calorieAdjustment = +100; // Slight surplus for recovery
      weeklyWeightTarget = 0;
      break;
    case "Maintenance":
    case "maintenance":
    default:
      dietGoal = "maintain";
      calorieAdjustment = 0;
      weeklyWeightTarget = 0;
      break;
  }
  
  // Calculate TDEE based on profile data
  const weight = profileData.weight ? parseFloat(profileData.weight) : 70;
  const height = profileData.height ? parseFloat(profileData.height) : 170;
  const age = profileData.age || 30;
  
  // Harris-Benedict equation for BMR
  const bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  
  // Activity level multipliers
  const activityMultipliers: Record<string, number> = {
    "Sedentary": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extremely Active": 1.9
  };
  
  const activityMultiplier = activityMultipliers[profileData.activityLevel] || 1.55;
  const tdee = Math.round(bmr * activityMultiplier);
  const targetCalories = tdee + calorieAdjustment;
  
  // Calculate macros based on goal
  let proteinPerKg = 1.6; // Base protein
  let fatPercentage = 25; // Base fat percentage
  
  if (dietGoal === "bulk") {
    proteinPerKg = 1.8; // Higher protein for muscle gain
    fatPercentage = 25;
  } else if (dietGoal === "cut") {
    proteinPerKg = 2.0; // Higher protein for muscle preservation
    fatPercentage = 20; // Lower fat for deficit
  }
  
  const targetProtein = Math.round(weight * proteinPerKg);
  const targetFat = Math.round((targetCalories * fatPercentage / 100) / 9);
  const targetCarbs = Math.round((targetCalories - (targetProtein * 4) - (targetFat * 9)) / 4);
  
  // Update or create diet goals
  try {
    const existingGoals = await storage.getDietGoal(userId);
    
    const dietGoalData = {
      userId,
      tdee: tdee.toString(),
      goal: dietGoal,
      targetCalories: targetCalories.toString(),
      targetProtein: targetProtein.toString(),
      targetCarbs: targetCarbs.toString(),
      targetFat: targetFat.toString(),
      autoRegulation: true,
      weeklyWeightTarget: weeklyWeightTarget.toString()
    };
    
    if (existingGoals) {
      await storage.updateDietGoal(userId, dietGoalData);
    } else {
      await storage.createDietGoal(dietGoalData);
    }
    
    console.log(`Auto-synced diet goals for fitness goal "${fitnessGoal}": ${dietGoal} - ${targetCalories} cal, ${targetProtein}g protein`);
  } catch (error) {
    console.error('Failed to sync diet goals:', error);
    throw error;
  }
}

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

  // Debug endpoint to investigate session data (temporary)
  app.get("/api/debug/session", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const sessionUserId = (req.session as any).userId;
      const sessionData = req.session;
      
      console.log('=== SESSION DEBUG ===');
      console.log('Session ID:', sessionId);
      console.log('Session userId:', sessionUserId);
      console.log('Full session data:', sessionData);
      
      // Check if user exists in database
      let userFromDb = null;
      if (sessionUserId) {
        userFromDb = await storage.getUser(sessionUserId);
      }
      
      res.json({
        sessionId,
        sessionUserId,
        userFound: !!userFromDb,
        userEmail: userFromDb?.email,
        userId: userFromDb?.id
      });
    } catch (error: any) {
      console.error('Session debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to see all users (temporary - for investigation only)
  app.get("/api/debug/users", async (req, res) => {
    try {
      // DANGER: This endpoint exposes all user data - only for debugging
      const result = await db.execute(sql`
        SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 10
      `);
      
      console.log('=== USERS DEBUG ===');
      console.log('Found users:', result.rows);
      
      res.json({
        totalUsers: result.rows.length,
        users: result.rows,
        warning: "This is a debug endpoint - remove in production"
      });
    } catch (error: any) {
      console.error('Users debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to check specific user's data (temporary)
  app.get("/api/debug/user-data/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get user
      const user = await storage.getUser(userId);
      
      // Get user's nutrition logs count
      const nutritionLogs = await storage.getNutritionLogs(userId);
      
      // Get user's profile
      const profile = await storage.getUserProfile(userId);
      
      console.log('=== USER DATA DEBUG ===');
      console.log(`User ${userId} data:`, {
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
        profileExists: !!profile,
        nutritionLogsCount: nutritionLogs.length
      });
      
      res.json({
        userId,
        user: user ? { id: user.id, email: user.email, name: user.name } : null,
        profile: profile ? { userId: profile.userId, fitnessGoal: profile.fitnessGoal } : null,
        nutritionLogsCount: nutritionLogs.length,
        sampleNutritionLogs: nutritionLogs.slice(0, 3).map(log => ({
          id: log.id,
          userId: log.userId,
          foodName: log.foodName,
          date: log.date
        }))
      });
    } catch (error: any) {
      console.error('User data debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, preferredLanguage } = insertUserSchema.parse(req.body);
      
      console.log('=== SIGNUP ATTEMPT ===');
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Session ID before signup:', req.sessionID);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log('User already exists:', existingUser.id, existingUser.email);
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

      console.log('User created:', user.id, user.email);

      // Create default profile
      const profile = await storage.createUserProfile({
        userId: user.id,
        activityLevel: "moderately_active",
        fitnessGoal: "muscle_gain",
        dietaryRestrictions: []
      });

      console.log('Profile created for user:', profile.userId);

      // Automatically sign in the new user
      (req.session as any).userId = user.id;
      console.log('Session userId set to:', user.id);
      console.log('Session ID after signup:', req.sessionID);
      
      // Ensure session is saved for new user
      req.session.save((err) => {
        if (err) {
          console.error('Session save error during signup:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        console.log('New user session saved successfully');
        res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log('Signin attempt for email:', email);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        console.log('User not found or no password for:', email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user ID in session
      (req.session as any).userId = user.id;
      console.log('Session userId set to:', user.id);
      console.log('Session ID:', req.sessionID);
      
      // Ensure session is saved
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        console.log('Session saved successfully');
        res.json({ user: { id: user.id, email: user.email, name: user.name } });
      });
    } catch (error: any) {
      console.error('Signin error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/signout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to sign out" });
        }
        res.json({ message: "Signed out successfully" });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      console.log('Auth check - Session ID:', req.sessionID);
      console.log('Auth check - Session userId:', (req.session as any).userId);
      const userId = (req.session as any).userId;
      if (!userId) {
        console.log('No userId in session');
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        console.log('User not found for userId:', userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('Auth check successful for user:', user.email);
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      console.error('Auth check error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // User profile routes
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
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

  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const profileData = insertUserProfileSchema.parse(req.body);
      
      // Get current profile to check if fitness goal changed
      const currentProfile = await storage.getUserProfile(userId);
      const fitnessGoalChanged = currentProfile?.fitnessGoal !== profileData.fitnessGoal;
      
      const profile = await storage.updateUserProfile(userId, profileData);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Auto-sync diet goals when fitness goal changes
      if (fitnessGoalChanged && profileData.fitnessGoal) {
        try {
          await syncDietGoalsWithFitnessGoal(userId, profileData.fitnessGoal, profileData);
        } catch (error) {
          console.warn('Failed to sync diet goals with fitness goal:', error);
          // Don't fail the profile update if diet goal sync fails
        }
      }

      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Duplicate route removed - causing routing conflicts

  // Developer settings route
  app.put("/api/auth/user/developer-settings", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { showDeveloperFeatures } = req.body;
      
      const user = await storage.updateUserDeveloperSettings(userId, showDeveloperFeatures);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Recent activities route
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Get recent nutrition logs (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const nutritionLogs = await storage.getNutritionLogsInRange(userId, sevenDaysAgo, new Date());
      const workoutSessions = await storage.getWorkoutSessions(userId);
      
      // Format activities
      const activities = [
        ...nutritionLogs.slice(0, limit).map(log => ({
          id: `nutrition-${log.id}`,
          type: 'nutrition',
          title: 'Logged food',
          description: `${log.foodName} - ${log.calories} cal`,
          timestamp: log.createdAt || new Date(),
          data: log
        })),
        ...workoutSessions.slice(0, limit).map(session => ({
          id: `workout-${session.id}`,
          type: session.isCompleted ? 'workout_completion' : 'workout',
          title: session.isCompleted ? 'Completed workout' : 'Started workout',
          description: `${session.name} - ${session.totalVolume || 0} kg total`,
          timestamp: session.createdAt || new Date(),
          data: session
        }))
      ].sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, limit);
      
      res.json(activities);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Nutrition routes
  app.get("/api/nutrition/summary", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const summary = await getNutritionSummary(userId, date);
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/nutrition/log", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const logData = {
        ...req.body,
        userId: userId,
        date: new Date(req.body.date)
      };
      
      // Include micronutrient data if provided from AI analysis
      if (req.body.micronutrients) {
        logData.micronutrients = req.body.micronutrients;
      }
      
      const log = await storage.createNutritionLog(logData);
      res.json(log);
    } catch (error: any) {
      console.error('Error creating nutrition log:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/nutrition/logs", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      
      const logs = await storage.getNutritionLogs(userId, date);
      res.json(logs);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/nutrition/log/:id", requireAuth, async (req, res) => {
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

  app.put("/api/nutrition/log/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // If quantity or unit is being updated, recalculate macros proportionally
      if (updates.quantity !== undefined || updates.unit !== undefined) {
        // Get current log to calculate proportional changes
        const currentLog = await storage.getNutritionLogById(id);
        if (!currentLog) {
          return res.status(404).json({ message: "Log not found" });
        }
        
        // Calculate multiplier for macro recalculation
        const newQuantity = updates.quantity !== undefined ? parseFloat(updates.quantity) : parseFloat(currentLog.quantity);
        const oldQuantity = parseFloat(currentLog.quantity);
        const multiplier = newQuantity / oldQuantity;
        
        // Recalculate macros proportionally
        const recalculatedMacros = {
          calories: (parseFloat(currentLog.calories) * multiplier).toFixed(2),
          protein: (parseFloat(currentLog.protein) * multiplier).toFixed(2),
          carbs: (parseFloat(currentLog.carbs) * multiplier).toFixed(2),
          fat: (parseFloat(currentLog.fat) * multiplier).toFixed(2)
        };
        
        // Include recalculated macros in updates
        Object.assign(updates, recalculatedMacros);
        
        console.log(`Recalculating macros for log ${id}: ${oldQuantity} → ${newQuantity} (${multiplier.toFixed(2)}x)`);
        console.log('Updated macros:', recalculatedMacros);
      }
      
      const updatedLog = await storage.updateNutritionLog(id, updates);
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Log not found" });
      }

      res.json(updatedLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update meal type for nutrition log (specific endpoint for drag-and-drop)
  app.put("/api/nutrition/logs/:id/meal-type", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { mealType } = req.body;
      
      if (!mealType) {
        return res.status(400).json({ message: "Meal type is required" });
      }
      
      const updatedLog = await storage.updateNutritionLog(id, { mealType });
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Log not found" });
      }

      res.json(updatedLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/nutrition/goal", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  // AI nutrition analysis with image support
  app.post("/api/nutrition/analyze", async (req, res) => {
    try {
      const { 
        description, 
        foodDescription, // Legacy support
        quantity, 
        unit, 
        image,
        portionWeight,
        portionUnit,
        analysisType // New parameter for nutrition_label vs actual_food
      } = req.body;
      
      console.log("AI Analysis request received:", {
        description: description ? "provided" : "missing",
        image: image ? "provided" : "missing",
        portionWeight,
        portionUnit,
        quantity,
        unit
      });
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      // Support both legacy and new parameter names
      const textDescription = description || foodDescription;
      
      if (!textDescription && !image) {
        return res.status(400).json({ message: "Either description or image must be provided" });
      }

      // Import the analyzeNutrition function from services
      const { analyzeNutrition } = await import("./services/openai");
      
      const analysis = await analyzeNutrition(
        textDescription, 
        quantity || 1, 
        unit || "serving",
        image,
        portionWeight ? parseFloat(portionWeight) : undefined,
        portionUnit,
        analysisType || 'nutrition_label' // Default to nutrition label analysis
      );
      
      console.log("AI Analysis successful:", {
        calories: analysis.calories,
        protein: analysis.protein,
        confidence: analysis.confidence
      });
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Nutrition analysis error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Quick add suggestions based on patterns
  app.get("/api/nutrition/quick-add", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  // Get user's food history (unique foods they've logged before)
  app.get("/api/nutrition/history", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Get unique foods from user's nutrition logs (last 90 days for relevance)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const result = await db.execute(sql`
        SELECT 
          food_name,
          quantity,
          unit,
          calories,
          protein,
          carbs,
          fat,
          category,
          meal_suitability,
          COUNT(*) as frequency,
          MAX(date) as last_logged
        FROM nutrition_logs 
        WHERE user_id = ${userId} 
          AND date >= ${ninetyDaysAgo}
          AND food_name IS NOT NULL
        GROUP BY food_name, quantity, unit, calories, protein, carbs, fat, category, meal_suitability
        HAVING COUNT(*) >= 1
        ORDER BY MAX(date) DESC, COUNT(*) DESC
        LIMIT 50
      `);
      
      const foodHistory = result.rows.map((row: any) => ({
        foodName: row.food_name,
        quantity: parseFloat(row.quantity),
        unit: row.unit,
        calories: parseFloat(row.calories),
        protein: parseFloat(row.protein),
        carbs: parseFloat(row.carbs),
        fat: parseFloat(row.fat),
        category: row.category,
        mealSuitability: row.meal_suitability,
        frequency: parseInt(row.frequency),
        lastLogged: row.last_logged
      }));

      res.json(foodHistory);
    } catch (error: any) {
      console.error('Get food history error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Copy meals from another date
  app.post("/api/nutrition/copy-meals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { fromDate, toDate, mealTypes } = req.body;
      
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

  // Get saved meals for user
  app.get("/api/saved-meals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const meals = await storage.getSavedMeals(userId);
      res.json(meals);
    } catch (error: any) {
      console.error('Get saved meals error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Save a meal
  app.post("/api/saved-meals", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { name, description, foodItems } = req.body;
      
      console.log('Save meal request:', { userId, name, foodItems: foodItems?.length });
      
      // Calculate totals from food items with proper numeric conversion
      const totalCalories = foodItems.reduce((sum: number, item: any) => {
        const calories = parseFloat(item.calories) || 0;
        return sum + calories;
      }, 0);
      
      const totalProtein = foodItems.reduce((sum: number, item: any) => {
        const protein = parseFloat(item.protein) || 0;
        return sum + protein;
      }, 0);
      
      const totalCarbs = foodItems.reduce((sum: number, item: any) => {
        const carbs = parseFloat(item.carbs) || 0;
        return sum + carbs;
      }, 0);
      
      const totalFat = foodItems.reduce((sum: number, item: any) => {
        const fat = parseFloat(item.fat) || 0;
        return sum + fat;
      }, 0);
      
      console.log('Calculated totals:', { totalCalories, totalProtein, totalCarbs, totalFat });
      
      const mealData = {
        userId: userId,
        name,
        description: description || null,
        foodItems: foodItems, // Already an array, no need to stringify
        totalCalories: totalCalories.toFixed(2),
        totalProtein: totalProtein.toFixed(2),  
        totalCarbs: totalCarbs.toFixed(2),
        totalFat: totalFat.toFixed(2)
      };
      
      console.log('Final meal data:', mealData);
      
      const savedMeal = await storage.createSavedMeal(mealData);
      res.json(savedMeal);
    } catch (error: any) {
      console.error('Save meal error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete a saved meal
  app.delete("/api/saved-meals/:id", requireAuth, async (req, res) => {
    try {
      const mealId = parseInt(req.params.id);
      await storage.deleteSavedMeal(mealId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete saved meal error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Enhanced Food search with Open Food Facts + USDA FoodData Central integration
  app.get("/api/food/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const category = req.query.category as string; // protein, carb, fat, mixed
      const mealType = req.query.mealType as string; // pre-workout, post-workout, regular, snack
      
      console.log('Enhanced food search:', { query, category, mealType });
      
      if (!query || query.length < 3) {
        return res.json([]);
      }

      // Search both APIs concurrently
      const [openFoodFactsResults, usdaResults] = await Promise.allSettled([
        searchOpenFoodFacts(query),
        searchUSDAFoodData(query)
      ]);

      let allFoods: any[] = [];

      // Process Open Food Facts results
      if (openFoodFactsResults.status === 'fulfilled') {
        allFoods.push(...openFoodFactsResults.value);
      } else {
        console.error('Open Food Facts search failed:', openFoodFactsResults.reason);
      }

      // Process USDA results
      if (usdaResults.status === 'fulfilled') {
        allFoods.push(...usdaResults.value);
      } else {
        console.error('USDA FoodData search failed:', usdaResults.reason);
      }

      // Apply category/meal type filters
      let filteredFoods = allFoods;
      
      if (category) {
        filteredFoods = filteredFoods.filter(food => food.category === category);
      }
      
      if (mealType) {
        filteredFoods = filteredFoods.filter(food => 
          food.mealSuitability && food.mealSuitability.includes(mealType)
        );
      }

      // Sort by relevance and limit results
      const sortedFoods = filteredFoods
        .sort((a, b) => {
          // Prioritize exact matches, then USDA (more accurate), then Open Food Facts
          const aExact = a.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
          const bExact = b.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
          if (aExact !== bExact) return bExact - aExact;
          
          const aUSDA = a.source === 'usda' ? 1 : 0;
          const bUSDA = b.source === 'usda' ? 1 : 0;
          return bUSDA - aUSDA;
        })
        .slice(0, 30);

      console.log(`Returning ${sortedFoods.length} foods from combined search (${openFoodFactsResults.status === 'fulfilled' ? openFoodFactsResults.value.length : 0} OFF + ${usdaResults.status === 'fulfilled' ? usdaResults.value.length : 0} USDA)`);
      res.json(sortedFoods);
    } catch (error: any) {
      console.error('Enhanced food search error:', error);
      res.json([]);
    }
  });

  // Helper function for Open Food Facts search
  async function searchOpenFoodFacts(query: string) {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,nutriments,serving_size,code`;
    
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

    return foods.filter(food => food !== null);
  }

  // Helper function for USDA FoodData Central search
  async function searchUSDAFoodData(query: string) {
    const apiKey = 'ei8k1PRVVKgTotTTOf12HbZEUndz5UUAO8ilo8j5';
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=15&api_key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`USDA FoodData API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform USDA foods to our format
    const foods = data.foods?.map((food: any) => {
      // Extract nutrients from USDA format
      const nutrients = food.foodNutrients || [];
      const energyNutrient = nutrients.find((n: any) => n.nutrientId === 1008 || n.nutrientName?.includes('Energy')); // Energy (kcal)
      const proteinNutrient = nutrients.find((n: any) => n.nutrientId === 1003 || n.nutrientName?.includes('Protein'));
      const carbNutrient = nutrients.find((n: any) => n.nutrientId === 1005 || n.nutrientName?.includes('Carbohydrate'));
      const fatNutrient = nutrients.find((n: any) => n.nutrientId === 1004 || n.nutrientName?.includes('Total lipid'));
      
      const calories = Math.round(energyNutrient?.value || 0);
      const protein = Math.round(proteinNutrient?.value || 0);
      const carbs = Math.round(carbNutrient?.value || 0);
      const fat = Math.round(fatNutrient?.value || 0);
      
      if (calories === 0) return null;
      
      // Apply RP categorization logic
      const foodCategory = categorizeFoodByRP(calories, protein, carbs, fat);
      const suitability = getMealSuitability(foodCategory, protein, carbs, fat);
      
      return {
        id: `usda_${food.fdcId}`,
        name: food.description || 'Unknown Food',
        brand: food.brandOwner || food.brandName,
        calories,
        protein,
        carbs,
        fat,
        serving_size: '100g',
        source: 'usda',
        category: foodCategory,
        mealSuitability: suitability,
        fdcId: food.fdcId
      };
    }) || [];

    return foods.filter((food: any) => food !== null);
  }

  // Enhanced barcode lookup with Open Food Facts integration
  app.get("/api/food/barcode/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      
      console.log('Barcode lookup for:', barcode);
      
      // Search Open Food Facts by barcode
      const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Open Food Facts API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const product = data.product;
      const calories = Math.round(product.nutriments?.['energy-kcal_100g'] || 0);
      const protein = Math.round(product.nutriments?.['proteins_100g'] || 0);
      const carbs = Math.round(product.nutriments?.['carbohydrates_100g'] || 0);
      const fat = Math.round(product.nutriments?.['fat_100g'] || 0);
      
      if (calories === 0) {
        return res.status(404).json({ message: "No nutritional data available" });
      }
      
      // Apply RP categorization logic
      const foodCategory = categorizeFoodByRP(calories, protein, carbs, fat);
      const suitability = getMealSuitability(foodCategory, protein, carbs, fat);
      
      const foodData = {
        id: product.code || barcode,
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
        mealSuitability: suitability,
        images: {
          front: product.image_front_url,
          nutrition: product.image_nutrition_url
        }
      };

      console.log('Barcode lookup successful:', foodData.name);
      res.json(foodData);
    } catch (error: any) {
      console.error('Barcode lookup error:', error);
      res.status(500).json({ message: "Failed to lookup barcode" });
    }
  });

  // RP Diet Coach food recommendations
  app.get("/api/food/recommendations", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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
  app.get("/api/training/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const date = req.query.date as string; // Optional date filter
      const stats = await getTrainingStats(userId, date);
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Direct session creation for testing
  app.post("/api/training/sessions/direct", requireAuth, async (req, res) => {
    try {
      const sessionData = req.body;
      const session = await storage.createWorkoutSession({
        userId: sessionData.userId,
        programId: sessionData.programId || null,
        mesocycleId: null,
        name: sessionData.name,
        date: new Date(sessionData.date),
        isCompleted: sessionData.isCompleted || false,
        totalVolume: sessionData.totalVolume || 0,
        duration: sessionData.duration || 0
      });
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/training/sessions", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const sessions = await storage.getWorkoutSessions(userId, date);
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

  app.post("/api/training/session/complete", requireAuth, async (req, res) => {
    try {
      const sessionData = req.body;
      const userId = req.userId;
      const result = await createWorkoutSession(userId, sessionData.sessionId, sessionData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create new workout session
  app.post("/api/training/sessions", requireAuth, async (req, res) => {
    try {
      const sessionData = req.body;
      const userId = req.userId;
      
      // Create the workout session
      const session = await storage.createWorkoutSession({
        userId: userId,
        programId: null, // No program required for individual sessions
        name: sessionData.name,
        date: new Date(),
        isCompleted: false,
        totalVolume: 0,
        duration: 0
      });

      // Add exercises to session with auto-progression
      for (const exercise of sessionData.exercises) {
        // Get auto-progressed values for new sessions
        const progressedValues = await getAutoProgressedValues(
          exercise.exerciseId, 
          userId, 
          exercise
        );

        await storage.createWorkoutExercise({
          sessionId: session.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: progressedValues.sets,
          targetReps: progressedValues.targetReps,
          weight: progressedValues.weight,
          restPeriod: exercise.restPeriod,
          notes: exercise.notes || "",
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
  app.get("/api/training/session/:sessionId", requireAuth, async (req, res) => {
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
          console.log(`API: Workout exercise ${we.id} setsData:`, we.setsData);
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
            setsData: we.setsData, // Include saved sets data
            specialMethod: we.specialMethod, // Include special training method
            specialConfig: we.specialConfig, // Include special training configuration
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
  app.put("/api/training/sessions/:sessionId/progress", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const progressData = req.body;

      console.log(`API: Saving progress for session ${sessionId}:`, JSON.stringify(progressData, null, 2));

      // Update session with progress data - mark as completed if requested
      const sessionUpdates: any = {
        duration: progressData.duration,
        totalVolume: progressData.totalVolume
      };
      
      if (progressData.isCompleted) {
        sessionUpdates.isCompleted = true;
      }
      
      const updatedSession = await storage.updateWorkoutSession(sessionId, sessionUpdates);

      console.log(`API: Session ${sessionId} updated with progress:`, updatedSession);

      // Update workout exercises with actual performance data
      for (const exerciseData of progressData.exercises) {
        const workoutExercises = await storage.getWorkoutExercises(sessionId);
        const workoutExercise = workoutExercises.find(we => we.exerciseId === exerciseData.exerciseId);
        
        if (workoutExercise && exerciseData.sets.length > 0) {
          const completedSets = exerciseData.sets.filter((set: any) => set.completed);
          
          // Update set count if it has changed dynamically
          const currentSetCount = exerciseData.sets.length;
          const updateData: any = {
            sets: currentSetCount, // Update dynamic set count
            setsData: exerciseData.sets // Store individual set completion states
          };

          // Include special training method data if provided
          if (exerciseData.specialMethod) {
            updateData.specialMethod = exerciseData.specialMethod;
          }
          if (exerciseData.specialConfig) {
            // Transform mini-set reps and dropset weight data for database storage
            let transformedConfig = { ...exerciseData.specialConfig };
            
            // Transform mini-set reps string into array for special methods
            if (exerciseData.specialMethod === 'myorep_match' && exerciseData.specialConfig.miniSetReps) {
              const miniSetRepsStr = exerciseData.specialConfig.miniSetReps;
              if (typeof miniSetRepsStr === 'string' && miniSetRepsStr.includes(',')) {
                const repsArray = miniSetRepsStr.split(',').map((r: string) => parseInt(r.trim())).filter((r: number) => !isNaN(r));
                const totalReps = repsArray.reduce((sum, reps) => sum + reps, 0);
                transformedConfig.miniSetRepsArray = repsArray;
                transformedConfig.totalCalculatedReps = totalReps;
                transformedConfig.miniSetRepsString = miniSetRepsStr; // Keep original for UI display
              }
            }
            
            // Transform dropset data for complex dropset implementation
            if (exerciseData.specialMethod === 'drop_set') {
              if (exerciseData.specialConfig.miniSetReps && typeof exerciseData.specialConfig.miniSetReps === 'string') {
                const miniSetRepsStr = exerciseData.specialConfig.miniSetReps;
                if (miniSetRepsStr.includes(',')) {
                  const repsArray = miniSetRepsStr.split(',').map((r: string) => parseInt(r.trim())).filter((r: number) => !isNaN(r));
                  transformedConfig.miniSetRepsArray = repsArray;
                  transformedConfig.miniSetRepsString = miniSetRepsStr;
                }
              }
              
              if (exerciseData.specialConfig.dropsetWeight && typeof exerciseData.specialConfig.dropsetWeight === 'string') {
                const dropsetWeightStr = exerciseData.specialConfig.dropsetWeight;
                if (dropsetWeightStr.includes(',')) {
                  // Parse weights with units (e.g., "70kg,60kg" or "155lbs,135lbs")
                  const weightArray = dropsetWeightStr.split(',').map((w: string) => {
                    const trimmed = w.trim();
                    const numericValue = parseFloat(trimmed.replace(/[^\d.]/g, ''));
                    const unit = trimmed.replace(/[\d.]/g, '').trim() || 'kg';
                    return { value: numericValue, unit: unit };
                  }).filter((w: any) => !isNaN(w.value));
                  
                  transformedConfig.dropsetWeightArray = weightArray;
                  transformedConfig.dropsetWeightString = dropsetWeightStr;
                }
              }
            }
            
            updateData.specialConfig = transformedConfig;
          }
          
          if (completedSets.length > 0) {
            const avgWeight = completedSets.reduce((sum: number, set: any) => sum + (parseFloat(set.weight) || 0), 0) / completedSets.length;
            const actualReps = completedSets.map((set: any) => set.actualReps).join(',');
            const avgRpe = Math.round(completedSets.reduce((sum: number, set: any) => sum + (parseInt(set.rpe) || 0), 0) / completedSets.length);

            updateData.actualReps = actualReps;
            updateData.weight = parseFloat(avgWeight.toFixed(2)); // Convert to number for decimal field
            updateData.rpe = avgRpe;
            updateData.isCompleted = completedSets.length === exerciseData.sets.length; // Mark exercise complete only if all sets done
          } else {
            // Even if no sets completed, still update the set count
            updateData.isCompleted = false;
          }

          console.log(`API: Updating exercise ${exerciseData.exerciseId} with sets data:`, updateData.setsData);
          console.log(`API: Special method data:`, updateData.specialMethod, updateData.specialConfig);
          await storage.updateWorkoutExercise(workoutExercise.id, updateData);
        }
      }

      res.json(updatedSession);
    } catch (error: any) {
      console.error('Save progress error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Complete workout session
  app.put("/api/training/sessions/:sessionId/complete", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const completionData = req.body;
      
      console.log('Workout completion data:', JSON.stringify(completionData, null, 2));

      // Validate completion data structure
      if (!completionData.exercises || !Array.isArray(completionData.exercises)) {
        return res.status(400).json({ message: "Invalid completion data: exercises array required" });
      }

      // Update session with completion data
      const updatedSession = await storage.updateWorkoutSession(sessionId, {
        isCompleted: true,
        duration: completionData.duration,
        totalVolume: completionData.totalVolume
      });

      // Update workout exercises with actual performance data
      const workoutExercises = await storage.getWorkoutExercises(sessionId);
      console.log('Found workout exercises:', workoutExercises.length);
      
      for (const exerciseData of completionData.exercises) {
        console.log('Processing exercise:', exerciseData.exerciseId, 'sets:', exerciseData.sets?.length);
        
        const workoutExercise = workoutExercises.find(we => we.exerciseId === exerciseData.exerciseId);
        
        if (!workoutExercise) {
          console.log('Workout exercise not found for exerciseId:', exerciseData.exerciseId);
          continue;
        }
        
        if (!exerciseData.sets || !Array.isArray(exerciseData.sets)) {
          console.log('Invalid sets data for exercise:', exerciseData.exerciseId);
          continue;
        }
        
        const completedSets = exerciseData.sets.filter((set: any) => set.completed);
        console.log('Completed sets:', completedSets.length, 'out of', exerciseData.sets.length);
        
        // Update set count for completed workout
        const currentSetCount = exerciseData.sets.length;
        const updateData: any = {
          sets: currentSetCount, // Update dynamic set count
          isCompleted: true
        };
        
        if (completedSets.length > 0) {
          const avgWeight = completedSets.reduce((sum: number, set: any) => sum + (parseFloat(set.weight) || 0), 0) / completedSets.length;
          const actualReps = completedSets.map((set: any) => set.actualReps).join(',');
          const avgRpe = Math.round(completedSets.reduce((sum: number, set: any) => sum + (parseInt(set.rpe) || 0), 0) / completedSets.length);

          updateData.actualReps = actualReps;
          updateData.weight = parseFloat(avgWeight.toFixed(2)); // Convert to number for decimal field
          updateData.rpe = avgRpe;
        } else {
          // No completed sets, mark as incomplete
          updateData.isCompleted = false;
        }

        console.log('Updating workout exercise:', workoutExercise.id, 'with data:', updateData);
        await storage.updateWorkoutExercise(workoutExercise.id, updateData);
      }

      // Auto-record load progression for all completed exercises
      try {
        const session = await storage.getWorkoutSession(sessionId);
        if (session) {
          for (const exerciseData of completionData.exercises) {
            const completedSets = exerciseData.sets?.filter((set: any) => set.completed) || [];
            if (completedSets.length > 0) {
              const avgWeight = completedSets.reduce((sum: number, set: any) => sum + (parseFloat(set.weight) || 0), 0) / completedSets.length;
              const avgRpe = completedSets.reduce((sum: number, set: any) => sum + (parseInt(set.rpe) || 7), 0) / completedSets.length;
              const avgRir = completedSets.reduce((sum: number, set: any) => sum + (parseInt(set.rir) || 2), 0) / completedSets.length;
              
              // Get previous weight for comparison using simplified query
              let previousWeight = 0;
              try {
                const previousPerformance = await db
                  .select({ 
                    weight: workoutExercises.weight,
                    sessionDate: workoutSessions.date 
                  })
                  .from(workoutExercises)
                  .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
                  .where(and(
                    eq(workoutSessions.userId, session.userId),
                    eq(workoutExercises.exerciseId, exerciseData.exerciseId),
                    eq(workoutExercises.isCompleted, true),
                    lt(workoutSessions.date, session.date)
                  ))
                  .orderBy(desc(workoutSessions.date))
                  .limit(1);

                if (previousPerformance.length > 0 && previousPerformance[0].weight) {
                  previousWeight = parseFloat(previousPerformance[0].weight.toString());
                }
              } catch (queryError) {
                console.log('Previous weight query failed, using 0 as default:', queryError);
                previousWeight = 0;
              }
              
              // Record progression data
              await LoadProgression.recordProgression(
                session.userId,
                exerciseData.exerciseId,
                sessionId,
                previousWeight,
                avgWeight,
                avgRpe,
                avgRir,
                avgWeight > previousWeight ? 'weight' : 'volume',
                'Auto-recorded from workout completion'
              );
            }
          }
        }
      } catch (error) {
        console.error('Error recording load progression:', error);
        // Don't fail the workout completion if progression recording fails
      }

      console.log('Workout completion successful for session:', sessionId);
      res.json(updatedSession);
    } catch (error: any) {
      console.error('Workout completion error details:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({ message: error.message });
    }
  });

  // Bulk delete workout sessions (must come before individual delete route)
  app.delete("/api/training/sessions/bulk", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { sessionIds } = req.body;
      
      console.log('Bulk delete request:', { sessionIds, userId });
      
      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        return res.status(400).json({ error: "Session IDs array is required" });
      }

      let deletedCount = 0;
      let failedCount = 0;
      
      // Delete sessions in batch
      for (const sessionId of sessionIds) {
        const numericId = parseInt(sessionId);
        if (isNaN(numericId)) {
          console.error('Invalid session ID:', sessionId);
          failedCount++;
          continue;
        }
        
        console.log('Attempting to delete session:', numericId);
        const success = await storage.deleteWorkoutSession(numericId);
        if (success) {
          deletedCount++;
        } else {
          failedCount++;
        }
      }

      res.json({ 
        success: true, 
        message: `Successfully deleted ${deletedCount} of ${sessionIds.length} workout sessions${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
        deletedCount,
        failedCount 
      });
    } catch (error: any) {
      console.error("Error bulk deleting workout sessions:", error);
      res.status(500).json({ error: "Failed to bulk delete workout sessions" });
    }
  });

  // Delete workout session
  app.delete("/api/training/sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      console.log('Deleting session ID:', sessionId);
      const success = await storage.deleteWorkoutSession(sessionId);
      
      if (!success) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting session:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Update workout session (edit session name and other properties)
  app.put("/api/training/sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const updates = req.body;
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Update session with provided data
      const updatedSession = await storage.updateWorkoutSession(sessionId, updates);
      
      if (!updatedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(updatedSession);
    } catch (error: any) {
      console.error('Error updating session:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Restart workout session (reset progress but keep structure)
  app.post("/api/training/sessions/:sessionId/restart", requireAuth, async (req, res) => {
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
  app.post("/api/training/sessions/:sessionId/duplicate", requireAuth, async (req, res) => {
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

      // Copy all exercises from original session with auto-progression
      const originalExercises = await storage.getWorkoutExercises(sessionId);
      for (const exercise of originalExercises) {
        // Get auto-progressed values based on previous performance
        const progressedValues = await getAutoProgressedValues(
          exercise.exerciseId, 
          originalSession.userId, 
          exercise
        );

        await storage.createWorkoutExercise({
          sessionId: newSession.id,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          sets: progressedValues.sets,
          targetReps: progressedValues.targetReps,
          weight: progressedValues.weight,
          actualReps: null,
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
  app.get("/api/training/volume-landmarks", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const landmarks = await storage.getVolumeLandmarks(userId);
      res.json(landmarks);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update volume landmark
  app.put("/api/training/volume-landmarks/:muscleGroupId", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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
  app.post("/api/training/auto-regulation-feedback", requireAuth, async (req, res) => {
    try {
      console.log('Received feedback data:', JSON.stringify(req.body, null, 2));
      const feedbackData = req.body;
      const feedback = await storage.createAutoRegulationFeedback(feedbackData);
      
      // Update Volume Landmarks using RP methodology based on session feedback
      try {
        await MesocyclePeriodization.updateVolumeLandmarksFromFeedback(
          feedbackData.userId,
          feedbackData.sessionId,
          {
            pumpQuality: feedbackData.pumpQuality,
            muscleSoreness: feedbackData.muscleSoreness,
            perceivedEffort: feedbackData.perceivedEffort,
            energyLevel: feedbackData.energyLevel,
            sleepQuality: feedbackData.sleepQuality
          }
        );
        console.log('Volume landmarks updated using RP methodology');
      } catch (volumeError) {
        console.error('Volume landmarks update error:', volumeError);
        // Continue without landmarks update rather than failing the entire request
      }
      
      // Generate volume recommendations using AI
      let recommendations: any[] = [];
      try {
        recommendations = await generateVolumeRecommendations(feedbackData.userId, feedback);
      } catch (recError) {
        console.error('Volume recommendations error:', recError);
        // Continue without recommendations rather than failing the entire request
      }
      
      res.json({ feedback, recommendations });
    } catch (error: any) {
      console.error('Auto-regulation feedback error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get auto-regulation feedback for session
  app.get("/api/training/auto-regulation-feedback/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const feedback = await storage.getAutoRegulationFeedback(sessionId);
      res.json(feedback);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Developer settings route
  app.put("/api/auth/user/developer-settings", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { showDeveloperFeatures } = req.body;
      
      // Update user's developer settings (this would need to be added to user schema)
      res.json({ message: "Developer settings updated", showDeveloperFeatures });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get fatigue analysis for user
  app.get("/api/training/fatigue-analysis", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const days = parseInt(req.query.days as string) || 14; // Default 14 days
      
      const fatigueAnalysis = await getFatigueAnalysis(userId, days);
      res.json(fatigueAnalysis);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get volume recommendations for user
  app.get("/api/training/volume-recommendations", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const recommendations = await getVolumeRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get weekly volume tracking
  app.get("/api/training/weekly-volume", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  app.post("/api/training/auto-regulation", requireAuth, async (req, res) => {
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

  app.get("/api/training/plan/:day", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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
      
      // Validate exercise name
      if (!exerciseData.name || typeof exerciseData.name !== 'string' || exerciseData.name.trim() === '') {
        return res.status(400).json({ 
          error: "Invalid exercise name",
          message: "Exercise name is required and must be a non-empty string" 
        });
      }
      
      // Trim the name to prevent whitespace issues
      exerciseData.name = exerciseData.name.trim();
      
      const exercise = await storage.createExercise(exerciseData);
      res.json(exercise);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: "Exercise already exists",
          message: error.message 
        });
      }
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
  app.post("/api/weight/log", requireAuth, async (req, res) => {
    try {
      const logData = insertWeightLogSchema.parse(req.body);
      const log = await storage.createWeightLog(logData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/weight/logs", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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
  app.get("/api/meal-plans", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      
      const plans = await storage.getMealPlans(userId, date);
      res.json(plans);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-plans", requireAuth, async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createMealPlan(planData);
      res.json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/meal-plans/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/meal-plans/:id", requireAuth, async (req, res) => {
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
  app.get("/api/weekly-nutrition-goal", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  app.post("/api/weekly-nutrition-goal", requireAuth, async (req, res) => {
    try {
      const goalData = req.body;
      const goal = await storage.createWeeklyNutritionGoal(goalData);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Diet Phases
  app.get("/api/diet-phases", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  app.post("/api/diet-phases", requireAuth, async (req, res) => {
    try {
      const phaseData = req.body;
      const phase = await storage.createDietPhase(phaseData);
      res.json(phase);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Meal Timing Preferences
  app.get("/api/meal-timing", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const preferences = await storage.getMealTimingPreferences(userId);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-timing", requireAuth, async (req, res) => {
    try {
      const preferencesData = req.body;
      const preferences = await storage.createMealTimingPreferences(preferencesData);
      res.json(preferences);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily Wellness Check-in routes (Authentic RP Diet Coach methodology)
  const { DailyWellnessService } = await import("./services/daily-wellness-service");
  
  app.get("/api/daily-wellness-checkins", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { date } = req.query;
      
      if (date) {
        // Get specific date's checkin
        const checkin = await DailyWellnessService.getDailyCheckin(userId, new Date(date as string));
        res.json(checkin);
      } else {
        // Get recent checkins (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const checkins = await DailyWellnessService.getDailyCheckins(userId, startDate, endDate);
        res.json(checkins);
      }
    } catch (error: any) {
      console.error('Error fetching daily wellness checkins:', error);
      res.status(500).json({ error: 'Failed to fetch daily wellness checkins' });
    }
  });

  app.post("/api/daily-wellness-checkins", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { date, energyLevel, hungerLevel, sleepQuality, stressLevel, cravingsIntensity, adherencePerception, notes } = req.body;
      
      const checkin = await DailyWellnessService.upsertDailyCheckin(userId, new Date(date), {
        energyLevel,
        hungerLevel,
        sleepQuality,
        stressLevel,
        cravingsIntensity,
        adherencePerception,
        notes
      });
      
      res.json(checkin);
    } catch (error: any) {
      console.error('Error saving daily wellness checkin:', error);
      res.status(500).json({ error: 'Failed to save daily wellness checkin' });
    }
  });

  // Weekly wellness summary routes
  app.get("/api/weekly-wellness-summary", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { weekStartDate } = req.query;
      
      if (!weekStartDate) {
        return res.status(400).json({ error: 'weekStartDate query parameter is required' });
      }
      
      const summary = await DailyWellnessService.getWeeklySummary(userId, new Date(weekStartDate as string));
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching weekly wellness summary:', error);
      res.status(500).json({ error: 'Failed to fetch weekly wellness summary' });
    }
  });

  app.post("/api/weekly-wellness-summary", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { weekStartDate } = req.body;
      
      const summary = await DailyWellnessService.upsertWeeklySummary(userId, new Date(weekStartDate));
      res.json(summary);
    } catch (error: any) {
      console.error('Error creating weekly wellness summary:', error);
      res.status(500).json({ error: 'Failed to create weekly wellness summary' });
    }
  });

  app.put("/api/meal-timing", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  // Weight Goals API Routes
  // Get user's weight goals
  app.get("/api/weight-goals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const weightGoals = await storage.getWeightGoals(userId);
      res.json(weightGoals);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Create or update weight goal
  app.post("/api/weight-goals", requireAuth, async (req, res) => {
    try {
      const weightGoal = await storage.createWeightGoal(req.body);
      
      // Bidirectional sync: Update diet goal's weekly weight target if it exists
      if (weightGoal && weightGoal.targetWeightChangePerWeek !== undefined) {
        try {
          const existingDietGoal = await storage.getDietGoal(weightGoal.userId);
          if (existingDietGoal) {
            await storage.updateDietGoal(weightGoal.userId, {
              weeklyWeightTarget: weightGoal.targetWeightChangePerWeek
            });
            console.log(`Synced diet goal weekly weight target: ${weightGoal.targetWeightChangePerWeek}kg/week`);
          }
        } catch (syncError) {
          console.error('Failed to sync weight goal to diet goal:', syncError);
          // Don't fail the weight goal creation if sync fails
        }
      }
      
      res.json(weightGoal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update weight goal
  app.put("/api/weight-goals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const weightGoal = await storage.updateWeightGoal(id, req.body);
      if (!weightGoal) {
        return res.status(404).json({ message: "Weight goal not found" });
      }
      
      // Bidirectional sync: Update diet goal's weekly weight target if it exists
      if (weightGoal && req.body.targetWeightChangePerWeek !== undefined) {
        try {
          const existingDietGoal = await storage.getDietGoal(weightGoal.userId);
          if (existingDietGoal) {
            await storage.updateDietGoal(weightGoal.userId, {
              weeklyWeightTarget: req.body.targetWeightChangePerWeek
            });
            console.log(`Synced diet goal weekly weight target: ${req.body.targetWeightChangePerWeek}kg/week`);
          }
        } catch (syncError) {
          console.error('Failed to sync weight goal to diet goal:', syncError);
          // Don't fail the weight goal update if sync fails
        }
      }
      
      res.json(weightGoal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Delete weight goal
  app.delete("/api/weight-goals/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWeightGoal(id);
      res.json({ message: "Weight goal deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });



  // Body Metrics
  app.get("/api/body-metrics", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const metrics = await storage.getBodyMetrics(userId, date);
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/body-metrics", requireAuth, async (req, res) => {
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

  app.delete("/api/body-metrics/:id", requireAuth, async (req, res) => {
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
  app.get("/api/nutrition/progression", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      let startDate = new Date();
      let endDate = new Date();
      
      // Check if date range is provided in query parameters
      if (req.query.start && req.query.end) {
        const startDateStr = req.query.start as string;
        const endDateStr = req.query.end as string;
        
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        // Default to last 90 days if no date range provided
        startDate.setDate(endDate.getDate() - 90);
      }
      
      const progression = await storage.getNutritionProgression(userId, startDate, endDate);
      res.json(progression);
    } catch (error: any) {
      console.error('Get nutrition progression error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Saved Meal Plans - Diet Builder
  app.get("/api/meal-plans/saved", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  app.post("/api/meal-plans/saved", requireAuth, async (req, res) => {
    try {
      const mealPlan = await storage.createSavedMealPlan(req.body);
      res.json(mealPlan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/meal-plans/saved/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/meal-plans/saved/:id", requireAuth, async (req, res) => {
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
  app.get("/api/diet-goals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const goal = await storage.getDietGoal(userId);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/diet-goals", requireAuth, async (req, res) => {
    try {
      const goal = await storage.createDietGoal(req.body);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/diet-goals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      // Clean the request body to ensure proper data types
      const cleanedGoal = { ...req.body };
      
      // Convert string dates to Date objects if needed
      if (cleanedGoal.createdAt && typeof cleanedGoal.createdAt === 'string') {
        cleanedGoal.createdAt = new Date(cleanedGoal.createdAt);
      }
      if (cleanedGoal.updatedAt && typeof cleanedGoal.updatedAt === 'string') {
        cleanedGoal.updatedAt = new Date(cleanedGoal.updatedAt);
      }
      
      const goal = await storage.updateDietGoal(userId, cleanedGoal);
      
      if (!goal) {
        return res.status(404).json({ message: "Diet goal not found" });
      }
      
      // Bidirectional sync: Update active weight goal's target change if weeklyWeightTarget changed
      if (req.body.weeklyWeightTarget !== undefined) {
        try {
          const existingWeightGoals = await storage.getWeightGoals(userId);
          const activeWeightGoal = existingWeightGoals.find((wg: any) => wg.isActive);
          
          if (activeWeightGoal) {
            await storage.updateWeightGoal(activeWeightGoal.id, {
              targetWeightChangePerWeek: req.body.weeklyWeightTarget
            });
            console.log(`Synced weight goal target change: ${req.body.weeklyWeightTarget}kg/week`);
          }
        } catch (syncError) {
          console.error('Failed to sync diet goal to weight goal:', syncError);
          // Don't fail the diet goal update if sync fails
        }
      }
      
      res.json(goal);
    } catch (error: any) {
      console.error('Diet goal update error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Advanced Macro Management API endpoints
  const { AdvancedMacroManagementService } = await import("./services/advanced-macro-management");

  // Weekly macro adjustment endpoint with enhanced wellness integration
  app.post("/api/weekly-adjustment", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { weekStartDate } = req.body;
      
      console.log('Weekly adjustment request:', { userId, weekStartDate });
      
      // Calculate the adjustment based on RP methodology with real wellness data
      const adjustment = await AdvancedMacroManagementService.calculateWeeklyAdjustment(userId, weekStartDate);
      
      console.log('Calculated adjustment with wellness data:', {
        adherence: adjustment.adherencePercentage,
        wellnessFactors: adjustment.adjustment.wellnessFactors,
        reason: adjustment.adjustment.adjustmentReason
      });
      
      // Create weekly goal entry with authentic wellness data
      const weeklyGoal = await AdvancedMacroManagementService.createWeeklyGoal({
        userId,
        weekStartDate,
        dailyCalories: adjustment.adjustment.newCalories,
        protein: adjustment.adjustment.newProtein,
        carbs: adjustment.adjustment.newCarbs,
        fat: adjustment.adjustment.newFat,
        adjustmentReason: adjustment.adjustment.adjustmentReason,
        adjustmentRecommendation: adjustment.adjustment.adjustmentRecommendation, // Add the recommendation
        adherencePercentage: adjustment.adherencePercentage,
        wellnessFactors: adjustment.adjustment.wellnessFactors, // Real daily wellness averages
        energyLevels: adjustment.adjustment.wellnessFactors?.energyLevel || 5,
        hungerLevels: adjustment.adjustment.wellnessFactors?.hungerLevel || 5,
        adjustmentPercentage: adjustment.adjustment.adjustmentPercentage
      });

      // Always update current diet goals with the new adjustments
      try {
        // Update both suggested and custom calories to ensure consistency
        const updatedDietGoals = await storage.updateDietGoal(userId, {
          targetCalories: adjustment.adjustment.newCalories.toString(),
          customTargetCalories: adjustment.adjustment.newCalories.toString(),
          targetProtein: adjustment.adjustment.newProtein.toString(),
          targetCarbs: adjustment.adjustment.newCarbs.toString(),
          targetFat: adjustment.adjustment.newFat.toString()
        });

        console.log('Successfully updated diet goals:', {
          newCalories: adjustment.adjustment.newCalories,
          newProtein: adjustment.adjustment.newProtein,
          newCarbs: adjustment.adjustment.newCarbs,
          newFat: adjustment.adjustment.newFat
        });

        console.log('Updated diet goals result:', updatedDietGoals ? 'SUCCESS' : 'NULL');
        
        if (updatedDietGoals) {
          const successResponse = {
            weeklyGoal,
            adjustment: adjustment.adjustment,
            appliedToCurrentGoals: true,
            updatedDietGoals,
            message: `Weekly adjustment applied successfully. Your calorie target increased to ${Math.round(adjustment.adjustment.newCalories)} calories.`
          };
          console.log('Sending success response:', successResponse);
          res.json(successResponse);
        } else {
          const errorResponse = {
            weeklyGoal,
            adjustment: adjustment.adjustment,
            appliedToCurrentGoals: false,
            error: "Diet goal update returned null",
            message: "Weekly analysis recorded. Failed to update diet goals - please check your Diet Goals section manually."
          };
          console.log('Sending error response:', errorResponse);
          res.json(errorResponse);
        }
      } catch (updateError) {
        console.error('Failed to update diet goals:', updateError);
        res.json({
          weeklyGoal,
          adjustment: adjustment.adjustment,
          appliedToCurrentGoals: false,
          error: "Adjustment calculated but failed to update diet goals",
          message: "Weekly analysis recorded. Failed to update diet goals - please check your Diet Goals section manually."
        });
      }
    } catch (error: any) {
      console.error('Weekly adjustment error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get weekly goals
  app.get("/api/weekly-goals", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const weekStartDate = req.query.weekStartDate as string;
      
      const weeklyGoals = await AdvancedMacroManagementService.getWeeklyGoals(userId, weekStartDate);
      res.json(weeklyGoals);
    } catch (error: any) {
      console.error('Get weekly goals error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Meal Distribution API endpoints
  app.get("/api/meal-distribution", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const distributions = await AdvancedMacroManagementService.getMealDistributions(userId);
      res.json(distributions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/meal-distribution", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const distribution = await AdvancedMacroManagementService.createMealDistribution({
        ...req.body,
        userId
      });
      res.json(distribution);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Macro Flexibility API endpoints
  app.get("/api/flexibility-rules", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const rules = await AdvancedMacroManagementService.getFlexibilityRules(userId);
      res.json(rules);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/flexibility-rules", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const rule = await AdvancedMacroManagementService.createFlexibilityRule({
        ...req.body,
        userId
      });
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Shopping List Generation API endpoints
  const { ShoppingListGenerator } = await import("./services/shopping-list-generator");

  app.get("/api/shopping-list", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const startDate = req.query.startDate as string || new Date().toISOString();
      const endDate = req.query.endDate as string || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const shoppingList = await ShoppingListGenerator.generateFromMealPlans(userId, startDate, endDate);
      res.json(shoppingList);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shopping-list/optimized", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const dietGoals = await storage.getDietGoal(userId);
      
      if (!dietGoals) {
        return res.status(404).json({ message: "Diet goals not found. Please set up your nutrition targets first." });
      }
      
      const optimizedList = await ShoppingListGenerator.generateOptimizedList(userId, dietGoals);
      res.json(optimizedList);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bulk copy nutrition logs
  app.post("/api/nutrition/bulk-copy", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { logIds, targetDate } = req.body;
      
      // Get the original logs
      const originalLogs = await db.select()
        .from(nutritionLogs)
        .where(and(
          eq(nutritionLogs.userId, userId),
          inArray(nutritionLogs.id, logIds)
        ));

      // Create new logs for the target date
      const newLogs = originalLogs.map(log => ({
        userId: log.userId,
        date: new Date(targetDate),
        foodName: log.foodName,
        quantity: log.quantity,
        unit: log.unit,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        mealType: log.mealType,
        mealOrder: log.mealOrder,
        scheduledTime: log.scheduledTime,
        category: log.category,
        mealSuitability: log.mealSuitability
      }));

      const results = await db.insert(nutritionLogs).values(newLogs).returning();
      
      res.json({ 
        success: true, 
        copiedCount: results.length,
        targetDate 
      });
    } catch (error: any) {
      console.error('Bulk copy error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Log meal plan to nutrition logs
  app.post("/api/nutrition/log-meal-plan", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { planId, targetDate, mealType } = req.body;
      
      // Get the saved meal plan
      const mealPlan = await storage.getSavedMealPlan(userId, planId);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }

      // Create nutrition log entries for each food in the meal plan
      const foods = Array.isArray(mealPlan.foods) ? mealPlan.foods : [];
      const logEntries = foods.map((food: any) => ({
        userId,
        date: new Date(targetDate || new Date()),
        foodName: food.name,
        quantity: food.quantity || 1,
        unit: food.serving_size || 'serving',
        calories: (food.calories * (food.quantity || 1)).toString(),
        protein: (food.protein * (food.quantity || 1)).toString(),
        carbs: (food.carbs * (food.quantity || 1)).toString(),
        fat: (food.fat * (food.quantity || 1)).toString(),
        mealType: mealType || mealPlan.mealType,
        mealOrder: 1,
        category: 'logged_from_plan',
        mealSuitability: ['regular']
      }));

      const results = await db.insert(nutritionLogs).values(logEntries).returning();
      
      res.json({ 
        success: true, 
        loggedCount: results.length,
        mealPlan: mealPlan.name
      });
    } catch (error: any) {
      console.error('Log meal plan error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get available weeks with food log data
  app.get("/api/nutrition/available-weeks", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
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
  app.get("/api/training/mesocycles", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      const userMesocycles = await storage.getUserMesocycles(userId);
      
      res.json(userMesocycles);
    } catch (error) {
      console.error("Error fetching mesocycles:", error);
      res.status(500).json({ error: "Failed to fetch mesocycles" });
    }
  });

  app.post("/api/training/mesocycles", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { name, templateId, totalWeeks, customProgram } = req.body;
      
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
  app.put("/api/training/mesocycles/:id", requireAuth, async (req, res) => {
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
  app.delete("/api/training/mesocycles/:id", requireAuth, async (req, res) => {
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
  app.get("/api/training/mesocycles/:id/program", requireAuth, async (req, res) => {
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
  app.post("/api/training/mesocycles/:id/advance-week", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.id);
      
      const result = await MesocyclePeriodization.advanceWeek(mesocycleId);
      
      res.json(result);
    } catch (error) {
      console.error("Error advancing mesocycle week:", error);
      res.status(500).json({ error: "Failed to advance week" });
    }
  });

  app.get("/api/training/mesocycle-recommendations", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      const recommendations = await MesocyclePeriodization.generateMesocycleRecommendations(userId);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating mesocycle recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Training templates
  app.get("/api/training/templates", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { category } = req.query;
      
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

  app.post("/api/training/templates", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { name, description, category, daysPerWeek, templateData } = req.body;
      
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

  app.put("/api/training/templates/:templateId", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const updateData = req.body;
      
      const updatedTemplate = await TemplateEngine.updateTemplate(templateId, updateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ error: "Template not found or unauthorized" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/training/templates/:templateId", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      
      const success = await TemplateEngine.deleteTemplate(templateId, 0);
      
      if (!success) {
        return res.status(404).json({ error: "Template not found or unauthorized" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  app.post("/api/training/templates/generate-program", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { templateId, mesocycleId, startDate } = req.body;
      
      if (!userId || !templateId) {
        return res.status(400).json({ error: "userId and templateId are required" });
      }

      const program = await TemplateEngine.generateFullProgramFromTemplate(
        userId, 
        templateId, 
        mesocycleId, 
        startDate ? new Date(startDate) : undefined
      );
      
      res.json({ 
        ...program,
        message: `Full training program created: ${program.totalWorkouts} workout sessions added to your dashboard` 
      });
    } catch (error) {
      console.error("Error generating program from template:", error);
      res.status(500).json({ error: "Failed to generate program from template" });
    }
  });

  app.post("/api/training/templates/generate-workout", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { templateId, workoutDay } = req.body;
      
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

  app.get("/api/training/templates/:templateId/customize", requireAuth, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      const userId = req.userId;
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
  app.get("/api/training/load-progression", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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

  app.post("/api/training/load-progression", requireAuth, async (req, res) => {
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

  // Get exercise recommendations for specific session (for workout execution recommendations)
  app.get("/api/training/exercise-recommendations/:sessionId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Get session details with exercises
      const session = await db
        .select({
          id: workoutSessions.id,
          userId: workoutSessions.userId,
          mesocycleId: workoutSessions.mesocycleId,
          date: workoutSessions.date,
          name: workoutSessions.name
        })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, sessionId))
        .then(rows => rows[0]);
        
      if (!session || !session.mesocycleId) {
        return res.json([]);
      }

      // Get exercises for this session with full exercise library data
      const sessionExercises = await db
        .select({
          id: workoutExercises.id,
          exerciseId: workoutExercises.exerciseId,
          orderIndex: workoutExercises.orderIndex,
          sets: workoutExercises.sets,
          targetReps: workoutExercises.targetReps,
          weight: workoutExercises.weight,
          actualReps: workoutExercises.actualReps,
          rpe: workoutExercises.rpe,
          rir: workoutExercises.rir,
          // Exercise library data
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
          movementPattern: exercises.movementPattern,
          primaryMuscle: exercises.primaryMuscle,
          muscleGroups: exercises.muscleGroups,
          equipment: exercises.equipment,
          difficulty: exercises.difficulty,
          instructions: exercises.instructions,
          translations: exercises.translations
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(eq(workoutExercises.sessionId, sessionId))
        .orderBy(workoutExercises.orderIndex);

      if (sessionExercises.length === 0) {
        return res.json([]);
      }
      
      // Get mesocycle details to determine current week
      const mesocycle = await storage.getMesocycle(session.mesocycleId);
      if (!mesocycle) {
        return res.json([]);
      }
      
      // Get exercise recommendations for each exercise in the session with set-specific recommendations
      const recommendations = await Promise.all(
        sessionExercises.map(async (exercise) => {
          try {
            // Get recent performance data for this exercise
            const recentPerformance = await db
              .select({
                weight: workoutExercises.weight,
                reps: workoutExercises.actualReps,
                rpe: workoutExercises.rpe,
                rir: workoutExercises.rir,
                date: workoutSessions.date,
                setsData: workoutExercises.setsData
              })
              .from(workoutExercises)
              .innerJoin(workoutSessions, eq(workoutExercises.sessionId, workoutSessions.id))
              .where(and(
                eq(workoutSessions.userId, session.userId),
                eq(workoutExercises.exerciseId, exercise.exerciseId),
                eq(workoutExercises.isCompleted, true),
                lt(workoutSessions.date, session.date)
              ))
              .orderBy(desc(workoutSessions.date))
              .limit(3);
            
            // Parse target reps range
            let minReps = 5, maxReps = 10;
            if (exercise.targetReps.includes('-')) {
              const [min, max] = exercise.targetReps.split('-').map(Number);
              minReps = min || 5;
              maxReps = max || 10;
            } else if (exercise.targetReps.includes(',')) {
              const repsArray = exercise.targetReps.split(',').map(Number);
              minReps = Math.min(...repsArray);
              maxReps = Math.max(...repsArray);
            } else {
              const targetNum = parseInt(exercise.targetReps) || 8;
              minReps = Math.max(1, targetNum - 2);
              maxReps = targetNum + 2;
            }
            
            if (recentPerformance.length === 0) {
              // No previous data, generate progressive set recommendations
              const baseWeight = parseFloat(exercise.weight) || 10;
              const totalSets = parseInt(exercise.sets?.toString() || '3');
              
              const setRecommendations = Array.from({ length: totalSets }, (_, index) => {
                const setNumber = index + 1;
                
                // Progressive intensity across sets
                let setWeight = baseWeight;
                let setReps = minReps;
                let setRpe = 7;
                
                if (totalSets >= 3) {
                  // Multi-set progression pattern
                  if (setNumber === 1) {
                    // Warmup set - lighter weight, higher reps
                    setWeight = baseWeight * 0.85;
                    setReps = Math.min(maxReps, minReps + 2);
                    setRpe = 6;
                  } else if (setNumber === totalSets) {
                    // Final set - work towards failure
                    setWeight = baseWeight * 1.05;
                    setReps = minReps;
                    setRpe = 8.5;
                  } else {
                    // Middle sets - progressive loading
                    const progressFactor = (setNumber - 1) / (totalSets - 1);
                    setWeight = baseWeight * (0.95 + progressFactor * 0.1);
                    setReps = Math.round(maxReps - progressFactor * (maxReps - minReps));
                    setRpe = 7 + progressFactor * 1.5;
                  }
                }
                
                return {
                  setNumber,
                  recommendedWeight: Math.round(setWeight * 4) / 4,
                  recommendedReps: setReps,
                  recommendedRpe: Math.round(setRpe * 2) / 2 // Round to 0.5
                };
              });
              
              return {
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: setRecommendations,
                week: mesocycle.currentWeek,
                reasoning: `Week ${mesocycle.currentWeek} starting point - progressive set structure for ${totalSets} sets`,
                movementPattern: exercise.movementPattern,
                primaryMuscle: exercise.primaryMuscle,
                difficulty: exercise.difficulty
              };
            }
            
            // Calculate averages from recent performance
            const avgWeight = recentPerformance.reduce((sum, p) => sum + parseFloat(p.weight || '0'), 0) / recentPerformance.length;
            const avgRpe = recentPerformance.reduce((sum, p) => sum + (p.rpe || 7), 0) / recentPerformance.length;
            const avgRir = recentPerformance.reduce((sum, p) => sum + (p.rir || 2), 0) / recentPerformance.length;
            
            // Week-based progression adjustments
            const weekMultiplier = 1 + (mesocycle.currentWeek - 1) * 0.025; // 2.5% increase per week
            
            // Determine base progression
            let baseWeight = avgWeight;
            let baseRpe = 7;
            let reasoning = '';
            
            // Track if this is a deload scenario for different set progression pattern
            let isDeload = false;
            
            // RPE-based adjustments
            if (avgRpe >= 8 && avgRpe <= 8.5 && avgRir >= 1 && avgRir <= 2) {
              // Perfect progression zone
              const weightIncrement = exercise.movementPattern === 'compound' ? 2.5 : 1.25;
              baseWeight = avgWeight + (weightIncrement * weekMultiplier);
              baseRpe = 8;
              reasoning = `Week ${mesocycle.currentWeek} progression - perfect RPE/RIR zone, progressive weight increase`;
            } else if (avgRpe < 7 || avgRir > 3) {
              // Too easy - larger increase
              const weightIncrement = exercise.movementPattern === 'compound' ? 5 : 2.5;
              baseWeight = avgWeight + (weightIncrement * weekMultiplier);
              baseRpe = 8;
              reasoning = `Week ${mesocycle.currentWeek} progression - previous load too light, significant progressive increase`;
            } else if (avgRpe > 9 || avgRir < 1) {
              // Too hard - maintain or slight decrease
              baseWeight = avgWeight * 0.95; // 5% reduction for more effective deload
              baseRpe = 7;
              isDeload = true;
              reasoning = `Week ${mesocycle.currentWeek} deload - previous RPE ${avgRpe.toFixed(1)} too high, reducing weight for recovery`;
            } else {
              // Moderate progression (RPE 7-8, RIR 2-3)
              const weightIncrement = exercise.movementPattern === 'compound' ? 1.25 : 0.625;
              baseWeight = avgWeight + (weightIncrement * weekMultiplier);
              baseRpe = Math.ceil(avgRpe);
              reasoning = `Week ${mesocycle.currentWeek} progression - moderate progressive increase`;
            }
            
            // Generate set-specific recommendations with progression
            const totalSets = parseInt(exercise.sets?.toString() || '3');
            const setRecommendations = Array.from({ length: totalSets }, (_, index) => {
              const setNumber = index + 1;
              
              // Progressive intensity across sets
              let setWeight = baseWeight;
              let setReps = minReps;
              let setRpe = baseRpe;
              
              if (isDeload) {
                // Deload pattern - minimal variation, focus on technique
                if (setNumber === 1) {
                  setWeight = baseWeight * 0.975; // Very light reduction for technique
                  setReps = Math.min(maxReps, minReps + 2); // Higher reps for form
                  setRpe = Math.max(6, baseRpe - 1);
                } else if (setNumber === totalSets) {
                  setWeight = baseWeight; // Use base deloaded weight
                  setReps = minReps;
                  setRpe = baseRpe;
                } else {
                  // Middle sets - consistent deloaded weight
                  setWeight = baseWeight * 0.99;
                  setReps = Math.round((minReps + maxReps) / 2);
                  setRpe = baseRpe;
                }
              } else if (totalSets >= 3) {
                // Multi-set progression pattern
                if (setNumber === 1) {
                  // First set - use base progressed weight for main work
                  setWeight = baseWeight;
                  setReps = Math.min(maxReps, minReps + 1);
                  setRpe = Math.max(6, baseRpe - 1);
                } else if (setNumber === totalSets) {
                  // Final set - push intensity
                  setWeight = baseWeight * 1.025;
                  setReps = minReps;
                  setRpe = Math.min(9, baseRpe + 0.5);
                } else {
                  // Middle sets - progressive loading
                  const progressFactor = (setNumber - 1) / (totalSets - 1);
                  setWeight = baseWeight * (0.95 + progressFactor * 0.075);
                  setReps = Math.round(maxReps - progressFactor * (maxReps - minReps) * 0.6);
                  setRpe = baseRpe + progressFactor * 0.5;
                }
              } else if (totalSets === 2) {
                // Two-set progression
                if (setNumber === 1) {
                  setWeight = baseWeight * (isDeload ? 0.975 : 0.95);
                  setReps = Math.min(maxReps, minReps + 1);
                  setRpe = baseRpe - 0.5;
                } else {
                  setWeight = baseWeight * (isDeload ? 1 : 1.025);
                  setReps = minReps;
                  setRpe = baseRpe + (isDeload ? 0 : 0.5);
                }
              }
              
              return {
                setNumber,
                recommendedWeight: Math.round(setWeight * 4) / 4, // Round to nearest 0.25kg
                recommendedReps: Math.max(1, setReps),
                recommendedRpe: Math.max(6, Math.min(9.5, Math.round(setRpe * 2) / 2)) // Round to 0.5, clamp 6-9.5
              };
            });
            
            return {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              sets: setRecommendations,
              week: mesocycle.currentWeek,
              reasoning: reasoning,
              movementPattern: exercise.movementPattern,
              primaryMuscle: exercise.primaryMuscle,
              difficulty: exercise.difficulty
            };
            
          } catch (error) {
            console.error(`Error calculating recommendations for exercise ${exercise.exerciseId}:`, error);
            // Return a basic set-specific recommendation structure for errors
            const totalSets = parseInt(exercise.sets?.toString() || '3');
            const fallbackSets = Array.from({ length: totalSets }, (_, index) => ({
              setNumber: index + 1,
              recommendedWeight: parseFloat(exercise.weight || '0') || 10,
              recommendedReps: 8,
              recommendedRpe: 7
            }));
            
            return {
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              sets: fallbackSets,
              week: mesocycle.currentWeek,
              reasoning: `Week ${mesocycle.currentWeek} - using fallback values (calculation error)`,
              movementPattern: exercise.movementPattern,
              primaryMuscle: exercise.primaryMuscle,
              difficulty: exercise.difficulty
            };
          }
        })
      );
      
      res.json(recommendations);
    } catch (error: any) {
      console.error('Exercise recommendations error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/training/performance-analysis", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
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
  app.post("/api/training/init-templates", requireAuth, async (req, res) => {
    try {
      await TemplateEngine.initializeSystemTemplates();
      res.json({ message: "System templates initialized successfully" });
    } catch (error) {
      console.error("Error initializing templates:", error);
      res.status(500).json({ error: "Failed to initialize templates" });
    }
  });

  // Analytics and Reporting Routes
  
  // Get nutrition analytics for a time period
  app.get("/api/analytics/nutrition", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await AnalyticsService.getNutritionAnalytics(userId, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching nutrition analytics:", error);
      res.status(500).json({ error: "Failed to fetch nutrition analytics" });
    }
  });

  // Get training analytics for a time period
  app.get("/api/analytics/training", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await AnalyticsService.getTrainingAnalytics(userId, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching training analytics:", error);
      res.status(500).json({ error: "Failed to fetch training analytics" });
    }
  });

  // Get body progress analytics for a time period
  app.get("/api/analytics/body-progress", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await AnalyticsService.getBodyProgressAnalytics(userId, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching body progress analytics:", error);
      res.status(500).json({ error: "Failed to fetch body progress analytics" });
    }
  });

  // Get auto-regulation feedback analytics for a time period
  app.get("/api/analytics/feedback", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await AnalyticsService.getFeedbackAnalytics(userId, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching feedback analytics:", error);
      res.status(500).json({ error: "Failed to fetch feedback analytics" });
    }
  });

  // Get comprehensive analytics summary
  app.get("/api/analytics/comprehensive", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const days = parseInt(req.query.days as string) || 30;
      
      const analytics = await AnalyticsService.getComprehensiveAnalytics(userId, days);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching comprehensive analytics:", error);
      res.status(500).json({ error: "Failed to fetch comprehensive analytics" });
    }
  });

  // Time synchronization endpoint
  app.get("/api/time/info", async (req, res) => {
    try {
      const { TimeSyncService } = await import("./utils/time-sync");
      const timeInfo = TimeSyncService.getTimeInfo();
      const currentTime = await TimeSyncService.getCurrentTime();
      
      res.json({
        serverTime: timeInfo.serverTime.toISOString(),
        realTime: timeInfo.realTime?.toISOString() || null,
        currentSyncedTime: currentTime.toISOString(),
        offsetMs: timeInfo.offsetMs,
        lastSync: timeInfo.lastSync?.toISOString() || null,
        isSynced: !!timeInfo.realTime
      });
    } catch (error) {
      console.error("Error getting time info:", error);
      res.status(500).json({ error: "Failed to get time information" });
    }
  });

  // Session Customization API Routes
  const { SessionCustomization } = await import("./services/session-customization");
  const { MesocycleSessionGenerator } = await import("./services/mesocycle-session-generator");
  const { UnifiedMesocycleTemplate } = await import("./services/unified-mesocycle-template");

  // Add exercise to existing session
  app.post("/api/training/sessions/:sessionId/exercises", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { exerciseId, insertPosition } = req.body;
      
      const newExercise = await SessionCustomization.addExerciseToSession(
        sessionId, 
        exerciseId, 
        insertPosition
      );
      
      res.json({ 
        success: true, 
        exercise: newExercise,
        message: "Exercise added to session and future weeks"
      });
    } catch (error: any) {
      console.error("Error adding exercise to session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove exercise from session
  app.delete("/api/training/sessions/:sessionId/exercises/:exerciseId", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const exerciseId = parseInt(req.params.exerciseId);
      
      await SessionCustomization.removeExerciseFromSession(sessionId, exerciseId);
      
      res.json({ 
        success: true,
        message: "Exercise removed from session and future weeks"
      });
    } catch (error: any) {
      console.error("Error removing exercise from session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Substitute exercise in session
  app.put("/api/training/sessions/:sessionId/exercises/:exerciseId/substitute", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const oldExerciseId = parseInt(req.params.exerciseId);
      const { newExerciseId } = req.body;
      
      await SessionCustomization.substituteExercise(
        sessionId, 
        oldExerciseId, 
        newExerciseId
      );
      
      res.json({ 
        success: true,
        message: "Exercise substituted in session and future weeks"
      });
    } catch (error: any) {
      console.error("Error substituting exercise:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Reorder exercises in session
  app.put("/api/training/sessions/:sessionId/exercises/reorder", requireAuth, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { exercises } = req.body; // Array of { exerciseId, orderIndex }
      
      // Update each exercise's order index in the session
      for (const exerciseUpdate of exercises) {
        await db
          .update(workoutExercises)
          .set({ orderIndex: exerciseUpdate.orderIndex })
          .where(and(
            eq(workoutExercises.sessionId, sessionId),
            eq(workoutExercises.exerciseId, exerciseUpdate.exerciseId)
          ));
      }
      
      res.json({ 
        success: true,
        message: "Exercise order updated successfully"
      });
    } catch (error: any) {
      console.error("Error reordering exercises:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create additional session in mesocycle
  app.post("/api/training/mesocycles/:mesocycleId/sessions", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.mesocycleId);
      const { sessionName, targetDate, exerciseIds } = req.body;
      
      const newSession = await MesocycleSessionGenerator.createAdditionalSession(
        mesocycleId,
        sessionName,
        new Date(targetDate),
        exerciseIds
      );
      
      res.json({ 
        success: true, 
        session: newSession,
        message: "Additional session created in mesocycle"
      });
    } catch (error: any) {
      console.error("Error creating additional session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create specialized extra training day
  app.post("/api/training/mesocycles/:mesocycleId/extra-day", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.mesocycleId);
      const { sessionType, targetDate, customName } = req.body;
      
      const newSession = await MesocycleSessionGenerator.createExtraTrainingDay(
        mesocycleId,
        sessionType,
        new Date(targetDate),
        customName
      );
      
      res.json({ 
        success: true, 
        session: newSession,
        message: `${sessionType} session created successfully`
      });
    } catch (error: any) {
      console.error("Error creating extra training day:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Unified Template-Mesocycle Integration Routes
  app.post("/api/training/mesocycles/from-template", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { templateId, startDate, totalWeeks } = req.body;
      
      const result = await UnifiedMesocycleTemplate.createMesocycleFromTemplate(
        userId,
        templateId,
        new Date(startDate),
        totalWeeks || 6
      );
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating mesocycle from template:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/training/mesocycles/:mesocycleId/validate", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.mesocycleId);
      
      const validation = await UnifiedMesocycleTemplate.validateIntegration(mesocycleId);
      
      res.json(validation);
    } catch (error: any) {
      console.error("Error validating mesocycle integration:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/mesocycles/:mesocycleId/fix-orphaned", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.mesocycleId);
      const userId = req.userId;
      
      await UnifiedMesocycleTemplate.fixOrphanedSessions(userId, mesocycleId);
      await UnifiedMesocycleTemplate.reactivateMesocycle(mesocycleId);
      
      const validation = await UnifiedMesocycleTemplate.validateIntegration(mesocycleId);
      
      res.json({ 
        success: true,
        message: "Orphaned sessions fixed and mesocycle reactivated",
        validation
      });
    } catch (error: any) {
      console.error("Error fixing orphaned sessions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/mesocycles/:mesocycleId/repair-data", requireAuth, async (req, res) => {
    try {
      const mesocycleId = parseInt(req.params.mesocycleId);
      const userId = req.userId;
      
      const repair = await UnifiedMesocycleTemplate.repairExistingData(userId, mesocycleId);
      
      res.json(repair);
    } catch (error: any) {
      console.error("Error repairing data:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/training/demonstrate-workflow", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      
      const demo = await UnifiedMesocycleTemplate.demonstrateProperWorkflow(userId);
      
      res.json(demo);
    } catch (error: any) {
      console.error("Error demonstrating workflow:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Template validation and cleanup endpoint
  app.post("/api/training/templates/validate-and-cleanup", requireAuth, async (req, res) => {
    try {
      console.log('Starting template validation and cleanup...');
      
      const result = await validateAndCleanupTemplates();
      
      let message = `Template validation complete. Deleted ${result.deletedTemplates} invalid templates.`;
      if (result.skippedTemplates > 0) {
        message += ` Skipped ${result.skippedTemplates} templates (referenced by active mesocycles).`;
      }
      
      res.json({
        success: true,
        message,
        ...result
      });
    } catch (error: any) {
      console.error("Error validating templates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}