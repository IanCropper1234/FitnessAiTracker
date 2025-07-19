import { storage } from "../storage";
import { enhancedExercises } from "./enhanced-exercises";

export async function initializeExercises() {
  console.log('Checking existing exercises before initialization...');
  
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Exercise initialization timeout')), 10000)
    );
    
    const exercisePromise = storage.getExercises();
    const existingExercises = await Promise.race([exercisePromise, timeoutPromise]);
    
    console.log(`Found ${existingExercises.length} existing exercises in database.`);
    
    if (existingExercises.length > 0) {
      console.log(`Exercises already initialized, skipping.`);
      return;
    }
    
    console.log('No existing exercises found. Initializing exercise database...');
    
    // Initialize exercises in storage using enhanced exercise data
    for (const exercise of enhancedExercises) {
      // Double-check for duplicate names before creating
      const existingExercise = await storage.getExerciseByName(exercise.name);
      if (!existingExercise) {
        await storage.createExercise(exercise);
      }
    }
    
    console.log(`Successfully initialized ${enhancedExercises.length} exercises.`);
  } catch (error) {
    console.error('Error during exercise initialization:', error);
    console.log('Continuing with server startup despite exercise initialization failure...');
    // Don't throw the error to prevent server startup failure
  }
}