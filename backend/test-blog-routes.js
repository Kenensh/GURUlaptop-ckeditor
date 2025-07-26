import axios from 'axios'

console.log('🔍 智能檢測 Blog 路由中實際可用的端點...')

const baseURL = 'http://localhost:3005'

// Blog 路由中發現的實際端點
const blogEndpoints = [
  { method: 'GET', path: '/api/blog/search', name: 'Blog 搜尋' },
  { method: 'GET', path: '/api/blog/blog/ckeitor', name: 'CKEditor Blog' },
  { method: 'GET', path: '/api/blog/blogcardgroup', name: 'Blog 卡片群組' },
  { method: 'GET', path: '/api/blog/blog-detail/1', name: 'Blog 詳情 (ID:1)' },
  { method: 'GET', path: '/api/blog/blog_user_overview/1', name: '用戶 Blog 概覽 (ID:1)' },
  { method: 'GET', path: '/api/blog/blog-comment/1', name: 'Blog 評論 (ID:1)' },
  { method: 'POST', path: '/api/blog/upload-image', name: '上傳圖片' },
  { method: 'POST', path: '/api/blog/upload-blog-image', name: '上傳 Blog 圖片' },
]

async function testEndpoint(endpoint) {
  const startTime = Date.now()
  try {
    let response
    
    if (endpoint.method === 'GET') {
      response = await axios.get(`${baseURL}${endpoint.path}`, { timeout: 3000 })
    } else if (endpoint.method === 'POST') {
      // 對於 POST 路由，我們先試試不傳參數看看會不會至少回應
      response = await axios.post(`${baseURL}${endpoint.path}`, {}, { timeout: 3000 })
    }
    
    const duration = Date.now() - startTime
    return {
      ...endpoint,
      status: 'success',
      statusCode: response.status,
      duration: `${duration}ms`,
      responseType: typeof response.data,
      hasData: !!response.data
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      ...endpoint,
      status: error.response?.status === 404 ? 'not_found' : 'error',
      statusCode: error.response?.status || 0,
      duration: `${duration}ms`,
      error: error.message.substring(0, 100)
    }
  }
}

async function runBlogTests() {
  console.log('📊 測試 Blog 路由端點...\n')
  
  const results = []
  for (const endpoint of blogEndpoints) {
    const result = await testEndpoint(endpoint)
    const statusIcon = result.status === 'success' ? '✅' : 
                      result.status === 'not_found' ? '❓' : '❌'
    
    console.log(`${statusIcon} ${result.name} (${result.method} ${result.path})`)
    console.log(`   狀態: ${result.statusCode} | 時間: ${result.duration}`)
    
    if (result.status === 'success') {
      console.log(`   資料類型: ${result.responseType} | 有資料: ${result.hasData}`)
    } else {
      console.log(`   錯誤: ${result.error}`)
    }
    console.log('')
    
    results.push(result)
  }
  
  // 統計結果
  const success = results.filter(r => r.status === 'success')
  const notFound = results.filter(r => r.status === 'not_found')
  const errors = results.filter(r => r.status === 'error')
  
  console.log('📋 測試結果摘要:')
  console.log(`✅ 可用端點: ${success.length}`)
  console.log(`❓ 找不到端點: ${notFound.length}`)
  console.log(`❌ 錯誤端點: ${errors.length}`)
  console.log(`📊 總成功率: ${((success.length / results.length) * 100).toFixed(1)}%`)
  
  if (success.length > 0) {
    console.log('\n🎉 發現可用的 Blog 端點:')
    success.forEach(s => {
      console.log(`   ${s.method} ${s.path} - ${s.name}`)
    })
  }
  
  if (notFound.length > 0) {
    console.log('\n❓ 找不到的端點 (可能需要不同參數):')
    notFound.forEach(n => {
      console.log(`   ${n.method} ${n.path} - ${n.name}`)
    })
  }
  
  return { success, notFound, errors, results }
}

runBlogTests().catch(error => {
  console.error('❌ 測試失敗:', error.message)
})
