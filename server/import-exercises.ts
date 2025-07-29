import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db';
import { exercises } from '@shared/schema';
import type { InsertExercise } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Renaissance Periodization muscle group mapping
const RP_MUSCLE_GROUPS: Record<string, string[]> = {
  'CHEST': ['chest', 'front_delts'],
  'BACK': ['lats', 'rhomboids', 'rear_delts', 'mid_traps'],
  'QUADS': ['quads'],
  'HAMSTRINGS': ['hamstrings', 'glutes'],
  'GLUTES': ['glutes', 'hamstrings'],
  'FRONT/ANTERIOR DELTS': ['front_delts', 'chest'],
  'SIDE/MEDIAL DELTS': ['side_delts'],
  'REAR/POSTERIOR DELTS': ['rear_delts', 'rhomboids'],
  'BICEPS': ['biceps'],
  'TRICEPS': ['triceps', 'front_delts'],
  'CALVES': ['calves'],
  'ABS': ['abs'],
  'TRAPS': ['traps', 'rear_delts'],
  'FOREARMS': ['forearms']
};

// Equipment standardization mapping
const EQUIPMENT_MAPPING: Record<string, string> = {
  'CABLE': 'cable',
  'BARBELL': 'barbell',
  'DUMBBELL': 'dumbbell',
  'MACHINE': 'machine',
  'BODYWEIGHT': 'bodyweight'
};

// Category mapping for RP methodology
const CATEGORY_MAPPING: Record<string, string> = {
  'CHEST': 'push',
  'FRONT/ANTERIOR DELTS': 'push',
  'SIDE/MEDIAL DELTS': 'push',
  'TRICEPS': 'push',
  'BACK': 'pull',
  'REAR/POSTERIOR DELTS': 'pull',
  'BICEPS': 'pull',
  'TRAPS': 'pull',
  'QUADS': 'legs',
  'HAMSTRINGS': 'legs',
  'GLUTES': 'legs',
  'CALVES': 'legs',
  'ABS': 'core',
  'FOREARMS': 'accessories'
};

// Primary muscle mapping for RP classification
const PRIMARY_MUSCLE_MAPPING: Record<string, string> = {
  'CHEST': 'chest',
  'BACK': 'lats',
  'QUADS': 'quads',
  'HAMSTRINGS': 'hamstrings',
  'GLUTES': 'glutes',
  'FRONT/ANTERIOR DELTS': 'front_delts',
  'SIDE/MEDIAL DELTS': 'side_delts',
  'REAR/POSTERIOR DELTS': 'rear_delts',
  'BICEPS': 'biceps',
  'TRICEPS': 'triceps',
  'CALVES': 'calves',
  'ABS': 'abs',
  'TRAPS': 'traps',
  'FOREARMS': 'forearms'
};

interface CSVExercise {
  name: string;
  equipment: string;
  muscleGroup: string;
}

function parseCSV(csvContent: string): CSVExercise[] {
  const lines = csvContent.split('\n');
  const exercises: CSVExercise[] = [];
  const seenExercises = new Set<string>(); // For duplicate detection
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    const name = columns[0]?.trim();
    const equipment = columns[1]?.trim();
    const muscleGroup = columns[2]?.trim();
    
    if (name && equipment && muscleGroup) {
      // Clean up the name (remove duplicates in data)
      const cleanName = name.toUpperCase().trim();
      
      // Check for duplicates
      if (!seenExercises.has(cleanName)) {
        seenExercises.add(cleanName);
        exercises.push({
          name: cleanName,
          equipment: equipment.toUpperCase(),
          muscleGroup: muscleGroup.toUpperCase()
        });
      } else {
        console.log(`Duplicate exercise detected: ${cleanName} - skipping`);
      }
    }
  }
  
  return exercises;
}

function convertToDbFormat(csvExercise: CSVExercise): InsertExercise {
  const { name, equipment, muscleGroup } = csvExercise;
  
  // Map to proper format
  const dbEquipment = EQUIPMENT_MAPPING[equipment] || equipment.toLowerCase();
  const muscleGroups = RP_MUSCLE_GROUPS[muscleGroup] || [muscleGroup.toLowerCase()];
  const primaryMuscle = PRIMARY_MUSCLE_MAPPING[muscleGroup] || muscleGroup.toLowerCase();
  const category = CATEGORY_MAPPING[muscleGroup] || 'accessories';
  const isBodyWeight = equipment === 'BODYWEIGHT';
  
  // Determine movement pattern based on exercise name and muscle group
  let movementPattern = 'isolation';
  if (name.includes('SQUAT') || name.includes('DEADLIFT') || name.includes('PRESS') || 
      name.includes('ROW') || name.includes('PULL-UP') || name.includes('LUNGE')) {
    movementPattern = 'compound';
  }
  
  // Determine difficulty based on movement complexity
  let difficulty = 'intermediate';
  if (name.includes('MACHINE') || name.includes('ASSISTED')) {
    difficulty = 'beginner';
  } else if (name.includes('DEFICIT') || name.includes('PAUSE') || 
             name.includes('1 ARM') || name.includes('SINGLE LEG')) {
    difficulty = 'advanced';
  }
  
  // Clean name for display (title case)
  const displayName = name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return {
    name: displayName,
    category,
    muscleGroups,
    primaryMuscle,
    equipment: dbEquipment,
    movementPattern,
    difficulty,
    isBodyWeight,
    instructions: null,
    videoUrl: null,
    translations: null
  };
}

async function importExercises() {
  try {
    console.log('🏋️ Starting exercise import from CSV...');
    
    // Read the CSV file
    const csvPath = join(process.cwd(), 'attached_assets', 'Trainify v1 - Exercise library (1)_1753774454105.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    // Parse CSV data
    const csvExercises = parseCSV(csvContent);
    console.log(`📋 Parsed ${csvExercises.length} exercises from CSV`);
    
    // Convert to database format
    const dbExercises = csvExercises.map(convertToDbFormat);
    
    // Get existing exercises to avoid duplicates
    const existingExercises = await db.select({ name: exercises.name }).from(exercises);
    const existingNames = new Set(existingExercises.map(ex => ex.name.toLowerCase()));
    
    // Filter out duplicates
    const newExercises = dbExercises.filter((ex: InsertExercise) => !existingNames.has(ex.name.toLowerCase()));
    
    console.log(`✅ ${dbExercises.length - newExercises.length} exercises already exist - skipping duplicates`);
    console.log(`🆕 Importing ${newExercises.length} new exercises`);
    
    if (newExercises.length === 0) {
      console.log('No new exercises to import.');
      return;
    }
    
    // Import exercises in batches
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < newExercises.length; i += batchSize) {
      const batch = newExercises.slice(i, i + batchSize);
      
      try {
        await db.insert(exercises).values(batch);
        imported += batch.length;
        console.log(`📊 Imported batch: ${imported}/${newExercises.length} exercises`);
      } catch (error) {
        console.error(`❌ Error importing batch starting at index ${i}:`, error);
        // Continue with next batch
      }
    }
    
    // Generate summary statistics
    const totalExercises = await db.select().from(exercises);
    const bodyweightCount = totalExercises.filter((ex: any) => ex.isBodyWeight).length;
    const equipmentStats = totalExercises.reduce((acc: Record<string, number>, ex: any) => {
      acc[ex.equipment || 'unknown'] = (acc[ex.equipment || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n🎉 Import Complete!');
    console.log(`📈 Total exercises in database: ${totalExercises.length}`);
    console.log(`💪 Bodyweight exercises: ${bodyweightCount}`);
    console.log('🏋️ Equipment breakdown:');
    Object.entries(equipmentStats).forEach(([equipment, count]) => {
      console.log(`  ${equipment}: ${count} exercises`);
    });
    
    // Show muscle group distribution
    const muscleGroupStats = totalExercises.reduce((acc: Record<string, number>, ex: any) => {
      acc[ex.primaryMuscle] = (acc[ex.primaryMuscle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🎯 Primary muscle group distribution:');
    Object.entries(muscleGroupStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .forEach(([muscle, count]) => {
        console.log(`  ${muscle}: ${count} exercises`);
      });
      
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Export for use in other files
export { importExercises, parseCSV, convertToDbFormat };

// Run import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importExercises()
    .then(() => {
      console.log('✅ Exercise import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Exercise import failed:', error);
      process.exit(1);
    });
}