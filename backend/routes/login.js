import express from 'express'
import authenticate from '#middlewares/authenticate.js'
import { pool } from '##/configs/db.js'
import jsonwebtoken from 'jsonwebtoken'
import { compareHash } from '#db-helpers/password-hash.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const router = express.Router()
const isProduction = process.env.NODE_ENV === 'production'

// 統一的 Cookie 設定 (只保留一個定義)
const loginCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  domain: isProduction ? '.onrender.com' : 'localhost',
  maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
}

// 登入路由
router.post('/', express.json(), async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始處理登入請求`, {
    body: req.body,
    headers: req.headers,
  })

  try {
    const { email, password } = req.body || {} // 添加預設值防止解構錯誤

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '請提供完整登入資訊',
      })
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = true',
      [email]
    )

    if (result.rows.length === 0) {
      console.log(`[${requestId}] 找不到用戶:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    const user = result.rows[0]

    const passwordMatch = await compareHash(password, user.password)

    if (!passwordMatch) {
      console.log(`[${requestId}] 密碼錯誤:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    const token = jsonwebtoken.sign(
      {
        user_id: user.user_id,
        email: user.email,
        level: user.level,
      },
      accessTokenSecret,
      { expiresIn: '2d' }
    )

    res.cookie('accessToken', token, loginCookieConfig) // 使用重命名的設定

    const userData = { ...user }
    delete userData.password

    console.log(`[${requestId}] 登入成功:${email}`)

    res.json({
      status: 'success',
      data: {
        token,
        user: userData,
      },
    })
  } catch (error) {
    console.error(`[${requestId}] 登入錯誤:`, error)
    res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      details: isProduction ? null : error.message,
    })
  }
})

// 登出路由
router.post('/logout', authenticate, (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 處理登出請求`)

  try {
    res.clearCookie('accessToken', loginCookieConfig) // 使用重命名的設定
    console.log(`[${requestId}] 登出成功`)
    res.json({ status: 'success', data: null })
  } catch (error) {
    console.error(`[${requestId}] 登出錯誤:`, error)
    res.status(500).json({
      status: 'error',
      message: '登出失敗',
      details: isProduction ? null : error.message,
    })
  }
})

// 狀態檢查路由
router.post('/status', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 檢查登入狀態`)

  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: '無登入驗證資料，請重新登入',
    })
  }

  try {
    const decoded = jsonwebtoken.verify(token, accessTokenSecret)
    const newToken = jsonwebtoken.sign(
      {
        user_id: decoded.user_id,
        email: decoded.email,
        level: decoded.level,
      },
      accessTokenSecret,
      { expiresIn: '30m' }
    )

    console.log(`[${requestId}] Token 驗證成功:${decoded.email}`)
    res.json({
      status: 'success',
      token: newToken,
    })
  } catch (error) {
    console.error(`[${requestId}] Token 驗證失敗:`, error)
    return res.status(401).json({
      status: 'error',
      message: '登入驗證失效，請重新登入',
    })
  }
})


