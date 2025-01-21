import express from 'express'
const router = express.Router()
import multer from 'multer'
import { pool } from '../configs/db.js'
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '../middlewares/authenticate.js'
import 'dotenv/config.js'
import { compareHash, generateHash } from '../db-helpers/password-hash.js'

const upload = multer()
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

router.get('/check', authenticate, async (req, res) => {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ status: 'error', message: '未授權' })
    }

    const result = await pool.query(
      `SELECT user_id, email, name, level, gender, phone, 
              city, district, road_name, detailed_address, 
              image_path, remarks
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ status: 'error', message: '找不到用戶' })
    }

    return res.json({
      status: 'success',
      data: { user: result.rows[0] },
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

router.post('/login', upload.none(), async (req, res) => {
  console.log('開始處理登入請求...')
  const { email, password } = req.body

  if (!email || !password) {
    console.log('登入失敗：缺少必要資料')
    return res.status(400).json({ status: 'error', message: '缺少必要資料' })
  }

  try {
    console.log('查詢用戶資料...')
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ])

    if (result.rows.length === 0) {
      console.log('登入失敗：找不到用戶')
      return res
        .status(401)
        .json({ status: 'error', message: '帳號或密碼錯誤' })
    }

    const user = result.rows[0]
    const passwordMatch = await compareHash(password, user.password)

    if (!passwordMatch) {
      console.log('登入失敗：密碼錯誤')
      return res
        .status(401)
        .json({ status: 'error', message: '帳號或密碼錯誤' })
    }

    console.log('生成 token...')
    const tokenData = {
      user_id: user.user_id,
      email: user.email,
      level: user.level,
    }

    const accessToken = jsonwebtoken.sign(tokenData, accessTokenSecret, {
      expiresIn: '3d',
    })

    console.log('設置 cookie...')
    // 設置 no-cache header
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')

    // 更新 cookie 設定
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // 在生產環境總是使用 secure
      sameSite: 'none', // 跨站請求需要
      path: '/',
      maxAge: 3 * 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === 'production'
          ? 'onrender.com' // 移除前導點
          : 'localhost',
    })

    // 準備回傳的用戶資料
    const userData = { ...user }
    delete userData.password

    console.log('登入成功')
    return res.json({
      status: 'success',
      data: { user: userData },
    })
  } catch (error) {
    console.error('登入失敗:', error)
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  return res.json({ status: 'success', message: '登出成功' })
})

// 只匯出路由器
export { router as default }
