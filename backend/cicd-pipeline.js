/**
 * CI/CD 自動化腳本
 * 用於連續整合和部署時的自動測試
 */

import { runAllTests } from './test-automation.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CI/CD 配置
const CICD_CONFIG = {
  failThreshold: 0.8, // 成功率低於 80% 就失敗
  criticalModules: ['auth', 'users'], // 關鍵模組必須 100% 通過
  reportFormats: ['markdown', 'json'],
  notifications: {
    webhook: process.env.WEBHOOK_URL,
    email: process.env.NOTIFICATION_EMAIL
  }
}

class CICDPipeline {
  constructor() {
    this.startTime = new Date()
    this.results = null
  }

  async run() {
    console.log('🔄 CI/CD 管道開始執行...')
    
    try {
      // 執行全域測試
      this.results = await runAllTests()
      
      // 分析結果
      const analysis = this.analyzeResults()
      
      // 生成報告
      await this.generateReports(analysis)
      
      // 發送通知
      await this.sendNotifications(analysis)
      
      // 決定部署狀態
      const shouldDeploy = this.shouldDeploy(analysis)
      
      console.log(`\n🏁 CI/CD 管道完成`)
      console.log(`部署決策: ${shouldDeploy ? '✅ 通過部署' : '❌ 阻止部署'}`)
      
      return {
        success: shouldDeploy,
        analysis,
        results: this.results
      }
      
    } catch (error) {
      console.error('❌ CI/CD 管道執行失敗:', error)
      await this.handleFailure(error)
      return { success: false, error: error.message }
    }
  }

  analyzeResults() {
    const { summary, modules } = this.results
    const successRate = summary.passed / summary.total
    
    // 分析關鍵模組
    const criticalModuleStatus = {}
    for (const moduleName of CICD_CONFIG.criticalModules) {
      if (modules[moduleName]) {
        const module = modules[moduleName]
        criticalModuleStatus[moduleName] = {
          passed: module.failed === 0,
          successRate: module.passed / module.total
        }
      }
    }

    // 找出最需要修復的模組
    const failedModules = Object.entries(modules)
      .filter(([,module]) => module.failed > 0)
      .sort(([,a], [,b]) => b.failed - a.failed)
      .slice(0, 5) // 前5個最嚴重的

    return {
      overallSuccess: successRate >= CICD_CONFIG.failThreshold,
      successRate,
      criticalModulesPass: Object.values(criticalModuleStatus).every(m => m.passed),
      criticalModuleStatus,
      failedModules: failedModules.map(([name, module]) => ({
        name,
        failedCount: module.failed,
        totalCount: module.total,
        successRate: module.passed / module.total
      })),
      recommendation: this.generateRecommendation(successRate, criticalModuleStatus, failedModules)
    }
  }

  generateRecommendation(successRate, criticalStatus, failedModules) {
    if (successRate >= 0.95) {
      return '🎉 系統狀態優良，可以安全部署'
    }
    
    if (successRate >= 0.8) {
      return '⚠️ 系統狀態一般，建議修復後部署'
    }
    
    if (Object.values(criticalStatus).some(m => !m.passed)) {
      return '🚨 關鍵模組有問題，必須修復後才能部署'
    }
    
    if (failedModules.length > 0) {
      const topModule = failedModules[0]
      return `🔧 優先修復 ${topModule.name} 模組 (${topModule.failedCount} 個錯誤)`
    }
    
    return '🔍 需要詳細調查問題原因'
  }

  shouldDeploy(analysis) {
    return analysis.overallSuccess && analysis.criticalModulesPass
  }

  async generateReports(analysis) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    
    // 生成 Markdown 報告
    if (CICD_CONFIG.reportFormats.includes('markdown')) {
      const mdReport = this.generateMarkdownReport(analysis)
      const mdPath = path.join(__dirname, `cicd-report-${timestamp}.md`)
      fs.writeFileSync(mdPath, mdReport)
      console.log(`📄 Markdown 報告: ${mdPath}`)
    }
    
    // 生成 JSON 報告  
    if (CICD_CONFIG.reportFormats.includes('json')) {
      const jsonReport = {
        timestamp: new Date(),
        analysis,
        results: this.results,
        config: CICD_CONFIG
      }
      const jsonPath = path.join(__dirname, `cicd-report-${timestamp}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))
      console.log(`📊 JSON 報告: ${jsonPath}`)
    }

    // 生成修復指南
    const fixGuide = this.generateFixGuide(analysis)
    const guidePath = path.join(__dirname, `fix-guide-${timestamp}.md`)
    fs.writeFileSync(guidePath, fixGuide)
    console.log(`🔧 修復指南: ${guidePath}`)
  }

  generateMarkdownReport(analysis) {
    const { results } = this
    return `
# 🔄 CI/CD 自動測試報告

**執行時間**: ${new Date().toLocaleString()}  
**總體狀態**: ${analysis.overallSuccess ? '✅ 通過' : '❌ 失敗'}  
**成功率**: ${(analysis.successRate * 100).toFixed(2)}%  
**部署建議**: ${analysis.recommendation}

## 📊 測試概覽

- **總測試數**: ${results.summary.total}
- **通過**: ${results.summary.passed} ✅
- **失敗**: ${results.summary.failed} ❌
- **關鍵模組狀態**: ${analysis.criticalModulesPass ? '✅ 正常' : '❌ 異常'}

## 🎯 關鍵模組狀態

${Object.entries(analysis.criticalModuleStatus).map(([name, status]) => 
  `- **${name}**: ${status.passed ? '✅' : '❌'} (${(status.successRate * 100).toFixed(1)}%)`
).join('\n')}

## ⚠️ 需要修復的模組

${analysis.failedModules.length === 0 ? '🎉 所有模組都正常！' : 
  analysis.failedModules.map((module, index) => 
    `${index + 1}. **${module.name}** - ${module.failedCount}/${module.totalCount} 失敗 (${(module.successRate * 100).toFixed(1)}% 成功率)`
  ).join('\n')
}

## 🚀 部署決策

${analysis.overallSuccess && analysis.criticalModulesPass ? 
  '✅ **建議部署** - 所有條件都滿足' : 
  '❌ **暫停部署** - 需要修復問題後再部署'
}

---
*此報告由 CI/CD 自動化系統生成*
`
  }

  generateFixGuide(analysis) {
    if (analysis.failedModules.length === 0) {
      return `# 🎉 系統狀態良好\n\n所有功能都正常工作，無需修復。`
    }

    return `
# 🔧 批量修復指南

根據測試結果，按以下優先級修復問題：

## 🎯 修復優先級

${analysis.failedModules.map((module, index) => `
### ${index + 1}. ${module.name.toUpperCase()} 模組
- **失敗率**: ${module.failedCount}/${module.totalCount}
- **修復優先級**: ${index === 0 ? '🔴 極高' : index === 1 ? '🟡 高' : '🟢 中'}
- **建議修復時間**: ${index === 0 ? '立即' : index === 1 ? '24小時內' : '本週內'}

**常見問題檢查清單**:
${this.getModuleCheckList(module.name)}
`).join('\n')}

## ⚡ 快速修復腳本

\`\`\`bash
# 1. 檢查服務狀態
npm run test:${analysis.failedModules[0]?.name || 'all'}

# 2. 重啟相關服務
npm run dev

# 3. 重新測試
npm run cicd:test
\`\`\`

## 📞 支援聯絡

如果問題持續存在，請聯絡開發團隊並提供此報告。
`
  }

  getModuleCheckList(moduleName) {
    const checklists = {
      auth: `- [ ] 檢查 JWT Token 設定
- [ ] 驗證資料庫連接
- [ ] 確認密碼加密功能
- [ ] 檢查 Cookie 設定`,
      
      users: `- [ ] 檢查用戶表結構
- [ ] 驗證 CRUD 操作
- [ ] 確認權限設定
- [ ] 檢查資料驗證`,
      
      products: `- [ ] 檢查商品資料完整性
- [ ] 驗證搜尋功能
- [ ] 確認庫存計算
- [ ] 檢查圖片路徑`,
      
      cart: `- [ ] 檢查購物車邏輯
- [ ] 驗證商品加總
- [ ] 確認用戶關聯
- [ ] 檢查庫存扣減`,
      
      order: `- [ ] 檢查訂單流程
- [ ] 驗證支付整合
- [ ] 確認狀態更新
- [ ] 檢查通知功能`
    }
    
    return checklists[moduleName] || `- [ ] 檢查 API 端點
- [ ] 驗證資料格式
- [ ] 確認錯誤處理
- [ ] 檢查日誌記錄`
  }

  async sendNotifications(analysis) {
    const message = `
🔄 CI/CD 測試完成
成功率: ${(analysis.successRate * 100).toFixed(2)}%
部署狀態: ${analysis.overallSuccess && analysis.criticalModulesPass ? '✅ 通過' : '❌ 失敗'}
${analysis.failedModules.length > 0 ? `需要修復: ${analysis.failedModules.map(m => m.name).join(', ')}` : ''}
`
    
    console.log('📢 發送通知...')
    console.log(message)
    
    // 這裡可以整合 Discord, Slack, Email 等通知服務
    // 例如: await this.sendDiscordNotification(message)
  }

  async handleFailure(error) {
    const errorReport = `
# ❌ CI/CD 管道執行失敗

**時間**: ${new Date().toLocaleString()}
**錯誤**: ${error.message}
**堆疊**: 
\`\`\`
${error.stack}
\`\`\`

請檢查系統狀態並重新執行測試。
`
    
    const errorPath = path.join(__dirname, `cicd-error-${Date.now()}.md`)
    fs.writeFileSync(errorPath, errorReport)
    console.log(`❌ 錯誤報告: ${errorPath}`)
  }
}

// 主執行函數
async function runCICD() {
  const pipeline = new CICDPipeline()
  const result = await pipeline.run()
  
  // 設定退出碼 (用於 CI/CD 系統)
  process.exitCode = result.success ? 0 : 1
  
  return result
}

// 如果直接執行
if (import.meta.url === `file://${process.argv[1]}`) {
  runCICD().catch(console.error)
}

export { runCICD, CICDPipeline }
