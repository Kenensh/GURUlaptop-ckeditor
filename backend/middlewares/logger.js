/**
 * Logger 中間件
 * 自動記錄所有 API 請求和回應
 */

import { 
  generateRequestId, 
  logApiRequest, 
  logApiResponse, 
  logError 
} from '#utils/logger.js'

/**
 * 請求 Logger 中間件
 * 記錄每個 API 請求的詳細信息
 */
export const requestLogger = (req, res, next) => {
  // 生成唯一請求 ID
  const requestId = generateRequestId()
  req.requestId = requestId
  
  // 記錄請求開始時間
  const startTime = Date.now()
  
  // 記錄 API 請求
  logApiRequest(req, requestId)
  
  // 監聽回應完成事件
  const originalSend = res.send
  res.send = function(data) {
    // 記錄 API 回應
    logApiResponse(req, res, requestId, startTime)
    
    // 調用原始 send 方法
    originalSend.call(this, data)
  }
  
  next()
}

/**
 * 錯誤 Logger 中間件
 * 記錄所有未處理的錯誤
 */
export const errorLogger = (error, req, res, next) => {
  const requestId = req.requestId || generateRequestId()
  
  // 記錄錯誤詳細信息
  logError(error, {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      userAgent: req.headers['user-agent'],
      contentType: req.headers['content-type'],
      origin: req.headers.origin
    }
  }, requestId)
  
  // 根據環境返回不同的錯誤信息
  const isProduction = process.env.NODE_ENV === 'production'
  
  res.status(error.status || 500).json({
    status: 'error',
    message: isProduction ? '系統發生錯誤' : error.message,
    requestId,
    ...(isProduction ? {} : { 
      stack: error.stack,
      details: error.details 
    })
  })
}
