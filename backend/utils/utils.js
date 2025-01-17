import winston from 'winston'
const { format } = winston

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'gurulaptop-backend' },
  transports: [
    // 開發環境下的控制台輸出
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          let output = `${timestamp} ${level}: ${message}`

          // 如果有錯誤堆疊，添加它
          if (meta.stack) {
            output += `\nStack: ${meta.stack}`
          }

          // 添加其他元數據（但排除一些特定字段）
          const { stack, service, ...restMeta } = meta
          if (Object.keys(restMeta).length > 0) {
            output += `\nMetadata: ${JSON.stringify(restMeta, null, 2)}`
          }

          return output
        })
      ),
    }),
    // 文件日誌
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// 請求記錄器中間件
const requestLogger = (req, res, next) => {
  const startTime = Date.now()

  // 記錄請求開始
  logger.info(`${req.method} ${req.url} started`, {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      authorization: req.get('authorization') ? '[PRESENT]' : '[NONE]',
    },
    clientIP: req.ip,
  })

  // 監聽響應完成
  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.info(`${req.method} ${req.url} completed`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    })
  })

  next()
}

export { logger, requestLogger }
