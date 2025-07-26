import express from 'express'
import { pool } from '#configs/db.js'
import multer from 'multer'
const upload = multer()
const router = express.Router()
import { generateHash } from '#db-helpers/password-hash.js'

// 註冊路由
router.post('/', upload.none(), async (req, res, next) => {
  // 取得資料庫連線
  const client = await pool.connect()

  try {
    // 解構請求資料
    const { email, password, phone, birthdate, gender } = req.body

    // 記錄接收到的資料
    console.log('接收到的註冊資料:', {
      email,
      phone,
      birthdate,
      gender,
    })

    // 驗證必要欄位
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '必填欄位未填寫完整',
      })
    }

    // 檢查 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: '無效的 email 格式',
      })
    }

    // 檢查 email 是否已存在
    const checkEmailQuery = `
      SELECT 1 FROM users 
      WHERE email = $1
    `
    const existingUser = await client.query(checkEmailQuery, [email])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: '此 email 已被註冊',
      })
    }

    // 密碼加密
    const hashedPassword = await generateHash(password)

    // 插入新用戶資料
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

    const result = await client.query(insertUserQuery, params)

    // 確認插入成功
    if (result.rows.length > 0) {
      return res.json({
        status: 'success',
        message: '註冊成功',
        data: {
          user_id: result.rows[0].user_id,
        },
      })
    } else {
      throw new Error('用戶資料插入失敗')
    }
  } catch (error) {
    console.error('註冊過程發生錯誤:', error)

    // 特定錯誤處理
    if (error.code === '23505') {
      // unique_violation
      return res.status(400).json({
        status: 'error',
        message: '此 email 已被註冊',
      })
    }

    // 其他錯誤
    return res.status(500).json({
      status: 'error',
      message: '註冊失敗，請稍後再試',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  } finally {
    // 釋放資料庫連線
    client.release()
  }
})

export default router
