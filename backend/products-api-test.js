/**
 * Products API 修復驗證腳本
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3005';

async function testProductsAPI() {
  console.log('🧪 開始測試 Products API 修復結果...\n');
  
  const tests = [
    {
      name: '產品列表 - 基本查詢',
      url: `${BASE_URL}/api/products/list`,
      expected: 'success'
    },
    {
      name: '產品列表 - 帶分頁',
      url: `${BASE_URL}/api/products/list?page=1&perpage=5`,
      expected: 'success'
    },
    {
      name: '產品列表 - 帶搜尋',
      url: `${BASE_URL}/api/products/list?search=laptop&page=1&perpage=10`,
      expected: 'success'
    },
    {
      name: '單一產品詳情',
      url: `${BASE_URL}/api/products/1`,
      expected: 'success'
    },
    {
      name: '產品卡片資料',
      url: `${BASE_URL}/api/products/card/1`,
      expected: 'success'
    },
    {
      name: '相關產品',
      url: `${BASE_URL}/api/products/related/1`,
      expected: 'success'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`🔍 測試: ${test.name}`);
    
    try {
      const response = await axios.get(test.url, { timeout: 5000 });
      
      if (response.status === 200 && response.data.status === test.expected) {
        console.log(`✅ 通過: ${test.name}`);
        results.push({ ...test, result: 'PASS', data: response.data });
      } else if (response.status === 200 && response.data.status === 'error') {
        console.log(`⚠️ API 回傳錯誤: ${test.name} - ${response.data.message}`);
        results.push({ ...test, result: 'API_ERROR', error: response.data.message });
      } else {
        console.log(`❌ 失敗: ${test.name} - 狀態碼: ${response.status}`);
        results.push({ ...test, result: 'FAIL', status: response.status });
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔌 連接失敗: ${test.name} - 後端服務未啟動`);
        results.push({ ...test, result: 'CONNECTION_ERROR', error: '後端服務未啟動' });
      } else {
        console.log(`❌ 請求失敗: ${test.name} - ${error.message}`);
        results.push({ ...test, result: 'REQUEST_ERROR', error: error.message });
      }
    }
    
    // 避免請求過於頻繁
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 生成報告
  console.log('\n📊 測試結果摘要:');
  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  const apiErrors = results.filter(r => r.result === 'API_ERROR').length;
  const connectionErrors = results.filter(r => r.result === 'CONNECTION_ERROR').length;
  
  console.log(`✅ 通過: ${passed}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`⚠️ API錯誤: ${apiErrors}`);
  console.log(`🔌 連接錯誤: ${connectionErrors}`);
  
  if (connectionErrors > 0) {
    console.log('\n💡 建議: 請先啟動後端服務');
    console.log('   npm run dev');
  }
  
  if (apiErrors > 0) {
    console.log('\n💡 建議: 檢查資料庫中是否有測試資料');
    console.log('   可能需要執行種子資料: npm run seed');
  }
  
  // 儲存詳細結果
  const report = {
    timestamp: new Date().toISOString(),
    summary: { passed, failed, apiErrors, connectionErrors },
    tests: results
  };
  
  const fs = await import('fs');
  fs.writeFileSync('products-api-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📝 詳細結果已儲存到: products-api-test-results.json');
  
  return results;
}

// 主要執行
if (import.meta.url === `file://${process.argv[1]}`) {
  testProductsAPI().catch(console.error);
}

export default testProductsAPI;
