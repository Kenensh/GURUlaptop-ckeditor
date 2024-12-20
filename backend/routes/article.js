import express from 'express'
import db from '##/configs/mysql.js'
import multer from 'multer'

const router = express.Router()
// 指定router變成變數，router是一個方法，處理路由
const upload = multer()
// 解析傳來的請求，文章目前我是用 fetch()

// 有撈到了啦 json http://localhost:3005/api/article/1
// 動態路由記得寫

router.get(
  '/article_detail/:article_id',
  upload.none(),
  async (req, res, next) => {
    const article_id = req.params.article_id
    console.log(article_id)
    const [data] = await db.query(
      'SELECT * FROM articleoverview WHERE article_id = ?',
      [article_id]
    )
    if (data.length == 0) {
      return res.json({ status: 'error', message: '查無此文章' })
    }

    res.json({ status: 'success', data: data })
  }
)

export default router
