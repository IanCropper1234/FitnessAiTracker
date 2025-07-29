import { db } from "./db";
import { trainingTemplates, exercises } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

interface ValidationResult {
  templateId: number;
  name: string;
  isValid: boolean;
  issues: string[];
}

/**
 * Validates all training templates and identifies issues
 */
export async function validateAllTemplates(): Promise<ValidationResult[]> {
  console.log('Starting template validation...');
  
  try {
    // Get all active templates
    const templates = await db.select().from(trainingTemplates).where(eq(trainingTemplates.isActive, true));
    console.log(`Found ${templates.length} templates to validate`);
    
    // Get all valid exercise IDs for reference
    const allExercises = await db.select({ id: exercises.id }).from(exercises);
    const validExerciseIds = new Set(allExercises.map(e => e.id));
    
    const validationResults: ValidationResult[] = [];
    
    for (const template of templates) {
      const result: ValidationResult = {
        templateId: template.id,
        name: template.name,
        isValid: true,
        issues: []
      };
      
      // Check basic template structure
      if (!template.name || template.name.trim() === '') {
        result.issues.push('Template name is empty');
        result.isValid = false;
      }
      
      if (!template.templateData) {
        result.issues.push('Template data is missing');
        result.isValid = false;
        validationResults.push(result);
        continue;
      }
      
      let templateData;
      try {
        // Handle both string and object templateData
        templateData = typeof template.templateData === 'string' 
          ? JSON.parse(template.templateData) 
          : template.templateData;
      } catch (e) {
        result.issues.push('Invalid JSON in template data');
        result.isValid = false;
        validationResults.push(result);
        continue;
      }
      
      // Check if workouts exist
      if (!templateData.workouts || !Array.isArray(templateData.workouts)) {
        result.issues.push('No workouts array found');
        result.isValid = false;
      } else if (templateData.workouts.length === 0) {
        result.issues.push('Template has no workouts');
        result.isValid = false;
      } else {
        // Validate each workout
        let totalExercises = 0;
        
        for (let i = 0; i < templateData.workouts.length; i++) {
          const workout = templateData.workouts[i];
          
          if (!workout.name || workout.name.trim() === '') {
            result.issues.push(`Workout ${i + 1} has no name`);
            result.isValid = false;
          }
          
          if (!workout.exercises || !Array.isArray(workout.exercises)) {
            result.issues.push(`Workout ${i + 1} has no exercises array`);
            result.isValid = false;
          } else if (workout.exercises.length === 0) {
            result.issues.push(`Workout ${i + 1} has no exercises`);
            result.isValid = false;
          } else {
            totalExercises += workout.exercises.length;
            
            // Validate each exercise
            for (let j = 0; j < workout.exercises.length; j++) {
              const exercise = workout.exercises[j];
              
              if (!exercise.exerciseName || exercise.exerciseName.trim() === '') {
                result.issues.push(`Workout ${i + 1}, Exercise ${j + 1} has no name`);
                result.isValid = false;
              }
              
              if (exercise.exerciseId && !validExerciseIds.has(exercise.exerciseId)) {
                result.issues.push(`Workout ${i + 1}, Exercise ${j + 1} references invalid exercise ID: ${exercise.exerciseId}`);
                result.isValid = false;
              }
              
              if (!exercise.sets || exercise.sets <= 0) {
                result.issues.push(`Workout ${i + 1}, Exercise ${j + 1} has invalid sets: ${exercise.sets}`);
                result.isValid = false;
              }
              
              if (!exercise.repsRange || exercise.repsRange.trim() === '') {
                result.issues.push(`Workout ${i + 1}, Exercise ${j + 1} has no rep range`);
                result.isValid = false;
              }
            }
          }
        }
        
        if (totalExercises === 0) {
          result.issues.push('Template has no exercises across all workouts');
          result.isValid = false;
        }
      }
      
      // Check RP methodology if it exists
      if (template.rpMethodology) {
        let rpData;
        try {
          rpData = typeof template.rpMethodology === 'string' 
            ? JSON.parse(template.rpMethodology) 
            : template.rpMethodology;
        } catch (e) {
          result.issues.push('Invalid JSON in RP methodology');
          result.isValid = false;
        }
      }
      
      validationResults.push(result);
    }
    
    return validationResults;
  } catch (error) {
    console.error('Error during template validation:', error);
    throw error;
  }
}

/**
 * Deletes invalid templates based on validation results
 */
export async function deleteInvalidTemplates(validationResults: ValidationResult[]): Promise<number> {
  const invalidTemplates = validationResults.filter(r => !r.isValid);
  
  if (invalidTemplates.length === 0) {
    console.log('No invalid templates to delete');
    return 0;
  }
  
  console.log(`Deleting ${invalidTemplates.length} invalid templates...`);
  
  const templateIds = invalidTemplates.map(t => t.templateId);
  
  try {
    const result = await db.delete(trainingTemplates)
      .where(inArray(trainingTemplates.id, templateIds));
    
    console.log(`Successfully deleted ${result.rowCount || 0} invalid templates`);
    
    // Log which templates were deleted
    for (const template of invalidTemplates) {
      console.log(`Deleted template: ${template.name} (ID: ${template.templateId})`);
      console.log(`  Issues: ${template.issues.join(', ')}`);
    }
    
    return result.rowCount || 0;
  } catch (error) {
    console.error('Error deleting invalid templates:', error);
    throw error;
  }
}

/**
 * Complete validation and cleanup process
 */
export async function validateAndCleanupTemplates(): Promise<{
  totalTemplates: number;
  validTemplates: number;
  invalidTemplates: number;
  deletedTemplates: number;
  validationResults: ValidationResult[];
}> {
  console.log('Starting template validation and cleanup process...');
  
  const validationResults = await validateAllTemplates();
  const totalTemplates = validationResults.length;
  const validTemplates = validationResults.filter(r => r.isValid).length;
  const invalidTemplates = validationResults.filter(r => !r.isValid).length;
  
  console.log(`\nValidation Summary:`);
  console.log(`Total templates: ${totalTemplates}`);
  console.log(`Valid templates: ${validTemplates}`);
  console.log(`Invalid templates: ${invalidTemplates}`);
  
  if (invalidTemplates > 0) {
    console.log('\nInvalid templates found:');
    validationResults.filter(r => !r.isValid).forEach(result => {
      console.log(`- ${result.name} (ID: ${result.templateId}): ${result.issues.join(', ')}`);
    });
  }
  
  const deletedTemplates = await deleteInvalidTemplates(validationResults);
  
  return {
    totalTemplates,
    validTemplates,
    invalidTemplates,
    deletedTemplates,
    validationResults
  };
}