import express from 'express'
const router = express.Router()
import { pool as db } from '../configs/db.js'
import multer from 'multer'
const upload = multer()

router.get('/:user_id', upload.none(), async (req, res) => {
  try {
    const { user_id } = req.params

    if (!user_id) {
      return res.status(400).json({ status: 'error', message: '請先登入' })
    }

    const userResult = await db.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [user_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: '使用者不存在' })
    }

    const orderResult = await db.query(
      'SELECT * FROM order_list WHERE user_id = $1',
      [user_id]
    )

    if (orderResult.rows.length === 0) {
      return res.json({ status: 'success', message: '無訂單資料' })
    }

    return res.json({
      status: 'success',
      data: orderResult.rows,
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
})

router.get('/detail/:order_id', upload.none(), async (req, res) => {
  try {
    const { order_id } = req.params

    const result = await db.query(
      `SELECT 
       od.*,
       p.product_name,
       p.list_price,
       pi.product_img_path
     FROM order_detail od
     JOIN product p ON od.product_id = p.product_id
     JOIN product_img pi ON p.product_id = pi.img_product_id
     WHERE od.order_id = $1`,
      [order_id]
    )

    if (result.rows.length === 0) {
      return res.json({ status: 'success', message: '無訂單資料' })
    }

    return res.json({
      status: 'success',
      data: result.rows,
    })
  } catch (error) {
    console.error('Get order detail error:', error)
    return res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  }
})

export default router
