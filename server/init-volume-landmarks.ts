import { db } from "./db";
import { muscleGroups, volumeLandmarks, exerciseMuscleMapping, exercises } from "@shared/schema";
import { rpMuscleGroups, rpVolumeLandmarks, exerciseMuscleMapping as exerciseMapping } from "./data/muscle-groups";
import { eq, and } from "drizzle-orm";

export async function initializeVolumeLandmarks() {
  console.log("Initializing Volume Landmarks system...");

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Volume landmarks initialization timeout')), 10000)
    );
    
    // Check if muscle groups already exist
    const muscleGroupPromise = db.select().from(muscleGroups);
    const existingMuscleGroups = await Promise.race([muscleGroupPromise, timeoutPromise]);
    
    if (existingMuscleGroups.length === 0) {
      console.log("Inserting muscle groups...");
      
      // Insert muscle groups
      for (const muscleGroup of rpMuscleGroups) {
        await db.insert(muscleGroups).values(muscleGroup);
      }
      
      console.log(`Inserted ${rpMuscleGroups.length} muscle groups`);
    } else {
      console.log("Muscle groups already exist");
    }

    // Create default volume landmarks for user 1 if they don't exist
    const userId = 1;
    const existingLandmarks = await db.select().from(volumeLandmarks).where(eq(volumeLandmarks.userId, userId));
    
    if (existingLandmarks.length === 0) {
      console.log("Creating default volume landmarks for user 1...");
      
      const allMuscleGroups = await db.select().from(muscleGroups);
      
      for (const muscleGroup of allMuscleGroups) {
        const landmarks = rpVolumeLandmarks[muscleGroup.name as keyof typeof rpVolumeLandmarks];
        
        if (landmarks) {
          await db.insert(volumeLandmarks).values({
            userId: userId,
            muscleGroupId: muscleGroup.id,
            mv: landmarks.mv,
            mev: landmarks.mev,
            mav: landmarks.mav,
            mrv: landmarks.mrv,
            currentVolume: 0,
            targetVolume: Math.round((landmarks.mev + landmarks.mav) / 2), // Start in middle range
            recoveryLevel: 5,
            adaptationLevel: 5
          });
        }
      }
      
      console.log(`Created volume landmarks for ${allMuscleGroups.length} muscle groups`);
    } else {
      console.log("Volume landmarks already exist for user");
    }

    // Create exercise muscle mappings if they don't exist
    const existingMappings = await db.select().from(exerciseMuscleMapping);
    
    if (existingMappings.length === 0) {
      console.log("Creating exercise muscle mappings...");
      
      const allExercises = await db.select().from(exercises);
      const allMuscleGroups = await db.select().from(muscleGroups);
      
      for (const mapping of exerciseMapping) {
        const exercise = allExercises.find(ex => ex.name === mapping.exerciseName);
        const muscleGroup = allMuscleGroups.find(mg => mg.name === mapping.muscleGroup);
        
        if (exercise && muscleGroup) {
          await db.insert(exerciseMuscleMapping).values({
            exerciseId: exercise.id,
            muscleGroupId: muscleGroup.id,
            contributionPercentage: mapping.contribution,
            role: mapping.role
          });
        }
      }
      
      console.log(`Created ${exerciseMapping.length} exercise muscle mappings`);
    } else {
      console.log("Exercise muscle mappings already exist");
    }

    console.log("Volume Landmarks system initialized successfully");
  } catch (error) {
    console.error("Error initializing Volume Landmarks system:", error);
    throw error;
  }
}