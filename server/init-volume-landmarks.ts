import { db } from "./db";
import { muscleGroups, volumeLandmarks, exerciseMuscleMapping, exercises } from "@shared/schema";
import { scientificMuscleGroups, rpVolumeLandmarks, exerciseMuscleMapping as exerciseMapping } from "./data/muscle-groups";
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
      for (const muscleGroup of scientificMuscleGroups) {
        await db.insert(muscleGroups).values(muscleGroup);
      }
      
      console.log(`Inserted ${scientificMuscleGroups.length} muscle groups`);
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
      console.log("Creating exercise muscle mappings from exercise data...");
      
      const allExercises = await db.select().from(exercises);
      const allMuscleGroups = await db.select().from(muscleGroups);
      
      let mappingCount = 0;
      
      for (const exercise of allExercises) {
        if (exercise.muscleGroups && exercise.muscleGroups.length > 0) {
          // Parse muscle groups from the exercise data
          const muscleGroupNames = exercise.muscleGroups;
          
          for (const muscleGroupName of muscleGroupNames) {
            const muscleGroup = allMuscleGroups.find(mg => mg.name === muscleGroupName);
            
            if (muscleGroup) {
              await db.insert(exerciseMuscleMapping).values({
                exerciseId: exercise.id,
                muscleGroupId: muscleGroup.id,
                contributionPercentage: 70, // Default primary contribution
                role: 'primary' as const
              });
              mappingCount++;
            }
          }
        }
      }
      
      console.log(`Created ${mappingCount} exercise muscle mappings from ${allExercises.length} exercises`);
    } else {
      console.log("Exercise muscle mappings already exist");
    }

    console.log("Volume Landmarks system initialized successfully");
  } catch (error) {
    console.error("Error initializing Volume Landmarks system:", error);
    throw error;
  }
}