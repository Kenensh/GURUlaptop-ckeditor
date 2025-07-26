/**
 * 簡單的產品資料檢查工具
 */

import { pool } from '#configs/db.js'

console.log('🚀 檢查遠端資料庫產品資料...')

const client = await pool.connect()

try {
  // 檢查產品數量
  const productCount = await client.query('SELECT COUNT(*) as total FROM product')
  console.log(`📊 產品總數: ${productCount.rows[0].total}`)
  
  // 檢查有效產品
  const validCount = await client.query('SELECT COUNT(*) as total FROM product WHERE valid = true')
  console.log(`✅ 有效產品: ${validCount.rows[0].total}`)
  
  // 取得前3個產品
  const products = await client.query('SELECT product_id, product_name, list_price FROM product LIMIT 3')
  console.log('🛍️ 範例產品:')
  products.rows.forEach(p => {
    console.log(`  - ID:${p.product_id} ${p.product_name} ($${p.list_price})`)
  })
  
  console.log('✨ 檢查完成!')
  
} catch (error) {
  console.error('❌ 錯誤:', error.message)
} finally {
  client.release()
  process.exit(0)
}
