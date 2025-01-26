import express from 'express'
import jsonwebtoken from 'jsonwebtoken'
import authenticate from '../middlewares/authenticate.js'
import { pool } from '../configs/db.js'
import { compareHash } from '../db-helpers/password-hash.js'
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
  const requestId = Math.random().toString(36).substring(7)
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ status: 'error', message: '未授權' })
    }

    const result = await pool.query(
      `SELECT user_id, email, name, level FROM users WHERE user_id = $1 AND valid = true`,
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
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

router.post('/login', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] Cookie設定:`, {
    cookie: res.getHeader('Set-Cookie'),
    config: cookieConfig,
  })

  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = true',
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
    console.log(`[${requestId}] 設定cookie後:`, res.getHeader('Set-Cookie'))

    const userData = { ...user.rows[0] }
    delete userData.password

    return res.json({
      status: 'success',
      data: {
        user: userData,
        token,
      },
    })
  } catch (error) {
    console.error(`[${requestId}] 登入錯誤:`, error)
    return res.status(500).json({ status: 'error', message: '系統錯誤' })
  }
})

export default router
