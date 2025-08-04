import { WebSocketServer } from 'ws'

const initializeWebSocket = (server) => {
  console.log('🔌 Initializing WebSocket server...')
  
  try {
    const wss = new WebSocketServer({ server })
    console.log('✅ WebSocket server created successfully')

    wss.on('connection', (ws, req) => {
      console.log('🔗 New WebSocket connection established')
      
      // 基本的連接處理
      ws.isAlive = true
      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', (message) => {
        console.log('📨 Received message:', message.toString())
      })

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed')
      })

      ws.on('error', (error) => {
        console.error('❌ WebSocket connection error:', error)
      })
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
    // 不要拋出錯誤，允許服務器繼續啟動
    console.log('⚠️ Continuing without WebSocket...')
    return null
  }
}

export { initializeWebSocket }
