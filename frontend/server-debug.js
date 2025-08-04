const { spawn } = require('child_process')
const path = require('path')

console.log('🌟 Starting Next.js server with debugging...')
console.log('Current working directory:', process.cwd())
console.log('Node.js version:', process.version)
console.log('Environment:', process.env.NODE_ENV || 'development')
console.log('Port:', process.env.PORT || '3000')

// 檢查 .next 目錄是否存在
const nextDir = path.join(process.cwd(), '.next')
const fs = require('fs')

if (!fs.existsSync(nextDir)) {
  console.log('❌ .next directory not found. Build may have failed.')
  console.log('📂 Available directories:')
  fs.readdirSync(process.cwd()).forEach(item => {
    const stats = fs.statSync(item)
    if (stats.isDirectory()) {
      console.log('  📁', item)
    }
  })
} else {
  console.log('✅ .next directory found')
}

console.log('🚀 Spawning Next.js start process...')

const nextProcess = spawn('npx', ['next', 'start'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
})

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  console.log(`📊 Next.js process exited with code ${code}`)
  process.exit(code)
})

// 添加超時保護
setTimeout(() => {
  console.log('⏰ Next.js start process has been running for 2 minutes')
}, 120000)

console.log('✅ Debug script setup complete')
