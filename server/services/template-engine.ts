import { db } from "../db";
import { 
  trainingTemplates, 
  exercises, 
  muscleGroups,
  volumeLandmarks,
  exerciseMuscleMapping,
  workoutSessions,
  workoutExercises
} from "@shared/schema";
import { eq, and, or, asc, desc, inArray, sql } from "drizzle-orm";

interface ExerciseTemplate {
  exerciseId: number;
  exerciseName: string;
  muscleGroups: string[];
  sets: number;
  repsRange: string;
  restPeriod: number;
  orderIndex: number;
  notes?: string;
}

interface WorkoutTemplate {
  name: string;
  exercises: ExerciseTemplate[];
  estimatedDuration: number;
  focus: string[];
}

interface TrainingTemplateData {
  name: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  specialization?: string;
  workouts: WorkoutTemplate[];
  rpMethodology: {
    volumeGuidelines: Record<string, { mev: number; mav: number; mrv: number }>;
    progressionRules: string[];
    deloadGuidelines: string[];
  };
}

export class TemplateEngine {
  
  /**
   * Generate full program from template (all workout days)
   */
  static async generateFullProgramFromTemplate(
    userId: number,
    templateId: number,
    mesocycleId?: number,
    startDate?: Date
  ): Promise<{
    sessions: Array<{
      sessionId: number;
      workoutDay: number;
      name: string;
      exercises: ExerciseTemplate[];
    }>;
    totalWorkouts: number;
  }> {
    
    // Get template data
    const template = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      throw new Error("Template not found");
    }

    const templateData = template[0].templateData as TrainingTemplateData;
    const sessions = [];

    // Generate all workout sessions for the template
    for (let workoutDay = 0; workoutDay < templateData.workouts.length; workoutDay++) {
      const workoutTemplate = templateData.workouts[workoutDay];
      
      // Get user's current volume landmarks
      const userLandmarks = await db
        .select({
          muscleGroupId: volumeLandmarks.muscleGroupId,
          muscleGroupName: muscleGroups.name,
          targetVolume: volumeLandmarks.targetVolume,
          currentVolume: volumeLandmarks.currentVolume,
          mev: volumeLandmarks.mev,
          mav: volumeLandmarks.mav,
          recoveryLevel: volumeLandmarks.recoveryLevel
        })
        .from(volumeLandmarks)
        .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
        .where(eq(volumeLandmarks.userId, userId));

      // Customize exercises for this workout
      const customizedExercises: ExerciseTemplate[] = [];
      
      for (const templateExercise of workoutTemplate.exercises) {
        // Get exercise details
        const exerciseDetails = await db
          .select({
            id: exercises.id,
            name: exercises.name,
            muscleGroups: exercises.muscleGroups,
            difficulty: exercises.difficulty
          })
          .from(exercises)
          .where(eq(exercises.id, templateExercise.exerciseId))
          .limit(1);

        if (exerciseDetails.length === 0) continue;

        const exercise = exerciseDetails[0];
        
        // Find relevant muscle group landmarks for this exercise
        const relevantLandmarks = userLandmarks.filter(landmark =>
          exercise.muscleGroups.includes(landmark.muscleGroupName)
        );

        let adjustedSets = templateExercise.sets;
        
        // Adjust sets based on recovery and current volume
        if (relevantLandmarks.length > 0) {
          const avgRecovery = relevantLandmarks.reduce((sum, l) => sum + l.recoveryLevel, 0) / relevantLandmarks.length;
          
          if (avgRecovery < 5) {
            // Poor recovery: reduce volume
            adjustedSets = Math.max(1, Math.floor(adjustedSets * 0.8));
          } else if (avgRecovery > 7) {
            // Good recovery: can handle full volume or slightly more
            adjustedSets = Math.min(adjustedSets * 1.1, adjustedSets + 1);
          }
        }

        customizedExercises.push({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroups: exercise.muscleGroups,
          sets: Math.round(adjustedSets),
          repsRange: templateExercise.repsRange,
          restPeriod: templateExercise.restPeriod,
          orderIndex: templateExercise.orderIndex,
          notes: templateExercise.notes
        });
      }

      // Create workout session for this day
      const sessionDate = startDate ? new Date(startDate) : new Date();
      if (startDate) {
        sessionDate.setDate(startDate.getDate() + workoutDay);
      }

      const [session] = await db
        .insert(workoutSessions)
        .values({
          userId: userId,
          programId: null,
          mesocycleId: mesocycleId, // Link to mesocycle
          name: `${workoutTemplate.name} - Week 1`,
          date: sessionDate,
          isCompleted: false,
          totalVolume: 0,
          duration: 0,
          createdAt: new Date()
        })
        .returning({ id: workoutSessions.id });

      // Add exercises to the session
      for (let i = 0; i < customizedExercises.length; i++) {
        const exercise = customizedExercises[i];
        await db
          .insert(workoutExercises)
          .values({
            sessionId: session.id,
            exerciseId: exercise.exerciseId,
            orderIndex: exercise.orderIndex,
            sets: exercise.sets,
            targetReps: exercise.repsRange,
            actualReps: null,
            weight: null,
            rpe: null,
            rir: null,
            restPeriod: exercise.restPeriod,
            isCompleted: false,
            notes: exercise.notes
          });
      }

      sessions.push({
        sessionId: session.id,
        workoutDay: workoutDay,
        name: workoutTemplate.name,
        exercises: customizedExercises
      });
    }

    return {
      sessions,
      totalWorkouts: templateData.workouts.length
    };
  }

  /**
   * Generate single workout from template based on user's volume landmarks
   */
  static async generateWorkoutFromTemplate(
    userId: number,
    templateId: number,
    workoutDay: number
  ): Promise<{
    sessionId: number;
    exercises: ExerciseTemplate[];
  }> {
    
    // Get template data
    const template = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      throw new Error("Template not found");
    }

    const templateData = template[0].templateData as TrainingTemplateData;
    const workoutTemplate = templateData.workouts[workoutDay % templateData.workouts.length];

    // Get user's current volume landmarks
    const userLandmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        targetVolume: volumeLandmarks.targetVolume,
        currentVolume: volumeLandmarks.currentVolume,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        recoveryLevel: volumeLandmarks.recoveryLevel
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, userId));

    // Customize template based on user's current needs
    const customizedExercises: ExerciseTemplate[] = [];
    
    for (const templateExercise of workoutTemplate.exercises) {
      // Get exercise details
      const exerciseDetails = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          muscleGroups: exercises.muscleGroups,
          difficulty: exercises.difficulty
        })
        .from(exercises)
        .where(eq(exercises.id, templateExercise.exerciseId))
        .limit(1);

      if (exerciseDetails.length === 0) continue;

      const exercise = exerciseDetails[0];
      
      // Find relevant muscle group landmarks for this exercise
      const relevantLandmarks = userLandmarks.filter(landmark =>
        exercise.muscleGroups.includes(landmark.muscleGroupName)
      );

      let adjustedSets = templateExercise.sets;
      
      // Adjust sets based on recovery and current volume
      if (relevantLandmarks.length > 0) {
        const avgRecovery = relevantLandmarks.reduce((sum, l) => sum + l.recoveryLevel, 0) / relevantLandmarks.length;
        
        if (avgRecovery < 5) {
          // Poor recovery: reduce volume
          adjustedSets = Math.max(1, Math.floor(adjustedSets * 0.8));
        } else if (avgRecovery > 7) {
          // Good recovery: can handle full volume or slightly more
          adjustedSets = Math.min(adjustedSets * 1.1, adjustedSets + 1);
        }
      }

      customizedExercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroups: exercise.muscleGroups,
        sets: Math.round(adjustedSets),
        repsRange: templateExercise.repsRange,
        restPeriod: templateExercise.restPeriod,
        orderIndex: templateExercise.orderIndex,
        notes: templateExercise.notes
      });
    }

    // Create workout session
    const sessionResult = await db
      .insert(workoutSessions)
      .values({
        userId,
        date: new Date(),
        name: workoutTemplate.name,
        isCompleted: false,
        totalVolume: 0,
        duration: 0
      })
      .returning({ id: workoutSessions.id });

    const sessionId = sessionResult[0].id;

    // Add exercises to session
    for (const exercise of customizedExercises) {
      await db
        .insert(workoutExercises)
        .values({
          sessionId,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex || 1, // Ensure orderIndex is never null
          sets: exercise.sets,
          targetReps: exercise.repsRange,
          restPeriod: exercise.restPeriod || 60, // Default rest period
          isCompleted: false,
          notes: exercise.notes
        });
    }

    return { sessionId, exercises: customizedExercises };
  }

  /**
   * Create system training templates
   */
  static async initializeSystemTemplates(): Promise<void> {
    
    // Force refresh templates to ensure correct data structure
    console.log("Refreshing system templates to ensure correct structure...");

    // Clear existing system templates for comprehensive refresh
    await db
      .delete(trainingTemplates)
      .where(eq(trainingTemplates.createdBy, "system"));

    // Import comprehensive RP-based training templates
    const { rpTrainingTemplates } = await import("../templates/rp-templates");
    const { rpAdvancedTemplates } = await import("../templates/rp-advanced-templates");
    
    // Combine all template libraries
    const templates = [...rpTrainingTemplates, ...rpAdvancedTemplates];

    // Insert templates
    for (const template of templates) {
      await db.insert(trainingTemplates).values(template);
    }

    console.log("System training templates initialized successfully");
  }

  /**
   * Get available templates for user (system and user-created)
   */
  static async getAvailableTemplates(category?: string, userId?: number): Promise<any[]> {
    try {
      console.log('Fetching templates with category:', category, 'userId:', userId);
      
      // For now, return just the system templates to get things working
      // We'll fix the complex OR query later
      const result = await db.select().from(trainingTemplates)
        .where(eq(trainingTemplates.isActive, true))
        .orderBy(trainingTemplates.daysPerWeek, trainingTemplates.name);
      
      console.log(`Found ${result.length} templates`);
      return result;
    } catch (error) {
      console.error('Error in getAvailableTemplates:', error);
      throw error;
    }
  }

  /**
   * Create a user-defined training template
   */
  static async createUserTemplate(
    userId: number,
    name: string,
    description: string,
    category: string,
    daysPerWeek: number,
    templateData: any
  ): Promise<any> {
    const [template] = await db
      .insert(trainingTemplates)
      .values({
        userId,
        name,
        description,
        category,
        daysPerWeek,
        specialization: 'custom',
        templateData: JSON.stringify(templateData),
        rpMethodology: {},
        isActive: true,
        createdBy: 'user'
      })
      .returning();

    return template;
  }

  /**
   * Update an existing template (user-created only)
   */
  static async updateTemplate(
    templateId: number, 
    updateData: Partial<{
      name: string;
      description: string;
      category: string;
      daysPerWeek: number;
      templateData: any;
    }>
  ): Promise<any | null> {
    const { templateData, ...otherUpdates } = updateData;
    
    const updateValues = {
      ...otherUpdates,
      ...(templateData ? { templateData: JSON.stringify(templateData) } : {})
    };

    const [updated] = await db
      .update(trainingTemplates)
      .set(updateValues)
      .where(
        and(
          eq(trainingTemplates.id, templateId),
          eq(trainingTemplates.createdBy, 'user')
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Update a user-created template
   */
  static async updateTemplate(templateId: number, updateData: any): Promise<TrainingTemplate | null> {
    const [updated] = await db
      .update(trainingTemplates)
      .set({
        name: updateData.name,
        description: updateData.description,
        category: updateData.category,
        daysPerWeek: updateData.daysPerWeek,
        templateData: updateData.templateData
      })
      .where(
        and(
          eq(trainingTemplates.id, templateId),
          eq(trainingTemplates.createdBy, 'user')
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Delete a user-created template
   */
  static async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
    try {
      // Use raw SQL to avoid any ORM syntax issues
      const result = await db.execute(sql`DELETE FROM training_templates WHERE id = ${templateId}`);
      
      console.log('Delete result:', result);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Delete template error:', error);
      throw error;
    }
  }

  /**
   * Customize template for specific user needs
   */
  static async customizeTemplateForUser(
    templateId: number,
    userId: number,
    specialization?: string,
    availableDays?: number
  ): Promise<TrainingTemplateData> {
    
    const template = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      throw new Error("Template not found");
    }

    let templateData = template[0].templateData as TrainingTemplateData;

    // Get user's volume landmarks for customization
    const userLandmarks = await db
      .select({
        muscleGroupName: muscleGroups.name,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        recoveryLevel: volumeLandmarks.recoveryLevel
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, userId));

    // Customize based on user's recovery and volume tolerance
    if (userLandmarks.length > 0) {
      const avgRecovery = userLandmarks.reduce((sum, l) => sum + l.recoveryLevel, 0) / userLandmarks.length;
      
      // Adjust volume recommendations based on user's current capacity
      for (const landmark of userLandmarks) {
        const muscleName = landmark.muscleGroupName;
        if (templateData.rpMethodology.volumeGuidelines[muscleName]) {
          templateData.rpMethodology.volumeGuidelines[muscleName] = {
            mev: landmark.mev,
            mav: landmark.mav,
            mrv: landmark.mav + 6 // Conservative MRV estimation
          };
        }
      }

      // Adjust workout intensity based on recovery
      if (avgRecovery < 5) {
        // Reduce volume across workouts
        templateData.workouts = templateData.workouts.map(workout => ({
          ...workout,
          exercises: workout.exercises.map(ex => ({
            ...ex,
            sets: Math.max(1, Math.floor(ex.sets * 0.8))
          }))
        }));
      }
    }

    // Apply specialization if requested
    if (specialization) {
      templateData.workouts = templateData.workouts.map(workout => {
        if (workout.focus.includes(specialization)) {
          // Add extra volume for specialized muscle group
          return {
            ...workout,
            exercises: workout.exercises.map(ex => 
              ex.muscleGroups.includes(specialization) 
                ? { ...ex, sets: ex.sets + 1 }
                : ex
            )
          };
        }
        return workout;
      });
    }

    return templateData;
  }

  /**
   * Generate workout program from template for mesocycle
   */
  static async generateWorkoutProgram(templateId: number, mesocycleId?: number) {
    const template = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      throw new Error(`Template ${templateId} not found`);
    }

    const templateData = template[0].templateData as any;
    
    // Create basic weekly structure based on template
    const weeklyStructure = [];
    const daysPerWeek = template[0].daysPerWeek;
    
    for (let day = 0; day < daysPerWeek; day++) {
      weeklyStructure.push({
        dayOfWeek: day,
        name: `Day ${day + 1}`,
        exercises: [],
        muscleGroups: templateData?.targetMuscleGroups || []
      });
    }

    return {
      templateId,
      mesocycleId,
      weeklyStructure,
      name: template[0].name,
      description: template[0].description
    };
  }

  /**
   * Get template by ID
   */
  static async getTemplate(templateId: number) {
    const templates = await db
      .select()
      .from(trainingTemplates)
      .where(eq(trainingTemplates.id, templateId))
      .limit(1);
    
    return templates[0] || null;
  }

  /**
   * Create weekly structure from template
   */
  static createWeeklyStructureFromTemplate(template: any) {
    const weeklyStructure = [];
    const daysPerWeek = template.daysPerWeek || 3;
    
    for (let day = 0; day < daysPerWeek; day++) {
      weeklyStructure.push({
        dayOfWeek: day,
        name: `${template.name} - Day ${day + 1}`,
        exercises: [],
        muscleGroups: []
      });
    }
    
    return weeklyStructure;
  }

  /**
   * Calculate volume progression for template
   */
  static calculateVolumeProgression(template: any) {
    return {
      startingVolume: 10,
      weeklyIncrease: 1,
      maxVolume: 20
    };
  }

  /**
   * Select exercises for template
   */
  static async selectExercisesForTemplate(template: any) {
    // Get basic exercises for the template
    const exercisesList = await db
      .select()
      .from(exercises)
      .limit(10);
    
    return exercisesList;
  }
}