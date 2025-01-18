import app from './../app.js' // 修正路徑
import debugLib from 'debug'
import http from 'http'
import { exit } from 'node:process'
import { initializeWebSocket } from './../configs/websocket.js' // 修正路徑
import 'dotenv/config.js'

const debug = debugLib('node-express-es6:server')

// 設定 port 和 host
const port = normalizePort(process.env.PORT || '3005')
const host = '0.0.0.0' // 簡化 host 設定

app.set('port', port)

// 創建 HTTP server
const server = http.createServer(app)

// WebSocket 初始化
initializeWebSocket(server)

// 啟動伺服器
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`)
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

  const displayHost =
    process.env.NODE_ENV === 'production'
      ? 'production server'
      : 'http://localhost:' + port

  console.log(`伺服器啟動成功: ${displayHost}`)
}
