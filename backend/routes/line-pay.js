import express from 'express'
const router = express.Router()

// 資料庫使用
// import sequelize from '#configs/db.js'
// const { purchase_order } = sequelize.models
import db from '##/configs/mysql.js'

// 中介軟體，存取隱私會員資料用
import authenticate from '#middlewares/authenticate.js'

// line pay使用npm套件
import { createLinePayClient } from 'line-pay-merchant'
// 產生uuid用
import { v4 as uuidv4 } from 'uuid'

// 存取`.env`設定檔案使用
import 'dotenv/config.js'

// 定義安全的私鑰字串
const linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET,
  env: process.env.NODE_ENV,
})

// 在資料庫建立order資料(需要會員登入才能使用)
router.post('/create-order', async (req, res) => {
  // 會員id由authenticate中介軟體提供
  const userId = req.body.userId
  const orderId = req.body.orderId

  //產生 orderId與packageId
  // const orderId = uuidv4()
  const packageId = uuidv4()

  // 要傳送給line pay的訂單資訊
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

  //console.log(order)

  // 要儲存到資料庫的order資料
  const dbOrder = {
    id: orderId,
    user_id: userId,
    amount: req.body.amount,
    status: 'pending', // 'pending' | 'paid' | 'cancel' | 'fail' | 'error'
    order_info: JSON.stringify(order), // 要傳送給line pay的訂單資訊
  }

  // 儲存到資料庫
  // await purchase_order.create(dbOrder)
  const result = await db.query('INSERT INTO purchase_order SET ?', dbOrder)

  console.log(result)

  // 回傳給前端的資料
  res.json({ status: 'success', data: { order } })
})

// 重新導向到line-pay，進行交易(純導向不回應前端)
// 資料格式參考 https://enylin.github.io/line-pay-merchant/api-reference/request.html#example
router.get('/reserve', async (req, res) => {
  if (!req.query.orderId) {
    return res.json({ status: 'error', message: 'order id不存在' })
  }

  const orderId = req.query.orderId
  const redirectUrls = {
    confirmUrl: process.env.REACT_REDIRECT_CONFIRM_URL + `?ID=${orderId}`,
    cancelUrl: process.env.REACT_REDIRECT_CANCEL_URL,
  }

  const [orderRecord] = await db.query(
    'SELECT order_info FROM purchase_order WHERE id = ?',
    [orderId]
  )

  const order = JSON.parse(orderRecord[0].order_info)
  console.log(`獲得訂單資料，內容如下：`)
  console.log(order)

  try {
    // 向line pay傳送的訂單資料
    const linePayResponse = await linePayClient.request.send({
      body: { ...order, redirectUrls },
    })

    // 深拷貝一份order資料
    const reservation = JSON.parse(JSON.stringify(order))
    reservation.returnCode = linePayResponse.body.returnCode
    reservation.returnMessage = linePayResponse.body.returnMessage
    reservation.transactionId = linePayResponse.body.info.transactionId
    reservation.paymentAccessToken =
      linePayResponse.body.info.paymentAccessToken

    console.log(`預計付款資料(Reservation)已建立。資料如下:`)
    console.log(reservation)

    // 在db儲存reservation資料
    await db.query(
      'UPDATE purchase_order SET reservation = ?, transaction_id = ? WHERE id = ?',
      [JSON.stringify(reservation), reservation.transactionId, orderId]
    )

    // 導向到付款頁面
    return res.redirect(linePayResponse.body.info.paymentUrl.web)
  } catch (e) {
    console.log('error', e)
    // 確保只有在回應未發送的情況下發送錯誤訊息
    if (!res.headersSent) {
      return res.json({ status: 'error', message: '無法完成付款，請稍後再試' })
    }
  }
})

// 向Line Pay確認交易結果
// 格式參考: https://enylin.github.io/line-pay-merchant/api-reference/confirm.html#example
router.get('/confirm', async (req, res) => {
  // 網址上需要有transactionId
  const transactionId = req.query.transactionId

  // 從資料庫取得交易資料
  // const dbOrder = await purchase_order.findOne({
  //   where: { transaction_id: transactionId },
  //   raw: true, // 只需要資料表中資料
  // })
  const [dbOrder] = await db.query(
    'SELECT * FROM purchase_order WHERE transaction_id = ?',
    [transactionId]
  )

  console.log(dbOrder)

  // 交易資料
  const transaction = JSON.parse(dbOrder[0].reservation)

  console.log(transaction)

  // 交易金額
  const amount = transaction.amount

  try {
    // 最後確認交易
    const linePayResponse = await linePayClient.confirm.send({
      transactionId: transactionId,
      body: {
        currency: 'TWD',
        amount: amount,
      },
    })

    // linePayResponse.body回傳的資料
    console.log(linePayResponse)

    //transaction.confirmBody = linePayResponse.body

    // status: 'pending' | 'paid' | 'cancel' | 'fail' | 'error'
    let status = 'paid'

    if (linePayResponse.body.returnCode !== '0000') {
      status = 'fail'
    }

    // 更新資料庫的訂單狀態
    // const result = await purchase_order.update(
    //   {
    //     status,
    //     return_code: linePayResponse.body.returnCode,
    //     confirm: JSON.stringify(linePayResponse.body),
    //   },
    //   {
    //     where: {
    //       id: dbOrder.id,
    //     },
    //   }
    // )
    const result = await db.query(
      'UPDATE purchase_order SET status = ?, return_code = ?, confirm = ? WHERE id = ?',
      [
        status,
        linePayResponse.body.returnCode,
        JSON.stringify(linePayResponse.body),
        dbOrder.id,
      ]
    )

    console.log(result)

    return res.json({ status: 'success', data: linePayResponse.body })
  } catch (error) {
    return res.json({ status: 'fail', data: error.data })
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

    // 範例:
    // {
    //   "body": {
    //     "returnCode": "0000",
    //     "returnMessage": "reserved transaction."
    //   },
    //   "comments": {}
    // }

    res.json(linePayResponse.body)
  } catch (e) {
    res.json({ error: e })
  }
})

export default router
