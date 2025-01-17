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
import loginRouter from './routes/login.js'
import signupRouter from './routes/signup.js'
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

// CORS 設定
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://gurulaptop-ckeditor-frontend.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'Accept',
      'X-Requested-With',
    ],
  })
)

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

// 請求記錄中間件
const requestLogger = (req, res, next) => {
  const startTime = Date.now()

  logger.info(`${req.method} ${req.url} started`, {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
      authorization: req.get('authorization') ? '[PRESENT]' : '[NONE]',
    },
  })

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

app.use(requestLogger)

// 基本中間件設定
app.use(morganLogger('dev'))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// 在 Session 設定之前添加這段
const sessionsDir = path.join(__dirname, 'sessions')
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true })
}

// Session 設定
const fileStoreOptions = { logFn: function () {} }
app.use(
  session({
    store: new FileStore(fileStoreOptions),
    name: 'SESSION_ID',
    secret: '67f71af4602195de2450faeb6f8856c0',
    cookie: {
      maxAge: 30 * 86400000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
    resave: false,
    saveUninitialized: false,
  })
)

// 視圖引擎設定
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Health check 路由
app.get('/health', (req, res) => {
  const startTime = new Date().getTime()

  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'ok',
  }

  db.query('SELECT 1')
    .then(() => {
      health.database = 'connected'
      const responseTime = new Date().getTime() - startTime
      health.responseTime = `${responseTime}ms`
      logger.info('Health check passed', health)
      res.json(health)
    })
    .catch((err) => {
      health.status = 'error'
      health.database = 'disconnected'
      health.error = err.message
      logger.error('Health check failed', { error: err, health })
      res.status(503).json(health)
    })
})

// API 路由設定
app.use('/api/auth', authRouter)
app.use('/api/blog', blogRouter)
app.use('/api/login', loginRouter)
app.use('/api/signup', signupRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/users', usersRouter)
app.use('/api/events', eventsRouter)
app.use('/api/forgot-password', forgotPasswordRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/coupon-user', couponUserRouter)
app.use('/api/chat', chatRoutes)
app.use('/api', GroupRequests)

// 設定靜態檔案提供
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 測試資料庫連接
async function testConnection() {
  try {
    await db.query('SELECT 1')
    logger.info('Database connection successful')
  } catch (error) {
    logger.error('Database connection failed', { error })
    process.exit(1)
  }
}

testConnection()

// 404 處理
app.use(function (req, res, next) {
  next(createError(404))
})

// 錯誤處理
app.use(function (err, req, res, next) {
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
      body: req.body,
    },
  })

  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500).send({ error: err })
})

// 未捕獲的 Promise 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
  })
})

// 未捕獲的異常處理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: {
      message: error.message,
      stack: error.stack,
    },
  })

  setTimeout(() => process.exit(1), 1000)
})

export default app
