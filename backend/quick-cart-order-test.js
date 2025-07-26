#!/usr/bin/env node

/**
 * 購物車與訂單功能快速測試工具
 * 驗證修復後的 cart, order 功能是否正常
 */

import { pool } from './configs/db.js'

const RESET = '\x1b[0m'
const BRIGHT = '\x1b[1m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const CYAN = '\x1b[36m'

function log(color, message) {
  console.log(`${color}${message}${RESET}`)
}

async function testDatabaseQueries() {
  log(CYAN, '\n🔍 測試資料庫查詢功能...')
  
  const client = await pool.connect()
  try {
    // 測試購物車查詢 (模擬 cart.js 的查詢)
    log(BLUE, '\n1. 測試購物車查詢功能')
    const cartQuery = `
      SELECT cart.id, cart.user_id, cart.product_id, cart.quantity, 
             product.product_name, product.list_price, product_img.product_img_path 
      FROM cart 
      JOIN product ON cart.product_id = product.product_id 
      JOIN product_img ON cart.product_id = product_img.img_product_id  
      WHERE cart.valid = true
      LIMIT 5
    `
    
    try {
      const cartResult = await client.query(cartQuery)
      log(GREEN, `✅ 購物車查詢成功，找到 ${cartResult.rows.length} 筆資料`)
      if (cartResult.rows.length > 0) {
        console.log('   範例資料:')
        cartResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. 用戶${row.user_id} - ${row.product_name} x ${row.quantity}`)
        })
      }
    } catch (error) {
      log(RED, `❌ 購物車查詢失敗: ${error.message}`)
    }

    // 測試訂單列表查詢
    log(BLUE, '\n2. 測試訂單列表查詢功能')
    const orderListQuery = `
      SELECT id, user_id, order_id, order_amount, payment_method, 
             already_pay, create_time
      FROM order_list 
      ORDER BY create_time DESC
      LIMIT 5
    `
    
    try {
      const orderResult = await client.query(orderListQuery)
      log(GREEN, `✅ 訂單列表查詢成功，找到 ${orderResult.rows.length} 筆資料`)
      if (orderResult.rows.length > 0) {
        console.log('   範例資料:')
        orderResult.rows.forEach((row, index) => {
          const payStatus = row.already_pay === 1 ? '已付款' : '未付款'
          console.log(`   ${index + 1}. ${row.order_id} - $${row.order_amount} (${payStatus})`)
        })
      }
    } catch (error) {
      log(RED, `❌ 訂單列表查詢失敗: ${error.message}`)
    }

    // 測試訂單詳情查詢 (模擬 buy-list.js 的查詢)
    log(BLUE, '\n3. 測試訂單詳情查詢功能')
    const orderDetailQuery = `
      SELECT od.*, p.product_name, p.list_price, pi.product_img_path
      FROM order_detail od
      JOIN product p ON od.product_id = p.product_id
      JOIN product_img pi ON p.product_id = pi.img_product_id
      LIMIT 5
    `
    
    try {
      const detailResult = await client.query(orderDetailQuery)
      log(GREEN, `✅ 訂單詳情查詢成功，找到 ${detailResult.rows.length} 筆資料`)
      if (detailResult.rows.length > 0) {
        console.log('   範例資料:')
        detailResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.order_id} - ${row.product_name} x ${row.quantity} ($${row.product_price})`)
        })
      }
    } catch (error) {
      log(RED, `❌ 訂單詳情查詢失敗: ${error.message}`)
    }

    // 測試資料表結構
    log(BLUE, '\n4. 驗證資料表結構')
    const tables = ['cart', 'order_list', 'order_detail']
    
    for (const table of tables) {
      try {
        const structure = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table])
        
        log(GREEN, `✅ ${table} 表結構正常`)
        console.log(`   欄位: ${structure.rows.map(r => r.column_name).join(', ')}`)
        
        // 特別檢查重要欄位
        if (table === 'cart') {
          const validField = structure.rows.find(r => r.column_name === 'valid')
          if (validField && validField.data_type === 'boolean') {
            log(GREEN, `   ✅ cart.valid 欄位類型正確 (boolean)`)
          } else {
            log(RED, `   ❌ cart.valid 欄位類型異常`)
          }
        }
        
        if (table === 'order_list') {
          const payField = structure.rows.find(r => r.column_name === 'already_pay')
          if (payField && payField.data_type === 'integer') {
            log(GREEN, `   ✅ order_list.already_pay 欄位類型正確 (integer)`)
          } else {
            log(RED, `   ❌ order_list.already_pay 欄位類型異常`)
          }
        }
        
      } catch (error) {
        log(RED, `❌ ${table} 表結構檢查失敗: ${error.message}`)
      }
    }

  } catch (error) {
    log(RED, `❌ 資料庫連線失敗: ${error.message}`)
  } finally {
    client.release()
  }
}

async function testRouteRegistration() {
  log(CYAN, '\n🛣️ 檢查路由註冊狀態...')
  
  try {
    const fs = await import('fs')
    
    // 檢查 app.js 中的路由註冊
    const appContent = fs.readFileSync('./app.js', 'utf8')
    
    const routeChecks = [
      { name: 'cartRouter import', pattern: "import cartRouter from './routes/cart.js'" },
      { name: 'orderRouter import', pattern: "import orderRouter from './routes/order.js'" },
      { name: 'buyListRouter import', pattern: "import buyListRouter from './routes/buy-list.js'" },
      { name: 'cart route registration', pattern: "app.use('/api/cart', cartRouter)" },
      { name: 'order route registration', pattern: "app.use('/api/order', orderRouter)" },
      { name: 'buy-list route registration', pattern: "app.use('/api/buy-list', buyListRouter)" }
    ]
    
    routeChecks.forEach(check => {
      if (appContent.includes(check.pattern)) {
        log(GREEN, `✅ ${check.name}`)
      } else {
        log(RED, `❌ ${check.name}`)
      }
    })
    
  } catch (error) {
    log(RED, `❌ 路由註冊檢查失敗: ${error.message}`)
  }
}

async function testAPIEndpoints() {
  log(CYAN, '\n🌐 檢查 API 端點...')
  
  try {
    const fs = await import('fs')
    
    const routeFiles = [
      { file: './routes/cart.js', name: 'cart' },
      { file: './routes/order.js', name: 'order' },
      { file: './routes/buy-list.js', name: 'buy-list' }
    ]
    
    routeFiles.forEach(({ file, name }) => {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8')
        const routes = []
        const routeMatches = content.match(/router\.(get|post|put|delete)\([^)]+/g)
        
        if (routeMatches) {
          routeMatches.forEach(match => {
            const method = match.split('.')[1].split('(')[0].toUpperCase()
            const pathMatch = match.match(/['"`]([^'"`]+)['"`]/)
            if (pathMatch) {
              routes.push(`${method} /api/${name}${pathMatch[1]}`)
            }
          })
        }
        
        log(GREEN, `✅ ${name} 路由檔案存在`)
        console.log(`   端點: ${routes.join(', ')}`)
        
        // 檢查關鍵功能
        if (name === 'cart') {
          const hasValidFilter = content.includes('cart.valid = true')
          if (hasValidFilter) {
            log(GREEN, `   ✅ 包含 valid 欄位過濾`)
          } else {
            log(RED, `   ❌ 缺少 valid 欄位過濾`)
          }
        }
        
        if (name === 'order') {
          const hasCorrectPayment = content.includes('already_pay = 1')
          if (hasCorrectPayment) {
            log(GREEN, `   ✅ 使用正確的 already_pay 數值`)
          } else {
            log(RED, `   ❌ already_pay 使用錯誤的數值`)
          }
        }
        
      } else {
        log(RED, `❌ ${name} 路由檔案不存在`)
      }
    })
    
  } catch (error) {
    log(RED, `❌ API 端點檢查失敗: ${error.message}`)
  }
}

async function main() {
  console.log(`${BRIGHT}${CYAN}🛍️ 購物車與訂單功能快速測試${RESET}`)
  console.log(`${BRIGHT}驗證修復後的 cart, order 功能是否正常${RESET}`)

  try {
    // 1. 測試路由註冊
    await testRouteRegistration()
    
    // 2. 測試 API 端點
    await testAPIEndpoints()
    
    // 3. 測試資料庫查詢
    await testDatabaseQueries()

    log(BRIGHT + GREEN, '\n✅ 測試完成！')
    log(BLUE, '如果所有項目都通過，cart 和 order 功能應該可以正常使用')

  } catch (error) {
    log(RED, `❌ 測試過程發生錯誤: ${error.message}`)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
