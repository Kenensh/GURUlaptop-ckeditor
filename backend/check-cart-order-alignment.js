#!/usr/bin/env node

/**
 * 購物車與訂單功能對齊檢查工具
 * 檢查 cart, order_list, order_detail 資料表與 API 路由的一致性
 */

import fs from 'fs'
import path from 'path'
import { pool } from './configs/db.js'

const RESET = '\x1b[0m'
const BRIGHT = '\x1b[1m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const MAGENTA = '\x1b[35m'
const CYAN = '\x1b[36m'

function log(color, message) {
  console.log(`${color}${message}${RESET}`)
}

async function checkDatabaseStructure() {
  log(CYAN, '\n🗄️ 檢查資料庫結構...')
  
  const client = await pool.connect()
  try {
    // 檢查 cart 表結構
    const cartStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'cart'
      ORDER BY ordinal_position
    `)
    
    log(BLUE, '\n📋 cart 表結構:')
    cartStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default || ''}`)
    })

    // 檢查 order_list 表結構
    const orderListStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'order_list'
      ORDER BY ordinal_position
    `)
    
    log(BLUE, '\n📋 order_list 表結構:')
    orderListStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default || ''}`)
    })

    // 檢查 order_detail 表結構
    const orderDetailStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'order_detail'
      ORDER BY ordinal_position
    `)
    
    log(BLUE, '\n📋 order_detail 表結構:')
    orderDetailStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default || ''}`)
    })

    // 檢查資料筆數
    const cartCount = await client.query('SELECT COUNT(*) FROM cart')
    const orderListCount = await client.query('SELECT COUNT(*) FROM order_list')
    const orderDetailCount = await client.query('SELECT COUNT(*) FROM order_detail')

    log(GREEN, '\n📊 資料筆數統計:')
    console.log(`  cart: ${cartCount.rows[0].count} 筆`)
    console.log(`  order_list: ${orderListCount.rows[0].count} 筆`)
    console.log(`  order_detail: ${orderDetailCount.rows[0].count} 筆`)

    return {
      cart: cartStructure.rows,
      order_list: orderListStructure.rows,
      order_detail: orderDetailStructure.rows,
      counts: {
        cart: cartCount.rows[0].count,
        order_list: orderListCount.rows[0].count,
        order_detail: orderDetailCount.rows[0].count
      }
    }

  } catch (error) {
    log(RED, `❌ 資料庫查詢錯誤: ${error.message}`)
    return null
  } finally {
    client.release()
  }
}

async function checkRouteFiles() {
  log(CYAN, '\n🛣️ 檢查路由檔案...')
  
  const routeFiles = ['cart.js', 'order.js', 'buy-list.js']
  const routeStatus = {}

  for (const file of routeFiles) {
    const filePath = `./routes/${file}`
    routeStatus[file] = {
      exists: fs.existsSync(filePath),
      path: filePath
    }

    if (routeStatus[file].exists) {
      const content = fs.readFileSync(filePath, 'utf8')
      routeStatus[file].content = content
      routeStatus[file].imports = {
        hasPoolImport: content.includes('pool'),
        hasDbImport: content.includes('from \'../configs/db.js\'') || content.includes('from \'##/configs/db.js\''),
        dbImportType: content.includes('pool') ? 'pool' : content.includes('import db') ? 'db' : 'unknown'
      }

      // 檢查路由端點
      const routes = []
      const routeMatches = content.match(/router\.(get|post|put|delete)\([^)]+/g)
      if (routeMatches) {
        routeMatches.forEach(match => {
          const method = match.split('.')[1].split('(')[0]
          const pathMatch = match.match(/['"`]([^'"`]+)['"`]/)
          if (pathMatch) {
            routes.push(`${method.toUpperCase()} ${pathMatch[1]}`)
          }
        })
      }
      routeStatus[file].routes = routes

      log(GREEN, `✅ ${file} 存在`)
      console.log(`   資料庫導入: ${routeStatus[file].imports.dbImportType}`)
      console.log(`   路由端點: ${routes.join(', ')}`)
    } else {
      log(RED, `❌ ${file} 不存在`)
    }
  }

  return routeStatus
}

async function checkAppJsRegistration() {
  log(CYAN, '\n🔧 檢查 app.js 路由註冊...')
  
  const appJsPath = './app.js'
  if (!fs.existsSync(appJsPath)) {
    log(RED, '❌ app.js 不存在')
    return null
  }

  const content = fs.readFileSync(appJsPath, 'utf8')
  
  const imports = {
    cartRouter: content.includes('cartRouter'),
    orderRouter: content.includes('orderRouter'),
    buyListRouter: content.includes('buyListRouter') || content.includes('buylistRouter')
  }

  const registrations = {
    cart: content.includes("app.use('/api/cart'") || content.includes("app.use(\"/api/cart\""),
    order: content.includes("app.use('/api/order'") || content.includes("app.use(\"/api/order\""),
    buyList: content.includes("app.use('/api/buy-list'") || content.includes("app.use(\"/api/buy-list\"")
  }

  log(BLUE, '\n📝 Import 狀態:')
  Object.entries(imports).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅' : '❌'}`)
  })

  log(BLUE, '\n📝 註冊狀態:')
  Object.entries(registrations).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅' : '❌'}`)
  })

  return { imports, registrations, content }
}

async function checkQuerySyntax() {
  log(CYAN, '\n🔍 檢查 SQL 查詢語法...')

  const issues = []

  // 檢查 cart.js
  const cartPath = './routes/cart.js'
  if (fs.existsSync(cartPath)) {
    const cartContent = fs.readFileSync(cartPath, 'utf8')
    
    // 檢查是否有 valid 欄位過濾
    if (!cartContent.includes('WHERE cart.user_id = $1 AND cart.valid')) {
      issues.push({
        file: 'cart.js',
        issue: 'SELECT 查詢未過濾 valid 欄位',
        suggestion: '在 WHERE 條件中加入 AND cart.valid = true'
      })
    }

    // 檢查 JOIN 語法
    if (cartContent.includes('JOIN product ON cart.product_id = product.product_id')) {
      if (!cartContent.includes('WHERE cart.user_id = $1 AND cart.valid = true')) {
        issues.push({
          file: 'cart.js',
          issue: 'cart 查詢應過濾 valid = true',
          suggestion: '在購物車查詢中加入 valid = true 條件'
        })
      }
    }
  }

  // 檢查 order.js
  const orderPath = './routes/order.js'
  if (fs.existsSync(orderPath)) {
    const orderContent = fs.readFileSync(orderPath, 'utf8')
    
    // 檢查 already_pay 欄位使用
    if (orderContent.includes('already_pay = true')) {
      issues.push({
        file: 'order.js',
        issue: 'already_pay 在 PostgreSQL 中是 INTEGER 類型，應使用 1 而非 true',
        suggestion: '改為 already_pay = 1'
      })
    }
  }

  // 檢查 buy-list.js
  const buyListPath = './routes/buy-list.js'
  if (fs.existsSync(buyListPath)) {
    const buyListContent = fs.readFileSync(buyListPath, 'utf8')
    
    // 檢查 JOIN 語法和表別名
    if (buyListContent.includes('JOIN product_img pi ON p.product_id = pi.img_product_id')) {
      if (!buyListContent.includes('pi.product_img_path')) {
        issues.push({
          file: 'buy-list.js',
          issue: 'JOIN 查詢應明確指定表別名',
          suggestion: '確保所有欄位都有正確的表別名'
        })
      }
    }
  }

  if (issues.length > 0) {
    log(YELLOW, '\n⚠️ 發現查詢語法問題:')
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}`)
      console.log(`   問題: ${issue.issue}`)
      console.log(`   建議: ${issue.suggestion}`)
    })
  } else {
    log(GREEN, '\n✅ 查詢語法檢查通過')
  }

  return issues
}

async function testDatabaseConnections() {
  log(CYAN, '\n🔌 測試資料庫連線與基本查詢...')

  const client = await pool.connect()
  try {
    // 測試基本查詢
    const tests = [
      {
        name: '購物車資料查詢',
        query: 'SELECT COUNT(*) FROM cart WHERE valid = true',
        description: '有效購物車項目數量'
      },
      {
        name: '訂單列表查詢',
        query: 'SELECT COUNT(*) FROM order_list WHERE already_pay = 0',
        description: '未付款訂單數量'
      },
      {
        name: '購物車與產品 JOIN 測試',
        query: `
          SELECT c.id, c.user_id, c.product_id, c.quantity, 
                 p.product_name, p.list_price, pi.product_img_path 
          FROM cart c
          JOIN product p ON c.product_id = p.product_id 
          JOIN product_img pi ON c.product_id = pi.img_product_id  
          WHERE c.valid = true
          LIMIT 1
        `,
        description: '購物車完整 JOIN 查詢'
      },
      {
        name: '訂單詳情 JOIN 測試',
        query: `
          SELECT od.*, p.product_name, p.list_price, pi.product_img_path
          FROM order_detail od
          JOIN product p ON od.product_id = p.product_id
          JOIN product_img pi ON p.product_id = pi.img_product_id
          LIMIT 1
        `,
        description: '訂單詳情完整 JOIN 查詢'
      }
    ]

    for (const test of tests) {
      try {
        const result = await client.query(test.query)
        log(GREEN, `✅ ${test.name}: ${test.description}`)
        if (test.name.includes('COUNT')) {
          console.log(`   結果: ${result.rows[0].count} 筆`)
        } else {
          console.log(`   結果: ${result.rows.length} 筆資料`)
        }
      } catch (error) {
        log(RED, `❌ ${test.name}: ${error.message}`)
      }
    }

  } catch (error) {
    log(RED, `❌ 資料庫連線測試失敗: ${error.message}`)
  } finally {
    client.release()
  }
}

async function generateFixRecommendations(routeStatus, appStatus, syntaxIssues) {
  log(CYAN, '\n📋 產生修復建議...')

  const recommendations = []

  // 路由註冊修復
  if (!appStatus?.imports.cartRouter) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING',
      action: '在 app.js 中導入 cartRouter',
      code: "import cartRouter from './routes/cart.js'"
    })
  }

  if (!appStatus?.registrations.cart) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING', 
      action: '在 app.js 中註冊 cart 路由',
      code: "app.use('/api/cart', cartRouter)"
    })
  }

  if (!appStatus?.imports.orderRouter) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING',
      action: '在 app.js 中導入 orderRouter',
      code: "import orderRouter from './routes/order.js'"
    })
  }

  if (!appStatus?.registrations.order) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING',
      action: '在 app.js 中註冊 order 路由',
      code: "app.use('/api/order', orderRouter)"
    })
  }

  if (!appStatus?.imports.buyListRouter) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING',
      action: '在 app.js 中導入 buyListRouter',
      code: "import buyListRouter from './routes/buy-list.js'"
    })
  }

  if (!appStatus?.registrations.buyList) {
    recommendations.push({
      priority: 'HIGH',
      category: 'ROUTING',
      action: '在 app.js 中註冊 buy-list 路由',
      code: "app.use('/api/buy-list', buyListRouter)"
    })
  }

  // 資料庫查詢修復
  syntaxIssues.forEach(issue => {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'DATABASE',
      action: `修復 ${issue.file}: ${issue.issue}`,
      code: issue.suggestion
    })
  })

  // cart.js 特定修復
  if (routeStatus['cart.js']?.exists) {
    const cartContent = routeStatus['cart.js'].content
    if (!cartContent.includes('WHERE cart.user_id = $1 AND cart.valid = true')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'DATABASE',
        action: '修復 cart.js 查詢，加入 valid = true 過濾',
        code: `
const data = await db.query(
  \`SELECT cart.id, cart.user_id, cart.product_id, cart.quantity, 
         product.product_name, product.list_price, product_img.product_img_path 
  FROM cart 
  JOIN product ON cart.product_id = product.product_id 
  JOIN product_img ON cart.product_id = product_img.img_product_id  
  WHERE cart.user_id = $1 AND cart.valid = true\`,
  [user_id]
)
        `
      })
    }
  }

  // order.js 特定修復
  if (routeStatus['order.js']?.exists) {
    const orderContent = routeStatus['order.js'].content
    if (orderContent.includes('already_pay = true')) {
      recommendations.push({
        priority: 'HIGH',
        category: 'DATABASE',
        action: '修復 order.js already_pay 欄位類型',
        code: "UPDATE order_list SET already_pay = 1 WHERE order_id = $1"
      })
    }
  }

  // 按優先級排序
  recommendations.sort((a, b) => {
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  log(YELLOW, '\n🔧 修復建議 (按優先級排序):')
  recommendations.forEach((rec, index) => {
    const priorityColor = rec.priority === 'HIGH' ? RED : rec.priority === 'MEDIUM' ? YELLOW : GREEN
    console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`)
    log(priorityColor, `   ${rec.action}`)
    if (rec.code) {
      console.log(`   程式碼: ${rec.code}`)
    }
  })

  return recommendations
}

async function main() {
  console.log(`${BRIGHT}${CYAN}🛍️ 購物車與訂單功能對齊檢查工具${RESET}`)
  console.log(`${BRIGHT}檢查 cart, order_list, order_detail 資料表與 API 路由一致性${RESET}`)

  try {
    // 1. 檢查資料庫結構
    const dbStructure = await checkDatabaseStructure()
    
    // 2. 檢查路由檔案
    const routeStatus = await checkRouteFiles()
    
    // 3. 檢查 app.js 註冊
    const appStatus = await checkAppJsRegistration()
    
    // 4. 檢查 SQL 語法
    const syntaxIssues = await checkQuerySyntax()
    
    // 5. 測試資料庫連線
    await testDatabaseConnections()
    
    // 6. 產生修復建議
    const recommendations = await generateFixRecommendations(routeStatus, appStatus, syntaxIssues)

    log(BRIGHT + GREEN, '\n✅ 檢查完成！')
    if (recommendations.length > 0) {
      log(YELLOW, `發現 ${recommendations.length} 個需要修復的問題`)
      log(BLUE, '請依照上述建議進行修復')
    } else {
      log(GREEN, '所有檢查項目都正常！')
    }

  } catch (error) {
    log(RED, `❌ 檢查過程發生錯誤: ${error.message}`)
    console.error(error.stack)
  } finally {
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
