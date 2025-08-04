import app from './../app.js'
import debugLib from 'debug'
import http from 'http'
import { exit } from 'node:process'
import { initializeWebSocket } from './../configs/websocket.js'
import 'dotenv/config.js'

console.log('🌟 Starting server initialization...')
console.log('Current working directory:', process.cwd())
console.log('Node.js version:', process.version)
console.log('Environment variables loaded')

const debug = debugLib('node-express-es6:server')

console.log('🔧 Setting up server configuration...')
// 設定 port，移除 host
const port = normalizePort(process.env.PORT || '3005')
console.log('✅ Port normalized:', port)

app.set('port', port)
console.log('✅ Port set on app')

console.log('🏗️ Creating HTTP server...')
// 創建 HTTP server
const server = http.createServer(app)
console.log('✅ HTTP server created')

// 添加啟動超時保護
const startupTimeout = setTimeout(() => {
  console.error('❌ Server startup timeout after 30 seconds')
  exit(1)
}, 30000)
console.log('⏰ Startup timeout protection enabled (30s)')

console.log('🔌 Initializing WebSocket...')
// WebSocket 初始化（添加錯誤處理）
try {
  initializeWebSocket(server)
  console.log('✅ WebSocket initialized successfully')
} catch (error) {
  console.error('❌ WebSocket initialization failed:', error)
  // 不要因為 WebSocket 失敗就停止服務器
}

console.log('🚀 Starting server listener...')
// 直接啟動伺服器，不指定 host
server.listen(port, () => {
  clearTimeout(startupTimeout) // 清除啟動超時
  console.log('🎉 Server is running on port', port)
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development')
  console.log('🔥 Server startup completed successfully')
  console.log('=' .repeat(50))
})

server.on('error', onError)
server.on('listening', onListening)

function normalizePort(val) {
  const port = parseInt(val, 10)
  if (isNaN(port)) return val
  if (port >= 0) return port
  return false
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} 需要系統管理員權限`)
      exit(1)
      break
    case 'EADDRINUSE':
      console.error(`Port ${port} 已被其他程式使用中`)
      exit(1)
      break
    default:
      throw error
  }
}

function onListening() {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
  console.log(`伺服器啟動成功在 port ${port}`)
}
