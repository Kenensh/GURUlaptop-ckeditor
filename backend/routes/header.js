import express from 'express'
const router = express.Router()

import { pool } from '##/configs/db.js'
import multer from 'multer'

const upload = multer()

/* GET home page. */
router.post('/', upload.none(), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { user_id } = req.body

    const result = await client.query(
      'SELECT image_path FROM users WHERE user_id = $1',
      [user_id]
    )

    if (result.rows.length === 0) {
      return res.json({ image_path: null })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('獲取使用者圖片失敗:', error)
    res.status(500).json({
      status: 'error',
      message: '獲取使用者圖片失敗',
    })
  } finally {
    client.release()
  }
})

export default router
