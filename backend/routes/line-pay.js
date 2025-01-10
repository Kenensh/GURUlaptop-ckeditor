import express from 'express'
const router = express.Router()

import { pool } from '##/configs/db.js'
import authenticate from '#middlewares/authenticate.js'
import { createLinePayClient } from 'line-pay-merchant'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config.js'

const linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET,
  env: process.env.NODE_ENV,
})

// 在資料庫建立order資料(需要會員登入才能使用)
router.post('/create-order', async (req, res) => {
  const client = await pool.connect()
  try {
    const userId = req.body.userId
    const orderId = req.body.orderId
    const packageId = uuidv4()

    const order = {
      orderId: orderId,
      currency: 'TWD',
      amount: req.body.amount,
      packages: [
        {
          id: packageId,
          amount: req.body.amount,
          products: req.body.products,
        },
      ],
      options: { display: { locale: 'zh_TW' } },
    }

    // 在 PostgreSQL 中插入訂單資料
    const result = await client.query(
      `INSERT INTO purchase_order 
       (id, user_id, amount, status, order_info) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, userId, req.body.amount, 'pending', JSON.stringify(order)]
    )

    console.log(result.rows[0])

    res.json({ status: 'success', data: { order } })
  } catch (error) {
    console.error('建立訂單錯誤:', error)
    res.status(500).json({ status: 'error', message: '建立訂單失敗' })
  } finally {
    client.release()
  }
})

// 重新導向到line-pay
router.get('/reserve', async (req, res) => {
  const client = await pool.connect()
  try {
    if (!req.query.orderId) {
      return res.json({ status: 'error', message: 'order id不存在' })
    }

    const orderId = req.query.orderId
    const redirectUrls = {
      confirmUrl: process.env.REACT_REDIRECT_CONFIRM_URL + `?ID=${orderId}`,
      cancelUrl: process.env.REACT_REDIRECT_CANCEL_URL,
    }

    const orderResult = await client.query(
      'SELECT order_info FROM purchase_order WHERE id = $1',
      [orderId]
    )

    if (orderResult.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到訂單' })
    }

    const order = JSON.parse(orderResult.rows[0].order_info)
    console.log('獲得訂單資料，內容如下：')
    console.log(order)

    // 向line pay傳送訂單資料
    const linePayResponse = await linePayClient.request.send({
      body: { ...order, redirectUrls },
    })

    const reservation = JSON.parse(JSON.stringify(order))
    reservation.returnCode = linePayResponse.body.returnCode
    reservation.returnMessage = linePayResponse.body.returnMessage
    reservation.transactionId = linePayResponse.body.info.transactionId
    reservation.paymentAccessToken =
      linePayResponse.body.info.paymentAccessToken

    console.log('預計付款資料(Reservation)已建立。資料如下:')
    console.log(reservation)

    // 更新訂單資訊
    await client.query(
      'UPDATE purchase_order SET reservation = $1, transaction_id = $2 WHERE id = $3',
      [JSON.stringify(reservation), reservation.transactionId, orderId]
    )

    return res.redirect(linePayResponse.body.info.paymentUrl.web)
  } catch (error) {
    console.error('預約付款錯誤:', error)
    if (!res.headersSent) {
      return res.json({ status: 'error', message: '無法完成付款，請稍後再試' })
    }
  } finally {
    client.release()
  }
})

// 向Line Pay確認交易結果
router.get('/confirm', async (req, res) => {
  const client = await pool.connect()
  try {
    const transactionId = req.query.transactionId

    const orderResult = await client.query(
      'SELECT * FROM purchase_order WHERE transaction_id = $1',
      [transactionId]
    )

    if (orderResult.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到訂單' })
    }

    const dbOrder = orderResult.rows[0]
    console.log(dbOrder)

    const transaction = JSON.parse(dbOrder.reservation)
    console.log(transaction)

    const amount = transaction.amount

    // 最後確認交易
    const linePayResponse = await linePayClient.confirm.send({
      transactionId: transactionId,
      body: {
        currency: 'TWD',
        amount: amount,
      },
    })

    console.log(linePayResponse)

    let status = 'paid'
    if (linePayResponse.body.returnCode !== '0000') {
      status = 'fail'
    }

    // 更新訂單狀態
    const result = await client.query(
      'UPDATE purchase_order SET status = $1, return_code = $2, confirm = $3 WHERE id = $4 RETURNING *',
      [
        status,
        linePayResponse.body.returnCode,
        JSON.stringify(linePayResponse.body),
        dbOrder.id,
      ]
    )

    console.log(result.rows[0])

    return res.json({ status: 'success', data: linePayResponse.body })
  } catch (error) {
    console.error('確認交易錯誤:', error)
    return res.json({ status: 'fail', data: error.data })
  } finally {
    client.release()
  }
})

// 檢查交易用
router.get('/check-transaction', async (req, res) => {
  const transactionId = req.query.transactionId

  try {
    const linePayResponse = await linePayClient.checkPaymentStatus.send({
      transactionId: transactionId,
      params: {},
    })

    res.json(linePayResponse.body)
  } catch (error) {
    console.error('檢查交易狀態錯誤:', error)
    res.json({ error })
  }
})

export default router
