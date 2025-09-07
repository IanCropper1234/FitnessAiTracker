/**
 * 測試端點：用於驗證量分配系統
 */

import { Router } from "express";
import { VolumeDistributionEngine } from "./services/volume-distribution-engine";
import { TemplateEngine } from "./services/template-engine";
import { db } from "./db";
import { volumeLandmarks, muscleGroups } from "@shared/schema";
import { eq } from "drizzle-orm";
import { DistributionStrategy } from "@shared/types/volume-distribution";

const testRouter = Router();

// 測試 VolumeDistributionEngine
testRouter.post('/volume-distribution', async (req, res) => {
  try {
    const { targetSets, exerciseIds, muscleGroup, muscleGroupId, trainingDays, strategy } = req.body;
    
    console.log(`🧪 Testing volume distribution: ${targetSets} sets across ${exerciseIds.length} exercises`);
    
    const result = await VolumeDistributionEngine.distributeVolumeAcrossExercises(
      targetSets,
      exerciseIds,
      muscleGroup,
      muscleGroupId,
      trainingDays,
      DistributionStrategy[strategy as keyof typeof DistributionStrategy] || DistributionStrategy.BALANCED
    );
    
    console.log(`📊 Distribution result: ${result.totalAllocatedSets} sets allocated`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Volume distribution test error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 測試 TemplateEngine 整合
testRouter.post('/template-generation', async (req, res) => {
  try {
    const { userId, templateId, currentWeek, totalWeeks } = req.body;
    
    console.log(`🧪 Testing template generation for user ${userId}`);
    
    const result = await TemplateEngine.generateFullProgramFromTemplate(
      userId,
      templateId,
      undefined, // mesocycleId
      new Date(), // startDate
      currentWeek,
      totalWeeks
    );
    
    console.log(`📊 Generated ${result.totalWorkouts} workouts with volume distribution applied`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Template generation test error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 測試量指標數據
testRouter.get('/volume-landmarks', async (req, res) => {
  try {
    console.log('🧪 Testing volume landmarks data');
    
    const landmarks = await db
      .select({
        muscleGroupId: volumeLandmarks.muscleGroupId,
        muscleGroupName: muscleGroups.name,
        mev: volumeLandmarks.mev,
        mav: volumeLandmarks.mav,
        mrv: volumeLandmarks.mrv,
        frequencyMin: volumeLandmarks.frequencyMin,
        frequencyMax: volumeLandmarks.frequencyMax
      })
      .from(volumeLandmarks)
      .innerJoin(muscleGroups, eq(volumeLandmarks.muscleGroupId, muscleGroups.id))
      .where(eq(volumeLandmarks.userId, 1)); // 測試用戶
    
    console.log(`📊 Found ${landmarks.length} volume landmarks`);
    
    res.json({ landmarks });
  } catch (error) {
    console.error('❌ Volume landmarks test error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 測試科學約束驗證
testRouter.post('/validate-constraints', async (req, res) => {
  try {
    const { exerciseAllocations, constraints } = req.body;
    
    console.log('🧪 Testing volume constraint validation');
    
    const result = VolumeDistributionEngine.validateWeeklyVolumeConstraints(
      exerciseAllocations,
      constraints
    );
    
    console.log(`📊 Constraint validation: ${result.isValid ? 'PASS' : 'FAIL'}`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Constraint validation test error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { testRouter };