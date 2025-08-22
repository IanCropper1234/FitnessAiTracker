// AI Monitoring Dashboard and Baseline Metrics API
// Provides endpoints for tracking AI performance during migration

import { Router } from 'express';
import { aiPerformanceMonitor } from '../services/ai-performance-monitor';
import { promptRegistry, getCurrentBaselineMetrics } from '../services/ai-prompt-registry';
import { AI_CONFIG, AB_TEST_CONFIG } from '../config/ai-config';

const router = Router();

// Get current AI configuration
router.get('/config', (req, res) => {
  try {
    res.json({
      aiConfig: AI_CONFIG,
      abTestConfig: AB_TEST_CONFIG,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching AI config:', error);
    res.status(500).json({ message: 'Failed to fetch AI configuration' });
  }
});

// Get performance metrics dashboard
router.get('/performance', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const service = req.query.service as string;
    const model = req.query.model as string;

    const report = aiPerformanceMonitor.generateReport(hours);
    const recentMetrics = aiPerformanceMonitor.getRecentMetrics(service, model, hours);

    res.json({
      timeframe: `${hours} hours`,
      report,
      recentMetrics: recentMetrics.slice(0, 50), // Last 50 requests
      filters: { service, model },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({ message: 'Failed to generate performance report' });
  }
});

// Get A/B test comparison report
router.get('/ab-test-report', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const report = aiPerformanceMonitor.generateABTestReport(hours);

    res.json({
      timeframe: `${hours} hours`,
      abTestConfig: AB_TEST_CONFIG,
      comparison: report,
      recommendations: generateABTestRecommendations(report),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating A/B test report:', error);
    res.status(500).json({ message: 'Failed to generate A/B test report' });
  }
});

// Get baseline metrics for current GPT-4o performance
router.get('/baseline', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 168; // Default 1 week
    
    // Get current performance metrics
    const performanceReport = aiPerformanceMonitor.generateReport(hours);
    
    // Get prompt templates and their current status
    const promptBaselines = getCurrentBaselineMetrics();
    
    // Generate baseline summary
    const baseline = {
      recordingPeriod: `${hours} hours`,
      performance: performanceReport,
      prompts: promptBaselines,
      modelConfigurations: AI_CONFIG,
      recommendations: generateBaselineRecommendations(performanceReport),
      timestamp: new Date().toISOString()
    };

    res.json(baseline);
  } catch (error) {
    console.error('Error generating baseline report:', error);
    res.status(500).json({ message: 'Failed to generate baseline report' });
  }
});

// Get all prompt templates for documentation
router.get('/prompts', (req, res) => {
  try {
    const service = req.query.service as string;
    
    if (service) {
      const prompt = promptRegistry.getPrompt(service);
      if (!prompt) {
        return res.status(404).json({ message: `Prompt for service '${service}' not found` });
      }
      res.json(prompt);
    } else {
      const allPrompts = promptRegistry.getAllPrompts();
      res.json(allPrompts);
    }
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: 'Failed to fetch prompt templates' });
  }
});

// Export prompt templates for backup/documentation
router.get('/prompts/export', (req, res) => {
  try {
    const exportData = promptRegistry.exportPrompts();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ai-prompts-backup.json');
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting prompts:', error);
    res.status(500).json({ message: 'Failed to export prompt templates' });
  }
});

// Health check for monitoring systems
router.get('/health', (req, res) => {
  try {
    const recentMetrics = aiPerformanceMonitor.getRecentMetrics(undefined, undefined, 1);
    const promptCount = Object.keys(promptRegistry.getAllPrompts()).length;
    
    const healthStatus = {
      status: 'healthy',
      monitoring: {
        performanceMonitor: 'active',
        promptRegistry: 'active',
        recentRequests: recentMetrics.length,
        promptTemplates: promptCount
      },
      configuration: {
        aiConfig: 'loaded',
        abTesting: AB_TEST_CONFIG.enabled ? 'enabled' : 'disabled'
      },
      timestamp: new Date().toISOString()
    };

    res.json(healthStatus);
  } catch (error) {
    console.error('Error checking monitoring health:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate A/B test recommendations
function generateABTestRecommendations(report: any): string[] {
  const recommendations: string[] = [];
  const { controlGroup, testGroup, comparison } = report;

  if (testGroup.requests === 0) {
    recommendations.push('No test group data available - ensure A/B testing is properly configured');
    return recommendations;
  }

  if (comparison.responseTimeDiff < -50) {
    recommendations.push(`Test model is ${Math.abs(comparison.responseTimeDiff)}ms faster - positive performance indicator`);
  } else if (comparison.responseTimeDiff > 100) {
    recommendations.push(`Test model is ${comparison.responseTimeDiff}ms slower - consider optimization`);
  }

  if (comparison.successRateDiff < -2) {
    recommendations.push(`Test model success rate is ${Math.abs(comparison.successRateDiff).toFixed(1)}% lower - investigate failure causes`);
  } else if (comparison.successRateDiff > 2) {
    recommendations.push(`Test model success rate is ${comparison.successRateDiff.toFixed(1)}% higher - positive reliability indicator`);
  }

  if (comparison.costDiff < 0) {
    const costSavings = Math.abs(comparison.costDiff * 1000000).toFixed(2);
    recommendations.push(`Test model saves $${costSavings} per million tokens - significant cost benefit`);
  }

  if (comparison.jsonParseRateDiff < -1) {
    recommendations.push(`Test model JSON parse rate is ${Math.abs(comparison.jsonParseRateDiff).toFixed(1)}% lower - may need prompt optimization`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance metrics are within acceptable variance ranges');
  }

  return recommendations;
}

// Generate baseline recommendations
function generateBaselineRecommendations(report: any): string[] {
  const recommendations: string[] = [];
  const { summary } = report;

  if (summary.successRate < 95) {
    recommendations.push(`Current success rate is ${summary.successRate}% - consider investigating failure patterns`);
  }

  if (summary.avgResponseTime > 3000) {
    recommendations.push(`Average response time is ${summary.avgResponseTime}ms - optimization recommended for user experience`);
  }

  if (summary.jsonParseRate < 98) {
    recommendations.push(`JSON parse rate is ${summary.jsonParseRate}% - prompt optimization may be needed`);
  }

  if (summary.totalCost > 1.0) {
    recommendations.push(`Daily cost is $${summary.totalCost.toFixed(4)} - monitor cost trends during migration`);
  }

  recommendations.push('Baseline metrics recorded successfully - ready for migration comparison');
  
  return recommendations;
}

export default router;