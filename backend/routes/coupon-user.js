import express from 'express'
import db from '../configs/db.js'
import multer from 'multer'

const router = express.Router()
const upload = multer()

router.post('/add/:userId', upload.none(), async (req, res, next) => {
  const client = await db.connect()
  try {
    console.log('=== 優惠券領取請求 ===')
    console.log('URL參數:', req.params)
    console.log('請求內容:', req.body)

    const userId = parseInt(req.params.userId)
    const couponId = parseInt(req.body.coupon_id)

    if (!userId || !couponId) {
      return res.status(400).json({
        status: 'error',
        message: '無效的參數',
        data: { userId, couponId },
      })
    }

    await client.query('BEGIN')

    const users = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userId]
    )

    if (users.rows.length === 0) {
      throw new Error('使用者不存在或已被停用')
    }

    const coupons = await client.query(
      'SELECT coupon_id FROM coupon WHERE coupon_id = $1 AND valid = true',
      [couponId]
    )

    if (coupons.rows.length === 0) {
      throw new Error('優惠券不存在或已失效')
    }

    const existingCoupons = await client.query(
      'SELECT id FROM coupon_user WHERE user_id = $1 AND coupon_id = $2',
      [userId, couponId]
    )

    if (existingCoupons.rows.length > 0) {
      throw new Error('您已經領取過這張優惠券')
    }

    const result = await client.query(
      'INSERT INTO coupon_user (user_id, coupon_id, valid) VALUES ($1, $2, true) RETURNING id',
      [userId, couponId]
    )

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: '優惠券領取成功',
      data: {
        id: result.rows[0].id,
        user_id: userId,
        coupon_id: couponId,
        created_at: new Date(),
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('錯誤詳情:', error)
    res.status(error.message.includes('不存在') ? 400 : 500).json({
      status: 'error',
      message: error.message || '系統錯誤',
    })
  } finally {
    client.release()
  }
})

router.get('/:userId', async (req, res) => {
  const client = await db.connect()
  try {
    const userId = parseInt(req.params.userId)

    if (!userId || userId <= 0) {
      return res.status(400).json({
        status: 'error',
        message: '無效的用戶編號',
      })
    }

    const userExists = await client.query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [userId]
    )

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '用戶不存在或已被停用',
      })
    }

    const validCoupons = await client.query(
      `SELECT 
       cu.id,
       cu.user_id,
       cu.coupon_id,
       cu.valid as user_coupon_valid,
       c.coupon_code,
       c.coupon_content,
       c.discount_method,
       c.coupon_discount,
       c.coupon_start_time,
       c.coupon_end_time,
       c.valid as coupon_valid,
       u.name as user_name,
       u.email as user_email,
       u.phone as user_phone,
       u.level as user_level
     FROM coupon_user cu
     JOIN coupon c ON cu.coupon_id = c.coupon_id
     JOIN users u ON cu.user_id = u.user_id
     WHERE cu.user_id = $1 
     AND cu.valid = true
     ORDER BY cu.id DESC`,
      [userId]
    )

    res.json({
      status: 'success',
      data: validCoupons.rows,
      message:
        validCoupons.rows.length === 0 ? '目前沒有可用的優惠券' : '查詢成功',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      status: 'error',
      message: '系統錯誤',
    })
  } finally {
    client.release()
  }
})

router.put('/update/:userId/:coupon_id', async (req, res) => {
  const client = await db.connect()
  try {
    const userId = req.params.userId
    const coupon_id = req.params.coupon_id

    if (!userId || !coupon_id) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要參數',
      })
    }

    await client.query('BEGIN')

    const result = await client.query(
      'UPDATE coupon_user SET valid = false WHERE user_id = $1 AND coupon_id = $2 RETURNING *',
      [userId, coupon_id]
    )

    if (result.rows.length === 0) {
      throw new Error('找不到符合條件的優惠券')
    }

    await client.query('COMMIT')

    res.json({
      status: 'success',
      message: '優惠券狀態已更新',
      data: {
        user_id: userId,
        coupon_id,
        updated_at: new Date(),
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('錯誤詳情:', error)
    res.status(error.message.includes('找不到') ? 400 : 500).json({
      status: 'error',
      message: error.message || '系統錯誤',
    })
  } finally {
    client.release()
  }
})

export default router
