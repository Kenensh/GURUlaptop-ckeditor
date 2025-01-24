import express from 'express'
const router = express.Router()
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '../middlewares/authenticate.js'
import { pool } from '../configs/db.js'
import { compareHash } from '../db-helpers/password-hash.js'
import 'dotenv/config.js'

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const isProduction = process.env.NODE_ENV === 'production'

const cookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  domain: isProduction ? '.onrender.com' : undefined,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
}

router.get('/check', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)

  try {
    if (!req.user?.user_id) {
      console.log(`[${requestId}] 驗證失敗：未提供用戶ID`)
      return res.status(401).json({ status: 'error', message: '未授權' })
    }

    const result = await pool.query(
      `SELECT user_id, email, name, level FROM users WHERE user_id = $1 AND valid = 1`,
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
    console.error(`[${requestId}] 驗證錯誤:`, error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
})

router.post('/login', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  const { email, password } = req.body

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = 1',
      [email]
    )

    if (
      !user.rows[0] ||
      !(await compareHash(password, user.rows[0].password))
    ) {
      return res.status(401).json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    const token = jsonwebtoken.sign(
      {
        user_id: user.rows[0].user_id,
        email: user.rows[0].email,
        level: user.rows[0].level,
      },
      accessTokenSecret,
      { expiresIn: '30d' }
    )

    res.cookie('accessToken', token, cookieConfig)

    const userData = { ...user.rows[0] }
    delete userData.password

    // 確保 token 也返回給前端
    return res.json({
      status: 'success',
      data: {
        user: userData,
        token,
        cookieStatus: true, // 方便調試
      },
    })
  } catch (error) {
    console.error(`[${requestId}] 登入錯誤:`, error)
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

export default router
