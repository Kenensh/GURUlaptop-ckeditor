import axios from 'axios'
import fs from 'fs'

console.log('🔧 開始 Blog 功能系統性檢測與修復...')

const baseURL = 'http://localhost:3005'

// 系統性測試所有 Blog 端點
const blogEndpoints = [
  // GET 端點
  { method: 'GET', path: '/api/blog/search', name: 'Blog 搜尋', params: '?search=test&page=1&limit=5' },
  { method: 'GET', path: '/api/blog/search', name: 'Blog 搜尋 (無參數)', params: '' },
  { method: 'GET', path: '/api/blog/blog/ckeitor', name: 'CKEditor Blog', params: '' },
  { method: 'GET', path: '/api/blog/blogcardgroup', name: 'Blog 卡片群組', params: '' },
  { method: 'GET', path: '/api/blog/blog-detail/1', name: 'Blog 詳情 (ID:1)', params: '' },
  { method: 'GET', path: '/api/blog/blog-detail/999', name: 'Blog 詳情 (不存在ID)', params: '' },
  { method: 'GET', path: '/api/blog/blog_user_overview/1', name: '用戶 Blog 概覽', params: '' },
  { method: 'GET', path: '/api/blog/blog-comment/1', name: 'Blog 評論', params: '' },
  
  // 測試根路由
  { method: 'GET', path: '/api/blog', name: 'Blog 根路由', params: '' },
  { method: 'GET', path: '/api/blog/', name: 'Blog 根路由 (帶斜線)', params: '' },
]

async function testEndpoint(endpoint) {
  const fullPath = `${endpoint.path}${endpoint.params}`
  const startTime = Date.now()
  
  try {
    let response
    const config = {
      timeout: 5000,
      validateStatus: (status) => status < 600 // 允許 4xx 和 5xx 錯誤通過
    }
    
    if (endpoint.method === 'GET') {
      response = await axios.get(`${baseURL}${fullPath}`, config)
    }
    
    const duration = Date.now() - startTime
    const isSuccess = response.status >= 200 && response.status < 300
    
    return {
      ...endpoint,
      fullPath,
      status: isSuccess ? 'success' : 'http_error',
      statusCode: response.status,
      duration,
      responseSize: JSON.stringify(response.data).length,
      hasData: !!response.data && Object.keys(response.data).length > 0,
      dataStructure: typeof response.data === 'object' ? Object.keys(response.data) : typeof response.data,
      errorMessage: !isSuccess ? `HTTP ${response.status}` : null
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      ...endpoint,
      fullPath,
      status: 'network_error',
      statusCode: error.response?.status || 0,
      duration,
      errorMessage: error.message,
      errorType: error.code || 'UNKNOWN'
    }
  }
}

async function analyzeResults(results) {
  const successful = results.filter(r => r.status === 'success')
  const httpErrors = results.filter(r => r.status === 'http_error')
  const networkErrors = results.filter(r => r.status === 'network_error')
  
  console.log('\n📊 Blog 功能測試結果分析:')
  console.log(`✅ 成功: ${successful.length}`)
  console.log(`⚠️ HTTP 錯誤: ${httpErrors.length}`)
  console.log(`❌ 網路錯誤: ${networkErrors.length}`)
  console.log(`📈 總成功率: ${((successful.length / results.length) * 100).toFixed(1)}%`)
  
  return { successful, httpErrors, networkErrors }
}

async function generateFixSuggestions(results) {
  const issues = []
  const fixes = []
  
  // 分析具體問題
  results.forEach(result => {
    if (result.status !== 'success') {
      if (result.statusCode === 404) {
        issues.push({
          type: 'ROUTE_NOT_FOUND',
          endpoint: result.fullPath,
          priority: 'HIGH',
          description: `路由 ${result.fullPath} 返回 404`
        })
      } else if (result.statusCode >= 500) {
        issues.push({
          type: 'SERVER_ERROR',
          endpoint: result.fullPath,
          priority: 'CRITICAL',
          description: `路由 ${result.fullPath} 服務器錯誤 ${result.statusCode}`
        })
      } else if (result.statusCode >= 400) {
        issues.push({
          type: 'CLIENT_ERROR',
          endpoint: result.fullPath,
          priority: 'MEDIUM',
          description: `路由 ${result.fullPath} 客戶端錯誤 ${result.statusCode}`
        })
      }
    }
  })
  
  // 生成修復建議
  if (issues.some(i => i.type === 'ROUTE_NOT_FOUND' && i.endpoint.includes('/api/blog') && !i.endpoint.includes('/'))) {
    fixes.push({
      priority: 'HIGH',
      title: '添加 Blog 根路由',
      description: '需要在 blog.js 中添加根路由處理',
      code: `
// 在 blog.js 最前面添加
router.get('/', async (req, res) => {
  res.json({
    message: 'Blog API 運行正常',
    version: '1.0.0',
    endpoints: [
      'GET /search - Blog 搜尋',
      'GET /blogcardgroup - Blog 卡片群組',
      'GET /blog-detail/:id - Blog 詳情',
      'POST /blog-created - 創建 Blog',
      // 更多端點...
    ]
  })
})
`
    })
  }
  
  if (issues.some(i => i.type === 'SERVER_ERROR')) {
    fixes.push({
      priority: 'CRITICAL',
      title: '修復服務器錯誤',
      description: '檢查數據庫連接和錯誤處理',
      code: `
// 在每個路由添加錯誤處理
try {
  // 現有邏輯
} catch (error) {
  console.error('Blog 路由錯誤:', error)
  res.status(500).json({
    error: 'Internal server error',
    message: '操作失敗，請稍後再試'
  })
}
`
    })
  }
  
  return { issues, fixes }
}

async function runBlogDiagnosis() {
  console.log('🔍 執行 Blog 功能全面診斷...\n')
  
  const results = []
  
  for (const endpoint of blogEndpoints) {
    console.log(`測試: ${endpoint.name} (${endpoint.method} ${endpoint.path}${endpoint.params})`)
    const result = await testEndpoint(endpoint)
    
    const statusIcon = result.status === 'success' ? '✅' : 
                      result.status === 'http_error' ? '⚠️' : '❌'
    
    console.log(`${statusIcon} ${result.statusCode} | ${result.duration}ms | ${result.errorMessage || 'OK'}`)
    
    if (result.status === 'success') {
      console.log(`   📊 回應大小: ${result.responseSize} bytes | 資料結構: [${result.dataStructure}]`)
    }
    console.log('')
    
    results.push(result)
  }
  
  // 分析結果
  const analysis = await analyzeResults(results)
  const { issues, fixes } = await generateFixSuggestions(results)
  
  // 生成修復報告
  const report = `# 🔧 Blog 功能診斷與修復報告

## 📊 測試摘要
- **總測試數**: ${results.length}
- **成功**: ${analysis.successful.length} ✅
- **HTTP 錯誤**: ${analysis.httpErrors.length} ⚠️
- **網路錯誤**: ${analysis.networkErrors.length} ❌
- **成功率**: ${((analysis.successful.length / results.length) * 100).toFixed(1)}%

## ✅ 運作正常的端點
${analysis.successful.map(s => `- **${s.name}** (${s.method} ${s.fullPath}) - ${s.statusCode} - ${s.duration}ms`).join('\n')}

## ⚠️ 需要修復的端點
${analysis.httpErrors.map(e => `- **${e.name}** (${e.method} ${e.fullPath}) - ${e.statusCode} - ${e.errorMessage}`).join('\n')}

## ❌ 嚴重錯誤的端點
${analysis.networkErrors.map(e => `- **${e.name}** (${e.method} ${e.fullPath}) - ${e.errorMessage}`).join('\n')}

## 🔧 修復建議

${fixes.map(fix => `### ${fix.priority}: ${fix.title}
${fix.description}

\`\`\`javascript${fix.code}
\`\`\`
`).join('\n')}

## 🎯 修復優先級
1. **立即修復**: 500 錯誤端點
2. **高優先級**: 404 缺失路由
3. **中優先級**: 400 參數錯誤
4. **低優先級**: 性能優化

---
*報告生成時間: ${new Date().toLocaleString('zh-TW')}*
`
  
  fs.writeFileSync('blog-diagnosis-report.md', report, 'utf8')
  console.log('💾 詳細診斷報告已保存到: blog-diagnosis-report.md')
  
  return { results, analysis, issues, fixes }
}

// 執行診斷
runBlogDiagnosis().catch(error => {
  console.error('❌ 診斷失敗:', error.message)
})
