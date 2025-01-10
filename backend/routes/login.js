import express from 'express'
import authenticate from '#middlewares/authenticate.js'
import { pool } from '##/configs/db.js'
import multer from 'multer'
import jsonwebtoken from 'jsonwebtoken'
import { compareHash } from '#db-helpers/password-hash.js'

const upload = multer()
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
const router = express.Router()

/* GET home page. */
router.post('/', upload.none(), async (req, res, next) => {
  try {
    const { email, password } = req.body

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND valid = true',
      [email]
    )

    // 查無此用戶
    if (result.rows.length === 0) {
      return res.json({
        status: 'error',
        message: '帳號或密碼錯誤。或已停用本帳號，請聯繫客服',
      })
    }

    const user = result.rows[0]

    // 檢查帳號是否被停用
    if (!user.valid) {
      return res.json({
        status: 'error',
        message: '此帳號已被停用',
      })
    }

    // compareHash比對輸入與資料庫中的密碼
    const passwordMatch = await compareHash(password, user.password)

    // 密碼錯誤
    if (!passwordMatch) {
      return res.json({
        status: 'error',
        message: '帳號或密碼錯誤',
      })
    }

    // 產生 JWT token
    const token = jsonwebtoken.sign(
      {
        user_id: user.user_id,
        email: user.email,
        country: user.country,
        city: user.city,
        road_name: user.road_name,
        detailed_address: user.detailed_address,
        level: user.level,
        phone: user.phone,
      },
      accessTokenSecret,
      { expiresIn: '2d' }
    )

    res.cookie('accessToken', token)

    res.json({
      status: 'success',
      data: {
        token,
      },
    })
  } catch (error) {
    console.error('登入錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '系統錯誤或帳號已停用',
    })
  }
})

router.post('/logout', authenticate, (req, res) => {
  // 清除cookie
  res.clearCookie('accessToken', { httpOnly: true })
  res.json({ status: 'success', data: null })
})

router.post('/status', checkToken, (req, res) => {
  const user = req.decoded
  if (user) {
    const token = jsonwebtoken.sign(
      {
        account: user.account,
        name: user.name,
        mail: user.mail,
        head: user.head,
      },
      accessTokenSecret,
      { expiresIn: '30m' }
    )
    res.json({
      status: 'token ok',
      token,
    })
  } else {
    res.status(401).json({
      status: 'error',
      message: '請登入',
    })
  }
})

function checkToken(req, res, next) {
  const token = req.get('Authorization')

  if (token) {
    jsonwebtoken.verify(token, accessTokenSecret, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ status: 'error', message: '登入驗證失效，請重新登入。' })
      } else {
        req.decoded = decoded
        next()
      }
    })
  } else {
    return res
      .status(401)
      .json({ status: 'error', message: '無登入驗證資料，請重新登入。' })
  }
}

export default router
