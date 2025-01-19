import app from './../app.js'
import debugLib from 'debug'
import http from 'http'
import { exit } from 'node:process'
import { initializeWebSocket } from './../configs/websocket.js'
import 'dotenv/config.js'

const debug = debugLib('node-express-es6:server')

// 設定 port，移除 host
const port = normalizePort(process.env.PORT || '3005')

app.set('port', port)

// 創建 HTTP server
const server = http.createServer(app)

// WebSocket 初始化
initializeWebSocket(server)

// 直接啟動伺服器，不指定 host
server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
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
