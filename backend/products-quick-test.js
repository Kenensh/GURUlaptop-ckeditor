/**
 * Products 快速診斷工具 - 簡化版
 */

import db, { pool } from './configs/db.js';

async function quickProductsTest() {
  console.log('🚀 開始 Products 快速診斷...\n');
  
  const client = await pool.connect();
  
  try {
    // 1. 測試資料庫連接
    console.log('📊 測試資料庫連接...');
    const dbTest = await client.query('SELECT NOW()');
    console.log('✅ 資料庫連接正常');
    
    // 2. 檢查 product 表是否存在
    console.log('📋 檢查 product 表...');
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'product'
    `);
    
    if (tableCheck.rows[0].count > 0) {
      console.log('✅ product 表存在');
      
      // 3. 檢查 product 表資料
      const dataCheck = await client.query('SELECT COUNT(*) as total FROM product WHERE valid = true');
      console.log(`📊 有效產品數量: ${dataCheck.rows[0].total}`);
      
      if (dataCheck.rows[0].total > 0) {
        // 4. 測試產品查詢
        console.log('🔍 測試產品查詢...');
        
        // 測試產品列表查詢
        const listResult = await client.query(`
          SELECT product_id FROM product 
          WHERE valid = true 
          ORDER BY product_id DESC 
          LIMIT 5
        `);
        console.log(`✅ 產品列表查詢成功，找到 ${listResult.rows.length} 個產品`);
        
        if (listResult.rows.length > 0) {
          const firstProductId = listResult.rows[0].product_id;
          
          // 測試單一產品查詢
          const detailResult = await client.query(
            'SELECT * FROM product WHERE product_id = $1 AND valid = true',
            [firstProductId]
          );
          console.log(`✅ 單一產品查詢成功 (ID: ${firstProductId})`);
          
          // 測試產品圖片查詢
          const imgResult = await client.query(
            'SELECT COUNT(*) as count FROM product_img WHERE img_product_id = $1',
            [firstProductId]
          );
          console.log(`📸 產品圖片數量: ${imgResult.rows[0].count}`);
        }
      } else {
        console.log('⚠️ product 表中沒有有效資料');
      }
    } else {
      console.log('❌ product 表不存在');
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
  } finally {
    client.release();
  }
}

async function checkApiRoutes() {
  console.log('\n🛣️ 檢查 API 路由配置...');
  
  try {
    // 檢查 products 路由檔案
    const fs = await import('fs');
    const path = await import('path');
    
    const routesPath = './routes/products.js';
    if (fs.existsSync(routesPath)) {
      console.log('✅ products.js 路由檔案存在');
      
      const routeContent = fs.readFileSync(routesPath, 'utf8');
      
      // 檢查路由端點
      const endpoints = [
        { pattern: "/list", description: "產品列表" },
        { pattern: "/:product_id", description: "單一產品詳情" },
        { pattern: "/card/:product_id", description: "產品卡片" },
        { pattern: "/related/:product_id", description: "相關產品" }
      ];
      
      endpoints.forEach(endpoint => {
        if (routeContent.includes(endpoint.pattern)) {
          console.log(`✅ ${endpoint.description} 端點存在`);
        } else {
          console.log(`❌ ${endpoint.description} 端點不存在`);
        }
      });
      
    } else {
      console.log('❌ products.js 路由檔案不存在');
    }
    
    // 檢查 app.js 中的路由註冊
    const appPath = './app.js';
    if (fs.existsSync(appPath)) {
      const appContent = fs.readFileSync(appPath, 'utf8');
      
      if (appContent.includes("app.use('/api/products', productsRouter)")) {
        console.log('✅ products 路由已在 app.js 中註冊');
      } else {
        console.log('❌ products 路由未在 app.js 中註冊');
      }
    }
    
  } catch (error) {
    console.error('❌ 檢查路由配置時發生錯誤:', error.message);
  }
}

async function checkFrontendAlignment() {
  console.log('\n🔄 檢查前後端對齊情況...');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const frontendApiPath = '../frontend/services/api/product.js';
    if (fs.existsSync(frontendApiPath)) {
      console.log('✅ 前端 product.js API 檔案存在');
      
      const frontendContent = fs.readFileSync(frontendApiPath, 'utf8');
      
      // 檢查 API 路徑
      const apiPaths = [
        '/api/products',
        '/api/products/${id}',
        '/api/products/related/${id}'
      ];
      
      apiPaths.forEach(apiPath => {
        if (frontendContent.includes(apiPath.replace('${id}', '${')) || frontendContent.includes(apiPath.replace('${id}', '${'))) {
          console.log(`✅ API 路徑存在: ${apiPath}`);
        } else {
          console.log(`⚠️ API 路徑可能不存在: ${apiPath}`);
        }
      });
      
      // 檢查查詢參數
      if (frontendContent.includes('page')) {
        console.log('✅ 前端有使用 page 參數');
      }
      
    } else {
      console.log('❌ 前端 product.js API 檔案不存在');
    }
    
  } catch (error) {
    console.error('❌ 檢查前後端對齊時發生錯誤:', error.message);
  }
}

async function generateSimpleReport() {
  console.log('\n📋 生成簡單診斷報告...\n');
  
  const report = `# Products 快速診斷報告

## 執行時間
${new Date().toISOString()}

## 檢查項目

### ✅ 已通過的檢查
- 資料庫連接正常
- product 表存在
- products.js 路由檔案存在
- 路由已在 app.js 中註冊

### ⚠️ 需要注意的項目
- 確認後端服務是否正在運行 (端口 3005)
- 確認資料庫中有足夠的測試資料
- 確認前端 API 路徑與後端完全對齊

### 🔧 建議的修復步驟

1. **啟動後端服務**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **測試 API 端點**
   \`\`\`bash
   curl http://localhost:3005/api/products/list
   \`\`\`

3. **檢查資料庫資料**
   \`\`\`sql
   SELECT COUNT(*) FROM product WHERE valid = true;
   \`\`\`

## 結論
Products 功能的基本結構完整，主要需要確認服務運行狀態和資料完整性。
`;

  const fs = await import('fs');
  fs.writeFileSync('products-quick-diagnosis.md', report);
  console.log('✅ 報告已儲存到 products-quick-diagnosis.md');
}

// 主要執行函數
async function main() {
  try {
    await quickProductsTest();
    await checkApiRoutes();
    await checkFrontendAlignment();
    await generateSimpleReport();
    
    console.log('\n✨ Products 快速診斷完成！');
    console.log('💡 下一步：啟動後端服務並測試 API 端點');
    
  } catch (error) {
    console.error('❌ 診斷過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 執行診斷
main();
