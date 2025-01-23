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

const app = express()

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 初始化 FileStore
const FileStore = sessionFileStore(session)

// 定義允許的來源
const allowedOrigins = [
  'http://localhost:3000',
  'https://gurulaptop-ckeditor-frontend.onrender.com',
]

// CORS 配置優化
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  preflightContinue: false
}

// 1. 基礎安全中間件
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// 2. 基本解析中間件
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(cookieParser(process.env.COOKIE_SECRET || '67f71af4602195de2450faeb6f8856c0'))

// 3. Session 配置
app.use(session(sessionConfig))

// 4. Logging 中間件
app.use(morganLogger('dev'))
app.use(requestLogger)

// 5. 靜態檔案
app.use(express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(uploadDir))

// 6. API 路由
app.get('/health', async (req, res) => { ... })  // health check handler
app.use('/api/auth/login', loginRouter)
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

// 7. 錯誤處理
app.use((req, res, next) => {
  const err = createError(404)
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  })
  next(err)
})

app.use((err, req, res, next) => { ... })  // 錯誤處理中間件

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
