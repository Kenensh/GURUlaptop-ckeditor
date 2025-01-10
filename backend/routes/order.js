import express from 'express'
const router = express.Router()

import { pool } from '##/configs/db.js'
import multer from 'multer'
const upload = multer()

/* GET home page. */
router.put('/', upload.none(), async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { order_id } = req.body

    const result = await client.query(
      'UPDATE order_list SET already_pay = true WHERE order_id = $1 RETURNING *',
      [order_id]
    )

    // 檢查是否有更新到資料
    if (result.rowCount === 0) {
      return res.status(404).json({
        status: 'error',
        message: '找不到訂單',
      })
    }

    res.json({
      status: 'success',
      message: '已付款成功',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('更新訂單狀態錯誤:', error)
    res.status(500).json({
      status: 'error',
      message: '更新訂單狀態失敗',
    })
  } finally {
    client.release()
  }
})

export default router
