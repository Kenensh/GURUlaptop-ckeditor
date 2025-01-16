import * as fs from 'fs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import express from 'express'
import db from './configs/db.js'
import logger from 'morgan'
import path from 'path'
import session from 'express-session'
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

// 使用檔案的session store，存在sessions資料夾
import sessionFileStore from 'session-file-store'
const FileStore = sessionFileStore(session)

// 修正 ESM 中的 __dirname
import { fileURLToPath, pathToFileURL } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 讓console.log呈現檔案與行號，與字串訊息呈現顏色用
import { extendLog } from '#utils/tool.js'
import 'colors'
extendLog()

// 建立 Express 應用程式
const app = express()

// 添加 health check 路由 (放在最前面以確保快速響應)
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
      console.log(
        `Health check passed in ${responseTime}ms at ${new Date().toISOString()}`
      )
      res.json(health)
    })
    .catch((err) => {
      health.status = 'error'
      health.database = 'disconnected'
      health.error = err.message
      console.error('Health check failed:', err)
      res.status(503).json(health)
    })
})

// CORS 設定
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://localhost:9000',
      'https://gurulaptop-ckeditor-frontend.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 視圖引擎設定
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// 記錄HTTP要求
app.use(logger('dev'))
// 剖析 POST 與 PUT 要求的JSON格式資料
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: false, limit: '20mb' }))
// 剖折 Cookie 標頭與增加至 req.cookies
app.use(cookieParser())
// 在 public 的目錄，提供影像、CSS 等靜態檔案
app.use(express.static(path.join(__dirname, 'public')))

// 添加伺服器基本信息路由
app.get('/api/server-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  })
})

// 手動註冊路由
app.use('/api/auth', authRouter)
app.use('/api/blog', blogRouter) // 添加 blog 路由
app.use('/api/login', loginRouter)
app.use('/api/signup', signupRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/users', usersRouter)
app.use('/api/events', eventsRouter)
app.use('/api/forgot-password', forgotPasswordRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/coupon-user', couponUserRouter)

// 測試資料庫連接
async function testConnection() {
  try {
    await db.query('SELECT 1')
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

testConnection()

// Session 設定
const fileStoreOptions = { logFn: function () {} }
app.use(
  session({
    store: new FileStore(fileStoreOptions),
    name: 'SESSION_ID',
    secret: '67f71af4602195de2450faeb6f8856c0',
    cookie: {
      maxAge: 30 * 86400000,
    },
    resave: false,
    saveUninitialized: false,
  })
)

// 自動載入路由
const apiPath = '/api'
const routePath = path.join(__dirname, 'routes')
const filenames = await fs.promises.readdir(routePath)

for (const filename of filenames) {
  const item = await import(pathToFileURL(path.join(routePath, filename)))
  const slug = filename.split('.')[0]
  app.use(`${apiPath}/${slug === 'index' ? '' : slug}`, item.default)
}

// 錯誤處理
app.use(function (req, res, next) {
  next(createError(404))
})

app.use(function (err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.status(500).send({ error: err })
})

// 設定靜態檔案提供
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'public', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 使用聊天室路由
app.use('/api/chat', chatRoutes)
app.use('/api/', GroupRequests)

export default app
