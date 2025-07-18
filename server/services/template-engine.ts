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
import { eq, and, or, asc, desc, inArray } from "drizzle-orm";

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
   * Generate workout from template based on user's volume landmarks
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
          orderIndex: exercise.orderIndex,
          sets: exercise.sets,
          targetReps: exercise.repsRange,
          restPeriod: exercise.restPeriod,
          notes: exercise.notes
        });
    }

    return { sessionId, exercises: customizedExercises };
  }

  /**
   * Create system training templates
   */
  static async initializeSystemTemplates(): Promise<void> {
    
    // Check if templates already exist
    const existingTemplates = await db
      .select({ count: trainingTemplates.id })
      .from(trainingTemplates)
      .where(eq(trainingTemplates.createdBy, "system"));

    if (existingTemplates.length > 0) {
      console.log("System templates already initialized");
      return;
    }

    // Define RP-based training templates
    const templates: Omit<typeof trainingTemplates.$inferInsert, 'id' | 'createdAt'>[] = [
      {
        name: "Push/Pull/Legs (Beginner)",
        description: "3-day split focusing on movement patterns with moderate volume",
        category: "beginner",
        daysPerWeek: 3,
        specialization: "full_body",
        templateData: {
          name: "Push/Pull/Legs (Beginner)",
          description: "3-day split for beginners",
          category: "beginner",
          daysPerWeek: 3,
          workouts: [
            {
              name: "Push Day",
              exercises: [
                { exerciseId: 1, exerciseName: "Bench Press", muscleGroups: ["chest"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
                { exerciseId: 2, exerciseName: "Overhead Press", muscleGroups: ["shoulders"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
                { exerciseId: 3, exerciseName: "Incline Dumbbell Press", muscleGroups: ["chest"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
                { exerciseId: 4, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 3, repsRange: "8-15", restPeriod: 90, orderIndex: 4 }
              ],
              estimatedDuration: 45,
              focus: ["chest", "shoulders", "triceps"]
            },
            {
              name: "Pull Day",
              exercises: [
                { exerciseId: 5, exerciseName: "Pull-ups", muscleGroups: ["back"], sets: 3, repsRange: "5-10", restPeriod: 180, orderIndex: 1 },
                { exerciseId: 6, exerciseName: "Barbell Rows", muscleGroups: ["back"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
                { exerciseId: 7, exerciseName: "Lat Pulldowns", muscleGroups: ["back"], sets: 3, repsRange: "10-15", restPeriod: 120, orderIndex: 3 },
                { exerciseId: 8, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 4 }
              ],
              estimatedDuration: 45,
              focus: ["back", "biceps"]
            },
            {
              name: "Leg Day",
              exercises: [
                { exerciseId: 9, exerciseName: "Squats", muscleGroups: ["quads"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 1 },
                { exerciseId: 10, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings"], sets: 3, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
                { exerciseId: 11, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
                { exerciseId: 12, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 60, orderIndex: 4 }
              ],
              estimatedDuration: 50,
              focus: ["quads", "hamstrings", "glutes", "calves"]
            }
          ]
        },
        rpMethodology: {
          volumeGuidelines: {
            chest: { mev: 8, mav: 16, mrv: 22 },
            back: { mev: 10, mav: 18, mrv: 25 },
            shoulders: { mev: 8, mav: 16, mrv: 22 },
            biceps: { mev: 6, mav: 14, mrv: 20 },
            triceps: { mev: 6, mav: 14, mrv: 20 },
            quads: { mev: 8, mav: 16, mrv: 22 },
            hamstrings: { mev: 6, mav: 12, mrv: 18 },
            glutes: { mev: 6, mav: 12, mrv: 18 },
            calves: { mev: 8, mav: 16, mrv: 22 }
          },
          progressionRules: [
            "Start at MEV for first 2 weeks",
            "Add 1-2 sets per muscle group weekly",
            "Deload when approaching MRV",
            "Focus on compound movements first"
          ],
          deloadGuidelines: [
            "Reduce volume to 50-60% of MEV",
            "Maintain movement patterns",
            "Focus on form and mobility"
          ]
        },
        isActive: true,
        createdBy: "system"
      },
      {
        name: "Upper/Lower Split (Intermediate)",
        description: "4-day split with higher frequency and volume",
        category: "intermediate", 
        daysPerWeek: 4,
        specialization: "full_body",
        templateData: {
          name: "Upper/Lower Split (Intermediate)",
          description: "4-day split for intermediate trainees",
          category: "intermediate",
          daysPerWeek: 4,
          workouts: [
            {
              name: "Upper Body A",
              exercises: [
                { exerciseId: 1, exerciseName: "Bench Press", muscleGroups: ["chest"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
                { exerciseId: 5, exerciseName: "Pull-ups", muscleGroups: ["back"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 2 },
                { exerciseId: 2, exerciseName: "Overhead Press", muscleGroups: ["shoulders"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 3 },
                { exerciseId: 6, exerciseName: "Barbell Rows", muscleGroups: ["back"], sets: 3, repsRange: "8-12", restPeriod: 120, orderIndex: 4 },
                { exerciseId: 4, exerciseName: "Tricep Dips", muscleGroups: ["triceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 5 },
                { exerciseId: 8, exerciseName: "Bicep Curls", muscleGroups: ["biceps"], sets: 3, repsRange: "10-15", restPeriod: 90, orderIndex: 6 }
              ],
              estimatedDuration: 60,
              focus: ["chest", "back", "shoulders", "arms"]
            },
            {
              name: "Lower Body A", 
              exercises: [
                { exerciseId: 9, exerciseName: "Squats", muscleGroups: ["quads"], sets: 4, repsRange: "6-10", restPeriod: 180, orderIndex: 1 },
                { exerciseId: 10, exerciseName: "Romanian Deadlifts", muscleGroups: ["hamstrings"], sets: 4, repsRange: "8-12", restPeriod: 180, orderIndex: 2 },
                { exerciseId: 11, exerciseName: "Leg Press", muscleGroups: ["quads"], sets: 3, repsRange: "12-20", restPeriod: 120, orderIndex: 3 },
                { exerciseId: 13, exerciseName: "Walking Lunges", muscleGroups: ["quads", "glutes"], sets: 3, repsRange: "12-16", restPeriod: 90, orderIndex: 4 },
                { exerciseId: 12, exerciseName: "Calf Raises", muscleGroups: ["calves"], sets: 4, repsRange: "15-25", restPeriod: 60, orderIndex: 5 }
              ],
              estimatedDuration: 55,
              focus: ["quads", "hamstrings", "glutes", "calves"]
            }
          ]
        },
        rpMethodology: {
          volumeGuidelines: {
            chest: { mev: 10, mav: 18, mrv: 25 },
            back: { mev: 12, mav: 20, mrv: 28 },
            shoulders: { mev: 10, mav: 18, mrv: 25 },
            biceps: { mev: 8, mav: 16, mrv: 22 },
            triceps: { mev: 8, mav: 16, mrv: 22 },
            quads: { mev: 10, mav: 18, mrv: 25 },
            hamstrings: { mev: 8, mav: 14, mrv: 20 },
            glutes: { mev: 8, mav: 14, mrv: 20 },
            calves: { mev: 10, mav: 18, mrv: 25 }
          },
          progressionRules: [
            "Progressive overload each week",
            "Vary rep ranges for different adaptations", 
            "Monitor fatigue accumulation closely",
            "Implement autoregulation based on feedback"
          ],
          deloadGuidelines: [
            "Reduce volume to 40-50% of peak",
            "Maintain intensity but reduce total sets",
            "Add mobility and recovery work"
          ]
        },
        isActive: true,
        createdBy: "system"
      }
    ];

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
    const conditions = [
      eq(trainingTemplates.isActive, true),
      or(
        eq(trainingTemplates.createdBy, 'system'),
        userId ? eq(trainingTemplates.userId, userId) : eq(trainingTemplates.createdBy, 'system')
      )
    ];
    
    if (category) {
      conditions.push(eq(trainingTemplates.category, category));
    }

    return await db.select().from(trainingTemplates)
      .where(and(...conditions))
      .orderBy(trainingTemplates.daysPerWeek, trainingTemplates.name);
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
   * Delete a user-created template
   */
  static async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(trainingTemplates)
      .where(
        and(
          eq(trainingTemplates.id, templateId),
          eq(trainingTemplates.userId, userId),
          eq(trainingTemplates.createdBy, 'user')
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
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
}