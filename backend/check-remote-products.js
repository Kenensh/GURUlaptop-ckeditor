/**
 * 遠端資料庫 Products 資料檢查工具
 * 檢查遠端資料庫中的 product 相關表格和資料
 */

import { pool } from '#configs/db.js'

async function checkRemoteProductData() {
  console.log('🌐 檢查遠端資料庫 Products 資料...\n')
  
  const client = await pool.connect()
  
  try {
    // 1. 檢查資料庫連接
    console.log('📡 測試遠端資料庫連接...')
    const connectionTest = await client.query('SELECT NOW() as current_time, version() as db_version')
    console.log('✅ 遠端資料庫連接成功')
    console.log(`📅 資料庫時間: ${connectionTest.rows[0].current_time}`)
    console.log(`💾 資料庫版本: ${connectionTest.rows[0].db_version.split(' ')[0]}`)
    
    // 2. 檢查 product 相關表格是否存在
    console.log('\n📋 檢查 product 相關表格...')
    const tables = ['product', 'product_img', 'product_detail_img']
    
    for (const tableName of tables) {
      const tableCheck = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tableName])
      
      if (tableCheck.rows[0].count > 0) {
        console.log(`✅ 表格 ${tableName} 存在`)
        
        // 檢查資料數量
        const dataCount = await client.query(`SELECT COUNT(*) as total FROM ${tableName}`)
        console.log(`   📊 資料筆數: ${dataCount.rows[0].total}`)
        
        if (tableName === 'product') {
          // 檢查有效產品數量
          const validCount = await client.query(`SELECT COUNT(*) as total FROM product WHERE valid = true`)
          console.log(`   ✅ 有效產品: ${validCount.rows[0].total}`)
        }
      } else {
        console.log(`❌ 表格 ${tableName} 不存在`)
      }
    }
    
    // 3. 檢查 product 表格結構
    console.log('\n🏗️ 檢查 product 表格結構...')
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'product' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    if (columnsQuery.rows.length > 0) {
      console.log('📄 product 表格欄位:')
      columnsQuery.rows.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '🔒' : '🔓'}`)
      })
    }
    
    // 4. 取得範例產品資料
    console.log('\n📱 檢查範例產品資料...')
    const sampleProducts = await client.query(`
      SELECT product_id, product_name, list_price, valid, created_at
      FROM product 
      WHERE valid = true
      ORDER BY product_id 
      LIMIT 5
    `)
    
    if (sampleProducts.rows.length > 0) {
      console.log('🛍️ 範例產品:')
      sampleProducts.rows.forEach((product, index) => {
        console.log(`   ${index + 1}. ID:${product.product_id} - ${product.product_name} ($${product.list_price})`)
      })
    } else {
      console.log('⚠️ 沒有找到有效的產品資料')
    }
    
    // 5. 檢查產品圖片資料
    console.log('\n🖼️ 檢查產品圖片資料...')
    const imageCount = await client.query(`
      SELECT 
        pi.img_product_id,
        COUNT(*) as image_count
      FROM product_img pi
      GROUP BY pi.img_product_id
      ORDER BY pi.img_product_id
      LIMIT 5
    `)
    
    if (imageCount.rows.length > 0) {
      console.log('📸 產品圖片統計:')
      imageCount.rows.forEach((img, index) => {
        console.log(`   產品 ID:${img.img_product_id} - ${img.image_count} 張圖片`)
      })
    } else {
      console.log('⚠️ 沒有找到產品圖片資料')
    }
    
    // 6. 測試基本查詢
    console.log('\n🧪 測試基本 Products API 查詢...')
    
    // 測試產品列表查詢
    try {
      const listQuery = await client.query(`
        SELECT product_id FROM product 
        WHERE valid = true 
        ORDER BY product_id DESC 
        LIMIT 5
      `)
      console.log(`✅ 產品列表查詢成功 - 找到 ${listQuery.rows.length} 個產品`)
    } catch (error) {
      console.log(`❌ 產品列表查詢失敗: ${error.message}`)
    }
    
    // 測試單一產品查詢
    if (sampleProducts.rows.length > 0) {
      const testProductId = sampleProducts.rows[0].product_id
      try {
        const detailQuery = await client.query(`
          SELECT * FROM product 
          WHERE product_id = $1 AND valid = true
        `, [testProductId])
        console.log(`✅ 單一產品查詢成功 - 產品 ID: ${testProductId}`)
      } catch (error) {
        console.log(`❌ 單一產品查詢失敗: ${error.message}`)
      }
    }
    
    // 7. 生成測試建議
    console.log('\n💡 測試建議:')
    
    if (sampleProducts.rows.length === 0) {
      console.log('🚨 重要: 資料庫中沒有有效的產品資料')
      console.log('   建議執行: npm run seed (如果有種子資料)')
      console.log('   或手動插入測試資料')
    } else {
      console.log('✅ 資料庫有足夠的測試資料')
      console.log('   可以開始測試 Products API 功能')
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error.message)
    console.error('🔧 可能的解決方案:')
    console.error('   1. 檢查網路連接')
    console.error('   2. 確認資料庫憑證正確')
    console.error('   3. 檢查防火牆設定')
  } finally {
    client.release()
  }
}

// 執行檢查
if (import.meta.url === `file://${process.argv[1]}`) {
  checkRemoteProductData()
    .then(() => {
      console.log('\n✨ 遠端資料庫檢查完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 檢查失敗:', error.message)
      process.exit(1)
    })
}

export default checkRemoteProductData
