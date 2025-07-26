import express from 'express'
const router = express.Router()
import multer from 'multer'
import bcrypt from 'bcrypt'
import { pool } from '#configs/db.js'
import authenticate from '#middlewares/authenticate.js'
import { compareHash } from '#db-helpers/password-hash.js'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'

// multer 設定
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/avatar/')
  },
  filename: (req, file, callback) => {
    const newFilename = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`
    callback(null, newFilename)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('不支援的檔案類型'))
      return
    }
    cb(null, true)
  },
})

// GET - 獲取所有用戶
router.get('/', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  console.log(`[${requestId}] 開始獲取所有用戶`)

  const client = await pool.connect()
  try {
    const result = await client.query(`
      SELECT user_id, email, name, level, created_at 
      FROM users 
      WHERE valid = true
      ORDER BY created_at DESC
    `)

    console.log(`[${requestId}] 成功獲取用戶列表，共 ${result.rows.length} 筆`)
    return res.json({
      status: 'success',
      data: { users: result.rows },
    })
  } catch (error) {
    console.error(`[${requestId}] 獲取用戶列表失敗:`, error)
    return res.status(500).json({
      status: 'error',
      message: '獲取用戶列表失敗',
      details: isProduction ? null : error.message,
    })
  } finally {
    client.release()
  }
})

// GET - 獲取單一用戶
router.get('/:id', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  const { id } = req.params
  console.log(`[${requestId}] 開始獲取用戶 ID ${id}`)

  if (req.user.user_id !== parseInt(id)) {
    console.log(
      `[${requestId}] 存取未授權: 用戶 ${req.user.user_id} 嘗試獲取用戶 ${id} 的資料`
    )
    return res.status(403).json({
      status: 'error',
      message: '未授權的存取',
    })
  }

  try {
    const result = await pool.query(
      `
      SELECT user_id, email, name, level, gender, phone,
             city, district, road_name, detailed_address, 
             image_path, remarks, created_at
      FROM users 
      WHERE user_id = $1 AND valid = true
    `,
      [id]
    )

    if (result.rows.length === 0) {
      console.log(`[${requestId}] 找不到用戶 ${id}`)
      return res.status(404).json({
        status: 'error',
        message: '找不到用戶',
      })
    }

    console.log(`[${requestId}] 成功獲取用戶 ${id} 的資料`)
    return res.json({
      status: 'success',
      data: { user: result.rows[0] },
    })
  } catch (error) {
    console.error(`[${requestId}] 獲取用戶資料失敗:`, error)
    return res.status(500).json({
      status: 'error',
      message: '獲取用戶資料失敗',
      details: isProduction ? null : error.message,
    })
  }
})

// PUT - 更新用戶資料
router.put('/:id/profile', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  const { id } = req.params
  console.log(`[${requestId}] 開始更新用戶 ${id} 的資料`)

  if (req.user.user_id !== parseInt(id)) {
    console.log(
      `[${requestId}] 更新未授權: 用戶 ${req.user.user_id} 嘗試更新用戶 ${id} 的資料`
    )
    return res.status(403).json({
      status: 'error',
      message: '未授權的操作',
    })
  }

  const updateData = req.body
  const allowedFields = [
    'name',
    'gender',
    'phone',
    'city',
    'district',
    'road_name',
    'detailed_address',
    'image_path',
    'remarks',
  ]

  // 過濾不允許更新的欄位
  const filteredData = Object.keys(updateData)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = updateData[key]
      return obj
    }, {})

  if (Object.keys(filteredData).length === 0) {
    return res.status(400).json({
      status: 'error',
      message: '未提供有效的更新資料',
    })
  }

  try {
    // 構建更新語句
    const setClause = Object.keys(filteredData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')
    const values = [id, ...Object.values(filteredData)]

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND valid = true 
      RETURNING user_id, email, name, level, gender, phone,
                city, district, road_name, detailed_address, 
                image_path, remarks, updated_at
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      console.log(`[${requestId}] 更新失敗: 找不到用戶 ${id}`)
      return res.status(404).json({
        status: 'error',
        message: '找不到用戶或更新失敗',
      })
    }

    console.log(`[${requestId}] 成功更新用戶 ${id} 的資料`)
    return res.json({
      status: 'success',
      data: { user: result.rows[0] },
    })
  } catch (error) {
    console.error(`[${requestId}] 更新用戶資料失敗:`, error)
    return res.status(500).json({
      status: 'error',
      message: '更新用戶資料失敗',
      details: isProduction ? null : error.message,
    })
  }
})

// PUT - 更新密碼
router.put('/:id/password', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(7)
  const { id } = req.params
  console.log(`[${requestId}] 開始更新用戶 ${id} 的密碼`)

  if (req.user.user_id !== parseInt(id)) {
    console.log(
      `[${requestId}] 更新密碼未授權: 用戶 ${req.user.user_id} 嘗試更新用戶 ${id} 的密碼`
    )
    return res.status(403).json({
      status: 'error',
      message: '未授權的操作',
    })
  }

  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      status: 'error',
      message: '請提供當前密碼和新密碼',
    })
  }

  try {
    // 驗證當前密碼
    const user = await pool.query(
      'SELECT password FROM users WHERE user_id = $1 AND valid = true',
      [id]
    )

    if (user.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到用戶',
      })
    }

    const isValid = await compareHash(currentPassword, user.rows[0].password)

    if (!isValid) {
      console.log(`[${requestId}] 密碼驗證失敗: 用戶 ${id}`)
      return res.status(401).json({
        status: 'error',
        message: '當前密碼錯誤',
      })
    }

    // 更新密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await pool.query(
      `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $2 AND valid = true
    `,
      [hashedPassword, id]
    )

    console.log(`[${requestId}] 成功更新用戶 ${id} 的密碼`)
    return res.json({
      status: 'success',
      message: '密碼更新成功',
    })
  } catch (error) {
    console.error(`[${requestId}] 更新密碼失敗:`, error)
    return res.status(500).json({
      status: 'error',
      message: '更新密碼失敗',
      details: isProduction ? null : error.message,
    })
  }
})

// POST - 上傳頭像
router.post(
  '/upload-avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res) => {
    const requestId = Math.random().toString(36).substring(7)
    console.log(`[${requestId}] 開始處理頭像上傳`)

    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: '未提供檔案',
        })
      }

      // 更新資料庫中的頭像路徑
      const result = await pool.query(
        `
      UPDATE users 
      SET image_path = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $2 AND valid = true 
      RETURNING user_id, image_path
    `,
        [req.file.filename, req.user.user_id]
      )

      if (result.rows.length === 0) {
        console.log(
          `[${requestId}] 更新頭像失敗: 找不到用戶 ${req.user.user_id}`
        )
        return res.status(404).json({
          status: 'error',
          message: '更新頭像失敗',
        })
      }

      console.log(`[${requestId}] 成功更新用戶 ${req.user.user_id} 的頭像`)
      return res.json({
        status: 'success',
        data: {
          image_path: result.rows[0].image_path,
        },
      })
    } catch (error) {
      console.error(`[${requestId}] 頭像上傳失敗:`, error)
      return res.status(500).json({
        status: 'error',
        message: '頭像上傳失敗',
        details: isProduction ? null : error.message,
      })
    }
  }
)

export default router
