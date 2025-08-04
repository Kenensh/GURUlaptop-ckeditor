import { WebSocketServer } from 'ws'
import { chatService } from '../services/chatService.js'

const initializeWebSocket = (server) => {
  console.log('🔌 Initializing WebSocket server...')
  
  try {
    const wss = new WebSocketServer({ server })
    console.log('✅ WebSocket server created successfully')

    wss.on('connection', (ws, req) => {
      console.log('🔗 New WebSocket connection established')
      // 初始化檢測
      ws.isAlive = true
      ws.on('pong', () => {
        ws.isAlive = true
      })

      // 將連接處理委託給 chatService
      try {
        chatService.handleConnection(ws, req)
        console.log('✅ WebSocket connection handled by chatService')
      } catch (error) {
        console.error('❌ Error handling WebSocket connection:', error)
      }
    })

    // 處理 WebSocket server 錯誤
    wss.on('error', (error) => {
      console.error('❌ WebSocket Server error:', error)
    })

    console.log('⏰ Setting up WebSocket cleanup interval...')
    // 定時清理斷開的連接
    const interval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate()
        }
        ws.isAlive = false
        ws.ping(() => {})
      })
    }, 30000)
    console.log('✅ WebSocket cleanup interval set')

    // 當伺服器關閉時清理 interval
    wss.on('close', () => {
      console.log('🔌 WebSocket server closing, clearing interval...')
      clearInterval(interval)
    })

    console.log('🎉 WebSocket initialization completed successfully')
    return wss
    
  } catch (error) {
    console.error('❌ Critical error in WebSocket initialization:', error)
    throw error
  }
}

export { initializeWebSocket }

export { initializeWebSocket }
