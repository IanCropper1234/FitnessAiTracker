import { db } from "../db";
import { 
  trainingTemplates, 
  savedWorkoutTemplates,
  exercises, 
  muscleGroups,
  volumeLandmarks,
  exerciseMuscleMapping,
  workoutSessions,
  workoutExercises,
  exerciseVolumeAllocation
} from "@shared/schema";
import { eq, and, or, asc, desc, inArray, sql } from "drizzle-orm";
import { VolumeDistributionEngine } from "./volume-distribution-engine";
import { SciAlgorithmCore } from "./scientific-algorithm-core";
import type { 
  WeeklyVolumeTarget, 
  VolumeConstraints
} from "@shared/types/volume-distribution";
import { DistributionStrategy } from "@shared/types/volume-distribution";

interface ExerciseTemplate {
  exerciseId: number;
  exerciseName: string;
  muscleGroups: string[];
  sets: number;
  repsRange: string;
  restPeriod: number;
  orderIndex: number;
  notes?: string;
  specialTrainingMethod?: string;
  specialMethodConfig?: any;
}

interface WorkoutTemplate {
  name: string;
  exercises: Array<{
    exerciseId: number;
    exerciseName?: string;
    sets: number;
    repsRange: string;
    restPeriod: number;
    orderIndex?: number;
    notes?: string;
    specialTrainingMethod?: string;
    specialMethodConfig?: any;
  }>;
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
   * Generate full program from template with scientific volume distribution
   * Updated to use VolumeDistributionEngine for proper set allocation
   */
  static async generateFullProgramFromTemplate(
    userId: number,
    templateId: number,
    mesocycleId?: number,
    startDate?: Date,
    currentWeek: number = 1,
    totalWeeks: number = 6
  ): Promise<{
    sessions: Array<{
      sessionId: number;
      workoutDay: number;
      name: string;
      exercises: ExerciseTemplate[];
    }>;
    totalWorkouts: number;
    volumeDistribution: Record<string, any>;
  }> {
    
    // Get template data - check both user templates and system templates
    let templateData;
    
    // First try saved workout templates (user templates)
    const savedTemplate = await db
      .select()
      .from(savedWorkoutTemplates)
      .where(eq(savedWorkoutTemplates.id, templateId))
      .limit(1);
      
    if (savedTemplate.length > 0) {
      console.log(`📋 Found saved workout template: ${savedTemplate[0].name}`);
      // For saved workout templates, we need to handle the different structure
      const template = savedTemplate[0];
      const exercises = Array.isArray(template.exerciseTemplates) 
        ? template.exerciseTemplates 
        : JSON.parse(template.exerciseTemplates as string);
      
      // Convert saved template to training template format
      templateData = {
        name: template.name,
        category: 'user_template',
        workouts: [{
          name: template.name,
          exercises: exercises
        }],
        description: template.description || '',
        estimatedDuration: template.estimatedDuration || 60
      };
    } else {
      // Fallback to system training templates
      const systemTemplate = await db
        .select()
        .from(trainingTemplates)
        .where(eq(trainingTemplates.id, templateId))
        .limit(1);
        
      if (systemTemplate.length === 0) {
        throw new Error(`Template not found with ID: ${templateId}. Available templates should be checked.`);
      }
      
      console.log(`📋 Found system training template: ${systemTemplate[0].name}`);
      templateData = systemTemplate[0].templateData as TrainingTemplateData;
    }
    const sessions = [];
    const volumeDistribution: Record<string, any> = {};

    // Step 1: Get user's volume landmarks for scientific calculation
    const userLandmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        targetVolume: volumeLandmarks.targetVolume,
        currentVolume: volumeLandmarks.currentVolume,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        recoveryLevel: volumeLandmarks.recoveryLevel,
        adaptationLevel: volumeLandmarks.adaptationLevel,
        frequencyMin: volumeLandmarks.frequencyMin,
        frequencyMax: volumeLandmarks.frequencyMax
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, userId));

    console.log(`🎯 Generating program with scientific volume distribution for ${userLandmarks.length} muscle groups`);

    // Step 2: Calculate weekly volume targets using RP methodology
    const weeklyTargets = await this.calculateWeeklyVolumeTargets(userLandmarks, currentWeek, totalWeeks);
    
    // Step 3: Collect all exercises from template by muscle group
    const exercisesByMuscleGroup = await this.organizeExercisesByMuscleGroup(templateData as TrainingTemplateData);
    
    // Step 4: Apply volume distribution for each muscle group
    for (const [muscleGroupName, muscleGroupData] of Object.entries(exercisesByMuscleGroup)) {
      const weeklyTarget = weeklyTargets[muscleGroupName];
      if (!weeklyTarget) continue;

      const trainingDays = this.getTrainingDaysForMuscleGroup(muscleGroupName, templateData);
      
      // Use VolumeDistributionEngine to distribute sets scientifically
      const allocation = await VolumeDistributionEngine.distributeVolumeAcrossExercises(
        weeklyTarget.targetSets,
        muscleGroupData.exercises.map(e => e.exerciseId),
        muscleGroupName,
        muscleGroupData.muscleGroupId,
        trainingDays,
        DistributionStrategy.BALANCED
      );
      
      volumeDistribution[muscleGroupName] = allocation;
      
      // Apply the allocation to template exercises
      this.applyVolumeAllocationToTemplate(templateData, allocation);
      
      console.log(`📊 ${muscleGroupName}: distributed ${allocation.totalAllocatedSets} sets across ${allocation.allocations.length} exercises`);
    }

    // Step 5: Generate workout sessions with corrected volume allocation
    for (let workoutDay = 0; workoutDay < templateData.workouts.length; workoutDay++) {
      const workoutTemplate = templateData.workouts[workoutDay];

      // Customize exercises for this workout
      const customizedExercises: ExerciseTemplate[] = [];
      
      for (let templateIndex = 0; templateIndex < workoutTemplate.exercises.length; templateIndex++) {
        const templateExercise = workoutTemplate.exercises[templateIndex];
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
          exercise.muscleGroups?.includes(landmark.muscleGroupName)
        );

        let adjustedSets = templateExercise.sets;
        
        // Adjust sets based on recovery and current volume
        if (relevantLandmarks.length > 0) {
          const avgRecovery = relevantLandmarks.reduce((sum, l) => sum + ((l.recoveryLevel ?? 5)), 0) / relevantLandmarks.length;
          
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
          muscleGroups: exercise.muscleGroups || [],
          sets: Math.round(adjustedSets),
          repsRange: templateExercise.repsRange,
          restPeriod: templateExercise.restPeriod,
          orderIndex: templateExercise.orderIndex || (templateIndex + 1),
          notes: templateExercise.notes,
          // Include special training method data
          specialTrainingMethod: templateExercise.specialTrainingMethod,
          specialMethodConfig: templateExercise.specialMethodConfig
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
      for (let exerciseIndex = 0; exerciseIndex < customizedExercises.length; exerciseIndex++) {
        const exercise = customizedExercises[exerciseIndex];
        // Get special training method data from template exercise
        const templateExercise = workoutTemplate.exercises[exerciseIndex];
        const specialMethod = templateExercise?.specialTrainingMethod;
        const specialConfig = templateExercise?.specialMethodConfig;

        await db
          .insert(workoutExercises)
          .values({
            sessionId: session.id,
            exerciseId: exercise.exerciseId,
            orderIndex: exercise.orderIndex || exerciseIndex + 1, // Ensure order_index is never null
            sets: exercise.sets,
            targetReps: exercise.repsRange || "8-12", // Default target reps if not provided
            actualReps: null,
            weight: null,
            rpe: null,
            rir: null,
            restPeriod: exercise.restPeriod || 120,
            isCompleted: false,
            notes: exercise.notes || "",
            // Add special training method data  
            specialMethod: specialMethod as any || null,
            specialConfig: specialConfig ? specialConfig : null
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
      totalWorkouts: templateData.workouts.length,
      volumeDistribution
    };
  }

  /**
   * Calculate weekly volume targets using RP methodology
   */
  private static async calculateWeeklyVolumeTargets(
    userLandmarks: any[],
    currentWeek: number,
    totalWeeks: number
  ): Promise<Record<string, WeeklyVolumeTarget>> {
    const targets: Record<string, WeeklyVolumeTarget> = {};
    
    for (const landmark of userLandmarks) {
      const progression = SciAlgorithmCore.calculateVolumeProgression(currentWeek, totalWeeks, {
        mev: landmark.mev,
        mav: landmark.mav,
        mrv: landmark.mrv,
        recoveryLevel: landmark.recoveryLevel,
        adaptationLevel: landmark.adaptationLevel
      });
      
      targets[landmark.muscleGroupName] = {
        muscleGroup: landmark.muscleGroupName,
        muscleGroupId: landmark.muscleGroupId,
        targetSets: progression.targetSets,
        phase: progression.phase,
        adjustmentFactor: 1.0,
        weekNumber: currentWeek
      };
    }
    
    return targets;
  }

  /**
   * Organize exercises by muscle group from template data
   */
  private static async organizeExercisesByMuscleGroup(templateData: TrainingTemplateData): Promise<Record<string, any>> {
    const exercisesByMuscleGroup: Record<string, any> = {};
    
    // Get all exercise IDs from template
    const allExerciseIds = templateData.workouts.flatMap(workout => 
      workout.exercises.map(ex => ex.exerciseId)
    );
    
    // Get exercise-muscle group mappings
    const mappings = await db
      .select({
        exerciseId: exerciseMuscleMapping.exerciseId,
        muscleGroupId: exerciseMuscleMapping.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        role: exerciseMuscleMapping.role
      })
      .from(exerciseMuscleMapping)
      .innerJoin(muscleGroups, eq(exerciseMuscleMapping.muscleGroupId, muscleGroups.id))
      .where(inArray(exerciseMuscleMapping.exerciseId, allExerciseIds));
    
    // Group by muscle group
    for (const mapping of mappings) {
      if (!exercisesByMuscleGroup[mapping.muscleGroupName]) {
        exercisesByMuscleGroup[mapping.muscleGroupName] = {
          muscleGroupId: mapping.muscleGroupId,
          exercises: []
        };
      }
      
      exercisesByMuscleGroup[mapping.muscleGroupName].exercises.push({
        exerciseId: mapping.exerciseId,
        role: mapping.role
      });
    }
    
    return exercisesByMuscleGroup;
  }

  /**
   * Get training days for a specific muscle group
   */
  private static getTrainingDaysForMuscleGroup(muscleGroup: string, templateData: TrainingTemplateData): number[] {
    const trainingDays: number[] = [];
    
    templateData.workouts.forEach((workout, index) => {
      const hasThisMuscleGroup = workout.focus.some(focus => 
        focus.toLowerCase().includes(muscleGroup.toLowerCase()) ||
        muscleGroup.toLowerCase().includes(focus.toLowerCase())
      );
      
      if (hasThisMuscleGroup) {
        trainingDays.push(index); // Workout day index
      }
    });
    
    return trainingDays.length > 0 ? trainingDays : [0, 2, 4]; // Default to Mon/Wed/Fri if not found
  }

  /**
   * Apply volume allocation to template exercises
   */
  private static applyVolumeAllocationToTemplate(templateData: TrainingTemplateData, allocation: any): void {
    // Update template exercises with allocated sets
    for (const alloc of allocation.allocations) {
      for (const workout of templateData.workouts) {
        const exercise = workout.exercises.find(ex => ex.exerciseId === alloc.exerciseId);
        if (exercise) {
          exercise.sets = alloc.allocatedSets;
        }
      }
    }
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
    
    for (let templateIndex = 0; templateIndex < workoutTemplate.exercises.length; templateIndex++) {
      const templateExercise = workoutTemplate.exercises[templateIndex];
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
        exercise.muscleGroups?.includes(landmark.muscleGroupName)
      );

      let adjustedSets = templateExercise.sets;
      
      // Adjust sets based on recovery and current volume
      if (relevantLandmarks.length > 0) {
        const avgRecovery = relevantLandmarks.reduce((sum, l) => sum + (l.recoveryLevel || 5), 0) / relevantLandmarks.length;
        
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
        muscleGroups: exercise.muscleGroups || [],
        sets: Math.round(adjustedSets),
        repsRange: templateExercise.repsRange,
        restPeriod: templateExercise.restPeriod,
        orderIndex: templateExercise.orderIndex || (templateIndex + 1),
        notes: templateExercise.notes,
        // Include special training method data
        specialTrainingMethod: templateExercise.specialTrainingMethod,
        specialMethodConfig: templateExercise.specialMethodConfig
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
    for (let i = 0; i < customizedExercises.length; i++) {
      const exercise = customizedExercises[i];
      // Get special training method data from template exercise
      const templateExercise = workoutTemplate.exercises[i];
      const specialMethod = templateExercise?.specialTrainingMethod;
      const specialConfig = templateExercise?.specialMethodConfig;

      await db
        .insert(workoutExercises)
        .values({
          sessionId,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex || (i + 1), // Ensure orderIndex is never null
          sets: exercise.sets,
          targetReps: exercise.repsRange || "8-12", // Default target reps if not provided  
          restPeriod: exercise.restPeriod || 120, // Default rest period
          isCompleted: false,
          notes: exercise.notes || "",
          // Add special training method data
          specialMethod: specialMethod as any || null,
          specialConfig: specialConfig ? specialConfig : null
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
   * Get a specific template by ID
   */
  static async getTemplateById(templateId: number, userId?: number): Promise<any | null> {
    try {
      console.log('Fetching template with ID:', templateId, 'userId:', userId);
      
      const result = await db.select().from(trainingTemplates)
        .where(
          and(
            eq(trainingTemplates.id, templateId),
            eq(trainingTemplates.isActive, true)
          )
        );
      
      if (result.length === 0) {
        console.log('Template not found');
        return null;
      }
      
      console.log('Found template:', result[0].name);
      return result[0];
    } catch (error) {
      console.error('Error in getTemplateById:', error);
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
        name,
        description,
        category,
        daysPerWeek,
        specialization: 'custom',
        templateData: JSON.stringify(templateData),
        rpMethodology: {},
        isActive: true,
        createdBy: `user_${userId}`
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
    }>,
    userId?: number
  ): Promise<any | null> {
    try {
      console.log('Updating template with ID:', templateId, 'userId:', userId);
      
      const { templateData, ...otherUpdates } = updateData;
      
      const updateValues = {
        ...otherUpdates,
        ...(templateData ? { templateData: JSON.stringify(templateData) } : {})
      };

      // First check if template exists and user has permission
      const existingTemplate = await db.select().from(trainingTemplates)
        .where(
          and(
            eq(trainingTemplates.id, templateId),
            eq(trainingTemplates.isActive, true)
          )
        );

      if (existingTemplate.length === 0) {
        console.log('Template not found');
        return null;
      }

      // Check if user has permission (either created by user or is system template)
      const template = existingTemplate[0];
      const userCreatedBy = `user_${userId}`;
      
      if (template.createdBy !== userCreatedBy && template.createdBy !== 'system') {
        console.log('User not authorized to update template. createdBy:', template.createdBy, 'expected:', userCreatedBy);
        return null;
      }

      const [updated] = await db
        .update(trainingTemplates)
        .set(updateValues)
        .where(eq(trainingTemplates.id, templateId))
        .returning();

      console.log('Template updated successfully:', updated?.name);
      return updated || null;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }



  /**
   * Delete a user-created template
   */
  static async deleteTemplate(templateId: number, userId: number): Promise<boolean> {
    try {
      // Use raw SQL to avoid any ORM syntax issues
      const result = await db.execute(sql`DELETE FROM training_templates WHERE id = ${templateId}`);
      
      console.log('Delete result:', result);
      return result.rowCount ? (result.rowCount ?? 0) > 0 : false;
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
      const avgRecovery = userLandmarks.reduce((sum, l) => sum + (l.recoveryLevel ?? 5), 0) / userLandmarks.length;
      
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
            exercises: workout.exercises.map(ex => {
              const exerciseMuscleGroups = (ex as any).muscleGroups || [];
              return exerciseMuscleGroups.includes(specialization) 
                ? { ...ex, sets: ex.sets + 1 }
                : ex;
            })
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