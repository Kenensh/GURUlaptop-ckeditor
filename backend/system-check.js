/**
 * 系統環境檢查腳本
 */

console.log('🔍 開始系統環境檢查...\n')

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

// 檢查 Node.js 環境
console.log('📋 Node.js 環境信息:')
console.log('- Node 版本:', process.version)
console.log('- 平台:', process.platform)
console.log('- 架構:', process.arch)
console.log('- 當前工作目錄:', process.cwd())
console.log('- 腳本路徑:', __filename)
console.log('')

// 檢查關鍵文件
console.log('📁 檢查關鍵文件:')
const criticalFiles = [
  './package.json',
  './app.js',
  './bin/www.js',
  './utils/logger.js',
  './test-automation.js',
  './cicd-pipeline.js',
  './debug-cicd.js'
]

criticalFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file)
      console.log(`✅ ${file} (${stats.size} bytes)`)
    } else {
      console.log(`❌ ${file} - 文件不存在`)
    }
  } catch (error) {
    console.log(`⚠️ ${file} - 檢查失敗: ${error.message}`)
  }
})
console.log('')

// 檢查依賴套件
console.log('📦 檢查關鍵依賴:')
const criticalDeps = ['express', 'axios', 'colors', 'winston']

criticalDeps.forEach(dep => {
  try {
    require.resolve(dep)
    console.log(`✅ ${dep} - 已安裝`)
  } catch (error) {
    console.log(`❌ ${dep} - 未安裝或無法載入`)
  }
})
console.log('')

// 檢查環境變數
console.log('🌍 環境變數檢查:')
const envVars = ['NODE_ENV', 'PORT', 'DB_HOST', 'DB_NAME']
envVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar} = ${value}`)
  } else {
    console.log(`⚠️ ${envVar} - 未設定`)
  }
})
console.log('')

// 檢查端口
console.log('🔌 檢查端口狀態:')
const net = require('net')

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve({ port, available: true })
      })
      server.close()
    })
    
    server.on('error', () => {
      resolve({ port, available: false })
    })
  })
}

async function checkPorts() {
  const ports = [3005, 3000, 3001, 8080]
  
  for (const port of ports) {
    const result = await checkPort(port)
    console.log(`${result.available ? '✅' : '❌'} Port ${port} - ${result.available ? '可用' : '被占用'}`)
  }
}

// 執行端口檢查
checkPorts().then(() => {
  console.log('')
  console.log('🎯 建議執行方式:')
  console.log('1. 手動執行: npm run dev')
  console.log('2. 測試執行: npm run cicd:debug (不需服務器)')
  console.log('3. 完整測試: npm run cicd:test (需先啟動服務器)')
  console.log('')
  console.log('📊 系統檢查完成！')
})

// 嘗試簡單的命令執行測試
console.log('🧪 測試命令執行能力:')
exec('echo "Command execution test"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ 命令執行失敗:', error.message)
  } else {
    console.log('✅ 命令執行成功:', stdout.trim())
  }
})
