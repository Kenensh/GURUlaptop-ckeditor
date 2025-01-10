import express from 'express'
import { pool } from '##/configs/db.js'
import multer from 'multer'
const upload = multer()
const router = express.Router()
import { generateHash } from '#db-helpers/password-hash.js'

router.post('/', upload.none(), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { email, password, phone, birthdate, gender } = req.body

    // 看解構後的值
    console.log('解構後的值:', {
      email,
      password,
      phone,
      birthdate,
      gender,
    })

    if (!password) {
      throw new Error('密碼未接收到')
    }

    // 檢查是否已經有相同的 email
    const existingResult = await client.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    )

    if (existingResult.rows.length > 0) {
      return res.json({
        status: 'error',
        message: '電子郵件已被註冊!!!請使用其他email',
      })
    }

    // 產生加密密碼
    const hashedPassword = await generateHash(password)

    // PostgreSQL 插入語句
    const sql = `
      INSERT INTO users (
        email, password, phone, birthdate, gender,
        level, valid, created_at,
        country, city, district, road_name, detailed_address
      ) VALUES (
        $1, $2, $3, $4, $5,
        0, true, NOW(),
        '', '', '', '', ''
      )
      RETURNING user_id
    `

    const params = [
      email,
      hashedPassword,
      phone || null,
      birthdate || null,
      gender === '' ? null : gender,
    ]

    const result = await client.query(sql, params)

    if (result.rows.length > 0) {
      return res.json({
        status: 'success',
        message: '註冊成功',
        data: {
          user_id: result.rows[0].user_id,
        },
      })
    }

    throw new Error('資料插入失敗')
  } catch (error) {
    console.error('註冊失敗:', error)

    // PostgreSQL 的唯一約束違反錯誤代碼
    if (error.code === '23505') {
      // unique_violation
      return res.status(400).json({
        status: 'error',
        message: '此 email 已被註冊...',
      })
    }

    return res.status(500).json({
      status: 'error',
      message: '系統錯誤，請稍後再試',
    })
  } finally {
    client.release()
  }
})

export default router
