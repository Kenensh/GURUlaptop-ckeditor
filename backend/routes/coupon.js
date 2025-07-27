import express from 'express'
const router = express.Router()
import { pool } from '../configs/db.js'
import multer from 'multer'

const upload = multer()

router.get('/', async (req, res) => {
  try {
    const coupons = await pool.query(`
     SELECT 
       coupon_id,
       coupon_code,
       coupon_content, 
       discount_method,
       coupon_discount,
       coupon_start_time,
       coupon_end_time,
       valid
     FROM coupon
     WHERE valid = 1
     ORDER BY coupon_id ASC`)

    if (coupons.rows.length === 0) {
      return res.json({
        status: 'success',
        data: {
          coupons: [],
        },
        message: '目前沒有可用的優惠券',
      })
    }

    return res.json({
      status: 'success',
      data: {
        coupons: coupons.rows,
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤',
    })
  }
})

router.get('/:coupon_id', async (req, res) => {
  const coupon_id = req.params.coupon_id

  try {
    const coupon = await pool.query('SELECT * FROM coupon WHERE coupon_id = $1 AND valid = 1', [
      coupon_id,
    ])

    if (coupon.rows.length === 0) {
      return res.json({
        status: 'success',
        data: {
          coupon: null,
        },
        message: '找不到該優惠券',
      })
    }

    return res.json({
      status: 'success',
      data: {
        coupon: coupon.rows[0],
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({
      status: 'error',
      message: '伺服器錯誤',
    })
  }
})

export default router
