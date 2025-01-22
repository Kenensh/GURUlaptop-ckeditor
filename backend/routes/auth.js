import express from 'express'
const router = express.Router()
import multer from 'multer'
import { pool } from '../configs/db.js'
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '../middlewares/authenticate.js'
import 'dotenv/config.js'
import { compareHash } from '../db-helpers/password-hash.js'

const upload = multer()
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

// Cookie 設定
const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  domain: isProduction ? '.onrender.com' : 'localhost',
  maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
}

// 身份驗證檢查
router.get('/check', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始驗證用戶狀態`)

  try {
    if (!req.user?.user_id) {
      console.log(`[${requestId}] 驗證失敗：未提供用戶ID`)
      return res.status(401).json({ status: 'error', message: '未授權' })
    }

    const result = await pool.query(
      `SELECT user_id, email, name, level, gender, phone, 
              city, district, road_name, detailed_address, 
              image_path, remarks
       FROM users WHERE user_id = $1 AND valid = 1`,
      [req.user.user_id]
    )

    if (!result.rows[0]) {
      console.log(`[${requestId}] 驗證失敗：找不到用戶 ID ${req.user.user_id}`)
      return res.status(404).json({ status: 'error', message: '找不到用戶' })
    }

    console.log(`[${requestId}] 驗證成功：用戶 ${result.rows[0].email}`)
    return res.json({
      status: 'success',
      data: { user: result.rows[0] }
    })
  } catch (error) {
    console.error(`[${requestId}] 驗證過程發生錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      details: isProduction ? null : error.message
    })
  }
})

// 登入處理
router.post('/login', upload.none(), async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始處理登入請求`)

  const { email, password } = req.body

  console.log(`[${requestId}] 登入資訊:`, {
    email: email ? '已提供' : '未提供',
    password: password ? '已提供' : '未提供',
    headers: {
      'content-type': req.get('content-type'),
      'origin': req.get('origin')
    }
  })

  if (!email || !password) {
    console.log(`[${requestId}] 登入失敗：缺少必要資料`)
    return res.status(400).json({
      status: 'error',
      message: '請提供完整的登入資訊',
      details: {
        email: !email ? '請提供電子郵件' : null,
        password: !password ? '請提供密碼' : null
      }
    })
  }

  try {
    console.log(`[${requestId}] 查詢用戶資料：${email}`)
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = 1',
      [email]
    )

    console.log(`[${requestId}] 查詢結果:`, {
      found: result.rows.length > 0,
      rowCount: result.rows.length
    })

    if (result.rows.length === 0) {
      console.log(`[${requestId}] 登入失敗：找不到用戶 ${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤'
      })
    }

    const user = result.rows[0]
    const passwordMatch = await compareHash(password, user.password)

    if (!passwordMatch) {
      console.log(`[${requestId}] 登入失敗：密碼錯誤 ${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤'
      })
    }

    console.log(`[${requestId}] 生成 token...`)
    const tokenData = {
      user_id: user.user_id,
      email: user.email,
      level: user.level
    }

    const accessToken = jsonwebtoken.sign(tokenData, accessTokenSecret, {
      expiresIn: '3d'
    })

    console.log(`[${requestId}] 設置 cookie 和 headers...`)

    // 設置安全相關的 headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    // 設置 cookie
    res.cookie('accessToken', accessToken, cookieConfig)

    // 準備回傳的用戶資料
    const userData = { ...user }
    delete userData.password

    console.log(`[${requestId}] 登入成功：${email}`)
    return res.json({
      status: 'success',
      data: {
        user: userData,
        token: isProduction ? undefined : accessToken // 開發環境才回傳 token
      }
    })
  } catch (error) {
    console.error(`[${requestId}] 登入過程發生錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      details: isProduction ? null : error.message
    })
  }
})

// 登出處理
router.post('/logout', authenticate, (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 處理登出請求`)

  try {
    res.clearCookie('accessToken', {
      ...cookieConfig,
      maxAge: 0
    })

    console.log(`[${requestId}] 登出成功`)
    return res.json({ status: 'success', message: '登出成功' })
  } catch (error) {
    console.error(`[${requestId}] 登出過程發生錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '登出失敗',
      details: isProduction ? null : error.message
    })
  }
})

export { router as default }