import { Router } from 'express';
import { db } from '../db.js';
import { workoutSessions, workoutExercises, exercises, muscleGroups, exerciseMuscleMapping, volumeLandmarks } from '@shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

const router = Router();

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  const userId = (req.session as any)?.userId;
  if (!userId || typeof userId !== 'number') {
    return res.status(401).json({ message: "Not authenticated" });
  }
  req.userId = userId;
  next();
}

// Get volume progression data for RP analytics
router.get('/volume-progression/:timeRange', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId!;
    const timeRange = req.params.timeRange;
    
    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '4weeks':
        startDate.setDate(endDate.getDate() - 28);
        break;
      case '12weeks':
        startDate.setDate(endDate.getDate() - 84);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 28);
    }
    
    // Get volume landmarks for the user (MV, MEV, MAV, MRV values)
    console.log('Fetching landmarks for user:', userId);
    const landmarks = await db.select()
      .from(volumeLandmarks)
      .where(eq(volumeLandmarks.userId, userId));
    
    console.log('Found landmarks:', landmarks.length);
    
    // Get completed workout sessions in the time range
    console.log('Fetching sessions for user:', userId, 'from:', startDate.toISOString(), 'to:', endDate.toISOString());
    const sessions = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isCompleted, true),
        gte(workoutSessions.date, startDate.toISOString()),
        lte(workoutSessions.date, endDate.toISOString())
      ))
      .orderBy(workoutSessions.date);
    
    console.log('Found sessions:', sessions.length);
    
    // Calculate weekly volume progression
    const weeklyData = [];
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerWeek);
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate.getTime() + (i * msPerWeek));
      const weekEnd = new Date(weekStart.getTime() + msPerWeek);
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });
      
      let totalVolume = 0;
      for (const session of weekSessions) {
        const exercises = await db.select()
          .from(workoutExercises)
          .where(eq(workoutExercises.sessionId, session.id));
        
        totalVolume += exercises.reduce((sum, ex) => {
          const sets = ex.actualReps ? ex.actualReps.split(',').length : ex.sets;
          return sum + sets;
        }, 0);
      }
      
      // Use average landmarks or default values
      const avgLandmarks = landmarks.length > 0 ? {
        mv: landmarks.reduce((sum, l) => sum + (l.mv || 10), 0) / landmarks.length,
        mev: landmarks.reduce((sum, l) => sum + (l.mev || 14), 0) / landmarks.length,
        mav: landmarks.reduce((sum, l) => sum + (l.mav || 18), 0) / landmarks.length,
        mrv: landmarks.reduce((sum, l) => sum + (l.mrv || 22), 0) / landmarks.length,
      } : { mv: 10, mev: 14, mav: 18, mrv: 22 };
      
      const adherence = avgLandmarks.mev > 0 ? Math.round((totalVolume / avgLandmarks.mev) * 100) : 0;
      
      weeklyData.push({
        week: `Week ${i + 1}`,
        mv: Math.round(avgLandmarks.mv),
        mev: Math.round(avgLandmarks.mev),
        mav: Math.round(avgLandmarks.mav), 
        mrv: Math.round(avgLandmarks.mrv),
        actual: totalVolume,
        adherence: adherence
      });
    }
    
    res.json(weeklyData);
  } catch (error) {
    console.error('Error fetching volume progression:', error);
    res.status(500).json({ error: 'Failed to fetch volume progression data' });
  }
});

// Get muscle group distribution
router.get('/muscle-group-distribution/:timeRange', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId!;
    const timeRange = req.params.timeRange;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '4weeks':
        startDate.setDate(endDate.getDate() - 28);
        break;
      case '12weeks':
        startDate.setDate(endDate.getDate() - 84);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 28);
    }
    
    // Get all muscle groups
    const allMuscleGroups = await db.select().from(muscleGroups);
    
    // Get completed sessions in the time range
    const sessions = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isCompleted, true),
        gte(workoutSessions.date, startDate.toISOString()),
        lte(workoutSessions.date, endDate.toISOString())
      ));
    
    const muscleGroupData = [];
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    
    for (let i = 0; i < allMuscleGroups.length; i++) {
      const muscleGroup = allMuscleGroups[i];
      let currentVolume = 0;
      
      // Get exercises for this muscle group
      const muscleExercises = await db.select({
        exerciseId: exerciseMuscleMapping.exerciseId
      })
      .from(exerciseMuscleMapping)
      .where(eq(exerciseMuscleMapping.muscleGroupId, muscleGroup.id));
      
      const exerciseIds = muscleExercises.map(me => me.exerciseId);
      
      if (exerciseIds.length > 0) {
        // Count volume for this muscle group
        for (const session of sessions) {
          const sessionExercises = await db.select()
            .from(workoutExercises)
            .where(and(
              eq(workoutExercises.sessionId, session.id),
              exerciseIds.length > 0 ? sql`${workoutExercises.exerciseId} IN (${exerciseIds.join(',')})` : sql`1=1`
            ));
          
          currentVolume += sessionExercises.reduce((sum, ex) => {
            const sets = ex.actualReps ? ex.actualReps.split(',').length : ex.sets;
            return sum + sets;
          }, 0);
        }
      }
      
      // Get target volume from volume landmarks
      const landmarks = await db.select()
        .from(volumeLandmarks)
        .where(and(
          eq(volumeLandmarks.userId, userId),
          eq(volumeLandmarks.muscleGroupId, muscleGroup.id)
        ));
      
      const targetVolume = landmarks.length > 0 ? landmarks[0].mev || 14 : 14;
      const percentage = targetVolume > 0 ? Math.round((currentVolume / targetVolume) * 100) : 0;
      
      if (currentVolume > 0 || targetVolume > 0) {
        muscleGroupData.push({
          muscleGroup: muscleGroup.name,
          currentVolume,
          targetVolume,
          percentage,
          color: colors[i % colors.length]
        });
      }
    }
    
    res.json(muscleGroupData);
  } catch (error) {
    console.error('Error fetching muscle group distribution:', error);
    res.status(500).json({ error: 'Failed to fetch muscle group distribution' });
  }
});

// Get exercise progress data
router.get('/exercise-progress/:timeRange/:muscleGroup', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId!;
    const timeRange = req.params.timeRange;
    const muscleGroup = req.params.muscleGroup;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '4weeks':
        startDate.setDate(endDate.getDate() - 28);
        break;
      case '12weeks':
        startDate.setDate(endDate.getDate() - 84);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 28);
    }
    
    let exerciseIds: number[] = [];
    
    if (muscleGroup !== 'all') {
      // Get exercises for specific muscle group
      const muscleGroupRecord = await db.select()
        .from(muscleGroups)
        .where(sql`LOWER(${muscleGroups.name}) = LOWER(${muscleGroup})`)
        .limit(1);
      
      if (muscleGroupRecord.length > 0) {
        const mappings = await db.select()
          .from(exerciseMuscleMapping)
          .where(eq(exerciseMuscleMapping.muscleGroupId, muscleGroupRecord[0].id));
        
        exerciseIds = mappings.map(m => m.exerciseId);
      }
    }
    
    // Get completed sessions in time range
    const sessions = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isCompleted, true),
        gte(workoutSessions.date, startDate.toISOString()),
        lte(workoutSessions.date, endDate.toISOString())
      ))
      .orderBy(workoutSessions.date);
    
    // Get exercise progress data
    const exerciseProgressMap = new Map<number, any>();
    
    for (const session of sessions) {
      let exerciseQuery = db.select({
        exerciseId: workoutExercises.exerciseId,
        weight: workoutExercises.weight,
        actualReps: workoutExercises.actualReps,
        sets: workoutExercises.sets,
        exerciseName: exercises.name
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.sessionId, session.id));
      
      if (exerciseIds.length > 0) {
        exerciseQuery = exerciseQuery.where(sql`${workoutExercises.exerciseId} IN (${exerciseIds.join(',')})`);
      }
      
      const sessionExercises = await exerciseQuery;
      
      for (const ex of sessionExercises) {
        if (!exerciseProgressMap.has(ex.exerciseId)) {
          exerciseProgressMap.set(ex.exerciseId, {
            exerciseName: ex.exerciseName,
            sessions: []
          });
        }
        
        const weight = parseFloat(ex.weight || '0');
        const reps = ex.actualReps ? 
          ex.actualReps.split(',').reduce((sum, r) => sum + parseInt(r.trim()), 0) : 
          ex.sets * 8; // default estimation
        const volume = weight * reps;
        
        exerciseProgressMap.get(ex.exerciseId).sessions.push({
          date: session.date,
          weight,
          reps,
          volume
        });
      }
    }
    
    const progressData = Array.from(exerciseProgressMap.values()).slice(0, 10); // Limit to top 10 exercises
    
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    res.status(500).json({ error: 'Failed to fetch exercise progress data' });
  }
});
  // Get RP metrics data
router.get('/rp-metrics/:timeRange', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId!;
    const timeRange = req.params.timeRange;
    
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '4weeks':
        startDate.setDate(endDate.getDate() - 28);
        break;
      case '12weeks':
        startDate.setDate(endDate.getDate() - 84);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 28);
    }
    
    // Get completed sessions in time range
    const sessions = await db.select()
      .from(workoutSessions)
      .where(and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.isCompleted, true),
        gte(workoutSessions.date, startDate.toISOString()),
        lte(workoutSessions.date, endDate.toISOString())
      ));
    
    // Calculate total volume and sessions
    let totalVolume = 0;
    let totalSessions = sessions.length;
    
    for (const session of sessions) {
      const exercises = await db.select()
        .from(workoutExercises)
        .where(eq(workoutExercises.sessionId, session.id));
      
      totalVolume += exercises.reduce((sum, ex) => {
        const sets = ex.actualReps ? ex.actualReps.split(',').length : ex.sets;
        return sum + sets;
      }, 0);
    }
    
    // Get volume landmarks for comparison
    const landmarks = await db.select()
      .from(volumeLandmarks)
      .where(eq(volumeLandmarks.userId, userId));
    
    const avgMev = landmarks.length > 0 ? 
      landmarks.reduce((sum, l) => sum + (l.mev || 14), 0) / landmarks.length : 14;
    
    // Calculate metrics
    const weeklyAvgVolume = totalSessions > 0 ? Math.round(totalVolume / (totalSessions / 7)) : 0;
    const adherenceToMev = avgMev > 0 ? Math.round((weeklyAvgVolume / avgMev) * 100) : 0;
    
    // Estimate fatigue level based on volume vs MEV
    let fatigueLevel = 'Low';
    let fatigueColor = '#22C55E'; // green
    
    if (adherenceToMev > 120) {
      fatigueLevel = 'High';
      fatigueColor = '#EF4444'; // red
    } else if (adherenceToMev > 100) {
      fatigueLevel = 'Moderate';
      fatigueColor = '#F59E0B'; // yellow
    }
    
    const rpMetrics = {
      totalVolume,
      weeklyAvgVolume,
      adherenceToMev,
      fatigueLevel,
      fatigueColor,
      totalSessions,
      avgSessionsPerWeek: Math.round(totalSessions / ((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))),
      volumeProgression: weeklyAvgVolume > avgMev ? '+' : '',
      nextRecommendation: adherenceToMev > 110 ? 'Consider deload' : adherenceToMev < 90 ? 'Increase volume' : 'Maintain current volume'
    };
    
    res.json(rpMetrics);
  } catch (error) {
    console.error('Error fetching RP metrics:', error);
    res.status(500).json({ error: 'Failed to fetch RP metrics data' });
  }
});

export default router;