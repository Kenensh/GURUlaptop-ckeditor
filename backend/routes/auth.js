import express from 'express'
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '#middlewares/authenticate.js'
import { pool } from '#configs/db.js'
import { compareHash, generateHash } from '#db-helpers/password-hash.js'
import multer from 'multer'
// 導入 Logger 系統
import {
  logAuth,
  logBusinessFlow,
  logDbQuery,
  logError
} from '#utils/logger.js'
import 'dotenv/config.js'

const router = express.Router()
const upload = multer()
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: isProduction ? '.onrender.com' : undefined,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

router.get('/check', authenticate, async (req, res) => {
  const requestId = req.requestId || Math.random().toString(36).substring(7)
  
  logBusinessFlow('Auth Check Request Started', {
    hasUser: !!req.user,
    userId: req.user?.user_id,
    userAgent: req.headers['user-agent']
  }, requestId, 'info')
  
  try {
    if (!req.user?.user_id) {
      logAuth('AUTH_CHECK', null, false, {
        reason: 'No user in request'
      }, requestId)
      
      return res.status(401).json({ status: 'error', message: '未授權' })
    }

    const query = `SELECT user_id, email, name, level FROM users WHERE user_id = $1 AND valid = true`
    const values = [req.user.user_id]
    
    logDbQuery(query, values, requestId, 'USER_VALIDATION')

    const result = await pool.query(query, values)

    if (!result.rows[0]) {
      logAuth('AUTH_CHECK', req.user.user_id, false, {
        reason: 'User not found or invalid'
      }, requestId)
      
      return res.status(404).json({ status: 'error', message: '找不到用戶' })
    }

    logAuth('AUTH_CHECK', req.user.user_id, true, {
      userLevel: result.rows[0].level,
      email: result.rows[0].email
    }, requestId)

    return res.json({
      status: 'success',
      data: { user: result.rows[0] },
    })
  } catch (error) {
    logError(error, {
      operation: 'AUTH_CHECK',
      userId: req.user?.user_id
    }, requestId)
    
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

router.post('/login', async (req, res) => {
  const requestId = req.requestId || Math.random().toString(36).substring(7)
  const { email, password } = req.body

  console.log(`[${requestId}] Login request received:`, {
    body: req.body,
    hasEmail: !!email,
    hasPassword: !!password,
    contentType: req.headers['content-type'],
    method: req.method,
    url: req.url
  })

  logBusinessFlow('Login Request Started', {
    email: email,
    hasPassword: !!password,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  }, requestId, 'info')

  try {
    // 驗證輸入
    if (!email || !password) {
      logAuth('LOGIN', email, false, {
        reason: 'Missing email or password'
      }, requestId)
      
      return res.status(400).json({
        status: 'error',
        message: '請輸入帳號和密碼',
      })
    }

    const query = 'SELECT * FROM users WHERE email = $1 AND valid = true'
    const values = [email]
    
    logDbQuery(query, values, requestId, 'USER_LOGIN_LOOKUP')

    const user = await pool.query(query, values)

    if (!user.rows[0]) {
      logAuth('LOGIN', email, false, {
        reason: 'User not found'
      }, requestId)
      
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    // 驗證密碼
    const passwordValid = await compareHash(password, user.rows[0].password)
    
    if (!passwordValid) {
      logAuth('LOGIN', email, false, {
        reason: 'Invalid password',
        userId: user.rows[0].user_id
      }, requestId)
      
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    // 登入成功，生成 JWT Token
    logBusinessFlow('Password Validation Successful', {
      userId: user.rows[0].user_id,
      email: email
    }, requestId, 'info')

    const token = jsonwebtoken.sign(
      {
        user_id: user.rows[0].user_id,
        email: user.rows[0].email,
        level: user.rows[0].level,
      },
      accessTokenSecret,
      { expiresIn: '30d' }
    )

    const userData = { ...user.rows[0] }
    delete userData.password

    // 設置 cookie 用於認證
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieConfig = {
      httpOnly: true,
      secure: isProduction, // HTTPS 必須為 true
      sameSite: isProduction ? 'none' : 'lax', // 跨域請求必須使用 'none'
      // 移除 domain 設定，讓瀏覽器自動處理
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
    }

    console.log(`[${requestId}] 設置 cookie:`, {
      token: token.substring(0, 20) + '...',
      cookieConfig,
      isProduction,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    })

    res.cookie('accessToken', token, cookieConfig)

    logAuth('LOGIN', email, true, {
      userId: user.rows[0].user_id,
      userLevel: user.rows[0].level,
      tokenGenerated: true,
      cookieSet: true
    }, requestId)

    logBusinessFlow('Login Successful', {
      userId: user.rows[0].user_id,
      email: email,
      userLevel: user.rows[0].level
    }, requestId, 'info')

    return res.json({
      status: 'success',
      data: {
        token,
        user: userData,
      },
    })
  } catch (error) {
    logError(error, {
      operation: 'LOGIN',
      email: email,
      hasPassword: !!password
    }, requestId)
    
    logAuth('LOGIN', email, false, {
      reason: 'System error',
      errorMessage: error.message
    }, requestId)
    
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

// 登出路由
router.post('/logout', (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Logout request received`)

  try {
    // 清除 accessToken cookie
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieConfig = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      // 移除 domain 設定，讓瀏覽器自動處理
      path: '/',
    }

    res.clearCookie('accessToken', cookieConfig)
    
    console.log(`[${requestId}] Cookie cleared successfully`)

    return res.json({
      status: 'success',
      message: '登出成功'
    })
  } catch (error) {
    console.error(`[${requestId}] Logout error:`, error)
    return res.status(500).json({ 
      status: 'error', 
      message: '登出失敗' 
    })
  }
})

router.post('/signup', upload.none(), async (req, res, next) => {
  const requestId = req.requestId || Math.random().toString(36).substring(7)
  
  console.log('=== SIGNUP REQUEST START ===')
  console.log('Request body:', req.body)
  console.log('Request headers:', req.headers)
  
  // 取得資料庫連線
  let client
  try {
    console.log('Attempting to get database connection...')
    client = await pool.connect()
    console.log('Database connection successful')
  } catch (dbError) {
    console.error('Database connection failed:', dbError)
    return res.status(500).json({
      status: 'error',
      message: '資料庫連線失敗',
      error: dbError.message
    })
  }

  try {
    // 解構請求資料
    const { email, password, phone, birthdate, gender } = req.body
    console.log('Extracted data:', { email, hasPassword: !!password, phone, birthdate, gender })

    // 記錄接收到的資料
    logBusinessFlow('Signup Request Started', {
      email,
      hasPhone: !!phone,
      hasBirthdate: !!birthdate,
      hasGender: !!gender,
    }, requestId, 'info')

    // 驗證必要欄位
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password })
      logAuth('SIGNUP', email, false, {
        reason: 'Missing required fields'
      }, requestId)
      
      return res.status(400).json({
        status: 'error',
        message: '必填欄位未填寫完整',
      })
    }

    // 檢查 email 格式
    console.log('Validating email format:', email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email)
      logAuth('SIGNUP', email, false, {
        reason: 'Invalid email format'
      }, requestId)
      
      return res.status(400).json({
        status: 'error',
        message: '無效的 email 格式',
      })
    }

    // 檢查 email 是否已存在
    console.log('Checking if email exists:', email)
    const checkEmailQuery = `SELECT 1 FROM users WHERE email = $1`
    console.log('Executing query:', checkEmailQuery, [email])
    const existingUser = await client.query(checkEmailQuery, [email])
    console.log('Email check result:', existingUser.rows.length)

    if (existingUser.rows.length > 0) {
      console.log('Email already exists:', email)
      logAuth('SIGNUP', email, false, {
        reason: 'Email already exists'
      }, requestId)
      
      return res.status(400).json({
        status: 'error',
        message: '此 email 已被註冊',
      })
    }

    // 密碼加密
    console.log('Hashing password...')
    const hashedPassword = await generateHash(password)
    console.log('Password hashed successfully')

    // 插入新用戶資料
    console.log('Preparing user insert query...')
    const insertUserQuery = `
      INSERT INTO users (
        email, 
        password, 
        phone, 
        birthdate, 
        gender,
        level, 
        valid, 
        created_at,
        country, 
        city, 
        district, 
        road_name, 
        detailed_address,
        name,
        image_path,
        google_uid,
        remarks
      ) VALUES (
        $1, $2, $3, $4, $5,
        0, true, CURRENT_TIMESTAMP,
        '', '', '', '', '',
        '', NULL, NULL, NULL
      )
      RETURNING user_id
    `

    const params = [
      email,
      hashedPassword,
      phone || null,
      birthdate || null,
      gender || null,
    ]

    console.log('Executing insert query with params:', { 
      email, 
      hasPassword: !!hashedPassword, 
      phone: phone || null, 
      birthdate: birthdate || null, 
      gender: gender || null 
    })
    
    logDbQuery(insertUserQuery, params, requestId, 'USER_CREATION')
    const result = await client.query(insertUserQuery, params)
    console.log('Insert query result:', result.rows)

    // 確認插入成功
    if (result.rows.length > 0) {
      console.log('User created successfully with ID:', result.rows[0].user_id)
      logAuth('SIGNUP', email, true, {
        userId: result.rows[0].user_id
      }, requestId)
      
      logBusinessFlow('Signup Successful', {
        userId: result.rows[0].user_id,
        email: email
      }, requestId, 'info')
      
      console.log('=== SIGNUP SUCCESS ===')
      return res.json({
        status: 'success',
        message: '註冊成功',
        data: {
          user_id: result.rows[0].user_id,
        },
      })
    } else {
      console.log('Insert query returned no rows')
      throw new Error('用戶資料插入失敗')
    }
  } catch (error) {
    console.log('=== SIGNUP ERROR ===')
    console.error('Signup error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    })
    
    logError(error, {
      operation: 'SIGNUP',
      email: req.body?.email,
      hasPassword: !!req.body?.password
    }, requestId)
    
    logAuth('SIGNUP', req.body?.email || 'unknown', false, {
      reason: 'System error',
      errorMessage: error.message
    }, requestId)

    // 特定錯誤處理
    if (error.code === '23505') {
      // unique_violation
      console.log('Unique constraint violation for email:', req.body?.email)
      return res.status(400).json({
        status: 'error',
        message: '此 email 已被註冊',
      })
    }

    // 其他錯誤
    console.log('Returning 500 error response')
    return res.status(500).json({
      status: 'error',
      message: '註冊失敗，請稍後再試',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  } finally {
    // 釋放資料庫連線
    console.log('Releasing database connection...')
    if (client) {
      client.release()
      console.log('Database connection released')
    }
    console.log('=== SIGNUP REQUEST END ===')
  }
})

export default router
