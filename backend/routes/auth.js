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
  maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
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
      data: { user: result.rows[0] },
    })
  } catch (error) {
    console.error(`[${requestId}] 驗證過程發生錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      details: isProduction ? null : error.message,
    })
  }
})

router.post('/login', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始處理登入請求`)

  const { email, password } = req.body

  console.log(`[${requestId}] 收到登入資訊:`, {
    email: email ? '已提供' : '未提供',
    body: req.body,
    headers: req.headers,
  })

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: '請提供完整登入資訊',
    })
  }

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = 1',
      [email]
    )

    if (user.rows.length === 0) {
      console.log(`[${requestId}] 找不到用戶:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    const passwordMatch = await compareHash(password, user.rows[0].password)

    if (!passwordMatch) {
      console.log(`[${requestId}] 密碼錯誤:${email}`)
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    const tokenData = {
      user_id: user.rows[0].user_id,
      email: user.rows[0].email,
      level: user.rows[0].level,
    }

    const accessToken = jsonwebtoken.sign(tokenData, accessTokenSecret, {
      expiresIn: '3d',
    })

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.onrender.com',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    })

    const userData = { ...user.rows[0] }
    delete userData.password

    console.log(`[${requestId}] 登入成功:${email}`)

    return res.json({
      status: 'success',
      data: { user: userData },
    })
  } catch (error) {
    console.error(`[${requestId}] 登入錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
      error: error.message,
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
      maxAge: 0,
    })

    console.log(`[${requestId}] 登出成功`)
    return res.json({ status: 'success', message: '登出成功' })
  } catch (error) {
    console.error(`[${requestId}] 登出過程發生錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '登出失敗',
      details: isProduction ? null : error.message,
    })
  }
})

export { router as default }
