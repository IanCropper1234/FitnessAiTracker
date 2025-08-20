import { Router } from 'express';
import { db } from '../db.js';
import { workoutSessions, workoutExercises, exercises, muscleGroups, exerciseMuscleMapping, volumeLandmarks } from '@shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

const router = Router();

// Use global auth middleware - no need for custom auth in analytics routes

// Simplified volume progression with muscle group filtering
router.get('/volume-progression/:timeRange/:muscleGroup?', async (req, res) => {
  try {
    const userId = req.userId;
    const { muscleGroup = 'all' } = req.params;
    
    // Build muscle group filter
    let muscleGroupFilter = '';
    if (muscleGroup && muscleGroup !== 'all') {
      muscleGroupFilter = `
        AND EXISTS (
          SELECT 1 FROM exercise_muscle_mapping emm 
          JOIN muscle_groups mg ON emm.muscle_group_id = mg.id 
          WHERE emm.exercise_id = we.exercise_id 
          AND mg.name = '${muscleGroup}'
        )
      `;
    }
    
    // Get real data using direct SQL for proven functionality
    const weeklyData = await db.execute(sql`
      SELECT 
        'Week ' || ROW_NUMBER() OVER (ORDER BY week_date) as week,
        COALESCE(SUM(we.sets), 0) as actual,
        8 as mv,
        12 as mev, 
        16 as mav,
        20 as mrv,
        CASE 
          WHEN COALESCE(SUM(we.sets), 0) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(we.sets), 0)::float / 12) * 100)
        END as adherence
      FROM (
        SELECT DISTINCT DATE_TRUNC('week', date) as week_date 
        FROM workout_sessions 
        WHERE user_id = ${userId} 
          AND is_completed = true 
          AND date >= CURRENT_DATE - INTERVAL '28 days'
      ) weeks
      LEFT JOIN workout_sessions ws ON DATE_TRUNC('week', ws.date) = weeks.week_date 
        AND ws.user_id = ${userId} AND ws.is_completed = true
      LEFT JOIN workout_exercises we ON ws.id = we.session_id
      WHERE 1=1 ${sql.raw(muscleGroupFilter)}
      GROUP BY weeks.week_date
      ORDER BY weeks.week_date
    `);
    
    res.json(weeklyData.rows);
  } catch (error) {
    console.error('Volume progression error:', error);
    res.status(500).json({ error: 'Failed to fetch volume progression data' });
  }
});

// Simplified muscle group distribution 
router.get('/muscle-group-distribution/:timeRange', async (req, res) => {
  try {
    const userId = req.userId;
    
    const muscleData = await db.execute(sql`
      SELECT 
        mg.name as "muscleGroup",
        COALESCE(SUM(we.sets), 0) as "currentVolume",
        COALESCE(vl.target_volume, 12) as "targetVolume",
        CASE 
          WHEN COALESCE(vl.target_volume, 12) = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(we.sets), 0)::float / COALESCE(vl.target_volume, 12)) * 100)
        END as percentage,
        CASE 
          WHEN mg.name = 'chest' THEN '#FF6B6B'
          WHEN mg.name = 'lats' THEN '#4ECDC4'
          WHEN mg.name = 'shoulders' THEN '#45B7D1'
          WHEN mg.name = 'biceps' THEN '#96CEB4'
          WHEN mg.name = 'rhomboids' THEN '#FFEAA7'
          ELSE '#DDA0DD'
        END as color
      FROM muscle_groups mg
      LEFT JOIN volume_landmarks vl ON mg.id = vl.muscle_group_id AND vl.user_id = ${userId}
      LEFT JOIN exercise_muscle_mapping emm ON mg.id = emm.muscle_group_id
      LEFT JOIN workout_exercises we ON emm.exercise_id = we.exercise_id
      LEFT JOIN workout_sessions ws ON we.session_id = ws.id 
        AND ws.user_id = ${userId} 
        AND ws.is_completed = true 
        AND ws.date >= CURRENT_DATE - INTERVAL '28 days'
      GROUP BY mg.id, mg.name, vl.target_volume
      HAVING COALESCE(SUM(we.sets), 0) > 0 OR COALESCE(vl.target_volume, 0) > 0
      ORDER BY COALESCE(SUM(we.sets), 0) DESC
    `);
    
    res.json(muscleData.rows);
  } catch (error) {
    console.error('Muscle group distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch muscle group distribution' });
  }
});

// Simplified exercise progress
router.get('/exercise-progress/:timeRange/:muscleGroup', async (req, res) => {
  try {
    const userId = req.userId;
    
    const exerciseData = await db.execute(sql`
      SELECT 
        e.name as "exerciseName",
        json_agg(
          json_build_object(
            'date', ws.date,
            'weight', COALESCE(we.weight::float, 0),
            'reps', CASE 
              WHEN we.actual_reps IS NOT NULL AND we.actual_reps != '' 
              THEN array_length(string_to_array(we.actual_reps, ','), 1) * 8
              ELSE we.sets * 8
            END,
            'volume', COALESCE(we.weight::float, 0) * CASE 
              WHEN we.actual_reps IS NOT NULL AND we.actual_reps != '' 
              THEN array_length(string_to_array(we.actual_reps, ','), 1) * 8
              ELSE we.sets * 8
            END
          ) ORDER BY ws.date
        ) as sessions
      FROM exercises e
      JOIN workout_exercises we ON e.id = we.exercise_id
      JOIN workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id = ${userId} 
        AND ws.is_completed = true 
        AND ws.date >= CURRENT_DATE - INTERVAL '28 days'
      GROUP BY e.id, e.name
      ORDER BY COUNT(we.id) DESC
      LIMIT 5
    `);
    
    res.json(exerciseData.rows);
  } catch (error) {
    console.error('Exercise progress error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise progress data' });
  }
});

// Simplified RP metrics with muscle group filtering
router.get('/rp-metrics/:timeRange/:muscleGroup?', async (req, res) => {
  try {
    const userId = req.userId;
    const { muscleGroup = 'all' } = req.params;
    
    // Build muscle group filter
    let muscleGroupFilter = '';
    if (muscleGroup && muscleGroup !== 'all') {
      muscleGroupFilter = `
        AND EXISTS (
          SELECT 1 FROM exercise_muscle_mapping emm 
          JOIN muscle_groups mg ON emm.muscle_group_id = mg.id 
          WHERE emm.exercise_id = we.exercise_id 
          AND mg.name = '${muscleGroup}'
        )
      `;
    }
    
    const rpData = await db.execute(sql`
      SELECT 
        COALESCE(SUM(we.sets), 0) as "totalVolume",
        ROUND(COALESCE(SUM(we.sets), 0)::float / GREATEST(COUNT(DISTINCT ws.id), 1)) as "weeklyAvgVolume",
        CASE 
          WHEN 12 = 0 THEN 0
          ELSE ROUND((COALESCE(SUM(we.sets), 0)::float / 12) * 100)
        END as "adherenceToMev",
        CASE 
          WHEN COALESCE(SUM(we.sets), 0) > 100 THEN 'High'
          WHEN COALESCE(SUM(we.sets), 0) > 60 THEN 'Moderate'
          ELSE 'Low'
        END as "fatigueLevel",
        CASE 
          WHEN COALESCE(SUM(we.sets), 0) > 100 THEN '#EF4444'
          WHEN COALESCE(SUM(we.sets), 0) > 60 THEN '#F59E0B'
          ELSE '#22C55E'
        END as "fatigueColor",
        COUNT(DISTINCT ws.id) as "totalSessions",
        ROUND(COUNT(DISTINCT ws.id)::float / 4) as "avgSessionsPerWeek",
        CASE 
          WHEN COALESCE(SUM(we.sets), 0) > 60 THEN 'Consider deload'
          WHEN COALESCE(SUM(we.sets), 0) < 40 THEN 'Increase volume'
          ELSE 'Maintain current volume'
        END as "nextRecommendation"
      FROM workout_sessions ws
      LEFT JOIN workout_exercises we ON ws.id = we.session_id
      WHERE ws.user_id = ${userId} 
        AND ws.is_completed = true 
        AND ws.date >= CURRENT_DATE - INTERVAL '28 days'
        ${sql.raw(muscleGroupFilter)}
    `);
    
    res.json(rpData.rows[0] || {});
  } catch (error) {
    console.error('RP metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch RP metrics data' });
  }
});

export default router;