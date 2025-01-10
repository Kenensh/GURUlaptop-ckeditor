import express from 'express'
import { pool } from '##/configs/db.js'
const router = express.Router()

// 取得單一產品概略資料和圖片路徑
router.get('/card/:product_id', async (req, res) => {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT product_name, model, list_price, product_img_path FROM product LEFT JOIN product_img ON product_id = img_product_id WHERE product_id = $1 AND valid = true',
      [req.params.product_id]
    )

    if (result.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到產品' })
    }

    return res.json({ status: 'success', data: { product: result.rows[0] } })
  } catch (error) {
    console.error('取得產品失敗:', error)
    return res.json({ status: 'error', message: '取得產品失敗' })
  } finally {
    client.release()
  }
})

//用篩選條件取得商品列表和分頁並回傳有多少頁數
router.get('/list', async (req, res) => {
  const client = await pool.connect()
  try {
    const { page = 1, category, category_value, price, search } = req.query
    const limit = 12
    const offset = (page - 1) * limit
    const where = []
    const params = []
    let paramCounter = 1

    // 檢查是否有篩選條件
    if (category && category_value) {
      switch (category) {
        case 'product_brand':
        case 'affordance':
        case 'product_size':
        case 'product_display_card':
        case 'product_CPU':
        case 'product_RAM':
        case 'product_hardisk_volume':
          where.push(`${category} ILIKE $${paramCounter}`)
          params.push(`%${category_value}%`)
          paramCounter++
          break
      }
    }

    if (search) {
      where.push(`product_name ILIKE $${paramCounter}`)
      params.push(`%${search}%`)
      paramCounter++
    }

    if (price) {
      const [min, max] = price.split('-')
      where.push(`list_price BETWEEN $${paramCounter} AND $${paramCounter + 1}`)
      params.push(min, max)
      paramCounter += 2
    }

    where.push('valid = true')

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

    // 計算符合條件的商品總數
    const countResult = await client.query(
      `SELECT COUNT(*) as total FROM product ${whereClause}`,
      params
    )
    const totalProducts = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(totalProducts / limit)

    // 查詢符合條件的商品列表
    const result = await client.query(
      `SELECT product_id FROM product ${whereClause} 
       ORDER BY product_id DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      [...params, limit, offset]
    )

    if (result.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到商品' })
    }

    return res.json({
      status: 'success',
      data: {
        products: result.rows,
        totalPages,
      },
    })
  } catch (error) {
    console.error('取得商品列表失敗:', error)
    return res.json({ status: 'error', message: '取得商品列表失敗' })
  } finally {
    client.release()
  }
})

// 取得單一產品詳細資料和圖片路徑
router.get('/:product_id', async (req, res) => {
  const client = await pool.connect()
  try {
    const productDetailResult = await client.query(
      'SELECT * FROM product WHERE product_id = $1 AND valid = true',
      [req.params.product_id]
    )

    if (productDetailResult.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到產品' })
    }

    const productImgResult = await client.query(
      'SELECT product_img_path FROM product_img WHERE img_product_id = $1',
      [req.params.product_id]
    )

    const productDetailImgResult = await client.query(
      'SELECT product_img_path FROM product_detail_img WHERE img_product_id = $1',
      [req.params.product_id]
    )

    const product = {
      ...productDetailResult.rows[0],
      product_img: productImgResult.rows,
      product_detail_img: productDetailImgResult.rows,
    }

    return res.json({ status: 'success', data: { product } })
  } catch (error) {
    console.error('取得產品失敗:', error)
    return res.json({ status: 'error', message: '取得產品失敗' })
  } finally {
    client.release()
  }
})

// 取得相關產品
router.get('/related/:product_id', async (req, res) => {
  const client = await pool.connect()
  try {
    const productResult = await client.query(
      'SELECT product_name, affordance, product_brand FROM product WHERE product_id = $1 AND valid = true',
      [req.params.product_id]
    )

    if (productResult.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到產品' })
    }

    const product_detail = productResult.rows[0]
    const fuzzyName = `%${product_detail.product_name}%`

    const relatedResult = await client.query(
      'SELECT product_id FROM product WHERE (product_name ILIKE $1 OR product_brand LIKE $2 OR affordance LIKE $3) AND product_id != $4 AND valid = true',
      [
        fuzzyName,
        product_detail.product_brand,
        product_detail.affordance,
        req.params.product_id,
      ]
    )

    if (relatedResult.rows.length === 0) {
      return res.json({ status: 'error', message: '找不到相關產品' })
    }

    // 隨機取得相關產品
    const randomRelatedProducts = relatedResult.rows
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)

    return res.json({ status: 'success', data: { randomRelatedProducts } })
  } catch (error) {
    console.error('取得相關產品失敗:', error)
    return res.json({ status: 'error', message: '取得相關產品失敗' })
  } finally {
    client.release()
  }
})

export default router
