#!/usr/bin/env node

/**
 * 快速啟動腳本 - 最小化啟動時間
 */

console.log('🚀 Quick start script initializing...')

import('../app.js').then(async (appModule) => {
  console.log('✅ App module loaded')
  
  const app = appModule.default
  const port = process.env.PORT || 3005
  
  console.log('🌐 Starting server on port:', port)
  
  const server = app.listen(port, () => {
    console.log('🎉 Server is running on port', port)
    console.log('⚡ Quick start completed')
  })
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error)
    process.exit(1)
  })
  
}).catch(error => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})
