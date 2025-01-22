import express from 'express'
import authenticate from '#middlewares/authenticate.js'
import { pool } from '##/configs/db.js'
import multer from 'multer'
import jsonwebtoken from 'jsonwebtoken'
import { compareHash } from '#db-helpers/password-hash.js'

const upload = multer()
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const router = express.Router()
const isProduction = process.env.NODE_ENV === 'production'

// 統一的 Cookie 設定
const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  domain: isProduction ? '.onrender.com' : 'localhost',
  maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
}

/* 登入路由 */
router.post('/', upload.none(), async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始處理登入請求`)

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '請提供完整登入資訊',
      })
    }

    // 明確列出需要的欄位
    const result = await pool.query(
      `SELECT 
        user_id, email, password, name, level, 
        gender, phone, country, city, district, 
        road_name, detailed_address, image_path, 
        remarks, valid, birthdate, google_uid
       FROM users 
       WHERE email = $1 AND valid = true`,
      [email]
    )

    // 查無此用戶
    if (result.rows.length === 0) {
      console.log(`[${requestId}] 找不到用戶:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤。或已停用本帳號，請聯繫客服',
      })
    }

    const user = result.rows[0]

    // 檢查帳號是否被停用
    if (!user.valid) {
      console.log(`[${requestId}] 帳號已停用:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '此帳號已被停用',
      })
    }

    // compareHash比對輸入與資料庫中的密碼
    const passwordMatch = await compareHash(password, user.password)

    // 密碼錯誤
    if (!passwordMatch) {
      console.log(`[${requestId}] 密碼錯誤:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    // 產生 JWT token，只包含必要資訊
    const tokenData = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      level: user.level,
      phone: user.phone,
      country: user.country,
      city: user.city,
      district: user.district,
      road_name: user.road_name,
      detailed_address: user.detailed_address,
    }

    const token = jsonwebtoken.sign(tokenData, accessTokenSecret, {
      expiresIn: '2d',
    })

    // 使用統一的 cookie 設定
    res.cookie('accessToken', token, cookieConfig)

    // 移除敏感資訊
    const userData = { ...user }
    delete userData.password
    delete userData.google_uid

    console.log(`[${requestId}] 登入成功:${email}`)

    res.json({
      status: 'success',
      data: {
        user: userData,
        token,
      },
    })
  } catch (error) {
    console.error(`[${requestId}] 登入錯誤:`, error)
    res.status(500).json({
      status: 'error',
      message: '系統錯誤或帳號已停用',
      details: isProduction ? null : error.message,
    })
  }
})

router.post('/logout', authenticate, (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 處理登出請求`)

  try {
    res.clearCookie('accessToken', cookieConfig)
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

export default router
