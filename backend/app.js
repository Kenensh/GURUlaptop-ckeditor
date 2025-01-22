import express from 'express'
import * as fs from 'fs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import morganLogger from 'morgan'
import path from 'path'
import session from 'express-session'
import winston from 'winston'
import { fileURLToPath, pathToFileURL } from 'url'
import sessionFileStore from 'session-file-store'
import { extendLog } from '#utils/tool.js'
import 'colors'
import 'dotenv/config.js'

// 建立 Express 應用程式（確保最先初始化）
const app = express()

// 修正 ESM 中的 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 初始化其他相依模組
const FileStore = sessionFileStore(session)

// 導入資料庫和路由
import db from './configs/db.js'
import authRouter from './routes/auth.js'
import dashboardRouter from './routes/dashboard.js'
import usersRouter from './routes/users.js'
import eventsRouter from './routes/events.js'
import couponRouter from './routes/coupon.js'
import couponUserRouter from './routes/coupon-user.js'
import chatRoutes from './routes/chat.js'
import GroupRequests from './routes/group-request.js'
import blogRouter from './routes/blog.js'
import forgotPasswordRouter from './routes/forgot-password.js'

// 擴展 console.log
extendLog()

// 定義允許的來源
const allowedOrigins = [
  'http://localhost:3000',
  'https://gurulaptop-ckeditor-frontend.onrender.com',
]

// CORS 設定優化
const corsOptions = {
  origin: function (origin, callback) {
    // 允許沒有 origin 的請求（如移動應用）或在允許清單中的 origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'X-Requested-With',
    'Accept',
  ],
  exposedHeaders: ['set-cookie'],
  maxAge: 600, // 預檢請求的快取時間（秒）
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // 處理 OPTIONS 預檢請求

// 建立 Winston Logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let output = `${timestamp} ${level}: ${message}`
          if (meta.stack) {
            output += `\nStack: ${meta.stack}`
          }
          const { stack, ...restMeta } = meta
          if (Object.keys(restMeta).length > 0) {
            output += `\nMetadata: ${JSON.stringify(restMeta, null, 2)}`
          }
          return output
        })
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
})

// 確保日誌目錄存在
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// 增強的請求記錄中間件
const requestLogger = (req, res, next) => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  logger.info(`Request started [${requestId}]`, {
    requestId,
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      origin: req.get('origin'),
      authorization: req.get('authorization') ? '[PRESENT]' : '[NONE]',
    },
  })

  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.info(`Request completed [${requestId}]`, {
      requestId,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length'),
    })
  })

  next()
}

app.use(requestLogger)

// 基本中間件設定
app.use(morganLogger('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(
  cookieParser(process.env.COOKIE_SECRET || '67f71af4602195de2450faeb6f8856c0')
)

// 靜態檔案服務
app.use(express.static(path.join(__dirname, 'public')))

// Session 目錄設定
const sessionsDir = path.join(__dirname, 'sessions')
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true })
}

// 增強的 Session 設定
const sessionConfig = {
  store: new FileStore({
    path: sessionsDir,
    logFn: function () {},
    ttl: 86400, // 24小時
  }),
  name: 'SESSION_ID',
  secret: process.env.SESSION_SECRET || '67f71af4602195de2450faeb6f8856c0',
  cookie: {
    maxAge: 30 * 86400000, // 30天
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined,
    path: '/',
  },
  resave: false,
  saveUninitialized: false,
  rolling: true, // 每次請求都重新計算過期時間
}

app.use(session(sessionConfig))

// 視圖引擎設定
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// 增強的 Health check 路由
app.get('/health', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[${requestId}] Health check started`)

  // 設置回應標頭
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin':
      process.env.NODE_ENV === 'production'
        ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
        : 'http://localhost:3000',
  })

  const health = {
    requestId,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: process.env.NODE_ENV,
    memoryUsage: {
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
    },
    nodejs: {
      version: process.version,
      pid: process.pid,
    },
  }

  try {
    console.log(`[${requestId}] Checking database connection...`)
    const dbStartTime = Date.now()

    const result = await db.query('SELECT 1')

    health.database = {
      status: 'connected',
      responseTime: `${Date.now() - dbStartTime}ms`,
    }

    health.responseTime = `${Date.now() - startTime}ms`

    console.log(`[${requestId}] Health check passed:`, health)
    logger.info(`Health check passed [${requestId}]`, health)

    return res.json(health)
  } catch (err) {
    const errorResponse = {
      ...health,
      status: 'error',
      database: {
        status: 'disconnected',
        error:
          process.env.NODE_ENV === 'production'
            ? 'Database connection failed'
            : err.message,
      },
      responseTime: `${Date.now() - startTime}ms`,
    }

    console.error(`[${requestId}] Health check failed:`, {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    })

    logger.error(`Health check failed [${requestId}]`, {
      error: err,
      health: errorResponse,
    })

    return res.status(503).json(errorResponse)
  } finally {
    console.log(
      `[${requestId}] Health check completed in ${Date.now() - startTime}ms`
    )
  }
})

// API 路由設定（整合認證相關路由）
app.use('/api/auth', authRouter)
app.use('/api/blog', blogRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/users', usersRouter)
app.use('/api/events', eventsRouter)
app.use('/api/forgot-password', forgotPasswordRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/coupon-user', couponUserRouter)
app.use('/api/chat', chatRoutes)
app.use('/api', GroupRequests)

// 設定上傳目錄
const uploadDir = path.join(__dirname, 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
app.use('/uploads', express.static(uploadDir))

// 資料庫連接測試
async function testConnection() {
  try {
    await db.query('SELECT 1')
    logger.info('Database connection successful')
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      stack: error.stack,
    })
    process.exit(1)
  }
}

testConnection()

// 404 處理
app.use((req, res, next) => {
  const err = createError(404)
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  })
  next(err)
})

// 增強的錯誤處理
app.use((err, req, res, next) => {
  const errorResponse = {
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
    code: err.status || 500,
  }

  // 詳細的錯誤記錄
  logger.error('Application error', {
    error: {
      message: err.message,
      stack: err.stack,
      status: err.status || 500,
    },
    request: {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        origin: req.headers.origin,
      },
    },
  })

  // 開發環境下提供更多錯誤細節
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack
    errorResponse.details = err
  }

  res.status(err.status || 500).json(errorResponse)
})

// 未捕獲的 Promise 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
    stack: reason?.stack,
  })
})

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString(),
  })

  // 給一些時間讓日誌寫入後再結束程序
  setTimeout(() => process.exit(1), 1000)
})

export default app
