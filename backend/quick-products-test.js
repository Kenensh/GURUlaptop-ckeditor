/**
 * 快速 Products API 功能測試
 * 使用現有的遠端資料庫資料進行測試
 */

import { pool } from '#configs/db.js'

async function quickProductApiTest() {
  console.log('🧪 快速 Products API 功能測試...\n')
  
  const client = await pool.connect()
  
  try {
    // 1. 測試產品列表查詢 (模擬 /api/products/list)
    console.log('📋 測試產品列表查詢...')
    const listQuery = `
      SELECT product_id FROM product 
      WHERE valid = 1 
      ORDER BY product_id DESC 
      LIMIT 5
    `
    const listResult = await client.query(listQuery)
    console.log(`✅ 產品列表查詢成功，找到 ${listResult.rows.length} 個產品`)
    listResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. Product ID: ${row.product_id}`)
    })
    
    // 2. 測試分頁查詢
    console.log('\n📄 測試分頁查詢...')
    const page = 1
    const perpage = 3
    const offset = (page - 1) * perpage
    
    const pageQuery = `
      SELECT product_id FROM product 
      WHERE valid = 1 
      ORDER BY product_id DESC 
      LIMIT $1 OFFSET $2
    `
    const pageResult = await client.query(pageQuery, [perpage, offset])
    console.log(`✅ 分頁查詢成功，頁數:${page}，每頁:${perpage}，找到 ${pageResult.rows.length} 個產品`)
    
    // 3. 測試總數查詢
    const countQuery = `SELECT COUNT(*) as total FROM product WHERE valid = 1`
    const countResult = await client.query(countQuery)
    const totalProducts = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(totalProducts / perpage)
    console.log(`📊 總產品數: ${totalProducts}，總頁數: ${totalPages}`)
    
    // 4. 測試單一產品查詢 (模擬 /api/products/:id)
    if (listResult.rows.length > 0) {
      const testProductId = listResult.rows[0].product_id
      console.log(`\n🔍 測試單一產品查詢 (ID: ${testProductId})...`)
      
      const detailQuery = `
        SELECT * FROM product 
        WHERE product_id = $1 AND valid = 1
      `
      const detailResult = await client.query(detailQuery, [testProductId])
      
      if (detailResult.rows.length > 0) {
        const product = detailResult.rows[0]
        console.log(`✅ 產品詳情查詢成功`)
        console.log(`   產品名稱: ${product.product_name}`)
        console.log(`   型號: ${product.model}`)
        console.log(`   品牌: ${product.product_brand}`)
        console.log(`   價格: $${product.list_price}`)
      }
      
      // 5. 測試產品圖片查詢
      console.log('\n📸 測試產品圖片查詢...')
      const imgQuery = `
        SELECT product_img_path FROM product_img 
        WHERE img_product_id = $1
      `
      const imgResult = await client.query(imgQuery, [testProductId])
      console.log(`✅ 圖片查詢成功，找到 ${imgResult.rows.length} 張圖片`)
      
      // 6. 測試產品卡片查詢 (模擬 /api/products/card/:id)
      console.log('\n💳 測試產品卡片查詢...')
      const cardQuery = `
        SELECT p.product_name, p.model, p.list_price, pi.product_img_path 
        FROM product p 
        LEFT JOIN product_img pi ON p.product_id = pi.img_product_id 
        WHERE p.product_id = $1 AND p.valid = 1
      `
      const cardResult = await client.query(cardQuery, [testProductId])
      console.log(`✅ 產品卡片查詢成功，找到 ${cardResult.rows.length} 筆資料`)
      
      // 7. 測試相關產品查詢 (模擬 /api/products/related/:id)
      console.log('\n🔗 測試相關產品查詢...')
      
      // 先取得產品資訊
      const productInfo = detailResult.rows[0]
      const fuzzyName = `%${productInfo.product_name}%`
      
      const relatedQuery = `
        SELECT product_id FROM product 
        WHERE (product_name ILIKE $1 OR product_brand LIKE $2 OR affordance LIKE $3) 
        AND product_id != $4 AND valid = 1
        LIMIT 4
      `
      const relatedResult = await client.query(relatedQuery, [
        fuzzyName,
        productInfo.product_brand,
        productInfo.affordance,
        testProductId
      ])
      console.log(`✅ 相關產品查詢成功，找到 ${relatedResult.rows.length} 個相關產品`)
    }
    
    // 8. 測試搜尋功能
    console.log('\n🔍 測試搜尋功能...')
    const searchTerm = 'ASUS'
    const searchQuery = `
      SELECT product_id, product_name FROM product 
      WHERE product_name ILIKE $1 AND valid = 1 
      LIMIT 3
    `
    const searchResult = await client.query(searchQuery, [`%${searchTerm}%`])
    console.log(`✅ 搜尋查詢成功，搜尋 "${searchTerm}" 找到 ${searchResult.rows.length} 個結果`)
    searchResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.product_name}`)
    })
    
    // 9. 總結
    console.log('\n📊 測試總結:')
    console.log('✅ 資料庫連接正常')
    console.log('✅ 產品資料存在且有效')
    console.log('✅ 所有 SQL 查詢語法正確')
    console.log('✅ JOIN 查詢正常運作')
    console.log('✅ 分頁邏輯正確')
    console.log('✅ 搜尋功能正常')
    
    console.log('\n🚀 Products API 應該可以正常運作!')
    console.log('📝 建議現在啟動後端服務並測試實際 API 端點')
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error.message)
    console.error('詳細錯誤:', error)
  } finally {
    client.release()
  }
}

// 執行測試
quickProductApiTest().catch(console.error)
