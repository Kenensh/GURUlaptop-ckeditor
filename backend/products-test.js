import axios from 'axios'

console.log('🔍 Products 功能快速診斷')

const baseURL = 'http://localhost:3005'

// Products 路由中的端點
const productsEndpoints = [
  { name: 'Products 列表', method: 'GET', path: '/api/products/list' },
  { name: 'Products 列表 (帶分頁)', method: 'GET', path: '/api/products/list?page=1' },
  { name: 'Product 卡片 (ID:1)', method: 'GET', path: '/api/products/card/1' },
  { name: 'Product 詳情 (ID:1)', method: 'GET', path: '/api/products/1' },
  { name: 'Related Products (ID:1)', method: 'GET', path: '/api/products/related/1' },
]

async function testProductsEndpoints() {
  console.log('\n📊 測試 Products 端點...\n')
  
  let passCount = 0
  const results = []
  
  for (const endpoint of productsEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint.path}`, { 
        timeout: 3000,
        validateStatus: (status) => status < 600
      })
      
      const success = response.status === 200
      const hasData = response.data && (
        response.data.products || 
        response.data.data || 
        response.data.status === 'success' ||
        Array.isArray(response.data)
      )
      
      console.log(`${success ? '✅' : '⚠️'} ${endpoint.name} - ${response.status} - ${hasData ? '有資料' : '無資料'}`)
      
      if (success) passCount++
      
      results.push({
        ...endpoint,
        status: response.status,
        success,
        hasData,
        dataSize: JSON.stringify(response.data || {}).length
      })
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} - ERROR - ${error.message}`)
      results.push({
        ...endpoint,
        status: 'ERROR',
        success: false,
        error: error.message
      })
    }
  }
  
  console.log(`\n📊 Products 測試結果:`)
  console.log(`✅ 成功: ${passCount}/${productsEndpoints.length}`)
  console.log(`📈 成功率: ${(passCount / productsEndpoints.length * 100).toFixed(1)}%`)
  
  if (passCount === productsEndpoints.length) {
    console.log('🎉 Products 功能完全正常！')
  } else if (passCount > 0) {
    console.log('⚠️ Products 功能部分正常，可能需要資料庫資料')
  } else {
    console.log('❌ Products 功能需要修復')
  }
  
  return results
}

testProductsEndpoints().catch(error => {
  console.error('❌ 測試失敗:', error.message)
})
