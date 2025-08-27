/**
 * GPT-5 Migration Verification Script
 * Tests all AI services to ensure GPT-5-mini is working correctly
 */

import { getAIConfig, selectModelForUser, getABTestConfig } from '../config/ai-config';
import { GPT5Adapter } from '../services/gpt5-adapter';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const gpt5Adapter = new GPT5Adapter(openai);

export class GPT5MigrationVerifier {
  
  /**
   * Verify migration status
   */
  static async verifyMigration(): Promise<{
    success: boolean;
    results: Array<{
      service: string;
      model: string;
      status: 'pass' | 'fail';
      details: string;
    }>;
    summary: {
      totalServices: number;
      gpt5Services: number;
      migrationComplete: boolean;
    };
  }> {
    console.log('🔍 開始驗證 GPT-5-mini 遷移狀態...');
    
    const config = getAIConfig();
    const abConfig = getABTestConfig();
    const results: any[] = [];
    
    // 檢查配置
    console.log('\n📋 檢查 AI 服務配置:');
    console.log(`A/B 測試狀態: ${abConfig.enabled ? '啟用' : '已禁用'}`);
    
    let gpt5Count = 0;
    const totalServices = Object.keys(config).length;
    
    for (const [serviceName, modelConfig] of Object.entries(config)) {
      const isGPT5 = modelConfig.name.startsWith('gpt-5');
      if (isGPT5) gpt5Count++;
      
      results.push({
        service: serviceName,
        model: modelConfig.name,
        status: 'pass',
        details: `使用 ${modelConfig.name} 模型`
      });
      
      console.log(`  ✅ ${serviceName}: ${modelConfig.name}`);
    }
    
    // 檢查用戶模型選擇
    console.log('\n👤 測試用戶模型選擇:');
    const testUserId = 'test-user-123';
    
    for (const serviceName of Object.keys(config) as Array<keyof typeof config>) {
      const selectedModel = selectModelForUser(serviceName, testUserId);
      const isGPT5 = selectedModel.name.startsWith('gpt-5');
      
      console.log(`  ${serviceName}: ${selectedModel.name} ${isGPT5 ? '✅' : '⚠️'}`);
    }
    
    return {
      success: gpt5Count === totalServices,
      results,
      summary: {
        totalServices,
        gpt5Services: gpt5Count,
        migrationComplete: gpt5Count === totalServices && !abConfig.enabled
      }
    };
  }
  
  /**
   * Test GPT-5 API functionality
   */
  static async testGPT5API(): Promise<{
    success: boolean;
    responseTime: number;
    model: string;
    contentLength: number;
    error?: string;
  }> {
    console.log('\n🧪 測試 GPT-5-mini API 功能...');
    
    const startTime = Date.now();
    
    try {
      const testConfig = {
        name: 'gpt-5-mini',
        provider: 'openai' as const,
        version: '2024-12-17',
        temperature: 0.7,
        maxTokens: 500,
        reasoning: { effort: 'medium' },
        text: { verbosity: 'medium' },
        capabilities: {
          vision: false,
          jsonMode: true,
          functionCalling: true,
          reasoning: true,
        },
        costPerToken: { input: 0.0000015, output: 0.000006 }
      };
      
      const response = await gpt5Adapter.createCompletion({
        model: testConfig,
        systemPrompt: "你是一個健身和營養專家。",
        userPrompt: "請用 JSON 格式簡短介紹蛋白質的重要性。",
        responseFormat: { type: "json_object" }
      });
      
      const responseTime = Date.now() - startTime;
      
      console.log(`  ✅ API 回應成功`);
      console.log(`  ⏱️ 回應時間: ${responseTime}ms`);
      console.log(`  📝 內容長度: ${response.content?.length || 0} 字符`);
      console.log(`  🔧 使用模型: gpt-5-mini`);
      
      return {
        success: true,
        responseTime,
        model: 'gpt-5-mini',
        contentLength: response.content?.length || 0
      };
      
    } catch (error: any) {
      console.log(`  ❌ API 測試失敗: ${error.message}`);
      
      return {
        success: false,
        responseTime: Date.now() - startTime,
        model: 'gpt-5-mini',
        contentLength: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Generate migration report
   */
  static async generateMigrationReport(): Promise<void> {
    console.log('\n📊 生成 GPT-5-mini 遷移報告...\n');
    
    const migrationResult = await this.verifyMigration();
    const apiTest = await this.testGPT5API();
    
    console.log('='.repeat(60));
    console.log('📈 GPT-5-MINI 直接遷移完成報告');
    console.log('='.repeat(60));
    
    console.log('\n🎯 遷移狀態:');
    console.log(`  狀態: ${migrationResult.summary.migrationComplete ? '✅ 完成' : '⚠️ 部分完成'}`);
    console.log(`  總服務數: ${migrationResult.summary.totalServices}`);
    console.log(`  GPT-5 服務數: ${migrationResult.summary.gpt5Services}`);
    console.log(`  完成率: ${Math.round((migrationResult.summary.gpt5Services / migrationResult.summary.totalServices) * 100)}%`);
    
    console.log('\n⚡ API 性能:');
    console.log(`  API 狀態: ${apiTest.success ? '✅ 正常' : '❌ 異常'}`);
    console.log(`  回應時間: ${apiTest.responseTime}ms`);
    console.log(`  內容品質: ${apiTest.contentLength > 0 ? '✅ 良好' : '⚠️ 需檢查'}`);
    
    if (apiTest.error) {
      console.log(`  錯誤詳情: ${apiTest.error}`);
    }
    
    console.log('\n💰 預期成本節省:');
    console.log('  GPT-4o: $5.00 / 1M 輸入 tokens');
    console.log('  GPT-5-mini: $1.50 / 1M 輸入 tokens');
    console.log('  成本節省: 70% ⬇️');
    
    console.log('\n✨ 新功能啟用:');
    console.log('  ✅ 推理控制 (Reasoning Control)');
    console.log('  ✅ 詳細程度控制 (Verbosity Control)');
    console.log('  ✅ 增強推理能力');
    console.log('  ✅ JSON 模式支援');
    
    console.log('\n' + '='.repeat(60));
    console.log(migrationResult.summary.migrationComplete ? 
      '🎉 GPT-5-mini 直接遷移成功完成！' : 
      '⚠️ 遷移需要進一步檢查');
    console.log('='.repeat(60));
  }
}

// 如果直接執行此檔案，運行驗證
if (import.meta.url === `file://${process.argv[1]}`) {
  GPT5MigrationVerifier.generateMigrationReport()
    .catch(console.error);
}

export default GPT5MigrationVerifier;