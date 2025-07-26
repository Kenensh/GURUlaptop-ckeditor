/**
 * 系統健康檢查路由
 * 用於監控系統各個組件的狀態
 */

import express from 'express'
import { pool } from '#configs/db.js'
import { logBusinessFlow } from '#utils/logger.js'

const router = express.Router()

// 基本健康檢查
router.get('/health', async (req, res) => {
  const requestId = req.requestId
  const startTime = Date.now()
  
  logBusinessFlow('Health Check Started', {}, requestId, 'info')
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  }

  try {
    // 檢查資料庫連接
    const dbStart = Date.now()
    await pool.query('SELECT 1')
    health.checks.database = {
      status: 'ok',
      responseTime: Date.now() - dbStart
    }
    logBusinessFlow('Database Health Check Passed', { 
      responseTime: health.checks.database.responseTime 
    }, requestId, 'info')

  } catch (error) {
    health.status = 'error'
    health.checks.database = {
      status: 'error',
      error: error.message
    }
    logBusinessFlow('Database Health Check Failed', { 
      error: error.message 
    }, requestId, 'error')
  }

  // 檢查記憶體使用
  const memUsage = process.memoryUsage()
  health.checks.memory = {
    status: 'ok',
    usage: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    }
  }

  // 檢查磁碟空間 (簡化版)
  health.checks.disk = {
    status: 'ok',
    message: 'Disk check not implemented'
  }

  const totalTime = Date.now() - startTime
  health.responseTime = totalTime

  logBusinessFlow('Health Check Completed', {
    status: health.status,
    responseTime: totalTime,
    checksCount: Object.keys(health.checks).length
  }, requestId, 'info')

  const statusCode = health.status === 'ok' ? 200 : 503
  res.status(statusCode).json(health)
})

// 詳細系統狀態
router.get('/status', async (req, res) => {
  const requestId = req.requestId
  
  logBusinessFlow('System Status Check Started', {}, requestId, 'info')
  
  const status = {
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    },
    application: {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
    },
    memory: process.memoryUsage(),
    endpoints: {
      auth: '/api/auth',
      blog: '/api/blog', 
      users: '/api/users',
      products: '/api/products',
      cart: '/api/cart',
      order: '/api/order',
      events: '/api/events',
      coupon: '/api/coupon',
      chat: '/api/chat'
    }
  }

  logBusinessFlow('System Status Check Completed', {
    nodeVersion: status.system.nodeVersion,
    environment: status.application.environment,
    uptime: status.system.uptime
  }, requestId, 'info')

  res.json(status)
})

// 資料庫連接測試
router.get('/db-test', async (req, res) => {
  const requestId = req.requestId
  
  logBusinessFlow('Database Test Started', {}, requestId, 'info')
  
  try {
    const startTime = Date.now()
    
    // 測試基本查詢
    const result1 = await pool.query('SELECT NOW() as current_time')
    const basicQueryTime = Date.now() - startTime
    
    // 測試表存在性
    const tableStartTime = Date.now()
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    const tableQueryTime = Date.now() - tableStartTime
    
    // 測試用戶表
    const userStartTime = Date.now()
    const result3 = await pool.query('SELECT COUNT(*) as user_count FROM users')
    const userQueryTime = Date.now() - userStartTime

    const dbTest = {
      status: 'ok',
      timestamp: result1.rows[0].current_time,
      performance: {
        basicQuery: basicQueryTime + 'ms',
        tableQuery: tableQueryTime + 'ms', 
        userQuery: userQueryTime + 'ms'
      },
      tables: result2.rows.map(row => row.table_name),
      userCount: parseInt(result3.rows[0].user_count)
    }

    logBusinessFlow('Database Test Passed', {
      tableCount: dbTest.tables.length,
      userCount: dbTest.userCount,
      totalTime: basicQueryTime + tableQueryTime + userQueryTime
    }, requestId, 'info')

    res.json(dbTest)

  } catch (error) {
    logBusinessFlow('Database Test Failed', {
      error: error.message
    }, requestId, 'error')
    
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// API 端點測試
router.get('/api-test', async (req, res) => {
  const requestId = req.requestId
  
  logBusinessFlow('API Endpoints Test Started', {}, requestId, 'info')
  
  const endpoints = [
    { name: 'Auth Check', path: '/api/auth/check' },
    { name: 'Blog List', path: '/api/blog' },
    { name: 'User Profile', path: '/api/users/profile' },
    { name: 'Product List', path: '/api/products' },
    { name: 'Cart', path: '/api/cart' },
    { name: 'Events', path: '/api/events' }
  ]

  const results = []
  
  for (const endpoint of endpoints) {
    try {
      // 這裡可以內部調用或使用 HTTP 請求測試
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        status: 'available',
        note: 'Internal test not implemented'
      })
    } catch (error) {
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        status: 'error',
        error: error.message
      })
    }
  }

  logBusinessFlow('API Endpoints Test Completed', {
    totalEndpoints: results.length,
    availableEndpoints: results.filter(r => r.status === 'available').length
  }, requestId, 'info')

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: results
  })
})

export default router
