// AI Performance Monitoring System
// Tracks response times, token usage, and quality metrics for model comparison

import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface AIPerformanceMetrics {
  requestId: string;
  userId: string;
  service: string; // exercise-recommendations, nutrition-analysis, etc.
  model: string;
  startTime: number;
  endTime: number;
  responseTimeMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  success: boolean;
  errorMessage?: string;
  jsonParseable: boolean;
  contentLength: number;
  abTestGroup?: 'control' | 'test' | null;
  timestamp: Date;
}

export interface AIQualityMetrics {
  requestId: string;
  service: string;
  model: string;
  confidence?: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  qualityScore?: number; // 1-10 scale
  notes?: string;
  timestamp: Date;
}

// In-memory storage for performance metrics (later can be persisted to database)
const performanceBuffer: AIPerformanceMetrics[] = [];
const qualityBuffer: AIQualityMetrics[] = [];

// Buffer limits to prevent memory overflow
const MAX_BUFFER_SIZE = 10000;
const FLUSH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor;
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.startPeriodicFlush();
  }

  static getInstance(): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor();
    }
    return AIPerformanceMonitor.instance;
  }

  // Record performance metrics
  recordMetrics(metrics: AIPerformanceMetrics) {
    performanceBuffer.push({
      ...metrics,
      timestamp: new Date()
    });

    // Prevent buffer overflow
    if (performanceBuffer.length > MAX_BUFFER_SIZE) {
      performanceBuffer.splice(0, performanceBuffer.length - MAX_BUFFER_SIZE);
    }

    // Log important metrics immediately for debugging
    const { requestId, service, model, responseTimeMs, success, jsonParseable } = metrics;
    console.log(`[AI-Monitor] ${service}/${model} - ${responseTimeMs}ms - ${success ? 'SUCCESS' : 'FAILED'} - JSON: ${jsonParseable} - ID: ${requestId.substring(0, 8)}`);
  }

  // Record quality metrics
  recordQuality(metrics: AIQualityMetrics) {
    qualityBuffer.push({
      ...metrics,
      timestamp: new Date()
    });

    if (qualityBuffer.length > MAX_BUFFER_SIZE) {
      qualityBuffer.splice(0, qualityBuffer.length - MAX_BUFFER_SIZE);
    }
  }

  // Get recent metrics for analysis
  getRecentMetrics(service?: string, model?: string, hours: number = 24): AIPerformanceMetrics[] {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    
    return performanceBuffer
      .filter(metric => 
        metric.timestamp >= cutoff &&
        (!service || metric.service === service) &&
        (!model || metric.model === model)
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Generate performance report
  generateReport(hours: number = 24): {
    summary: {
      totalRequests: number;
      successRate: number;
      avgResponseTime: number;
      totalCost: number;
      jsonParseRate: number;
    };
    byService: Record<string, {
      requests: number;
      successRate: number;
      avgResponseTime: number;
      cost: number;
    }>;
    byModel: Record<string, {
      requests: number;
      successRate: number;
      avgResponseTime: number;
      cost: number;
    }>;
  } {
    const metrics = this.getRecentMetrics(undefined, undefined, hours);
    
    if (metrics.length === 0) {
      return {
        summary: { totalRequests: 0, successRate: 0, avgResponseTime: 0, totalCost: 0, jsonParseRate: 0 },
        byService: {},
        byModel: {}
      };
    }

    // Summary calculations
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const successRate = (successfulRequests / totalRequests) * 100;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / totalRequests;
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const jsonParseableRequests = metrics.filter(m => m.jsonParseable).length;
    const jsonParseRate = (jsonParseableRequests / totalRequests) * 100;

    // By service breakdown
    const byService: Record<string, any> = {};
    const services = Array.from(new Set(metrics.map(m => m.service)));
    
    services.forEach(service => {
      const serviceMetrics = metrics.filter(m => m.service === service);
      const serviceSuccessful = serviceMetrics.filter(m => m.success).length;
      
      byService[service] = {
        requests: serviceMetrics.length,
        successRate: (serviceSuccessful / serviceMetrics.length) * 100,
        avgResponseTime: serviceMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / serviceMetrics.length,
        cost: serviceMetrics.reduce((sum, m) => sum + m.cost, 0)
      };
    });

    // By model breakdown  
    const byModel: Record<string, any> = {};
    const models = Array.from(new Set(metrics.map(m => m.model)));
    
    models.forEach(model => {
      const modelMetrics = metrics.filter(m => m.model === model);
      const modelSuccessful = modelMetrics.filter(m => m.success).length;
      
      byModel[model] = {
        requests: modelMetrics.length,
        successRate: (modelSuccessful / modelMetrics.length) * 100,
        avgResponseTime: modelMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / modelMetrics.length,
        cost: modelMetrics.reduce((sum, m) => sum + m.cost, 0)
      };
    });

    return {
      summary: {
        totalRequests,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalCost: Math.round(totalCost * 10000) / 10000,
        jsonParseRate: Math.round(jsonParseRate * 100) / 100
      },
      byService,
      byModel
    };
  }

  // A/B Test comparison report
  generateABTestReport(hours: number = 24): {
    controlGroup: any;
    testGroup: any;
    comparison: {
      responseTimeDiff: number;
      successRateDiff: number;
      costDiff: number;
      jsonParseRateDiff: number;
    };
  } {
    const metrics = this.getRecentMetrics(undefined, undefined, hours);
    const controlMetrics = metrics.filter(m => m.abTestGroup === 'control');
    const testMetrics = metrics.filter(m => m.abTestGroup === 'test');

    const analyzeGroup = (groupMetrics: AIPerformanceMetrics[]) => {
      if (groupMetrics.length === 0) {
        return { requests: 0, successRate: 0, avgResponseTime: 0, avgCost: 0, jsonParseRate: 0 };
      }

      const successful = groupMetrics.filter(m => m.success).length;
      const jsonParseable = groupMetrics.filter(m => m.jsonParseable).length;

      return {
        requests: groupMetrics.length,
        successRate: (successful / groupMetrics.length) * 100,
        avgResponseTime: groupMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / groupMetrics.length,
        avgCost: groupMetrics.reduce((sum, m) => sum + m.cost, 0) / groupMetrics.length,
        jsonParseRate: (jsonParseable / groupMetrics.length) * 100
      };
    };

    const controlGroup = analyzeGroup(controlMetrics);
    const testGroup = analyzeGroup(testMetrics);

    const comparison = {
      responseTimeDiff: testGroup.avgResponseTime - controlGroup.avgResponseTime,
      successRateDiff: testGroup.successRate - controlGroup.successRate,
      costDiff: testGroup.avgCost - controlGroup.avgCost,
      jsonParseRateDiff: testGroup.jsonParseRate - controlGroup.jsonParseRate
    };

    return { controlGroup, testGroup, comparison };
  }

  // Periodic flush to prevent memory buildup (in production, would persist to database)
  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      const report = this.generateReport(1); // Last hour report
      console.log(`[AI-Monitor] Hourly Report - Requests: ${report.summary.totalRequests}, Success: ${report.summary.successRate}%, Avg Response: ${report.summary.avgResponseTime}ms, Cost: $${report.summary.totalCost}`);

      // In production, would persist buffers to database here
      // For now, just log the summary
      if (performanceBuffer.length > 5000) {
        performanceBuffer.splice(0, 2500); // Remove oldest half
      }
    }, FLUSH_INTERVAL);
  }

  // Cleanup
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// Export singleton instance
export const aiPerformanceMonitor = AIPerformanceMonitor.getInstance();

// Helper function to wrap AI calls with monitoring
export const monitorAICall = async <T>(
  config: {
    service: string;
    model: string;
    userId: string;
    abTestGroup?: 'control' | 'test';
    inputTokens?: number;
    costPerInputToken?: number;
    costPerOutputToken?: number;
  },
  aiCall: () => Promise<T>
): Promise<T> => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    const result = await aiCall();
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    // Try to extract token count and validate JSON from result
    let outputTokens = 0;
    let jsonParseable = true;
    let contentLength = 0;

    if (typeof result === 'string') {
      contentLength = result.length;
      outputTokens = Math.ceil(contentLength / 4); // Rough token estimate
      try {
        JSON.parse(result);
      } catch {
        jsonParseable = false;
      }
    } else if (result && typeof result === 'object') {
      const resultStr = JSON.stringify(result);
      contentLength = resultStr.length;
      outputTokens = Math.ceil(resultStr.length / 4);
    }

    const inputTokens = config.inputTokens || 0;
    const totalTokens = inputTokens + outputTokens;
    const cost = (inputTokens * (config.costPerInputToken || 0)) + 
                 (outputTokens * (config.costPerOutputToken || 0));

    aiPerformanceMonitor.recordMetrics({
      requestId,
      userId: config.userId,
      service: config.service,
      model: config.model,
      startTime,
      endTime,
      responseTimeMs,
      inputTokens,
      outputTokens,
      totalTokens,
      cost,
      success: true,
      jsonParseable,
      contentLength,
      abTestGroup: config.abTestGroup,
      timestamp: new Date()
    });

    return result;
  } catch (error) {
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    aiPerformanceMonitor.recordMetrics({
      requestId,
      userId: config.userId,
      service: config.service,
      model: config.model,
      startTime,
      endTime,
      responseTimeMs,
      inputTokens: config.inputTokens || 0,
      outputTokens: 0,
      totalTokens: config.inputTokens || 0,
      cost: 0,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      jsonParseable: false,
      contentLength: 0,
      abTestGroup: config.abTestGroup,
      timestamp: new Date()
    });

    throw error;
  }
};