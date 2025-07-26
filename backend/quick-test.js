#!/usr/bin/env node
/**
 * 快速測試腳本 - 立即測試當前系統狀態
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:3005'

async function quickTest() {
  console.log('🔍 快速測試系統狀態...\n')
  
  const tests = [
    {
      name: '伺服器啟動',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 })
        return { success: response.status === 200, data: response.data }
      }
    },
    {
      name: '資料庫連接',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api/db-test`, { timeout: 5000 })
        return { success: response.status === 200, data: response.data }
      }
    },
    {
      name: 'Blog 功能 (參考)',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api/blog`, { timeout: 5000 })
        return { success: response.status === 200, data: response.data }
      }
    },
    {
      name: '認證檢查',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api/auth/check`, { timeout: 5000 })
        return { success: [200, 401].includes(response.status), data: response.data }
      }
    },
    {
      name: '用戶功能',
      test: async () => {
        const response = await axios.get(`${BASE_URL}/api/users`, { timeout: 5000 })
        return { success: [200, 401].includes(response.status), data: response.data }
      }
    }
  ]

  let passed = 0
  let total = tests.length

  for (const { name, test } of tests) {
    process.stdout.write(`📋 ${name}... `)
    
    try {
      const result = await test()
      if (result.success) {
        console.log('✅')
        passed++
      } else {
        console.log('❌')
        console.log(`   錯誤: ${JSON.stringify(result.data)}`)
      }
    } catch (error) {
      console.log('❌')
      console.log(`   錯誤: ${error.message}`)
    }
  }

  console.log(`\n📊 測試結果: ${passed}/${total} 通過 (${Math.round(passed/total*100)}%)`)
  
  if (passed === total) {
    console.log('🎉 系統狀態良好！可以執行完整測試：')
    console.log('   npm run test:all')
  } else if (passed >= total * 0.8) {
    console.log('⚠️ 系統基本正常，建議執行完整測試找出問題：')
    console.log('   npm run cicd:test')
  } else {
    console.log('🚨 系統有嚴重問題，請檢查：')
    console.log('   1. 後端服務是否啟動 (npm run dev)')
    console.log('   2. 資料庫是否連接正常')
    console.log('   3. 環境變數是否配置正確')
  }
}

quickTest().catch(error => {
  console.error('❌ 測試執行失敗:', error.message)
  console.log('\n💡 請確認：')
  console.log('   1. 後端服務已啟動: npm run dev')
  console.log('   2. 服務運行在 http://localhost:3005')
})
