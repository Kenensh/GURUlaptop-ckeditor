/**
 * 全域功能測試腳本
 * 自動測試所有 API 端點並生成詳細報告
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 測試配置
const TEST_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://gurulaptop-ckeditor.onrender.com'
    : 'http://localhost:3005',
  timeout: 10000,
  retries: 3
}

// 測試結果收集器
class TestReporter {
  constructor() {
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: [],
        startTime: new Date(),
        endTime: null
      },
      modules: {}
    }
  }

  addModuleResult(moduleName, tests) {
    this.results.modules[moduleName] = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'PASS').length,
      failed: tests.filter(t => t.status === 'FAIL').length,
      tests: tests
    }
    
    this.results.summary.total += tests.length
    this.results.summary.passed += tests.filter(t => t.status === 'PASS').length
    this.results.summary.failed += tests.filter(t => t.status === 'FAIL').length
  }

  addError(error) {
    this.results.summary.errors.push(error)
  }

  generateReport() {
    this.results.summary.endTime = new Date()
    const duration = this.results.summary.endTime - this.results.summary.startTime
    
    let report = `
# 🔍 全域功能測試報告
生成時間: ${this.results.summary.endTime.toLocaleString()}
測試時長: ${Math.round(duration / 1000)}秒

## 📊 測試摘要
- 總測試數: ${this.results.summary.total}
- 通過: ${this.results.summary.passed} ✅
- 失敗: ${this.results.summary.failed} ❌
- 成功率: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%

## 📋 模組測試結果

`

    // 按失敗數量排序模組
    const sortedModules = Object.entries(this.results.modules)
      .sort(([,a], [,b]) => b.failed - a.failed)

    for (const [moduleName, moduleResult] of sortedModules) {
      const status = moduleResult.failed === 0 ? '✅' : '❌'
      report += `### ${status} ${moduleName.toUpperCase()}
- 通過: ${moduleResult.passed}/${moduleResult.total}
- 失敗: ${moduleResult.failed}

`
      
      // 列出失敗的測試
      const failedTests = moduleResult.tests.filter(t => t.status === 'FAIL')
      if (failedTests.length > 0) {
        report += `#### ❌ 失敗的測試:\n`
        failedTests.forEach(test => {
          report += `- **${test.name}**: ${test.error}\n`
        })
        report += '\n'
      }
    }

    // 系統錯誤
    if (this.results.summary.errors.length > 0) {
      report += `## 🚨 系統錯誤\n`
      this.results.summary.errors.forEach(error => {
        report += `- ${error}\n`
      })
    }

    // 批量修改建議
    report += this.generateFixSuggestions()

    return report
  }

  generateFixSuggestions() {
    let suggestions = `\n## 🔧 批量修改建議\n\n`
    
    const failedModules = Object.entries(this.results.modules)
      .filter(([,result]) => result.failed > 0)
      .sort(([,a], [,b]) => b.failed - a.failed)

    if (failedModules.length === 0) {
      suggestions += `🎉 所有功能都正常工作！\n`
      return suggestions
    }

    suggestions += `### 優先級修改順序:\n\n`
    
    failedModules.forEach(([moduleName, result], index) => {
      suggestions += `${index + 1}. **${moduleName}** (${result.failed} 個錯誤)\n`
      
      const commonErrors = this.analyzeCommonErrors(result.tests)
      if (commonErrors.length > 0) {
        suggestions += `   - 常見問題: ${commonErrors.join(', ')}\n`
      }
      suggestions += '\n'
    })

    return suggestions
  }

  analyzeCommonErrors(tests) {
    const errors = tests.filter(t => t.status === 'FAIL').map(t => t.error)
    const errorPatterns = {
      '網路錯誤': errors.filter(e => e.includes('ECONNREFUSED') || e.includes('timeout')).length,
      '認證錯誤': errors.filter(e => e.includes('401') || e.includes('unauthorized')).length,
      '資料庫錯誤': errors.filter(e => e.includes('database') || e.includes('query')).length,
      '參數錯誤': errors.filter(e => e.includes('400') || e.includes('validation')).length,
      '內部錯誤': errors.filter(e => e.includes('500') || e.includes('internal')).length
    }
    
    return Object.entries(errorPatterns)
      .filter(([,count]) => count > 0)
      .sort(([,a], [,b]) => b - a)
      .map(([pattern]) => pattern)
  }
}

// API 測試器
class APITester {
  constructor(baseURL) {
    this.axios = axios.create({
      baseURL,
      timeout: TEST_CONFIG.timeout,
      validateStatus: () => true // 接受所有狀態碼
    })
    this.authToken = null
  }

  async authenticate() {
    try {
      const response = await this.axios.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'test123'
      })
      
      if (response.data.data?.token) {
        this.authToken = response.data.data.token
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${this.authToken}`
        return true
      }
      return false
    } catch (error) {
      console.log('認證失敗，將使用無認證模式測試')
      return false
    }
  }

  async testEndpoint(method, url, data = null, expectedStatus = [200, 201]) {
    try {
      const config = {
        method: method.toLowerCase(),
        url
      }
      
      if (data) {
        if (method.toUpperCase() === 'GET') {
          config.params = data
        } else {
          config.data = data
        }
      }

      const response = await this.axios(config)
      
      const isSuccess = Array.isArray(expectedStatus) 
        ? expectedStatus.includes(response.status)
        : response.status === expectedStatus

      return {
        status: isSuccess ? 'PASS' : 'FAIL',
        statusCode: response.status,
        responseTime: response.config.metadata?.endTime - response.config.metadata?.startTime || 0,
        error: isSuccess ? null : `預期狀態 ${expectedStatus}, 實際 ${response.status}`,
        data: response.data
      }
    } catch (error) {
      return {
        status: 'FAIL',
        statusCode: null,
        responseTime: 0,
        error: error.message,
        data: null
      }
    }
  }
}

// 測試定義
const TEST_DEFINITIONS = {
  auth: [
    {
      name: '檢查認證狀態',
      method: 'GET',
      url: '/api/auth/check',
      expectedStatus: [200, 401]
    },
    {
      name: '登入功能',
      method: 'POST',
      url: '/api/auth/login',
      data: { email: 'test@example.com', password: 'test123' },
      expectedStatus: [200, 401]
    }
  ],
  
  blog: [
    {
      name: '獲取部落格列表',
      method: 'GET',
      url: '/api/blog',
      expectedStatus: [200]
    },
    {
      name: '搜尋部落格',
      method: 'GET',
      url: '/api/blog/search',
      data: { search: 'test', page: 1, limit: 6 },
      expectedStatus: [200]
    },
    {
      name: '獲取部落格詳情',
      method: 'GET',
      url: '/api/blog/blog-detail/1',
      expectedStatus: [200, 404]
    }
  ],

  users: [
    {
      name: '獲取用戶列表',
      method: 'GET',
      url: '/api/users',
      expectedStatus: [200, 401]
    },
    {
      name: '獲取用戶資料',
      method: 'GET',
      url: '/api/users/profile',
      expectedStatus: [200, 401]
    }
  ],

  products: [
    {
      name: '獲取商品列表',
      method: 'GET',
      url: '/api/products',
      expectedStatus: [200]
    },
    {
      name: '搜尋商品',
      method: 'GET',
      url: '/api/products/search',
      data: { keyword: 'laptop' },
      expectedStatus: [200]
    },
    {
      name: '獲取商品詳情',
      method: 'GET',
      url: '/api/products/1',
      expectedStatus: [200, 404]
    }
  ],

  cart: [
    {
      name: '獲取購物車',
      method: 'GET',
      url: '/api/cart',
      expectedStatus: [200, 401]
    },
    {
      name: '加入購物車',
      method: 'POST',
      url: '/api/cart',
      data: { product_id: 1, quantity: 1 },
      expectedStatus: [200, 401, 400]
    }
  ],

  order: [
    {
      name: '獲取訂單列表',
      method: 'GET',
      url: '/api/order',
      expectedStatus: [200, 401]
    },
    {
      name: '獲取訂單詳情',
      method: 'GET',
      url: '/api/order/1',
      expectedStatus: [200, 401, 404]
    }
  ],

  events: [
    {
      name: '獲取活動列表',
      method: 'GET',
      url: '/api/events',
      expectedStatus: [200]
    },
    {
      name: '獲取活動詳情',
      method: 'GET',
      url: '/api/events/1',
      expectedStatus: [200, 404]
    },
    {
      name: '活動報名',
      method: 'POST',
      url: '/api/events/1/register',
      data: { user_id: 1 },
      expectedStatus: [200, 401, 400]
    }
  ],

  coupon: [
    {
      name: '獲取優惠券列表',
      method: 'GET',
      url: '/api/coupon',
      expectedStatus: [200]
    },
    {
      name: '領取優惠券',
      method: 'POST',
      url: '/api/coupon/claim',
      data: { coupon_id: 1 },
      expectedStatus: [200, 401, 400]
    }
  ],

  chat: [
    {
      name: '獲取聊天室列表',
      method: 'GET',
      url: '/api/chat/rooms',
      expectedStatus: [200, 401]
    },
    {
      name: '獲取聊天訊息',
      method: 'GET',
      url: '/api/chat/rooms/1/messages',
      expectedStatus: [200, 401, 404]
    }
  ],

  ecpay: [
    {
      name: '測試支付狀態',
      method: 'GET',
      url: '/api/ecpay/status',
      expectedStatus: [200]
    }
  ]
}

// 主測試執行器
async function runAllTests() {
  console.log('🚀 開始全域功能測試...')
  
  const reporter = new TestReporter()
  const tester = new APITester(TEST_CONFIG.baseURL)
  
  // 嘗試認證
  console.log('🔑 嘗試認證...')
  const isAuthenticated = await tester.authenticate()
  console.log(isAuthenticated ? '✅ 認證成功' : '⚠️ 未認證模式')

  // 執行所有模組測試
  for (const [moduleName, tests] of Object.entries(TEST_DEFINITIONS)) {
    console.log(`\n📦 測試模組: ${moduleName}`)
    const moduleResults = []
    
    for (const test of tests) {
      process.stdout.write(`  ⏳ ${test.name}... `)
      
      const result = await tester.testEndpoint(
        test.method,
        test.url,
        test.data,
        test.expectedStatus
      )
      
      moduleResults.push({
        name: test.name,
        ...result
      })
      
      console.log(result.status === 'PASS' ? '✅' : '❌')
      if (result.status === 'FAIL') {
        console.log(`    錯誤: ${result.error}`)
      }
    }
    
    reporter.addModuleResult(moduleName, moduleResults)
  }

  // 生成報告
  console.log('\n📊 生成測試報告...')
  const report = reporter.generateReport()
  
  // 儲存報告
  const reportPath = path.join(__dirname, 'test-report.md')
  fs.writeFileSync(reportPath, report)
  
  console.log(`\n✅ 測試完成！報告已儲存至: ${reportPath}`)
  console.log(`📊 結果: ${reporter.results.summary.passed}/${reporter.results.summary.total} 通過`)
  
  return reporter.results
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}

export { runAllTests, TestReporter, APITester }
