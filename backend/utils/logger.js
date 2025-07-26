/**
 * 統一 Logger 模組
 * 提供結構化的日誌記錄功能，適用於雲端部署除錯
 */

import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 日誌級別配置
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// 顏色配置
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
}

// 判斷是否為生產環境
const isProduction = process.env.NODE_ENV === 'production'

// 自定義格式化函數
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // 基本日誌信息
    let logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message
    }

    // 添加額外信息
    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta
    }

    return JSON.stringify(logEntry, null, isProduction ? 0 : 2)
  })
)

// 控制台格式化（開發環境用）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = ''
    if (Object.keys(meta).length > 0) {
      metaStr = `\n📋 Meta: ${JSON.stringify(meta, null, 2)}`
    }
    return `⏰ ${timestamp} [${level}]: ${message}${metaStr}`
  })
)

// 創建 Winston Logger
const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // 錯誤日誌文件
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // 完整日誌文件
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
})

// 非生產環境添加控制台輸出
if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }))
}

winston.addColors(LOG_COLORS)

/**
 * 生成請求 ID
 */
export const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * API 請求日誌記錄器
 */
export const logApiRequest = (req, requestId) => {
  const { method, originalUrl, headers, body, query, params } = req
  
  logger.info('🌐 API Request', {
    requestId,
    method,
    url: originalUrl,
    userAgent: headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    headers: {
      contentType: headers['content-type'],
      authorization: headers.authorization ? 'Bearer [TOKEN]' : undefined,
      origin: headers.origin
    },
    query,
    params,
    body: sanitizeBody(body)
  })
}

/**
 * API 回應日誌記錄器
 */
export const logApiResponse = (req, res, requestId, startTime) => {
  const duration = Date.now() - startTime
  const { statusCode } = res
  
  logger.info('📤 API Response', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    duration: `${duration}ms`,
    success: statusCode < 400
  })
}

/**
 * 資料庫查詢日誌記錄器
 */
export const logDbQuery = (query, params, requestId, operation = 'QUERY') => {
  logger.debug('🗃️ Database Query', {
    requestId,
    operation,
    query: sanitizeQuery(query),
    params: sanitizeParams(params)
  })
}

/**
 * 錯誤日誌記錄器
 */
export const logError = (error, context = {}, requestId) => {
  logger.error('❌ Error Occurred', {
    requestId,
    errorMessage: error.message,
    errorStack: error.stack,
    errorCode: error.code,
    context
  })
}

/**
 * 業務邏輯日誌記錄器
 */
export const logBusinessFlow = (message, data = {}, requestId, level = 'info') => {
  const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌'
  }
  
  logger[level](`${emoji[level]} ${message}`, {
    requestId,
    ...data
  })
}

/**
 * 認證相關日誌記錄器
 */
export const logAuth = (action, userId, success, details = {}, requestId) => {
  const emoji = success ? '✅' : '❌'
  
  logger.info(`${emoji} Auth: ${action}`, {
    requestId,
    userId,
    success,
    action,
    ...details
  })
}

/**
 * 支付相關日誌記錄器
 */
export const logPayment = (action, orderId, amount, status, details = {}, requestId) => {
  logger.info('💳 Payment Operation', {
    requestId,
    action,
    orderId,
    amount,
    status,
    ...details
  })
}

/**
 * 清理敏感信息的輔助函數
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard']
  const sanitized = { ...body }
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

function sanitizeQuery(query) {
  if (typeof query === 'string') {
    // 移除可能的敏感資料
    return query.replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
  }
  return query
}

function sanitizeParams(params) {
  if (!Array.isArray(params)) return params
  
  return params.map(param => {
    if (typeof param === 'string' && param.length > 20) {
      return `${param.substring(0, 20)}...`
    }
    return param
  })
}

// 預設導出 logger 實例
export default logger
