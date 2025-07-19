import { storage } from "../storage";
import { enhancedExercises } from "./enhanced-exercises";

export async function initializeExercises() {
  console.log('Checking existing exercises before initialization...');
  
  // Check if exercises already exist to prevent duplicates
  const existingExercises = await storage.getExercises();
  if (existingExercises.length > 0) {
    console.log(`Found ${existingExercises.length} existing exercises. Skipping initialization.`);
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
}