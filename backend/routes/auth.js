import express from 'express'
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '#middlewares/authenticate.js'
import { pool } from '#configs/db.js'
import { compareHash } from '#db-helpers/password-hash.js'
// 導入 Logger 系統
import {
  logAuth,
  logBusinessFlow,
  logDbQuery,
  logError
} from '#utils/logger.js'
import 'dotenv/config.js'

const router = express.Router()
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

    logAuth('LOGIN', email, true, {
      userId: user.rows[0].user_id,
      userLevel: user.rows[0].level,
      tokenGenerated: true
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

export default router
