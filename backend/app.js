import * as fs from 'fs'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import createError from 'http-errors'
import express from 'express'
import db from './configs/db.js'
import logger from 'morgan'
import path from 'path'
// ... (其他 imports 保持不變)

const app = express()

// 添加 health check 路由 (放在最前面以確保快速響應)
app.get('/health', (req, res) => {
  const startTime = new Date().getTime()

  // 基本的健康檢查
  const health = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'ok',
  }

  // 簡單的資料庫檢查
  db.query('SELECT 1')
    .then(() => {
      health.database = 'connected'
      const responseTime = new Date().getTime() - startTime

      // 添加響應時間
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

// ... (其他配置保持不變)

// 添加伺服器基本信息路由
app.get('/api/server-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  })
})

// ... (後面的代碼保持不變)

export default app
