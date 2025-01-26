import express from 'express'
import * as fs from 'fs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import morganLogger from 'morgan'
import path from 'path'
import session from 'express-session'
import winston from 'winston'
import { fileURLToPath } from 'url'
import sessionFileStore from 'session-file-store'
import { extendLog } from '#utils/tool.js'
import 'colors'
import 'dotenv/config.js'

// 導入資料庫和路由
import db from './configs/db.js'
import authRouter from './routes/auth.js'
import loginRouter from './routes/login.js'
import dashboardRouter from './routes/dashboard.js'
import usersRouter from './routes/users.js'
import eventsRouter from './routes/events.js'
import couponRouter from './routes/coupon.js'
import couponUserRouter from './routes/coupon-user.js'
import chatRoutes from './routes/chat.js'
import GroupRequests from './routes/group-request.js'
import blogRouter from './routes/blog.js'
import forgotPasswordRouter from './routes/forgot-password.js'

const app = express()
app.set('trust proxy', 1)

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 目錄設定
const sessionsDir = path.join(__dirname, 'sessions')
const logDir = path.join(__dirname, 'logs')
const uploadDir = path.join(__dirname, 'public', 'uploads')

// 確保目錄存在
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true })
}
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 初始化 FileStore
const FileStore = sessionFileStore(session)

// CORS 配置優化
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
      : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
}

// Cookie 配置統一
const cookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

// Session 配置
const sessionConfig = {
  store: new FileStore({
    path: sessionsDir,
    ttl: 86400,
  }),
  name: 'SESSION_ID',
  secret: process.env.SESSION_SECRET || '67f71af4602195de2450faeb6f8856c0',
  proxy: true,
  cookie: cookieConfig,
  resave: true,
  saveUninitialized: true,
}

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

// 請求記錄中間件
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

// 中間件順序
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'],
  })
)
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(
  cookieParser(process.env.COOKIE_SECRET || '67f71af4602195de2450faeb6f8856c0')
)
app.use(session(sessionConfig))
app.use(morganLogger('dev'))
app.use(requestLogger)

// 在 API 路由前添加
app.get('/health', async (req, res) => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  const health = {
    requestId,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  }

  try {
    const result = await db.query('SELECT 1')
    health.database = {
      status: 'connected',
      responseTime: `${Date.now() - startTime}ms`,
    }
    return res.json(health)
  } catch (err) {
    return res.status(503).json({
      ...health,
      status: 'error',
      database: {
        status: 'disconnected',
        error:
          process.env.NODE_ENV === 'production'
            ? 'Database connection failed'
            : err.message,
      },
    })
  }
})

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' })
})

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(uploadDir))

// API 路由順序
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

// 錯誤處理
app.use((err, req, res, next) => {
  const errorResponse = {
    status: 'error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
    code: err.status || 500,
  }

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

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack
    errorResponse.details = err
  }

  res.status(err.status || 500).json(errorResponse)
})

// 未捕獲錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
    stack: reason?.stack,
  })
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString(),
  })
  setTimeout(() => process.exit(1), 1000)
})

// 資料庫連接測試
const testConnection = async () => {
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


