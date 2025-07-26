/**
 * 產品資料庫欄位對齊檢查工具
 * 檢查種子資料與實際資料庫結構的對應關係
 */

import { pool } from '#configs/db.js'
import fs from 'fs'

async function checkProductDataAlignment() {
  console.log('🔍 檢查產品資料庫欄位對齊情況...\n')
  
  const client = await pool.connect()
  
  try {
    // 1. 檢查實際資料庫的 product 表結構
    console.log('📋 實際資料庫 product 表結構:')
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'product' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    const dbColumns = columnsQuery.rows.map(col => col.column_name)
    console.log('實際欄位:', dbColumns.join(', '))
    
    // 2. 檢查種子資料結構
    console.log('\n📄 種子資料結構:')
    const seedData = JSON.parse(fs.readFileSync('./seeds/Product.json', 'utf8'))
    const seedColumns = Object.keys(seedData[0])
    console.log('種子欄位:', seedColumns.join(', '))
    
    // 3. 對比分析
    console.log('\n🔄 欄位對應分析:')
    const mappings = {
      'id': 'product_id',
      'name': 'product_name', 
      'price': 'list_price',
      'sn': '可能不需要',
      'photos': '需要拆分到 product_img 表',
      'stock': '資料庫中沒有此欄位',
      'info': '資料庫中沒有此欄位',
      'brand_id': 'product_brand (需要轉換)',
      'cat_id': '資料庫中沒有此欄位',
      'color': 'product_color (需要轉換)',
      'tag': '需要拆分到其他表',
      'size': 'product_size (需要轉換)'
    }
    
    for (const [seedCol, dbCol] of Object.entries(mappings)) {
      console.log(`  ${seedCol} -> ${dbCol}`)
    }
    
    // 4. 檢查實際資料數量
    console.log('\n📊 資料庫目前狀況:')
    const productCount = await client.query('SELECT COUNT(*) as total FROM product')
    console.log(`總產品數: ${productCount.rows[0].total}`)
    
    const validCount = await client.query('SELECT COUNT(*) as total FROM product WHERE valid = 1')
    console.log(`有效產品數: ${validCount.rows[0].total}`)
    
    // 5. 取樣檢查
    if (validCount.rows[0].total > 0) {
      console.log('\n🛍️ 資料庫中的實際產品範例:')
      const samples = await client.query('SELECT product_id, product_name, list_price, product_brand FROM product WHERE valid = 1 LIMIT 3')
      samples.rows.forEach((product, index) => {
        console.log(`  ${index + 1}. ID:${product.product_id} - ${product.product_name} - $${product.list_price} - ${product.product_brand}`)
      })
    } else {
      console.log('\n⚠️ 資料庫中沒有有效的產品資料')
    }
    
    // 6. 建議
    console.log('\n💡 修復建議:')
    if (validCount.rows[0].total === 0) {
      console.log('🚨 主要問題: 種子資料欄位名稱與資料庫結構不匹配')
      console.log('解決方案選項:')
      console.log('1. 修改種子資料的欄位名稱以匹配資料庫結構')
      console.log('2. 創建資料轉換腳本將種子資料正確匯入')
      console.log('3. 手動插入測試資料以快速驗證 API 功能')
    } else {
      console.log('✅ 資料庫中有資料，API 應該可以正常運作')
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error.message)
  } finally {
    client.release()
  }
}

// 手動插入測試資料的函數
async function insertTestData() {
  console.log('\n🔧 插入測試產品資料...')
  
  const client = await pool.connect()
  
  try {
    // 插入幾個測試產品
    const testProducts = [
      {
        product_name: 'ASUS ZenBook 14',
        model: 'UX425',
        product_brand: 'ASUS',
        list_price: 35000,
        affordance: '商用',
        product_color: '灰色',
        product_size: '14吋',
        product_weight: 1.4,
        product_cpu: 'Intel i5-1135G7',
        discrete_display_card: '無',
        product_display_card: 'Intel Iris Xe',
        product_ram: '8GB',
        product_hardisk_type: 'SSD',
        product_hardisk_volume: '512GB',
        product_os: 'Windows 11',
        product_wireless: 'Wi-Fi 6',
        product_camera: '720p HD',
        product_keyboard: '背光鍵盤',
        product_cardreader: 'microSD',
        product_power: '65W',
        product_i_o: 'USB-C, USB-A, HDMI',
        valid: 1
      },
      {
        product_name: 'MacBook Air M2',
        model: 'MLY33',
        product_brand: 'Apple',
        list_price: 38900,
        affordance: '輕薄',
        product_color: '太空灰',
        product_size: '13.6吋',
        product_weight: 1.24,
        product_cpu: 'Apple M2',
        discrete_display_card: '無',
        product_display_card: '8核心GPU',
        product_ram: '8GB',
        product_hardisk_type: 'SSD',
        product_hardisk_volume: '256GB',
        product_os: 'macOS',
        product_wireless: 'Wi-Fi 6',
        product_camera: '1080p FaceTime',
        product_keyboard: '巧控鍵盤',
        product_cardreader: '無',
        product_power: '30W',
        product_i_o: '2x Thunderbolt',
        valid: 1
      },
      {
        product_name: 'HP Pavilion Gaming',
        model: '15-ec2',
        product_brand: 'HP',
        list_price: 42000,
        affordance: '電競',
        product_color: '黑綠色',
        product_size: '15.6吋',
        product_weight: 2.23,
        product_cpu: 'AMD Ryzen 5',
        discrete_display_card: '有',
        product_display_card: 'GTX 1650',
        product_ram: '16GB',
        product_hardisk_type: 'SSD',
        product_hardisk_volume: '512GB',
        product_os: 'Windows 11',
        product_wireless: 'Wi-Fi 6',
        product_camera: '720p',
        product_keyboard: '背光電競鍵盤',
        product_cardreader: 'SD',
        product_power: '150W',
        product_i_o: 'USB-C, USB-A, HDMI, RJ45',
        valid: 1
      }
    ]
    
    for (const product of testProducts) {
      const columns = Object.keys(product).join(', ')
      const placeholders = Object.keys(product).map((_, index) => `$${index + 1}`).join(', ')
      const values = Object.values(product)
      
      await client.query(`
        INSERT INTO product (${columns}) 
        VALUES (${placeholders})
        ON CONFLICT (product_id) DO NOTHING
      `, values)
      
      console.log(`✅ 插入測試產品: ${product.product_name}`)
    }
    
    // 插入對應的圖片資料
    console.log('\n📸 插入測試圖片資料...')
    const imgData = [
      { img_product_id: 1, product_img_path: 'asus-zenbook-1.jpg' },
      { img_product_id: 1, product_img_path: 'asus-zenbook-2.jpg' },
      { img_product_id: 2, product_img_path: 'macbook-air-1.jpg' },
      { img_product_id: 3, product_img_path: 'hp-pavilion-1.jpg' }
    ]
    
    for (const img of imgData) {
      await client.query(`
        INSERT INTO product_img (img_product_id, product_img_path, img_id) 
        VALUES ($1, $2, nextval('product_img_img_id_seq'))
        ON CONFLICT DO NOTHING
      `, [img.img_product_id, img.product_img_path])
    }
    
    console.log('✅ 測試資料插入完成!')
    
  } catch (error) {
    console.error('❌ 插入測試資料失敗:', error.message)
  } finally {
    client.release()
  }
}

// 主執行函數
async function main() {
  await checkProductDataAlignment()
  
  // 詢問是否要插入測試資料
  const shouldInsertTest = process.argv.includes('--insert-test')
  if (shouldInsertTest) {
    await insertTestData()
  } else {
    console.log('\n💡 如要插入測試資料，請執行: node check-product-alignment.js --insert-test')
  }
  
  console.log('\n✨ 檢查完成!')
}

main().catch(console.error)
