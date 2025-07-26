/**
 * Products API 測試 - 使用遠端資料庫
 */

import axios from 'axios'

const API_BASE = 'http://localhost:3005/api/products'

async function testProductsWithRemoteDB() {
  console.log('🧪 測試 Products API (遠端資料庫)...\n')
  
  const tests = [
    {
      name: '產品列表',
      url: `${API_BASE}/list`,
      description: '基本產品列表查詢'
    },
    {
      name: '產品列表 + 分頁',
      url: `${API_BASE}/list?page=1&perpage=5`,
      description: '帶分頁的產品列表'
    },
    {
      name: '產品搜尋',
      url: `${API_BASE}/list?search=laptop`,
      description: '搜尋包含 laptop 的產品'
    },
    {
      name: '單一產品詳情',
      url: `${API_BASE}/1`,
      description: '取得產品 ID 1 的詳情'
    },
    {
      name: '產品卡片',
      url: `${API_BASE}/card/1`,
      description: '取得產品 ID 1 的卡片資料'
    }
  ]
  
  console.log('📍 測試端點列表:')
  tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.url}`)
  })
  console.log('')
  
  for (const test of tests) {
    try {
      console.log(`🔍 測試: ${test.name}`)
      const response = await axios.get(test.url, { timeout: 10000 })
      
      if (response.status === 200) {
        if (response.data.status === 'success') {
          console.log(`✅ 成功: ${test.name}`)
          
          // 顯示資料摘要
          if (response.data.data) {
            if (response.data.data.products) {
              console.log(`   📊 找到 ${response.data.data.products.length} 個產品`)
              if (response.data.data.totalPages) {
                console.log(`   📄 總頁數: ${response.data.data.totalPages}`)
              }
            } else if (response.data.data.product) {
              console.log(`   🛍️ 產品: ${response.data.data.product.product_name || 'N/A'}`)
            }
          }
        } else {
          console.log(`⚠️ API 錯誤: ${test.name} - ${response.data.message}`)
        }
      } else {
        console.log(`❌ HTTP 錯誤: ${test.name} - 狀態碼 ${response.status}`)
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔌 連接失敗: ${test.name} - 後端服務未啟動`)
        console.log('   請執行: npm run dev')
        break
      } else {
        console.log(`❌ 請求錯誤: ${test.name} - ${error.message}`)
      }
    }
    
    // 避免請求過於頻繁
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n💡 如果看到資料庫錯誤，請確認:')
  console.log('1. 遠端資料庫連接正常')
  console.log('2. 已執行種子資料: npm run seed')
  console.log('3. 後端服務正在運行: npm run dev')
}

testProductsWithRemoteDB().catch(console.error)
