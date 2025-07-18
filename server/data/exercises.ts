import { storage } from "../storage";
import { enhancedExercises } from "./enhanced-exercises";

export async function initializeExercises() {
  // Initialize exercises in storage using enhanced exercise data
  for (const exercise of enhancedExercises) {
    await storage.createExercise(exercise);
  }
}