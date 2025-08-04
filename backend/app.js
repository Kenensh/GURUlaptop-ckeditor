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
// 導入 Logger 系統
import logger from '#utils/logger.js'
import { requestLogger, errorLogger } from '#middlewares/logger.js'
import { DatabaseLogger } from '#utils/db-logger.js'
import 'colors'
import 'dotenv/config.js'

console.log('🚀 Starting application initialization...')
console.log('Environment:', process.env.NODE_ENV || 'development')
console.log('Port:', process.env.PORT || '3005')

// 導入資料庫和路由
console.log('📦 Loading database configuration...')
import db from './configs/db.js'
console.log('✅ Database configuration loaded')

console.log('📦 Loading route modules...')
import authRouter from './routes/auth.js'
import loginRouter from './routes/login.js'
import dashboardRouter from './routes/dashboard.js'
import usersRouter from './routes/users.js'
import eventsRouter from './routes/events.js'
import couponRouter from './routes/coupon.js'
import couponUserRouter from './routes/coupon-user.js'
import chatRoutes from './routes/chat.js'
import groupRouter from './routes/group.js'
import GroupRequests from './routes/group-request.js'
import blogRouter from './routes/blog.js'
import productsRouter from './routes/products.js'
import forgotPasswordRouter from './routes/forgot-password.js'
import healthRouter from './routes/health.js'
import cartRouter from './routes/cart.js'
import orderRouter from './routes/order.js'
import buyListRouter from './routes/buy-list.js'
console.log('✅ All route modules loaded successfully')

console.log('🏗️ Creating Express application...')
const app = express()
app.set('trust proxy', 1)
console.log('✅ Express application created')

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

const corsOptions = {
  origin: function (origin, callback) {
    // 允許的來源
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.0.12:3000',
      'https://gurulaptop-ckeditor-frontend.onrender.com'
    ]
    
    // 如果沒有 origin（如 Postman）或在允許列表中，則允許
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Credentials',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
  ],
  exposedHeaders: [
    'Set-Cookie',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200,
}

// 確保 CORS 中間件在所有路由之前
app.use(cors(corsOptions))

// 在所有中間件之前添加快速健康檢查
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  })
})

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is running',
    version: '1.2.0'
  })
})

// 明確處理預檢請求
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400')
  res.sendStatus(200)
})

const cookieConfig = {
  httpOnly: false, // 改為 false 讓前端可以存取
  secure: true, // HTTPS 環境下必須為 true
  sameSite: 'none', // 跨域必須設為 none
  domain: undefined, // 移除 domain 設定，讓瀏覽器自動處理
  path: '/',
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

// 初始化資料庫 Logger
const dbLogger = new DatabaseLogger(db.pool)
app.locals.dbLogger = dbLogger

// 應用程式啟動日誌
logger.info('🚀 Application Starting', {
  environment: process.env.NODE_ENV,
  port: process.env.PORT || 3005,
  timestamp: new Date().toISOString()
})

app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
app.use(
  cookieParser(process.env.COOKIE_SECRET || '67f71af4602195de2450faeb6f8856c0')
)
app.use(session(sessionConfig))
app.use(morganLogger('dev'))
// 使用我們的詳細 Logger 中間件
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
app.use('/api/products', productsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/users', usersRouter)
app.use('/api/events', eventsRouter)
app.use('/api/forgot-password', forgotPasswordRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/coupon-user', couponUserRouter)
app.use('/api/chat', chatRoutes)
app.use('/api/group', groupRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/buy-list', buyListRouter)
app.use('/api', GroupRequests)
// 健康檢查路由
app.use('/api', healthRouter)

// 添加主域名判斷
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && origin.includes('onrender.com')) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  next()
})

// 404 處理
app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control'
  )
  res.header('Access-Control-Allow-Credentials', 'true')
  const err = createError(404)
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  })
  next(err)
})

// 錯誤處理 - 使用我們的詳細 errorLogger 中間件
app.use(errorLogger)

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

export default app
