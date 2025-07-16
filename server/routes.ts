import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeExercises } from "./data/exercises";
import { searchFoodDatabase, getFoodByBarcode } from "./data/foods";
import { getNutritionSummary, logFood, generateNutritionGoal, searchFood } from "./services/nutrition";
import { getTrainingStats, processAutoRegulation, createWorkoutSession, getWorkoutPlan } from "./services/training";
import { insertUserSchema, insertUserProfileSchema, insertNutritionLogSchema, insertAutoRegulationFeedbackSchema, insertWeightLogSchema } from "@shared/schema";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data
  await initializeExercises();

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

  // Food search routes
  app.get("/api/food/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const language = (req.query.lang as string) || "en";
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      // Search in local database
      const localResults = searchFoodDatabase(query, language);
      
      // Search using AI service
      const aiResults = await searchFood(query);
      
      const results = [...localResults, ...aiResults];
      res.json(results);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

  app.post("/api/training/feedback", async (req, res) => {
    try {
      const feedbackData = insertAutoRegulationFeedbackSchema.parse(req.body);
      const result = await storage.createAutoRegulationFeedback(feedbackData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/training/session", async (req, res) => {
    try {
      const sessionData = req.body;
      const session = await storage.createWorkoutSession(sessionData);
      res.json(session);
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

  const httpServer = createServer(app);
  return httpServer;
}